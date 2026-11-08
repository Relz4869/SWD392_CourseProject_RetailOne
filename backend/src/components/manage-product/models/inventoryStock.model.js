const { sql } = require('../../../shared/config/database');
const BaseModel = require('../../../shared/models/BaseModel');

class InventoryStock extends BaseModel {
  static TABLE = 'dbo.InventoryStocks';

  static COLUMNS = Object.freeze({
    variantId:      { type: sql.Int, pk: true },
    quantityOnHand: { type: sql.Decimal(15, 3) },
    minThreshold:   { type: sql.Decimal(15, 3) },
  });

  isOutOfStock() {
    return Number(this.quantityOnHand) <= 0;
  }

  /** BR-41 */
  isBelowThreshold() {
    return Number(this.minThreshold) > 0 && Number(this.quantityOnHand) <= Number(this.minThreshold);
  }
}

module.exports = InventoryStock;

