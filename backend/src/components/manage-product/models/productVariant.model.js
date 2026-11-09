const { sql } = require('../../../shared/config/database');
const BaseModel = require('../../../shared/models/BaseModel');
const ProductSalePriceHistory = require('./productSalePriceHistory.model');

class ProductVariant extends BaseModel {
  static TABLE = 'dbo.ProductVariants';

  static UNIT_TYPE = Object.freeze({ PIECE: 'PIECE', WEIGHT: 'WEIGHT' });

  static COLUMNS = Object.freeze({
    id:               { type: sql.Int, pk: true, identity: true },
    productId:        { type: sql.BigInt, bigint: true },
    unitName:         { type: sql.NVarChar(20) },
    conversionFactor: { type: sql.Int },
    salePrice:        { type: sql.Decimal(15, 2) },
    barcode:          { type: sql.VarChar(50), nullable: true },
    unitType:         { type: sql.VarChar(20) },
  });

  isBaseUnit() {
    return this.conversionFactor === 1;
  }

  /** BR-57 */
  hasBarcode() {
    return this.barcode !== null && this.barcode !== undefined && String(this.barcode).trim() !== '';
  }

  toBaseQuantity(qty) {
    return Number(qty) * Number(this.conversionFactor);
  }

  isPriceChange(newPrice) {
    return Number(newPrice) !== Number(this.salePrice);
  }

  /** UC46, BR-64 */
  changePrice(newPrice, changedBy, now = new Date()) {
    if (!this.isPriceChange(newPrice)) {
      throw new Error('changePrice() called when isPriceChange() is false');
    }
    const oldSalePrice = this.salePrice;
    this.salePrice = Number(newPrice);
    return new ProductSalePriceHistory({
      productId: this.productId,
      variantId: this.id,
      oldSalePrice,
      newSalePrice: this.salePrice,
      changedBy,
      changedAt: now,
    });
  }
}

module.exports = ProductVariant;

