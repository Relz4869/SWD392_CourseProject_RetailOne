const authService = require('../services/auth.service');
const { ok } = require('../../../shared/utils/response');

async function login(req, res) {
  const { username, password } = req.body;
  const result = await authService.login(username, password);
  return ok(res, result);
}

async function me(req, res) {
  const result = await authService.getSession(req.user.userId);
  return ok(res, result);
}

module.exports = {
  login,
  me,
};
