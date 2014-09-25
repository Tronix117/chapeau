module.exports = (grunt) ->

  # Utilities
  # =========
  path = require 'path'

  # Package
  # =======
  pkg = require './package.json'
  componentsFolder = 'bower_components'

  # Modules
  # =======
  # TODO: Remove this as soon as uRequire releases 0.3 which will able to
  #  do this for us in the right order magically.
  modules = [
    'temp/chapeau/application.js'
    'temp/chapeau/mediator.js'
    'temp/chapeau/dispatcher.js'
    'temp/chapeau/composer.js'
    'temp/chapeau/controllers/controller.js'
    'temp/chapeau/models/collection.js'
    'temp/chapeau/models/model.js'
    'temp/chapeau/views/layout.js'
    'temp/chapeau/views/view.js'
    'temp/chapeau/views/collection_view.js'
    'temp/chapeau/lib/route.js'
    'temp/chapeau/lib/router.js'
    'temp/chapeau/lib/history.js'
    'temp/chapeau/lib/event_broker.js'
    'temp/chapeau/lib/support.js'
    'temp/chapeau/lib/composition.js'
    'temp/chapeau/lib/sync_machine.js'
    'temp/chapeau/lib/utils.js'
    'temp/chapeau.js'
  ]

  # Configuration
  # =============
  grunt.initConfig

    # Package
    # -------
    pkg: pkg

    # Clean
    # -----
    clean:
      build: 'build'
      temp: 'temp'
      components: componentsFolder
      test: ['test/temp*', 'test/coverage']

    # Compilation
    # -----------
    coffee:
      compile:
        files: [
          expand: true
          dest: 'temp/'
          cwd: 'src'
          src: '**/*.coffee'
          ext: '.js'
        ]

      test:
        files: [
          expand: true
          dest: 'test/temp/'
          cwd: 'test/spec'
          src: '**/*.coffee'
          ext: '.js'
        ]

      options:
        bare: true

    # Module conversion
    # -----------------
    urequire:
      AMD:
        bundlePath: 'temp/'
        outputPath: 'temp/'

        options:
          forceOverwriteSources: true
          relativeType: 'bundle'

    # Publishing via Git
    # ------------------
    transbrute:
      docs:
        remote: 'git@github.com:chapeaujs/chapeau.git'
        branch: 'gh-pages'
        files: [
          { expand: true, cwd: 'docs/', src: '**/*' }
        ]
      downloads:
        message: "Release #{pkg.version}."
        tag: pkg.version
        tagMessage: "Version #{pkg.version}."
        remote: 'git@github.com:chapeaujs/downloads.git'
        branch: 'gh-pages'
        files: [
          { expand: true, cwd: 'build/', src: 'chapeau.{js,min.js}' },
          {
            dest: 'bower.json',
            body: {
              name: 'chapeau',
              repo: 'chapeaujs/downloads',
              version: pkg.version,
              main: 'chapeau.js',
              scripts: ['chapeau.js'],
              dependencies: { backbone: '1.x' }
            }
          },
          {
            dest: 'component.json',
            body: {
              name: 'chapeau',
              repo: 'chapeaujs/downloads',
              version: pkg.version,
              main: 'chapeau.js',
              scripts: ['chapeau.js'],
              dependencies: (obj = {}; obj["#{ componentsFolder }/backbone"] = '1.x'; obj)
            }
          },
          {
            dest: 'package.json',
            body: {
              name: 'chapeau',
              version: pkg.version,
              description: 'Chapeau.js',
              main: 'chapeau.js',
              scripts: { test: 'echo "Error: no test specified" && exit 1' },
              repository: {
                type: 'git', url: 'git://github.com/chapeaujs/downloads.git'
              },
              author: 'Chapeau team',
              license: 'MIT',
              bugs: { url: 'https://github.com/chapeaujs/downloads/issues' },
              dependencies: { backbone: '~1.1.2', underscore: '~1.6.0' }
            }
          }
        ]

    # Module naming
    # -------------
    # TODO: Remove this when uRequire hits 0.3
    copy:
      universal:
        files: [
          expand: true
          dest: 'temp/'
          cwd: 'temp'
          src: '**/*.js'
        ]

        options:
          processContent: (content, path) ->
            name = ///temp/(.*)\.js///.exec(path)[1]
            # data = content
            data = content.replace /require\('/g, "loader('"
            """
            loader.register('#{name}', function(e, r, module) {
            #{data}
            });
            """

      amd:
        files: [
          expand: true
          dest: 'temp/'
          cwd: 'temp'
          src: '**/*.js'
        ]

        options:
          processContent: (content, path) ->
            name = ///temp/(.*)\.js///.exec(path)[1]
            content.replace ///define\(///, "define('#{name}',"

      test:
        files: [
          expand: true
          dest: 'test/temp/'
          cwd: 'temp'
          src: '**/*.js'
        ]

      beforeInstrument:
        files: [
          expand: true
          dest: 'test/temp-original/'
          cwd: 'test/temp'
          src: '**/*.js'
        ]

      afterInstrument:
        files: [
          expand: true
          dest: 'test/temp/'
          cwd: 'test/temp-original'
          src: '**/*.js'
        ]

    # Module concatenation
    # --------------------
    # TODO: Remove this when uRequire hits 0.3
    concat:
      universal:
        files: [
          dest: 'build/<%= pkg.name %>.js'
          src: modules
        ]

      options:
        separator: ';'

        banner: '''
        /*!
         * Chapeau <%= pkg.version %>
         *
         * Chapeau may be freely distributed under the MIT license.
         * For all details and documentation:
         * http://chapeaujs.org
         */

        (function(){

        var loader = (function() {
          var modules = {};
          var cache = {};

          var dummy = function() {return function() {};};
          var initModule = function(name, definition) {
            var module = {id: name, exports: {}};
            definition(module.exports, dummy(), module);
            var exports = cache[name] = module.exports;
            return exports;
          };

          var loader = function(path) {
            if (cache.hasOwnProperty(path)) return cache[path];
            if (modules.hasOwnProperty(path)) return initModule(path, modules[path]);
            throw new Error('Cannot find module "' + path + '"');
          };

          loader.register = function(bundle, fn) {
            modules[bundle] = fn;
          };
          return loader;
        })();


        '''
        footer: '''

        var regDeps = function(Backbone, _, Chaplin) {
          loader.register('backbone', function(exports, require, module) {
            module.exports = Backbone;
          });
          loader.register('underscore', function(exports, require, module) {
            module.exports = _;
          });
          loader.register('chaplin', function(exports, require, module) {
            module.exports = Chaplin;
          });
        };

        if (typeof define === 'function' && define.amd) {
          define(['backbone', 'underscore', 'chapeau'], function(Backbone, _) {
            regDeps(Backbone, _, Chaplin);
            return loader('chapeau');
          });
        } else if (typeof module === 'object' && module && module.exports) {
          regDeps(require('backbone'), require('underscore'), require(window.Chaplin));
          module.exports = loader('chapeau');
        } else if (typeof require === 'function') {
          regDeps(window.Backbone, window._ || window.Backbone.utils, window.Chaplin);
          window.Chapeau = loader('chapeau');
        } else {
          throw new Error('Chapeau requires Common.js or AMD modules');
        }

        })();
        '''

    # Lint
    # ----
    coffeelint:
      source: 'src/**/*.coffee'
      grunt: 'Gruntfile.coffee'

    # Instrumentation
    # ---------------
    instrument:
      files: [
        'test/temp/chapeau.js'
        'test/temp/chapeau/**/*.js'
      ]

      options:
        basePath: '.'

    storeCoverage:
      options:
        dir : '.'
        json : 'coverage.json'
        coverageVar : '__coverage__'

    makeReport:
      src: 'coverage.json'
      options:
        type: 'html'
        dir: 'test/coverage'

    # Browser dependencies
    # --------------------
    bower:
      install:
        options:
          targetDir: "./test/#{ componentsFolder }"
          cleanup: true

    # Test runner
    # -----------
    mocha:
      index:
        src: ['test/index.html']
        # options:
        #   grep: 'autoAttach'
        #   mocha:
        #     grep: 'autoAttach'

    # Minify
    # ------
    uglify:
      options:
        mangle: true
      universal:
        files:
          'build/chapeau.min.js': 'build/chapeau.js'

    # Compression
    # -----------
    compress:
      files: [
        src: 'build/chapeau.min.js'
        dest: 'build/chapeau.min.js.gz'
      ]

    # Watching for changes
    # --------------------
    watch:
      coffee:
        files: ['src/**/*.coffee']
        tasks: [
          'coffee:compile'
          'urequire'
          'copy:amd'
          'copy:test'
          'mocha'
        ]

      test:
        files: ['test/spec/*.coffee'],
        tasks: [
          'coffee:test'
          'mocha'
        ]

  # Events
  # ======
  grunt.event.on 'mocha.coverage', (coverage) ->
    # This is needed so the coverage reporter will find the coverage variable.
    global.__coverage__ = coverage

  # Dependencies
  # ============
  for name of pkg.devDependencies when name.substring(0, 6) is 'grunt-'
    grunt.loadNpmTasks name

  # Tasks
  # =====

  # Prepare
  # -------
  grunt.registerTask 'prepare', [
    'clean'
    'bower'
    'clean:components'
  ]

  # Build
  # -----

  grunt.registerTask 'build', [
    'coffee:compile'
    'copy:universal'
    'concat:universal'
    'uglify'
  ]

  # Lint
  # ----
  grunt.registerTask 'lint', 'coffeelint'

  # Test
  # ----
  grunt.registerTask 'test', [
    'coffee:compile'
    'urequire'
    'copy:amd'
    'copy:test'
    'coffee:test'
    'mocha'
  ]

  # Coverage
  # --------
  grunt.registerTask 'cover', [
    'coffee:compile'
    'urequire'
    'copy:amd'
    'copy:test'
    'coffee:test'
    'copy:beforeInstrument'
    'instrument'
    'mocha'
    'storeCoverage'
    'copy:afterInstrument'
    'makeReport'
  ]

  # Test Watcher
  # ------------
  grunt.registerTask 'test-watch', [
    'test'
    'watch'
  ]

  # Releasing
  # ---------

  grunt.registerTask 'check:versions:component', 'Check that package.json and bower.json versions match', ->
    componentVersion = grunt.file.readJSON('bower.json').version
    unless componentVersion is pkg.version
      grunt.fail.warn "bower.json is version #{componentVersion}, package.json is #{pkg.version}."
    else
      grunt.log.ok()

  grunt.registerTask 'check:versions:changelog', 'Check that CHANGELOG.md is up to date', ->
    # Require CHANGELOG.md to contain "Chapeau VERSION (DIGIT"
    changelogMd = grunt.file.read('CHANGELOG.md')
    unless RegExp("Chapeau #{pkg.version} \\(\\d").test changelogMd
      grunt.fail.warn "CHANGELOG.md does not seem to be updated for #{pkg.version}."
    else
      grunt.log.ok()

  grunt.registerTask 'check:versions:docs', 'Check that package.json and docs versions match', ->
    template = grunt.file.read path.join('docs', '_layouts', 'default.html')
    match = template.match /^version: ((\d+)\.(\d+)\.(\d+)(?:-[\dA-Za-z\-]*)?)$/m
    unless match
      grunt.fail.warn "Version missing in docs layout."
    docsVersion = match[1]
    unless docsVersion is pkg.version
      grunt.fail.warn "Docs layout is version #{docsVersion}, package.json is #{pkg.version}."
    else
      grunt.log.ok()

  grunt.registerTask 'check:versions', [
    'check:versions:component',
    'check:versions:changelog',
    'check:versions:docs'
  ]

  grunt.registerTask 'release:git', 'Check context, commit and tag for release.', ->
    prompt = require 'prompt'
    prompt.start()
    prompt.message = prompt.delimiter = ''
    prompt.colors = false
    # Command/query wrapper, turns description object for `spawn` into runner
    command = (desc, message) ->
      (next) ->
        grunt.log.writeln message if message
        grunt.util.spawn desc, (err, result, code) -> next(err)
    query = (desc) ->
      (next) -> grunt.util.spawn desc, (err, result, code) -> next(err, result)
    # Help checking input from prompt. Returns a callback that calls the
    # original callback `next` only if the input was as expected
    checkInput = (expectation, next) ->
      (err, input) ->
        unless input and input.question is expectation
          grunt.fail.warn "Aborted: Expected #{expectation}, got #{input}"
        next()

    steps = []
    continuation = this.async()

    # Check for master branch
    steps.push query(cmd: 'git', args: ['rev-parse', '--abbrev-ref', 'HEAD'])
    steps.push (result, next) ->
      result = result.toString().trim()
      if result is 'master'
        next()
      else
        prompt.get([
            description: "Current branch is #{result}, not master. 'ok' to continue, Ctrl-C to quit."
            pattern: /^ok$/, required: true
          ],
          checkInput('ok', next)
        )
    # List dirty files, ask for confirmation
    steps.push query(cmd: 'git', args: ['status', '--porcelain'])
    steps.push (result, next) ->
      grunt.fail.warn "Nothing to commit." unless result.toString().length

      grunt.log.writeln "The following dirty files will be committed:"
      grunt.log.writeln result
      prompt.get([
          description: "Commit these files? 'ok' to continue, Ctrl-C to quit.",
          pattern: /^ok$/, required: true
        ],
        checkInput('ok', next)
      )

    # Commit
    steps.push command(cmd: 'git', args: ['commit', '-a', '-m', "Release #{pkg.version}"])

    # Tag
    steps.push command(cmd: 'git', args: ['tag', '-a', pkg.version, '-m', "Version #{pkg.version}"])

    grunt.util.async.waterfall steps, continuation

  grunt.registerTask 'release', [
    'check:versions',
    'release:git',
    'build',
    'transbrute:docs',
    'transbrute:downloads'
  ]

  # Publish Documentation
  # ---------------------
  grunt.registerTask 'docs:publish', ['check:versions:docs', 'transbrute:docs']

  # Default
  # -------
  grunt.registerTask 'default', [
    'lint'
    'clean'
    'build'
    'test'
  ]