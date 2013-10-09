var named = function(name, params, cb) {
  var q = new this.Query(cb);
  q.name(name);
  q.raw(namedQueries[name]);
  q._params = params;
  // q.on('end', function(result) { cb(result); });
  q.execute();
  return q;
}
