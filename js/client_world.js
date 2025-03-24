var container, scene, currentPlayerCamera, renderer, raycaster, objects = [];

var myEarthGlobe,myTeaPot,myFloor,myDice1,myDice2,myCube1,myCube2,myMirror1,myMirror1Camera,mySphericMirror1,mySphericMirror1Camera,currentSkyBoxIndice=1;

var keyState = {};
var lastKeyState='';

var currentPlayer, currentPlayerId, currentPlayerData, currentPlayerMoveSpeed, currentPlayerTurnSpeed;
var allPlayers = {}, allPlayerAvatarMeshes = {};

var avatarMixers = []; 
var avatarClock = new THREE.Clock; 

var observatorMode=false;
var observatorCamera;
var observatorControls;
var intersectCamera;
var clickOn=true;

function changeSceneBackground(indice) {
	// define path and box sides images
	var path = '/img/';
	var sides = [	'px', 'nx', 'py', 'ny',  'pz', 'nz' ];
	var extension='.png';

	currentSkyBoxIndice=indice;
	for(var i=0;i<sides.length;i++)
			sides[i]=path+'skybox'+indice+'-'+sides[i]+extension;
		
	// load images
	var texLoader = new THREE.CubeTextureLoader();
	scene.background = texLoader.load(sides);

	console.log('changeSceneBackground('+indice+') scene.background done');
};

function drawReflectingObjects() {
	
	// Object 1: rectangle
	// create additional camera
	const cubeRenderTarget1 = new THREE.WebGLCubeRenderTarget( 1000 );
	myMirror1Camera = new THREE.CubeCamera(1, 100, cubeRenderTarget1); // near, far, cubeResolution 
	scene.add(myMirror1Camera);
	// create mirror material and mesh
	var mirrorCubeMaterial = new THREE.MeshBasicMaterial( { envMap: myMirror1Camera.renderTarget.texture, side: THREE.DoubleSide } );
	myMirror1 = new THREE.Mesh( new THREE.BoxGeometry(3, 6, 0.2), mirrorCubeMaterial);
	myMirror1.rotation.x=-Math.PI/16;
	myMirror1.position.set(0, 3, -5.5);
	myMirror1Camera.lookAt(new THREE.Vector3(0, 0, 0));
	myMirror1Camera.position=myMirror1.position;
	scene.add(myMirror1);
	objects.push( myMirror1 ); //if you are interested in detecting an intersection with this myMirror1
	console.log('drawReflectingObjects() myMirror1 done');

	
	// Object 2: sphere
	// create additional camera

	const cubeRenderTarget2 = new THREE.WebGLCubeRenderTarget( 700 );
	mySphericMirror1Camera = new THREE.CubeCamera(1, 100, cubeRenderTarget2);
	scene.add(mySphericMirror1Camera);
	// create mirror material and mesh
	var mirrorSphereMaterial = new THREE.MeshBasicMaterial( { envMap: mySphericMirror1Camera.renderTarget.texture, side: THREE.DoubleSide } );
	mySphericMirror1 = new THREE.Mesh( new THREE.SphereGeometry(10,10,10), mirrorSphereMaterial );
	mySphericMirror1.position.set(0, 10, 30); 
	mySphericMirror1Camera.lookAt(new THREE.Vector3(0, 0, 0));
	mySphericMirror1Camera.position=mySphericMirror1.position;
	scene.add(mySphericMirror1);
	objects.push( mySphericMirror1 ); //if you are interested in detecting an intersection with this mySphericMirror1
	console.log('drawReflectingObjects() mySphericMirror1 done');

	console.log('drawReflectingObjects() done');
}

function drawSimpleDice(x,y,z){
	
	var geometry = new THREE.BoxBufferGeometry(1, 1, 1);

	var loader = new THREE.TextureLoader();

	var materials = [
		new THREE.MeshBasicMaterial({map: loader.load('/img/dice1.png')}),
		new THREE.MeshBasicMaterial({map: loader.load('/img/dice2.png')}),
		new THREE.MeshBasicMaterial({map: loader.load('/img/dice3.png')}),
		new THREE.MeshBasicMaterial({map: loader.load('/img/dice4.png')}),
		new THREE.MeshBasicMaterial({map: loader.load('/img/dice5.png')}),
		new THREE.MeshBasicMaterial({map: loader.load('/img/dice6.png')}),
	];
	var cube = new THREE.Mesh(geometry, materials);
	cube.position.set(x,y,z);
	scene.add(cube);
	objects.push( cube ); //if you are interested in detecting an intersection with this cube
	console.log('return drawSimpleDice('+x+','+y+','+z+') done');
	return cube;
}

