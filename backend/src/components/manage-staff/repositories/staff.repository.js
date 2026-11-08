// Owner: MaiCT | UC64, UC66. UC81 only adds read helpers for active staff.
const { request, sql } = require('../../../shared/config/database');
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

module.exports = {
  findAllActiveForScheduling,
  findByIdForScheduling,
  // TODO UC64: insert(staff, tx)
  // TODO UC66: updateStatus(staffId, status, tx)
};

