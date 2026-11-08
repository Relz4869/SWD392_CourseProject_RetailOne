const { sql } = require('../../../shared/config/database');
const BaseModel = require('../../../shared/models/BaseModel');
const { EMPLOYMENT_STATUS } = require('../../../shared/constants/staff');

class Staff extends BaseModel {
  static TABLE = 'dbo.Staff';

  static STATUS = EMPLOYMENT_STATUS;
  static SALARY_TYPE = Object.freeze({ MONTHLY: 'monthly', HOURLY: 'hourly' });

  static COLUMNS = Object.freeze({
    id:               { type: sql.BigInt, pk: true, identity: true, bigint: true },
    userId:           { type: sql.Int },
    fullName:         { type: sql.NVarChar(100) },
    phoneNumber:      { type: sql.VarChar(20) },
    email:            { type: sql.VarChar(100), nullable: true },
    salaryType:       { type: sql.VarChar(20) },
    baseSalary:       { type: sql.Decimal(15, 2) },
    employmentStatus: { type: sql.VarChar(20) },
    idCard:           { type: sql.VarChar(20), nullable: true, sensitive: true },
    resignationDate:  { type: sql.Date, nullable: true },
    createdAt:        { type: sql.DateTime2 },
  });

  isWorking() {
    return this.employmentStatus === EMPLOYMENT_STATUS.WORKING;
  }

  /** UC67 */
  isResigned() {
    return this.employmentStatus === EMPLOYMENT_STATUS.RESIGNED;
  }

  /** UC66: nhân viên đã nghỉ thì không mở lại tài khoản */
  canBeActivated() {
    return this.isWorking();
  }
}

module.exports = Staff;
