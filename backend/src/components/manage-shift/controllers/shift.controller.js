// Owner: HiepND | UC75
// Chỉ lấy dữ liệu từ req, gọi service, trả res. Không viết SQL, không gọi repository.
const asyncHandler = require('../../../shared/utils/asyncHandler');
const { ok, created } = require('../../../shared/utils/response');
const shiftService = require('../services/shift.service');

const list = asyncHandler(async (req, res) => {
  const result = await shiftService.listShifts(req.query);
  return ok(res, result);
});

const create = asyncHandler(async (req, res) => {
  const result = await shiftService.createShift(req.body);
  return created(res, result);
});

module.exports = {
  list,
  create,
};
