// Owner: PhuNT | UC39
// Theo mẫu 5 bước ở mục 3.1 của 00_RULES.md:
// lấy model -> hỏi model -> đổi qua model -> lưu qua repository -> trả model.
const AppError = require('../../../shared/utils/AppError');
const { PRODUCT_ERRORS } = require('../constants/product.errors');
const Category = require('../models/category.model');
const categoryRepository = require('../repositories/category.repository');

async function createCategory({ name, parentId }) {
  const trimmedName = String(name || '').trim();
  const normalizedParentId = parentId != null && parentId !== '' ? parseInt(parentId, 10) : null;

  // 1 & 2. Kiểm tra danh mục cha nếu có
  if (normalizedParentId != null) {
    const parent = await categoryRepository.findById(normalizedParentId);
    if (!parent) {
      throw new AppError(PRODUCT_ERRORS.CATEGORY_NOT_FOUND);
    }
    if (!parent.isActive()) {
      throw new AppError(PRODUCT_ERRORS.CATEGORY_INACTIVE);
    }
    if (!parent.isRoot()) {
      throw new AppError(PRODUCT_ERRORS.CATEGORY_MAX_DEPTH);
    }
  }

  // Kiểm tra trùng tên trong cùng cấp
  const exists = await categoryRepository.existsByNameAndParent(trimmedName, normalizedParentId);
  if (exists) {
    throw new AppError(PRODUCT_ERRORS.CATEGORY_NAME_EXISTS);
  }

  // 3 & 4. Khởi tạo model và lưu qua repository
  const category = new Category({
    name: trimmedName,
    parentId: normalizedParentId,
    status: 1,
    imageUrl: null,
  });

  const savedCategory = await categoryRepository.insert(category);

  // 5. Trả về model
  return savedCategory;
}

async function listCategories() {
  const allCategories = await categoryRepository.findAll();

  // Tách root và nhóm con theo parentId
  const roots = [];
  const childrenByParent = new Map();

  for (const cat of allCategories) {
    if (cat.isRoot()) {
      roots.push(cat);
    } else {
      if (!childrenByParent.has(cat.parentId)) {
        childrenByParent.set(cat.parentId, []);
      }
      childrenByParent.get(cat.parentId).push(cat);
    }
  }

  // Sắp xếp roots theo tên
  roots.sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }));

  const flatList = [];
  const handledIds = new Set();

  for (const root of roots) {
    handledIds.add(root.id);
    const children = childrenByParent.get(root.id) || [];
    children.sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }));

    flatList.push({
      id: Number(root.id),
      name: root.name,
      parentId: null,
      status: root.isActive() ? 1 : 0,
      imageUrl: root.imageUrl || null,
      level: 0,
      childCount: children.length,
    });

    for (const child of children) {
      handledIds.add(child.id);
      flatList.push({
        id: Number(child.id),
        name: child.name,
        parentId: Number(root.id),
        status: child.isActive() ? 1 : 0,
        imageUrl: child.imageUrl || null,
        level: 1,
        childCount: 0,
      });
    }
  }

  // Trường hợp có category con mồ côi (parentId không thuộc root nào)
  for (const cat of allCategories) {
    if (!handledIds.has(cat.id)) {
      flatList.push({
        id: Number(cat.id),
        name: cat.name,
        parentId: cat.parentId ? Number(cat.parentId) : null,
        status: cat.isActive() ? 1 : 0,
        imageUrl: cat.imageUrl || null,
        level: cat.parentId ? 1 : 0,
        childCount: 0,
      });
    }
  }

  return flatList;
}

async function getCategoryOptions() {
  const categories = await categoryRepository.findActiveOptions();

  const roots = [];
  const childrenByParent = new Map();

  for (const cat of categories) {
    if (cat.isRoot()) {
      roots.push(cat);
    } else {
      if (!childrenByParent.has(cat.parentId)) {
        childrenByParent.set(cat.parentId, []);
      }
      childrenByParent.get(cat.parentId).push(cat);
    }
  }

  roots.sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }));

  const options = [];
  const handledIds = new Set();

  for (const root of roots) {
    handledIds.add(root.id);
    options.push({
      id: Number(root.id),
      name: root.name,
      level: 0,
    });

    const children = childrenByParent.get(root.id) || [];
    children.sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }));

    for (const child of children) {
      handledIds.add(child.id);
      options.push({
        id: Number(child.id),
        name: child.name,
        level: 1,
      });
    }
  }

  for (const cat of categories) {
    if (!handledIds.has(cat.id)) {
      options.push({
        id: Number(cat.id),
        name: cat.name,
        level: 0,
      });
    }
  }

  return options;
}

module.exports = {
  createCategory,
  listCategories,
  getCategoryOptions,
};
