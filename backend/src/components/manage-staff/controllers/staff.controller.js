// Owner: MaiCT | UC64, UC66. UC81 adds only the active-staff read endpoint.
const asyncHandler = require('../../../shared/utils/asyncHandler');
const { ok, created } = require('../../../shared/utils/response');
const service = require('../services/staff.service');

const listActive = asyncHandler(async (req, res) => {
  const result = await service.listActiveForScheduling();
  return ok(res, result);
});

module.exports = {
  listActive,
  submitStaffAndAccount: asyncHandler(async (req, res) => {
    const result = await service.createStaff(req.body);
    res.set({ 'Cache-Control': 'no-store', Pragma: 'no-cache' });
    return created(res,result);
  }),
  changeAccountStatus: asyncHandler(async (req, res) => ok(
    res,
    await service.changeAccountStatus(req.params.id, req.body?.isActive, req.user.userId),
  )),
  list: asyncHandler(async (req, res) => ok(res, await service.listStaff())),
  detail: asyncHandler(async (req, res) => ok(res, await service.getStaff(req.params.id))),
  roles: asyncHandler(async (req, res) => ok(res, await service.getRoles())),
};

