// Owner: HiepND | UC81, UC73
const asyncHandler = require('../../../shared/utils/asyncHandler');
const { ok, created } = require('../../../shared/utils/response');
const scheduleService = require('../services/schedule.service');

const list = asyncHandler(async (req, res) => {
  const result = await scheduleService.listSchedules(req.query);
  return ok(res, result);
});

const assign = asyncHandler(async (req, res) => {
  const result = await scheduleService.assignSchedule(req.body);
  return created(res, result);
});

const myToday = asyncHandler(async (req, res) => {
  const result = await scheduleService.getMyTodayState(req.user);
  return ok(res, result);
});

const checkIn = asyncHandler(async (req, res) => {
  const result = await scheduleService.checkIn(req.params.id, req.body, req.user);
  return ok(res, result);
});

module.exports = {
  list,
  assign,
  myToday,
  checkIn,
};

