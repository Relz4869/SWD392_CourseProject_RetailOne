// Component: manage-shift (UC75, UC81, UC73)
module.exports = {
  router: require('./routes/shift.routes'),
  shiftRouter: require('./routes/shift.routes'),
  scheduleRouter: require('./routes/schedule.routes'),
  shiftService: require('./services/shift.service'),
  scheduleService: require('./services/schedule.service'),
};
