'use strict'

if window? 
  window.global = global = window 
else unless global?
  global = {}

_ = require 'lodash'
Chaplin = require 'chaplin'

module.exports = class Controller extends Chaplin.Controller
  beforeAction: (params, route)->
    unless global.ENV is 'production'
      log("[c='font-size: 1.2em;color:#d33682;font-weight:bold']\
▚ #{route.name}[c]\t\t", route)
    super