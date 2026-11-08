// Owner: MaiCT | UC53, UC54, UC56
// Theo mẫu 5 bước ở mục 3.1 của 00_RULES.md:
// lấy model -> hỏi model -> đổi qua model -> lưu qua repository -> trả model.
const notImplemented = (uc) => { throw new Error(`Not implemented: ${uc}`); };

module.exports = {
  createPromotion: async () => notImplemented('UC53'),
  assignProducts: async () => notImplemented('UC54'),
  deletePromotion: async () => notImplemented('UC56'),
};
