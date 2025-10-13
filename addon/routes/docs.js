import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class DocsRoute extends Route {
  @service store;
  @service addonManager;
  
  model() {
    return this.store.findRecord(
      'project',
      this.addonManager.currentProject.projectName,
    );
  }
}
