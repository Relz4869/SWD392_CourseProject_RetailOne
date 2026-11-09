const express = require('express');
const controller = require('../controllers/auth.controller');
const authenticate = require('../middlewares/authenticate');
const { validate } = require('../../../shared/middlewares/validate.middleware');
const asyncHandler = require('../../../shared/utils/asyncHandler');

const router = express.Router();

const loginSchema = {
  username: { required: true, type: 'string', minLength: 3, maxLength: 50, trim: true },
  password: { required: true, type: 'string', maxLength: 100 },
};

router.post('/login', validate(loginSchema), asyncHandler(controller.login));
router.get('/me', authenticate, asyncHandler(controller.me));
router.post('/change-password', authenticate, asyncHandler(controller.changePassword));

module.exports = router;
