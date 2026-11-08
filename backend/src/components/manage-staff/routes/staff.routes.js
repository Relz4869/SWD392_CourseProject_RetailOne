const router = require('express').Router();
const {authenticate}=require('../../auth');
const {protect}=require('../../../shared/middlewares/permission.middleware');
const {PERMISSIONS:P}=require('../../../shared/constants/permissions');
const {ROLES}=require('../../../shared/constants/roles');
const AppError=require('../../../shared/utils/AppError');
const {ERRORS}=require('../../../shared/constants/errors');
const controller=require('../controllers/staff.controller');
router.use(authenticate);
router.use((req,res,next)=>req.user.role===ROLES.MANAGER?next():next(new AppError(ERRORS.FORBIDDEN)));
router.use((req,res,next)=>{res.set('Cache-Control','no-store');next();});
router.get('/',protect(P.STAFF_VIEW),controller.list);
router.get('/roles',protect(P.STAFF_CREATE),controller.roles);
router.post('/',protect(P.STAFF_CREATE),controller.submitStaffAndAccount);
router.get('/:id',protect(P.STAFF_VIEW),controller.detail);
router.patch('/:id/account-status',protect(P.STAFF_CHANGE_STATUS),controller.changeAccountStatus);
module.exports = router;

