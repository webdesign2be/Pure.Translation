let domjs = require('domjs/lib/html5')(document);

module.exports = function(options) {
  return domjs.build(function() {
    let lightbox = div({class: 'lightbox'},
      img({ src: options.src })
    )
  }).firstChild;
};
