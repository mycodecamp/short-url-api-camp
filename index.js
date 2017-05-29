var express = require('express');
var path= require('path');
var mongodb = require('mongodb');
var fs = require('fs');
var bodyParser= require('body-parser');
var validUrl = require('valid-url');

var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({extended: true}))

var MongoClient = mongodb.MongoClient;
var url = 'mongodb://dbuser:dbpwd@ds155631.mlab.com:55631/urlshortner';      

var database;
MongoClient.connect(url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    console.log('Connection established to', url);

    database = db;
	app.listen(app.get('port'), function() {
		console.log('Node app is running on port', app.get('port'));
	});


   
    //db.close();
  }
});



app.get('/', function(request, response) {

	var fileName = path.join(__dirname, 'index.html');
	response.sendFile(fileName, function (err) {
		if (err) {
			console.log(err);
			response.status(err.status).end();
		}
		else {
			console.log('Sent:', fileName);
		}
	});
});


app.get('/url/*?', function(request, response) {
	
	var args = request.params[0];

	if(args && validUrl.isUri(args)) {	
	
		database.collection('urls').findOne({'url':args}, function(error, results) {
			if (error) response.status(404).send(error);
			
			if (results) {
				response.json({
					"original_url": results.url,
					"short_url": "https://short-url-api-camp.herokuapp.com/" + results.short_url
				});
			} else {
				var num = Math.floor(100000 + Math.random() * 900000);
				var shorturl= num.toString().substring(0, 4);

				var jsons={'url':args, 'short_url':shorturl};

				database.collection('urls').save(jsons, (err, result) => {
					if (err) return console.log(err);
					console.log('saved to database')
					response.json({
						"original_url": jsons.url,
						"short_url": "https://short-url-api-camp.herokuapp.com/" + jsons.short_url
					});
				})		
			}  
		});		
	}
	else{
		response.send("Invalid url");
	}
});// url

app.get('/:id', function(request, response) {
  var id = parseInt(request.params.id);
  
  if(Number.isNaN(id)) {
    response.status(404).send("Invalid Short URL");
  } 
  else {
  	var myshorturl=""+id;
  	console.log(myshorturl);
  	database.collection('urls').findOne({'short_url':myshorturl},function(error, results) { 
  		if (error) 	response.status(404).send(error);
  		if(results)	response.redirect(results.url);
  		else response.status(404).send("Invalid short url");
  	});   
  }
});
