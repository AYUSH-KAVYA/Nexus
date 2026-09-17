const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });

const app = require('../server/src/index');

module.exports = app;
