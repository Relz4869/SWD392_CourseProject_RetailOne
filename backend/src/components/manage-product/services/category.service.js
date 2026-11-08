// Owner: PhuNT | UC39
// Theo mẫu 5 bước ở mục 3.1 của 00_RULES.md:
// lấy model -> hỏi model -> đổi qua model -> lưu qua repository -> trả model.
const categoryRepository = require('../repositories/category.repository');

const notImplemented = (uc) => { throw new Error(`Not implemented: ${uc}`); };

async function getCategoryOptions() {
  const categories = await categoryRepository.findActiveOptions();

  // Build tree with level 0 (root) and level 1 (direct children)
  const roots = [];
  const childrenByParent = new Map();

  for (const cat of categories) {
    if (cat.parentId == null) {
      roots.push(cat);
    } else {
      if (!childrenByParent.has(cat.parentId)) {
        childrenByParent.set(cat.parentId, []);
      }
      childrenByParent.get(cat.parentId).push(cat);
    }
  }

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
    for (const child of children) {
      handledIds.add(child.id);
      options.push({
        id: Number(child.id),
        name: child.name,
        level: 1,
      });
    }
  }

  // Handle any orphan nodes with non-null parentId not found in roots
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
  createCategory: async () => notImplemented('UC39'),
  getCategoryOptions,
};
