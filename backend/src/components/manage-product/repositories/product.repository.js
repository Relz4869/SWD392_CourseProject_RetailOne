// Owner: PhuNT | UC42, UC46, UC48
// Luôn trả về instance model qua Model.fromRow(row), không trả row thô.
// Mọi hàm nhận tham số cuối là tx tùy chọn, dùng request(tx).
const { sql, request } = require('../../../shared/config/database');
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

module.exports = {
  // TODO UC42: insert(product, tx)
  // TODO UC46: updatePrice(variant, history, tx)
  findPaged,
};
