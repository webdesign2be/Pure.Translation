let Model = require('fishbone');

let Editable = require('../Editable/Editable');
let EditableManager = require('../EditableManager/EditableManager');

/**
 * TranslationTable
 *
 * A view displaying a source and a target locale side by side as
 * table columns. The column displaying the target locale consists
 * of editable cells.
 */
let TranslationTable = Model({
  init : function(sourceLocale, targetLocale, translations, locales) {
    this.sourceLocale = sourceLocale;
    this.targetLocale = targetLocale;
    this.translations = translations;
    this.locales = locales;

    this.editableManager = new EditableManager();
    this.commandHead = {};
    this.boundKeyHandler = this.keyHandler.bind(this);
  },

  /**
   * Render the table and wire all its events
   *
   * @return {Object}
   */
  render : function() {
    this.el || (this.el = require('Templates/TranslationTable')({
      locales : this.locales,
      sourceLocale : this.sourceLocale,
      targetLocale : this.targetLocale,
      translations : this.translations,
      factory : {
        editable : function(el, translation) {
          if (!translation.value) {
            let source = this.translations[translation.identifier][this.sourceLocale];

            // try to exchange the source to have well defined package key
            // and file name
            for (let i = 0; !source; i++) {
              let identifier = Object.getOwnPropertyNames(this.translations)[i];
              source = this.translations[identifier][this.targetLocale]
            }

            translation.packageKey = source.packageKey;
            translation.localeCode = this.targetLocale;
            translation.sourceName = source.sourceName;
            translation.value = '';
          }

          let editable = new Editable(el, translation, this.editableManager);
          editable.on('change', this.addCommand.bind(this));
          this.editableManager.add(editable);
        }.bind(this),

        screenshot : function(el, screenshotSrc) {
          el.addEventListener('click', function() {
            let lightbox = require('Templates/ScreenshotLightbox')({
              src: screenshotSrc
            });
            let remove = function() {
              lightbox.remove();
              document.removeEventListener('click', remove);
            };

            document.body.appendChild(lightbox);
            setTimeout(function() {
              document.addEventListener('click', remove);
            }, 0);
          });
        }.bind(this),

        localeSelector : function(select) {
          select.addEventListener('change', function() {
            this.trigger('locale:change', select.value);
          }.bind(this));
        }.bind(this)
      }
    }));

    this.el.getElementsByTagName('select')[0].value = this.targetLocale;

    document.addEventListener('keyup', this.boundKeyHandler);
    this.editableManager.attach();
    return this;
  },

  /**
   * Unwire all the tables events
   *
   * @return {Object}
   */
  detach : function() {
    document.removeEventListener('keyup', this.boundKeyHandler);
    this.editableManager.detach();
  },

  /**
   * Keyboard shortcut bindings
   *
   * @param {Object} e The event
   * @return {Object}
   */
  keyHandler : function(e) {
    if (e.ctrlKey) {
      let keyCode = e.wich || e.keyCode || e.charCode;

      switch(keyCode) {
        case 90: this.undo(); break;
        case 89: this.redo(); break;
      }
    }

    return this;
  },

  /**
   * Add a delta command for this table
   *
   * @param {Object} delta The delta command
   * @return {Object}
   */
  addCommand : function(delta) {
    this.commandHead.next = delta;
    delta.previous = this.commandHead;
    this.commandHead = delta;

    return this;
  },

  /**
   * Undo the last delta command
   *
   * @return {Object}
   */
  undo : function() {
    let command = this.commandHead && this.commandHead.previous;
    this.commandHead && this.commandHead.editable.setValue(this.commandHead.value.from);
    this.commandHead = command;

    return this;
  },

  /**
   * Redo the latest undone delta command
   *
   * @return {Object}
   */
  redo : function() {
    let command = this.commandHead && this.commandHead.next;
    command && command.editable.setValue(command.value.to);
    command && (this.commandHead = command);

    return this;
  },

  /**
   * Serialize all commands into a minimal set
   *
   * @return {Object}
   */
  save : function() {
    this.editableManager.freezeCurrent();
    // normalize deltas for transport to server
    let command = this.commandHead;
    let data = {};
    while(command && command.identifier) {
      if (!data[command.identifier]) {
        data[command.identifier] = {
          packageKey : command.packageKey,
          locale : command.locale,
          sourceName : command.sourceName,
          identifier : command.identifier,
          value : command.value.to
        };
      }

      command = command.previous;
    }

    return data;
  }
});


module.exports = TranslationTable;
