const asyncHandler = require('../../../shared/utils/asyncHandler');
const { ok, created } = require('../../../shared/utils/response');
const service = require('../services/cashHandover.service');

const current = asyncHandler(async (req, res) => ok(res, await service.getCurrent(req.user)));
const count = asyncHandler(async (req, res) => created(res, await service.submitCount(req.body, req.user)));
const reconciliation = asyncHandler(async (req, res) => ok(res, await service.reconciliation(req.user)));
const confirm = asyncHandler(async (req, res) => ok(res, await service.confirm(req.body, req.user)));
const report = asyncHandler(async (req, res) => ok(res, await service.getReport(req.query, req.user)));
const detail = asyncHandler(async (req, res) => ok(res, await service.getReportDetail(req.params.id, req.user)));

module.exports = { current, count, reconciliation, confirm, report, detail };
