const { sql, request, withTransaction } = require('../../../shared/config/database');
const Staff = require('../models/staff.model');

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
module.exports = { transaction, findById, findAll, existsByPhoneNumber, findDuplicateContacts, save };

