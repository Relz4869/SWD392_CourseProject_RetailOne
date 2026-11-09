const router = require('express').Router();
const authenticate = require('../../auth/middlewares/authenticate');
const { protect } = require('../../../shared/middlewares/permission.middleware');
const { validate } = require('../../../shared/middlewares/validate.middleware');
const { audit } = require('../../../shared/middlewares/audit.middleware');
const { PERMISSIONS } = require('../../../shared/constants/permissions');
const controller = require('../controllers/cashHandover.controller');

const countBody = validate({ denominationCounts: { required: true } });

const handoverPermission = protect(PERMISSIONS.SHIFT_CASH_HANDOVER, PERMISSIONS.CASH_HANDOVER_CREATE);
const reportPermission = protect(PERMISSIONS.CASH_REPORT_VIEW, PERMISSIONS.CASH_HANDOVER_REPORT);

const reportQuery = validate({
  fromDate: { required: true, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ },
  toDate: { required: true, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ },
  staffId: { required: false, type: 'integer', min: 1 },
  page: { required: false, type: 'integer', min: 1 },
  pageSize: { required: false, type: 'integer', min: 1, max: 100 },
}, 'query');

const reportParams = validate({ id: { required: true, type: 'integer', min: 1 } }, 'params');

router.get('/current', authenticate, handoverPermission, controller.current);
router.post('/current/count', authenticate, handoverPermission, countBody, audit('CASH_HANDOVER_COUNT'), controller.count);
router.get('/current/reconciliation', authenticate, handoverPermission, controller.reconciliation);
router.post('/current/confirm', authenticate, handoverPermission, audit('CASH_HANDOVER_CONFIRM_BLOCKED'), controller.confirm);
router.get('/', authenticate, reportPermission, reportQuery, controller.report);
router.get('/:id', authenticate, reportPermission, reportParams, controller.detail);

module.exports = router;
