// Explicit opt-in SQL integration check. Uses only its own temporary records and removes them afterward.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const db = require('../src/shared/config/database');
const service = require('../src/components/manage-promotion/services/promotion.service');
const repo = require('../src/components/manage-promotion/repositories/promotion.repository');

test('UC53/54/56 real SQL persistence, rollback and invoice-history checks', async (t) => {
  const pool = await db.getPool();
  const suffix = randomUUID().slice(0, 8);
  const promotionIds = [], productIds = [];
  let categoryId;
  const invoiceCode = `UC-PROM-${suffix}`;
  const query = async (text, parameters = {}) => {
    const request = pool.request();
    for (const [key, value] of Object.entries(parameters)) request.input(key, value);
    return (await request.query(text)).recordset;
  };
  t.after(async () => {
    try {
    await db.withTransaction(async (tx) => {
      await new db.sql.Request(tx).input('code', invoiceCode).query('DELETE dbo.Invoices WHERE invoiceCode=@code');
      for (const promotionId of promotionIds) await new db.sql.Request(tx).input('id', db.sql.BigInt, promotionId).query('DELETE dbo.Promotions WHERE id=@id');
      for (const productId of productIds) await new db.sql.Request(tx).input('id', db.sql.BigInt, productId).query('DELETE dbo.Products WHERE id=@id');
      if (categoryId) await new db.sql.Request(tx).input('id', db.sql.Int, categoryId).query('DELETE dbo.Categories WHERE id=@id');
    });
    } finally { await db.closePool(); }
  });
  categoryId = (await query('INSERT dbo.Categories(name,status) OUTPUT inserted.id VALUES (@name,1)', { name: `UC test ${suffix}` }))[0].id;
  const addProduct = async (status = 'Selling') => {
    const rows = await query(`INSERT dbo.Products(code,name,categoryId,baseUnit,status)
      OUTPUT inserted.id VALUES (@code,@name,@categoryId,N'piece',@status)`, {
      code: `UCT-${suffix}-${productIds.length}`, name: `Test tea ${suffix}`, categoryId, status,
    });
    const productId = Number(rows[0].id); productIds.push(productId); return productId;
  };
  const productId = await addProduct();
  const create = async () => {
    const result = await service.createPromotion({ name: `Test offer ${suffix}`, type: 'Percent', value: 10,
      startDate: new Date(Date.now()+3600000).toISOString(), endDate: new Date(Date.now()+7200000).toISOString(), minInvoiceValue: 0 });
    promotionIds.push(result.id); return result;
  };
  let original, replacement;
  await t.test('create, partial draft and draft publishing', async () => {
    const draft = await service.createPromotion({ mode: 'draft' });
    promotionIds.push(draft.id);
    assert.equal((await service.getDetail(draft.id)).promotion.status, 'Draft');
    const publishBody = { name: `Published ${suffix}`, type: 'Amount', value: 0,
      startDate: new Date(Date.now()+3600000).toISOString(), endDate: new Date(Date.now()+7200000).toISOString() };
    const published = await service.updateDraft(draft.id, publishBody);
    assert.equal(published.effectiveStatus(), 'Upcoming');
    assert.equal((await service.updateDraft(draft.id, publishBody)).id, published.id);
    original = await create(); replacement = await create();
  });
  await t.test('category links cover future products; inactive products are rejected', async () => {
    await service.assignProducts(original.id, { categoryIds: [categoryId] });
    const futureProduct = await addProduct();
    const inactive = await addProduct('StopSelling');
    await assert.rejects(service.assignProducts(original.id, { productIds: [inactive] }), /inactive/);
    await query("UPDATE dbo.Promotions SET startDate=DATEADD(hour,-1,CONVERT(datetime2,@now,126)) WHERE id=@id", { id: original.id, now: repo.storeTime(new Date()) });
    assert.deepEqual((await service.findApplicablePromotions(futureProduct, 100)).map((p) => p.id), [original.id]);
    assert.equal((await service.findApplicablePromotions(inactive, 100)).length, 0);
    await assert.rejects(service.deletePromotion(original.id), /Cannot delete an ongoing promotion/);
  });
  let conflictKeys;
  await t.test('overlap warning, Keep original and rollback after an overwrite write failure', async () => {
    try { await service.assignProducts(replacement.id, { productIds: [productId] }); assert.fail('expected overlap'); }
    catch (error) { assert.equal(error.code, 'PROMOTION_OVERLAP'); conflictKeys = error.details.conflicts.map((c) => c.key); }
    const kept = await service.assignProducts(replacement.id, { productIds: [productId], resolution: 'keep', conflictKeys });
    assert.equal(kept.targets.length, 0);
    const failing = t.mock.method(repo, 'savePromotionTargets', async () => { throw new Error('Injected write failure'); });
    try { await assert.rejects(service.assignProducts(replacement.id, { productIds: [productId], resolution: 'overwrite', conflictKeys }), /Injected write failure/); }
    finally { failing.mock.restore(); }
    assert.deepEqual((await service.findApplicablePromotions(productId, 100)).map((p) => p.id), [original.id], 'Exclusion written before failure must roll back');
  });
  await t.test('confirmed overwrite, immediate removal and safe hard deletion', async () => {
    const assigned = await service.assignProducts(replacement.id, { productIds: [productId], resolution: 'overwrite', conflictKeys });
    assert.equal(assigned.targets.length, 1);
    assert.equal((await service.findApplicablePromotions(productId, 100)).length, 0, 'Original is excluded; replacement is still upcoming');
    const removed = await service.removeTarget(replacement.id, assigned.targets[0].id);
    assert.equal(removed.targets.length, 0);
    assert.equal((await service.deletePromotion(replacement.id)).deletion, 'hard');
    await assert.rejects(service.getDetail(replacement.id), (error) => error.status === 404);
  });
  await t.test('reassigning a category restores excluded members, and category overwrite transfers future coverage', async () => {
    const restored = await service.assignProducts(original.id, { categoryIds: [categoryId] });
    assert.equal(restored.assignedProducts.some((p) => p.id === productId), true);
    assert.deepEqual((await service.findApplicablePromotions(productId, 100)).map((p) => p.id), [original.id]);
    const next = await create();
    let keys;
    await assert.rejects(service.assignProducts(next.id, { categoryIds: [categoryId] }), (error) => {
      assert.equal(error.code, 'PROMOTION_OVERLAP');
      keys = error.details.conflicts.map((c) => c.key);
      return true;
    });
    await service.assignProducts(next.id, { categoryIds: [categoryId], resolution: 'overwrite', conflictKeys: keys });
    assert.equal((await service.getDetail(original.id)).targets.some((target) => target.categoryId === categoryId), false);
    assert.equal((await service.getDetail(next.id)).targets.some((target) => target.categoryId === categoryId), true);
    const newProductId = await addProduct();
    assert.equal((await service.getDetail(next.id)).assignedProducts.some((p) => p.id === newProductId), true);
  });
  await t.test('paid invoice triggers soft deletion, hides promotion and preserves amounts', async (subtest) => {
    const refs = await query('SELECT (SELECT TOP 1 id FROM dbo.Staff ORDER BY id) AS staffId, (SELECT TOP 1 id FROM dbo.Counters ORDER BY id) AS counterId');
    if (!refs[0].staffId || !refs[0].counterId) { subtest.skip('Requires one existing Staff and Counter record'); return; }
    await query(`INSERT dbo.Invoices(invoiceCode,staffId,counterId,promotionId,totalAmount,promotionDiscount,finalAmount,status)
      VALUES (@code,@staffId,@counterId,@promotionId,100,10,90,'PAID')`, { code: invoiceCode, staffId: refs[0].staffId, counterId: refs[0].counterId, promotionId: original.id });
    await query("UPDATE dbo.Promotions SET status='Disabled' WHERE id=@id", { id: original.id });
    const before = (await query('SELECT finalAmount,promotionDiscount FROM dbo.Invoices WHERE invoiceCode=@code', { code: invoiceCode }))[0];
    assert.equal((await service.deletePromotion(original.id)).deletion, 'soft');
    const after = (await query('SELECT finalAmount,promotionDiscount FROM dbo.Invoices WHERE invoiceCode=@code', { code: invoiceCode }))[0];
    assert.deepEqual(after, before);
    assert.equal((await service.loadPromotions()).some((p) => p.id === original.id), false);
    assert.equal((await service.findApplicablePromotions(productIds[1], 100)).length, 0);
  });
});
