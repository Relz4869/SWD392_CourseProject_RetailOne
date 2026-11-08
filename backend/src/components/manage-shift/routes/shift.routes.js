// Owner: HiepND | UC75
// Tables: Shifts
const router = require('express').Router();
const authenticate = require('../../auth/middlewares/authenticate');
const { protect } = require('../../../shared/middlewares/permission.middleware');
const { validate } = require('../../../shared/middlewares/validate.middleware');
const { PERMISSIONS } = require('../../../shared/constants/permissions');
const shiftController = require('../controllers/shift.controller');

// Schema validation cho POST /api/shifts (UC75)
const createShiftValidation = validate({
  name: { required: true, type: 'string', minLength: 1, maxLength: 50, trim: true },
  startTime: { required: true, type: 'time' },
  endTime: { required: true, type: 'time' },
  checkInStart: { required: false, type: 'time' },
  checkInEnd: { required: false, type: 'time' },
  checkOutDeadline: { required: false, type: 'time' },
  isActive: { required: false, type: 'boolean' },
});

// GET /api/shifts: yêu cầu đăng nhập, xem danh sách ca (hỗ trợ UC75 & UC81)
router.get(
  '/',
  authenticate,
  protect(PERMISSIONS.SHIFT_VIEW, PERMISSIONS.SHIFT_CREATE, PERMISSIONS.SCHEDULE_ASSIGN),
  shiftController.list
);

// POST /api/shifts: yêu cầu quyền quản lý ca (Manager only theo RBAC: SHIFT_CREATE hoặc SHIFT_ASSIGN/SHIFT_VIEW cho Manager)
router.post(
  '/',
  authenticate,
  protect(PERMISSIONS.SHIFT_CREATE, PERMISSIONS.SHIFT_ASSIGN),
  createShiftValidation,
  shiftController.create
);

module.exports = router;
