'use strict'

if window? 
  window.global = global = window 
else unless global?
  global = {}

_ = require 'underscore'
Chaplin = require 'chaplin'
View = require 'chapeau/views/view'
utils = require 'chapeau/lib/utils'

module.exports = class Layout extends Chaplin.Layout

  constructor: (options)->
    @_className = utils.className(@)
    super

  # Hotfix for single app page on windows
  isExternalLink: (link) ->
    resp = link.target is '_blank' or
    link.rel is 'external' or
    link.protocol not in ['https:', 'http:', ':', 'file:', location.protocol] or
    link.hostname not in [location.hostname, '']

    resp