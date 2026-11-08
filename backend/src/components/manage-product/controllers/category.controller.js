const asyncHandler = require('../../../shared/utils/asyncHandler');
const { ok } = require('../../../shared/utils/response');
const categoryService = require('../services/category.service');

const notImplemented = (uc) => { throw new Error(`Not implemented: ${uc}`); };

const options = asyncHandler(async (req, res) => {
  const result = await categoryService.getCategoryOptions();
  return ok(res, result);
});

module.exports = {
  create: asyncHandler(async () => notImplemented('UC39')),
  options,
};
