/**
 * Single point of entry bootstrap script
 */
let ComponentDomParser = require('componentdomparser');
var parser = new ComponentDomParser({
    dataSelector: 'area',
    componentIndex: {
        'Translations': require('./Components/Translations.js')
    }
});

document.addEventListener('DOMContentLoaded', function() {
  parser.parse();
});
