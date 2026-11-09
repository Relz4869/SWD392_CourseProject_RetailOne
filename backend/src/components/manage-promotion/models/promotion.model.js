const { sql } = require('../../../shared/config/database');
const BaseModel = require('../../../shared/models/BaseModel');

class Promotion extends BaseModel {
  static TABLE = 'dbo.Promotions';

  static TYPE = Object.freeze({ PERCENT: 'Percent', AMOUNT: 'Amount' });
  static STATUS = Object.freeze({ DRAFT: 'Draft', ACTIVE: 'Active', DISABLED: 'Disabled', EXPIRED: 'Expired', DELETED: 'Deleted' });

  static COLUMNS = Object.freeze({
    id:              { type: sql.BigInt, pk: true, identity: true, bigint: true },
    name:            { type: sql.NVarChar(255), nullable: true },
    type:            { type: sql.VarChar(20), nullable: true },
    value:           { type: sql.Decimal(15, 2), nullable: true },
    minInvoiceValue: { type: sql.Decimal(15, 2) },
    maxBudget:       { type: sql.Decimal(15, 2), nullable: true },
    startDate:       { type: sql.DateTime2, nullable: true },
    endDate:         { type: sql.DateTime2, nullable: true },
    status:          { type: sql.VarChar(20) },
    createdAt:       { type: sql.DateTime2 },
  });

  isDeleted() {
    return this.status === Promotion.STATUS.DELETED;
  }

  hasEnded(now = new Date()) {
    return this.status === Promotion.STATUS.EXPIRED || (this.endDate != null && this.endDate < now);
  }

  isRunning(now = new Date()) {
    return this.status === Promotion.STATUS.ACTIVE && this.startDate <= now && now <= this.endDate;
  }

  /** "Upcoming" is not stored in DB: Active and not started yet. */
  isUpcoming(now = new Date()) {
    return this.status === Promotion.STATUS.ACTIVE && this.startDate > now;
  }

  effectiveStatus(now = new Date()) {
    if (this.status !== Promotion.STATUS.ACTIVE) return this.status;
    if (this.hasEnded(now)) return 'Expired';
    return this.isUpcoming(now) ? 'Upcoming' : 'Active';
  }

  toJSON() {
    return { ...super.toJSON(), status: this.effectiveStatus() };
  }

  /** UC54: products can be assigned only while the promotion is not deleted or ended. */
  isEditable(now = new Date()) {
    return !this.isDeleted() && !this.hasEnded(now);
  }

  /** UC56: a running promotion must be disabled first. */
  canBeDeleted(now = new Date()) {
    return !this.isDeleted() && !this.isRunning(now);
  }

  /** UC56: soft delete, invoices keep referencing this row. */
  markDeleted(now = new Date()) {
    if (!this.canBeDeleted(now)) throw new Error('markDeleted() called when canBeDeleted() is false');
    this.status = Promotion.STATUS.DELETED;
    return this;
  }
}

module.exports = Promotion;

