// Owner: HiepND | UC75
// Luôn trả về instance model qua Model.fromRow(row), không trả row thô.
// Mọi hàm nhận tham số cuối là tx tùy chọn, dùng request(tx).
const { request, sql } = require('../../../shared/config/database');
const Shift = require('../models/shift.model');

/**
 * Lấy danh sách ca làm việc (phục vụ hiển thị trên trang Quản lý ca UC75 và chọn ca cho UC81).
 * @param {Object} options { activeOnly?: boolean }
 * @param {Object} tx
 */
async function findAll({ activeOnly = false } = {}, tx) {
  const req = await request(tx);
  let query = `
    SELECT id, name,
           CONVERT(VARCHAR(5), startTime, 108) AS startTime,
           CONVERT(VARCHAR(5), endTime, 108) AS endTime,
           CONVERT(VARCHAR(5), checkInStart, 108) AS checkInStart,
           CONVERT(VARCHAR(5), checkInEnd, 108) AS checkInEnd,
           CONVERT(VARCHAR(5), checkOutDeadline, 108) AS checkOutDeadline,
           isActive
    FROM dbo.Shifts
  `;
  if (activeOnly) {
    query += ` WHERE isActive = 1`;
  }
  query += ` ORDER BY startTime ASC, id ASC;`;

  const result = await req.query(query);
  return (result.recordset || []).map((row) => Shift.fromRow(row));
}

/**
 * Tìm ca làm việc theo tên (trim & case-insensitive).
 * @param {string} name
 * @param {Object} tx
 */
async function findByName(name, tx) {
  if (!name) return null;
  const req = await request(tx);
  req.input('name', sql.NVarChar(50), name.trim());
  const result = await req.query(`
    SELECT TOP 1 id, name,
           CONVERT(VARCHAR(5), startTime, 108) AS startTime,
           CONVERT(VARCHAR(5), endTime, 108) AS endTime,
           CONVERT(VARCHAR(5), checkInStart, 108) AS checkInStart,
           CONVERT(VARCHAR(5), checkInEnd, 108) AS checkInEnd,
           CONVERT(VARCHAR(5), checkOutDeadline, 108) AS checkOutDeadline,
           isActive
    FROM dbo.Shifts
    WHERE LOWER(LTRIM(RTRIM(name))) = LOWER(LTRIM(RTRIM(@name)));
  `);
  if (!result.recordset || result.recordset.length === 0) return null;
  return Shift.fromRow(result.recordset[0]);
}

async function findById(id, tx) {
  const req = await request(tx);
  req.input('id', sql.Int, id);
  const result = await req.query(`
    SELECT id, name,
           CONVERT(VARCHAR(8), startTime, 108) AS startTime,
           CONVERT(VARCHAR(8), endTime, 108) AS endTime,
           CONVERT(VARCHAR(8), checkInStart, 108) AS checkInStart,
           CONVERT(VARCHAR(8), checkInEnd, 108) AS checkInEnd,
           CONVERT(VARCHAR(8), checkOutDeadline, 108) AS checkOutDeadline,
           isActive
    FROM dbo.Shifts
    WHERE id = @id;
  `);
  return result.recordset && result.recordset[0]
    ? Shift.fromRow(result.recordset[0])
    : null;
}

/**
 * Thêm ca làm việc mới vào DB (UC75).
 * Sử dụng atomic check-and-insert để chống race-condition duplicate name ngay trong câu lệnh SQL.
 * @param {Shift} shift
 * @param {Object} tx
 */
async function insert(shift, tx) {
  const req = await request(tx);
  req.input('name', sql.NVarChar(50), shift.name.trim());
  req.input('startTime', sql.VarChar(8), shift.startTime);
  req.input('endTime', sql.VarChar(8), shift.endTime);
  req.input('checkInStart', sql.VarChar(8), shift.checkInStart ?? null);
  req.input('checkInEnd', sql.VarChar(8), shift.checkInEnd ?? null);
  req.input('checkOutDeadline', sql.VarChar(8), shift.checkOutDeadline ?? null);
  req.input('isActive', sql.Bit, shift.isActive !== undefined ? (shift.isActive ? 1 : 0) : 1);

  // Atomic INSERT with duplicate guard
  const result = await req.query(`
    IF EXISTS (
      SELECT 1 FROM dbo.Shifts WITH (UPDLOCK, HOLDLOCK)
      WHERE LOWER(LTRIM(RTRIM(name))) = LOWER(LTRIM(RTRIM(@name)))
    )
    BEGIN
      -- Ném lỗi 50001 (custom duplicate error)
      THROW 50001, 'DUPLICATE_SHIFT_NAME', 1;
    END

    INSERT INTO dbo.Shifts (name, startTime, endTime, checkInStart, checkInEnd, checkOutDeadline, isActive)
    OUTPUT INSERTED.id, INSERTED.name,
           CONVERT(VARCHAR(5), INSERTED.startTime, 108) AS startTime,
           CONVERT(VARCHAR(5), INSERTED.endTime, 108) AS endTime,
           CONVERT(VARCHAR(5), INSERTED.checkInStart, 108) AS checkInStart,
           CONVERT(VARCHAR(5), INSERTED.checkInEnd, 108) AS checkInEnd,
           CONVERT(VARCHAR(5), INSERTED.checkOutDeadline, 108) AS checkOutDeadline,
           INSERTED.isActive
    VALUES (
      @name,
      CAST(@startTime AS TIME),
      CAST(@endTime AS TIME),
      CASE WHEN @checkInStart IS NOT NULL THEN CAST(@checkInStart AS TIME) ELSE NULL END,
      CASE WHEN @checkInEnd IS NOT NULL THEN CAST(@checkInEnd AS TIME) ELSE NULL END,
      CASE WHEN @checkOutDeadline IS NOT NULL THEN CAST(@checkOutDeadline AS TIME) ELSE NULL END,
      @isActive
    );
  `);

  if (!result.recordset || result.recordset.length === 0) return null;
  return Shift.fromRow(result.recordset[0]);
}

module.exports = {
  findAll,
  findById,
  findByName,
  insert,
};
