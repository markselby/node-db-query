'use strict';

var grunt = require('grunt');
var EventEmitter = require('events').EventEmitter;
var Util = require('util');
var inspect = Util.inspect;
var pg = require(process.cwd() + '/node_modules/pg');

// A file of named queries
try {
  var namedQueries = exports.queries = grunt.file.readYAML('config/queries.yml')
} catch (e) {}

try {
  var pools = grunt.file.readYAML('config/database.yml');
} catch (e) {
  throw 'Please create a config/database.yml'
}

var types = {
  select: require('./select'),
  insert: require('./insert')
  // update: require('./update'),
  // delete: require('./delete'),
  // named:  require('./named'),
  // raw:    require('./raw')
}

var Pool = function Pool(pool) {
  if(!(typeof pool == 'string')) throw 'pool should be a string';
  if(!pools[pool]) throw 'pool must be a key name in config/database.yml';
  this.pool = pools[pool];
}

var p = Pool.prototype;

p['select'] = function(fields) { return new types['select'](fields); }
p['insert'] = function(table) { return new types['insert'](table); }

module.exports = function(pool) {
  return new Pool(pool);
}
