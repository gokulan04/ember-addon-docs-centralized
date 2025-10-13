import Component from '@glimmer/component';
import {
  addonPrefix,
  unprefixedAddonName,
} from 'ember-cli-addon-docs/utils/computed';
import { classify } from '@ember/string';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';

/**
  A component that renders a hero banner. Useful for your docs site's homepage.

  ```hbs
  <DocsHero
    @prefix="Ember"
    @heading="SuperAddon"
    @byline="The best addon ever. Now playing in theaters."
  />
  ```

  @class DocsHero
  @public
*/
export default class DocsHeroComponent extends Component {
  @service addonManager;
  
  @alias('addonManager.config.hostProjectInfo')
  hostProjectInfo;

  /**
    The prefix to show, typically of: 'Ember', 'EmberCLI', or 'EmberData'

    @argument prefix
    @type String
  */
  get prefix() {
    return this.args.prefix ?? addonPrefix(this.hostProjectInfo.name);
  }

  /**
    The logo's main heading

    @argument heading
    @type String
  */
  get heading() {
    return (
      this.args.heading ??
      classify(unprefixedAddonName(this.hostProjectInfo.name))
    );
  }

  /**
    Byline for the logo

    @argument byline
    @type String
  */
  get byline() {
    return this.args.byline ?? this.hostProjectInfo.description;
  }
}
