const { createHash } = require('node:crypto');
const AppError = require('../../../shared/utils/AppError');
const Promotion = require('../models/promotion.model');
const repo = require('../repositories/promotion.repository');
const products = require('../../manage-product/repositories/product.repository');
const categories = require('../../manage-product/repositories/category.repository');

function fail(status, message, details, code = 'PROMOTION_ERROR') {
  throw new AppError({ status, code, message }, details);
}
function id(value) {
  if (!['string','number'].includes(typeof value) || !/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) fail(400, 'Invalid ID');
  return Number(value);
}
function validate(data, now = new Date()) {
  const errors = {};
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail(400, 'Invalid promotion data');
  if (data.mode !== undefined && !['draft','publish'].includes(data.mode)) errors.mode = 'Invalid mode';
  const draft = data.mode === 'draft';
  const result = { status: draft ? 'Draft' : 'Active' };
  if (data.name != null && typeof data.name !== 'string') errors.name = 'Invalid name';
  result.name = typeof data.name === 'string' ? data.name.trim() || null : null;
  if ((!draft && !result.name) || result.name?.length > 255) errors.name = 'Name is required (maximum 255 characters)';
  result.type = data.type === 'Percentage' ? 'Percent' : data.type || null;
  if ((!draft || result.type != null) && !['Percent','Amount'].includes(result.type)) errors.type = 'Select a discount type';
  for (const key of ['value','minInvoiceValue','maxBudget']) {
    const raw = data[key];
    const empty = raw == null || raw === '';
    result[key] = empty ? (key === 'minInvoiceValue' ? 0 : null) : ['string','number'].includes(typeof raw) ? Number(raw) : NaN;
    if (!empty && (!['string','number'].includes(typeof raw) || !Number.isFinite(result[key]) || result[key] < 0 || result[key] > 9999999999999.99 || Math.abs(result[key] * 100 - Math.round(result[key] * 100)) > 0.001)) errors[key] = 'Invalid amount (maximum 2 decimals)';
  }
  if ((!draft && result.value == null) || errors.value || (result.type === 'Percent' && result.value > 100)) errors.value = 'Invalid discount value';
  if (result.maxBudget === 0) errors.maxBudget = 'Maximum budget must be greater than 0';
  for (const key of ['startDate','endDate']) {
    const raw = data[key];
    result[key] = raw == null || raw === '' ? null : typeof raw === 'string' ? new Date(raw) : new Date(NaN);
    const calendarDay = typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(raw) ? new Date(`${raw.slice(0,10)}T00:00:00Z`) : null;
    const validDay = calendarDay && Number.isFinite(calendarDay.getTime()) && calendarDay.toISOString().slice(0,10) === raw.slice(0,10);
    // API accepts explicit offsets only; no dependency on browser or server local timezone.
    if ((!draft && !result[key]) || (result[key] && (!validDay || !/(Z|[+-]\d{2}:\d{2})$/.test(raw) || !Number.isFinite(result[key].getTime())))) errors[key] = 'Invalid time';
  }
  if (result.startDate && result.startDate < now) errors.startDate = 'Invalid time';
  if (result.endDate && result.startDate && result.endDate < result.startDate) errors.endDate = 'Invalid time';
  if (Object.keys(errors).length) fail(400, 'Please check the highlighted fields', errors, 'VALIDATION_FAILED');
  return new Promotion(result);
}
async function required(promotionId, tx) {
  const promotion = await repo.findById(id(promotionId), tx);
  if (!promotion || promotion.isDeleted()) fail(404, 'Promotion not found');
  return promotion;
}
async function createPromotion(data, requestKey) {
  if (typeof requestKey !== 'string' || !/^[\w:-]{8,100}$/.test(requestKey)) fail(400, 'A valid Idempotency-Key is required');
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail(400, 'Invalid promotion data');
  const hash = createHash('sha256').update(JSON.stringify(data)).digest('hex');
  return repo.transaction(async (tx) => {
    const previous = await repo.findByRequestKey(requestKey, tx);
    if (previous) {
      if (previous.requestHash !== hash || previous.isDeleted()) fail(409, 'This request key was already used. Start a new submission.');
      return previous;
    }
    const promotion = validate(data);
    promotion.createdAt = new Date();
    promotion.requestKey = requestKey;
    promotion.requestHash = hash;
    return repo.save(promotion, tx);
  });
}
async function updateDraft(promotionId, data) {
  return repo.transaction(async (tx) => {
    const current = await required(promotionId, tx);
    if (current.status !== 'Draft') {
      // A successful publish may have lost its HTTP response. Return the same persisted
      // result for an identical retry, even if its start time has since passed.
      if (current.status === 'Active' && data?.mode !== 'draft') {
        const candidate = validate(data, new Date(0));
        const fields = ['name','type','value','minInvoiceValue','maxBudget','startDate','endDate'];
        if (fields.every((key) => key.endsWith('Date')
          ? current[key]?.getTime() === candidate[key]?.getTime()
          : current[key] === candidate[key])) return current;
      }
      fail(409, 'Only drafts can be edited here');
    }
    const promotion = validate(data);
    Object.assign(promotion, { id: current.id, createdAt: current.createdAt, requestKey: current.requestKey, requestHash: current.requestHash });
    return repo.save(promotion, tx);
  });
}
async function detail(promotionId, tx) {
  const promotion = await required(promotionId, tx);
  const targets = await repo.findPromotionTargets(promotion.id, tx);
  const catalog = await products.findPromotionCandidates(tx);
  const activeCategories = await categories.findActiveOptions(tx);
  const exclusions = await repo.findExclusions(tx);
  const excluded = (productId) => exclusions.some((e) => Number(e.promotionId) === promotion.id && Number(e.productId) === productId);
  const assignedProducts = catalog.filter((p) => p.canBeAssignedToPromotion() && targets.some((t) => t.productId === p.id ||
    (t.categoryId === p.categoryId && activeCategories.some((c) => c.id === p.categoryId) && !excluded(p.id)))).map((p) => ({
      ...p.toJSON(), direct: targets.some((t) => t.productId === p.id),
      derived: targets.some((t) => t.categoryId === p.categoryId && !excluded(p.id)),
    }));
  return { promotion, targets, products: catalog, categories: activeCategories, assignedProducts };
}
function selectedTargets(data) {
  const result = [];
  for (const [field, key] of [['productIds','productId'],['categoryIds','categoryId']]) {
    const values = data[field] ?? [];
    if (!Array.isArray(values) || values.length > 1000) fail(400, 'Invalid targets (maximum 1000 per request)');
    for (const value of [...new Set(values.map(id))]) {
      if (key === 'categoryId' && value > 2147483647) fail(400, 'Invalid category ID');
      result.push({ [key]: value, key: `${key}:${value}` });
    }
  }
  if (!result.length) fail(400, 'Please select at least 1 product');
  return result;
}
// Products belong to one category in this schema. Category links always resolve dynamically.
function conflictsFor(targets, catalog, activeCategories, others, exclusions) {
  const conflicts = [];
  for (const target of targets) {
    // Include inactive category members in conflict detection: reactivating one must not create a hidden overlap.
    // Eligibility is still restricted to Selling at checkout and for direct assignments.
    const members = catalog.filter((p) => target.productId === p.id || target.categoryId === p.categoryId);
    for (const { promotion, links } of others) for (const link of links) {
      const matching = members.filter((p) => link.productId === p.id ||
        (link.categoryId === p.categoryId && activeCategories.some((c) => c.id === p.categoryId) &&
          !exclusions.some((e) => Number(e.promotionId) === promotion.id && Number(e.productId) === p.id)));
      // Even empty categories can conflict over future members.
      if (target.categoryId && target.categoryId === link.categoryId && !matching.length) matching.push({ name: `Category ${activeCategories.find((c) => c.id === target.categoryId)?.name}`, id: null });
      for (const product of matching) conflicts.push({ key: `${target.key}:${link.id}:${product.id ?? 'category'}`,
        targetKey: target.key, productId: product.id, productName: product.name,
        promotionId: promotion.id, promotionName: promotion.name, linkId: link.id, categoryId: link.categoryId,
        message: `Product ${product.name} is in promotion ${promotion.name}. Confirm overwrite or keep original?` });
    }
  }
  return conflicts;
}
async function assignProducts(promotionId, data) {
  if (!data || typeof data !== 'object') fail(400, 'Invalid targets');
  const targets = selectedTargets(data);
  if (data.resolution !== undefined && !['overwrite','keep'].includes(data.resolution)) fail(400, 'Invalid overlap resolution');
  return repo.transaction(async (tx) => {
    const view = await detail(promotionId, tx);
    if (!view.promotion.isEditable()) fail(409, 'This promotion has ended');
    if (view.promotion.status === 'Draft') fail(409, 'Publish the draft before assigning products');
    for (const target of targets) {
      if (target.productId && !view.products.some((p) => p.id === target.productId && p.canBeAssignedToPromotion())) fail(400, 'Product is missing or inactive', { productId: target.productId });
      if (target.categoryId && !view.categories.some((c) => c.id === target.categoryId)) fail(400, 'Category is missing or inactive', { categoryId: target.categoryId });
    }
    const overlapping = view.promotion.status === 'Active' ? await repo.findOverlappingPromotions(view.promotion, tx) : [];
    const others = [];
    for (const promotion of overlapping) others.push({ promotion, links: await repo.findPromotionTargets(promotion.id, tx) });
    const conflicts = conflictsFor(targets, view.products, view.categories, others, await repo.findExclusions(tx));
    const acknowledged = Array.isArray(data.conflictKeys) ? data.conflictKeys : [];
    if (conflicts.length && (!data.resolution || conflicts.some((c) => !acknowledged.includes(c.key)))) fail(409, 'Promotion overlap requires confirmation', { conflicts }, 'PROMOTION_OVERLAP');
    const skipped = new Set(data.resolution === 'keep' ? conflicts.map((c) => c.targetKey) : []);
    if (data.resolution === 'overwrite') for (const conflict of conflicts) {
      const target = targets.find((t) => t.key === conflict.targetKey);
      if (conflict.categoryId && target.productId) await repo.excludeProduct(conflict.promotionId, target.productId, tx);
      else await repo.removeTarget(conflict.promotionId, conflict.linkId, tx);
    }
    await repo.savePromotionTargets(view.promotion.id, targets.filter((t) => !skipped.has(t.key)), tx);
    return { ...await detail(promotionId, tx), outcomes: targets.map((t) => ({
      target: t.key,
      targetName: t.productId ? view.products.find((p) => p.id === t.productId).name : view.categories.find((c) => c.id === t.categoryId).name,
      targetType: t.productId ? 'Product' : 'Category',
      result: skipped.has(t.key) ? 'Kept original; not assigned' : 'Assigned',
    })) };
  });
}
async function removeTarget(promotionId, targetId) {
  return repo.transaction(async (tx) => {
    const promotion = await required(promotionId, tx);
    const targets = await repo.findPromotionTargets(promotion.id, tx);
    const target = targets.find((t) => t.id === id(targetId));
    if (!target) fail(404, 'Assignment not found. Category-derived products must be removed through their category link.');
    await repo.removeTarget(promotion.id, target.id, tx);
    return detail(promotion.id, tx);
  });
}
async function deletePromotion(promotionId) {
  return repo.transaction(async (tx) => {
    const promotion = await required(promotionId, tx);
    if (!promotion.canBeDeleted()) fail(409, 'Cannot delete an ongoing promotion. Please stop it first');
    const usage = await repo.invoiceUsage(promotion.id, tx);
    const soft = usage.referencesCount > 0;
    await repo.deleteOrHide(promotion.id, soft, tx);
    return { id: promotion.id, deletion: soft ? 'soft' : 'hard', reason: usage.paidCount > 0 ? 'Paid invoice history preserved' : soft ? 'Other invoice references preserved' : 'No invoice references' };
  });
}
// Sales consumes this on every new checkout request; never recalculates historical invoices.
async function findApplicablePromotions(productId, invoiceValue, variantId) {
  id(productId);
  if (variantId != null) id(variantId);
  if (typeof invoiceValue !== 'number' || !Number.isFinite(invoiceValue) || invoiceValue < 0) fail(400, 'Invalid invoice value');
  return repo.transaction(async (tx) => {
  const product = (await products.findPromotionCandidates(tx)).find((p) => p.id === id(productId));
  if (!product?.canBeAssignedToPromotion()) return [];
  const activeCategories = await categories.findActiveOptions(tx);
  const exclusions = await repo.findExclusions(tx);
  const result = [];
  for (const promotion of await repo.findAll(tx)) {
    if (!promotion.isRunning() || promotion.minInvoiceValue > invoiceValue) continue;
    const links = await repo.findPromotionTargets(promotion.id, tx);
    if (links.some((t) => (t.productId === product.id && (t.variantId == null || t.variantId === Number(variantId))) ||
      (t.categoryId === product.categoryId && activeCategories.some((c) => c.id === product.categoryId) &&
        !exclusions.some((e) => Number(e.promotionId) === promotion.id && Number(e.productId) === product.id)))) result.push(promotion);
  }
  return result;
  });
}
module.exports = { validate, id, conflictsFor, createPromotion, updateDraft, assignProducts, deletePromotion,
  removeTarget, getDetail: (promotionId) => repo.transaction((tx) => detail(promotionId, tx)),
  loadPromotions: () => repo.findAll(), findApplicablePromotions };

