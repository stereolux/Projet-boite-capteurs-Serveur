var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	fs = require('fs'),
	ent = require ('ent'),
	db = require('mongoskin').db('mongodb://localhost:27017/bacdb'),
	ejs = require('ejs');
var routes = require('./routes');
var user = require('./routes/user');

var path = require('path');
var http = require('http');



// all environments
//app.engine('ejs', engine);
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('babylon42'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
server.listen(app.get('port'));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

var about = require('./routes/about');
app.get('/about', about.about);

var tempsreel = require('./routes/tempsreel');
app.get('/Tempsreel', tempsreel.tempsreel);

var TRtype;
var HpHtype
var donneetpsreel = require('./routes/donneetpsreel');
var heureparheure = require('./routes/heureparheure');
var RT=1;

io.sockets.on('connection', function (socket) {
	

	app.post('/publish', function(req,res){
		console.log(req.body.type);
		console.log(req.body.value);
		var testval=req.body;
		var typevaleur=req.body.type;
		RT = req.body.RT;
		if(RT=="0"){
				db.collection('donnee').insert({
					IDRaspberry: req.body.IDRaspberry,
					IDSensor: req.body.IDSensor, 
					numCS: req.body.numCS, 
					numADC: req.body.numADC,
					type: req.body.type,
					unit: req.body.unit,
					activ: req.body.activ,
					periodRT: req.body.RT,
					periodDB: req.body.DB,
					RT: req.body.RT,
					value: req.body.value,
					date: req.body.date,
					hour: req.body.hour
				}, function(err, result) {
		    	if (err) throw err;
		    	if (result) console.log('Added!');
				});
			}
			else {
					
				//socket.emit('measure', testval);
				socket.broadcast.emit('measure', testval);	
									
			}		
		res.send(req.body);
	});

		
	socket.on('heureparheure', function (data) {
		if(data.HpH=="1"){
			db.collection('donnee').count({type: data.typeval}, function(err, count) { //$gte : >= 
    			console.log(count + ' mesures de '+data.typeval);
				socket.emit('countHpH',count);
				db.collection('donnee').find({type: data.typeval}).toArray(function(err, result) {
    				if (err) throw err;
    				console.log(result);

    				for( var i=0; i< count ; i++) {
    					socket.emit('mesHpH',{ value :result[i].value, type: result[i].type, date: result[i].date, hour: result[i].hour});
    					socket.on('accuserecept',function (data){
    						while(!data.recu){}
    					});
    				}

				});
			});

		}

	});
		
});

//app.get('Tempsreel/:typevaleur',donneetpsreel.donneetpsreel);
app.get('/Tempsreel/:typevaleurRT',function (req,res){	
	TRtype = req.params.typevaleurRT;
 	res.render('donneetpsreel', { title: 'Boîte à capteur', typeval: TRtype});
});

app.get('/Heureparheure/:typevaleurHpH',function (req,res){	
	HpHtype = req.params.typevaleurHpH;
	res.render('heureparheure', { title: 'Boîte à capteur', typeval: HpHtype});
});



  console.log('Express server listening on port ' + app.get('port'));

