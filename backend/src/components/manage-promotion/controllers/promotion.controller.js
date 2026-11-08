const asyncHandler = require('../../../shared/utils/asyncHandler');
const { ok, created } = require('../../../shared/utils/response');
const service = require('../services/promotion.service');
module.exports = {
  loadPromotions: asyncHandler(async (req, res) => ok(res, await service.loadPromotions())),
  getDetail: asyncHandler(async (req, res) => ok(res, await service.getDetail(req.params.id))),
  submitPromotion: asyncHandler(async (req, res) => created(res, await service.createPromotion(req.body, req.get('Idempotency-Key')))),
  updateDraft: asyncHandler(async (req, res) => ok(res, await service.updateDraft(req.params.id, req.body))),
  submitPromotionTargets: asyncHandler(async (req, res) => ok(res, await service.assignProducts(req.params.id, req.body))),
  removeTarget: asyncHandler(async (req, res) => ok(res, await service.removeTarget(req.params.id, req.params.targetId))),
  confirmDeletePromotion: asyncHandler(async (req, res) => ok(res, await service.deletePromotion(req.params.id))),
};

