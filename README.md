=======
Wishbone
========

A dead simple way to create RESTful APIs in Node.js. Built on top of MongoDB using Backbone.js and Express.

Wishbone was created with the intent of making it easy for front-end developers to quickly and 
painlessly bootstrap web applications. Wishbone makes it simple to create basic CRUD applications with only
a few lines of code. Wishbone leverages the powerful (and often overlooked) object relational model
that backbone provides in order to abstract away the nitty gritty of using the MongoDB API.

If you want to get started quickly, you can use the BaseAPI class by passing in a namespace. Wishbone takes care
of the rest. All you should have to do is hit the api at the appropriate namespace using GET, POST, or PUT.

For example:

`curl -v -H "Accept: application/json" -H "Content-type: application/json" -X POST -d '{"name":"San Francisco", "state":"CA"}' http://localhost:3000/api/locations`

Will insert a document into the locations collection, provided that I have created an API endpoint for locations.

It's easy to set up simple CRUD like this, but Wishbone also exposes an API that allows you to define your own routes and 
callbacks. Routing is done using Backbone, so you never have to interact with express.

If you're looking for CRUD with minimal setup, look no further.

## Installation
`npm install -g wishbone`

## Usage
1. Fire up mongodb: `sudo mongod`
2. `require('wishbone')`
3. Write your code

```javascript
var Wishbone = require('wishbone');

Wishbone.configure({
    db: {
        db: 'db'
    }
});

var locationsAPI = new Wishbone.BaseAPI('locations');
var peopleAPI = new Wishbone.BaseAPI('people');

Wishbone.start();
```

