'use strict';
var util       =  require('util')
  , getWrapper =  require('./get-wrapper')
  , style      =  require('./style')
  , format     =  util.format
  , log        =  require('npmlog')
  ;

module.exports = function requirefy(code, options, resolvePath) {

  function removeRequirejs(code, head, tail) {
    var top = code.substring(0, head.start - 1);
    var mid = code.substring(head.end, tail.start);
    var bot = code.substring(tail.end);

    return (top.length ? '\n' + top : '') 
      + style.tabLeft(mid, options.indent) 
      + bot;
  }

  function generateHead(wrapper) {
    var requires = [];

    if (wrapper.paths.length !== wrapper.params.length) {
      log.warn('browserify-ftw',
        'number of paths [' + wrapper.paths + '] does not match number of parameters to callback [' + wrapper.params + ']'
      );
    }

    for (var i = 0; i < wrapper.paths.length; i++) {
      var name = wrapper.params[i]
        , resolvedPath = resolvePath(wrapper.paths[i]);

      if (name)
        requires.push({ named: true, string: format('%s = require(%s%s%s)', name, options.quote, resolvedPath, options.quote) });
      else 
        requires.push({ named: false, string: format('require(%s%s%s)',options.quote, resolvedPath, options.quote) });
    }

    var head;
    switch (options.style) {
      case 'var':
        head = requires.map(function (r) {
          return r.named ? 'var ' + r.string + ';' : r.string + ';';
        });
        break;
      case 'comma':
        var noname = [];
        head = [];
        for( var i = 0; i < requires.length; i++ ) {
          var r = requires[i],
            str;
          if(r.named) {
            head.push(i === 0 ? 'var ' + r.string + ',' : style.spaces(options.indent) + r.string + ',');
          } else {
            noname.push(r.string + ';');
          }
        }
        str = head[head.length-1];
        head[head.length-1] = str.substr(0, str.length - 1) + ';';
        if(noname.length > 0) {
          head = head.concat(noname);
        }
        break;
      case 'comma-first':
        var noname = [];
        head = [];
        for( var i = 0; i < requires.length; i++ ) {
          var r = requires[i];
          if(r.named) {
            head.push(i === 0 ? 'var ' + r.string : style.spaces(options.indent) + ', ' + r.string);
          } else {
            noname.push(r.string + ';');
          }
        }
        head[head.length-1] += ';';
        if(noname.length > 0) {
          head = head.concat(noname);
        }
        break;
    }
    return head.join('\n');
  }

  var wrapper = getWrapper(code)
    , head = generateHead(wrapper)
    , tail = removeRequirejs(code, wrapper.head, wrapper.tail);

  return head + '\n' + tail;
};
