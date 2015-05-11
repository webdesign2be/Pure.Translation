(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var Model = require('fishbone');

/**
 * Editable
 *
 * A View that handles the editing capabilities of editable cells
 * in a translation table
 */
var Editable = Model({

  /**
   * Constructor
   */
  init: function init(el, translation, manager) {
    this.el = el;
    this.parent = this.el.parentNode;
    this.statefulEl = this.el;
    this.manager = manager;

    this.isEditState = false;
    this.isDirty = false;
    this.translation = translation;
    this.translation.origin = translation.value;

    this.el.addEventListener('click', this.requestThaw.bind(this));
  },

  /**
   * Ask editable manager to activate edit mode
   *
   * @return {Object}
   */
  requestThaw: function requestThaw(e) {
    e && e.stopPropagation();
    this.manager.requestThaw(this);
    return this;
  },

  /**
   * Ask edit manager to gain focus
   *
   * @return {Object}
   */
  requestFocus: function requestFocus(e) {
    e && e.stopPropagation();
    this.manager.requestFocus(this);

    return this;
  },

  /**
   * Set the current value
   *
   * @return {Object}
   */
  setValue: function setValue(value) {
    this.isDirty = this.translation.origin !== value;
    this.translation.value = value;
    this.reset();

    return this;
  },

  /**
   * Gain focus
   *
   * @return {Object}
   */
  focus: function focus() {
    return this;
  },

  /**
   * Lose focus
   *
   * @return {Object}
   */
  blur: function blur() {
    this.freeze();
    return this;
  },

  /**
   * Enter edit mode
   *
   * @return {Object}
   */
  thaw: function thaw() {
    if (!this.isEditState) {
      var input = require('./Templates/EditState.js')(this.translation).firstChild;
      this.parent.replaceChild(input, this.el);
      this.statefulEl = input;

      this.statefulEl.focus();
      this.statefulEl.select();
      this.parent.classList.add('is-editing');
      this.isEditState = true;
    }

    return this;
  },

  /**
   * Leave edit mode
   *
   * @return {Object}
   */
  freeze: function freeze() {
    if (this.statefulEl !== this.el) {
      var value = {
        from: this.translation.value,
        to: this.statefulEl.value
      };

      this.setValue(value.to);

      if (this.isDirty) {
        this.trigger('change', {
          editable: this,
          packageKey: this.translation.packageKey,
          locale: this.translation.localeCode,
          sourceName: this.translation.sourceName,
          identifier: this.translation.identifier,
          value: value
        });
      }
    }

    return this;
  },

  /**
   * Reset original state
   *
   * @return {Object}
   */
  reset: function reset() {
    this.parent.replaceChild(this.el, this.statefulEl);
    this.statefulEl = this.el;
    this.el.innerHTML = this.translation.value;
    this.isEditState = false;

    this.parent.classList.remove('is-editing');
    this.parent.classList[this.isDirty ? 'add' : 'remove']('editor-dirty');

    return this;
  },

  /**
   * Destroy the object
   * 
   * @return {Object}
   */
  destroy: function destroy() {
    return this;
  }
});

module.exports = Editable;

},{"./Templates/EditState.js":2,"fishbone":39}],2:[function(require,module,exports){
'use strict';

var domjs = require('domjs/lib/html5')(document);
module.exports = function (options) {
  return domjs.build(function () {
    input({ 'type': 'text', 'value': options.value });
  });
};

},{"domjs/lib/html5":12}],3:[function(require,module,exports){
'use strict';

var Model = require('fishbone');

/**
 * EditableManager
 *
 * Manage Editable views
 */
var EditableManager = Model({

  /**
   * Constructor
   */
  init: function init() {
    this.editables = {
      ordered: [],
      byIdentifier: {},
      currentlyFocused: null
    };

    this.boundHandleDocumentClick = this.handleDocumentClick.bind(this);
    this.boundHandleKeyUp = this.handleKeyUp.bind(this);
  },

  /**
   * Wire all events for this object
   *
   * @return {Object}
   */
  attach: function attach() {
    document.addEventListener('click', this.boundHandleDocumentClick);
    document.addEventListener('keyup', this.boundHandleKeyUp);

    return this;
  },

  /**
   * Unwire all events for this object
   *
   * @return {Object}
   */
  detach: function detach() {
    document.removeEventListener('click', this.boundHandleDocumentClick);
    document.removeEventListener('keyup', this.boundHandleKeyUp);

    return this;
  },

  /**
   * Handle the user clicking anywhere
   *
   * @param {Object} e The event
   * @return {Object}
   */
  handleDocumentClick: function handleDocumentClick(e) {
    this.freezeCurrent();
    return this;
  },

  /**
   * Keyboard shortcut bindings
   *
   * @param {Object} e The event
   * @return {Object}
   */
  handleKeyUp: function handleKeyUp(e) {
    var keyCode = e.wich || e.keyCode || e.charCode;

    switch (keyCode) {
      case 9:
      case 13:
        this.freezeCurrent();
        this.editables.currentlyFocused.next && this.editables.currentlyFocused.next.requestThaw();
        break;

      case 27:
        this.resetCurrent();break;
    }

    return this;
  },

  /**
   * Add a new editable
   *
   * @param {Object} ediable The editable
   * @return {Object}
   */
  add: function add(editable) {
    this.editables.ordered.push(editable);
    this.editables.ordered[this.editables.ordered.length - 2] && (this.editables.ordered[this.editables.ordered.length - 2].next = editable) && (editable.previous = this.editables.ordered[this.editables.ordered.length - 2]);

    this.editables.byIdentifier[editable.translation.identifier] = editable;
  },

  /**
   * Reset currently focused editable to its original state
   *
   * @return {Object}
   */
  resetCurrent: function resetCurrent() {
    this.editables.currentlyFocused && this.editables.currentlyFocused.reset();
    return this;
  },

  /**
   * Leave edit mode for currently active editable and keep its
   * edited state.
   *
   * @return {Object}
   */
  freezeCurrent: function freezeCurrent() {
    this.editables.currentlyFocused && this.editables.currentlyFocused.freeze();
    return this;
  },

  /**
   * Switch currently focused editable
   *
   * @param {Object} editable The editable
   * @return {Object}
   */
  requestFocus: function requestFocus(editable) {
    if (!this.editables.currentlyFocused) {
      this.editables.currentlyFocused = editable;

      editable.focus();

      return this;
    }

    if (editable !== this.editables.currentlyFocused) {
      this.editables.currentlyFocused.blur();
      this.editables.currentlyFocused = editable;
      editable.focus();

      return this;
    }

    return this;
  },

  /**
   * Enter edit mode for a given editable
   *
   * @param {Object} editable The editable
   * @return {Object}
   */
  requestThaw: function requestThaw(editable) {
    if (editable !== this.editables.currentlyFocused) {
      this.requestFocus(editable);
    }

    editable.thaw();
    return this;
  }
});

module.exports = EditableManager;

},{"fishbone":39}],4:[function(require,module,exports){
'use strict';

var Model = require('fishbone');

var Editable = require('../Editable/Editable');
var EditableManager = require('../EditableManager/EditableManager');

/**
 * TranslationTable
 *
 * A view displaying a source and a target locale side by side as
 * table columns. The column displaying the target locale consists
 * of editable cells.
 */
var TranslationTable = Model({
  init: function init(sourceLocale, targetLocale, translations, locales) {
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
  render: function render() {
    this.el || (this.el = require('Templates/TranslationTable')({
      locales: this.locales,
      sourceLocale: this.sourceLocale,
      targetLocale: this.targetLocale,
      translations: this.translations,
      factory: {
        editable: (function (el, translation) {
          if (!translation.value) {
            var source = this.translations[translation.identifier][this.sourceLocale];

            // try to exchange the source to have well defined package key
            // and file name
            for (var i = 0; !source; i++) {
              var identifier = Object.getOwnPropertyNames(this.translations)[i];
              source = this.translations[identifier][this.targetLocale];
            }

            translation.packageKey = source.packageKey;
            translation.localeCode = this.targetLocale;
            translation.sourceName = source.sourceName;
            translation.value = '';
          }

          var editable = new Editable(el, translation, this.editableManager);
          editable.on('change', this.addCommand.bind(this));
          this.editableManager.add(editable);
        }).bind(this),

        localeSelector: (function (select) {
          select.addEventListener('change', (function () {
            this.trigger('locale:change', select.value);
          }).bind(this));
        }).bind(this)
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
  detach: function detach() {
    document.removeEventListener('keyup', this.boundKeyHandler);
    this.editableManager.detach();
  },

  /**
   * Keyboard shortcut bindings
   *
   * @param {Object} e The event
   * @return {Object}
   */
  keyHandler: function keyHandler(e) {
    if (e.ctrlKey) {
      var keyCode = e.wich || e.keyCode || e.charCode;

      switch (keyCode) {
        case 90:
          this.undo();break;
        case 89:
          this.redo();break;
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
  addCommand: function addCommand(delta) {
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
  undo: function undo() {
    var command = this.commandHead && this.commandHead.previous;
    this.commandHead && this.commandHead.editable.setValue(this.commandHead.value.from);
    this.commandHead = command;

    return this;
  },

  /**
   * Redo the latest undone delta command
   *
   * @return {Object}
   */
  redo: function redo() {
    var command = this.commandHead && this.commandHead.next;
    command && command.editable.setValue(command.value.to);
    command && (this.commandHead = command);

    return this;
  },

  /**
   * Serialize all commands into a minimal set
   *
   * @return {Object}
   */
  save: function save() {
    // normalize deltas for transport to server
    var command = this.commandHead;
    var data = {};
    while (command && command.identifier) {
      if (!data[command.identifier]) {
        data[command.identifier] = {
          packageKey: command.packageKey,
          locale: command.locale,
          sourceName: command.sourceName,
          identifier: command.identifier,
          value: command.value.to
        };
      }

      command = command.previous;
    }

    return data;
  }
});

module.exports = TranslationTable;

},{"../Editable/Editable":1,"../EditableManager/EditableManager":3,"Templates/TranslationTable":8,"fishbone":39}],5:[function(require,module,exports){
'use strict';

var Model = require('fishbone');
var TranslationTable = require('./TranslationTable/TranslationTable.js');

/**
 * Translations
 *
 * An application that allows for multi-language and multi-locale
 * translation. It is designed to run in a TYPO3 Neos backend Environment.
 */
var Translations = Model({

  /**
   * Constructor
   */
  init: function init(el) {
    this.el = el;
    this.tableViews = {};
    this.form = this.el.getElementsByTagName('form')[0];

    var localeNode = this.el.querySelector('[data-json="locales"]');
    this.locales = JSON.parse(localeNode.textContent || localeNode.innerText);

    var translationNode = this.el.querySelector('[data-json="translations"]');
    this.translations = JSON.parse(translationNode.textContent || translationNode.innerText);

    this.defaultTarget = this.el.dataset.locale || this.locales[1];
    this.render(this.locales[0], this.defaultTarget);
  },

  /**
   * Render the app
   *
   * @return {Object}
   */
  render: function render(sourceLocale, targetLocale) {
    this.tableViews[sourceLocale] || (this.tableViews[sourceLocale] = {});
    if (!this.tableViews[sourceLocale][targetLocale]) {
      this.tableViews[sourceLocale][targetLocale] = new TranslationTable(sourceLocale, targetLocale, this.translations, this.locales);

      this.tableViews[sourceLocale][targetLocale].on('locale:change', this.changeLocale.bind(this));
    }

    var enhance = this.el.querySelector('[data-enhance]') || this.view;
    var enhanceParent = enhance.parentNode;
    this.view = require('Templates/MainApplication')({
      table: this.tableViews[sourceLocale][targetLocale].render().el,
      factory: {
        button: (function (button) {
          button.addEventListener('click', this.save.bind(this));
        }).bind(this)
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
  changeLocale: function changeLocale(locale) {
    this.currentTable.detach();
    this.render(this.locales[0], locale);

    return this;
  },

  /**
   * Save all changes made to the translations
   *
   * @return {Object}
   */
  save: function save() {
    var data = {};
    for (var i = 0, sourceLocale = undefined; sourceLocale = Object.getOwnPropertyNames(this.tableViews)[i]; i++) {
      var tableViews = this.tableViews[sourceLocale];
      for (var j = 0, targetLocale = undefined; targetLocale = Object.getOwnPropertyNames(tableViews)[j]; j++) {
        var tableView = tableViews[targetLocale];
        data[targetLocale] || (data[targetLocale] = tableView.save());
      }
    }

    this.form.appendChild(require('../Templates/IntermediateForm')(data));
    this.form.submit();
  }
});

module.exports = Translations;

},{"../Templates/IntermediateForm":6,"./TranslationTable/TranslationTable.js":4,"Templates/MainApplication":7,"fishbone":39}],6:[function(require,module,exports){
'use strict';

var domjs = require('domjs/lib/html5')(document);

module.exports = function (data) {
  return domjs.build(function () {
    for (var h = 0, locale = undefined; locale = Object.getOwnPropertyNames(data)[h]; h++) {
      var commands = data[locale];

      for (var i = 0, identifier = undefined; identifier = Object.getOwnPropertyNames(commands)[i]; i++) {
        var command = commands[identifier];

        for (var j = 0, key = undefined; key = Object.getOwnPropertyNames(command)[j]; j++) {
          var value = command[key];
          input({
            type: 'hidden',
            name: 'moduleArguments[commands][' + locale + '][' + identifier + '][' + key + ']',
            value: value
          });
        }
      }
    }
  });
};

},{"domjs/lib/html5":12}],7:[function(require,module,exports){
'use strict';

var domjs = require('domjs/lib/html5')(document);

module.exports = function (options) {
  return domjs.build(function () {
    var buttons = {
      top: button('Save'),
      bottom: button('Save')
    };

    options.factory.button(buttons.top());
    options.factory.button(buttons.bottom());

    var app = div(buttons.top, options.table, buttons.bottom);
  }).firstChild;
};

},{"domjs/lib/html5":12}],8:[function(require,module,exports){
'use strict';

var domjs = require('domjs/lib/html5')(document);
var crop = function crop(str, limit) {
  return str.length > limit ? str.substring(0, limit) + '...' : str;
};

module.exports = function (options) {
  return domjs.build(function () {
    var tableBody = tbody();
    var sourceLocale = options.sourceLocale;
    var targetLocale = options.targetLocale;

    var localeSelector = select();
    for (var i = 0; i < options.locales.length; i++) {
      var attributes = { value: options.locales[i] };
      targetLocale === options.locales[i] && (attributes.selected = 'selected');

      localeSelector(option(attributes, options.locales[i].toUpperCase()));
    }

    options.factory.localeSelector(localeSelector());

    var allIdentifiers = Object.getOwnPropertyNames(options.translations);
    for (var i = 0, translations = undefined; translations = options.translations[allIdentifiers[i]]; i++) {
      var source = translations[sourceLocale];
      var target = translations[targetLocale];
      var editable = div();

      tableBody(tr(td(source ? {} : { 'class': 'is-missing' }, source ? crop(source.value, 100) : allIdentifiers[i]), td(target ? {} : { 'class': 'is-missing' }, target ? editable(crop(target.value, 100)) : editable())));

      options.factory.editable(editable(), target || { identifier: allIdentifiers[i] });
    }

    // Build the actual table
    table({ 'class': 'translations-table neos-table' }, thead(tr(th(sourceLocale.toUpperCase()), th({ 'class': 'is-target' }, localeSelector))), tableBody);
  }).firstChild;
};

},{"domjs/lib/html5":12}],9:[function(require,module,exports){
/* ComponentDomParser 0.1.0 | @license MIT */

(function (global, factory) {
    "use strict";

    // If the env is browserify, export the factory using the module object.
    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = factory(global);

        // If the env is AMD, register the Module as 'ComponentDomParser'.
    } else if (global.define && typeof global.define === "function" && global.define.amd) {
        global.define("ComponentDomParser", [], function () {
            return factory(global);
        });

        // If the env is a browser(without CJS or AMD support), export the factory into the global window object.
    } else {
        global.ComponentDomParser = factory(global);
    }
})(window, function (global) {
    "use strict";

    var doc = global.document;

    /*
     * ComponentDomParser
     * @param options {Object} The options Object which initializes the parser.
     * @example
     * // Initialize a new instance of the ComponentDomParser.
     * var parser = new window.ComponentDomParser({
     *     dataSelector: 'app',
     *     componentIndex: {
     *         'myApplication': function(el) { el.innerHTML = 'myApplication initialized!' }
     *     },
     *     componentDidMountCallback: function(instance) {
     *         console.log(instance);
     *     }
     * });
     *
     * // Parse the document for all [data-app] nodes.
     * parser.parse();
     * @constructor
     */
    var ComponentDomParser = function (options) {
        this._checkForRequiredConstants(options);

        this.dataSelector = options.dataSelector;
        this.componentIndex = options.componentIndex;
        this.componentDidMountCallback = options.componentDidMountCallback;
        this.nonIndexedComponentPolicies = options.nonIndexedComponentPolicies || null;
        this._isLoggingEnabled = false || options.isLoggingEnabled;
        this._policyRules = options.nonIndexedComponentPolicies ? Object.keys(options.nonIndexedComponentPolicies) : null;
        this._policyRulesRegex = this._policyRules ? this._policyRules.map(function (policyRule) {
            return new RegExp("^" + policyRule.replace(/[^\w\s]/g, "$&").replace(/\*/g, "\\w+") + "$");
        }) : null;
        this._mountedElementsCache = [];
    };

    ComponentDomParser.prototype._checkForRequiredConstants = function (options) {
        if (!options) {
            throw new Error("ComponentDomParser Error: No option object was specified.");
        }

        if (!options.dataSelector) {
            throw new Error("ComponentDomParser Error: No dataSelector was specified.");
        }

        if (!options.componentIndex) {
            throw new Error("ComponentDomParser Error: No componentIndex was specified.");
        }

        if (options.componentDidMountCallback && typeof options.componentDidMountCallback !== "function") {
            throw new Error("ComponentDomParser Error: The componentDidMountCallback option must be a function.");
        }
    };

    ComponentDomParser.prototype.parse = function (contextElement) {
        contextElement = contextElement || doc.body;

        var elementNodeList = contextElement.querySelectorAll("[data-" + this.dataSelector + "]");
        var elementNodes = Array.prototype.slice.call(elementNodeList, 0);
        var self = this;

        elementNodes.forEach(function (node) {
            var componentKey = node.dataset[self.dataSelector];
            var Component = self.componentIndex[componentKey] || self._getNonIndexComponentPolicy(node, componentKey);

            if (Component) {
                if (self._mountedElementsCache.indexOf(node) < 0) {
                    self._mountComponent(node, Component);
                }
            } else if (this._isLoggingEnabled) {
                console.info("ComponentDomParser Info: Component \"" + componentKey + "\" isn`t present in the passed componentIndex while mounting a node.", self.componentIndex, node);
            }
        });

        return this;
    };

    ComponentDomParser.prototype._mountComponent = function (node, Component) {
        var instance = new Component(node);

        this._mountedElementsCache.push(node);

        if (this.componentDidMountCallback) {
            this.componentDidMountCallback(instance);
        }

        return instance;
    };

    ComponentDomParser.prototype._getNonIndexComponentPolicy = function (node, componentKey) {
        var nonIndexedComponentPolicies = this.nonIndexedComponentPolicies;

        if (nonIndexedComponentPolicies) {
            var policyRule = null;
            var policyRuleRegex = null;

            for (var i = 0; (policyRule = this._policyRules[i]) && (policyRuleRegex = this._policyRulesRegex[i]); i++) {
                if (componentKey.match(policyRuleRegex)) {
                    var policyHandler = nonIndexedComponentPolicies[policyRule];
                    var policyConstructor = policyHandler(componentKey, node);

                    if (policyConstructor) {
                        return policyConstructor;
                    }
                }
            }
        }

        return false;
    };


    ComponentDomParser.prototype.addComponent = function (componentKey, Component) {
        this.componentIndex[componentKey] = Component;

        return this;
    };

    return ComponentDomParser;
});

},{}],10:[function(require,module,exports){
'use strict';

var forEach       = Array.prototype.forEach
  , map           = Array.prototype.map
  , slice         = Array.prototype.slice
  , keys          = Object.keys
  , reserved      = require('es5-ext/lib/reserved')
  , isFunction    = require('es5-ext/lib/Function/is-function')
  , partial       = require('es5-ext/lib/Function/prototype/partial')
  , dscope        = require('./dscope')
  , compact       = require('es5-ext/lib/Array/prototype/compact')
  , contains      = require('es5-ext/lib/Array/prototype/contains')
  , flatten       = require('es5-ext/lib/Array/prototype/flatten')
  , isList        = require('es5-ext/lib/Object/is-list')
  , isPlainObject = require('es5-ext/lib/Object/is-plain-object')
  , isObject      = require('es5-ext/lib/Object/is-object')
  , oForEach      = require('es5-ext/lib/Object/for-each')
  , oMap          = require('es5-ext/lib/Object/map')
  , toArray       = require('es5-ext/lib/Array/from')
  , isNode        = require('./is-node')

  , renameReserved, nodeMap, nextInit;

renameReserved = (function (rename) {
	return function (scope) {
		Object.keys(scope).forEach(rename, scope);
	};
}(function (key) {
	if (contains.call(reserved, key)) {
		this['_' + key] = this[key];
		delete this[key];
	}
}));

nodeMap = (function (create) {
	return {
		_cdata: create('createCDATASection'),
		_comment: create('createComment'),
		_text: create('createTextNode')
	};
}(function (method) {
	return function (str) {
		return this.df.appendChild(this.document[method](str || ''));
	};
}));

nodeMap._element = function (name) {
	this.createElement(name, this.processArguments(slice.call(arguments, 1)));
};
nodeMap._direct = function () {
	forEach.call(arguments, this.df.appendChild, this.df);
};
nodeMap._detached = function () {
	return this.processChildren(toArray(arguments)).map(function (el) {
		if (el.parentNode) {
			el.parentNode.removeChild(el);
		}
		return el;
	});
};

nextInit = function (document, extRequire) {
	this.document = document;
	this.require = extRequire || require;
	this.df = this.document.createDocumentFragment();
	this.map = oMap(this.map, function (value) {
		return isFunction(value) ? value.bind(this) : value;
	}, this);
	return this;
};

module.exports = {
	init: (function (setCreate) {
		return function (elMap) {
			this.map = {};
			// attach node methods
			keys(nodeMap).forEach(function (key) {
				this.map[key] = nodeMap[key];
			}, this);
			// attach element methods
			elMap.forEach(setCreate, this);
			renameReserved(this.map);
			this.map._map = this.map;

			this.init = nextInit;
			this.idMap = {};
			return this;
		};
	}(function (name) {
		this.map[name] = this.getCreate(name);
	})),
	build: function (f) {
		var df, predf;
		predf = this.df;
		df = this.df = this.document.createDocumentFragment();
		dscope(isFunction(f) ? f : partial.call(this.require, f), this.map);
		if (predf) {
			this.df = predf;
		}
		return df;
	},
	processArguments: function (args) {
		args = toArray(args);
		return [isPlainObject(args[0]) ? args.shift() : {}, args];
	},
	getCreate: function (name) {
		return function () {
			return this.getUpdate(this.createElement(name,
				this.processArguments(arguments)));
		};
	},
	getUpdate: function (el) {
		return function f() {
			if (!arguments.length) {
				return el;
			}
			this.updateElement(el, this.processArguments(arguments));
			return f;
		}.bind(this);
	},
	createElement: function (name, data) {
		return this.updateElement(this.df.appendChild(
			this.document.createElement(name)
		), data);
	},
	processChildren: function (children) {
		return compact.call(flatten.call(children.map(function self(child) {
			if (isFunction(child)) {
				child = child();
			} else if (!isNode(child) && isList(child) && isObject(child)) {
				return map.call(child, self, this);
			} else if ((typeof child === "string") || (typeof child === "number")) {
				child = this.document.createTextNode(child);
			}
			return child;
		}, this)));
	},
	updateElement: function (el, data) {
		var attrs = data[0], children = data[1], self = this;
		oForEach(attrs, function (value, name) {
			this.setAttribute(el, name, value);
		}, this);
		this.processChildren(children).forEach(el.appendChild, el);
		return el;
	},
	setAttribute: function (el, name, value) {
		if ((value == null) || (value === false)) {
			return;
		} else if (value === true) {
			value = name;
		}
		if (name === 'id') {
			if (this.idMap[value]) {
				console.warn("Duplicate HTML element id: '" + value + "'");
			} else {
				this.idMap[value] = el;
			}
		}
		el.setAttribute(name, value);
	},
	getById: function (id) {
		var current = this.document.getElementById(id);
		!this.idMap[id] && (this.idMap[id] = current);
		return current || this.idMap[id];
	}
};

},{"./dscope":11,"./is-node":13,"es5-ext/lib/Array/from":14,"es5-ext/lib/Array/prototype/compact":15,"es5-ext/lib/Array/prototype/contains":16,"es5-ext/lib/Array/prototype/flatten":18,"es5-ext/lib/Function/is-function":21,"es5-ext/lib/Function/prototype/partial":23,"es5-ext/lib/Object/for-each":27,"es5-ext/lib/Object/is-list":29,"es5-ext/lib/Object/is-object":30,"es5-ext/lib/Object/is-plain-object":31,"es5-ext/lib/Object/map":33,"es5-ext/lib/reserved":38}],11:[function(require,module,exports){
// Dynamic scope for given function
// Pollutes global scope for time of function call

'use strict';

var keys     = Object.keys
  , global   = require('es5-ext/lib/global')
  , reserved = require('es5-ext/lib/reserved').all

  , set, unset;

set = function (scope, cache) {
	keys(scope).forEach(function (key) {
		if (global.hasOwnProperty(key)) {
			cache[key] = global[key];
		}
		global[key] = scope[key];
	});
};

unset = function (scope, cache) {
	keys(scope).forEach(function (key) {
		if (cache.hasOwnProperty(key)) {
			global[key] = cache[key];
		} else {
			delete global[key];
		}
	});
};

module.exports = function (fn, scope) {
	var result, cache = {};
	set(scope, cache);
	result = fn();
	unset(scope, cache);
	return result;
};

},{"es5-ext/lib/global":37,"es5-ext/lib/reserved":38}],12:[function(require,module,exports){
'use strict';

var isFunction = require('es5-ext/lib/Function/is-function')
  , d          = require('es5-ext/lib/Object/descriptor')
  , domjs      = require('./domjs')

  , html5js
  , superSetAttribute = domjs.setAttribute;

html5js = Object.create(domjs, {
	setAttribute: d(function (el, name, value) {
		if ((name.slice(0, 2) === 'on') && isFunction(value)) {
			el.setAttribute(name, name);
			el[name] = value;
		} else {
			superSetAttribute.call(this, el, name, value);
		}
	})
}).init(['a', 'abbr', 'address', 'area', 'article', 'aside', 'audio',
	'b', 'bdi', 'bdo', 'blockquote', 'br', 'button', 'canvas', 'caption', 'cite',
	'code', 'col', 'colgroup', 'command', 'datalist', 'dd', 'del', 'details',
	'device', 'dfn', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption',
	'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header',
	'hgroup', 'hr', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'keygen',
	'label', 'legend', 'li', 'link', 'map', 'mark', 'menu', 'meter', 'nav',
	'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param',
	'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section',
	'select', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary',
	'sup', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'time',
	'tr', 'track', 'ul', 'var', 'video', 'wbr']);

module.exports = function (document, require) {
	return Object.create(html5js).init(document, require);
};

},{"./domjs":10,"es5-ext/lib/Function/is-function":21,"es5-ext/lib/Object/descriptor":26}],13:[function(require,module,exports){
// Whether object is DOM node

'use strict';

module.exports = function (x) {
	return (x && (typeof x.nodeType === "number") &&
		(typeof x.nodeName === "string")) || false;
};

},{}],14:[function(require,module,exports){
'use strict';

var isArray       = Array.isArray
  , slice         = Array.prototype.slice
  , isArguments   = require('../Function/is-arguments');

module.exports = function (obj) {
	if (isArray(obj)) {
		return obj;
	} else if (isArguments(obj)) {
		return (obj.length === 1) ? [obj[0]] : Array.apply(null, obj);
	} else {
		return slice.call(obj);
	}
};

},{"../Function/is-arguments":20}],15:[function(require,module,exports){
// Inspired by: http://documentcloud.github.com/underscore/#compact

'use strict';

var filter = Array.prototype.filter;

module.exports = function () {
	return filter.call(this, Boolean);
};

},{}],16:[function(require,module,exports){
'use strict';

var indexOf = require('./e-index-of');

module.exports = function (searchElement) {
	return indexOf.call(this, searchElement, arguments[1]) > -1;
};

},{"./e-index-of":17}],17:[function(require,module,exports){
'use strict';

var indexOf = Array.prototype.indexOf
  , isNaN   = require('../../Number/is-nan')
  , ois     = require('../../Object/is')
  , value   = require('../../Object/valid-value');

module.exports = function (searchElement) {
	var i;
	if (!isNaN(searchElement) && (searchElement !== 0)) {
		return indexOf.apply(this, arguments);
	}

	for (i = (arguments[1] >>> 0); i < (value(this).length >>> 0); ++i) {
		if (this.hasOwnProperty(i) && ois(searchElement, this[i])) {
			return i;
		}
	}
	return -1;
};

},{"../../Number/is-nan":24,"../../Object/is":32,"../../Object/valid-value":35}],18:[function(require,module,exports){
'use strict';

var isArray   = Array.isArray
  , forEach   = Array.prototype.forEach
  , push      = Array.prototype.push;

module.exports = function flatten() {
	var r = [];
	forEach.call(this, function (x) {
		push.apply(r, isArray(x) ? flatten.call(x) : [x]);
	});
	return r;
};

},{}],19:[function(require,module,exports){
'use strict';

module.exports = function () {
	return arguments;
};

},{}],20:[function(require,module,exports){
'use strict';

var toString = Object.prototype.toString

  , id = toString.call(require('./arguments')());

module.exports = function (x) {
	return toString.call(x) === id;
};

},{"./arguments":19}],21:[function(require,module,exports){
'use strict';

var toString = Object.prototype.toString

  , id = toString.call(require('./noop'));

module.exports = function (f) {
	return (typeof f === "function") && (toString.call(f) === id);
};

},{"./noop":22}],22:[function(require,module,exports){
'use strict';

module.exports = function () {};

},{}],23:[function(require,module,exports){
'use strict';

var apply    = Function.prototype.apply
  , callable = require('../../Object/valid-callable')
  , toArray  = require('../../Array/from');

module.exports = function () {
	var fn = callable(this)
	  , args = toArray(arguments);

	return function () {
		return apply.call(fn, this, args.concat(toArray(arguments)));
	};
};

},{"../../Array/from":14,"../../Object/valid-callable":34}],24:[function(require,module,exports){
'use strict';

module.exports = function (value) {
	return (value !== value);
};

},{}],25:[function(require,module,exports){
// Internal method, used by iteration functions.
// Calls a function for each key-value pair found in object
// Optionally takes compareFn to iterate object in specific order

'use strict';

var call       = Function.prototype.call
  , keys       = Object.keys
  , isCallable = require('./is-callable')
  , callable   = require('./valid-callable')
  , value      = require('./valid-value');

module.exports = function (method) {
	return function (obj, cb) {
		var list, thisArg = arguments[2], compareFn = arguments[3];
		value(obj);
		callable(cb);

		list = keys(obj);
		if (compareFn) {
			list.sort(isCallable(compareFn) ? compareFn : undefined);
		}
		return list[method](function (key, index) {
			return call.call(cb, thisArg, obj[key], key, obj, index);
		});
	};
};

},{"./is-callable":28,"./valid-callable":34,"./valid-value":35}],26:[function(require,module,exports){
'use strict';

var isCallable = require('./is-callable')
  , callable   = require('./valid-callable')
  , contains   = require('../String/prototype/contains')

  , d;

d = module.exports = function (dscr, value) {
	var c, e, w;
	if (arguments.length < 2) {
		value = dscr;
		dscr = null;
	}
	if (dscr == null) {
		c = w = true;
		e = false;
	} else {
		c = contains.call(dscr, 'c');
		e = contains.call(dscr, 'e');
		w = contains.call(dscr, 'w');
	}

	return { value: value, configurable: c, enumerable: e, writable: w };
};

d.gs = function (dscr, get, set) {
	var c, e;
	if (isCallable(dscr)) {
		set = (get == null) ? undefined : callable(get);
		get = dscr;
		dscr = null;
	} else {
		get = (get == null) ? undefined : callable(get);
		set = (set == null) ? undefined : callable(set);
	}
	if (dscr == null) {
		c = true;
		e = false;
	} else {
		c = contains.call(dscr, 'c');
		e = contains.call(dscr, 'e');
	}

	return { get: get, set: set, configurable: c, enumerable: e };
};

},{"../String/prototype/contains":36,"./is-callable":28,"./valid-callable":34}],27:[function(require,module,exports){
'use strict';

module.exports = require('./_iterate')('forEach');

},{"./_iterate":25}],28:[function(require,module,exports){
// Inspired by: http://www.davidflanagan.com/2009/08/typeof-isfuncti.html

'use strict';

var forEach = Array.prototype.forEach.bind([]);

module.exports = function (obj) {
	var type;
	if (!obj) {
		return false;
	}
	type = typeof obj;
	if (type === 'function') {
		return true;
	}
	if (type !== 'object') {
		return false;
	}

	try {
		forEach(obj);
		return true;
	} catch (e) {
		if (e instanceof TypeError) {
			return false;
		}
		throw e;
	}
};

},{}],29:[function(require,module,exports){
'use strict';

var isFunction = require('../Function/is-function')
  , isObject   = require('./is-object');

module.exports = function (x) {
	return ((x != null) && (typeof x.length === 'number') &&

		// Just checking ((typeof x === 'object') && (typeof x !== 'function'))
		// won't work right for some cases, e.g.:
		// type of instance of NodeList in Safari is a 'function'

		((isObject(x) && !isFunction(x)) || (typeof x === "string"))) || false;
};

},{"../Function/is-function":21,"./is-object":30}],30:[function(require,module,exports){
'use strict';

var map = { function: true, object: true };

module.exports = function (x) {
	return ((x != null) && map[typeof x]) || false;
};

},{}],31:[function(require,module,exports){
'use strict';

var getPrototypeOf = Object.getPrototypeOf
  , prototype      = Object.prototype
  , toString       = prototype.toString

  , id = {}.toString();

module.exports = function (value) {
	return (value && (typeof value === 'object') &&
		(getPrototypeOf(value) === prototype) && (toString.call(value) === id)) ||
		false;
};

},{}],32:[function(require,module,exports){
// Implementation credits go to:
// http://wiki.ecmascript.org/doku.php?id=harmony:egal

'use strict';

module.exports = function (x, y) {
	return (x === y) ?
		((x !== 0) || ((1 / x) === (1 / y))) :
		((x !== x) && (y !== y));
};

},{}],33:[function(require,module,exports){
'use strict';

var forEach = require('./for-each');

module.exports = function (obj, cb) {
	var o = {};
	forEach(obj, function (value, key) {
		o[key] = cb.call(this, value, key, obj);
	}, arguments[2]);
	return o;
};

},{"./for-each":27}],34:[function(require,module,exports){
'use strict';

var isCallable = require('./is-callable');

module.exports = function (fn) {
	if (!isCallable(fn)) {
		throw new TypeError(fn + " is not a function");
	}
	return fn;
};

},{"./is-callable":28}],35:[function(require,module,exports){
'use strict';

module.exports = function (value) {
	if (value == null) {
		throw new TypeError("Cannot use null or undefined");
	}
	return value;
};

},{}],36:[function(require,module,exports){
'use strict';

var indexOf = String.prototype.indexOf;

module.exports = function (searchString) {
	return indexOf.call(this, searchString, arguments[1]) > -1;
};

},{}],37:[function(require,module,exports){
'use strict';

module.exports = new Function("return this")();

},{}],38:[function(require,module,exports){
'use strict';

var freeze  = Object.freeze

  , keywords, future, futureStrict, all;

// 7.6.1.1 Keywords
keywords = freeze(['break', 'case', 'catch', 'continue', 'debugger', 'default', 'delete', 'do',
	'else', 'finally', 'for', 'function', 'if', 'in', 'instanceof', 'new',
	'return', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while',
	'with']);

// 7.6.1.2 Future Reserved Words
future = freeze(['class', 'const', 'enum', 'exports', 'extends', 'import', 'super'])

// Future Reserved Words (only in strict mode)
futureStrict = freeze(['implements', 'interface', 'let', 'package', 'private', 'protected', 'public',
	'static', 'yield']);

all = module.exports = keywords.concat(future, futureStrict);
all.keywords = keywords;
all.future = future;
all.futureStrict = futureStrict;
freeze(all);

},{}],39:[function(require,module,exports){

// Fishbone.js
//
// Version: 1.0.1
// URL: https://github.com/aemkei/fishbone.js
// Author: Martin Kleppe <kleppe@ubilabs.net>
// License: WTFPL

Model =

function _(
  object, // module definition
  key, value, // placeholder
  undefined
){

  // return class constructor
  function Klass(){
    
    // references used across instance
    var target = this,
      observers = {};
  
    // add an event listener
    target.on = function(event, listener){
      // push listerner to list of observers
      (observers[event] || (observers[event] = []))
        .push(listener);
    };
    
    // trigger a given event
    target.trigger = function(event, data){
      for (
        // cycle through all listerners for a given event
        var value = observers[event], key = 0;
        value && key < value.length;
      ){
        // call listener and pass data
        value[key++](data);
      }
    };

    // remove (a single or all) event listener
    target.off = function (event, listener) {
      for (
        // get index of the given listener
        value = observers[event] || [];
        // find all occurrences
        listener && (key = value.indexOf(listener)) > -1;
      ){
        // remove the listener
        value.splice(key, 1);
      }

      // assign the new list
      observers[event] = listener ? value : [];
    };

    // cycle through all properties
    for (key in object) {
      value = object[key];
        
      // test if value is a function
      target[key] = (typeof value == 'function') ?

        // wrap method
        function(){
          // add chainablity if nothing was returned
          return (
            // keep the original context
            value = this.apply(target, arguments)
          ) === undefined ? target : value;
        }.bind(value) :
      
        // copy property
        value;
    }

    target.init && target.init.apply(target, arguments);
  }

  // allow class to be extended
  Klass.extend = function(overrides){
    
    value = {};

    // copy all object properties
    for (key in object){
      value[key] = object[key];
    }

    // override object properties
    for (key in overrides){
      value[key] = overrides[key];
      
      // store reference to super properties
      object[key] !== undefined && (
        value["__" + key] = object[key]
      );
    }

    return _(value);
  };

  return Klass;
};

// make module Node.js compatible
if (typeof module == "object") {
  module.exports = Model;
}
},{}],40:[function(require,module,exports){
/**
 * Single point of entry bootstrap script
 */
'use strict';

var ComponentDomParser = require('componentdomparser');
var parser = new ComponentDomParser({
    dataSelector: 'area',
    componentIndex: {
        'Translations': require('./Components/Translations.js')
    }
});

document.addEventListener('DOMContentLoaded', function () {
    parser.parse();
});

},{"./Components/Translations.js":5,"componentdomparser":9}]},{},[40]);
