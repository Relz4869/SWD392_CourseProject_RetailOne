const repository = require('../repositories/cashHandover.repository');
const { withTransaction } = require('../../../shared/config/database');
const AppError = require('../../../shared/utils/AppError');
const { CASH_HANDOVER_ERRORS: E } = require('../constants/cashHandover.errors');

const DENOMINATIONS = Object.freeze([500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000]);
const MAX_MONEY = 9999999999999n;

function assertCashier(user) {
  if (!user || user.role !== 'Cashier' || !user.staffId) throw new AppError(E.CASHIER_ONLY);
}

function assertManager(user) {
  if (!user || user.role !== 'Manager') throw new AppError(E.REPORT_MANAGER_ONLY);
}

function isDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function normalizeCounts(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new AppError(E.COUNT_INVALID);
  const allowed = new Set(DENOMINATIONS.map(String));
  const keys = Object.keys(input);
  if (keys.length !== DENOMINATIONS.length || keys.some((key) => !allowed.has(key))) {
    throw new AppError(E.COUNT_INVALID, { denominationCounts: 'Phải gồm đủ 9 mệnh giá quy định' });
  }
  const normalized = {};
  let total = 0n;
  for (const denomination of DENOMINATIONS) {
    const value = input[String(denomination)];
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new AppError(E.COUNT_INVALID, { [denomination]: 'Số lượng phải là số nguyên không âm' });
    }
    normalized[String(denomination)] = value;
    total += BigInt(denomination) * BigInt(value);
  }
  if (total > MAX_MONEY) throw new AppError(E.COUNT_INVALID, { actualCash: 'Tổng tiền vượt giới hạn lưu trữ' });
  return { counts: normalized, actualCash: total.toString() };
}

function createCashHandoverService(deps = {}) {
  const repo = deps.repository || repository;
  const transaction = deps.withTransaction || withTransaction;

  async function getCurrent(user) {
    assertCashier(user);
    const current = await repo.findCurrent(user.staffId);
    if (!current) throw new AppError(E.ACTIVE_SESSION_REQUIRED);
    if (current.openingCash == null) throw new AppError(E.OPENING_CASH_REQUIRED);
    return { ...current, denominations: DENOMINATIONS };
  }

  async function submitCount(body = {}, user) {
    assertCashier(user);
    if ('override' in body || 'managerId' in body || 'expectedCash' in body || 'systemCash' in body) {
      throw new AppError(E.COUNT_INVALID);
    }
    const { counts, actualCash } = normalizeCounts(body.denominationCounts);
    return transaction(async (tx) => {
      const current = await repo.findCurrent(user.staffId, tx);
      if (!current) throw new AppError(E.ACTIVE_SESSION_REQUIRED);
      if (current.stage === 'COUNTED') throw new AppError(E.COUNT_ALREADY_SEALED);
      const lockResult = await repo.acquireCountLock(current.scheduleId, tx);
      if (lockResult < 0) throw new AppError(E.LOCK_TIMEOUT);
      const result = await repo.insertCount({
        scheduleId: current.scheduleId,
        staffId: user.staffId,
        actualCash,
        denominationCounts: counts,
      }, tx);
      if (result.outcome === 'ALREADY_COUNTED' || result.outcome === 'ALREADY_FINAL') {
        throw new AppError(E.COUNT_ALREADY_SEALED);
      }
      if (result.outcome !== 'OK') throw new AppError(E.ACTIVE_SESSION_REQUIRED);
      return { stage: 'COUNTED', scheduleId: current.scheduleId, countedAt: result.countedAt, actualCash, denominationCounts: counts };
    });
  }

  async function reconciliation(user) {
    assertCashier(user);
    throw new AppError(E.SALES_CONTRACT_UNAVAILABLE);
  }

  async function confirm(body = {}, user) {
    assertCashier(user);
    if (body.override === true || body.managerId != null) throw new AppError(E.CASHIER_ONLY);
    throw new AppError(E.SALES_CONTRACT_UNAVAILABLE);
  }

  async function getReport(filters, user) {
    assertManager(user);
    const fromDate = filters.fromDate;
    const toDate = filters.toDate;
    if (!isDateOnly(fromDate) || !isDateOnly(toDate) || fromDate > toDate) {
      throw new AppError(E.REPORT_FILTER_INVALID);
    }
    const page = Number(filters.page || 1);
    const pageSize = Number(filters.pageSize || 10);
    const staffId = filters.staffId ? Number(filters.staffId) : null;
    if (!Number.isSafeInteger(page) || page < 1
      || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100
      || (staffId !== null && (!Number.isSafeInteger(staffId) || staffId < 1))) {
      throw new AppError(E.REPORT_FILTER_INVALID);
    }
    const result = await repo.findReport({ fromDate, toDate, staffId, page, pageSize });
    return { ...result, totalPages: result.totalItems === 0 ? 0 : Math.ceil(result.totalItems / pageSize) };
  }

  async function getReportDetail(idValue, user) {
    assertManager(user);
    const id = Number(idValue);
    if (!Number.isSafeInteger(id) || id < 1) throw new AppError(E.HANDOVER_NOT_FOUND);
    const detail = await repo.findReportDetail(id);
    if (!detail) throw new AppError(E.HANDOVER_NOT_FOUND);
    return detail;
  }

  return { getCurrent, submitCount, reconciliation, confirm, getReport, getReportDetail };
}

module.exports = { ...createCashHandoverService(), createCashHandoverService, DENOMINATIONS, _private: { normalizeCounts } };
