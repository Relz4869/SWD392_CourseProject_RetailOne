const { sql } = require('../../../shared/config/database');
const BaseModel = require('../../../shared/models/BaseModel');

class Role extends BaseModel {
  static TABLE = 'dbo.Roles';

  static COLUMNS = Object.freeze({
    id:          { type: sql.Int, pk: true, identity: true },
    name:        { type: sql.NVarChar(50) },
    description: { type: sql.NVarChar(sql.MAX), nullable: true },
  });
}

module.exports = Role;
