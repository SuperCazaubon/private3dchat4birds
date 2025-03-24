// store all players
var players = {};
var playerAvatars={}; // key is player.avatar and value is player
var avatars = ['/models/eagle.jd','/models/Parrot.glb','/models/Stork.glb','/models/Flamingo.glb'];
var hasard=24;
function Player(){
    this.playerId = players.length;
	this.avatar='';
	//var hasard=Math.floor(100*Math.random());
	var distance=6+Math.floor(2*Math.random());
	if(hasard<25){
		this.x 		= distance;    
		this.z		= distance;    
		this.r_y = Math.PI/4;
		hasard=49;
	}else if (hasard<50){
		this.x 		= -distance;    
		this.z		= -distance;    
		this.r_y = 5*Math.PI/4;	
		hasard=74;		
	}else if(hasard<75){
		this.x 		= -distance;    
		this.z		= distance;    
		this.r_y = -Math.PI/4;	
		hasard=99;
	}else{
		this.x 		= distance;    
		this.z		= -distance;    
		this.r_y = -5*Math.PI/4;
		hasard=24;
	}
	this.y 		= 3+Math.floor(Math.random() * 3); /* altitude */
    this.r_x 	= 0;
    this.r_z 	= 0;
	this.deltaRotY = Math.PI;
	this.deltaY = -2;
    this.sizeX = 1;
    this.sizeY = 1;
    this.sizeZ = 1;
    this.speed = 0.1;
    this.turnSpeed = 0.03;

}

var addPlayer = function(id){

    var player = new Player();
    player.playerId = id;

	// The maximal number of players is the number of avatars (one player, one avatar, two same avatars forbiden)
	for(var i=0; i<Object.keys(avatars).length;i++){
		if(! (avatars[i] in playerAvatars) ){
			playerAvatars[ avatars[i] ] = player.playerId;
			player.avatar=avatars[ i ];
			if( (player.avatar+'').lastIndexOf('.jd') >0 ){
				player.deltaRotY = -Math.PI/2;
				player.deltaY = -1;
			}
			break;
		} 
	}
	
	//Players without avatar are not real player but are obsevators and can navigate freely in the 3d scene !!!
	console.log('addPlayer id='+id+' '+player.avatar+' player.deltaRotY=' + player.deltaRotY.toString() );
	players[player.playerId]=player;
    return player;
};

var removePlayer = function(player){

    delete players[player.playerId];
	delete playerAvatars[player.avatar];
	console.log('removePlayer '+player.playerId+' '+player.avatar);
};

var updatePlayerData = function(data){
	
    var player = players[data.playerId];
	
    player.x = data.x;
    player.y = data.y;
    player.z = data.z;
	
    player.r_x = data.r_x;
    player.r_y = data.r_y;
    player.r_z = data.r_z;

    return player;
};



module.exports.players = players;
module.exports.addPlayer = addPlayer;
module.exports.removePlayer = removePlayer;
module.exports.updatePlayerData = updatePlayerData;

