'use strict';

const EmberAddon = require('ember-cli/lib/broccoli/ember-addon');
const Project = require('ember-cli/lib/models/project');
const MergeTrees = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');

const path = require('path');
const styleDir = path.join(__dirname, 'addon', 'styles');

module.exports = function (defaults) {
  let project = Project.closestSync(process.cwd());

  project.pkg['ember-addon'].paths = ['sandbox'];

  defaults.project = project;

  var app = new EmberAddon(defaults, {
    project,
    vendorFiles: { 'jquery.js': null, 'app-shims.js': null },

    // Workaround for https://github.com/ember-cli/ember-cli/issues/8075
    'ember-cli-terser': {
      terser: {
        compress: {
          collapse_vars: false,
        },
      },
    },

    'ember-cli-addon-docs': {
      documentingAddonsAt: ['node_modules/ember-cli-clipboard', 
                            'node_modules/@admindroid/droid-simple-tree', 
                            'node_modules/@admindroid/ember-echarts', 
                            'node_modules/@admindroid/droid-common-utils-helpers',
                            'node_modules/ember-tether']
    },
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
        ],
      },
    },
  });

  const { maybeEmbroider } = require('@embroider/test-setup');
  return maybeEmbroider(app, {
    skipBabel: [
      {
        package: 'qunit',
      },
    ],
  });
};
