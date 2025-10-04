import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { addonDocsConfig } from 'ember-cli-addon-docs/-private/config';

export default class AddonManagerService extends Service {
    @addonDocsConfig config; 
    @tracked currentProjectName = "";
    
    constructor() {
        super(...arguments);
        this.setCurrentProject(this.config.projects[Object.keys(this.config.projects)[0]].projectName);
    }
    
    get currentProject(){
        return this.config.projects[this.currentProjectName];
    }
    
    setCurrentProject(currentProjectName){
        this.currentProjectName = currentProjectName;
    }
}
