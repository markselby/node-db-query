'use strict';

var EventEmitter = require('events').EventEmitter;
var Util = require('util');

var Query = function Query(pool) {
  EventEmitter.call(this);

  // Database connection pool. If none provided will try to use global 'dbPool'
  this.pool = pool || global.neoPool;

  this._select = [];            // Array of fields or string
  this._update = [];            // Target table for UPDATE 
  this._raw = '';               // Raw SQL

  this._highlight = [];         // Array of fields to highlight matching keywords when searching

  this._from = [];              // Target table(s) when SELECT

  this._set = [];               // For UPDATE xxx SET blah = blah
  this._join = [];              // Array or string of SQL JOIN statements
  this._where = [];             // Array or string of SQL WHERE clause
  this._group = [];             // Array or string of fields
  this._having = [];            // Array or string of conditions
  this._order = [];             // Array or string of statements
  this._limit = 20;
  this._offset = 0;
  this._as = '';                // Alias (ie this is a subquery)
  this._sql = '';               // Holds the SQL to be output
  this._sql_count = '';         // Holds the SQL to be output
  this._params = [];            // Using parameterized queries
  this._ids = undefined;        // Set when we're querying by id's
};

Util.inherits(Query, EventEmitter);

var p = Query.prototype;

// Apply the request query parameters
p.parameterize = function (params) {
  if (params.limit) { this.limit(params.limit); }
  if (params.offset) { this.offset(params.offset); return; }
  if (params.page) {
    this.offset((params.page - 1) * parseInt(params.limit, 10));
  }
};

p.count = function () {
  if (!this._sql_count.length) {
    this._sql_count = 'SELECT count(*)';
    this._sql_count += ' FROM ' + this._from.join(', ');
    if (this._join.length) { this._sql_count += ' ' + this._join.join(' '); }
    if (this._where.length) { this._sql_count += ' WHERE ' + this._where.join(' AND '); }
    if (this._having.length) { this._sql_count += ' HAVING ' + this._having.join(' AND '); }
  }
  return this._sql_count;
};

// Return this query as a SQL statement
p.sql = function () {
  if (!this._sql.length) {
    if(this._raw) {
      this._sql = this._raw;
    } else {
      if (this._select.length) {
        this._sql = 'SELECT ' + this._select.join(', ');
        this._sql += ' FROM ' + this._from.join(', ');
      } else {
        if (this._update.length) {
          this._sql = 'UPDATE ' + this._update.join(', ');
        }
      }
      if (this._set.length) { this._sql += ' SET ' + this._set.join(', '); }
      if (this._join.length) { this._sql += ' ' + this._join.join(' '); }
      if (this._where.length) { this._sql += ' WHERE ' + this._where.join(' '); }
      if (this._group.length) { this._sql += ' GROUP BY ' + this._group.join(', '); }
      if (this._having.length) { this._sql += ' HAVING ' + this._having.join(' AND '); }
      if (this._order.length) { this._sql += ' ORDER BY ' + this._order.join(', '); }
      if (this._limit) { this._sql += ' LIMIT ' + this._limit; }
      if (this._offset) { this._sql += ' OFFSET ' + this._offset; }
    }
  }
  return this._sql;
};

p.select = function (fields) {
  this._select.push(fields instanceof Array ? fields.join(', ') : fields);
  return this;
};

p.update = function (table) {
  this._update.push(table instanceof Array ? table.join(', ') : table);
  return this;
};

p.raw = function (sql) {
  this._raw = sql;
  return this;
};

p.set = function (values) {
  this._set.push(values instanceof Array ? values.join(', ') : values);
  return this;
};

p.highlight = function (fields, options) {
  options = options || {};
  var opt = 'MaxWords=35, MinWords=10, ShortWord=3, HighlightAll=FALSE, MaxFragments=10, FragmentDelimiter=" ... "';
  this._select.push(fields.map(function (field) {
    return "ts_headline('" + (options.config || 'english') + "', " + field + ", query, '" + opt + "') AS " + field;
  }).join(', '));
  return this;
};

