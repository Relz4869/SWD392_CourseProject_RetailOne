// Owner: PhuNT | UC39
// Luôn trả về instance model qua Model.fromRow(row), không trả row thô.
// Mọi hàm nhận tham số cuối là tx tùy chọn, dùng request(tx).
const { sql, request } = require('../../../shared/config/database');
const Category = require('../models/category.model');

async function findById(id, tx) {
  const req = await request(tx);
  req.input('id', sql.Int, id);
  const result = await req.query(`
    SELECT id, name, parentId, status, imageUrl
    FROM dbo.Categories
    WHERE id = @id;
  `);
  if (!result.recordset || result.recordset.length === 0) {
    return null;
  }
  return Category.fromRow(result.recordset[0]);
}

async function existsByNameAndParent(name, parentId, tx) {
  const req = await request(tx);
  req.input('name', sql.NVarChar(100), name);
  if (parentId != null) {
    req.input('parentId', sql.Int, parentId);
  } else {
    req.input('parentId', sql.Int, null);
  }

  const result = await req.query(`
    SELECT TOP 1 1 AS found
    FROM dbo.Categories
    WHERE name = @name COLLATE Vietnamese_CI_AI
      AND ((@parentId IS NULL AND parentId IS NULL) OR (parentId = @parentId));
  `);
  return Boolean(result.recordset && result.recordset.length > 0);
}

async function insert(category, tx) {
  const req = await request(tx);
  req.input('name', sql.NVarChar(100), category.name);
  req.input('parentId', sql.Int, category.parentId ?? null);
  req.input('status', sql.Bit, category.status ?? 1);
  req.input('imageUrl', sql.NVarChar(500), category.imageUrl ?? null);

  const result = await req.query(`
    INSERT INTO dbo.Categories (name, parentId, status, imageUrl)
    OUTPUT INSERTED.*
    VALUES (@name, @parentId, @status, @imageUrl);
  `);

  return Category.fromRow(result.recordset[0]);
}

async function findAll(tx) {
  const req = await request(tx);
  const result = await req.query(`
    SELECT id, name, parentId, status, imageUrl
    FROM dbo.Categories
    ORDER BY name;
  `);
  return (result.recordset || []).map((r) => Category.fromRow(r));
}

async function findActiveOptions(tx) {
  const req = await request(tx);
  const result = await req.query(`
    SELECT id, name, parentId, status, imageUrl
    FROM dbo.Categories WITH (HOLDLOCK)
    WHERE status = 1
    ORDER BY name;
  `);
  return (result.recordset || []).map((r) => Category.fromRow(r));
}

module.exports = {
  findById,
  existsByNameAndParent,
  insert,
  findAll,
  findActiveOptions,
};
