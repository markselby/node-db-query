var EventEmitter = require('events').EventEmitter;
var Util = require('util');

var Base = function(cheese) {

};

Base.prototype.hasCheese = function() {
  return 'Yes, has cheese';
}

var Insert = function Insert(fields) {
  EventEmitter.call(this);
};

Util.inherits(Insert, EventEmitter);
Util.inherits(Insert, Base);  // Events and callbacks

var p = Insert.prototype;

// Return this query as a SQL statement
p.values = function (values) {
  console.log(values);
  this._values = values;
};

module.exports = Insert;