function drawSimpleCubeInColor(x,y,z){
	
	var other_avatar_geometry = new THREE.BoxGeometry(1,1,1);
	var other_avatar_material =	[ 
		new THREE.MeshBasicMaterial({color : 0xff0000}), new THREE.MeshBasicMaterial({color : 0x00ff00}) ,
		new THREE.MeshBasicMaterial({color : 0x0000ff}), new THREE.MeshBasicMaterial({color : 0xffff00}),
		new THREE.MeshBasicMaterial({color : 0xff00ff}), new THREE.MeshBasicMaterial({color : 0x00ffff}) 
	];
	var cube = new THREE.Mesh(other_avatar_geometry, other_avatar_material);
	cube.position.set(x,y,z);
	scene.add(cube);
	objects.push( cube ); //if you are interested in detecting an intersection with this cube
	console.log('return drawSimpleCubeInColor('+x+','+y+','+z+') done');
	return cube;
}

function drawFloor(altitude){
	
	var myFloorGeometry = new THREE.PlaneGeometry(10, 10, 1, 1);
	var myFloorTexture  = new THREE.TextureLoader().load('/img/checkerboard.jpg' );	
	var myFloorMaterial = new THREE.MeshBasicMaterial( { map: myFloorTexture, side: THREE.DoubleSide } );
	
	myFloorTexture.wrapS = myFloorTexture.wrapT = THREE.RepeatWrapping; 
	myFloorTexture.repeat.set( 10, 10 );
	myFloor = new THREE.Mesh(myFloorGeometry, myFloorMaterial);
	myFloor.position.y = altitude;
	myFloor.rotation.x = Math.PI / 2;
	scene.add(myFloor);
	objects.push( myFloor ); //if you are interested in detecting an intersection with this myFloor
	console.log('drawFloor('+altitude+') myFloor done');
}

function drawAxes(){
	
	var axes = new THREE.AxesHelper(100);
	scene.add( axes );
	console.log('drawAxes() axes done');
}

function drawEarth(){
	var sphereGeometry = new THREE.SphereGeometry(20);
	var sphereTexture  = new THREE.TextureLoader().load('/img/world.jpg' );
	var sphereMaterial = new THREE.MeshBasicMaterial( { map: sphereTexture } );

	myEarthGlobe = new THREE.Mesh( sphereGeometry, sphereMaterial );
	myEarthGlobe.position.y = 50;
	scene.add( myEarthGlobe );
	objects.push( myEarthGlobe ); //if you are interested in detecting an intersection with this earthsphere
	console.log('drawEarth() myEarthGlobe done');
}

function drawTeaPot(){
	
	var objectLoader = new THREE.ObjectLoader();
	objectLoader.load( "/models/teapot-claraio.json", function ( obj ) {
		obj.position.y=50+20;
		obj.position.x=-30;
		obj.rotation.z=-Math.PI/8;
		obj.scale.set(10,10,10);
		myTeaPot=obj;
		scene.add(obj);
		objects.push( obj ); //if you are interested in detecting an intersection with this teapot custom geometry
		console.log('drawTeaPot() myTeaPot done');
	});
	
}


