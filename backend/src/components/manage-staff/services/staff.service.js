const { randomBytes } = require('node:crypto');
const AppError = require('../../../shared/utils/AppError');
const { hashPassword } = require('../../../shared/utils/password');
const repo = require('../repositories/staff.repository');
const users = require('../../auth/repositories/user.repository');
const roles = require('../../auth/repositories/role.repository');
const Staff = require('../models/staff.model');
const User = require('../../auth/models/user.model');

function fail(status, code, message, details) { throw new AppError({ status, code, message }, details); }
function staffId(value) {
  if (!['number','string'].includes(typeof value) || !/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value)<1) fail(400,'VALIDATION_FAILED','Mã nhân viên không hợp lệ');
  return Number(value);
}
function validate(data) {
  if (!data || typeof data!=='object' || Array.isArray(data)) fail(400,'VALIDATION_FAILED','Dữ liệu nhân viên không hợp lệ');
  const errors = {};
  const text = (key) => typeof data[key]==='string' ? data[key].trim() : '';
  const fullName=text('fullName'),phoneNumber=text('phoneNumber'),idCard=text('idCard'),email=text('email').toLowerCase() || null;
  if (!fullName || fullName.length>100) errors.fullName='Vui lòng nhập họ tên (tối đa 100 ký tự)';
  if (!/^\+?\d+$/.test(phoneNumber) || phoneNumber.length>20) errors.phoneNumber='Số điện thoại chỉ gồm chữ số và dấu + ở đầu, tối đa 20 ký tự';
  if (!/^\d{1,20}$/.test(idCard)) errors.idCard='Số giấy tờ tùy thân là bắt buộc, chỉ gồm chữ số và tối đa 20 ký tự';
  if ((data.email != null && typeof data.email!=='string') || (email && (email.length>100 || !/^[^\s@\u0080-\uFFFF]+@[^\s@\u0080-\uFFFF]+\.[^\s@\u0080-\uFFFF]+$/.test(email)))) errors.email='Địa chỉ email không hợp lệ (tối đa 100 ký tự)';
  if (!['number','string'].includes(typeof data.roleId) || !/^\d+$/.test(String(data.roleId)) || !Number.isInteger(Number(data.roleId)) || Number(data.roleId)<1 || Number(data.roleId)>2147483647) errors.roleId='Vui lòng chọn vai trò hợp lệ';
  if (data.isActive!==undefined && data.isActive!=='active') errors.isActive='Tài khoản mới phải ở trạng thái hoạt động';
  if (Object.keys(errors).length) fail(400,'VALIDATION_FAILED','Vui lòng kiểm tra các trường được đánh dấu',errors);
  return { fullName,phoneNumber,idCard,email,roleId:Number(data.roleId) };
}
async function view(staff, tx) {
  const user=await users.findByStaffId(staff.id,tx);
  const role=user && await roles.findById(user.roleId,tx);
  return { ...staff.toJSON(), account: user ? { userId:user.id,username:user.username,isActive:user.isActive,
    requirePasswordChange:Boolean(user.requirePasswordChange),roleId:user.roleId,role:role?.name } : null };
}
async function createStaff(data) {
  const cleaned=validate(data);
  // Plaintext is only held until a successful one-time response. Never pass it to persistence/logging.
  const initialPassword=randomBytes(18).toString('base64url');
  const passwordHash=await hashPassword(initialPassword);
  try {
    return await repo.transaction(async (tx) => {
      if (!await roles.findById(cleaned.roleId,tx)) fail(400,'VALIDATION_FAILED','Vai trò không tồn tại',{roleId:'Vui lòng chọn vai trò đang có trong hệ thống'});
      if (await repo.existsByPhoneNumber(cleaned.phoneNumber,tx)) fail(409,'DUPLICATE_PHONE','This Phone number already exists',{phoneNumber:'This Phone number already exists'});
      const duplicate=await repo.findDuplicateContacts(cleaned,tx);
      if (duplicate.emailCount) fail(409,'DUPLICATE_EMAIL','Email đã được sử dụng',{email:'Email đã được sử dụng'});
      if (duplicate.idCardCount) fail(409,'DUPLICATE_ID_CARD','Số giấy tờ tùy thân đã được sử dụng',{idCard:'Số giấy tờ tùy thân đã được sử dụng'});
      const user=await users.save(new User({roleId:cleaned.roleId,username:`nv_${randomBytes(12).toString('hex')}`,passwordHash,isActive:'active',requirePasswordChange:true}),tx);
      const staff=await repo.save(new Staff({...cleaned,userId:user.id}),tx);
      return { staff:await view(staff,tx),credentials:{userId:user.id,username:user.username,initialPassword} };
    });
  } catch (error) {
    // DB uniqueness remains authoritative for writers outside this service as well.
    if ([2601,2627].includes(error.number)) {
      const text=error.message || '';
      if (text.includes('UQ_Staff_Phone')) fail(409,'DUPLICATE_PHONE','This Phone number already exists',{phoneNumber:'This Phone number already exists'});
      if (text.includes('UX_Staff_Email')) fail(409,'DUPLICATE_EMAIL','Email đã được sử dụng',{email:'Email đã được sử dụng'});
      if (text.includes('UX_Staff_IdCard')) fail(409,'DUPLICATE_ID_CARD','Số giấy tờ tùy thân đã được sử dụng',{idCard:'Số giấy tờ tùy thân đã được sử dụng'});
    }
    throw error;
  }
}
async function changeAccountStatus(targetId,status,currentManagerId) {
  const id=staffId(targetId);
  if (!['active','locked'].includes(status)) fail(400,'VALIDATION_FAILED','Trạng thái tài khoản không hợp lệ');
  return repo.transaction(async tx=>{
    const staff=await repo.findById(id,tx);
    if (!staff) fail(404,'STAFF_NOT_FOUND','Không tìm thấy nhân viên');
    const user=await users.findByStaffId(id,tx);
    if (!user) fail(404,'ACCOUNT_NOT_FOUND','Nhân viên chưa có tài khoản đăng nhập');
    if (status==='locked' && user.id===currentManagerId) fail(409,'SELF_LOCK_DENIED','Action denied. You cannot lock your own account');
    if (status==='active' && !staff.canBeActivated()) fail(409,'PERMANENT_LOCK','Không thể mở tài khoản của nhân viên đã nghỉ việc');
    user.isActive=status;
    await users.updateActiveStatus(user,tx);
    return view(staff,tx);
  });
}
async function listStaff() {
  return repo.transaction(async tx=>{
    const result=[];
    for (const staff of await repo.findAll(tx)) result.push(await view(staff,tx));
    return result;
  });
}
async function getStaff(id) {
  return repo.transaction(async tx=>{
    const staff=await repo.findById(staffId(id),tx);
    if (!staff) fail(404,'STAFF_NOT_FOUND','Không tìm thấy nhân viên');
    return view(staff,tx);
  });
}
module.exports={validate,createStaff,changeAccountStatus,listStaff,getStaff,getRoles:()=>roles.findAll()};

