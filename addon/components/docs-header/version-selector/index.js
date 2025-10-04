import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { alias, reads } from '@ember/object/computed';
import { action } from '@ember/object';
import { A } from '@ember/array';
import { cached } from 'tracked-toolbox';

export default class VersionSelector extends Component {
  @service projectVersion;

  @service addonManager;
  
  @alias('addonManager.currentProject')
  currentProject;

  @reads('projectVersion.currentVersion')
  currentVersion;

  @cached
  get sortedVersions() {
    let versions = A(this.projectVersion.versions);
    let latest = versions.find(
      (version) => version.key === this.currentProject.latestVersionName,
    );
    let primary = versions.find(
      (version) => version.key === this.currentProject.primaryBranch,
    );
    let otherTags = versions
      .reject((v) => [latest, primary].includes(v))
      .sort((tagA, tagB) => {
        let keyA = tagA.key;
        let keyB = tagB.key;

        if (keyA > keyB) {
          return -1;
        }
        if (keyA < keyB) {
          return 1;
        }

        // names must be equal
        return 0;
      });

    return [latest, primary, ...otherTags].filter(Boolean);
  }

  get lastVersion() {
    return this.sortedVersions[this.sortedVersions.length - 1];
  }

  @action
  changeVersion(version) {
    this.projectVersion.redirectTo(version);
  }
}
