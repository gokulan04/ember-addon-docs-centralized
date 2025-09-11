import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { guidFor } from '@ember/object/internals';

export default class DropdownMenu extends Component {
  @tracked isOpen = false;
  @tracked selected;
  @tracked dropdownId = guidFor(this);

  constructor(owner, args) {
    super(owner, args);

    // If no selected passed, pick first option
    // if (args.selected) {
    //   this.selected = args.selected;
    // } else if (Array.isArray(args.options) && args.options.length > 0) {
    //   this.selected = args.options[0];

    //   // Notify parent immediately (optional)
    //   if (args.onChange) {
    //     args.onChange(this.selected);
    //   }
    // }
  }

  @action toggle() {
    this.isOpen = !this.isOpen;
  }
  
  @action onClose() {
    this.isOpen = false
  }

  @action selectItem(item) {
    this.selected = item;
    this.isOpen = false;

    if (this.args.onChange) {
      this.args.onChange(item);
    }
  }
  
  @action
  attachTargetAttrib(elem){
    elem.setAttribute(`data-project-selection-${this.dropdownId}`, '');
  }
}
