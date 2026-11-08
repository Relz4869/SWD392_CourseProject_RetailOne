const notImplemented = (uc) => { throw new Error(`Not implemented: ${uc}`); };

module.exports = {
  createCashHandover: async () => notImplemented('UC82'),
  getCashHandoverReport: async () => notImplemented('UC83'),
};

