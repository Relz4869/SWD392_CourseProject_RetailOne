const {test}=require('node:test');
const assert=require('node:assert/strict');
const service=require('./staff.service');
const repo=require('../repositories/staff.repository');
const users=require('../../auth/repositories/user.repository');
const roles=require('../../auth/repositories/role.repository');
const Staff=require('../models/staff.model');
const User=require('../../auth/models/user.model');
const Role=require('../../auth/models/role.model');
const {comparePassword}=require('../../../shared/utils/password');
const valid={fullName:'Test Staff',phoneNumber:'0901234567',idCard:'123456789',roleId:2};
const staff=new Staff({id:10,userId:20,fullName:'Test Staff',phoneNumber:valid.phoneNumber,employmentStatus:'working'});
function fixture(t){
  const tx=Symbol('tx');
  t.mock.method(repo,'transaction',work=>work(tx));
  t.mock.method(repo,'findById',async()=>staff);
  t.mock.method(repo,'existsByPhoneNumber',async()=>false);
  t.mock.method(repo,'findDuplicateContacts',async()=>({emailCount:0,idCardCount:0}));
  t.mock.method(users,'findByStaffId',async()=>new User({id:20,roleId:2,isActive:'active',username:'test'}));
  t.mock.method(roles,'findById',async()=>new Role({id:2,name:'Cashier'}));
  return tx;
}
test('UC64 required fields, ID format, role, optional email and initial Active status validation',()=>{
  for(const data of [{fullName:''},{phoneNumber:''},{idCard:'abc'},{roleId:[]},{email:'invalid'},{isActive:'locked'}]) assert.throws(()=>service.validate({...valid,...data}),e=>e.status===400&&!!e.details);
  assert.equal(service.validate({...valid,email:' TEST@EXAMPLE.COM '}).email,'test@example.com');
  assert.equal(service.validate(valid).email,null);
});
test('UC64 generates different random credentials and stores only a bcrypt hash linked to Staff',async t=>{
  const tx=fixture(t);const hashes=[];
  t.mock.method(users,'save',async(user,transaction)=>{assert.equal(transaction,tx);assert.equal(user.requirePasswordChange,true);assert.equal(user.isActive,'active');hashes.push(user.passwordHash);return new User({...user,id:20});});
  t.mock.method(repo,'save',async(value,transaction)=>{assert.equal(transaction,tx);assert.equal(value.userId,20);return staff;});
  const a=await service.createStaff(valid),b=await service.createStaff(valid);
  assert.ok(a.credentials.initialPassword!==b.credentials.initialPassword,'Each account must receive a different random password');
  assert.ok(a.credentials.initialPassword.length>=24);
  assert.equal(await comparePassword(a.credentials.initialPassword,hashes[0]),true);
  assert.equal(a.staff.passwordHash,undefined);assert.equal(a.staff.idCard,undefined);
  assert.equal(a.staff.account.passwordHash,undefined);assert.equal(a.staff.account.initialPassword,undefined);
});
test('UC64 duplicate phone has exact UC message and prevents any user insert',async t=>{
  fixture(t);repo.existsByPhoneNumber.mock.mockImplementation(async()=>true);
  const save=t.mock.method(users,'save',async()=>assert.fail('must not insert'));
  await assert.rejects(service.createStaff(valid),e=>e.status===409&&e.message==='This Phone number already exists'&&!!e.details.phoneNumber);
  assert.equal(save.mock.callCount(),0);
});
test('UC64 duplicate email/ID and nonexistent role are rejected safely',async t=>{
  fixture(t);
  repo.findDuplicateContacts.mock.mockImplementation(async()=>({emailCount:1,idCardCount:0}));
  await assert.rejects(service.createStaff(valid),e=>e.code==='DUPLICATE_EMAIL');
  repo.findDuplicateContacts.mock.mockImplementation(async()=>({emailCount:0,idCardCount:1}));
  await assert.rejects(service.createStaff(valid),e=>e.code==='DUPLICATE_ID_CARD');
  roles.findById.mock.mockImplementation(async()=>null);
  await assert.rejects(service.createStaff(valid),e=>e.status===400&&!!e.details.roleId);
});
test('UC64 DB failure never returns generated credentials as success',async t=>{
  fixture(t);t.mock.method(users,'save',async()=>new User({id:20}));
  t.mock.method(repo,'save',async()=>{throw new Error('staff insert failed');});
  await assert.rejects(service.createStaff(valid),/staff insert failed/);
});
test('UC66 self-lock is rejected before mutation with exact UC message',async t=>{
  fixture(t);const update=t.mock.method(users,'updateActiveStatus',async()=>assert.fail('must not update'));
  await assert.rejects(service.changeAccountStatus(10,'locked',20),e=>e.status===409&&e.message==='Action denied. You cannot lock your own account');
  assert.equal(update.mock.callCount(),0);
});
test('UC66 lock/unlock preserve Staff employment data and use the atomic user-status/revocation operation',async t=>{
  const tx=fixture(t);
  const update=t.mock.method(users,'updateActiveStatus',async(user,transaction)=>{assert.equal(transaction,tx);assert.ok(['locked','active'].includes(user.isActive));});
  await service.changeAccountStatus(10,'locked',1);await service.changeAccountStatus(10,'active',1);
  assert.equal(update.mock.callCount(),2);assert.equal(staff.employmentStatus,'working');
});
test('UC66 missing staff, invalid status, permanent resignation and update failure',async t=>{
  fixture(t);await assert.rejects(service.changeAccountStatus(10,'unknown',1),e=>e.status===400);
  repo.findById.mock.mockImplementation(async()=>null);
  await assert.rejects(service.changeAccountStatus(10,'locked',1),e=>e.status===404);
  repo.findById.mock.mockImplementation(async()=>new Staff({...staff,employmentStatus:'resigned'}));
  await assert.rejects(service.changeAccountStatus(10,'active',1),e=>e.code==='PERMANENT_LOCK');
  repo.findById.mock.mockImplementation(async()=>staff);
  t.mock.method(users,'updateActiveStatus',async()=>{throw new Error('status write failed');});
  await assert.rejects(service.changeAccountStatus(10,'locked',1),/status write failed/);
});