var loadWorld = function(){

    init();
    animate();

    function init(){

        //Setup------------------------------------------
        container = document.getElementById('container');

        scene = new THREE.Scene();

        currentPlayerCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
        currentPlayerCamera.position.z = 5;
		currentPlayerCamera.position.set(0, 30, 150);
		
        currentPlayerCamera.lookAt( new THREE.Vector3(0,0,0));

		renderer = new THREE.WebGLRenderer({antialias:true, alpha: false}); //alpha: true (may be good ?
		
        renderer.setSize( window.innerWidth, window.innerHeight);
		
		renderer.shadowMap.enabled = true;
        renderer.shadowMapSoft = true;
		renderer.setClearColor(0xffffff);
		
		
        raycaster = new THREE.Raycaster();
		
        //Add Objects To the Scene HERE-------------------

		// add point light
        var spLight = new THREE.PointLight(0xffffff, 1.75, 1000);
        spLight.position.set(0, 100, 0);
        scene.add(spLight);
		
		// add axes
		drawAxes();
		
		// add myFloor
		drawFloor(-0.1);
	
        // add two nice dice cubes
        myDice1=drawSimpleDice(-4.5,0.5,-4.5);
		myDice2=drawSimpleDice(4.5,0.5,4.5);
		
		// add two nice cubes in color
		myCube1=drawSimpleCubeInColor(-4.5,0.5,4.5);
		myCube2=drawSimpleCubeInColor(4.5,0.5,-4.5);
				
		// add two nice mirrors with two different shapes: box & sphere
		drawReflectingObjects();
				
        // add earth globe
		drawEarth();
	
		// add tea pot (custom geometry)
		drawTeaPot();

		
        //Events------------------------------------------
        document.addEventListener('click', onMouseClick, false );
        document.addEventListener('mousedown', onMouseDown, false);
        document.addEventListener('mouseup', onMouseUp, false);
        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('mouseout', onMouseOut, false);
        document.addEventListener('keydown', onKeyDown, false );
        document.addEventListener('keyup', onKeyUp, false );
        window.addEventListener( 'resize', onWindowResize, false );

        //Final touches-----------------------------------
        container.appendChild( renderer.domElement );
        document.body.appendChild( container );
		
		console.log('loadWorld.init() done');
    }

    function animate(){
		
		var avatarDeltaTime = avatarClock.getDelta();
		for (var i = 0; i < avatarMixers.length; ++i)
			avatarMixers[i].update(avatarDeltaTime);
		
		if (observatorControls)
				observatorControls.update();
			
		requestAnimationFrame( animate );
		
		if(observatorMode){
			
			checkKeyStates();
			
			if(myMirror1){
				myMirror1.visible = false;
				if(myMirror1Camera)
					myMirror1Camera.update(renderer, scene);
				myMirror1.visible = true;
			}
			if(mySphericMirror1){
				mySphericMirror1.visible = false;
				if(mySphericMirror1Camera)
					mySphericMirror1Camera.update(renderer, scene);
				mySphericMirror1.visible = true;
			}
			
			if (observatorCamera)  
				renderer.render(scene, observatorCamera); 
		}
		else{
			render();
		}
    }
	
    function render(){

        if ( currentPlayer ){
	
            updateCurrentCameraPosition();

            checkKeyStates();

            currentPlayerCamera.lookAt( currentPlayer.position );

			if(myMirror1){
				myMirror1.visible = false;
				if(myMirror1Camera)
					myMirror1Camera.update(renderer, scene);
				myMirror1.visible = true;
			}
			if(mySphericMirror1){
				mySphericMirror1.visible = false;
				if(mySphericMirror1Camera)
					mySphericMirror1Camera.update(renderer, scene);
				mySphericMirror1.visible = true;
			}
        }
		
        //Render Scene---------------------------------------
        renderer.clear();
        renderer.render( scene , currentPlayerCamera );
    }
	
	function calculateIntersects( event ){

        //Determine objects intersected by raycaster
        event.preventDefault();

        var vector = new THREE.Vector3();
        vector.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
        vector.unproject( intersectCamera );

        raycaster.ray.set( intersectCamera.position, vector.sub( intersectCamera.position ).normalize() );

        var intersects = raycaster.intersectObjects( objects );

        return intersects;
    }

    function onMouseClick(){ 
		if(observatorMode)
			intersectCamera=observatorCamera;
		else
			intersectCamera=currentPlayerCamera;
		
        var intersects = calculateIntersects( event );
		//If object is intersected by mouse pointer, do something
		var isGoodRecipient=false;			
        if ( intersects.length > 0 ){
			var recipient='';
			if(observatorMode){
				console.log('onMouseClick() in observatorMode');
				if(myMirror1)
					if (intersects[0].object == myMirror1) 			recipient='myMirror1';
				if(mySphericMirror1)
					if (intersects[0].object == mySphericMirror1) 		recipient='mySphericMirror1';
				if(myFloor)
					if (intersects[0].object == myFloor) 			recipient='myFloor';
				if(myEarthGlobe)
					if (intersects[0].object == myEarthGlobe) 	recipient='myEarthGlobe';
				if(myDice1)
					if (intersects[0].object == myDice1) 			recipient='myDice1';
				if(myDice2)
					if (intersects[0].object == myDice2) 			recipient='myDice2';
				if(myCube1)
					if (intersects[0].object == myCube1) 			recipient='myCube1';
				if(myCube2)
					if (intersects[0].object == myCube2) 			recipient='myCube2';
				if(myTeaPot)
					if (intersects[0].object == myTeaPot) 		recipient='myTeaPot';
				
				for(var key in allPlayerAvatarMeshes)
					if (intersects[0].object == allPlayerAvatarMeshes[key] ) 		{recipient=getAvatarName(key); isGoodRecipient=true;} // mesh bird avatar
				
				for(var key in allPlayers)
					if (intersects[0].object == allPlayers[key] ) 					{recipient=getAvatarName(key); isGoodRecipient=true;} // mesh text avatar

			}
			else
			{
				console.log('onMouseClick() in BirdMode');
				for(var key in allPlayerAvatarMeshes)
					if (intersects[0].object == allPlayerAvatarMeshes[key] ) 		{recipient=key; isGoodRecipient=true;} // mesh bird avatar
				
				for(var key in allPlayers)
					if (intersects[0].object == allPlayers[key] ) 					{recipient=key; isGoodRecipient=true;} // mesh text avatar
			}
			if(recipient.length>0){
				console.log('onMouseClick() one objet was clicked by you !');
				if(observatorMode && clickOn){
					alert('You just clicked on '+recipient);
				}
				else
				{
					if(isGoodRecipient && (! (recipient===currentPlayerId) ) ){
						console.log('onMouseClick() sendMessageToRecipient('+recipient+')');
						sendMessageToRecipient(recipient);
					}
				}
			}

        }
    }
    function onMouseDown(){

    }
    function onMouseUp(){

    }
    function onMouseMove(){

    }
    function onMouseOut(){

    }
    function onKeyDown( event ){

        //event = event || window.event;

        keyState[event.keyCode || event.which] = true;

    }

    function onKeyUp( event ){

        //event = event || window.event;

        keyState[event.keyCode || event.which] = false;

    }
    function onWindowResize() {

        currentPlayerCamera.aspect = window.innerWidth / window.innerHeight;
        currentPlayerCamera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );

    }

};

