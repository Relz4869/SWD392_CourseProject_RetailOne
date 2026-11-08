const { sql } = require('../../../shared/config/database');
const BaseModel = require('../../../shared/models/BaseModel');

class Product extends BaseModel {
  static TABLE = 'dbo.Products';

  static STATUS = Object.freeze({
    SELLING: 'Selling',
    STOP_SELLING: 'StopSelling',
    SUSPENDED: 'Suspended',
  });

  static COLUMNS = Object.freeze({
    id:                   { type: sql.BigInt, pk: true, identity: true, bigint: true },
    code:                 { type: sql.VarChar(50) },
    name:                 { type: sql.NVarChar(200) },
    categoryId:           { type: sql.Int, nullable: true },
    baseUnit:             { type: sql.NVarChar(20) },
    allowDecimalQuantity: { type: sql.Bit },
    isCombo:              { type: sql.Bit },
    status:               { type: sql.VarChar(20) },
    createdAt:            { type: sql.DateTime2 },
    updatedAt:            { type: sql.DateTime2 },
    imageUrl:             { type: sql.NVarChar(500), nullable: true },
  });

  /** UC48 */
  isSellable() {
    return this.status === Product.STATUS.SELLING;
  }

  /** UC54 */
  canBeAssignedToPromotion() {
    return this.isSellable();
  }
}

module.exports = Product;
