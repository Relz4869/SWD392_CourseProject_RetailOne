const { request } = require('../../../shared/config/database');
const Category = require('../models/category.model');

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
  // TODO UC39: insert(category, tx)
  findActiveOptions,
};
