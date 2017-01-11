'use strict'

if window? 
  window.global = global = window 
else unless global?
  global = {}

_ = require 'lodash'
Chaplin = require 'chaplin'
Model = require '../models/model'
utils = require '../lib/utils'

module.exports = class View extends Chaplin.View
  autoRender: yes

  # # Precompiled templates function initializer.
  getTemplateFunction: ->
    return @template if @template
    @_className = @_className or utils.className(@)
    return global[@_className.replace /View$/, 'Template']

  initAttributes: ->
    @_className = @_className or utils.className(@)
    d = _.dasherize @_className.charAt(0).toLowerCase() + @_className.slice(1)
    @className = unless @className then d else @className + ' ' + d

  constructor: (options)->
    @initAttributes()

    @model = new Model unless @model

    super

  dispose: ->
    unless global.ENV is 'production' or @noDebug 
      log "[c='font-weight:bold;margin-left:20px;color:#268bd2;']\
❖ #{@_className}::[c][c='font-weight:bold;color:#b58900']\
dispose[c]\t\t", @

    (@beforeDispose? (canDispose)=> super unless canDispose is false) or super

  delegateEvents: (events, keepOld) ->
    super
    @delegateHammerEvents()

  doRender: ->
    templateFunc = @getTemplateFunction()
    return @ unless typeof templateFunc is 'function'
    
    html = templateFunc @getTemplateData()

    # No handle for noWrap, it's not a good way to make things

    # This is for security on win8/winRT
    html = toStaticHTML(html) if global.toStaticHTML?

    @$el.html html

    @enhance()
    @afterRender?()

  render: ->
    return false if @disposed

    unless global.ENV is 'production'
      log("[c='font-weight:bold;margin-left:20px;color:#268bd2;']\
❖ #{@_className}::[c][c='font-weight:bold;color:#b58900']\
render[c]\t\t", @) unless @noDebug

    (@beforeRender? (canRender)=> @doRender() unless canRender is false) or 
    @doRender()

  enhance: ->
    @$('a[data-route]').each ->
      @$ = $ @

      # We use previous parameters except if we have a data-route-reset
      routeParams = if @$.is('[data-route-reset]') then {}
      else _.extend {}, mediator.lastRouteParams

      routeName = null

      for k, v of @$.data()
        if k is 'route'
          routeName = v
        else if k isnt 'routeReset' and 0 is k.indexOf 'route'
          routeParams[(k = k.substr 5).charAt(0).toLowerCase() + k.slice 1] = v

      uri = '#'
      try uri = Chaplin.utils.reverse routeName, routeParams

      @$.attr 'href', uri

      # Compatibility browser issue
      @$.off 'click' # just in case
      @$.on 'click', (e)->
        return if Chaplin.utils.modifierKeyPressed(event)
        
        el = event.currentTarget
        isAnchor = el.nodeName is 'A'
        href = el.getAttribute('href') || el.getAttribute('data-href') || null

        Chaplin.utils.redirectTo
          url: href

        event.preventDefault()
        return false