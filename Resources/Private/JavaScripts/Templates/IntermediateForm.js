let domjs = require('domjs/lib/html5')(document);

module.exports = function(data) {
  return domjs.build(function() {
    for (let h = 0, locale; locale = Object.getOwnPropertyNames(data)[h]; h++) {
      let commands = data[locale];

      for (let i = 0, identifier; identifier = Object.getOwnPropertyNames(commands)[i]; i++) {
        let command = commands[identifier];

        for (let j= 0, key; key = Object.getOwnPropertyNames(command)[j]; j++) {
          let value = command[key];
          input({
            type : 'hidden',
            name: 'moduleArguments[commands][' + locale + '][' + identifier + '][' + key + ']',
            value: value
          });
        }
      }
    }
  });
};
