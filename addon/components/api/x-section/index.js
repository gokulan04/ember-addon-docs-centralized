import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
/**
  @class Api/XSection
  @hide
*/
export default class XSection extends Component {
  @service addonManager;

  @alias('addonManager.currentProject')
  currentProject;

  /**
   * Params shouldn't be displayed when there are no descriptions and no subparams,
   * because the information is already displayed in the type signature and redundant
   *
   * @function
   * @hide
   */
  get shouldDisplayParams() {
    let params = this.args.item?.params || [];

    return params.some((p) => p.description || p.name.includes('.'));
  }
}
