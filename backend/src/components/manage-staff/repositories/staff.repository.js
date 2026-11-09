// Owner: MaiCT | UC64, UC66. UC81 only adds read helpers for active staff.
const { sql, request, withTransaction } = require('../../../shared/config/database');
const Staff = require('../models/staff.model');

async function findAllActiveForScheduling(tx) {
  const req = await request(tx);
  const result = await req.query(`
    SELECT s.id, s.userId, s.fullName, s.phoneNumber, s.email, s.salaryType,
           s.baseSalary, s.employmentStatus, s.idCard, s.resignationDate, s.createdAt
    FROM dbo.Staff s
    JOIN dbo.Users u ON u.id = s.userId
    WHERE s.employmentStatus = 'working'
      AND u.isActive = 'active'
    ORDER BY s.fullName, s.id;
  `);
  return (result.recordset || []).map((row) => Staff.fromRow(row));
}

async function findByIdForScheduling(staffId, tx) {
  const req = await request(tx);
  req.input('staffId', sql.BigInt, staffId);
  const result = await req.query(`
    SELECT s.id, s.userId, s.fullName, s.phoneNumber, s.email, s.salaryType,
           s.baseSalary, s.employmentStatus, s.idCard, s.resignationDate, s.createdAt,
           u.isActive AS accountStatus
    FROM dbo.Staff s
    JOIN dbo.Users u ON u.id = s.userId
    WHERE s.id = @staffId;
  `);
  if (!result.recordset || result.recordset.length === 0) return null;
  const staff = Staff.fromRow(result.recordset[0]);
  staff.accountStatus = result.recordset[0].accountStatus;
  return staff;
}

async function transaction(work) {
  return withTransaction(async (tx) => {
    const req = await request(tx);
    await req.query(`DECLARE @r int; EXEC @r=sys.sp_getapplock @Resource='RetailOne.StaffAccounts',
      @LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000;
      IF @r<0 THROW 50002,'Staff account lock unavailable',1;`);
    return work(tx);
  });
}
async function findById(id, tx) {
  const req = await request(tx);
  req.input('id', sql.BigInt, id);
  return Staff.fromRow((await req.query('SELECT * FROM dbo.Staff WITH (UPDLOCK,HOLDLOCK) WHERE id=@id')).recordset[0]);
}
async function findAll(tx) {
  const req = await request(tx);
  return (await req.query('SELECT * FROM dbo.Staff ORDER BY id DESC')).recordset.map((row) => Staff.fromRow(row));
}
async function existsByPhoneNumber(phoneNumber, tx) {
  const req = await request(tx);
  req.input('phone', sql.VarChar(20), phoneNumber);
  return (await req.query('SELECT TOP 1 id FROM dbo.Staff WITH (UPDLOCK,HOLDLOCK) WHERE phoneNumber=@phone')).recordset.length > 0;
}
async function findDuplicateContacts(data, tx) {
  const req = await request(tx);
  req.input('email', sql.VarChar(100), data.email).input('idCard', sql.VarChar(20), data.idCard);
  const result = await req.query(`SELECT
    (SELECT COUNT(*) FROM dbo.Staff WITH (UPDLOCK,HOLDLOCK) WHERE email=@email) AS emailCount,
    (SELECT COUNT(*) FROM dbo.Staff WITH (UPDLOCK,HOLDLOCK) WHERE idCard=@idCard) AS idCardCount`);
  return result.recordset[0];
}
async function save(staff, tx) {
  const req = await request(tx);
  for (const key of ['userId','fullName','phoneNumber','email','idCard']) req.input(key, Staff.COLUMNS[key].type, staff[key]);
  const result = await req.query(`INSERT dbo.Staff(userId,fullName,phoneNumber,email,idCard)
    OUTPUT inserted.* VALUES(@userId,@fullName,@phoneNumber,@email,@idCard)`);
  return Staff.fromRow(result.recordset[0]);
}
module.exports = {
  transaction,
  findById,
  findAll,
  findAllActiveForScheduling,
  findByIdForScheduling,
  existsByPhoneNumber,
  findDuplicateContacts,
  save,
};

