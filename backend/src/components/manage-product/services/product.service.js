// Owner: PhuNT | UC42, UC46, UC48
// Theo mẫu 5 bước ở mục 3.1 của 00_RULES.md:
// lấy model -> hỏi model -> đổi qua model -> lưu qua repository -> trả model.
const notImplemented = (uc) => { throw new Error(`Not implemented: ${uc}`); };

module.exports = {
  createProduct: async () => notImplemented('UC42'),
  updatePrice: async () => notImplemented('UC46'),
  listProducts: async () => notImplemented('UC48'),
};
