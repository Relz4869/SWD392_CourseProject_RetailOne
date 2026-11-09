const { sql } = require('../../../shared/config/database');
const BaseModel = require('../../../shared/models/BaseModel');

class Category extends BaseModel {
  static TABLE = 'dbo.Categories';

  static COLUMNS = Object.freeze({
    id:       { type: sql.Int, pk: true, identity: true },
    name:     { type: sql.NVarChar(100) },
    parentId: { type: sql.Int, nullable: true },
    status:   { type: sql.Bit },
    imageUrl: { type: sql.NVarChar(500), nullable: true },
  });

  isActive() {
    return this.status === true || this.status === 1;
  }

  isRoot() {
    return this.parentId == null;
  }
}

module.exports = Category;