p.from = function (tables) {
  this._from.push(tables instanceof Array ? tables.join(', ') : tables);
  return this;
};

p.join = function (tables) {
  this._join.push(tables instanceof Array ? tables.join(' ') : tables);
  return this;
};

p.where = function (conditions, conjunction, cond_conjunction) {
  if (this._where.length === 0) {
    conjunction = '';
  } else {
    if (conjunction === undefined){
      conjunction = 'AND';
    }
  }

  if (cond_conjunction === undefined){
    cond_conjunction = 'AND';
  }

  this._where.push(conjunction + ' (' + (conditions instanceof Array ? conditions.join(' ' + cond_conjunction + ' ') : conditions) + ')');
  return this;
};

p.or_where = function (conditions, cond_conjunction) {
  return this.where(conditions, "OR", cond_conjunction);
}

p.where_in = function (column, values, conjunction, cond_conjunction) {
  if (this._where.length === 0) {
    conjunction = '';
  } else {
    if (conjunction === undefined){
      conjunction = 'AND';
    }
  }

  if (cond_conjunction === undefined){
    cond_conjunction = '';
  } else {
    cond_conjunction = ' NOT';
  }

  var conditions = column + cond_conjunction + ' IN (';
  var params = [];
  for (var i=0; i < values.length; i++){
     params.push(this.paramNoData(values[i]));
  }
  conditions += params.join(', ') + ')';
  this._where.push(conjunction + ' (' + conditions + ')');
  return this;
};

p.not_where_in = function (column, values, conjuction) {
  return this.where_in(column, values, conjuction, 'NOT');
}

p.group = function (fields) {
  this._group.push(fields instanceof Array ? fields.join(', ') : fields);
  return this;
};

p.having = function (fields) {
  this._having.push(fields instanceof Array ? fields.join(', ') : fields);
  return this;
};

p.order = function (fields) {
  this._order.push(fields instanceof Array ? fields.join(', ') : fields);
  return this;
};

p.limit = function (max) {
  this._limit = max;
  return this;
};

p.offset = function (offset) {
  this._offset = offset;
  return this;
};

p.as = function (alias) {
  this._as = alias;
  return this;
};

p.param = function (data) {
  this._params.push(data);
  return this;
};

p.params = function () {
  return this._params;
};

p.paramNo = function () {
  return '$' + (this._params.length);
};

p.paramNoData = function (data) {
  this.param(data);
  return '$' + (this._params.length);
}

// Used in Postgres queries to be able to say : WHERE id = ANY($1::int[])
p.ids = function (ids) {
  if (ids === undefined) { throw 'SQL.ids called with ' + ids; }
  if (ids instanceof Array) { ids = ids.join(','); }
  this._params.push('{' + ids + '}');
  return this;
};

// Return this as a format suitable for node postgres
p.query = function () {
  var q = {
    text: this.sql(),
    values: this._params
  };
  return q;
};

// Run a sledgehammer style count query (same SQL, but with only count related parameters instead)
p.count_query = function () {
  return {
    text: this.count(),
    values: this.params()
  };
};

// Run this SQL. Options are : { rows: true|false, count:true|false|query }
p.execute = function (options, cb) {
  this.rows = [];
  this.cb = cb;
  this.pool.query(this.query())
    .on('error', this.error.bind(this))
    .on('row', this.row.bind(this))
    .on('end', this.end.bind(this));

  return this;
};

p.error = function (err) {
  this.emit('error', err);
};

// Store result rows as they come in
p.row = function (row) {
  this.rows.push(row);
  this.emit('row', row);
};

// This is called when a query has been executed
p.end = function () {
  this.emit('end', this.rows);
  if (this.rows.length) { this.emit('has-rows'); } else { this.emit('no-rows'); }
  if (this.cb) { this.cb(this.rows); }
};

module.exports = Query;