var createObservatorCamera = function(boundingSphere){
	var near = 1, far = 100 * boundingSphere.radius;
	//console.log('createObservatorCamera');
	//console.log(boundingSphere);
	observatorCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, near, far);
	observatorCamera.position.z = boundingSphere.center.z + 2.5 * boundingSphere.radius;
	observatorCamera.position.y = 20;
	observatorCamera.lookAt(boundingSphere.center);
	observatorCamera.add(new THREE.DirectionalLight(0xFFFFFF, 1));
	scene.add(observatorCamera);

	if (!observatorControls)
	   observatorControls = new THREE.OrbitControls(observatorCamera, renderer.domElement);
   
	observatorControls.target.copy(boundingSphere.center);
}

var getAvatarName = function(keyPlayerId){
	var myObj=allPlayers[keyPlayerId];
	/*
	console.log('allPlayers["'+keyPlayerId+'"]='+myObj);
	console.log('===========================');	
	for (var mykey in myObj) {
	   var mykeyvalue=eval ( 'allPlayers["'+keyPlayerId+'"].'+mykey);
	   console.log('allPlayers["'+keyPlayerId+'"].'+mykey+' = ' +  mykeyvalue );
	}	
	console.log('===========================');	
	for (var myparameter in myObj.geometry.parameters) {
	   var myparametervalue=eval ( 'allPlayers["'+keyPlayerId+'"].geometry.parameters.'+myparameter);	
	   console.log('allPlayers["'+keyPlayerId+'"].geometry.parameters.'+myparameter+' = ' + myparametervalue    );
	}	
	console.log('===========================');
	console.log('allPlayers["'+keyPlayerId+'"].geometry.parameters.shapes.length = '+myObj.geometry.parameters.shapes.length);
	console.log('===========================');
	for (var myoption in allPlayers[keyPlayerId].geometry.parameters.options) {
	   var myoptionvalue=eval ( 'allPlayers["'+keyPlayerId+'"].geometry.parameters.options.'+myoption);	
	   console.log('allPlayers["'+keyPlayerId+'"].geometry.parameters.options.'+myoption+' = '+myoptionvalue  );
	}
	*/
	myNiceIdText=myObj.name;
	var avatarName=myNiceIdText.split('(')[0].trim();
	console.log('getAvatarName("'+keyPlayerId+'") return '+avatarName);	
	return avatarName;
}


