'use strict';

var grunt = require('grunt');
var EventEmitter = require('events').EventEmitter;
var Util = require('util');
var inspect = Util.inspect;

try {
  var pools = grunt.file.readYAML('config/database.yml');
} catch (e) {
  throw 'Please create a config/database.yml'
}

var types = {
  // select: require('./select'),
  // insert: require('./insert'),
  named:  require('./named')
  // update: require('./update'),
  // delete: require('./delete'),
  // raw:    require('./raw')
}

// A pool is basically a specific connection string, node-postgres takes care of the rest
var Pool = function Pool(pool) {
  if(!(typeof pool === 'string')) throw 'pool should be a string';
  if(!pools[pool]) throw 'pool must be a key name in config/database.yml';
  this.pool = pools[pool];
}

var p = Pool.prototype;

// Get a connection from the pool
// p.connect = function(err, client, done) {
//   pg.connect(this.pool, );
// }

p['select'] = function(fields) { return new types['select'](fields); }
p['insert'] = function(table) { return new types['insert'](table); }
p['named'] = function(name, params, callback) {
  // console.log('this : ');
  // console.log(this);
  return new types['named'](name, params, this.pool, callback);
}

module.exports = function(pool) {
  return new Pool(pool);
}
