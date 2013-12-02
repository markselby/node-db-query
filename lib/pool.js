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
  select: require('./select'),
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

p.end = function() {
  console.log(this.pool);
  this.pool.end();
}
// Get a connection from the pool
// p.connect = function(err, client, done) {
//   pg.connect(this.pool, );
// }


p['insert'] = function(table) { return new types['insert'](table); }

p['select'] = function(fields, callback) {
  return new types['select'](fields, this.pool, callback);
}

p['named'] = function(name, params, callback) {
  // console.log('this : ');
  // console.log(this);
  return new types['named'](name, params, this.pool, callback);
}

module.exports = function(pool) {
  return new Pool(pool);
}