var sendMessageToRecipient = function(recipient){
	var recipientPlayer = allPlayers[recipient];
	var recipientName=getAvatarName(recipient);
	console.log('sendMessageToRecipient()  recipientName='+recipientName);
	var message = prompt('"'+getAvatarName(currentPlayerId)+'" you can enter a message for "'+recipientName+'"');
	if(message){
		socket.emit('sendMessage', {"messageFrom":currentPlayerId, "messageTo":recipient, "messageContent":message} );
	}
}

var receiveMessageFrom = function ( data ){
	if( currentPlayerId === data.messageTo ){
		var niceName=getAvatarName(data.messageFrom);
		alert('"'+niceName+'" tell you "'+data.messageContent+"'");
	}
	else{
		console.log('receiveMessageFrom not done to be send to you !!!');
	}
}

var getAvatarNameAndId = function(avatarPath,avatarID){
	
	return (avatarPath.split('.')[0]).split('/').pop() + ' ('+avatarID+')';
}

var addCurrentPlayer = function(data){
	currentPlayerData = data;
	currentPlayerId = data.playerId;
	var niceId=getAvatarNameAndId(data.avatar,currentPlayerId);
	document.title=niceId;
	
	/* if no bird avatar is free the new player is just a guest observator */
	if(data.avatar.length==0){
		observatorMode=true; 
		document.title='Guest '+niceId;
		changeSceneBackground(currentSkyBoxIndice);
		return; // no mesh associated with this observator 'false player'
	}
	
	const fontLoader = new THREE.FontLoader();
	fontLoader.load('js/helvetiker_regular.typeface.json', 
		function(font){
			
			const text_geometry = new THREE.TextGeometry(niceId, {
				font: font,
				size: 0.3,
				height: 0.1,
				curveSegments: 1
			});
			const green_materials = [
				new THREE.MeshBasicMaterial( { color: 0x00ff00 } ),
				new THREE.MeshBasicMaterial( { color: 0x009900 } )
			];
			currentPlayer = new THREE.Mesh(text_geometry, green_materials);		
			allPlayers[currentPlayerId]=currentPlayer;
			
			currentPlayer.name=niceId;
			
			currentPlayer.rotation.x = data.r_x;
			currentPlayer.rotation.y = data.r_y;
			currentPlayer.rotation.z = data.r_z;

			currentPlayer.position.x = data.x;
			currentPlayer.position.y = data.y;
			currentPlayer.position.z = data.z;
		
			currentPlayerMoveSpeed = data.speed;
			currentPlayerTurnSpeed = data.turnSpeed;
			
			updateCurrentCameraPosition();

			objects.push( currentPlayer ); //I'm interested in detecting an intersection with this text geometry
			scene.add( currentPlayer );

			console.log('addCurrentPlayer() '+currentPlayerId+ ' added now ! avatar='+data.avatar);
										
			var extension = data.avatar.substring( data.avatar.lastIndexOf('.') ).toLowerCase();
			
			if(extension==='.glb'){
				//console.log('.glb attendu '+data.avatar);
				var glfLoader = new THREE.GLTFLoader();
				glfLoader.load(
				  // parameter 1: The URL
				  data.avatar,
				  // parameter 2:The onLoad callback
				  function(gltf){
					//console.log(gltf);
					playerAvatarMesh = gltf.scene.children[ 0 ];
					var avatarAnimation = gltf.animations[ 0 ];
					var avatarMixer = new THREE.AnimationMixer( playerAvatarMesh );
					avatarMixers.push( avatarMixer );
					var avatarAction = avatarMixer.clipAction( avatarAnimation );
					avatarAction.play();
					playerAvatarMesh.scale.set(0.05,0.05,0.05);
					playerAvatarMesh.rotation.copy(currentPlayer.rotation);
					playerAvatarMesh.position.copy(currentPlayer.position);
					playerAvatarMesh.position.y+=data.deltaY;
					playerAvatarMesh.rotation.y+=data.deltaRotY;
					allPlayerAvatarMeshes[currentPlayerId]=playerAvatarMesh;
					objects.push( playerAvatarMesh ); //I'm interested in detecting an intersection with bird avatar mesh
					scene.add(playerAvatarMesh);
					currentPlayerCamera.lookAt( currentPlayer.position );
					changeSceneBackground(currentSkyBoxIndice); 					
				  },
				  // parameter 3:The onProgress callback
				  function(){},
				  // parameter 4:The onError callback
				  function(error){console.log(error);}
				);
			}
			else if(extension==='.jd'){	
				//console.log('.jd attendu '+data.avatar);
				var jdlLoader = new THREE.JDLoader();
				jdlLoader.load(data.avatar,	
					function (jdl)	{
						for (var i = 0; i < jdl.objects.length; ++i)
						{
							playerAvatarMesh = jdl.createObject(i);
							playerAvatarMesh.rotation.copy(currentPlayer.rotation);
							playerAvatarMesh.position.copy(currentPlayer.position);
							playerAvatarMesh.position.y+=data.deltaY;
							playerAvatarMesh.rotation.y+=data.deltaRotY;
							playerAvatarMesh.scale.set(2.5,2.5,2.5);
							allPlayerAvatarMeshes[currentPlayerId]=playerAvatarMesh;
							objects.push( playerAvatarMesh ); //I'm interested in detecting an intersection with bird avatar mesh
							scene.add(playerAvatarMesh);
							if (playerAvatarMesh.geometry.animations)
							{
								var mixer = new THREE.AnimationMixer(playerAvatarMesh);
								avatarMixers.push(mixer); //utilise la même liste de mixers que les animations GLTFL
								var action = mixer.clipAction( playerAvatarMesh.geometry.animations[0] );
								action.play();
							}
						}
						changeSceneBackground(currentSkyBoxIndice); 
					},
					function(){}, //onProgress
					function(error){console.log(error);} //onError
				);
			}
			else
				console.log('Extension "'+extension+'" inconnue de '+data.avatar);
		
		},
		function () {},  // onProgress function
		function ( error ) { console.log( error ); } // onError function
	);

};



