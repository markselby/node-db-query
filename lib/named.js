var Querify = require('./querify');
var inspect = require('util').inspect;
var grunt = require('grunt');
var events = require('events');

// A file of named queries
try {
  var namedQueries = exports.queries = grunt.file.readYAML('config/queries.yml')
} catch (e) {}

var Named = function Named(name, params, connection, callback) {
  this.initialize(connection, callback);
  this.sql = namedQueries[name];
  if(!this.sql) { throw 'Named query "' + name + '" not found'; }
  this.params = params || [];
};

// Add base query functions
Querify.call(Named);

module.exports = Named;
