const { sql } = require('../../../shared/config/database');
const BaseModel = require('../../../shared/models/BaseModel');
const { hoursBetweenTimes, normalizeTime } = require('../../../shared/utils/date');

class Shift extends BaseModel {
  static TABLE = 'dbo.Shifts';

  static COLUMNS = Object.freeze({
    id:               { type: sql.Int, pk: true, identity: true },
    name:             { type: sql.NVarChar(50) },
    startTime:        { type: sql.Time },
    endTime:          { type: sql.Time },
    checkInStart:     { type: sql.Time, nullable: true },
    checkInEnd:       { type: sql.Time, nullable: true },
    checkOutDeadline: { type: sql.Time, nullable: true },
    isActive:         { type: sql.Bit },
  });

  /** UC75, BR-76 */
  hasValidTimeRange() {
    return normalizeTime(this.endTime) > normalizeTime(this.startTime);
  }

  checkInWindow() {
    return {
      from: normalizeTime(this.checkInStart ?? this.startTime),
      to: normalizeTime(this.checkInEnd ?? this.endTime),
    };
  }

  isInCheckInWindow(time) {
    const t = normalizeTime(time);
    const win = this.checkInWindow();
    return t >= win.from && t <= win.to;
  }

  isLate(time) {
    return normalizeTime(time) > normalizeTime(this.startTime);
  }

  durationHours() {
    return hoursBetweenTimes(this.startTime, this.endTime);
  }
}

module.exports = Shift;

