# node-db-query

Create SQL queries programatically in Node.js. Loosely based on Rails' ActiveRelation.

## Getting Started
Install the module with: `npm install db-query`

## Examples
```javascript
var Query = require('db-query');

var options = { id: [1,2,3,4] };
// or options = { id: '1,2,3,4' };

var q = new Query()
  .select('*')
  .from('users')
  .join('LEFT JOIN posts ON posts.user_id = users.id')
  .order('posts.updated_at DESC')
  .limit(10);

if (options.id) {
  q.ids(options.id);
  // This is using Postgres' ANY format rather than id IN blah because it's much more efficient
  q.where('id = ANY(' + q.paramNo() + '::int[])');
}

q.on('row', function(row) { console.log(row); })
  .on('error', function(err) { console.log(err); })
  .on('end', function(data) { console.log(data); })
  .execute();
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_v0.1.0_

## License
Copyright (c) 2013 Mark Selby  
Licensed under the MIT license.
