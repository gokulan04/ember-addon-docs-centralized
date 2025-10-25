'use strict';

const fs = require('fs');
const path = require('path');
const UnwatchedDir = require('broccoli-source').UnwatchedDir;
const MergeTrees = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');
const EmberApp = require('ember-cli/lib/broccoli/ember-app'); // eslint-disable-line n/no-unpublished-require
const Plugin = require('broccoli-plugin');
const walkSync = require('walk-sync');
const stringUtil = require('ember-cli-string-utils');

const LATEST_VERSION_NAME = '-latest';
const styleDir = path.join(__dirname, 'addon', 'styles');

module.exports = {
  name: require('./package').name,

  LATEST_VERSION_NAME,

  options: {
    postcssOptions: {
      compile: {
        extension: 'scss',
        enabled: true,
        parser: require('postcss-scss'),
        plugins: [
          {
            module: require('@csstools/postcss-sass'),
            options: {
              includePaths: [styleDir],
            },
          },
          require('tailwindcss')(
            path.join(__dirname, 'addon', 'styles', 'tailwind.config.js'),
          ),
        ],
      },
    },

    svgJar: {
      sourceDirs: ['public', `${__dirname}/public`, 'tests/dummy/public'],
      optimizer: {
        plugins: [
          {
            removeAttrs: {
              attrs: ['fill'],
            },
          },
        ],
      },
    },
  },
  config(env, baseConfig) {
    let documentingAddons = this._documentingAddonAt() || {}; // addon project structure {name: path}

    let userConfig = this._readUserConfig();

    let docsAppPathInRepo = path.relative(
      this._getRepoRoot(),
      path.join(
        path.resolve(path.dirname(this.project.configPath()), '..'),
        'app',
      ),
    );

    // Build projects object keyed by package name
    let projects = {};

    Object.entries(documentingAddons).forEach(([addonName, addonPath]) => {
      addonName = removeScope(addonName);
      let pkg = require(path.join(addonPath, 'package.json'));
      let repo = pkg.repository;
      // let info = require('hosted-git-info').fromUrl(repo.url || repo);

      let addonPathInRepo = path.relative(
        this._getRepoRoot(),
        path.join(addonPath, this._addonSrcFolder(addonPath)),
      );

      projects[addonName] = {
        projectName: addonName,
        projectDisplayName: dedasherize(addonName),
        projectDescription: pkg.description,
        projectTag: pkg.version,
        projectHref: repo.url,
        docsAppPathInRepo,
        addonPathInRepo,
        primaryBranch: userConfig.getPrimaryBranch(),
        latestVersionName: LATEST_VERSION_NAME,
        deployVersion: 'ADDON_DOCS_DEPLOY_VERSION',
        searchTokenSeparator: '\\s+',
        showImportPaths: true,
    };
  });

  // // If no documenting addons, fallback to main project
  // if (Object.keys(projects).length === 0) {
  //   let pkg = this.parent.pkg;
  //   let repo = pkg.repository;
  //   let info = require('hosted-git-info').fromUrl(repo.url || repo);

  //   let addonPathInRepo = path.relative(
  //     this._getRepoRoot(),
  //     path.join(this.project.root, this._addonSrcFolder(this.project.root)),
  //   );

  //   projects[pkg.name] = {
  //     projectName: pkg.name,
  //     projectDisplayName: dedasherize(pkg.name),
  //     projectDescription: pkg.description,
  //     projectTag: pkg.version,
  //     projectHref: info && info.browse(),
  //     docsAppPathInRepo,
  //     addonPathInRepo,
  //     primaryBranch: userConfig.getPrimaryBranch(),
  //     latestVersionName: LATEST_VERSION_NAME,
  //     deployVersion: 'ADDON_DOCS_DEPLOY_VERSION',
  //     searchTokenSeparator: '\\s+',
  //     showImportPaths: true,
  //   };
  // }

  // Final config
  let config = {
    'ember-cli-addon-docs': {
      projects, // object keyed by addon name
      hostProjectInfo:  this.project._packageInfo.pkg
      }
    };

    let updatedConfig = Object.assign({}, baseConfig, config);

    // Augment config with addons we depend on
    updatedConfig = this.addons.reduce((config, addon) => {
      if (addon.config) {
        config = Object.assign({}, addon.config(env, config), config);
      }
      return config;
    }, updatedConfig);

    return updatedConfig;
  },

  included(includer) {
    if (includer.parent) {
      throw new Error(
        `ember-cli-addon-docs should be in your package.json's devDependencies`,
      );
    } else if (includer.name === this.project.name()) {
      if (this._documentingAddonAt()) {
        // we're being used in a standalone documentation app that documents an
        // addon but is not that addon's dummy app.
      } else {
        throw new Error(
          `to use ember-cli-addon-docs in an application (as opposed to an addon) you must set documentingAddonAt`,
        );
      }
    }

    includer.options.includeFileExtensionInSnippetNames =
      includer.options.includeFileExtensionInSnippetNames || false;
    if (!includer.options.snippetSearchPaths) {
      // if (this._documentingAddonAt()) {
        // we are a standalone app, so our code is here
        // includer.options.snippetSearchPaths = ['app'];
      // } else {
        // we are inside the addon, so our code is here
        includer.options.snippetSearchPaths = ['tests/dummy/app']; // always points to this folder as we always refers documenting addons
      // }
    }

    if (!includer.options.snippetRegexes) {
      includer.options.snippetRegexes = [
        {
          begin: /{{#(?:docs-snippet|demo\.example)\s+name=['"](\S+)['"]/,
          end: /{{\/(?:docs-snippet|demo\.example)}}/,
        },
        {
          begin:
            /<(?:DocsSnippet|demo\.example)\s+@name=['"](\S+)['"].*(?<!\/)>/,
          end: /<\/(?:DocsSnippet|demo\.example)>/,
        },
      ];
    }

    let snippetExtensions = includer.options.snippetExtensions;

    if (!Array.isArray(includer.options.snippetExtensions)) {
      snippetExtensions = [
        'ts',
        'js',
        'css',
        'scss',
        'hbs',
        'md',
        'text',
        'json',
        'handlebars',
        'htmlbars',
        'html',
        'diff',
      ];
    }

    includer.options.snippetExtensions = snippetExtensions;

    // This must come after we add our own options above, or else other addons won't see them.
    this._super.included.apply(this, arguments);

    const hasPlugins = this.project.addons.some(function (addon) {
      const isPlugin =
        addon.pkg.keywords.indexOf('ember-cli-addon-docs-plugin') !== -1;
      const isPluginPack =
        addon.pkg.keywords.indexOf('ember-cli-addon-docs-plugin-pack') !== -1;
      return isPlugin || isPluginPack;
    });

    if (!hasPlugins) {
      this.ui.writeWarnLine(
        'ember-cli-addon-docs needs plugins to generate API documentation. You can install the default with `ember install ember-cli-addon-docs-yuidoc`',
      );
    }

    this.addonOptions = Object.assign(
      {},
      includer.options['ember-cli-addon-docs'],
    );
    this.addonOptions.projects = Object.assign({}, this.addonOptions.projects);

    let importer = findImporter(this);

    importer.import('vendor/lunr/lunr.js', {
      using: [{ transformation: 'amd', as: 'lunr' }],
    });
  },

  createDeployPlugin() {
    const AddonDocsDeployPlugin = require('./lib/deploy/plugin');
    return new AddonDocsDeployPlugin(this._readUserConfig());
  },

  contentFor(type) {
    if (type === 'body') {
      return fs.readFileSync(
        `${__dirname}/vendor/ember-cli-addon-docs/github-spa.html`,
        'utf-8',
      );
    }
  },

  treeForAddon(tree) {
    let dummyAppFiles = new FindDummyAppFiles([this.app.trees.app]);
    let documentingAddons = this._getAllDocumentingAddon(); // { addonName: addon }

    let addonFiles = [];

    if (documentingAddons && Object.keys(documentingAddons).length > 0) {
      Object.entries(documentingAddons).forEach(([addonName, addon]) => {
        let addonSrcDir = path.join(addon.root, this._addonSrcFolder(addon.root));
        if (fs.existsSync(addonSrcDir)) {
          addonFiles.push(
            new Funnel(new FindAddonFiles([addonSrcDir]), {
              destDir: `addon-docs/${addonName}`, // namespace by addon name
            })
          );
        }
      });
    }

    return this._super(new MergeTrees([tree, dummyAppFiles, ...addonFiles]));
  },

  treeForVendor(vendor) {
    return new MergeTrees([vendor, this._lunrTree()].filter(Boolean));
  },

  getBroccoliBridge() {
    if (!this._broccoliBridge) {
      const Bridge = require('broccoli-bridge');
      this._broccoliBridge = new Bridge();
    }
    return this._broccoliBridge;
  },

  /**
   * Reads Markdown templates
   * compiles them into .hbs
   * 
   */
  treeForApp(tree) {
    if (!this._appTree) {
      let { app, templates } = this.app.trees;
      let appTree = new MergeTrees([new Funnel(app), new Funnel(templates)], {
        overwrite: true,
        annotation: 'app md & templates',
      });
      let TemplateCompiler = require('./lib/preprocessors/markdown-template-compiler');
      const templateCompiler = new TemplateCompiler();
      appTree = templateCompiler.toTree(appTree);
      appTree = new Funnel(appTree, {
        include: [/.*\.hbs/],
        annotation: 'app templates',
      });
      this._appTree = this._super(new MergeTrees([tree, appTree]));
    }
    return this._appTree;
  },

  /**
   * Build and compile the actual documentation content 
   * and search index into /public.
   * 
   */
 treeForPublic(tree) {
  let documentingAddons = this._getAllDocumentingAddon(); // { addonName: addonPath }
  if (!documentingAddons || Object.keys(documentingAddons).length === 0) {
    return tree;
  }

  let ContentExtractor = require('./lib/preprocessors/hbs-content-extractor');
  let appTree = this._treeFor('app');
  // Narrow it down to just the pods folder
  let podsTree = new Funnel(appTree, { srcDir: 'pods/'});

  let PluginRegistry = require('./lib/models/plugin-registry');
  let DocsCompiler = require('./lib/broccoli/docs-compiler');
  let SearchIndexer = require('./lib/broccoli/search-indexer');

  let project = this.project;
  let docsTrees = [];
  let searchIndexTrees = [];

  this.addonOptions.projects = this.addonOptions.projects || {};

  Object.entries(documentingAddons).forEach(([addonName, addon]) => {
    addonName = removeScope(addonName);
    if (!this.addonOptions.projects[addonName]) {
      this.addonOptions.projects[addonName] = generateDefaultProject(
        addon,
        this._addonSrcFolder(addon.root)
      );
    }
    let addonSourceTree = this.addonOptions.projects[addonName];
    let pluginRegistry = new PluginRegistry(project);

    let docsGenerators = pluginRegistry.createDocsGenerators(addonSourceTree, {
      destDir: 'docs',
      project,
      parentAddon: { name: addonName, root: addon.root },
    });

    let docsTree = new DocsCompiler(docsGenerators, {
      name: addonName,
      project,
    });

    docsTrees.push(docsTree);

    const contentExtractor = new ContentExtractor(this.getBroccoliBridge(), `template-contents-${addonName}`);
    let addonPodsTree = new Funnel(podsTree,{srcDir:`${addonName}/`});
    contentExtractor.toTree(addonPodsTree);
    
    // Each addon gets its own search index file
    let templateContentsTree = this.getBroccoliBridge().placeholderFor(`template-contents-${addonName}`);
    let searchIndexTree = new SearchIndexer(
      new MergeTrees([docsTree, templateContentsTree], {
        annotation: `SearchIndexer for ${addonName}`,
      }),
      {
        outputFile: `ember-cli-addon-docs/search-index-${addonName}.json`,
        config: this.project.config(EmberApp.env()),
        projectName: addonName
      }
    );

    searchIndexTrees.push(searchIndexTree);
  });

  return new MergeTrees(
    [this._super(tree), ...docsTrees, ...searchIndexTrees],
    { annotation: 'this._super(tree), docsTrees, searchIndexTrees' }
  );
},

  _lunrTree() {
    return new Funnel(path.dirname(require.resolve('lunr/package.json')), {
      destDir: 'lunr',
    });
  },

  _readUserConfig() {
    if (!this._userConfig) {
      const readConfig = require('./lib/utils/read-config');
      this._userConfig = readConfig(this.project);
    }

    return this._userConfig;
  },

  _getRepoRoot() {
    if (!this._repoRoot) {
      this._repoRoot = require('git-repo-info')().root;
    }
    return this._repoRoot;
  },

  // returns the absolute path to the addon we're documenting when
  // ember-cli-addon-docs is being used by an *app* (not an addon) that has
  // explicitly set `documentingAddonAt`.
  _documentingAddonAt() {
    if (this._cachedDocumentingAddonAt === undefined && this.app) {
      if (
        this.app.options['ember-cli-addon-docs'] &&
        this.app.options['ember-cli-addon-docs'].documentingAddonsAt
      ) {
        this._cachedDocumentingAddonAt = [];
        this.app.options['ember-cli-addon-docs'].documentingAddonsAt.forEach(addonPath => {
          let resolvedPath = path.resolve(this.project.root, addonPath);
          let pkgPath = path.join(resolvedPath, 'package.json');
          let pkg = require(pkgPath);
          this._cachedDocumentingAddonAt[pkg.name] = resolvedPath;
        });
      } else {
        this._cachedDocumentingAddonAt = null;
        throw new Error(
          `No documenting addons were mentioned in ember-cli-build`
        );
      }
    }
    return this._cachedDocumentingAddonAt;
  },

  // returns path of the addon source code relative to the addon root folder.
  _addonSrcFolder(documentingAddonAt="") {
    // if (this._cachedAddonSrcFolder === undefined) {  // no need cache here as addonsrcFolder may differ for v1 and v2 addons
      if (
        this.app &&
        this.app.options['ember-cli-addon-docs'] &&
        this.app.options['ember-cli-addon-docs'].addonSrcFolder
      ) {
        this._cachedAddonSrcFolder =
          this.app.options['ember-cli-addon-docs'].addonSrcFolder;
      } else if(documentingAddonAt){
        let pkg = require(path.join(documentingAddonAt, 'package.json'));
        this._cachedAddonSrcFolder =
          pkg['ember-addon'].version === 2 ? 'dist' : 'addon'; // pointing to dist as we refer v2 addon
      }
    // }
    return this._cachedAddonSrcFolder;
  },

  _getAllDocumentingAddon(){
    let addonPaths = this._documentingAddonAt();
    let addonToDocument = {};
    for (let addons in addonPaths){
      addonToDocument[addons] = this._documentingAddon(addonPaths[addons]);
    }
    return addonToDocument;
  },
  
_documentingAddon(documentingAddonAt) {


  let addons = "";
  if (documentingAddonAt) {
      let addon = this.project.addons.find((a) => a.root === documentingAddonAt);
      if (!addon) {
        throw new Error(
          `You set documentingAddonAt to point at ${documentingAddonAt} but that addon does not appear to be present in this app.`,
        );
      }
      return addon;
  } else {
    // fallback: use parent project as single addon
    addons = this.parent.findAddonByName(this.parent.name());
  }

  return addons;
}
};

function findImporter(addon) {
  if (typeof addon.import === 'function') {
    // If addon.import() is present (CLI 2.7+) use that
    return addon;
  } else {
    // Otherwise, reuse the _findHost implementation that would power addon.import()
    let current = addon;
    let app;
    do {
      app = current.app || app;
    } while (current.parent.parent && (current = current.parent));
    return app;
  }
}

function generateDefaultProject(parentAddon, addonSrcFolder) {
  let includeFunnels = [
    // We need to be very careful to avoid triggering a watch on the addon root here
    // because of https://github.com/nodejs/node/issues/15683
    new Funnel(new UnwatchedDir(parentAddon.root), {
      include: ['package.json', 'README.md'],
    }),
  ];
  let addonTreePath = path.join(parentAddon.root, addonSrcFolder);
  let testSupportPath = path.join(
    parentAddon.root,
    parentAddon.treePaths['addon-test-support'],
  );

  if (fs.existsSync(addonTreePath)) {
    includeFunnels.push(
      new Funnel(addonTreePath, {
        destDir: parentAddon.name,
      }),
    );
  }

  if (fs.existsSync(testSupportPath)) {
    includeFunnels.push(
      new Funnel(testSupportPath, {
        destDir: `${parentAddon.name}/test-support`,
      }),
    );
  }

  return new MergeTrees(includeFunnels);
}

function dedasherize(name){
  if (!name) return '';

  return name
    .split('-')                    
    .map(part => stringUtil.capitalize(part.charAt(0)) + part.slice(1)) 
    .join(' ');      
}

function removeScope(packageName) { // @admindroid/droid-addon --> droid-addon
  // Check if the package name starts with a scope
  if (packageName.startsWith('@')) {
      return packageName.split('/')[1];
  }
  return packageName;
}

class FindDummyAppFiles extends Plugin {
  build() {
    let addonPath = this.inputPaths[0];
    let paths = walkSync(addonPath, { directories: false });
    let pathsString = JSON.stringify(paths);

    fs.writeFileSync(
      path.join(this.outputPath, 'app-files.js'),
      `export default ${pathsString};`,
    );
  }
}

class FindAddonFiles extends Plugin {
  build() {
    let addonPath = this.inputPaths[0];
    let paths = addonPath ? walkSync(addonPath, { directories: false }) : [];
    let pathsString = JSON.stringify(paths);

    fs.writeFileSync(
      path.join(this.outputPath, 'addon-files.js'),
      `export default ${pathsString};`,
    );
  }
}
