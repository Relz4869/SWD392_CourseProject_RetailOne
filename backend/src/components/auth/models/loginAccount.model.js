const { sql } = require('../../../shared/config/database');
const BaseModel = require('../../../shared/models/BaseModel');
const { EMPLOYMENT_STATUS } = require('../../../shared/constants/staff');

class LoginAccount extends BaseModel {
  // Read model, no TABLE

  static STATUS = Object.freeze({ ACTIVE: 'active', LOCKED: 'locked' });

  static COLUMNS = Object.freeze({
    userId:                { type: sql.Int },
    username:              { type: sql.VarChar(50) },
    passwordHash:          { type: sql.VarChar(255), sensitive: true },
    isActive:              { type: sql.VarChar(20) },
    requirePasswordChange: { type: sql.Bit },
    roleId:                { type: sql.Int },
    role:                  { type: sql.NVarChar(50) },
    staffId:               { type: sql.BigInt, bigint: true },
    fullName:              { type: sql.NVarChar(100) },
    employmentStatus:      { type: sql.VarChar(20) },
  });

  /** UC69 E3 */
  isLocked() {
    return this.isActive === LoginAccount.STATUS.LOCKED;
  }

  /** UC69 E4 */
  hasResigned() {
    return this.employmentStatus === EMPLOYMENT_STATUS.RESIGNED;
  }

  canLogin() {
    return this.isActive === LoginAccount.STATUS.ACTIVE && !this.hasResigned();
  }

  /** BR-01 */
  mustChangePassword() {
    return this.requirePasswordChange === true;
  }

  toTokenPayload() {
    return {
      userId: this.userId,
      staffId: this.staffId,
      role: this.role,
    };
  }

  toSessionUser() {
    return {
      userId: this.userId,
      staffId: this.staffId,
      username: this.username,
      fullName: this.fullName,
      role: this.role,
      requirePasswordChange: Boolean(this.requirePasswordChange),
    };
  }
}

module.exports = LoginAccount;

