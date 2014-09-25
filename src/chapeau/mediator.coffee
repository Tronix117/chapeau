'use strict'

Chaplin = require 'chaplin'

mediator = Chaplin.mediator

mediator.onLy = (eventName)->
  @offLy eventName
  @on.apply @, arguments

mediator.offLy = (eventName)->
  delete mediator._events[eventName]

module.exports = mediator