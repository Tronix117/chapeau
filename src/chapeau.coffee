# Main entry point into Chapeau module.
# Load all components and expose them.

Chapeau = window.Chapeau =
  Application:    require './chapeau/application'
  mediator:       require './chapeau/mediator'
  # Dispatcher:     require './chapeau/dispatcher'
  Controller:     require './chapeau/controllers/controller'
  # Composer:       require './chapeau/composer'
  # Composition:    require './chapeau/lib/composition'
  Collection:     require './chapeau/models/collection'
  Model:          require './chapeau/models/model'
  Layout:         require './chapeau/views/layout'
  View:           require './chapeau/views/view'
  CollectionView: require './chapeau/views/collection_view'
  # Route:          require './chapeau/lib/route'
  # Router:         require './chapeau/lib/router'
  # EventBroker:    require './chapeau/lib/event_broker'
  # support:        require './chapeau/lib/support'
  # SyncMachine:    require './chapeau/lib/sync_machine'
  utils:          require './chapeau/lib/utils'

module.exports = Chapeau