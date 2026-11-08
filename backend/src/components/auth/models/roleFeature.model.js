const { sql } = require('../../../shared/config/database');
const BaseModel = require('../../../shared/models/BaseModel');

class RoleFeature extends BaseModel {
  static TABLE = 'dbo.RoleFeatures';

  static COLUMNS = Object.freeze({
    roleId:    { type: sql.Int, pk: true },
    featureId: { type: sql.Int, pk: true },
  });
}

module.exports = RoleFeature;

