const { sql } = require('../../../shared/config/database');
const BaseModel = require('../../../shared/models/BaseModel');
const { toDateString, toTimeString, hoursBetween } = require('../../../shared/utils/date');

class WorkSchedule extends BaseModel {
  static TABLE = 'dbo.WorkSchedules';

  static STATUS = Object.freeze({
    ASSIGNED: 'assigned',
    WORKING: 'working',
    COMPLETED: 'completed',
    ABSENT: 'absent',
    LATE: 'late',
  });

  static ATTENDANCE = Object.freeze({
    ON_TIME: 'OnTime',
    LATE: 'Late',
  });

  static COLUMNS = Object.freeze({
    id:               { type: sql.Int, pk: true, identity: true },
    staffId:          { type: sql.BigInt, bigint: true },
    shiftId:          { type: sql.Int },
    workDate:         { type: sql.Date },
    checkInTime:      { type: sql.DateTime2, nullable: true },
    checkOutTime:     { type: sql.DateTime2, nullable: true },
    workedHours:      { type: sql.Float },
    status:           { type: sql.VarChar(20) },
    note:             { type: sql.NVarChar(sql.MAX), nullable: true },
    attendanceRecord: { type: sql.VarChar(50), nullable: true },
    penaltyAmount:    { type: sql.Decimal(15, 2) },
    openingCash:      { type: sql.Decimal(15, 2), nullable: true },
  });

  isAssigned() {
    return this.status === WorkSchedule.STATUS.ASSIGNED;
  }

  isWorking() {
    return this.status === WorkSchedule.STATUS.WORKING;
  }

  belongsTo(staffId) {
    return Number(this.staffId) === Number(staffId);
  }

  isOnDate(now = new Date()) {
    return toDateString(this.workDate) === toDateString(now);
  }

  /** UC73 */
  canCheckIn(now, shift) {
    return this.isAssigned() && this.isOnDate(now) && shift.isInCheckInWindow(toTimeString(now));
  }

  /** UC73 */
  checkIn(now, shift, openingCash = null) {
    if (!this.canCheckIn(now, shift)) {
      throw new Error('checkIn() called when canCheckIn() is false');
    }
    this.checkInTime = now;
    this.status = WorkSchedule.STATUS.WORKING;
    this.attendanceRecord = shift.isLate(toTimeString(now))
      ? WorkSchedule.ATTENDANCE.LATE
      : WorkSchedule.ATTENDANCE.ON_TIME;
    this.openingCash = openingCash !== null && openingCash !== undefined ? Number(openingCash) : null;
    return this;
  }

  /** UC82 */
  canHandOver() {
    return this.isWorking() && this.checkInTime != null;
  }

  /** UC82: end the shift after cash handover */
  complete(now = new Date()) {
    if (!this.canHandOver()) {
      throw new Error('complete() called when canHandOver() is false');
    }
    this.checkOutTime = now;
    this.workedHours = hoursBetween(this.checkInTime, now);
    this.status = WorkSchedule.STATUS.COMPLETED;
    return this;
  }
}

module.exports = WorkSchedule;

