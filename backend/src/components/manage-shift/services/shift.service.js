// Owner: HiepND | UC75
// Theo mẫu 5 bước:
// lấy model -> hỏi model -> đổi qua model -> lưu qua repository -> trả model.
const AppError = require('../../../shared/utils/AppError');
const { normalizeTime } = require('../../../shared/utils/date');
const { SHIFT_ERRORS } = require('../constants/shift.errors');
const Shift = require('../models/shift.model');
const shiftRepository = require('../repositories/shift.repository');

/**
 * Lấy danh sách ca làm việc phục vụ màn hình UC75 & UC81.
 */
async function listShifts(query = {}) {
  const activeOnly = query.activeOnly === 'true' || query.activeOnly === true;
  const shifts = await shiftRepository.findAll({ activeOnly });
  return shifts.map((s) => s.toJSON());
}

/**
 * Tạo mới ShiftDefinition (UC75).
 * Ràng buộc:
 * - Tên bắt buộc, trim, tối đa 50 ký tự, không được trùng (case-insensitive)
 * - startTime, endTime bắt buộc định dạng time hợp lệ
 * - BR-76: endTime > startTime (không hỗ trợ ca qua đêm nếu đặc tả chưa có)
 * - checkInStart, checkInEnd, checkOutDeadline: optional
 * - isActive mặc định 1 (Active) để sẵn sàng cho UC81 xếp ca
 */
async function createShift(data = {}) {
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  if (!name) {
    throw new AppError(SHIFT_ERRORS.NAME_REQUIRED);
  }
  if (name.length > 50) {
    throw new AppError({
      status: 400,
      code: 'NAME_TOO_LONG',
      message: 'Tên ca làm việc không được vượt quá 50 ký tự',
    });
  }

  if (!data.startTime) {
    throw new AppError(SHIFT_ERRORS.START_TIME_REQUIRED);
  }
  if (!data.endTime) {
    throw new AppError(SHIFT_ERRORS.END_TIME_REQUIRED);
  }

  const normalizedStart = normalizeTime(data.startTime);
  const normalizedEnd = normalizeTime(data.endTime);

  const shift = new Shift({
    name,
    startTime: normalizedStart,
    endTime: normalizedEnd,
    checkInStart: data.checkInStart ? normalizeTime(data.checkInStart) : null,
    checkInEnd: data.checkInEnd ? normalizeTime(data.checkInEnd) : null,
    checkOutDeadline: data.checkOutDeadline ? normalizeTime(data.checkOutDeadline) : null,
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
  });

  // BR-76: endTime > startTime
  if (!shift.hasValidTimeRange()) {
    throw new AppError(SHIFT_ERRORS.INVALID_TIME_RANGE);
  }

  // Pre-check duplicate name
  const existing = await shiftRepository.findByName(name);
  if (existing) {
    throw new AppError(SHIFT_ERRORS.DUPLICATE_SHIFT_NAME);
  }

  try {
    const createdShift = await shiftRepository.insert(shift);
    return createdShift.toJSON();
  } catch (err) {
    // Handle SQL throw 50001 (race condition guard in DB)
    const sqlNumber = err && (err.number || (err.originalError && err.originalError.info && err.originalError.info.number));
    if (sqlNumber === 50001 || err.message === 'DUPLICATE_SHIFT_NAME') {
      throw new AppError(SHIFT_ERRORS.DUPLICATE_SHIFT_NAME);
    }
    throw err;
  }
}

module.exports = {
  listShifts,
  createShift,
};
