var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var world = require('./js/server_world');
var allSockets={}; 
app.use(express.static(__dirname)); 


// Handle connection
io.on('connection', function(socket){
    console.log('a user connected');

    var id = socket.id;
    world.addPlayer(id);
	allSockets[id]=socket;
    var player = world.players[id];
    socket.emit('addCurrentPlayer', player);

    socket.broadcast.emit('addOtherPlayer', player);
	
    socket.on('requestOldPlayers', function(){
        for (var key in world.players){
            if (key != id)
                socket.emit('addOtherPlayer', world.players[key]);
        }
    });
	
    socket.on('updatePlayerPosition', function(data){
        var newData = world.updatePlayerData(data);
        socket.broadcast.emit('updatePlayerPosition', newData);
    });
	
	socket.on('sendMessage', function(data){
		console.log('app.js sendMessage received on server');
		console.log(data);
        //socket.broadcast.emit('receiveMessageFrom', data); //emit to all players ??
		allSockets[data.messageTo].emit('receiveMessageFrom', data); // emit just to the good player
    });
	
	socket.on('changeAllSkyBox', function(dataNewIndice){
		console.log('changeAllSkyBox('+dataNewIndice+')');
		console.log('io.emit changeSkyBox('+dataNewIndice+')');
		io.emit('changeSkyBox', dataNewIndice);
    });
	
    socket.on('disconnect', function(){
        console.log('user disconnected ' +player.playerId);
		delete allSockets[player.playerId];
        io.emit('removeOtherPlayer', player);
        world.removePlayer( player );
		
    });

});

// Handle environment changes
var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
 
http.listen(port, ip_address, function(){
    console.log( "Listening on " + ip_address + ", server_port " + port );
});


