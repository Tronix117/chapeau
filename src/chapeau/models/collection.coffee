'use strict'

if window? 
  window.global = global = window 
else unless global?
  global = {}

_ = require 'underscore'
Chaplin = require 'chaplin'
Model = require 'chapeau/models/model'
utils = require 'chapeau/lib/utils'

module.exports = class Collection extends Chaplin.Collection
  # Mixin a synchronization state machine
  _(@prototype).extend Chaplin.SyncMachine

  # Use the project base model per default, not Chaplin.Model
  model: null

  subset: {}

  meta: null

  constructor: ->
    @_className = utils.className(@).replace 'Collection', ''
    @model = global[@_className + 'Model'] or Model unless @model
    @subset = {}
    @storeName = 'App::' + @_className
    super

  # Subfilter is same as filter but return a subcollection instead of an Array
  subfilter: (f)-> @subcollection filter: f
  
  first: (n)->
    models = super
    return models unless n
    @subfilter (model)-> -1 isnt models.indexOf model

  last: (n)->
    models = super
    return models unless n
    @subfilter (model)-> -1 isnt models.indexOf model

  # Override where, so that it returns a subcollection instead of an Array
  where: (attrs, first)->
    cacheKey = 'where:' + JSON.stringify(attrs)
    return (if first then undefined else []) if _.isEmpty attrs

    f = (model)->
      for key of attrs
        return false if attrs[key] isnt model.get key
      true

    if first
      @find f
    else
      @subset[cacheKey] or @subset[cacheKey] = @subfilter f