// Owner: MaiCT | UC64, UC66
// Tables: Staff
const router = require('express').Router();
const authenticate = require('../../auth/middlewares/authenticate');
const { protect } = require('../../../shared/middlewares/permission.middleware');
const { PERMISSIONS } = require('../../../shared/constants/permissions');
const staffController = require('../controllers/staff.controller');

// Minimal UC81 integration helper; this is not a separate Staff use case.
router.get(
  '/active',
  authenticate,
  protect(PERMISSIONS.SHIFT_ASSIGN, PERMISSIONS.SCHEDULE_ASSIGN),
  staffController.listActive,
);

// TODO UC64: POST / -> staffController.create
// TODO UC66: PATCH /:id/account-status -> staffController.changeStatus

module.exports = router;

