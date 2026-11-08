const authService = require('../services/auth.service');
const { ok } = require('../../../shared/utils/response');

async function login(req, res) {
  const { username, password } = req.body;
  const result = await authService.login(username, password);
  res.set('Cache-Control','no-store');
  return ok(res, result);
}

async function me(req, res) {
  const result = await authService.getSession(req.user.userId);
  return ok(res, result);
}

async function changePassword(req,res) {
  const result=await authService.changePassword(req.user.userId,req.user.tokenVersion,req.body);
  res.set({'Cache-Control':'no-store','Pragma':'no-cache'});
  return ok(res,result);
}

module.exports = {
  changePassword,
  login,
  me,
};