var addOtherPlayer = function(data){
	
	var otherPlayerId=data.playerId;
	var niceId=getAvatarNameAndId(data.avatar,otherPlayerId);
	if(data.avatar.length>0){
		const fontLoader = new THREE.FontLoader();
		fontLoader.load('js/helvetiker_regular.typeface.json', 
			function(font){
				const text_geometry = new THREE.TextGeometry(niceId, {
					font: font,
					size: 0.3,
					height: 0.1,
					curveSegments: 1
				});
				const red_materials = [
					new THREE.MeshBasicMaterial( { color: 0xff0000 } ),
					new THREE.MeshBasicMaterial( { color: 0x990000 } )
				];
				var otherPlayer = new THREE.Mesh( text_geometry, red_materials );
				
				otherPlayer.name=niceId;				
				
				otherPlayer.rotation.x = data.r_x;
				otherPlayer.rotation.y = data.r_y;
				otherPlayer.rotation.z = data.r_z;
				
				otherPlayer.position.x = data.x;
				otherPlayer.position.y = data.y;
				otherPlayer.position.z = data.z;

				allPlayers[otherPlayerId]=otherPlayer;
				
				objects.push( otherPlayer ); //I'm interested in detecting an intersection with this text geometry
				scene.add( otherPlayer );
				
				console.log('addOtherPlayer() '+otherPlayerId+ ' added now ! avatar='+data.avatar);
				var extension = data.avatar.substring( data.avatar.lastIndexOf('.') ).toLowerCase();
				
				if(extension==='.glb'){
					//console.log('.glb attendu '+data.avatar);
					var glfLoader = new THREE.GLTFLoader();
					glfLoader.load(
					  // parameter 1: The URL
					  data.avatar,
					  // parameter 2:The onLoad callback
					  function(gltf){
						//console.log(gltf);
						var otherPlayerAvatarMesh = gltf.scene.children[ 0 ];
						var avatarAnimation = gltf.animations[ 0 ];
						var avatarMixer = new THREE.AnimationMixer( otherPlayerAvatarMesh );
						avatarMixers.push( avatarMixer );
						var avatarAction = avatarMixer.clipAction( avatarAnimation );
						avatarAction.play();
						otherPlayerAvatarMesh.scale.set(0.05,0.05,0.05);
						otherPlayerAvatarMesh.rotation.copy(otherPlayer.rotation);
						otherPlayerAvatarMesh.position.copy(otherPlayer.position);
						otherPlayerAvatarMesh.position.y+=data.deltaY;
						otherPlayerAvatarMesh.rotation.y+=data.deltaRotY;
						allPlayerAvatarMeshes[otherPlayerId]=otherPlayerAvatarMesh;
						objects.push( otherPlayerAvatarMesh ); //I'm interested in detecting an intersection with bird avatar mesh
						scene.add(otherPlayerAvatarMesh);
						currentPlayerCamera.lookAt( otherPlayer.position );	
					  },
					  // parameter 3:The onProgress callback
					  function(){},
					  // parameter 4:The onError callback
					  function(error){console.log(error);}
					);	
				}
				else if(extension==='.jd'){	
					//console.log('.jd attendu '+data.avatar);
					var jdlLoader = new THREE.JDLoader();
					jdlLoader.load(data.avatar,	
						function (jdl)	{
							for (var i = 0; i < jdl.objects.length; ++i)
							{
								var otherPlayerAvatarMesh = jdl.createObject(i);
								otherPlayerAvatarMesh.rotation.copy(otherPlayer.rotation);
								otherPlayerAvatarMesh.position.copy(otherPlayer.position);
								otherPlayerAvatarMesh.position.y+=data.deltaY;
								otherPlayerAvatarMesh.rotation.y+=data.deltaRotY;
								otherPlayerAvatarMesh.scale.set(2.5,2.5,2.5);
								allPlayerAvatarMeshes[otherPlayerId]=otherPlayerAvatarMesh;
								objects.push( otherPlayerAvatarMesh ); //I'm interested in detecting an intersection with bird avatar mesh
								scene.add(otherPlayerAvatarMesh);
								if (otherPlayerAvatarMesh.geometry.animations)
								{
									var mixer = new THREE.AnimationMixer(otherPlayerAvatarMesh);
									avatarMixers.push(mixer); //utilise la même liste de mixers que les animations GLTFL
									var action = mixer.clipAction( otherPlayerAvatarMesh.geometry.animations[0] );
									action.play();
								}
							};
							if(observatorMode){
								createObservatorCamera(jdl.boundingSphere);
							}
						},
						function(){}, //onProgress
						function(error){console.log(error);} //onError
					);
				}
				else
					console.log('Extension "'+extension+'" inconnue de '+data.avatar);
			},
			function () {},  // onProgress function
			function ( error ) { console.log( error ); } // onError function	
		);
	}
};


