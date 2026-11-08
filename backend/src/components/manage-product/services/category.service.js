// Owner: PhuNT | UC39
// Theo mẫu 5 bước ở mục 3.1 của 00_RULES.md:
// lấy model -> hỏi model -> đổi qua model -> lưu qua repository -> trả model.
const notImplemented = (uc) => { throw new Error(`Not implemented: ${uc}`); };

module.exports = {
  createCategory: async () => notImplemented('UC39'),
  getCategoryOptions: async () => notImplemented('CATEGORY_OPTIONS'),
};
