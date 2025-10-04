import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { guidFor } from '@ember/object/internals';
import { addonDocsConfig } from 'ember-cli-addon-docs/-private/config';

export default class DropdownMenu extends Component {
  @tracked isOpen = false;
  @tracked selected;
  @tracked dropdownId = guidFor(this);
  @tracked options = [];

  @addonDocsConfig config;
  
  constructor(owner, args) {
    super(owner, args);
    this.setOptions();
  }
  
  setOptions(){
    let projects = this.config.projects;
    for(let project in projects){
      this.options.push(projects[project]);
    }
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
