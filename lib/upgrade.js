'use strict';

var getWrapper = require('./get-wrapper')
  , requirefy = require('./requirefy')
  , exportify = require('./exportify')
  , style = require('./style')
  ;

/*
 * We need to get AST twice, since ranges go out of sync everytime we modify the code
 * 1. Parse code, find return statement inside requirejs wrapper and replace with assignment to module.exports
 *    This needs to happen before removing the wrapper since requirejs considers returns on script level to be illegal.
 * 2. Parse resulting code, find and replace requirejs wrapper with appropriate commonjs require statements
 */

module.exports = function upgrade(code, options, resolvePath) {

  var wrapper;

  wrapper = getWrapper(code, true);

  // not a requirejs file? signify that no upgrade is needed.
  if (!wrapper) return null;

  var exportified;
  if (wrapper.return) {
    exportified = exportify(code, wrapper.return);
    wrapper = getWrapper(exportified, false);
  } else {
    exportified = code;
  }

  return requirefy(exportified, options, resolvePath);
};