var updateCurrentCameraPosition = function(){

    currentPlayerCamera.position.x = currentPlayer.position.x + 6 * Math.sin( currentPlayer.rotation.y );
    currentPlayerCamera.position.y = currentPlayer.position.y + 6;
    currentPlayerCamera.position.z = currentPlayer.position.z + 6 * Math.cos( currentPlayer.rotation.y );

};

var updatePlayerPosition = function(data){

    var somePlayer = allPlayers[data.playerId];

    somePlayer.position.x = data.x;
    somePlayer.position.y = data.y;
    somePlayer.position.z = data.z;

    somePlayer.rotation.x = data.r_x;
    somePlayer.rotation.y = data.r_y;
    somePlayer.rotation.z = data.r_z;
	
	allPlayerAvatarMeshes[data.playerId].position.copy(somePlayer.position);
	allPlayerAvatarMeshes[data.playerId].position.y+=data.deltaY; 
	allPlayerAvatarMeshes[data.playerId].rotation.copy(somePlayer.rotation);
	allPlayerAvatarMeshes[data.playerId].rotation.y+=data.deltaRotY;

};


var changeSkyBox = function(dataNewIndice){
	changeSceneBackground(dataNewIndice);	
	console.log('changeSkyBox('+dataNewIndice+')');
};

