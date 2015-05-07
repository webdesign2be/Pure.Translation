let Model = require('fishbone');

/**
 * EditableManager
 *
 * Manage Editable views
 */
let EditableManager = Model({

  /**
   * Constructor
   */
  init : function() {
    this.editables = {
      ordered : [],
      byIdentifier : {},
      currentlyFocused : null
    };

    this.boundHandleDocumentClick = this.handleDocumentClick.bind(this);
    this.boundHandleKeyUp = this.handleKeyUp.bind(this);
  },

  /**
   * Wire all events for this object
   *
   * @return {Object}
   */
  attach : function() {
    document.addEventListener('click', this.boundHandleDocumentClick);
    document.addEventListener('keyup', this.boundHandleKeyUp);

    return this;
  },

  /**
   * Unwire all events for this object
   *
   * @return {Object}
   */
  detach : function() {
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
  handleDocumentClick : function(e) {
    this.freezeCurrent();
    return this;
  },

  /**
   * Keyboard shortcut bindings
   *
   * @param {Object} e The event
   * @return {Object}
   */
  handleKeyUp : function(e) {
    let keyCode = e.wich || e.keyCode || e.charCode;

    switch(keyCode) {
      case 9:
      case 13:
        this.freezeCurrent();
        this.editables.currentlyFocused.next &&
          this.editables.currentlyFocused.next.requestThaw();
      break;

      case 27: this.resetCurrent(); break;
    }

    return this;
  },

  /**
   * Add a new editable
   *
   * @param {Object} ediable The editable
   * @return {Object}
   */
  add : function(editable) {
    this.editables.ordered.push(editable);
    this.editables.ordered[ this.editables.ordered.length - 2 ] &&
      (this.editables.ordered[ this.editables.ordered.length - 2 ].next = editable) &&
      (editable.previous = this.editables.ordered[ this.editables.ordered.length - 2 ]);

    this.editables.byIdentifier[ editable.translation.identifier ] = editable;
  },

  /**
   * Reset currently focused editable to its original state
   *
   * @return {Object}
   */
  resetCurrent : function() {
    this.editables.currentlyFocused && this.editables.currentlyFocused.reset();
    return this;
  },

  /**
   * Leave edit mode for currently active editable and keep its
   * edited state.
   *
   * @return {Object}
   */
  freezeCurrent : function() {
    this.editables.currentlyFocused && this.editables.currentlyFocused.freeze();
    return this;
  },

  /**
   * Switch currently focused editable
   *
   * @param {Object} editable The editable
   * @return {Object}
   */
  requestFocus : function(editable) {
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
  requestThaw : function(editable) {
    if (editable !== this.editables.currentlyFocused) {
      this.requestFocus(editable);
    }

    editable.thaw();
    return this;
  }
});

module.exports = EditableManager;
