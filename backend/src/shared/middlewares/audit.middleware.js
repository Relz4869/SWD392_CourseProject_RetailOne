/*
 * audit(action, getEntityId?): log successful (< 400) requests for NFR Auditing.
 * TODO: the schema has no AuditLogs table yet (see Doc/SCHEMA_NOTES.md), so we only console.info.
 */
function audit(action, getEntityId) {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 400) return;
      let entityId = null;
      try {
        entityId = typeof getEntityId === 'function' ? getEntityId(req, res) : (req.params && req.params.id) || null;
      } catch {
        entityId = null;
      }
      console.info('[AUDIT]', {
        action,
        userId: req.user ? req.user.userId : null,
        staffId: req.user ? req.user.staffId : null,
        entityId,
        deviceId: req.get('X-Device-Id') || null,
        ip: req.ip,
        at: new Date().toISOString(),
      });
    });
    next();
  };
}

module.exports = { audit };

