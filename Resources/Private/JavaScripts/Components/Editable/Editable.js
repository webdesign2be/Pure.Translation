let Model = require('fishbone');

/**
 * Editable
 *
 * A View that handles the editing capabilities of editable cells
 * in a translation table
 */
let Editable = Model({

  /**
   * Constructor
   */
  init : function(el, translation, manager) {
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
  requestThaw : function(e) {
    e && e.stopPropagation();
    this.manager.requestThaw(this);
    return this;
  },

  /**
   * Ask edit manager to gain focus
   *
   * @return {Object}
   */
  requestFocus : function(e) {
    e && e.stopPropagation();
    this.manager.requestFocus(this);

    return this;
  },

  /**
   * Set the current value
   *
   * @return {Object}
   */
  setValue : function(value) {
    this.isDirty = (this.translation.origin !== value);
    this.translation.value = value;
    this.reset();

    return this;
  },

  /**
   * Gain focus
   *
   * @return {Object}
   */
  focus : function() {
    return this;
  },

  /**
   * Lose focus
   *
   * @return {Object}
   */
  blur : function() {
    this.freeze();
    return this;
  },

  /**
   * Enter edit mode
   *
   * @return {Object}
   */
  thaw : function() {
    if (!this.isEditState) {
      let input = require('./Templates/EditState.js')(this.translation).firstChild;
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
  freeze : function() {
    if (this.statefulEl !== this.el) {
      let value = {
        from : this.translation.value,
        to : this.statefulEl.value
      };

      this.setValue(value.to);
      
      if (this.isDirty) {
        this.trigger('change', {
          editable : this,
          packageKey : this.translation.packageKey,
          locale : this.translation.localeCode,
          sourceName : this.translation.sourceName,
          identifier : this.translation.identifier,
          value : value
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
  reset : function() {
    this.parent.replaceChild(this.el, this.statefulEl);
    this.statefulEl = this.el;
    this.el.innerHTML = this.translation.value;
    this.isEditState = false;

    this.parent.classList.remove('is-editing');
    this.parent.classList[ this.isDirty ? 'add' : 'remove' ]('editor-dirty');

    return this;
  },

  /**
   * Destroy the object
   *
   * @return {Object}
   */
  destroy : function() {
    return this;
  }
});

module.exports = Editable;
