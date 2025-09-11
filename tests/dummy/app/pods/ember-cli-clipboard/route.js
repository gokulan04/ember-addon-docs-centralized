import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class EmberCliClipboardRoute extends Route {
  @service store;

  model() {
    return this.store.findRecord('project', 'ember-cli-clipboard');
  }
}
