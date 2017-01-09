// Karma configuration
// Generated on Wed Jan 04 2017 15:48:10 GMT+0100 (CET)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '.',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
        'scripts/bower_components/api-check/dist/api-check.js',
        'scripts/bower_components/jquery/dist/jquery.js',
        'scripts/bower_components/angular/angular.js',
        'scripts/bower_components/angular-route/angular-route.js',
        'scripts/bower_components/angular-mocks/angular-mocks.js',
        'scripts/bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
        'scripts/bower_components/angular-tree-control/angular-tree-control.js',
        'scripts/bower_components/angular-formly/dist/formly.js',
        'scripts/bower_components/angular-formly-templates-bootstrap/dist/angular-formly-templates-bootstrap.js',
        'scripts/bower_components/angular-smart-table/dist/smart-table.js',
        'scripts/bower_components/angular-bootstrap-grid-tree/src/tree-grid-directive.js',
        'scripts/bower_components/angular-ui-router/release/angular-ui-router.js',
        'scripts/bower_components/angular-cookies/angular-cookies.js ',
        'scripts/bower_components/angular-permission/dist/angular-permission.js',
        'scripts/bower_components/angular-translate/angular-translate.js',
        'scripts/bower_components/angular-translate-storage-cookie/angular-translate-storage-cookie.js',
        'scripts/bower_components/angular-translate-loader-static-files/angular-translate-loader-static-files.js',
        'scripts/bower_components/angular-sanitize/angular-sanitize.js',
        'scripts/bower_components/angular-ui-select/dist/select.js',
        'scripts/bower_components/bootstrap/dist/js/bootstrap.js',
        'scripts/bower_components/angular-moment-picker/dist/angular-moment-picker.js',

        'node_modules/moment/min/moment-with-locales.js',
        'node_modules/angular-bootstrap-datetimepicker/src/js/datetimepicker.js',
        'node_modules/angular-bootstrap-datetimepicker/src/js/datetimepicker.templates.js',

        'scripts/myApp.js',
        'scripts/controllers/*.js',
        'scripts/services/*.js',
        'scripts/directives/*.js',
        'scripts/configs/*.js',

        'tests/*.js',
    ],

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // time (ms) browsers wait for messages before disconnecting
    browserNoActivityTimeout: 30000,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome','Chromium', 'Firefox', 'PhantomJS', 'ChromeCanary', 'Safari'],

    plugins: [
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-phantomjs-launcher',
      'karma-safari-launcher',
      'karma-jasmine',
      'karma-junit-reporter'
    ],

    junitReporter: {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    }
  })
}