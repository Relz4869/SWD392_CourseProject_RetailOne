const { sql } = require('../../../shared/config/database');
const BaseModel = require('../../../shared/models/BaseModel');

class User extends BaseModel {
  static TABLE = 'dbo.Users';

  static STATUS = Object.freeze({ ACTIVE: 'active', LOCKED: 'locked' });

  static COLUMNS = Object.freeze({
    id:                    { type: sql.Int, pk: true, identity: true },
    roleId:                { type: sql.Int },
    username:              { type: sql.VarChar(50) },
    passwordHash:          { type: sql.VarChar(255), sensitive: true },
    isActive:              { type: sql.VarChar(20) },
    requirePasswordChange: { type: sql.Bit },
    createdAt:             { type: sql.DateTime2 },
  });

  isLocked() {
    return this.isActive === User.STATUS.LOCKED;
  }

  /** BR-01 */
  mustChangePassword() {
    return this.requirePasswordChange === true;
  }
}

module.exports = User;

