// Owner: PhuNT | UC42, UC46, UC48
// Theo mẫu 5 bước ở mục 3.1 của 00_RULES.md:
// lấy model -> hỏi model -> đổi qua model -> lưu qua repository -> trả model.
const AppError = require('../../../shared/utils/AppError');
const { ERRORS } = require('../../../shared/constants/errors');
const ProductListItem = require('../models/productListItem.model');
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

module.exports = {
  createProduct: async () => notImplemented('UC42'),
  updatePrice: async () => notImplemented('UC46'),
  listProducts,
};
