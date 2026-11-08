// Component: manage-product (UC39, UC42, UC46, UC48).
// Owns Categories, Products, ProductVariants, ProductSalePriceHistories. InventoryStocks is read-only here.
const productRouter = require('express').Router();
const categoryRouter = require('express').Router();
// TODO UC48 (Phase 4): product list + category options. TODO UC39, UC42, UC46.
module.exports = { productRouter, categoryRouter };

