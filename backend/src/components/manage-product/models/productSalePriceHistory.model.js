const { sql } = require('../../../shared/config/database');
const BaseModel = require('../../../shared/models/BaseModel');

class ProductSalePriceHistory extends BaseModel {
  static TABLE = 'dbo.ProductSalePriceHistories';

  static COLUMNS = Object.freeze({
    id:           { type: sql.Int, pk: true, identity: true },
    productId:    { type: sql.BigInt, bigint: true },
    variantId:    { type: sql.Int },
    oldSalePrice: { type: sql.Decimal(15, 2), nullable: true },
    newSalePrice: { type: sql.Decimal(15, 2), nullable: true },
    changedBy:    { type: sql.BigInt, bigint: true },
    changedAt:    { type: sql.DateTime2 },
  });
}

module.exports = ProductSalePriceHistory;

