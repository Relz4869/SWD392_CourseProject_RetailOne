// Stub until FE-01 Sales is built. Other components depend on this contract, not on Invoices/Payments tables.
module.exports = {
  salesService: {
    // eslint-disable-next-line no-unused-vars
    async isPromotionUsed(promotionId) {
      const { invoiceUsage } = require('../manage-promotion/repositories/promotion.repository');
      return (await invoiceUsage(promotionId)).paidCount > 0;
    },
    async getApplicablePromotions(productId, invoiceValue, variantId) {
      return require('../manage-promotion').promotionService.findApplicablePromotions(productId, invoiceValue, variantId);
    },
    // eslint-disable-next-line no-unused-vars
    async getCashTotalBySchedule(scheduleId) { return 0; }, // used by UC82
  },
};

