import Service from '@ember/service';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { addonDocsConfig } from 'ember-cli-addon-docs/-private/config';
import { set } from '@ember/object';
import { computed } from '@ember/object';
export default class AddonManagerService extends Service {
    @addonDocsConfig config; 
    @service router;
    @tracked currentProjectName = "";
    
    constructor() {
        super(...arguments);
        let addonRouteName = this.router.currentRoute.parent.name.split('.')[0];
        let currentProjectName = addonRouteName == "application" ? this.config.projects[Object.keys(this.config.projects)[0]].projectName : addonRouteName;
        this.setCurrentProject(currentProjectName);
        this.router.on('routeDidChange', (transition) => {
            this.setCurrentProject(transition.to.parent.name.split('.')[0])
        });
    }
    
    @computed('currentProjectName')
    get currentProject(){
        return this.config.projects[this.currentProjectName];
    }
    
    get hostProjectInfo(){
        return this.config.hostProjectInfo;
    }
    
    setCurrentProject(currentProjectName){
        set(this,"currentProjectName", currentProjectName);
    }
}
