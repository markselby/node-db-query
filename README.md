# node-db-query

Create SQL queries programatically in Node.js. Loosely based on Rails' ActiveRelation.
Works with node postgres.

## Getting Started
Install the module with: `npm install db-query`

You'll also need to `npm install pg`.

## Configuration

You'll need a config/database.yml that looks something like :
```yml
defaults: &defaults
  host: localhost

development:
  <<: *defaults
  database: writebox_development
  username: cheeese
  password: edam
  min: 1
  max: 1

production:
  <<: *defaults
  database: writebox_production
  username: cheese
  password: camembert
```

And optionally a config/queries.yml that looks something like (Note the optional use of parameters - $1, $2 etc.
) :
```yml
news-search:
  SELECT ts_headline(title, q, 'HighlightAll=TRUE') AS title, link, image, ts_headline(intro, q, 'HighlightAll=TRUE') AS intro
  FROM (SELECT title, link, image, intro, ts_rank_cd(tsv, q) AS rank, q FROM news, to_tsquery($1) as q
  WHERE tsv @@ q ORDER BY rank DESC OFFSET $2 LIMIT 20) AS results

news-search-count:
  SELECT count(*) FROM news WHERE tsv @@ to_tsquery($1)

news-latest:
  SELECT * FROM news LIMIT 10
```

And then use it like this :

```javascript
// Typical connection pool
var db = require('db-query')(process.env.NODE_ENV);

// Optional separate connection pool
var dbProd = require('db-query')('production');

// Example callback
function someCallback(rows) {
  console.log('Rows : ' + rows.length);
}

// Programmatic query
db.query('news', someCallback)
  .select('*')
  .on('error', function(err) { console.log(err); })
  .on('end', function(result) { console.log(result[0]); })
  .execute();

// Named query (from your config/queries.yml file)
db.named('news-search', ['syria', 20], someCallback)
  .on('error', function(err) { console.log(err); })
  .on('end', function(result) { console.log(result[0]); });

// Other example stuff
var options = { id: [1,2,3,4] };
// or options = { id: '1,2,3,4' };

var q = new Query(dbPool)
  .select('*')
  .from('users')
  .join('JOIN posts ON posts.user_id = users.id')
  .order('posts.updated_at DESC')
  .limit(10);

// Add some sample optional processing to the query
var food = 'cheese';

if (food) {
  // Get people by food
  q.join('JOIN foods ON foods.id = users.food_id')
  q.param(food);
  q.where('foods.name = ' + q.paramNo()); // This becomes : foods.name = $1
} else {
  // Get people by id(s)
  // q.ids is another form of q.param, but will join arrays and wraps the result in '{ }' braces.
  q.ids([1,2,3,4]); // q.ids('1,2,3,4'); as an alternative
  // This is using Postgres' ANY format rather than id IN blah because it's much more efficient
  q.where('id = ANY(' + q.paramNo() + '::int[])');
  // This becomes : id = ANY($1::int[]) 
}

// Prepare some event handlers and execute the query
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
