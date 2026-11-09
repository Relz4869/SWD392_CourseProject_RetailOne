const {test}=require('node:test');
const assert=require('node:assert/strict');
const {once}=require('node:events');
const app=require('../../../app');
const auth=require('../../auth/services/auth.service');
const staff=require('../services/staff.service');
const config=require('../../../shared/config/env');
const {signToken}=require('../../../shared/utils/jwt');
test('UC64/66 HTTP Manager permissions, legacy grants, one-time cache headers and session guards',async t=>{
  const previous=config.jwt.secret;config.jwt.secret='staff-tests-only-secret';t.after(()=>{config.jwt.secret=previous;});
  let locked=false,changeRequired=false;
  t.mock.method(auth,'getActiveAccount',async userId=>({userId,role:userId===1?'Manager':'Cashier',canLogin:()=>!locked,requirePasswordChange:changeRequired}));
  t.mock.method(auth,'getSession',async()=>({user:{userId:1},permissions:[]}));
  t.mock.method(staff,'createStaff',async()=>({staff:{id:10},credentials:{userId:20,username:'test',initialPassword:'test-fixture-only'}}));
  t.mock.method(staff,'changeAccountStatus',async()=>({id:10}));
  t.mock.method(staff,'listStaff',async()=>[]);
  t.mock.method(staff,'getRoles',async()=>[]);
  const server=app.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>new Promise(r=>server.close(r)));
  const base=`http://127.0.0.1:${server.address().port}/api`;
  const token=(userId,permissions)=>signToken({userId,permissions});
  const all=['STAFF_VIEW','STAFF_CREATE','STAFF_CHANGE_STATUS'];
  const send=(path,method,bearer)=>fetch(base+path,{method,headers:{...(bearer?{Authorization:`Bearer ${bearer}`}:{})}});
  for(const [path,method]of [['/staff','GET'],['/staff','POST'],['/staff/roles','GET'],['/staff/10/account-status','PATCH']]){
    assert.equal((await send(path,method)).status,401);
    assert.equal((await send(path,method,token(2,all))).status,403);
    assert.equal((await send(path,method,token(1,[]))).status,403);
  }
  const created=await send('/staff','POST',token(1,all));assert.equal(created.status,201);assert.equal(created.headers.get('cache-control'),'no-store');
  assert.equal((await send('/staff/10/account-status','PATCH',token(1,['STAFF_LOCK']))).status,200);
  const old=token(1,all);locked=true;
  assert.equal((await send('/staff','GET',old)).status,403);
  locked=false;
  assert.equal((await send('/staff','GET',old)).status,200,'Unlock restores access for a still-valid token');
  changeRequired=true;
  const restricted=await send('/staff','GET',token(1,all));assert.equal(restricted.status,403);assert.equal((await restricted.json()).code,'PASSWORD_CHANGE_REQUIRED');
  assert.equal((await send('/auth/me','GET',token(1,all))).status,200);
});
