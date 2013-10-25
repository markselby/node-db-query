var events = require('events');
var util = require('util');
var inspect = require('util').inspect;
var pg = require(process.cwd() + '/node_modules/pg');

/**
 * Stuff that's common to all database query types
 */

// A connection is passed if the query is part of a transaction
var Querify = function() {

  // This must come before the changes to the prototype
  util.inherits(this, events.EventEmitter);

  var p = this.prototype;

  p.initialize = function initialize(connection, callback) {
    this.connection = connection;
    this.callback = callback;
  }

  p.execute = function execute() {
    pg.connect(this.connection, function(err, client, done) {
      if(err) {
        return console.error('error fetching client from pool', err);
      }
      this.client = client;
      this.done = done;

      client.query(this.sql, this.params, this.resultCb.bind(this));
    }.bind(this));
  }

  p.resultCb = function resultCb(err, result) {
    this.done();
    err ? this.emit('error', err) : this.emit('end', result);
    this.callback(err, result);
  }

  return this;
}

module.exports = Querify;
