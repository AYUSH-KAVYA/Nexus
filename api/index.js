const app = require('../server/src/index');

module.exports = (req, res) => {
  return app(req, res);
};
