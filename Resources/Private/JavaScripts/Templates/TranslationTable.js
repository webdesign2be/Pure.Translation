let domjs = require('domjs/lib/html5')(document);
let crop = function(str, limit) {
  return str.length > limit ? str.substring(0, limit) + "..." : str;
};

module.exports = function(options) {
  return domjs.build(function() {
    let tableBody = tbody();
    let sourceLocale = options.sourceLocale;
    let targetLocale = options.targetLocale;

    let localeSelector = select();
    for (let i = 0; i < options.locales.length; i++) {
      let attributes = { value : options.locales[i] };
      (targetLocale === options.locales[i]) &&
        (attributes.selected = 'selected');

      localeSelector(option(attributes, options.locales[i].toUpperCase()));
    }

    options.factory.localeSelector(localeSelector());

    let allIdentifiers = Object.getOwnPropertyNames(options.translations);
    for (let i = 0, translations; translations = options.translations[allIdentifiers[i]]; i++) {
      let source = translations[sourceLocale];
      let target = translations[targetLocale];
      let screenshot = span({ class: 'icon-screenshot', title: 'show screenshot' });
      let editable = div();

      tableBody(
        tr(
          td(source ? {} : { class : 'is-missing' },
            span(source ? crop(source.value, 100) : allIdentifiers[i]),
            source && source.screenshotSrc ? screenshot() : screenshot({class: ''})),

          td(target ? {} : { class : 'is-missing' },
            target ? editable(crop(target.value, 100)) : editable())
        )
      );

      options.factory.editable(editable(), target || { identifier : allIdentifiers[i] });

      if(source && options.factory.screenshot) {
        options.factory.screenshot(screenshot(), source.screenshotSrc);
      }
    }

    // Build the actual table
    table({ 'class' : 'translations-table neos-table' },
      thead(
        tr(th(sourceLocale.toUpperCase()), th({ class : 'is-target' }, localeSelector))
      ),
      tableBody
    );

  }).firstChild;
};
