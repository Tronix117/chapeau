'use strict'

if window? 
  window.global = global = window 
else unless global?
  global = {}

_ = require 'underscore'
Chaplin = require 'chaplin'
utils = require 'chapeau/lib/utils'
Collection = require 'chapeau/models/collection'

global.mediator = mediator = require 'chapeau/mediator'

module.exports = class Application extends Chaplin.Application
  settings:
    controllerSuffix: '-controller'
    collectionsAutoSingleton: true
    globalAutoload: true

  classList:
    views: {}
    collections: {}
    models: {}
    helpers: {}
    templates: {}
    controllers: {}
    misc: {}
    bases: {}

  orderedRequireList:
    views: []
    collections: []
    models: []
    helpers: []
    templates: []
    controllers: []
    misc: []
    bases: []


  constructor: (options) ->
    _.extend @settings, @options, options

    global.dummyCollection = new Collection

    @autoload() if @settings.globalAutoload

    super @settings

  initMediator: ->
    # Declare additional properties for mediator bellow

    if @settings.collectionsAutoSingleton
      for collectionPath, Col of @classList.collections
        name = utils.pluralize collectionPath.replace /-collection$/, ''
        mediator[name] = new Col

    mediator.canUseLocalStorage = @_checkLocalStorage()

    # Seal the mediator
    super
  
  _checkLocalStorage: ->
    test = 'test'
    try
      localStorage.setItem test, test
      localStorage.removeItem test
      return true
    catch e
      return false

  autoload: ->
    global.application = @

    for r in (global.require or require).list()
      topDir = r.split('/')[0]
      if @orderedRequireList[topDir]
        if topDir is 'views' and not _.endsWith r, '-view'
          @orderedRequireList.templates.push r
        else if _(r).startsWith 'helpers/base'
          @orderedRequireList.bases.push r
        else
          @orderedRequireList[topDir].push r
      else
        @orderedRequireList.misc.push r

    # Fix for views, collection view must be loaded after views, and usualy path
    # of subviews is `collectionview-name/subitem` which need to be loaded
    # before `collectionview-name`, a sort to have the longer path first should
    # be enough
    # Abstract always comes first
    sortr = (a, b)-> # Sort: put abstract first
      if -1 isnt (bi = b.indexOf 'abstract') or -1 isnt a.indexOf 'abstract'
        return bi
      b.split('/').length - a.split('/').length

    baseOrder = [
      'view', 'layout', 'controller', 'model', 'collection', 'collection_view' ]

    baseSortr = (a, b)->
      return 1 if -1 is a = baseOrder.indexOf a.split('/').pop()
      return -1 if -1 is b = baseOrder.indexOf b.split('/').pop()
      a - b

    @orderedRequireList.views.sort sortr
    @orderedRequireList.controllers.sort sortr
    @orderedRequireList.models.sort sortr
    @orderedRequireList.collections.sort sortr
    @orderedRequireList.bases.sort baseSortr

    @preload 'bases'
    @preload 'helpers'
    @preload 'models'
    @preload 'collections'
    @preload 'templates'
    @preload 'views'
    @preload 'controllers'

  preload: (type)->
    for r in @orderedRequireList[type]
      dirs = r.split '/'
      dirs.shift()
      if (type is 'views' or type is 'templates' or type is 'controllers') and
      dirs[dirs.length - 2] is dirs[dirs.length - 1].replace('-view', '')
        dirs[dirs.length - 2] = ''
      
      d = dirs.join('-')

      switch type
        when 'views', 'collections', 'controllers'
          name = _.classify d
        when 'bases'
          name = _.classify d.replace 'base-', ''
        else
          name = _.classify "#{d}-#{type.slice 0, -1}"

      global[name] = @classList[type][d] = require r
    return

  start: ->
    return (@beforeStart => super) if 'function' is typeof @beforeStart
    super
