const express = require('express');
const app = express();
const fs = require('fs');
const https = require('https');
const base64url = require('base64-url');
const path = require("path");
const nJwt = require('njwt');
const request = require('request');
const { Console } = require('console');
const apiVersion = 'v38.0';
var noOfhits = 0;
app.set('view engine', 'ejs');

const PORT = process.env.PORT || 3006;

const jwt_consumer_key = '3MVG9pe2TCoA1Pf7jBHQcHQKrxcdoH0fVZ09fLV6pm6lN0URep21E9BPD7bzP93qFw6Ltm2zTBv3lOtDDi1IP';
const consumer_secret='4390324792281178734';
const jwt_aud = 'https://login.salesforce.com';
const callbackURL='https://localhost:8081/oauthcallback.html';
console.log((Math.floor(Date.now() / 1000) + (60*3)));
function encryptUsingPrivateKey_nJWTLib (claims) {
	var absolutePath = path.resolve("key.pem"); 	
    var cert = fs.readFileSync(absolutePath );	
	var jwt_token = nJwt.create(claims,cert,'RS256');	
	console.log('+jwt+'+jwt_token);	
	var jwt_token_b64 = jwt_token.compact();
	console.log('+jwtbase64+'+jwt_token_b64);
 
	return jwt_token_b64;     
}; 

/**
 *  Extract Access token from POST response and redirect to page Main
 */
 function extractAccessToken(err, remoteResponse, remoteBody,res){
	if (err) { 
		return res.status(500).end('Error'); 
	}
	console.log(remoteBody) ;
	var sfdcResponse = JSON.parse(remoteBody); 
	
	//success
	if(sfdcResponse.access_token){				 
       res.render('loggedinfo',{res:sfdcResponse,noOfhits:noOfhits});
	/*	res.writeHead(302, {
		  'Location': 'Main' ,
		  'Set-Cookie': ['AccToken='+sfdcResponse.access_token,'APIVer='+apiVersion,'InstURL='+sfdcResponse.instance_url,'idURL='+sfdcResponse.id]
		}); */
	}else{
		res.write('Some error occurred. Make sure connected app is approved previously if its JWT flow, Username and Password is correct if its Password flow. ');
		res.write(' Salesforce Response : ');
		res.write( remoteBody ); 
	} 
	res.end();
}



app.use(express.static(__dirname + '/client')); 

 /* app.get('/' ,  function(req,res) {
    res.render('index');
  } );*/

function getJWTSignedToken_nJWTLib(sfdcUserName){ 
	var claims = {
	  iss: jwt_consumer_key,   
	  sub: '5importantfiles5org2@gmail.com',     
	  aud: 'https://login.salesforce.com',
	  exp : (Math.floor(Date.now() / 1000) + (60*3))
	}

	return encryptUsingPrivateKey_nJWTLib(claims);
}

app.get('/', function (req,res){  
    noOfhits = noOfhits + 1;
	var isSandbox = 'false';
	var sfdcURL = 'https://login.salesforce.com/services/oauth2/token' ;
	if(isSandbox == 'true'){
		sfdcURL = 'https://test.salesforce.com/services/oauth2/token' ;
	}
	var sfdcUserName = '5importantfiles5org2@gmail.com';
	var token = getJWTSignedToken_nJWTLib(sfdcUserName); 
	  
	var paramBody = 'grant_type='+base64url.escape('urn:ietf:params:oauth:grant-type:jwt-bearer')+'&assertion='+token ;	
	var req_sfdcOpts = { 	url : sfdcURL,  
							method:'POST', 
							headers: { 'Content-Type' : 'application/x-www-form-urlencoded'} ,
							body:paramBody 
						};
				
	request(req_sfdcOpts, 
		function(err, remoteResponse, remoteBody) {
			extractAccessToken(err, remoteResponse, remoteBody, res); 
		} 
	); 
} );

app.listen(PORT,()=>{
    console.log('Example app is listening on port http://localhost'+PORT);
});

app.get('/Main*' ,   function(req,res) {
    res.render('Main');
} );

var options = {
    key: fs.readFileSync('./key.pem', 'utf8'),
    cert: fs.readFileSync('./server.crt', 'utf8')
  };
//console.log(options.key);
https.createServer(options, app).listen(8081);
console.log("Server listening for HTTPS connections on port ", 8081);

