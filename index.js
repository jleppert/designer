var express = require('express');
var browserify = require('browserify-middleware');
var livereload = require('livereload');
var app = express();

app.set('port', (process.env.PORT || process.argv[2] || 5000));
app.use('/', express.static(__dirname + '/static'));
app.use('/client', browserify(__dirname + '/client'));
app.use('/', express.static(__dirname));

app.listen(app.get('port'), function () {
  console.log('Started listening on port', app.get('port'));
});

var liveReloadServer = livereload.createServer();
liveReloadServer.watch(__dirname + '/client');
liveReloadServer.watch(__dirname + '/static');
