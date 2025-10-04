import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { localCopy } from 'tracked-toolbox';
import { classify } from '@ember/string';
import { addonLogo } from 'ember-cli-addon-docs/utils/computed';
import { alias } from '@ember/object/computed';
export default class XNav extends Component {
  @service addonManager;
  
  @alias('addonManager.currentProject')
  currentProject;

  @localCopy('args.root', 'docs')
  root;

  @service store;

  @tracked isShowingMenu;

  get addonLogo() {
    return addonLogo(this.currentProject.projectName);
  }

  get addonTitle() {
    let logo = this.addonLogo;

    return classify(this.currentProject.projectName.replace(`${logo}-`, ''));
  }

  get project() {
    if (this.args.project) {
      return this.args.project;
    }

    return this.store.peekRecord('project', this.currentProject.projectName);
  }
}
