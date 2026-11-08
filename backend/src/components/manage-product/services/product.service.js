// Owner: PhuNT | UC42, UC46, UC48
// Theo mẫu 5 bước ở mục 3.1 của 00_RULES.md:
// lấy model -> hỏi model -> đổi qua model -> lưu qua repository -> trả model.
const AppError = require('../../../shared/utils/AppError');
const { ERRORS } = require('../../../shared/constants/errors');
const { PRODUCT_ERRORS } = require('../constants/product.errors');
const { withTransaction } = require('../../../shared/config/database');
const Product = require('../models/product.model');
const ProductVariant = require('../models/productVariant.model');
const InventoryStock = require('../models/inventoryStock.model');
const ProductSalePriceHistory = require('../models/productSalePriceHistory.model');
const ProductListItem = require('../models/productListItem.model');
const categoryRepository = require('../repositories/category.repository');
const productRepository = require('../repositories/product.repository');

const notImplemented = (uc) => { throw new Error(`Not implemented: ${uc}`); };

function normalizeListQuery(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize, 10) || 20));
  const search = query.search ? String(query.search).trim() : null;
  const categoryId = query.categoryId != null && query.categoryId !== '' ? parseInt(query.categoryId, 10) : null;
  const status = query.status ? String(query.status).trim() : null;
  const sortBy = query.sortBy || 'createdAt';
  const sortDir = (query.sortDir || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

  return {
    page,
    pageSize,
    search: search || null,
    categoryId: Number.isInteger(categoryId) ? categoryId : null,
    status: status || null,
    sortBy,
    sortDir,
  };
}

async function listProducts(query, user) {
  const filters = normalizeListQuery(query);
  const role = user?.role;

  if (!ProductListItem.canSortBy(role, filters.sortBy)) {
    throw new AppError(ERRORS.VALIDATION_FAILED, { sortBy: 'not allowed for this role' });
  }

  if (!ProductListItem.canFilterByStatus(role)) {
    filters.status = null;
  }
  filters.status = ProductListItem.forcedStatus(role) ?? filters.status;

  const { items, totalItems } = await productRepository.findPaged(filters);

  return {
    items: items.map((item) => item.toDTO(role)),
    page: filters.page,
    pageSize: filters.pageSize,
    totalItems,
    totalPages: filters.pageSize > 0 ? Math.ceil(totalItems / filters.pageSize) : 0,
  };
}

async function createProduct(data, user) {
  const code = String(data.code || '').trim().toUpperCase();
  const name = String(data.name || '').trim();
  const baseUnit = String(data.baseUnit || '').trim();
  const salePrice = Number(data.salePrice);
  const barcode = data.barcode ? String(data.barcode).trim() : null;
  const unitType = data.unitType === 'WEIGHT' ? 'WEIGHT' : 'PIECE';
  const minThreshold = data.minThreshold != null && data.minThreshold !== '' ? Number(data.minThreshold) : 0;
  const categoryId = data.categoryId != null && data.categoryId !== '' ? parseInt(data.categoryId, 10) : null;

  // 1. Kiểm tra mã sản phẩm duy nhất
  const codeExists = await productRepository.existsByCode(code);
  if (codeExists) {
    throw new AppError(PRODUCT_ERRORS.PRODUCT_CODE_EXISTS);
  }

  // 2. Kiểm tra mã vạch duy nhất nếu có
  if (barcode) {
    const barcodeExists = await productRepository.existsBarcode(barcode);
    if (barcodeExists) {
      throw new AppError(PRODUCT_ERRORS.BARCODE_EXISTS);
    }
  }

  // 3. Kiểm tra danh mục nếu có
  if (categoryId != null) {
    const category = await categoryRepository.findById(categoryId);
    if (!category) {
      throw new AppError(PRODUCT_ERRORS.CATEGORY_NOT_FOUND);
    }
    if (!category.isActive()) {
      throw new AppError(PRODUCT_ERRORS.CATEGORY_INACTIVE);
    }
  }

  // 4. Lưu 4 bảng trong 1 transaction
  const allowDecimalQuantity = unitType === 'WEIGHT';
  const changedBy = user?.staffId || user?.userId || null;

  const result = await withTransaction(async (tx) => {
    const newProduct = new Product({
      code,
      name,
      categoryId,
      baseUnit,
      allowDecimalQuantity,
      isCombo: false,
      status: Product.STATUS.SELLING,
      imageUrl: null,
    });
    const savedProduct = await productRepository.insertProduct(newProduct, tx);
    const productId = Number(savedProduct.id);

    const newVariant = new ProductVariant({
      productId,
      unitName: baseUnit,
      conversionFactor: 1,
      salePrice,
      barcode,
      unitType,
    });
    const savedVariant = await productRepository.insertVariant(newVariant, tx);
    const variantId = Number(savedVariant.id);

    const newStock = new InventoryStock({
      variantId,
      quantityOnHand: 0,
      minThreshold,
    });
    await productRepository.insertInventoryStock(newStock, tx);

    const newHistory = new ProductSalePriceHistory({
      productId,
      variantId,
      oldSalePrice: null,
      newSalePrice: salePrice,
      changedBy,
      changedAt: new Date(),
    });
    await productRepository.insertPriceHistory(newHistory, tx);

    return {
      id: productId,
      code: savedProduct.code,
      name: savedProduct.name,
      baseVariantId: variantId,
      salePrice: Number(savedVariant.salePrice),
    };
  });

  return result;
}

module.exports = {
  createProduct,
  updatePrice: async () => notImplemented('UC46'),
  listProducts,
};
