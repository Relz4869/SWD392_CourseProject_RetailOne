// Owner: HiepND | UC81, UC73
// Tables: WorkSchedules
const router = require('express').Router();
const authenticate = require('../../auth/middlewares/authenticate');
const { protect } = require('../../../shared/middlewares/permission.middleware');
const { validate } = require('../../../shared/middlewares/validate.middleware');
const { PERMISSIONS } = require('../../../shared/constants/permissions');
const scheduleController = require('../controllers/schedule.controller');
const { audit } = require('../../../shared/middlewares/audit.middleware');

const listValidation = validate({
  from: { required: true, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ },
  to: { required: true, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ },
  staffId: { required: false, type: 'integer', min: 1 },
}, 'query');

const assignValidation = validate({
  staffId: { required: true, type: 'integer', min: 1 },
  shiftId: { required: true, type: 'integer', min: 1 },
  workDate: { required: true, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ },
});

const checkInParamsValidation = validate({
  id: { required: true, type: 'integer', min: 1 },
}, 'params');

const checkInBodyValidation = validate({
  openingCash: { required: false },
});

router.get(
  '/my-today',
  authenticate,
  protect(PERMISSIONS.SHIFT_CHECKIN, PERMISSIONS.SCHEDULE_CHECK_IN),
  scheduleController.myToday,
);

router.get(
  '/',
  authenticate,
  protect(PERMISSIONS.SHIFT_ASSIGN, PERMISSIONS.SCHEDULE_ASSIGN),
  listValidation,
  scheduleController.list,
);

router.post(
  '/assignments',
  authenticate,
  protect(PERMISSIONS.SHIFT_ASSIGN, PERMISSIONS.SCHEDULE_ASSIGN),
  assignValidation,
  scheduleController.assign,
);

router.post(
  '/:id/check-in',
  authenticate,
  protect(PERMISSIONS.SHIFT_CHECKIN, PERMISSIONS.SCHEDULE_CHECK_IN),
  checkInParamsValidation,
  checkInBodyValidation,
  audit('SCHEDULE_CHECK_IN'),
  scheduleController.checkIn,
);

module.exports = router;

