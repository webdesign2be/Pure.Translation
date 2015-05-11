let domjs = require('domjs/lib/html5')(document);

module.exports = function(options) {
  return domjs.build(function() {
    let buttons = {
      top : button('Save'),
      bottom : button('Save')
    };

    options.factory.button(buttons.top());
    options.factory.button(buttons.bottom());

    let app = div(
      buttons.top,
      options.table,
      buttons.bottom
    );
  }).firstChild;
};
