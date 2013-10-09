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

