'use strict';

const HBSContentFilter = require('../broccoli/hbs-content-filter');

module.exports = class HBSContentExtractor {
  constructor(bridge, placeHolder) {
    this.name = 'hbs-content-extractor';
    this.ext = ['hbs'];
    this._bridge = bridge;
    this.placeHolder = placeHolder;
  }

  toTree(tree) {
    let contentsTree = new HBSContentFilter(tree);
    this._bridge.fulfill(this.placeHolder, contentsTree);
    return tree;
  }
};
