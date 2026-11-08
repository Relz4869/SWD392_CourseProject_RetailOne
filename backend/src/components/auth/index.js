const router = require('./routes/auth.routes');
const authenticate = require('./middlewares/authenticate');
const authService = require('./services/auth.service');

module.exports = {
  router,
  authenticate,
  authService,
};
