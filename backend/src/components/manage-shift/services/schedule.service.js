// Owner: HiepND | UC81, UC73
const AppError = require('../../../shared/utils/AppError');
const { withTransaction } = require('../../../shared/config/database');
const { hoursBetweenTimes, normalizeTime } = require('../../../shared/utils/date');
const staffService = require('../../manage-staff/services/staff.service');
const shiftRepository = require('../repositories/shift.repository');
const scheduleRepository = require('../repositories/schedule.repository');
const WorkSchedule = require('../models/workSchedule.model');
const { SCHEDULE_ERRORS } = require('../constants/schedule.errors');
const { ROLES } = require('../../../shared/constants/roles');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isDateOnly(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function getWeekBounds(workDate) {
  const date = new Date(`${workDate}T00:00:00Z`);
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { from: formatDate(monday), to: formatDate(sunday) };
}

function intervalsOverlap(startA, endA, startB, endB) {
  return normalizeTime(startA) < normalizeTime(endB)
    && normalizeTime(startB) < normalizeTime(endA);
}

function assertCheckInActor(user) {
  if (!user || !user.staffId || ![ROLES.CASHIER, ROLES.WAREHOUSE].includes(user.role)) {
    throw new AppError(SCHEDULE_ERRORS.CHECK_IN_FORBIDDEN);
  }
}

function normalizeOpeningCash(value) {
  const raw = typeof value === 'number' || typeof value === 'string'
    ? String(value).trim()
    : '';
  if (!/^(0|[1-9]\d{0,12})(\.\d{1,2})?$/.test(raw)) {
    throw new AppError(SCHEDULE_ERRORS.OPENING_CASH_INVALID);
  }
  return raw.includes('.') ? raw : `${raw}.00`;
}

function assignmentDto(schedule, staff, shift, weeklyHours) {
  const workDate = typeof schedule.workDate === 'string'
    ? schedule.workDate.slice(0, 10)
    : formatDate(new Date(schedule.workDate));
  const startTime = normalizeTime(shift.startTime);
  const endTime = normalizeTime(shift.endTime);
  return {
    assignmentId: schedule.id,
    staffId: Number(schedule.staffId),
    staffName: staff.fullName,
    shiftId: Number(schedule.shiftId),
    shiftName: shift.name,
    workDate,
    scheduledStartAt: `${workDate}T${startTime}`,
    scheduledEndAt: `${workDate}T${endTime}`,
    startTime,
    endTime,
    status: schedule.status,
    weeklyHours,
  };
}

function listDto(schedule) {
  const workDate = String(schedule.workDate).slice(0, 10);
  const startTime = normalizeTime(schedule.startTime);
  const endTime = normalizeTime(schedule.endTime);
  return {
    assignmentId: schedule.id,
    staffId: Number(schedule.staffId),
    staffName: schedule.staffName,
    shiftId: Number(schedule.shiftId),
    shiftName: schedule.shiftName,
    workDate,
    scheduledStartAt: `${workDate}T${startTime}`,
    scheduledEndAt: `${workDate}T${endTime}`,
    startTime,
    endTime,
    status: schedule.status,
  };
}

function createScheduleService(dependencies = {}) {
  const deps = {
    scheduleRepository: dependencies.scheduleRepository || scheduleRepository,
    shiftRepository: dependencies.shiftRepository || shiftRepository,
    staffService: dependencies.staffService || staffService,
    withTransaction: dependencies.withTransaction || withTransaction,
  };

  async function listSchedules(query = {}) {
    const { from, to } = query;
    if (!isDateOnly(from) || !isDateOnly(to) || from > to) {
      throw new AppError(SCHEDULE_ERRORS.INVALID_RANGE);
    }
    const staffId = query.staffId === undefined ? null : Number(query.staffId);
    if (staffId !== null && (!Number.isSafeInteger(staffId) || staffId <= 0)) {
      throw new AppError(SCHEDULE_ERRORS.STAFF_NOT_FOUND);
    }
    const schedules = await deps.scheduleRepository.findInRange({ from, to, staffId });
    return schedules.map(listDto);
  }

  async function assignSchedule(data = {}, options = {}) {
    const staffId = Number(data.staffId);
    const shiftId = Number(data.shiftId);
    const workDate = data.workDate;
    if (!Number.isSafeInteger(staffId) || staffId <= 0) {
      throw new AppError(SCHEDULE_ERRORS.STAFF_NOT_FOUND);
    }
    if (!Number.isSafeInteger(shiftId) || shiftId <= 0) {
      throw new AppError(SCHEDULE_ERRORS.SHIFT_NOT_FOUND);
    }
    if (!isDateOnly(workDate)) {
      throw new AppError(SCHEDULE_ERRORS.INVALID_DATE);
    }

    return deps.withTransaction(async (tx) => {
      const lockResult = await deps.scheduleRepository.acquireAssignmentLock(staffId, workDate, tx);
      if (lockResult < 0) throw new AppError(SCHEDULE_ERRORS.LOCK_TIMEOUT);

      // mssql permits only one active request per transaction connection.
      const staff = await deps.staffService.getForScheduling(staffId, tx);
      const shift = await deps.shiftRepository.findById(shiftId, tx);
      if (!staff) throw new AppError(SCHEDULE_ERRORS.STAFF_NOT_FOUND);
      if (!staff.isWorking() || staff.accountStatus !== 'active') {
        throw new AppError(SCHEDULE_ERRORS.STAFF_INACTIVE);
      }
      if (!shift) throw new AppError(SCHEDULE_ERRORS.SHIFT_NOT_FOUND);
      if (!shift.isActive) throw new AppError(SCHEDULE_ERRORS.SHIFT_INACTIVE);

      const conflict = await deps.scheduleRepository.findOverlap({
        staffId,
        workDate,
        startTime: normalizeTime(shift.startTime),
        endTime: normalizeTime(shift.endTime),
      }, tx);
      if (conflict) {
        throw new AppError(SCHEDULE_ERRORS.OVERLAP, {
          conflictingAssignmentId: conflict.id,
          staffId,
          staffName: conflict.staffName,
          shiftId: conflict.shiftId,
          shiftName: conflict.shiftName,
          workDate,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
        });
      }

      const week = getWeekBounds(workDate);
      const currentHours = await deps.scheduleRepository.sumScheduledHours(staffId, week.from, week.to, tx);
      const assignmentHours = hoursBetweenTimes(shift.startTime, shift.endTime);
      const afterAssignment = Math.round((currentHours + assignmentHours) * 100) / 100;
      const parsedLimit = Number(options.weeklyHoursLimit);
      const policyConfigured = Number.isFinite(parsedLimit) && parsedLimit > 0;
      const weeklyHours = {
        weekFrom: week.from,
        weekTo: week.to,
        current: currentHours,
        afterAssignment,
        limit: policyConfigured ? parsedLimit : null,
        policyConfigured,
        warning: policyConfigured && afterAssignment > parsedLimit
          ? `Lịch sau khi phân công vượt giới hạn ${parsedLimit} giờ/tuần`
          : null,
      };

      let createdSchedule;
      try {
        createdSchedule = await deps.scheduleRepository.insert(new WorkSchedule({
          staffId,
          shiftId,
          workDate,
          status: WorkSchedule.STATUS.ASSIGNED,
        }), tx);
      } catch (error) {
        const sqlNumber = error && (error.number
          || (error.originalError && error.originalError.info && error.originalError.info.number));
        if (sqlNumber === 2601 || sqlNumber === 2627) {
          throw new AppError(SCHEDULE_ERRORS.OVERLAP);
        }
        throw error;
      }
      return assignmentDto(createdSchedule, staff, shift, weeklyHours);
    });
  }

  async function getMyTodayState(user, options = {}) {
    assertCheckInActor(user);
    const state = await deps.scheduleRepository.findMyTodayState(user.staffId, options.now || null);
    return {
      role: user.role,
      requiresOpeningCash: user.role === ROLES.CASHIER,
      activeSession: state.activeSession,
      pendingShifts: state.pendingShifts,
    };
  }

  async function checkIn(scheduleIdValue, data = {}, user, options = {}) {
    assertCheckInActor(user);
    const scheduleId = Number(scheduleIdValue);
    if (!Number.isSafeInteger(scheduleId) || scheduleId <= 0) {
      throw new AppError(SCHEDULE_ERRORS.SCHEDULE_NOT_FOUND);
    }

    let openingCash = null;
    if (user.role === ROLES.CASHIER) {
      if (data.openingCash === undefined || data.openingCash === null || data.openingCash === '') {
        throw new AppError(SCHEDULE_ERRORS.OPENING_CASH_REQUIRED);
      }
      openingCash = normalizeOpeningCash(data.openingCash);
    } else if (data.openingCash !== undefined && data.openingCash !== null && data.openingCash !== '') {
      throw new AppError(SCHEDULE_ERRORS.OPENING_CASH_NOT_ALLOWED);
    }

    return deps.withTransaction(async (tx) => {
      const lockResult = await deps.scheduleRepository.acquireCheckInLock(scheduleId, tx);
      if (lockResult < 0) throw new AppError(SCHEDULE_ERRORS.LOCK_TIMEOUT);

      const result = await deps.scheduleRepository.checkInAtomic({
        scheduleId,
        staffId: user.staffId,
        openingCash,
        now: options.now || null,
      }, tx);
      switch (result.outcome) {
        case 'OK': return result.session;
        case 'ALREADY_CHECKED_IN': throw new AppError(SCHEDULE_ERRORS.ALREADY_CHECKED_IN);
        case 'ACTIVE_SESSION_EXISTS': throw new AppError(SCHEDULE_ERRORS.ACTIVE_SESSION_EXISTS);
        case 'WINDOW_CLOSED': throw new AppError(SCHEDULE_ERRORS.CHECK_IN_WINDOW_CLOSED);
        default: throw new AppError(SCHEDULE_ERRORS.SCHEDULE_NOT_FOUND);
      }
    });
  }

  async function requireActiveSessionForSales(user) {
    if (!user || user.role !== ROLES.CASHIER || !user.staffId) {
      throw new AppError(SCHEDULE_ERRORS.POS_SHIFT_REQUIRED);
    }
    const session = await deps.scheduleRepository.findActiveSalesSession(user.staffId);
    if (!session) throw new AppError(SCHEDULE_ERRORS.POS_SHIFT_REQUIRED);
    return session;
  }

  return {
    listSchedules,
    assignSchedule,
    getMyTodayState,
    checkIn,
    requireActiveSessionForSales,
  };
}

const service = createScheduleService();

module.exports = {
  ...service,
  createScheduleService,
  _private: {
    isDateOnly,
    getWeekBounds,
    intervalsOverlap,
    assertCheckInActor,
    normalizeOpeningCash,
  },
};

