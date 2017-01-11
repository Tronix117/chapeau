'use strict'

if window? 
  window.global = global = window 
else unless global?
  global = {}

_ = require 'lodash'
Chaplin = require 'chaplin'
View = require './view'
utils = require '../lib/utils'

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