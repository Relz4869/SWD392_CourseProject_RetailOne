const { sql } = require('../../../shared/config/database');
const BaseModel = require('../../../shared/models/BaseModel');

class Feature extends BaseModel {
  static TABLE = 'dbo.Features';

  static COLUMNS = Object.freeze({
    id:          { type: sql.Int, pk: true, identity: true },
    featureKey:  { type: sql.VarChar(100) },
    description: { type: sql.NVarChar(sql.MAX), nullable: true },
  });
}

module.exports = Feature;

