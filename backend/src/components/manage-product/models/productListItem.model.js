const { sql } = require('../../../shared/config/database');
const BaseModel = require('../../../shared/models/BaseModel');
const { ROLES } = require('../../../shared/constants/roles');

const WAREHOUSE_FIELDS = Object.freeze([
  'id', 'code', 'name', 'category', 'baseUnit',
  'baseVariantId', 'barcode', 'stockInBaseUnit', 'outOfStock', 'status',
]);

const WAREHOUSE_SORTABLE = Object.freeze(['name', 'code', 'createdAt', 'stock']);

class ProductListItem extends BaseModel {
  // Read model, no TABLE

  static FIELDS_BY_ROLE = Object.freeze({
    [ROLES.MANAGER]: Object.freeze([
      'id', 'code', 'name', 'imageUrl', 'category', 'baseUnit',
      'baseVariantId', 'salePrice', 'barcode', 'stockInBaseUnit',
      'outOfStock', 'variantCount', 'status', 'createdAt',
    ]),
    [ROLES.CASHIER]: Object.freeze([
      'id', 'code', 'name', 'category', 'baseUnit',
      'baseVariantId', 'salePrice', 'barcode', 'stockInBaseUnit', 'outOfStock',
    ]),
    [ROLES.WAREHOUSE]: WAREHOUSE_FIELDS,
    Warehouse: WAREHOUSE_FIELDS,
  });

  static SORTABLE_BY_ROLE = Object.freeze({
    [ROLES.MANAGER]: Object.freeze(['name', 'code', 'createdAt', 'salePrice', 'stock']),
    [ROLES.CASHIER]: Object.freeze(['name', 'code', 'createdAt', 'salePrice', 'stock']),
    [ROLES.WAREHOUSE]: WAREHOUSE_SORTABLE,
    Warehouse: WAREHOUSE_SORTABLE,
  });

  static COLUMNS = Object.freeze({
    id:              { type: sql.BigInt, bigint: true },
    code:            { type: sql.VarChar(50) },
    name:            { type: sql.NVarChar(200) },
    imageUrl:        { type: sql.NVarChar(500), nullable: true },
    baseUnit:        { type: sql.NVarChar(20) },
    status:          { type: sql.VarChar(20) },
    createdAt:       { type: sql.DateTime2 },
    categoryId:      { type: sql.Int, nullable: true },
    categoryName:    { type: sql.NVarChar(100), nullable: true },
    baseVariantId:   { type: sql.Int, nullable: true },
    salePrice:       { type: sql.Decimal(15, 2), nullable: true },
    barcode:         { type: sql.VarChar(50), nullable: true },
    stockInBaseUnit: { type: sql.Decimal(15, 3) },
    variantCount:    { type: sql.Int },
  });

  static forcedStatus(role) {
    return role === ROLES.CASHIER ? 'Selling' : null;
  }

  static canFilterByStatus(role) {
    return role === ROLES.MANAGER || role === ROLES.WAREHOUSE || role === 'Warehouse';
  }

  static canSortBy(role, sortBy) {
    const sortable = ProductListItem.SORTABLE_BY_ROLE[role] || [];
    return sortable.includes(sortBy);
  }

  isSellable() {
    return this.status === 'Selling';
  }

  isOutOfStock() {
    return Number(this.stockInBaseUnit) <= 0;
  }

  toDTO(role) {
    const full = {
      id: Number(this.id),
      code: this.code,
      name: this.name,
      imageUrl: this.imageUrl ?? null,
      category: this.categoryId ? { id: Number(this.categoryId), name: this.categoryName } : null,
      baseUnit: this.baseUnit,
      baseVariantId: this.baseVariantId ? Number(this.baseVariantId) : null,
      salePrice: this.salePrice !== null && this.salePrice !== undefined ? Number(this.salePrice) : null,
      barcode: this.barcode ?? null,
      stockInBaseUnit: Number(this.stockInBaseUnit ?? 0),
      outOfStock: this.isOutOfStock(),
      variantCount: Number(this.variantCount ?? 0),
      status: this.status,
      createdAt: this.createdAt,
    };

    const allowed = ProductListItem.FIELDS_BY_ROLE[role] || ProductListItem.FIELDS_BY_ROLE[ROLES.MANAGER];
    const dto = {};
    for (const key of allowed) {
      dto[key] = full[key];
    }
    return dto;
  }
}

module.exports = ProductListItem;
