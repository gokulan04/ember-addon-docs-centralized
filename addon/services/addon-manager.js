import Service from '@ember/service';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { addonDocsConfig } from 'ember-cli-addon-docs/-private/config';

export default class AddonManagerService extends Service {
    @addonDocsConfig config; 
    @service router;
    @tracked currentProjectName = "";
    
    constructor() {
        super(...arguments);
        let parentRouteName = this.router.currentRoute.parent.name;
        let currentProjectName = parentRouteName == "application" ? this.config.projects[Object.keys(this.config.projects)[0]].projectName : parentRouteName;
        this.setCurrentProject(currentProjectName);
        this.router.on('routeDidChange', (transition) => this.setCurrentProject(transition.to.parent.name));
    }
    
    get currentProject(){
        return this.config.projects[this.currentProjectName];
    }
    
    setCurrentProject(currentProjectName){
        this.currentProjectName = currentProjectName;
    }
}
