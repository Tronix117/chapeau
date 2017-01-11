'use strict'

_ = require 'lodash'
Chaplin = require 'chaplin'

module.exports = class Model extends Chaplin.Model
  # Mixin a synchronization state machine
  _(@prototype).extend Chaplin.SyncMachine

  get: (k)->
    return super unless @[m = ('get' + k.charAt(0).toUpperCase() + k.slice 1)]
    @[m]()

  set: (k, v)->
    return super unless 'string' is typeof k and 
      @[m = ('set' + k.charAt(0).toUpperCase() + k.slice 1)]
    @[m](v)