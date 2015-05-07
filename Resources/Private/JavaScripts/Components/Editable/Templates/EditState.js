let domjs = require('domjs/lib/html5')(document);
module.exports = function(options) {
  return domjs.build(function() {
    input({ 'type': 'text', 'value': options.value });
  });
};
