// Owner: MaiCT | UC64, UC66
// Theo mẫu 5 bước ở mục 3.1 của 00_RULES.md:
// lấy model -> hỏi model -> đổi qua model -> lưu qua repository -> trả model.
const notImplemented = (uc) => { throw new Error(`Not implemented: ${uc}`); };
const staffRepository = require('../repositories/staff.repository');

async function listActiveForScheduling(tx) {
  const staff = await staffRepository.findAllActiveForScheduling(tx);
  return staff.map((member) => ({
    id: member.id,
    fullName: member.fullName,
    employmentStatus: member.employmentStatus,
  }));
}

async function getForScheduling(staffId, tx) {
  return staffRepository.findByIdForScheduling(staffId, tx);
}

module.exports = {
  listActiveForScheduling,
  getForScheduling,
  createStaff: async () => notImplemented('UC64'),
  changeAccountStatus: async () => notImplemented('UC66'),
};

