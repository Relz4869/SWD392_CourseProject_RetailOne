const { sql } = require('../../../shared/config/database');
const BaseModel = require('../../../shared/models/BaseModel');

class PromotionProduct extends BaseModel {
  static TABLE = 'dbo.PromotionProducts';

  static COLUMNS = Object.freeze({
    id:          { type: sql.Int, pk: true, identity: true },
    promotionId: { type: sql.BigInt, bigint: true },
    productId:   { type: sql.BigInt, nullable: true, bigint: true },
    categoryId:  { type: sql.Int, nullable: true },
    variantId:   { type: sql.Int, nullable: true },
  });

  /** UC54 */
  isProductTarget() {
    return this.productId != null;
  }

  /** UC54 */
  isCategoryTarget() {
    return this.categoryId != null;
  }

  /** UC54: exactly one target kind; variantId only together with a product (CK_PP_Target, CK_PP_Variant) */
  isValidTarget() {
    const hasProduct = this.productId != null;
    const hasCategory = this.categoryId != null;
    const exactlyOneTarget = (hasProduct && !hasCategory) || (!hasProduct && hasCategory);
    const validVariant = this.variantId == null || hasProduct;
    return exactlyOneTarget && validVariant;
  }
}

module.exports = PromotionProduct;

