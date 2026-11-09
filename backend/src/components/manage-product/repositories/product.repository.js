// Owner: PhuNT | UC42, UC46, UC48
// Luôn trả về instance model qua Model.fromRow(row), không trả row thô.
// Mọi hàm nhận tham số cuối là tx tùy chọn, dùng request(tx).
const { sql, request } = require('../../../shared/config/database');
const Product = require('../models/product.model');
const ProductVariant = require('../models/productVariant.model');
const InventoryStock = require('../models/inventoryStock.model');
const ProductSalePriceHistory = require('../models/productSalePriceHistory.model');
const ProductListItem = require('../models/productListItem.model');

const ORDER_BY_MAP = Object.freeze({
  name: 'p.name',
  code: 'p.code',
  createdAt: 'p.createdAt',
  salePrice: 'bv.salePrice',
  stock: 'stockInBaseUnit',
});

function escapeLike(str) {
  return str.replace(/[[%_]/g, '[$&]');
}

async function existsByCode(code, tx) {
  const req = await request(tx);
  req.input('code', sql.VarChar(50), code);
  const result = await req.query(`
    SELECT TOP 1 1 AS found FROM dbo.Products WHERE code = @code;
  `);
  return Boolean(result.recordset && result.recordset.length > 0);
}

async function existsBarcode(barcode, tx) {
  const req = await request(tx);
  req.input('barcode', sql.VarChar(50), barcode);
  const result = await req.query(`
    SELECT TOP 1 1 AS found FROM dbo.ProductVariants WHERE barcode = @barcode;
  `);
  return Boolean(result.recordset && result.recordset.length > 0);
}

async function insertProduct(product, tx) {
  const req = await request(tx);
  req.input('code', sql.VarChar(50), product.code);
  req.input('name', sql.NVarChar(200), product.name);
  req.input('categoryId', sql.Int, product.categoryId ?? null);
  req.input('baseUnit', sql.NVarChar(20), product.baseUnit);
  req.input('allowDecimalQuantity', sql.Bit, product.allowDecimalQuantity ? 1 : 0);
  req.input('isCombo', sql.Bit, product.isCombo ? 1 : 0);
  req.input('status', sql.VarChar(20), product.status || 'Selling');
  req.input('imageUrl', sql.NVarChar(500), product.imageUrl ?? null);

  const result = await req.query(`
    INSERT INTO dbo.Products (code, name, categoryId, baseUnit, allowDecimalQuantity, isCombo, status, imageUrl)
    OUTPUT INSERTED.*
    VALUES (@code, @name, @categoryId, @baseUnit, @allowDecimalQuantity, @isCombo, @status, @imageUrl);
  `);

  return Product.fromRow(result.recordset[0]);
}

async function insertVariant(variant, tx) {
  const req = await request(tx);
  req.input('productId', sql.BigInt, variant.productId);
  req.input('unitName', sql.NVarChar(20), variant.unitName);
  req.input('conversionFactor', sql.Int, variant.conversionFactor ?? 1);
  req.input('salePrice', sql.Decimal(15, 2), variant.salePrice);
  req.input('barcode', sql.VarChar(50), variant.barcode || null);
  req.input('unitType', sql.VarChar(20), variant.unitType || 'PIECE');

  const result = await req.query(`
    INSERT INTO dbo.ProductVariants (productId, unitName, conversionFactor, salePrice, barcode, unitType)
    OUTPUT INSERTED.*
    VALUES (@productId, @unitName, @conversionFactor, @salePrice, @barcode, @unitType);
  `);

  return ProductVariant.fromRow(result.recordset[0]);
}

async function insertInventoryStock(stock, tx) {
  const req = await request(tx);
  req.input('variantId', sql.Int, stock.variantId);
  req.input('quantityOnHand', sql.Decimal(15, 3), stock.quantityOnHand ?? 0);
  req.input('minThreshold', sql.Decimal(15, 3), stock.minThreshold ?? 0);

  const result = await req.query(`
    INSERT INTO dbo.InventoryStocks (variantId, quantityOnHand, minThreshold)
    OUTPUT INSERTED.*
    VALUES (@variantId, @quantityOnHand, @minThreshold);
  `);

  return InventoryStock.fromRow(result.recordset[0]);
}

async function insertPriceHistory(history, tx) {
  const req = await request(tx);
  req.input('productId', sql.BigInt, history.productId);
  req.input('variantId', sql.Int, history.variantId);
  req.input('oldSalePrice', sql.Decimal(15, 2), history.oldSalePrice ?? null);
  req.input('newSalePrice', sql.Decimal(15, 2), history.newSalePrice);
  req.input('changedBy', sql.BigInt, history.changedBy ?? null);
  req.input('changedAt', sql.DateTime2, history.changedAt || new Date());

  const result = await req.query(`
    INSERT INTO dbo.ProductSalePriceHistories (productId, variantId, oldSalePrice, newSalePrice, changedBy, changedAt)
    OUTPUT INSERTED.*
    VALUES (@productId, @variantId, @oldSalePrice, @newSalePrice, @changedBy, @changedAt);
  `);

  return ProductSalePriceHistory.fromRow(result.recordset[0]);
}

async function findPaged(filters, tx) {
  const req = await request(tx);

  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const pageSize = Math.max(1, parseInt(filters.pageSize, 10) || 20);
  const offset = (page - 1) * pageSize;

  let search = filters.search ? String(filters.search).trim() : null;
  if (search === '') search = null;

  if (search) {
    req.input('search', sql.NVarChar(100), search);
    req.input('searchLike', sql.NVarChar(200), `%${escapeLike(search)}%`);
  } else {
    req.input('search', sql.NVarChar(100), null);
    req.input('searchLike', sql.NVarChar(200), null);
  }

  if (filters.categoryId != null) {
    req.input('categoryId', sql.Int, filters.categoryId);
  } else {
    req.input('categoryId', sql.Int, null);
  }

  if (filters.status) {
    req.input('status', sql.VarChar(20), filters.status);
  } else {
    req.input('status', sql.VarChar(20), null);
  }

  req.input('offset', sql.Int, offset);
  req.input('pageSize', sql.Int, pageSize);

  const orderCol = ORDER_BY_MAP[filters.sortBy] || 'p.createdAt';
  const orderDir = filters.sortDir === 'asc' ? 'ASC' : 'DESC';
  const orderByClause = `${orderCol} ${orderDir}, p.id DESC`;

  // TODO: tồn kho bán được (BR-55) loại trừ lô EXPIRED/DAMAGED sẽ tính sau khi có component tồn kho
  const query = `
    SELECT
      p.id, p.code, p.name, p.imageUrl, p.baseUnit, p.status, p.createdAt,
      c.id AS categoryId, c.name AS categoryName,
      bv.id AS baseVariantId, bv.salePrice, bv.barcode,
      ISNULL(st.stockInBaseUnit, 0) AS stockInBaseUnit,
      vc.variantCount,
      COUNT(*) OVER () AS totalCount
    FROM dbo.Products p
    LEFT JOIN dbo.Categories c ON c.id = p.categoryId
    OUTER APPLY (
      SELECT TOP 1 v.id, v.salePrice, v.barcode
      FROM dbo.ProductVariants v
      WHERE v.productId = p.id
      ORDER BY v.conversionFactor ASC, v.id ASC
    ) bv
    OUTER APPLY (
      SELECT SUM(s.quantityOnHand * v.conversionFactor) AS stockInBaseUnit
      FROM dbo.ProductVariants v
      JOIN dbo.InventoryStocks s ON s.variantId = v.id
      WHERE v.productId = p.id
    ) st
    OUTER APPLY (
      SELECT COUNT(*) AS variantCount FROM dbo.ProductVariants v WHERE v.productId = p.id
    ) vc
    WHERE (@search IS NULL
           OR p.name LIKE @searchLike
           OR p.code LIKE @searchLike
           OR EXISTS (SELECT 1 FROM dbo.ProductVariants v2 WHERE v2.productId = p.id AND v2.barcode = @search))
      AND (@categoryId IS NULL
           OR p.categoryId = @categoryId
           OR p.categoryId IN (SELECT id FROM dbo.Categories WHERE parentId = @categoryId))
      AND (@status IS NULL OR p.status = @status)
    ORDER BY ${orderByClause}
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
  `;

  const result = await req.query(query);
  const rows = result.recordset || [];
  const totalItems = rows.length > 0 ? Number(rows[0].totalCount) : 0;
  const items = rows.map((r) => ProductListItem.fromRow(r));

  return { items, totalItems };
}

async function findProductById(productId, tx) {
  const req = await request(tx);
  req.input('productId', sql.BigInt, productId);
  const result = await req.query(`
    SELECT TOP 1 * FROM dbo.Products WHERE id = @productId;
  `);
  if (!result.recordset || result.recordset.length === 0) return null;
  return Product.fromRow(result.recordset[0]);
}

async function findVariantById(variantId, tx) {
  const req = await request(tx);
  req.input('variantId', sql.Int, variantId);
  const result = await req.query(`
    SELECT TOP 1 * FROM dbo.ProductVariants WHERE id = @variantId;
  `);
  if (!result.recordset || result.recordset.length === 0) return null;
  return ProductVariant.fromRow(result.recordset[0]);
}

async function findBaseVariantByProductId(productId, tx) {
  const req = await request(tx);
  req.input('productId', sql.BigInt, productId);
  const result = await req.query(`
    SELECT TOP 1 * FROM dbo.ProductVariants WHERE productId = @productId AND conversionFactor = 1;
  `);
  if (!result.recordset || result.recordset.length === 0) return null;
  return ProductVariant.fromRow(result.recordset[0]);
}

async function findPriceHistoryByVariantId(variantId, limit = 20, tx) {
  const req = await request(tx);
  req.input('variantId', sql.Int, variantId);
  req.input('limit', sql.Int, limit);
  const result = await req.query(`
    SELECT TOP (@limit)
      h.id,
      h.productId,
      h.variantId,
      h.oldSalePrice,
      h.newSalePrice,
      h.changedAt,
      h.changedBy,
      s.fullName AS changedByName
    FROM dbo.ProductSalePriceHistories h
    LEFT JOIN dbo.Staff s ON s.id = h.changedBy
    WHERE h.variantId = @variantId
    ORDER BY h.changedAt DESC, h.id DESC;
  `);
  return (result.recordset || []).map((r) => ({
    oldSalePrice: r.oldSalePrice != null ? Number(r.oldSalePrice) : null,
    newSalePrice: r.newSalePrice != null ? Number(r.newSalePrice) : null,
    changedAt: r.changedAt,
    changedByName: r.changedByName || 'Hệ thống',
  }));
}

async function updateVariantPrice(variantId, salePrice, tx) {
  const req = await request(tx);
  req.input('variantId', sql.Int, variantId);
  req.input('salePrice', sql.Decimal(15, 2), salePrice);
  const result = await req.query(`
    UPDATE dbo.ProductVariants
    SET salePrice = @salePrice
    OUTPUT INSERTED.*
    WHERE id = @variantId;
  `);
  if (!result.recordset || result.recordset.length === 0) return null;
  return ProductVariant.fromRow(result.recordset[0]);
}

async function findStaffNameById(staffId, tx) {
  if (!staffId) return 'Hệ thống';
  const req = await request(tx);
  req.input('staffId', sql.BigInt, staffId);
  const result = await req.query(`
    SELECT TOP 1 fullName FROM dbo.Staff WHERE id = @staffId;
  `);
  if (!result.recordset || result.recordset.length === 0) return 'Quản trị viên';
  return result.recordset[0].fullName || 'Quản trị viên';
}

module.exports = {
  existsByCode,
  existsBarcode,
  insertProduct,
  insertVariant,
  insertInventoryStock,
  insertPriceHistory,
  findPaged,
  findProductById,
  findVariantById,
  findBaseVariantByProductId,
  findPriceHistoryByVariantId,
  updateVariantPrice,
  findStaffNameById,
};
