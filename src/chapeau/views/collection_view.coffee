'use strict'

if window? 
  window.global = global = window 
else unless global?
  global = {}

_ = require 'underscore'
Chaplin = require 'chaplin'
View = require 'chapeau/views/view'
utils = require 'chapeau/lib/utils'

module.exports = class CollectionView extends Chaplin.CollectionView
  # This class doesn’t inherit from the application-specific View class,
  # so we need to borrow the methods from the View prototype:
  getTemplateFunction: View::getTemplateFunction
  initAttributes: View::initAttributes
  #initSelectors: View::initSelectors
  #redirectTo: View::redirectTo
  useCssAnimation: true
  enhance: View::enhance
  dispose: View::dispose
  render: View::render

  constructor: (options)->
    @_className = utils.className(@)

    # Pre-complete @itemView and @listSelector
    @itemView = global[@_className.replace 'View', 'ItemView'] unless @itemView
    if not @listSelector and global[@_className.replace /View$/, 'Template']
      @listSelector = '.list'

    @initAttributes()

    @model = new Model unless @model

    super

  getTemplateData: ->
    # Add back model support to Chaplin
    templateData = super

    if @model
      # Erase model serialized with original templateData which include length
      # and synced flag
      templateData = _.extend Chaplin.utils.serialize @model, templateData

      # force synced flag to false if model is not in sync
      if typeof @model.isSynced is 'function' and not @model.isSynced()
        templateData.synced = false

    templateData

  doRender: ->
    templateFunc = @getTemplateFunction()
    return @ unless typeof templateFunc is 'function'
    
    html = templateFunc @getTemplateData()

    # No handle for noWrap, it's not a good way to make things

    # This is for security on win8/winRT
    html = toStaticHTML(html) if global.toStaticHTML?

    @$el.html html

    # Set the $list property with the actual list container.
    listSelector = _.result this, 'listSelector'

    @$list = if listSelector then @$(listSelector) else @$el

    @initFallback()
    @initLoadingIndicator()

    # Render all items.
    @renderAllItems() if @renderItems

    @enhance()
    @afterRender?()

  resetCollection: (newCollection)->
    @stopListening @collection

    @collection = newCollection

    @listenTo @collection, 'add', @itemAdded
    @listenTo @collection, 'remove', @itemRemoved
    @listenTo @collection, 'reset sort', @itemsReset

    @itemsReset()