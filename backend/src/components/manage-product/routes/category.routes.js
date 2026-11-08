// Owner: PhuNT | UC39
// Tables: Categories
const router = require('express').Router();
const { authenticate } = require('../../auth');
const { protect } = require('../../../shared/middlewares/permission.middleware');
const { PERMISSIONS } = require('../../../shared/constants/permissions');
const categoryController = require('../controllers/category.controller');

// GET /api/categories/options (filter support)
router.get('/options', authenticate, protect(PERMISSIONS.CATEGORY_VIEW), categoryController.options);

// TODO UC39: POST / -> categoryController.create

module.exports = router;
