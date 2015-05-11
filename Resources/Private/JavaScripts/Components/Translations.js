let Model = require('fishbone');
let TranslationTable = require('./TranslationTable/TranslationTable.js');

/**
 * Translations
 *
 * An application that allows for multi-language and multi-locale
 * translation. It is designed to run in a TYPO3 Neos backend Environment.
 */
let Translations = Model({

  /**
   * Constructor
   */
  init : function(el) {
    this.el = el;
    this.tableViews = {};
    this.form = this.el.getElementsByTagName('form')[0];
    this.locales = JSON.parse(this.el.querySelector('[data-json="locales"]').innerText);
    this.translations = JSON.parse(this.el.querySelector('[data-json="translations"]').innerText);
    this.defaultTarget = this.el.dataset.locale || this.locales[1];
    this.render(this.locales[0], this.defaultTarget);
  },

  /**
   * Render the app
   *
   * @return {Object}
   */
  render : function(sourceLocale, targetLocale) {
    this.tableViews[sourceLocale] || (this.tableViews[sourceLocale] = {});
    if (!this.tableViews[sourceLocale][targetLocale]) {
      this.tableViews[sourceLocale][targetLocale] =
        new TranslationTable(sourceLocale, targetLocale, this.translations, this.locales);

      this.tableViews[sourceLocale][targetLocale].on('locale:change', this.changeLocale.bind(this));
    }

    let enhance = this.el.querySelector('[data-enhance]') || this.view;
    let enhanceParent = enhance.parentNode;
    this.view = require('Templates/MainApplication')({
      table : this.tableViews[sourceLocale][targetLocale].render().el,
      factory : {
        button : function(button) {
          button.addEventListener('click', this.save.bind(this));
        }.bind(this)
      }
    });

    this.currentTable = this.tableViews[sourceLocale][targetLocale];

    enhanceParent.replaceChild(this.view, enhance);
    return this;
  },

  /**
   * Switch to a different locale
   *
   * @return {Object}
   */
  changeLocale : function(locale) {
    this.currentTable.detach();
    this.render(this.locales[0], locale);

    return this;
  },

  /**
   * Save all changes made to the translations
   *
   * @return {Object}
   */
  save : function() {
    let data = {};
    for (let i = 0, sourceLocale; sourceLocale = Object.getOwnPropertyNames(this.tableViews)[i]; i++) {
      let tableViews = this.tableViews[sourceLocale];
      for (let j = 0, targetLocale; targetLocale = Object.getOwnPropertyNames(tableViews)[j]; j++) {
        let tableView = tableViews[targetLocale];
        data[targetLocale] || (data[targetLocale] = tableView.save());
      }
    }

    this.form.appendChild(require('../Templates/IntermediateForm')(data));
    this.form.submit();
  }
});


module.exports = Translations;