var updateCurrentPlayerData = function(isRotation){
	if(isRotation){
		currentPlayerData.r_x = currentPlayer.rotation.x;
		currentPlayerData.r_y = currentPlayer.rotation.y;
		currentPlayerData.r_z = currentPlayer.rotation.z;	
		
		playerAvatarMesh.rotation.copy(currentPlayer.rotation);
		playerAvatarMesh.rotation.y+=currentPlayerData.deltaRotY;
		
	} else{
		currentPlayerData.x = currentPlayer.position.x;
		currentPlayerData.y = currentPlayer.position.y;
		currentPlayerData.z = currentPlayer.position.z;
		
		playerAvatarMesh.position.copy(currentPlayer.position);
		playerAvatarMesh.position.y+=currentPlayerData.deltaY;		
	}
};



var checkKeyStates = function(){
	
	if(!observatorMode)
	{
		if (keyState[37] || keyState[65]) {
			// left arrow or 'a' - rotate left
			lastKeyState='A';
			currentPlayer.rotation.y += currentPlayerTurnSpeed;
			updateCurrentPlayerData(true);
			socket.emit('updatePlayerPosition', currentPlayerData);
		}
		if (keyState[39] || keyState[69]) {
			// right arrow or 'e' - rotate right
			lastKeyState='D';
			currentPlayer.rotation.y -= currentPlayerTurnSpeed;
			updateCurrentPlayerData(true);
			socket.emit('updatePlayerPosition', currentPlayerData);
		}
		if (keyState[38] || keyState[90]) {
			// up arrow or 'z' - move forward
			lastKeyState='Z';
			currentPlayer.position.x -= currentPlayerMoveSpeed * Math.sin(currentPlayer.rotation.y);
			currentPlayer.position.z -= currentPlayerMoveSpeed * Math.cos(currentPlayer.rotation.y);
			updateCurrentPlayerData(false);
			socket.emit('updatePlayerPosition', currentPlayerData);
		}
		if (keyState[40] || keyState[83]) {
			// down arrow or 's' - move backward
			lastKeyState='S';
			currentPlayer.position.x += currentPlayerMoveSpeed * Math.sin(currentPlayer.rotation.y);
			currentPlayer.position.z += currentPlayerMoveSpeed * Math.cos(currentPlayer.rotation.y);
			updateCurrentPlayerData(false);
			socket.emit('updatePlayerPosition', currentPlayerData);
		}
		if (keyState[81]) {
			// 'q' - strafe left
			lastKeyState='Q';
			currentPlayer.position.x -= currentPlayerMoveSpeed * Math.cos(currentPlayer.rotation.y);
			currentPlayer.position.z += currentPlayerMoveSpeed * Math.sin(currentPlayer.rotation.y);
			updateCurrentPlayerData(false);
			socket.emit('updatePlayerPosition', currentPlayerData);
		}
		if (keyState[68]) {
			// 'd' - strafe right
			lastKeyState='D';
			currentPlayer.position.x += currentPlayerMoveSpeed * Math.cos(currentPlayer.rotation.y);
			currentPlayer.position.z += currentPlayerMoveSpeed * Math.sin(currentPlayer.rotation.y);
			updateCurrentPlayerData(false);
			socket.emit('updatePlayerPosition', currentPlayerData);
		}
	}
	if (keyState[87]) {
		// 'w' - show info
		lastKeyState='W';
		console.log('W pressed - currentSkyBoxIndice='+currentSkyBoxIndice);
	}
	if (keyState[27] && observatorMode) {
        // 'ESC' - Escape for changing the click mode in observatorMode only !
		if(lastKeyState!='-'){
			lastKeyState='-';
			clickOn=!clickOn;
			console.log('ESC - Now clickOn=' + clickOn);
			
		}
    }
	if (keyState[58] || keyState[88]) {
        // 'X' or 'x' - change skybox (the only observator action that affect all players & observators
		if(lastKeyState!='X'){
			lastKeyState='X';
			var maxIndice=4;
			var newIndice=(currentSkyBoxIndice+1);
			if(newIndice>maxIndice)
				newIndice=1;
			socket.emit('changeAllSkyBox',newIndice);
			console.log('socket.emit("changeAllSkyBox",'+newIndice+')');
		}
    }

};



var removeOtherPlayer = function(data){
	var player_id=data.playerId;
	
    scene.remove( allPlayers[player_id] );
	scene.remove( allPlayerAvatarMeshes[player_id] ); 
	
	delete allPlayers[player_id];
	delete allPlayerAvatarMeshes[player_id];

};

