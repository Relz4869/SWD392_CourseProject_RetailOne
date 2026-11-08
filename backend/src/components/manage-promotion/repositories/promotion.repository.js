const { sql, request, withTransaction } = require('../../../shared/config/database');
const Promotion = require('../models/promotion.model');
const PromotionProduct = require('../models/promotionProduct.model');

// DATETIME2 stores Asia/Bangkok wall time, independent of the execution host timezone.
const storeTime = (date) => date == null ? null : new Date(new Date(date).getTime() + 7 * 3600000).toISOString().slice(0, 23);
const projection = `p.id,p.name,p.type,p.value,p.minInvoiceValue,p.maxBudget,p.status,p.requestKey,p.requestHash,
  CONVERT(varchar(33),p.startDate,126) AS startDate, CONVERT(varchar(33),p.endDate,126) AS endDate,
  CONVERT(varchar(33),p.createdAt,126) AS createdAt`;
function hydrate(row) {
  if (!row) return null;
  for (const key of ['startDate', 'endDate', 'createdAt']) {
    if (row[key] != null) row[key] = new Date(`${row[key]}+07:00`);
  }
  return Promotion.fromRow(row);
}
async function query(text, params = {}, tx) {
  const req = await request(tx);
  for (const [key, [type, value]] of Object.entries(params)) req.input(key, type, value);
  return req.query(text);
}
async function transaction(work) {
  return withTransaction(async (tx) => {
    await query(`DECLARE @r int; EXEC @r = sys.sp_getapplock @Resource='RetailOne.Promotions',
      @LockMode='Exclusive', @LockOwner='Transaction', @LockTimeout=10000;
      IF @r < 0 THROW 50001, 'Promotion lock unavailable', 1;`, {}, tx);
    return work(tx);
  });
}
async function findById(id, tx) {
  const result = await query(`SELECT ${projection} FROM dbo.Promotions p WITH (UPDLOCK,HOLDLOCK) WHERE p.id=@id`, { id: [sql.BigInt, id] }, tx);
  return hydrate(result.recordset[0]);
}
async function findAll(tx) {
  const result = await query(`SELECT ${projection} FROM dbo.Promotions p WHERE p.status<>'Deleted' ORDER BY p.id DESC`, {}, tx);
  return result.recordset.map(hydrate);
}
async function findByRequestKey(key, tx) {
  const result = await query(`SELECT ${projection} FROM dbo.Promotions p WHERE requestKey=@key`, { key: [sql.VarChar(100), key] }, tx);
  return hydrate(result.recordset[0]);
}
async function save(promotion, tx) {
  const cols = ['name','type','value','minInvoiceValue','maxBudget','startDate','endDate','status','createdAt','requestKey','requestHash'];
  const params = {};
  for (const key of cols) {
    const isDate = ['startDate','endDate','createdAt'].includes(key);
    params[key] = [isDate ? sql.VarChar(33) : Promotion.COLUMNS[key].type, isDate ? storeTime(promotion[key]) : promotion[key] ?? null];
  }
  const value = (key) => ['startDate','endDate','createdAt'].includes(key) ? `CONVERT(datetime2,@${key},126)` : `@${key}`;
  let id = promotion.id;
  if (id) {
    params.id = [sql.BigInt, id];
    await query(`UPDATE dbo.Promotions SET ${cols.map((key) => `${key}=${value(key)}`).join(',')} WHERE id=@id`, params, tx);
  } else {
    const result = await query(`INSERT dbo.Promotions (${cols.join(',')}) OUTPUT inserted.id VALUES (${cols.map(value).join(',')})`, params, tx);
    id = result.recordset[0].id;
  }
  return findById(id, tx);
}
async function findPromotionTargets(id, tx) {
  const result = await query('SELECT * FROM dbo.PromotionProducts WITH (UPDLOCK,HOLDLOCK) WHERE promotionId=@id', { id: [sql.BigInt, id] }, tx);
  return result.recordset.map((row) => PromotionProduct.fromRow(row));
}
async function findExclusions(tx) {
  const result = await query('SELECT promotionId,productId FROM dbo.PromotionProductExclusions WITH (UPDLOCK,HOLDLOCK)', {}, tx);
  return result.recordset;
}
async function findOverlappingPromotions(promotion, tx) {
  const result = await query(`SELECT ${projection} FROM dbo.Promotions p WITH (UPDLOCK,HOLDLOCK)
    WHERE p.id<>@id AND p.status='Active' AND p.startDate<CONVERT(datetime2,@end,126)
    AND CONVERT(datetime2,@start,126)<p.endDate`, {
    id: [sql.BigInt, promotion.id], start: [sql.VarChar(33), storeTime(promotion.startDate)], end: [sql.VarChar(33), storeTime(promotion.endDate)],
  }, tx);
  return result.recordset.map(hydrate);
}
async function savePromotionTargets(id, targets, tx) {
  for (const target of targets) {
    await query(`IF NOT EXISTS (SELECT 1 FROM dbo.PromotionProducts WHERE promotionId=@id
      AND ((productId=@productId AND variantId IS NULL) OR categoryId=@categoryId))
      INSERT dbo.PromotionProducts(promotionId,productId,categoryId) VALUES (@id,@productId,@categoryId);`, {
      id: [sql.BigInt, id], productId: [sql.BigInt, target.productId ?? null], categoryId: [sql.Int, target.categoryId ?? null],
    }, tx);
    if (target.productId) await query('DELETE dbo.PromotionProductExclusions WHERE promotionId=@id AND productId=@productId', {
      id: [sql.BigInt, id], productId: [sql.BigInt, target.productId],
    }, tx);
    // Explicitly reassigning a category restores its members after conflict resolution.
    if (target.categoryId) await query(`DELETE e FROM dbo.PromotionProductExclusions e
      JOIN dbo.Products p ON p.id=e.productId WHERE e.promotionId=@id AND p.categoryId=@categoryId`, {
      id: [sql.BigInt, id], categoryId: [sql.Int, target.categoryId],
    }, tx);
  }
}
async function removeTarget(id, targetId, tx) {
  await query('DELETE dbo.PromotionProducts WHERE promotionId=@id AND id=@targetId', { id: [sql.BigInt, id], targetId: [sql.Int, targetId] }, tx);
}
async function excludeProduct(id, productId, tx) {
  await query(`IF NOT EXISTS (SELECT 1 FROM dbo.PromotionProductExclusions WHERE promotionId=@id AND productId=@productId)
    INSERT dbo.PromotionProductExclusions(promotionId,productId) VALUES (@id,@productId)`, {
    id: [sql.BigInt, id], productId: [sql.BigInt, productId],
  }, tx);
}
async function invoiceUsage(id, tx) {
  const result = await query(`SELECT COUNT(*) AS referencesCount,
    COALESCE(SUM(CASE WHEN status='PAID' THEN 1 ELSE 0 END),0) AS paidCount
    FROM dbo.Invoices WITH (UPDLOCK,HOLDLOCK) WHERE promotionId=@id`, { id: [sql.BigInt, id] }, tx);
  return result.recordset[0];
}
async function deleteOrHide(id, soft, tx) {
  await query(soft ? "UPDATE dbo.Promotions SET status='Deleted' WHERE id=@id" : 'DELETE dbo.Promotions WHERE id=@id', { id: [sql.BigInt, id] }, tx);
}
module.exports = { transaction, findById, findAll, findByRequestKey, save, findPromotionTargets,
  findExclusions, findOverlappingPromotions, savePromotionTargets, removeTarget, excludeProduct, invoiceUsage, deleteOrHide, storeTime };

