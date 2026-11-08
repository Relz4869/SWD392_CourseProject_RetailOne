const { sql } = require('../../../shared/config/database');
const BaseModel = require('../../../shared/models/BaseModel');
const { roundMoney } = require('../../../shared/utils/money');

class CashHandover extends BaseModel {
  static TABLE = 'dbo.CashHandovers';

  static REVIEW_STATUS = Object.freeze({
    PENDING: 'Pending',
    REVIEWED: 'Reviewed',
  });

  static COLUMNS = Object.freeze({
    id:           { type: sql.Int, pk: true, identity: true },
    scheduleId:   { type: sql.Int },
    handoverTime: { type: sql.DateTime2 },
    openingCash:  { type: sql.Decimal(15, 2) },
    systemCash:   { type: sql.Decimal(15, 2) },
    actualCash:   { type: sql.Decimal(15, 2) },
    difference:   { type: sql.Decimal(15, 2), computed: true },
    note:         { type: sql.NVarChar(sql.MAX), nullable: true },
    reviewStatus: { type: sql.VarChar(20) },
    reviewedBy:   { type: sql.BigInt, nullable: true, bigint: true },
    reviewedAt:   { type: sql.DateTime2, nullable: true },
    reviewNote:   { type: sql.NVarChar(500), nullable: true },
  });

  /** UC82 */
  static fromSchedule(schedule, { systemCash, actualCash, note = null }) {
    return new CashHandover({
      scheduleId: schedule.id,
      openingCash: schedule.openingCash ?? 0,
      systemCash,
      actualCash,
      note,
      reviewStatus: CashHandover.REVIEW_STATUS.PENDING,
    });
  }

  /** UC82 */
  expectedCash() {
    return roundMoney(Number(this.openingCash ?? 0) + Number(this.systemCash ?? 0));
  }

  /** UC82, UC83 */
  difference() {
    return roundMoney(Number(this.actualCash ?? 0) - this.expectedCash());
  }

  /** UC83 */
  hasDiscrepancy() {
    return this.difference() !== 0;
  }

  /** BR-10 */
  requiresNote() {
    return this.hasDiscrepancy();
  }

  /** BR-10: CK_Handover_NoteOnDiff */
  hasValidNote() {
    return !this.requiresNote() || (this.note !== null && this.note !== undefined && this.note.trim().length > 0);
  }
}

module.exports = CashHandover;
