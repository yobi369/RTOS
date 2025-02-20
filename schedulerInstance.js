const RateMonotonicScheduler = require('./scheduler');

// Create and export a single scheduler instance
const scheduler = new RateMonotonicScheduler();
module.exports = scheduler;
