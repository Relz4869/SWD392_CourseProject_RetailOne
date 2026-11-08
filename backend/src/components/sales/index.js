// components/sales/index.js
// Stub until FE-01 Sales is built. Other components depend on this contract, not on Invoices/Payments tables.
module.exports = {
  salesService: {
    // eslint-disable-next-line no-unused-vars
    async isPromotionUsed(promotionId) { return false; }, // used by UC56
    // eslint-disable-next-line no-unused-vars
    async getCashTotalBySchedule(scheduleId) { return 0; }, // used by UC82
  },
};

