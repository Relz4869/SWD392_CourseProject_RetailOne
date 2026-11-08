// Standard success responses (spec 4.4).

function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

function created(res, data) {
  return ok(res, data, 201);
}

/** Paged list: { items, page, pageSize, totalItems, totalPages }. */
function paged(res, { items, page, pageSize, totalItems }) {
  const totalPages = pageSize > 0 ? Math.ceil(totalItems / pageSize) : 0;
  return ok(res, { items, page, pageSize, totalItems, totalPages });
}

module.exports = { ok, created, paged };

