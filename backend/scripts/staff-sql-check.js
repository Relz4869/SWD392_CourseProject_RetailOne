// Opt-in integration tests against the configured development SQL Server.
// Only uniquely identified test records are removed. Credentials never enter test output.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {once}=require('node:events');
const {randomUUID,randomInt}=require('node:crypto');
const db=require('../src/shared/config/database');
const app=require('../src/app');
const service=require('../src/components/manage-staff/services/staff.service');
const repo=require('../src/components/manage-staff/repositories/staff.repository');
const users=require('../src/components/auth/repositories/user.repository');
const roles=require('../src/components/auth/repositories/role.repository');
const {comparePassword}=require('../src/shared/utils/password');
const {signToken}=require('../src/shared/utils/jwt');

test('UC64/66 SQL and HTTP account-security integration',async t=>{
  const pool=await db.getPool();
  const owned=[];let shiftId,server;
  const q=async(text,params={})=>{const request=pool.request();for(const[k,v]of Object.entries(params))request.input(k,v);return(await request.query(text)).recordset;};
  t.after(async()=>{
    try{
      if(server)await new Promise(resolve=>server.close(resolve));
      await db.withTransaction(async tx=>{
        for(const record of owned){
          await new db.sql.Request(tx).input('id',db.sql.BigInt,record.staff.id).query('DELETE dbo.WorkSchedules WHERE staffId=@id; DELETE dbo.Staff WHERE id=@id');
          await new db.sql.Request(tx).input('id',db.sql.Int,record.credentials.userId).query('DELETE dbo.Users WHERE id=@id');
        }
        if(shiftId)await new db.sql.Request(tx).input('id',db.sql.Int,shiftId).query('DELETE dbo.Shifts WHERE id=@id');
      });
    }finally{await db.closePool();}
  });
  const existing=(await q(`SELECT TOP 1 u.id,s.id AS staffId FROM dbo.Users u JOIN dbo.Staff s ON s.userId=u.id
    JOIN dbo.Roles r ON r.id=u.roleId WHERE r.name='Manager' AND u.isActive='active'
    AND u.requirePasswordChange=0 AND s.employmentStatus='working' ORDER BY u.id`))[0];
  assert.ok(existing,'Requires an existing active Manager who has completed password change');
  const manager=await users.findLoginAccountById(existing.id);
  const permissionKeys=await users.findPermissionKeysByRoleId(manager.roleId);
  const managerToken=signToken({...manager.toTokenPayload(),permissions:permissionKeys});
  const cashierRole=(await roles.findAll()).find(role=>role.name==='Cashier');assert.ok(cashierRole);
  server=app.listen(0,'127.0.0.1');await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}/api`;
  const send=async(path,method='GET',token=managerToken,body)=>{
    const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
    return {status:response.status,headers:response.headers,body:await response.json()};
  };
  const unique=()=>`${Date.now()}${randomInt(1000,9999)}`;
  const input=()=>{const suffix=unique();return{fullName:`SQL Staff ${randomUUID()}`,phoneNumber:`8${suffix}`,idCard:`7${suffix}`,email:`staff-${randomUUID()}@example.invalid`,roleId:cashierRole.id};};
  const original=input();let created,firstToken,currentToken;const changedPassword=`Secure-${randomUUID()}`;
  await t.test('Manager creates linked active account; hash only; one-time response not cached or exposed in GET',async()=>{
    const result=await send('/staff','POST',managerToken,original);
    assert.equal(result.status,201);assert.equal(result.headers.get('cache-control'),'no-store');
    created=result.body.data;owned.push(created);
    assert.equal(created.staff.account.isActive,'active');assert.equal(created.staff.account.requirePasswordChange,true);
    assert.equal(created.staff.userId,created.credentials.userId);
    const account=await users.findLoginAccountById(created.credentials.userId);
    assert.equal(await comparePassword(created.credentials.initialPassword,account.passwordHash),true);
    assert.ok(account.passwordHash!==created.credentials.initialPassword,'Database must store a hash');
    const detail=await send(`/staff/${created.staff.id}`);
    assert.equal(detail.status,200);assert.equal(detail.body.data.credentials,undefined);
    assert.equal(detail.body.data.account.passwordHash,undefined);
    assert.equal(JSON.stringify(detail.body).includes(created.credentials.initialPassword),false);
    assert.equal(JSON.stringify(detail.body).includes(account.passwordHash),false);
  });
  await t.test('duplicate phone/email/ID, invalid fields and unknown role create no extra account',async()=>{
    let result=await send('/staff','POST',managerToken,{...input(),phoneNumber:original.phoneNumber});
    assert.equal(result.status,409);assert.equal(result.body.message,'This Phone number already exists');
    assert.equal((await send('/staff','POST',managerToken,{...input(),email:original.email})).body.code,'DUPLICATE_EMAIL');
    assert.equal((await send('/staff','POST',managerToken,{...input(),idCard:original.idCard})).body.code,'DUPLICATE_ID_CARD');
    for(const invalid of [{fullName:''},{phoneNumber:''},{idCard:'ABC'},{roleId:2147483647}]){
      result=await send('/staff','POST',managerToken,{...input(),...invalid});assert.equal(result.status,400);assert.equal(result.body.data,undefined);
    }
  });
  await t.test('failed Staff insert rolls back the already inserted User and returns no credentials',async sub=>{
    let insertedId;const originalSave=users.save;
    sub.mock.method(users,'save',async(user,tx)=>{const saved=await originalSave(user,tx);insertedId=saved.id;return saved;});
    sub.mock.method(repo,'save',async()=>{throw new Error('Injected Staff insert failure');});
    await assert.rejects(service.createStaff(input()),/Injected Staff insert failure/);
    assert.ok(insertedId);assert.equal((await q('SELECT id FROM dbo.Users WHERE id=@id',{id:insertedId})).length,0);
  });
  await t.test('first login is restricted; change password revokes bootstrap token and enables ordinary APIs',async()=>{
    const login=await send('/auth/login','POST',null,{username:created.credentials.username,password:created.credentials.initialPassword});
    assert.equal(login.status,200);assert.equal(login.body.data.user.requirePasswordChange,true);firstToken=login.body.data.token;
    assert.equal((await send('/auth/me','GET',firstToken)).status,200);
    const blocked=await send('/products','GET',firstToken);assert.equal(blocked.status,403);assert.equal(blocked.body.code,'PASSWORD_CHANGE_REQUIRED');
    assert.equal((await send('/auth/change-password','POST',firstToken,{currentPassword:'wrong',newPassword:changedPassword})).status,400);
    const changed=await send('/auth/change-password','POST',firstToken,{currentPassword:created.credentials.initialPassword,newPassword:changedPassword});
    assert.equal(changed.status,200);assert.equal(changed.body.data.user.requirePasswordChange,false);currentToken=changed.body.data.token;
    assert.equal((await send('/products','GET',firstToken)).status,401);
    assert.equal((await send('/products','GET',currentToken)).status,200);
    assert.equal((await send('/auth/login','POST',null,{username:created.credentials.username,password:created.credentials.initialPassword})).status,401);
  });
  await t.test('lock revokes live access; unlock keeps old tokens revoked and preserves employment and future shift',async()=>{
    shiftId=(await q("INSERT dbo.Shifts(name,startTime,endTime) OUTPUT inserted.id VALUES(@name,'08:00','16:00')",{name:`Staff test ${randomUUID().slice(0,8)}`}))[0].id;
    await q("INSERT dbo.WorkSchedules(staffId,shiftId,workDate) VALUES(@id,@shift,'2099-01-01')",{id:created.staff.id,shift:shiftId});
    const before=(await q('SELECT employmentStatus FROM dbo.Staff WHERE id=@id',{id:created.staff.id}))[0].employmentStatus;
    const locked=await send(`/staff/${created.staff.id}/account-status`,'PATCH',managerToken,{isActive:'locked'});
    assert.equal(locked.status,200);assert.equal(locked.body.data.account.isActive,'locked');
    assert.equal((await send('/products','GET',currentToken)).status,403);
    assert.equal((await send('/auth/login','POST',null,{username:created.credentials.username,password:changedPassword})).status,403);
    assert.equal((await send(`/staff/${created.staff.id}/account-status`,'PATCH',managerToken,{isActive:'active'})).status,200);
    assert.equal((await send('/products','GET',currentToken)).status,401,'Revoked token must remain invalid after unlock');
    const again=await send('/auth/login','POST',null,{username:created.credentials.username,password:changedPassword});assert.equal(again.status,200);currentToken=again.body.data.token;
    assert.equal((await send('/products','GET',currentToken)).status,200);
    assert.equal((await q('SELECT employmentStatus FROM dbo.Staff WHERE id=@id',{id:created.staff.id}))[0].employmentStatus,before);
    assert.equal((await q('SELECT id FROM dbo.WorkSchedules WHERE staffId=@id AND shiftId=@shift',{id:created.staff.id,shift:shiftId})).length,1);
  });
  await t.test('self-lock, unauthorized requests and unknown target are rejected',async()=>{
    const self=await send(`/staff/${existing.staffId}/account-status`,'PATCH',managerToken,{isActive:'locked',currentManagerId:created.credentials.userId});
    assert.equal(self.status,409);assert.equal(self.body.message,'Action denied. You cannot lock your own account');
    assert.equal((await send('/staff','GET',currentToken)).status,403);
    assert.equal((await send('/staff','POST',currentToken,input())).status,403);
    assert.equal((await send(`/staff/${created.staff.id}/account-status`,'PATCH',currentToken,{isActive:'locked'})).status,403);
    assert.equal((await send('/staff','POST',null,input())).status,401);
    assert.equal((await send('/staff/9007199254740991/account-status','PATCH',managerToken,{isActive:'locked'})).status,404);
  });
  await t.test('status/revocation write failure rolls both back rather than claiming security success',async sub=>{
    const before=await users.findByStaffId(created.staff.id);
    const originalUpdate=users.updateActiveStatus;
    sub.mock.method(users,'updateActiveStatus',async(user,tx)=>{await originalUpdate(user,tx);throw new Error('Injected revocation write failure');});
    await assert.rejects(service.changeAccountStatus(created.staff.id,'locked',existing.id),/Injected revocation write failure/);
    const after=await users.findByStaffId(created.staff.id);assert.equal(after.isActive,before.isActive);assert.equal(after.tokenVersion,before.tokenVersion);
    assert.equal((await send('/products','GET',currentToken)).status,200);
  });
  await t.test('resignation prevents unlocking while keeping future schedules intact',async()=>{
    await send(`/staff/${created.staff.id}/account-status`,'PATCH',managerToken,{isActive:'locked'});
    await q("UPDATE dbo.Staff SET employmentStatus='resigned',resignationDate='2026-01-01' WHERE id=@id",{id:created.staff.id});
    const result=await send(`/staff/${created.staff.id}/account-status`,'PATCH',managerToken,{isActive:'active'});
    assert.equal(result.status,409);assert.equal(result.body.code,'PERMANENT_LOCK');
    assert.equal((await users.findByStaffId(created.staff.id)).isActive,'locked');
    assert.equal((await q('SELECT id FROM dbo.WorkSchedules WHERE staffId=@id',{id:created.staff.id})).length,1);
  });
  await t.test('concurrent duplicate phone submissions yield one account',async()=>{
    const body=input();const a=input();const results=await Promise.allSettled([service.createStaff(body),service.createStaff({...a,phoneNumber:body.phoneNumber})]);
    const successes=results.filter(result=>result.status==='fulfilled');
    for(const result of successes)owned.push(result.value);
    assert.equal(successes.length,1);
    assert.equal(results.filter(result=>result.status==='rejected'&&result.reason.code==='DUPLICATE_PHONE').length,1);
  });
});
