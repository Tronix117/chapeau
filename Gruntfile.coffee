'use strict'

# Package
# =======
pkg = require './package.json'

require 'coffee-script/register'

banner = """
/*!
 * Chapeau #{pkg.version}
 *
 * Chapeau may be freely distributed under the MIT license.
 * For all details and documentation:
 * https://github.com/Tronix117/chapeau
 */

"""

umdHead = '''
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['backbone', 'lodash', 'chaplin'], factory);
  } else if (typeof module === 'object' && module && module.exports) {
    module.exports = factory(require('backbone'), require('lodash'), require('chaplin'));
  } else if (typeof require === 'function') {
    factory(window.Backbone, window._ || window.Backbone.utils, window.Chaplin);
  } else {
    throw new Error('Chaplin requires Common.js or AMD modules');
  }
}(this, function(Backbone, _, Chaplin) {
  function require(name) {
    return {backbone: Backbone, lodash: _, chaplin: Chaplin}[name];
  }

  require =
'''

umdTail = '''
  return require(1);
}))
'''

module.exports = (grunt) ->

  # Configuration
  # =============
  grunt.initConfig {

    # Package
    # -------
    pkg

    browserify:
      dist:
        files:
          'build/chapeau.js': ['./src/chapeau.coffee']
        options: {
          banner
          external: ['backbone', 'lodash', 'chaplin']
          transform: ['coffeeify']
          browserifyOptions:
            debug: true
            extensions: ['.coffee']
          postBundleCB: (err, src, next) ->
            if err
              next err
            else
              src = umdHead + src + umdTail
              next null, new Buffer src
        }

    # Minify
    # ======
    uglify:
      options:
        mangle: true
      universal:
        files:
          'build/chapeau.min.js': 'build/chapeau.js'

    # Compression
    # ===========
    compress:
      files:
        src: 'build/chapeau.min.js'
        dest: 'build/chapeau.min.js.gz'

    # Watching for changes
    # ====================
    watch:
      coffee:
        files: ['src/**/*.coffee', 'test/*.coffee']
        tasks: ['test']
  }

  # Dependencies
  # ============
  for name of pkg.devDependencies when name.startsWith 'grunt-'
    grunt.loadNpmTasks name

  # Building
  # ========
  grunt.registerTask 'build', ['browserify', 'uglify', 'compress']
  grunt.registerTask 'default', ['build']