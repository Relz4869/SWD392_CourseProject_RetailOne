const { sql, request } = require('../../../shared/config/database');
const Role = require('../models/role.model');
async function findAll(tx) {
  const req = await request(tx);
  const result = await req.query('SELECT id,name,description FROM dbo.Roles ORDER BY id');
  return result.recordset.map((row) => Role.fromRow(row));
}
async function findById(id, tx) {
  const req = await request(tx);
  req.input('id', sql.Int, id);
  const result = await req.query('SELECT id,name,description FROM dbo.Roles WITH (HOLDLOCK) WHERE id=@id');
  return Role.fromRow(result.recordset[0]);
}
module.exports = { findAll, findById };
