const express = require('express');
const cors = require('cors');
const { corsOrigin } = require('./shared/config/env');
const { notFound, errorHandler } = require('./shared/middlewares/error.middleware');

const app = express();

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ success: true, data: 'ok' }));

app.use('/api/auth', require('./components/auth').router);
app.use('/api/products', require('./components/manage-product').productRouter);
app.use('/api/categories', require('./components/manage-product').categoryRouter);
app.use('/api/promotions', require('./components/manage-promotion').router);
app.use('/api/staff', require('./components/manage-staff').router);
app.use('/api/shifts', require('./components/manage-shift').router);
app.use('/api/schedules', require('./components/manage-shift').scheduleRouter);
app.use('/api/cash-handovers', require('./components/cash-handover').router);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
