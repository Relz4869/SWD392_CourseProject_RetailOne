// Owner: HiepND | UC81, UC73
// Theo mẫu 5 bước ở mục 3.1 của 00_RULES.md:
// lấy model -> hỏi model -> đổi qua model -> lưu qua repository -> trả model.
const notImplemented = (uc) => { throw new Error(`Not implemented: ${uc}`); };

module.exports = {
  assignSchedule: async () => notImplemented('UC81'),
  checkIn: async () => notImplemented('UC73'),
};
