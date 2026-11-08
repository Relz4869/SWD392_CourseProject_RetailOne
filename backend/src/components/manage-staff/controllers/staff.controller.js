// Owner: MaiCT | UC64, UC66. UC81 adds only the active-staff read endpoint.
const asyncHandler = require('../../../shared/utils/asyncHandler');
const { ok } = require('../../../shared/utils/response');
const staffService = require('../services/staff.service');

const listActive = asyncHandler(async (req, res) => {
  const result = await staffService.listActiveForScheduling();
  return ok(res, result);
});

module.exports = {
  listActive,
  // TODO UC64: create(req, res)
  // TODO UC66: changeStatus(req, res)
};

