/*!
 * Chapeau 0.1.1
 *
 * Chapeau may be freely distributed under the MIT license.
 * For all details and documentation:
 * https://github.com/Tronix117/chapeau
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['backbone', 'lodash', 'chaplin'], factory);
  } else if (typeof module === 'object' && module && module.exports) {
    module.exports = factory(require('backbone'), require('lodash'), require('chaplin'));
  } else if (typeof require === 'function') {
    factory(window.Backbone, window._ || window.Backbone.utils, window.Chaplin);
  } else {
    throw new Error('Chaplin requires Common.js or AMD modules');
  }
}(this, function(Backbone, _, Chaplin) {
  function require(name) {
    return {backbone: Backbone, lodash: _, chaplin: Chaplin}[name];
  }

  require =(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Chapeau;

Chapeau = window.Chapeau = {
  Application: require('./chapeau/application'),
  mediator: require('./chapeau/mediator'),
  Controller: require('./chapeau/controllers/controller'),
  Collection: require('./chapeau/models/collection'),
  Model: require('./chapeau/models/model'),
  Layout: require('./chapeau/views/layout'),
  View: require('./chapeau/views/view'),
  CollectionView: require('./chapeau/views/collection_view'),
  utils: require('./chapeau/lib/utils')
};

module.exports = Chapeau;


},{"./chapeau/application":2,"./chapeau/controllers/controller":3,"./chapeau/lib/utils":4,"./chapeau/mediator":5,"./chapeau/models/collection":6,"./chapeau/models/model":7,"./chapeau/views/collection_view":8,"./chapeau/views/layout":9,"./chapeau/views/view":10}],2:[function(require,module,exports){
'use strict';
var Application, Chaplin, Collection, _, global, mediator, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

if (typeof window !== "undefined" && window !== null) {
  window.global = global = window;
} else if (global == null) {
  global = {};
}

_ = require('lodash');

Chaplin = require('chaplin');

utils = require('./lib/utils');

Collection = require('./models/collection');

global.mediator = mediator = require('./mediator');

module.exports = Application = (function(superClass) {
  extend(Application, superClass);

  Application.prototype.settings = {
    controllerSuffix: '-controller',
    collectionsAutoSingleton: true,
    globalAutoload: true
  };

  Application.prototype.classList = {
    views: {},
    collections: {},
    models: {},
    helpers: {},
    templates: {},
    controllers: {},
    misc: {},
    bases: {}
  };

  Application.prototype.orderedRequireList = {
    views: [],
    collections: [],
    models: [],
    helpers: [],
    templates: [],
    controllers: [],
    misc: [],
    bases: []
  };

  function Application(options) {
    _.extend(this.settings, this.options, options);
    global.dummyCollection = new Collection;
    if (this.settings.globalAutoload) {
      this.autoload();
    }
    Application.__super__.constructor.call(this, this.settings);
  }

  Application.prototype.initMediator = function() {
    var Col, collectionPath, name, ref;
    if (this.settings.collectionsAutoSingleton) {
      ref = this.classList.collections;
      for (collectionPath in ref) {
        Col = ref[collectionPath];
        name = utils.pluralize(collectionPath.replace(/-collection$/, ''));
        mediator[name] = new Col;
      }
    }
    mediator.canUseLocalStorage = this._checkLocalStorage();
    return Application.__super__.initMediator.apply(this, arguments);
  };

  Application.prototype._checkLocalStorage = function() {
    var e, error, test;
    test = 'test';
    try {
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      e = error;
      return false;
    }
  };

  Application.prototype.autoload = function() {
    var baseOrder, baseSortr, i, len, r, ref, sortr, topDir;
    global.application = this;
    ref = (global.require || require).list();
    for (i = 0, len = ref.length; i < len; i++) {
      r = ref[i];
      topDir = r.split('/')[0];
      if (this.orderedRequireList[topDir]) {
        if (topDir === 'views' && !_.endsWith(r, '-view')) {
          this.orderedRequireList.templates.push(r);
        } else if (_.startsWith(r, 'helpers/base')) {
          this.orderedRequireList.bases.push(r);
        } else {
          this.orderedRequireList[topDir].push(r);
        }
      } else {
        this.orderedRequireList.misc.push(r);
      }
    }
    sortr = function(a, b) {
      var bi;
      if (-1 !== (bi = b.indexOf('abstract')) || -1 !== a.indexOf('abstract')) {
        return bi;
      }
      return b.split('/').length - a.split('/').length;
    };
    baseOrder = ['view', 'layout', 'controller', 'model', 'collection', 'collection_view'];
    baseSortr = function(a, b) {
      if (-1 === (a = baseOrder.indexOf(a.split('/').pop()))) {
        return 1;
      }
      if (-1 === (b = baseOrder.indexOf(b.split('/').pop()))) {
        return -1;
      }
      return a - b;
    };
    this.orderedRequireList.views.sort(sortr);
    this.orderedRequireList.controllers.sort(sortr);
    this.orderedRequireList.models.sort(sortr);
    this.orderedRequireList.collections.sort(sortr);
    this.orderedRequireList.bases.sort(baseSortr);
    this.preload('bases');
    this.preload('helpers');
    this.preload('models');
    this.preload('collections');
    this.preload('templates');
    this.preload('views');
    return this.preload('controllers');
  };

  Application.prototype.preload = function(type) {
    var d, dirs, i, len, name, r, ref;
    ref = this.orderedRequireList[type];
    for (i = 0, len = ref.length; i < len; i++) {
      r = ref[i];
      dirs = r.split('/');
      dirs.shift();
      if ((type === 'views' || type === 'templates' || type === 'controllers') && dirs[dirs.length - 2] === dirs[dirs.length - 1].replace('-view', '')) {
        dirs[dirs.length - 2] = '';
      }
      d = dirs.join('-');
      switch (type) {
        case 'views':
        case 'collections':
        case 'controllers':
          name = _.classify(d);
          break;
        case 'bases':
          name = _.classify(d.replace('base-', ''));
          break;
        default:
          name = _.classify(d + "-" + (type.slice(0, -1)));
      }
      global[name] = this.classList[type][d] = (global.require || require)(r);
    }
  };

  Application.prototype.start = function() {
    if ('function' === typeof this.beforeStart) {
      return this.beforeStart((function(_this) {
        return function() {
          return Application.__super__.start.apply(_this, arguments);
        };
      })(this));
    }
    return Application.__super__.start.apply(this, arguments);
  };

  return Application;

})(Chaplin.Application);


},{"./lib/utils":4,"./mediator":5,"./models/collection":6,"chaplin":"chaplin","lodash":"lodash"}],3:[function(require,module,exports){
'use strict';
var Chaplin, Controller, _, global,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

if (typeof window !== "undefined" && window !== null) {
  window.global = global = window;
} else if (global == null) {
  global = {};
}

_ = require('lodash');

Chaplin = require('chaplin');

module.exports = Controller = (function(superClass) {
  extend(Controller, superClass);

  function Controller() {
    return Controller.__super__.constructor.apply(this, arguments);
  }

  Controller.prototype.beforeAction = function(params, route) {
    if (global.ENV !== 'production') {
      log("[c='font-size: 1.2em;color:#d33682;font-weight:bold']▚ " + route.name + "[c]\t\t", route);
    }
    return Controller.__super__.beforeAction.apply(this, arguments);
  };

  return Controller;

})(Chaplin.Controller);


},{"chaplin":"chaplin","lodash":"lodash"}],4:[function(require,module,exports){
'use strict';
var _, utils;

_ = require('lodash');

utils = {
  functionName: function(f) {
    var ret;
    ret = f.toString().substr(9);
    return ret.substr(0, ret.indexOf('('));
  },
  className: function(c) {
    var ret;
    ret = c.constructor.toString().substr(9);
    return ret.substr(0, ret.indexOf('('));
  },
  _pluralRules: [['m[ae]n$', 'men'], ['(eau)x?$', '$1x'], ['(child)(?:ren)?$', '$1ren'], ['(pe)(?:rson|ople)$', '$1ople'], ['^(m|l)(?:ice|ouse)$', '$1ice'], ['(matr|cod|mur|sil|vert|ind)(?:ix|ex)$', '$1ices'], ['(x|ch|ss|sh|zz)$', '$1es'], ['([^ch][ieo][ln])ey$', '$1ies'], ['([^aeiouy]|qu)y$', '$1ies'], ['(?:([^f])fe|(ar|l|[eo][ao])f)$', '$1$2ves'], ['sis$', 'ses'], ['^(apheli|hyperbat|periheli|asyndet|noumen)(?:a|on)$', '$1a'], ['^(phenomen|criteri|organ|prolegomen|\w+hedr)(?:a|on)$', '$1a'], ['^(agend|addend|millenni|ov|dat|extrem|bacteri|desiderat)(?:a|um)$', '$1a'], ['^(strat|candelabr|errat|symposi|curricul|automat|quor)(?:a|um)$', '$1a'], ['(her|at|gr)o$', '$1oes'], ['^(alumn|alg|vertebr)(?:a|ae)$', '$1ae'], ['(alumn|syllab|octop|vir|radi|nucle|fung|cact)(?:us|i)$', '$1i'], ['(stimul|termin|bacill|foc|uter|loc)(?:us|i)$', '$1i'], ['([^l]ias|[aeiou]las|[emjzr]as|[iu]am)$', '$1'], ['([^l]ias|[aeiou]las|[emjzr]as|[iu]am)$', '$1'], ['(e[mn]u)s?$', '$1s'], ['(alias|[^aou]us|tlas|gas|ris)$', '$1es'], ['^(ax|test)is$', '$1es'], ['([^aeiou]ese)$', '$1'], ['s?$', 's']],
  pluralize: function(s) {
    var i, len, r, ref, v;
    ref = this._pluralRules;
    for (i = 0, len = ref.length; i < len; i++) {
      v = ref[i];
      if (!(r = new RegExp(v[0])).test(s)) {
        continue;
      }
      return s.replace(r, v[1]);
    }
    return s;
  }
};

if (typeof Object.seal === "function") {
  Object.seal(utils);
}

module.exports = utils;


},{"lodash":"lodash"}],5:[function(require,module,exports){
'use strict';
var Chaplin, mediator;

Chaplin = require('chaplin');

mediator = Chaplin.mediator;

mediator.onLy = function(eventName) {
  this.offLy(eventName);
  return this.on.apply(this, arguments);
};

mediator.offLy = function(eventName) {
  return delete mediator._events[eventName];
};

module.exports = mediator;


},{"chaplin":"chaplin"}],6:[function(require,module,exports){
'use strict';
var Chaplin, Collection, Model, _, global, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

if (typeof window !== "undefined" && window !== null) {
  window.global = global = window;
} else if (global == null) {
  global = {};
}

_ = require('lodash');

Chaplin = require('chaplin');

Model = require('./model');

utils = require('../lib/utils');

module.exports = Collection = (function(superClass) {
  extend(Collection, superClass);

  _(Collection.prototype).extend(Chaplin.SyncMachine);

  Collection.prototype.model = null;

  Collection.prototype.subset = {};

  Collection.prototype.meta = null;

  function Collection() {
    this._className = utils.className(this).replace('Collection', '');
    if (!this.model) {
      this.model = global[this._className + 'Model'] || Model;
    }
    this.subset = {};
    this.storeName = 'App::' + this._className;
    Collection.__super__.constructor.apply(this, arguments);
  }

  Collection.prototype.subfilter = function(f) {
    return this.subcollection({
      filter: f
    });
  };

  Collection.prototype.first = function(n) {
    var models;
    models = Collection.__super__.first.apply(this, arguments);
    if (!n) {
      return models;
    }
    return this.subfilter(function(model) {
      return -1 !== models.indexOf(model);
    });
  };

  Collection.prototype.last = function(n) {
    var models;
    models = Collection.__super__.last.apply(this, arguments);
    if (!n) {
      return models;
    }
    return this.subfilter(function(model) {
      return -1 !== models.indexOf(model);
    });
  };

  Collection.prototype.where = function(attrs, first) {
    var cacheKey, f;
    cacheKey = 'where:' + JSON.stringify(attrs);
    if (_.isEmpty(attrs)) {
      return (first ? void 0 : []);
    }
    f = function(model) {
      var key;
      for (key in attrs) {
        if (attrs[key] !== model.get(key)) {
          return false;
        }
      }
      return true;
    };
    if (first) {
      return this.find(f);
    } else {
      return this.subset[cacheKey] || (this.subset[cacheKey] = this.subfilter(f));
    }
  };

  return Collection;

})(Chaplin.Collection);


},{"../lib/utils":4,"./model":7,"chaplin":"chaplin","lodash":"lodash"}],7:[function(require,module,exports){
'use strict';
var Chaplin, Model, _,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('lodash');

Chaplin = require('chaplin');

module.exports = Model = (function(superClass) {
  extend(Model, superClass);

  function Model() {
    return Model.__super__.constructor.apply(this, arguments);
  }

  _(Model.prototype).extend(Chaplin.SyncMachine);

  Model.prototype.get = function(k) {
    var m;
    if (!this[m = 'get' + k.charAt(0).toUpperCase() + k.slice(1)]) {
      return Model.__super__.get.apply(this, arguments);
    }
    return this[m]();
  };

  Model.prototype.set = function(k, v) {
    var m;
    if (!('string' === typeof k && this[m = 'set' + k.charAt(0).toUpperCase() + k.slice(1)])) {
      return Model.__super__.set.apply(this, arguments);
    }
    return this[m](v);
  };

  return Model;

})(Chaplin.Model);


},{"chaplin":"chaplin","lodash":"lodash"}],8:[function(require,module,exports){
'use strict';
var Chaplin, CollectionView, View, _, global, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

if (typeof window !== "undefined" && window !== null) {
  window.global = global = window;
} else if (global == null) {
  global = {};
}

_ = require('lodash');

Chaplin = require('chaplin');

View = require('./view');

utils = require('../lib/utils');

module.exports = CollectionView = (function(superClass) {
  extend(CollectionView, superClass);

  CollectionView.prototype.getTemplateFunction = View.prototype.getTemplateFunction;

  CollectionView.prototype.initAttributes = View.prototype.initAttributes;

  CollectionView.prototype.useCssAnimation = true;

  CollectionView.prototype.enhance = View.prototype.enhance;

  CollectionView.prototype.dispose = View.prototype.dispose;

  CollectionView.prototype.render = View.prototype.render;

  function CollectionView(options) {
    this._className = utils.className(this);
    if (!this.itemView) {
      this.itemView = global[this._className.replace('View', 'ItemView')];
    }
    if (!this.listSelector && global[this._className.replace(/View$/, 'Template')]) {
      this.listSelector = '.list';
    }
    this.initAttributes();
    if (!this.model) {
      this.model = new Model;
    }
    CollectionView.__super__.constructor.apply(this, arguments);
  }

  CollectionView.prototype.getTemplateData = function() {
    var templateData;
    templateData = CollectionView.__super__.getTemplateData.apply(this, arguments);
    if (this.model) {
      templateData = _.extend(Chaplin.utils.serialize(this.model, templateData));
      if (typeof this.model.isSynced === 'function' && !this.model.isSynced()) {
        templateData.synced = false;
      }
    }
    return templateData;
  };

  CollectionView.prototype.doRender = function() {
    var html, listSelector, templateFunc;
    templateFunc = this.getTemplateFunction();
    if (typeof templateFunc !== 'function') {
      return this;
    }
    html = templateFunc(this.getTemplateData());
    if (global.toStaticHTML != null) {
      html = toStaticHTML(html);
    }
    this.$el.html(html);
    listSelector = _.result(this, 'listSelector');
    this.$list = listSelector ? this.$(listSelector) : this.$el;
    this.initFallback();
    this.initLoadingIndicator();
    if (this.renderItems) {
      this.renderAllItems();
    }
    this.enhance();
    return typeof this.afterRender === "function" ? this.afterRender() : void 0;
  };

  CollectionView.prototype.resetCollection = function(newCollection) {
    this.stopListening(this.collection);
    this.collection = newCollection;
    this.listenTo(this.collection, 'add', this.itemAdded);
    this.listenTo(this.collection, 'remove', this.itemRemoved);
    this.listenTo(this.collection, 'reset sort', this.itemsReset);
    return this.itemsReset();
  };

  return CollectionView;

})(Chaplin.CollectionView);


},{"../lib/utils":4,"./view":10,"chaplin":"chaplin","lodash":"lodash"}],9:[function(require,module,exports){
'use strict';
var Chaplin, Layout, View, _, global, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

if (typeof window !== "undefined" && window !== null) {
  window.global = global = window;
} else if (global == null) {
  global = {};
}

_ = require('lodash');

Chaplin = require('chaplin');

View = require('./view');

utils = require('../lib/utils');

module.exports = Layout = (function(superClass) {
  extend(Layout, superClass);

  function Layout(options) {
    this._className = utils.className(this);
    Layout.__super__.constructor.apply(this, arguments);
  }

  Layout.prototype.isExternalLink = function(link) {
    var ref, ref1, resp;
    resp = link.target === '_blank' || link.rel === 'external' || ((ref = link.protocol) !== 'https:' && ref !== 'http:' && ref !== ':' && ref !== 'file:' && ref !== location.protocol) || ((ref1 = link.hostname) !== location.hostname && ref1 !== '');
    return resp;
  };

  return Layout;

})(Chaplin.Layout);


},{"../lib/utils":4,"./view":10,"chaplin":"chaplin","lodash":"lodash"}],10:[function(require,module,exports){
'use strict';
var Chaplin, Model, View, _, global, utils,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

if (typeof window !== "undefined" && window !== null) {
  window.global = global = window;
} else if (global == null) {
  global = {};
}

_ = require('lodash');

Chaplin = require('chaplin');

Model = require('../models/model');

utils = require('../lib/utils');

module.exports = View = (function(superClass) {
  extend(View, superClass);

  View.prototype.autoRender = true;

  View.prototype.getTemplateFunction = function() {
    if (this.template) {
      return this.template;
    }
    this._className = this._className || utils.className(this);
    return global[this._className.replace(/View$/, 'Template')];
  };

  View.prototype.initAttributes = function() {
    var d;
    this._className = this._className || utils.className(this);
    d = _.dasherize(this._className.charAt(0).toLowerCase() + this._className.slice(1));
    return this.className = !this.className ? d : this.className + ' ' + d;
  };

  function View(options) {
    this.initAttributes();
    if (!this.model) {
      this.model = new Model;
    }
    View.__super__.constructor.apply(this, arguments);
  }

  View.prototype.dispose = function() {
    if (!(global.ENV === 'production' || this.noDebug)) {
      log("[c='font-weight:bold;margin-left:20px;color:#268bd2;']❖ " + this._className + "::[c][c='font-weight:bold;color:#b58900']dispose[c]\t\t", this);
    }
    return (typeof this.beforeDispose === "function" ? this.beforeDispose((function(_this) {
      return function(canDispose) {
        if (canDispose !== false) {
          return View.__super__.dispose.apply(_this, arguments);
        }
      };
    })(this)) : void 0) || View.__super__.dispose.apply(this, arguments);
  };

  View.prototype.delegateEvents = function(events, keepOld) {
    View.__super__.delegateEvents.apply(this, arguments);
    return this.delegateHammerEvents();
  };

  View.prototype.doRender = function() {
    var html, templateFunc;
    templateFunc = this.getTemplateFunction();
    if (typeof templateFunc !== 'function') {
      return this;
    }
    html = templateFunc(this.getTemplateData());
    if (global.toStaticHTML != null) {
      html = toStaticHTML(html);
    }
    this.$el.html(html);
    this.enhance();
    return typeof this.afterRender === "function" ? this.afterRender() : void 0;
  };

  View.prototype.render = function() {
    if (this.disposed) {
      return false;
    }
    if (global.ENV !== 'production') {
      if (!this.noDebug) {
        log("[c='font-weight:bold;margin-left:20px;color:#268bd2;']❖ " + this._className + "::[c][c='font-weight:bold;color:#b58900']render[c]\t\t", this);
      }
    }
    return (typeof this.beforeRender === "function" ? this.beforeRender((function(_this) {
      return function(canRender) {
        if (canRender !== false) {
          return _this.doRender();
        }
      };
    })(this)) : void 0) || this.doRender();
  };

  View.prototype.enhance = function() {
    return this.$('a[data-route]').each(function() {
      var k, ref, routeName, routeParams, uri, v;
      this.$ = $(this);
      routeParams = this.$.is('[data-route-reset]') ? {} : _.extend({}, mediator.lastRouteParams);
      routeName = null;
      ref = this.$.data();
      for (k in ref) {
        v = ref[k];
        if (k === 'route') {
          routeName = v;
        } else if (k !== 'routeReset' && 0 === k.indexOf('route')) {
          routeParams[(k = k.substr(5)).charAt(0).toLowerCase() + k.slice(1)] = v;
        }
      }
      uri = '#';
      try {
        uri = Chaplin.utils.reverse(routeName, routeParams);
      } catch (undefined) {}
      this.$.attr('href', uri);
      this.$.off('click');
      return this.$.on('click', function(e) {
        var el, href, isAnchor;
        if (Chaplin.utils.modifierKeyPressed(event)) {
          return;
        }
        el = event.currentTarget;
        isAnchor = el.nodeName === 'A';
        href = el.getAttribute('href') || el.getAttribute('data-href') || null;
        Chaplin.utils.redirectTo({
          url: href
        });
        event.preventDefault();
        return false;
      });
    });
  };

  return View;

})(Chaplin.View);


},{"../lib/utils":4,"../models/model":7,"chaplin":"chaplin","lodash":"lodash"}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY2hhcGVhdS5jb2ZmZWUiLCJzcmMvY2hhcGVhdS9hcHBsaWNhdGlvbi5jb2ZmZWUiLCJzcmMvY2hhcGVhdS9jb250cm9sbGVycy9jb250cm9sbGVyLmNvZmZlZSIsInNyYy9jaGFwZWF1L2xpYi91dGlscy5jb2ZmZWUiLCJzcmMvY2hhcGVhdS9tZWRpYXRvci5jb2ZmZWUiLCJzcmMvY2hhcGVhdS9tb2RlbHMvY29sbGVjdGlvbi5jb2ZmZWUiLCJzcmMvY2hhcGVhdS9tb2RlbHMvbW9kZWwuY29mZmVlIiwic3JjL2NoYXBlYXUvdmlld3MvY29sbGVjdGlvbl92aWV3LmNvZmZlZSIsInNyYy9jaGFwZWF1L3ZpZXdzL2xheW91dC5jb2ZmZWUiLCJzcmMvY2hhcGVhdS92aWV3cy92aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0dBLElBQUE7O0FBQUEsT0FBQSxHQUFVLE1BQU0sQ0FBQyxPQUFQLEdBQ1I7RUFBQSxXQUFBLEVBQWdCLE9BQUEsQ0FBUSx1QkFBUixDQUFoQjtFQUNBLFFBQUEsRUFBZ0IsT0FBQSxDQUFRLG9CQUFSLENBRGhCO0VBR0EsVUFBQSxFQUFnQixPQUFBLENBQVEsa0NBQVIsQ0FIaEI7RUFNQSxVQUFBLEVBQWdCLE9BQUEsQ0FBUSw2QkFBUixDQU5oQjtFQU9BLEtBQUEsRUFBZ0IsT0FBQSxDQUFRLHdCQUFSLENBUGhCO0VBUUEsTUFBQSxFQUFnQixPQUFBLENBQVEsd0JBQVIsQ0FSaEI7RUFTQSxJQUFBLEVBQWdCLE9BQUEsQ0FBUSxzQkFBUixDQVRoQjtFQVVBLGNBQUEsRUFBZ0IsT0FBQSxDQUFRLGlDQUFSLENBVmhCO0VBZ0JBLEtBQUEsRUFBZ0IsT0FBQSxDQUFRLHFCQUFSLENBaEJoQjs7O0FBa0JGLE1BQU0sQ0FBQyxPQUFQLEdBQWlCOzs7O0FDdEJqQjtBQUFBLElBQUEsNERBQUE7RUFBQTs7O0FBRUEsSUFBRyxnREFB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LEtBQUssQ0FBQyxjQUFOLENBQUE7QUFDQSxlQUFPO01BWE0sQ0FBZjtJQXRCdUIsQ0FBekI7RUFETzs7OztHQTVEeUIsT0FBTyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIiMgTWFpbiBlbnRyeSBwb2ludCBpbnRvIENoYXBlYXUgbW9kdWxlLlxuIyBMb2FkIGFsbCBjb21wb25lbnRzIGFuZCBleHBvc2UgdGhlbS5cblxuQ2hhcGVhdSA9IHdpbmRvdy5DaGFwZWF1ID1cbiAgQXBwbGljYXRpb246ICAgIHJlcXVpcmUgJy4vY2hhcGVhdS9hcHBsaWNhdGlvbidcbiAgbWVkaWF0b3I6ICAgICAgIHJlcXVpcmUgJy4vY2hhcGVhdS9tZWRpYXRvcidcbiAgIyBEaXNwYXRjaGVyOiAgICAgcmVxdWlyZSAnLi9jaGFwZWF1L2Rpc3BhdGNoZXInXG4gIENvbnRyb2xsZXI6ICAgICByZXF1aXJlICcuL2NoYXBlYXUvY29udHJvbGxlcnMvY29udHJvbGxlcidcbiAgIyBDb21wb3NlcjogICAgICAgcmVxdWlyZSAnLi9jaGFwZWF1L2NvbXBvc2VyJ1xuICAjIENvbXBvc2l0aW9uOiAgICByZXF1aXJlICcuL2NoYXBlYXUvbGliL2NvbXBvc2l0aW9uJ1xuICBDb2xsZWN0aW9uOiAgICAgcmVxdWlyZSAnLi9jaGFwZWF1L21vZGVscy9jb2xsZWN0aW9uJ1xuICBNb2RlbDogICAgICAgICAgcmVxdWlyZSAnLi9jaGFwZWF1L21vZGVscy9tb2RlbCdcbiAgTGF5b3V0OiAgICAgICAgIHJlcXVpcmUgJy4vY2hhcGVhdS92aWV3cy9sYXlvdXQnXG4gIFZpZXc6ICAgICAgICAgICByZXF1aXJlICcuL2NoYXBlYXUvdmlld3MvdmlldydcbiAgQ29sbGVjdGlvblZpZXc6IHJlcXVpcmUgJy4vY2hhcGVhdS92aWV3cy9jb2xsZWN0aW9uX3ZpZXcnXG4gICMgUm91dGU6ICAgICAgICAgIHJlcXVpcmUgJy4vY2hhcGVhdS9saWIvcm91dGUnXG4gICMgUm91dGVyOiAgICAgICAgIHJlcXVpcmUgJy4vY2hhcGVhdS9saWIvcm91dGVyJ1xuICAjIEV2ZW50QnJva2VyOiAgICByZXF1aXJlICcuL2NoYXBlYXUvbGliL2V2ZW50X2Jyb2tlcidcbiAgIyBzdXBwb3J0OiAgICAgICAgcmVxdWlyZSAnLi9jaGFwZWF1L2xpYi9zdXBwb3J0J1xuICAjIFN5bmNNYWNoaW5lOiAgICByZXF1aXJlICcuL2NoYXBlYXUvbGliL3N5bmNfbWFjaGluZSdcbiAgdXRpbHM6ICAgICAgICAgIHJlcXVpcmUgJy4vY2hhcGVhdS9saWIvdXRpbHMnXG5cbm1vZHVsZS5leHBvcnRzID0gQ2hhcGVhdSIsIid1c2Ugc3RyaWN0J1xuXG5pZiB3aW5kb3c/IFxuICB3aW5kb3cuZ2xvYmFsID0gZ2xvYmFsID0gd2luZG93IFxuZWxzZSB1bmxlc3MgZ2xvYmFsP1xuICBnbG9iYWwgPSB7fVxuXG5fID0gcmVxdWlyZSAnbG9kYXNoJ1xuQ2hhcGxpbiA9IHJlcXVpcmUgJ2NoYXBsaW4nXG51dGlscyA9IHJlcXVpcmUgJy4vbGliL3V0aWxzJ1xuQ29sbGVjdGlvbiA9IHJlcXVpcmUgJy4vbW9kZWxzL2NvbGxlY3Rpb24nXG5cbmdsb2JhbC5tZWRpYXRvciA9IG1lZGlhdG9yID0gcmVxdWlyZSAnLi9tZWRpYXRvcidcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBBcHBsaWNhdGlvbiBleHRlbmRzIENoYXBsaW4uQXBwbGljYXRpb25cbiAgc2V0dGluZ3M6XG4gICAgY29udHJvbGxlclN1ZmZpeDogJy1jb250cm9sbGVyJ1xuICAgIGNvbGxlY3Rpb25zQXV0b1NpbmdsZXRvbjogdHJ1ZVxuICAgIGdsb2JhbEF1dG9sb2FkOiB0cnVlXG5cbiAgY2xhc3NMaXN0OlxuICAgIHZpZXdzOiB7fVxuICAgIGNvbGxlY3Rpb25zOiB7fVxuICAgIG1vZGVsczoge31cbiAgICBoZWxwZXJzOiB7fVxuICAgIHRlbXBsYXRlczoge31cbiAgICBjb250cm9sbGVyczoge31cbiAgICBtaXNjOiB7fVxuICAgIGJhc2VzOiB7fVxuXG4gIG9yZGVyZWRSZXF1aXJlTGlzdDpcbiAgICB2aWV3czogW11cbiAgICBjb2xsZWN0aW9uczogW11cbiAgICBtb2RlbHM6IFtdXG4gICAgaGVscGVyczogW11cbiAgICB0ZW1wbGF0ZXM6IFtdXG4gICAgY29udHJvbGxlcnM6IFtdXG4gICAgbWlzYzogW11cbiAgICBiYXNlczogW11cblxuXG4gIGNvbnN0cnVjdG9yOiAob3B0aW9ucykgLT5cbiAgICBfLmV4dGVuZCBAc2V0dGluZ3MsIEBvcHRpb25zLCBvcHRpb25zXG5cbiAgICBnbG9iYWwuZHVtbXlDb2xsZWN0aW9uID0gbmV3IENvbGxlY3Rpb25cblxuICAgIEBhdXRvbG9hZCgpIGlmIEBzZXR0aW5ncy5nbG9iYWxBdXRvbG9hZFxuXG4gICAgc3VwZXIgQHNldHRpbmdzXG5cbiAgaW5pdE1lZGlhdG9yOiAtPlxuICAgICMgRGVjbGFyZSBhZGRpdGlvbmFsIHByb3BlcnRpZXMgZm9yIG1lZGlhdG9yIGJlbGxvd1xuXG4gICAgaWYgQHNldHRpbmdzLmNvbGxlY3Rpb25zQXV0b1NpbmdsZXRvblxuICAgICAgZm9yIGNvbGxlY3Rpb25QYXRoLCBDb2wgb2YgQGNsYXNzTGlzdC5jb2xsZWN0aW9uc1xuICAgICAgICBuYW1lID0gdXRpbHMucGx1cmFsaXplIGNvbGxlY3Rpb25QYXRoLnJlcGxhY2UgLy1jb2xsZWN0aW9uJC8sICcnXG4gICAgICAgIG1lZGlhdG9yW25hbWVdID0gbmV3IENvbFxuXG4gICAgbWVkaWF0b3IuY2FuVXNlTG9jYWxTdG9yYWdlID0gQF9jaGVja0xvY2FsU3RvcmFnZSgpXG5cbiAgICAjIFNlYWwgdGhlIG1lZGlhdG9yXG4gICAgc3VwZXJcbiAgXG4gIF9jaGVja0xvY2FsU3RvcmFnZTogLT5cbiAgICB0ZXN0ID0gJ3Rlc3QnXG4gICAgdHJ5XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSB0ZXN0LCB0ZXN0XG4gICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSB0ZXN0XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIGNhdGNoIGVcbiAgICAgIHJldHVybiBmYWxzZVxuXG4gIGF1dG9sb2FkOiAtPlxuICAgIGdsb2JhbC5hcHBsaWNhdGlvbiA9IEBcblxuICAgIGZvciByIGluIChnbG9iYWwucmVxdWlyZSBvciByZXF1aXJlKS5saXN0KClcbiAgICAgIHRvcERpciA9IHIuc3BsaXQoJy8nKVswXVxuICAgICAgaWYgQG9yZGVyZWRSZXF1aXJlTGlzdFt0b3BEaXJdXG4gICAgICAgIGlmIHRvcERpciBpcyAndmlld3MnIGFuZCBub3QgXy5lbmRzV2l0aCByLCAnLXZpZXcnXG4gICAgICAgICAgQG9yZGVyZWRSZXF1aXJlTGlzdC50ZW1wbGF0ZXMucHVzaCByXG4gICAgICAgIGVsc2UgaWYgXy5zdGFydHNXaXRoIHIsICdoZWxwZXJzL2Jhc2UnXG4gICAgICAgICAgQG9yZGVyZWRSZXF1aXJlTGlzdC5iYXNlcy5wdXNoIHJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBvcmRlcmVkUmVxdWlyZUxpc3RbdG9wRGlyXS5wdXNoIHJcbiAgICAgIGVsc2VcbiAgICAgICAgQG9yZGVyZWRSZXF1aXJlTGlzdC5taXNjLnB1c2ggclxuXG4gICAgIyBGaXggZm9yIHZpZXdzLCBjb2xsZWN0aW9uIHZpZXcgbXVzdCBiZSBsb2FkZWQgYWZ0ZXIgdmlld3MsIGFuZCB1c3VhbHkgcGF0aFxuICAgICMgb2Ygc3Vidmlld3MgaXMgYGNvbGxlY3Rpb252aWV3LW5hbWUvc3ViaXRlbWAgd2hpY2ggbmVlZCB0byBiZSBsb2FkZWRcbiAgICAjIGJlZm9yZSBgY29sbGVjdGlvbnZpZXctbmFtZWAsIGEgc29ydCB0byBoYXZlIHRoZSBsb25nZXIgcGF0aCBmaXJzdCBzaG91bGRcbiAgICAjIGJlIGVub3VnaFxuICAgICMgQWJzdHJhY3QgYWx3YXlzIGNvbWVzIGZpcnN0XG4gICAgc29ydHIgPSAoYSwgYiktPiAjIFNvcnQ6IHB1dCBhYnN0cmFjdCBmaXJzdFxuICAgICAgaWYgLTEgaXNudCAoYmkgPSBiLmluZGV4T2YgJ2Fic3RyYWN0Jykgb3IgLTEgaXNudCBhLmluZGV4T2YgJ2Fic3RyYWN0J1xuICAgICAgICByZXR1cm4gYmlcbiAgICAgIGIuc3BsaXQoJy8nKS5sZW5ndGggLSBhLnNwbGl0KCcvJykubGVuZ3RoXG5cbiAgICBiYXNlT3JkZXIgPSBbXG4gICAgICAndmlldycsICdsYXlvdXQnLCAnY29udHJvbGxlcicsICdtb2RlbCcsICdjb2xsZWN0aW9uJywgJ2NvbGxlY3Rpb25fdmlldycgXVxuXG4gICAgYmFzZVNvcnRyID0gKGEsIGIpLT5cbiAgICAgIHJldHVybiAxIGlmIC0xIGlzIGEgPSBiYXNlT3JkZXIuaW5kZXhPZiBhLnNwbGl0KCcvJykucG9wKClcbiAgICAgIHJldHVybiAtMSBpZiAtMSBpcyBiID0gYmFzZU9yZGVyLmluZGV4T2YgYi5zcGxpdCgnLycpLnBvcCgpXG4gICAgICBhIC0gYlxuXG4gICAgQG9yZGVyZWRSZXF1aXJlTGlzdC52aWV3cy5zb3J0IHNvcnRyXG4gICAgQG9yZGVyZWRSZXF1aXJlTGlzdC5jb250cm9sbGVycy5zb3J0IHNvcnRyXG4gICAgQG9yZGVyZWRSZXF1aXJlTGlzdC5tb2RlbHMuc29ydCBzb3J0clxuICAgIEBvcmRlcmVkUmVxdWlyZUxpc3QuY29sbGVjdGlvbnMuc29ydCBzb3J0clxuICAgIEBvcmRlcmVkUmVxdWlyZUxpc3QuYmFzZXMuc29ydCBiYXNlU29ydHJcblxuICAgIEBwcmVsb2FkICdiYXNlcydcbiAgICBAcHJlbG9hZCAnaGVscGVycydcbiAgICBAcHJlbG9hZCAnbW9kZWxzJ1xuICAgIEBwcmVsb2FkICdjb2xsZWN0aW9ucydcbiAgICBAcHJlbG9hZCAndGVtcGxhdGVzJ1xuICAgIEBwcmVsb2FkICd2aWV3cydcbiAgICBAcHJlbG9hZCAnY29udHJvbGxlcnMnXG5cbiAgcHJlbG9hZDogKHR5cGUpLT5cbiAgICBmb3IgciBpbiBAb3JkZXJlZFJlcXVpcmVMaXN0W3R5cGVdXG4gICAgICBkaXJzID0gci5zcGxpdCAnLydcbiAgICAgIGRpcnMuc2hpZnQoKVxuICAgICAgaWYgKHR5cGUgaXMgJ3ZpZXdzJyBvciB0eXBlIGlzICd0ZW1wbGF0ZXMnIG9yIHR5cGUgaXMgJ2NvbnRyb2xsZXJzJykgYW5kXG4gICAgICBkaXJzW2RpcnMubGVuZ3RoIC0gMl0gaXMgZGlyc1tkaXJzLmxlbmd0aCAtIDFdLnJlcGxhY2UoJy12aWV3JywgJycpXG4gICAgICAgIGRpcnNbZGlycy5sZW5ndGggLSAyXSA9ICcnXG4gICAgICBcbiAgICAgIGQgPSBkaXJzLmpvaW4oJy0nKVxuXG4gICAgICBzd2l0Y2ggdHlwZVxuICAgICAgICB3aGVuICd2aWV3cycsICdjb2xsZWN0aW9ucycsICdjb250cm9sbGVycydcbiAgICAgICAgICBuYW1lID0gXy5jbGFzc2lmeSBkXG4gICAgICAgIHdoZW4gJ2Jhc2VzJ1xuICAgICAgICAgIG5hbWUgPSBfLmNsYXNzaWZ5IGQucmVwbGFjZSAnYmFzZS0nLCAnJ1xuICAgICAgICBlbHNlXG4gICAgICAgICAgbmFtZSA9IF8uY2xhc3NpZnkgXCIje2R9LSN7dHlwZS5zbGljZSAwLCAtMX1cIlxuXG4gICAgICBnbG9iYWxbbmFtZV0gPSBAY2xhc3NMaXN0W3R5cGVdW2RdID0gKGdsb2JhbC5yZXF1aXJlIG9yIHJlcXVpcmUpKHIpXG4gICAgcmV0dXJuXG5cbiAgc3RhcnQ6IC0+XG4gICAgcmV0dXJuIChAYmVmb3JlU3RhcnQgPT4gc3VwZXIpIGlmICdmdW5jdGlvbicgaXMgdHlwZW9mIEBiZWZvcmVTdGFydFxuICAgIHN1cGVyXG4iLCIndXNlIHN0cmljdCdcblxuaWYgd2luZG93PyBcbiAgd2luZG93Lmdsb2JhbCA9IGdsb2JhbCA9IHdpbmRvdyBcbmVsc2UgdW5sZXNzIGdsb2JhbD9cbiAgZ2xvYmFsID0ge31cblxuXyA9IHJlcXVpcmUgJ2xvZGFzaCdcbkNoYXBsaW4gPSByZXF1aXJlICdjaGFwbGluJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENvbnRyb2xsZXIgZXh0ZW5kcyBDaGFwbGluLkNvbnRyb2xsZXJcbiAgYmVmb3JlQWN0aW9uOiAocGFyYW1zLCByb3V0ZSktPlxuICAgIHVubGVzcyBnbG9iYWwuRU5WIGlzICdwcm9kdWN0aW9uJ1xuICAgICAgbG9nKFwiW2M9J2ZvbnQtc2l6ZTogMS4yZW07Y29sb3I6I2QzMzY4Mjtmb250LXdlaWdodDpib2xkJ11cXFxu4paaICN7cm91dGUubmFtZX1bY11cXHRcXHRcIiwgcm91dGUpXG4gICAgc3VwZXIiLCIndXNlIHN0cmljdCdcblxuXyA9IHJlcXVpcmUgJ2xvZGFzaCdcblxuIyBVdGlsaXRpZXNcbiMgLS0tLS0tLS0tXG5cbnV0aWxzID1cbiAgIyBPYmplY3QgSGVscGVyc1xuICAjIC0tLS0tLS0tLS0tLS0tXG5cbiAgZnVuY3Rpb25OYW1lOiAoZiktPlxuICAgIHJldCA9IGYudG9TdHJpbmcoKS5zdWJzdHIgOSAjJ2Z1bmN0aW9uICcubGVuZ3RoXG4gICAgcmV0LnN1YnN0ciAwLCByZXQuaW5kZXhPZiAnKCdcblxuICBjbGFzc05hbWU6IChjKS0+XG4gICAgcmV0ID0gYy5jb25zdHJ1Y3Rvci50b1N0cmluZygpLnN1YnN0ciA5ICMnZnVuY3Rpb24gJy5sZW5ndGhcbiAgICByZXQuc3Vic3RyIDAsIHJldC5pbmRleE9mICcoJ1xuXG4gIF9wbHVyYWxSdWxlczogW1xuICAgIFsnbVthZV1uJCcsICdtZW4nXVxuICAgIFsnKGVhdSl4PyQnLCAnJDF4J11cbiAgICBbJyhjaGlsZCkoPzpyZW4pPyQnLCAnJDFyZW4nXVxuICAgIFsnKHBlKSg/OnJzb258b3BsZSkkJywgJyQxb3BsZSddXG4gICAgWydeKG18bCkoPzppY2V8b3VzZSkkJywgJyQxaWNlJ11cbiAgICBbJyhtYXRyfGNvZHxtdXJ8c2lsfHZlcnR8aW5kKSg/Oml4fGV4KSQnLCAnJDFpY2VzJ11cbiAgICBbJyh4fGNofHNzfHNofHp6KSQnLCAnJDFlcyddXG4gICAgWycoW15jaF1baWVvXVtsbl0pZXkkJywgJyQxaWVzJ11cbiAgICBbJyhbXmFlaW91eV18cXUpeSQnLCAnJDFpZXMnXVxuICAgIFsnKD86KFteZl0pZmV8KGFyfGx8W2VvXVthb10pZikkJywgJyQxJDJ2ZXMnXVxuICAgIFsnc2lzJCcsICdzZXMnXVxuICAgIFsnXihhcGhlbGl8aHlwZXJiYXR8cGVyaWhlbGl8YXN5bmRldHxub3VtZW4pKD86YXxvbikkJywgJyQxYSddXG4gICAgWydeKHBoZW5vbWVufGNyaXRlcml8b3JnYW58cHJvbGVnb21lbnxcXHcraGVkcikoPzphfG9uKSQnLCAnJDFhJ11cbiAgICBbJ14oYWdlbmR8YWRkZW5kfG1pbGxlbm5pfG92fGRhdHxleHRyZW18YmFjdGVyaXxkZXNpZGVyYXQpKD86YXx1bSkkJywgJyQxYSddXG4gICAgWydeKHN0cmF0fGNhbmRlbGFicnxlcnJhdHxzeW1wb3NpfGN1cnJpY3VsfGF1dG9tYXR8cXVvcikoPzphfHVtKSQnLCAnJDFhJ11cbiAgICBbJyhoZXJ8YXR8Z3IpbyQnLCAnJDFvZXMnXVxuICAgIFsnXihhbHVtbnxhbGd8dmVydGVicikoPzphfGFlKSQnLCAnJDFhZSddXG4gICAgWycoYWx1bW58c3lsbGFifG9jdG9wfHZpcnxyYWRpfG51Y2xlfGZ1bmd8Y2FjdCkoPzp1c3xpKSQnLCAnJDFpJ11cbiAgICBbJyhzdGltdWx8dGVybWlufGJhY2lsbHxmb2N8dXRlcnxsb2MpKD86dXN8aSkkJywgJyQxaSddXG4gICAgWycoW15sXWlhc3xbYWVpb3VdbGFzfFtlbWp6cl1hc3xbaXVdYW0pJCcsICckMSddXG4gICAgWycoW15sXWlhc3xbYWVpb3VdbGFzfFtlbWp6cl1hc3xbaXVdYW0pJCcsICckMSddXG4gICAgWycoZVttbl11KXM/JCcsICckMXMnXVxuICAgIFsnKGFsaWFzfFteYW91XXVzfHRsYXN8Z2FzfHJpcykkJywgJyQxZXMnXVxuICAgIFsnXihheHx0ZXN0KWlzJCcsICckMWVzJ11cbiAgICBbJyhbXmFlaW91XWVzZSkkJywgJyQxJ11cbiAgICBbJ3M/JCcsICdzJ11cbiAgXVxuXG4gIHBsdXJhbGl6ZTogKHMpLT5cbiAgICBmb3IgdiBpbiBAX3BsdXJhbFJ1bGVzXG4gICAgICBjb250aW51ZSB1bmxlc3MgKHIgPSBuZXcgUmVnRXhwIHZbMF0pLnRlc3Qgc1xuICAgICAgcmV0dXJuIHMucmVwbGFjZSByLCB2WzFdXG4gICAgc1xuXG4jIEZpbmlzaFxuIyAtLS0tLS1cblxuIyBTZWFsIHRoZSB1dGlscyBvYmplY3QuXG5PYmplY3Quc2VhbD8gdXRpbHNcblxuIyBSZXR1cm4gb3VyIGNyZWF0aW9uLlxubW9kdWxlLmV4cG9ydHMgPSB1dGlscyIsIid1c2Ugc3RyaWN0J1xuXG5DaGFwbGluID0gcmVxdWlyZSAnY2hhcGxpbidcblxubWVkaWF0b3IgPSBDaGFwbGluLm1lZGlhdG9yXG5cbm1lZGlhdG9yLm9uTHkgPSAoZXZlbnROYW1lKS0+XG4gIEBvZmZMeSBldmVudE5hbWVcbiAgQG9uLmFwcGx5IEAsIGFyZ3VtZW50c1xuXG5tZWRpYXRvci5vZmZMeSA9IChldmVudE5hbWUpLT5cbiAgZGVsZXRlIG1lZGlhdG9yLl9ldmVudHNbZXZlbnROYW1lXVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1lZGlhdG9yIiwiJ3VzZSBzdHJpY3QnXG5cbmlmIHdpbmRvdz8gXG4gIHdpbmRvdy5nbG9iYWwgPSBnbG9iYWwgPSB3aW5kb3cgXG5lbHNlIHVubGVzcyBnbG9iYWw/XG4gIGdsb2JhbCA9IHt9XG5cbl8gPSByZXF1aXJlICdsb2Rhc2gnXG5DaGFwbGluID0gcmVxdWlyZSAnY2hhcGxpbidcbk1vZGVsID0gcmVxdWlyZSAnLi9tb2RlbCdcbnV0aWxzID0gcmVxdWlyZSAnLi4vbGliL3V0aWxzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENvbGxlY3Rpb24gZXh0ZW5kcyBDaGFwbGluLkNvbGxlY3Rpb25cbiAgIyBNaXhpbiBhIHN5bmNocm9uaXphdGlvbiBzdGF0ZSBtYWNoaW5lXG4gIF8oQHByb3RvdHlwZSkuZXh0ZW5kIENoYXBsaW4uU3luY01hY2hpbmVcblxuICAjIFVzZSB0aGUgcHJvamVjdCBiYXNlIG1vZGVsIHBlciBkZWZhdWx0LCBub3QgQ2hhcGxpbi5Nb2RlbFxuICBtb2RlbDogbnVsbFxuXG4gIHN1YnNldDoge31cblxuICBtZXRhOiBudWxsXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQF9jbGFzc05hbWUgPSB1dGlscy5jbGFzc05hbWUoQCkucmVwbGFjZSAnQ29sbGVjdGlvbicsICcnXG4gICAgQG1vZGVsID0gZ2xvYmFsW0BfY2xhc3NOYW1lICsgJ01vZGVsJ10gb3IgTW9kZWwgdW5sZXNzIEBtb2RlbFxuICAgIEBzdWJzZXQgPSB7fVxuICAgIEBzdG9yZU5hbWUgPSAnQXBwOjonICsgQF9jbGFzc05hbWVcbiAgICBzdXBlclxuXG4gICMgU3ViZmlsdGVyIGlzIHNhbWUgYXMgZmlsdGVyIGJ1dCByZXR1cm4gYSBzdWJjb2xsZWN0aW9uIGluc3RlYWQgb2YgYW4gQXJyYXlcbiAgc3ViZmlsdGVyOiAoZiktPiBAc3ViY29sbGVjdGlvbiBmaWx0ZXI6IGZcbiAgXG4gIGZpcnN0OiAobiktPlxuICAgIG1vZGVscyA9IHN1cGVyXG4gICAgcmV0dXJuIG1vZGVscyB1bmxlc3MgblxuICAgIEBzdWJmaWx0ZXIgKG1vZGVsKS0+IC0xIGlzbnQgbW9kZWxzLmluZGV4T2YgbW9kZWxcblxuICBsYXN0OiAobiktPlxuICAgIG1vZGVscyA9IHN1cGVyXG4gICAgcmV0dXJuIG1vZGVscyB1bmxlc3MgblxuICAgIEBzdWJmaWx0ZXIgKG1vZGVsKS0+IC0xIGlzbnQgbW9kZWxzLmluZGV4T2YgbW9kZWxcblxuICAjIE92ZXJyaWRlIHdoZXJlLCBzbyB0aGF0IGl0IHJldHVybnMgYSBzdWJjb2xsZWN0aW9uIGluc3RlYWQgb2YgYW4gQXJyYXlcbiAgd2hlcmU6IChhdHRycywgZmlyc3QpLT5cbiAgICBjYWNoZUtleSA9ICd3aGVyZTonICsgSlNPTi5zdHJpbmdpZnkoYXR0cnMpXG4gICAgcmV0dXJuIChpZiBmaXJzdCB0aGVuIHVuZGVmaW5lZCBlbHNlIFtdKSBpZiBfLmlzRW1wdHkgYXR0cnNcblxuICAgIGYgPSAobW9kZWwpLT5cbiAgICAgIGZvciBrZXkgb2YgYXR0cnNcbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmIGF0dHJzW2tleV0gaXNudCBtb2RlbC5nZXQga2V5XG4gICAgICB0cnVlXG5cbiAgICBpZiBmaXJzdFxuICAgICAgQGZpbmQgZlxuICAgIGVsc2VcbiAgICAgIEBzdWJzZXRbY2FjaGVLZXldIG9yIEBzdWJzZXRbY2FjaGVLZXldID0gQHN1YmZpbHRlciBmIiwiJ3VzZSBzdHJpY3QnXG5cbl8gPSByZXF1aXJlICdsb2Rhc2gnXG5DaGFwbGluID0gcmVxdWlyZSAnY2hhcGxpbidcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBNb2RlbCBleHRlbmRzIENoYXBsaW4uTW9kZWxcbiAgIyBNaXhpbiBhIHN5bmNocm9uaXphdGlvbiBzdGF0ZSBtYWNoaW5lXG4gIF8oQHByb3RvdHlwZSkuZXh0ZW5kIENoYXBsaW4uU3luY01hY2hpbmVcblxuICBnZXQ6IChrKS0+XG4gICAgcmV0dXJuIHN1cGVyIHVubGVzcyBAW20gPSAoJ2dldCcgKyBrLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgay5zbGljZSAxKV1cbiAgICBAW21dKClcblxuICBzZXQ6IChrLCB2KS0+XG4gICAgcmV0dXJuIHN1cGVyIHVubGVzcyAnc3RyaW5nJyBpcyB0eXBlb2YgayBhbmQgXG4gICAgICBAW20gPSAoJ3NldCcgKyBrLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgay5zbGljZSAxKV1cbiAgICBAW21dKHYpIiwiJ3VzZSBzdHJpY3QnXG5cbmlmIHdpbmRvdz8gXG4gIHdpbmRvdy5nbG9iYWwgPSBnbG9iYWwgPSB3aW5kb3cgXG5lbHNlIHVubGVzcyBnbG9iYWw/XG4gIGdsb2JhbCA9IHt9XG5cbl8gPSByZXF1aXJlICdsb2Rhc2gnXG5DaGFwbGluID0gcmVxdWlyZSAnY2hhcGxpbidcblZpZXcgPSByZXF1aXJlICcuL3ZpZXcnXG51dGlscyA9IHJlcXVpcmUgJy4uL2xpYi91dGlscydcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDb2xsZWN0aW9uVmlldyBleHRlbmRzIENoYXBsaW4uQ29sbGVjdGlvblZpZXdcbiAgIyBUaGlzIGNsYXNzIGRvZXNu4oCZdCBpbmhlcml0IGZyb20gdGhlIGFwcGxpY2F0aW9uLXNwZWNpZmljIFZpZXcgY2xhc3MsXG4gICMgc28gd2UgbmVlZCB0byBib3Jyb3cgdGhlIG1ldGhvZHMgZnJvbSB0aGUgVmlldyBwcm90b3R5cGU6XG4gIGdldFRlbXBsYXRlRnVuY3Rpb246IFZpZXc6OmdldFRlbXBsYXRlRnVuY3Rpb25cbiAgaW5pdEF0dHJpYnV0ZXM6IFZpZXc6OmluaXRBdHRyaWJ1dGVzXG4gICNpbml0U2VsZWN0b3JzOiBWaWV3Ojppbml0U2VsZWN0b3JzXG4gICNyZWRpcmVjdFRvOiBWaWV3OjpyZWRpcmVjdFRvXG4gIHVzZUNzc0FuaW1hdGlvbjogdHJ1ZVxuICBlbmhhbmNlOiBWaWV3OjplbmhhbmNlXG4gIGRpc3Bvc2U6IFZpZXc6OmRpc3Bvc2VcbiAgcmVuZGVyOiBWaWV3OjpyZW5kZXJcblxuICBjb25zdHJ1Y3RvcjogKG9wdGlvbnMpLT5cbiAgICBAX2NsYXNzTmFtZSA9IHV0aWxzLmNsYXNzTmFtZShAKVxuXG4gICAgIyBQcmUtY29tcGxldGUgQGl0ZW1WaWV3IGFuZCBAbGlzdFNlbGVjdG9yXG4gICAgQGl0ZW1WaWV3ID0gZ2xvYmFsW0BfY2xhc3NOYW1lLnJlcGxhY2UgJ1ZpZXcnLCAnSXRlbVZpZXcnXSB1bmxlc3MgQGl0ZW1WaWV3XG4gICAgaWYgbm90IEBsaXN0U2VsZWN0b3IgYW5kIGdsb2JhbFtAX2NsYXNzTmFtZS5yZXBsYWNlIC9WaWV3JC8sICdUZW1wbGF0ZSddXG4gICAgICBAbGlzdFNlbGVjdG9yID0gJy5saXN0J1xuXG4gICAgQGluaXRBdHRyaWJ1dGVzKClcblxuICAgIEBtb2RlbCA9IG5ldyBNb2RlbCB1bmxlc3MgQG1vZGVsXG5cbiAgICBzdXBlclxuXG4gIGdldFRlbXBsYXRlRGF0YTogLT5cbiAgICAjIEFkZCBiYWNrIG1vZGVsIHN1cHBvcnQgdG8gQ2hhcGxpblxuICAgIHRlbXBsYXRlRGF0YSA9IHN1cGVyXG5cbiAgICBpZiBAbW9kZWxcbiAgICAgICMgRXJhc2UgbW9kZWwgc2VyaWFsaXplZCB3aXRoIG9yaWdpbmFsIHRlbXBsYXRlRGF0YSB3aGljaCBpbmNsdWRlIGxlbmd0aFxuICAgICAgIyBhbmQgc3luY2VkIGZsYWdcbiAgICAgIHRlbXBsYXRlRGF0YSA9IF8uZXh0ZW5kIENoYXBsaW4udXRpbHMuc2VyaWFsaXplIEBtb2RlbCwgdGVtcGxhdGVEYXRhXG5cbiAgICAgICMgZm9yY2Ugc3luY2VkIGZsYWcgdG8gZmFsc2UgaWYgbW9kZWwgaXMgbm90IGluIHN5bmNcbiAgICAgIGlmIHR5cGVvZiBAbW9kZWwuaXNTeW5jZWQgaXMgJ2Z1bmN0aW9uJyBhbmQgbm90IEBtb2RlbC5pc1N5bmNlZCgpXG4gICAgICAgIHRlbXBsYXRlRGF0YS5zeW5jZWQgPSBmYWxzZVxuXG4gICAgdGVtcGxhdGVEYXRhXG5cbiAgZG9SZW5kZXI6IC0+XG4gICAgdGVtcGxhdGVGdW5jID0gQGdldFRlbXBsYXRlRnVuY3Rpb24oKVxuICAgIHJldHVybiBAIHVubGVzcyB0eXBlb2YgdGVtcGxhdGVGdW5jIGlzICdmdW5jdGlvbidcbiAgICBcbiAgICBodG1sID0gdGVtcGxhdGVGdW5jIEBnZXRUZW1wbGF0ZURhdGEoKVxuXG4gICAgIyBObyBoYW5kbGUgZm9yIG5vV3JhcCwgaXQncyBub3QgYSBnb29kIHdheSB0byBtYWtlIHRoaW5nc1xuXG4gICAgIyBUaGlzIGlzIGZvciBzZWN1cml0eSBvbiB3aW44L3dpblJUXG4gICAgaHRtbCA9IHRvU3RhdGljSFRNTChodG1sKSBpZiBnbG9iYWwudG9TdGF0aWNIVE1MP1xuXG4gICAgQCRlbC5odG1sIGh0bWxcblxuICAgICMgU2V0IHRoZSAkbGlzdCBwcm9wZXJ0eSB3aXRoIHRoZSBhY3R1YWwgbGlzdCBjb250YWluZXIuXG4gICAgbGlzdFNlbGVjdG9yID0gXy5yZXN1bHQgdGhpcywgJ2xpc3RTZWxlY3RvcidcblxuICAgIEAkbGlzdCA9IGlmIGxpc3RTZWxlY3RvciB0aGVuIEAkKGxpc3RTZWxlY3RvcikgZWxzZSBAJGVsXG5cbiAgICBAaW5pdEZhbGxiYWNrKClcbiAgICBAaW5pdExvYWRpbmdJbmRpY2F0b3IoKVxuXG4gICAgIyBSZW5kZXIgYWxsIGl0ZW1zLlxuICAgIEByZW5kZXJBbGxJdGVtcygpIGlmIEByZW5kZXJJdGVtc1xuXG4gICAgQGVuaGFuY2UoKVxuICAgIEBhZnRlclJlbmRlcj8oKVxuXG4gIHJlc2V0Q29sbGVjdGlvbjogKG5ld0NvbGxlY3Rpb24pLT5cbiAgICBAc3RvcExpc3RlbmluZyBAY29sbGVjdGlvblxuXG4gICAgQGNvbGxlY3Rpb24gPSBuZXdDb2xsZWN0aW9uXG5cbiAgICBAbGlzdGVuVG8gQGNvbGxlY3Rpb24sICdhZGQnLCBAaXRlbUFkZGVkXG4gICAgQGxpc3RlblRvIEBjb2xsZWN0aW9uLCAncmVtb3ZlJywgQGl0ZW1SZW1vdmVkXG4gICAgQGxpc3RlblRvIEBjb2xsZWN0aW9uLCAncmVzZXQgc29ydCcsIEBpdGVtc1Jlc2V0XG5cbiAgICBAaXRlbXNSZXNldCgpIiwiJ3VzZSBzdHJpY3QnXG5cbmlmIHdpbmRvdz8gXG4gIHdpbmRvdy5nbG9iYWwgPSBnbG9iYWwgPSB3aW5kb3cgXG5lbHNlIHVubGVzcyBnbG9iYWw/XG4gIGdsb2JhbCA9IHt9XG5cbl8gPSByZXF1aXJlICdsb2Rhc2gnXG5DaGFwbGluID0gcmVxdWlyZSAnY2hhcGxpbidcblZpZXcgPSByZXF1aXJlICcuL3ZpZXcnXG51dGlscyA9IHJlcXVpcmUgJy4uL2xpYi91dGlscydcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBMYXlvdXQgZXh0ZW5kcyBDaGFwbGluLkxheW91dFxuXG4gIGNvbnN0cnVjdG9yOiAob3B0aW9ucyktPlxuICAgIEBfY2xhc3NOYW1lID0gdXRpbHMuY2xhc3NOYW1lKEApXG4gICAgc3VwZXJcblxuICAjIEhvdGZpeCBmb3Igc2luZ2xlIGFwcCBwYWdlIG9uIHdpbmRvd3NcbiAgaXNFeHRlcm5hbExpbms6IChsaW5rKSAtPlxuICAgIHJlc3AgPSBsaW5rLnRhcmdldCBpcyAnX2JsYW5rJyBvclxuICAgIGxpbmsucmVsIGlzICdleHRlcm5hbCcgb3JcbiAgICBsaW5rLnByb3RvY29sIG5vdCBpbiBbJ2h0dHBzOicsICdodHRwOicsICc6JywgJ2ZpbGU6JywgbG9jYXRpb24ucHJvdG9jb2xdIG9yXG4gICAgbGluay5ob3N0bmFtZSBub3QgaW4gW2xvY2F0aW9uLmhvc3RuYW1lLCAnJ11cblxuICAgIHJlc3AiLCIndXNlIHN0cmljdCdcblxuaWYgd2luZG93PyBcbiAgd2luZG93Lmdsb2JhbCA9IGdsb2JhbCA9IHdpbmRvdyBcbmVsc2UgdW5sZXNzIGdsb2JhbD9cbiAgZ2xvYmFsID0ge31cblxuXyA9IHJlcXVpcmUgJ2xvZGFzaCdcbkNoYXBsaW4gPSByZXF1aXJlICdjaGFwbGluJ1xuTW9kZWwgPSByZXF1aXJlICcuLi9tb2RlbHMvbW9kZWwnXG51dGlscyA9IHJlcXVpcmUgJy4uL2xpYi91dGlscydcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBWaWV3IGV4dGVuZHMgQ2hhcGxpbi5WaWV3XG4gIGF1dG9SZW5kZXI6IHllc1xuXG4gICMgIyBQcmVjb21waWxlZCB0ZW1wbGF0ZXMgZnVuY3Rpb24gaW5pdGlhbGl6ZXIuXG4gIGdldFRlbXBsYXRlRnVuY3Rpb246IC0+XG4gICAgcmV0dXJuIEB0ZW1wbGF0ZSBpZiBAdGVtcGxhdGVcbiAgICBAX2NsYXNzTmFtZSA9IEBfY2xhc3NOYW1lIG9yIHV0aWxzLmNsYXNzTmFtZShAKVxuICAgIHJldHVybiBnbG9iYWxbQF9jbGFzc05hbWUucmVwbGFjZSAvVmlldyQvLCAnVGVtcGxhdGUnXVxuXG4gIGluaXRBdHRyaWJ1dGVzOiAtPlxuICAgIEBfY2xhc3NOYW1lID0gQF9jbGFzc05hbWUgb3IgdXRpbHMuY2xhc3NOYW1lKEApXG4gICAgZCA9IF8uZGFzaGVyaXplIEBfY2xhc3NOYW1lLmNoYXJBdCgwKS50b0xvd2VyQ2FzZSgpICsgQF9jbGFzc05hbWUuc2xpY2UoMSlcbiAgICBAY2xhc3NOYW1lID0gdW5sZXNzIEBjbGFzc05hbWUgdGhlbiBkIGVsc2UgQGNsYXNzTmFtZSArICcgJyArIGRcblxuICBjb25zdHJ1Y3RvcjogKG9wdGlvbnMpLT5cbiAgICBAaW5pdEF0dHJpYnV0ZXMoKVxuXG4gICAgQG1vZGVsID0gbmV3IE1vZGVsIHVubGVzcyBAbW9kZWxcblxuICAgIHN1cGVyXG5cbiAgZGlzcG9zZTogLT5cbiAgICB1bmxlc3MgZ2xvYmFsLkVOViBpcyAncHJvZHVjdGlvbicgb3IgQG5vRGVidWcgXG4gICAgICBsb2cgXCJbYz0nZm9udC13ZWlnaHQ6Ym9sZDttYXJnaW4tbGVmdDoyMHB4O2NvbG9yOiMyNjhiZDI7J11cXFxu4p2WICN7QF9jbGFzc05hbWV9OjpbY11bYz0nZm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjojYjU4OTAwJ11cXFxuZGlzcG9zZVtjXVxcdFxcdFwiLCBAXG5cbiAgICAoQGJlZm9yZURpc3Bvc2U/IChjYW5EaXNwb3NlKT0+IHN1cGVyIHVubGVzcyBjYW5EaXNwb3NlIGlzIGZhbHNlKSBvciBzdXBlclxuXG4gIGRlbGVnYXRlRXZlbnRzOiAoZXZlbnRzLCBrZWVwT2xkKSAtPlxuICAgIHN1cGVyXG4gICAgQGRlbGVnYXRlSGFtbWVyRXZlbnRzKClcblxuICBkb1JlbmRlcjogLT5cbiAgICB0ZW1wbGF0ZUZ1bmMgPSBAZ2V0VGVtcGxhdGVGdW5jdGlvbigpXG4gICAgcmV0dXJuIEAgdW5sZXNzIHR5cGVvZiB0ZW1wbGF0ZUZ1bmMgaXMgJ2Z1bmN0aW9uJ1xuICAgIFxuICAgIGh0bWwgPSB0ZW1wbGF0ZUZ1bmMgQGdldFRlbXBsYXRlRGF0YSgpXG5cbiAgICAjIE5vIGhhbmRsZSBmb3Igbm9XcmFwLCBpdCdzIG5vdCBhIGdvb2Qgd2F5IHRvIG1ha2UgdGhpbmdzXG5cbiAgICAjIFRoaXMgaXMgZm9yIHNlY3VyaXR5IG9uIHdpbjgvd2luUlRcbiAgICBodG1sID0gdG9TdGF0aWNIVE1MKGh0bWwpIGlmIGdsb2JhbC50b1N0YXRpY0hUTUw/XG5cbiAgICBAJGVsLmh0bWwgaHRtbFxuXG4gICAgQGVuaGFuY2UoKVxuICAgIEBhZnRlclJlbmRlcj8oKVxuXG4gIHJlbmRlcjogLT5cbiAgICByZXR1cm4gZmFsc2UgaWYgQGRpc3Bvc2VkXG5cbiAgICB1bmxlc3MgZ2xvYmFsLkVOViBpcyAncHJvZHVjdGlvbidcbiAgICAgIGxvZyhcIltjPSdmb250LXdlaWdodDpib2xkO21hcmdpbi1sZWZ0OjIwcHg7Y29sb3I6IzI2OGJkMjsnXVxcXG7inZYgI3tAX2NsYXNzTmFtZX06OltjXVtjPSdmb250LXdlaWdodDpib2xkO2NvbG9yOiNiNTg5MDAnXVxcXG5yZW5kZXJbY11cXHRcXHRcIiwgQCkgdW5sZXNzIEBub0RlYnVnXG5cbiAgICAoQGJlZm9yZVJlbmRlcj8gKGNhblJlbmRlcik9PiBAZG9SZW5kZXIoKSB1bmxlc3MgY2FuUmVuZGVyIGlzIGZhbHNlKSBvciBcbiAgICBAZG9SZW5kZXIoKVxuXG4gIGVuaGFuY2U6IC0+XG4gICAgQCQoJ2FbZGF0YS1yb3V0ZV0nKS5lYWNoIC0+XG4gICAgICBAJCA9ICQgQFxuXG4gICAgICAjIFdlIHVzZSBwcmV2aW91cyBwYXJhbWV0ZXJzIGV4Y2VwdCBpZiB3ZSBoYXZlIGEgZGF0YS1yb3V0ZS1yZXNldFxuICAgICAgcm91dGVQYXJhbXMgPSBpZiBAJC5pcygnW2RhdGEtcm91dGUtcmVzZXRdJykgdGhlbiB7fVxuICAgICAgZWxzZSBfLmV4dGVuZCB7fSwgbWVkaWF0b3IubGFzdFJvdXRlUGFyYW1zXG5cbiAgICAgIHJvdXRlTmFtZSA9IG51bGxcblxuICAgICAgZm9yIGssIHYgb2YgQCQuZGF0YSgpXG4gICAgICAgIGlmIGsgaXMgJ3JvdXRlJ1xuICAgICAgICAgIHJvdXRlTmFtZSA9IHZcbiAgICAgICAgZWxzZSBpZiBrIGlzbnQgJ3JvdXRlUmVzZXQnIGFuZCAwIGlzIGsuaW5kZXhPZiAncm91dGUnXG4gICAgICAgICAgcm91dGVQYXJhbXNbKGsgPSBrLnN1YnN0ciA1KS5jaGFyQXQoMCkudG9Mb3dlckNhc2UoKSArIGsuc2xpY2UgMV0gPSB2XG5cbiAgICAgIHVyaSA9ICcjJ1xuICAgICAgdHJ5IHVyaSA9IENoYXBsaW4udXRpbHMucmV2ZXJzZSByb3V0ZU5hbWUsIHJvdXRlUGFyYW1zXG5cbiAgICAgIEAkLmF0dHIgJ2hyZWYnLCB1cmlcblxuICAgICAgIyBDb21wYXRpYmlsaXR5IGJyb3dzZXIgaXNzdWVcbiAgICAgIEAkLm9mZiAnY2xpY2snICMganVzdCBpbiBjYXNlXG4gICAgICBAJC5vbiAnY2xpY2snLCAoZSktPlxuICAgICAgICByZXR1cm4gaWYgQ2hhcGxpbi51dGlscy5tb2RpZmllcktleVByZXNzZWQoZXZlbnQpXG4gICAgICAgIFxuICAgICAgICBlbCA9IGV2ZW50LmN1cnJlbnRUYXJnZXRcbiAgICAgICAgaXNBbmNob3IgPSBlbC5ub2RlTmFtZSBpcyAnQSdcbiAgICAgICAgaHJlZiA9IGVsLmdldEF0dHJpYnV0ZSgnaHJlZicpIHx8IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1ocmVmJykgfHwgbnVsbFxuXG4gICAgICAgIENoYXBsaW4udXRpbHMucmVkaXJlY3RUb1xuICAgICAgICAgIHVybDogaHJlZlxuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgcmV0dXJuIGZhbHNlIl19
return require(1);
}))