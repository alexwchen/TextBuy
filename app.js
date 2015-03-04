// ----------------------
// ----------------------
// Modulus Code
// ----------------------
// ----------------------
console.log('Initialized Express ...');

var express = require('express');
var app = express();

//Create a static file server
app.configure(function() {
  app.use(express.static(__dirname + '/public'));
});

//Get the dummy data
require('./server/ddata.js');

var port = 8080;
app.listen(port);
console.log('Express server started on port %s', port);

// ----------------------
// ----------------------
// RingCentral Code
// ----------------------
// ----------------------
var RCSDK = require('rcsdk');
var rcsdk = new RCSDK();

var platform = rcsdk.getPlatform();
platform.server = 'https://platform.devtest.ringcentral.com';
var appKey = 'YOUR KEY';
var appSecret = 'YOUR SECRET';

platform.apiKey = new Buffer(appKey+ ':' + appSecret).toString('base64');

var subscription = rcsdk.getMessageHelper().getSubscription();
var last_sig = "";

console.log('Initialized Ring-Centeral ...');

platform.authorize({
	    username: '17322764466', // phone number in full format
	    extension: '', // leave blank if direct number is used
	    password: 'V7xXboIbH8'
}).then(function(){

    subscription.on(subscription.events.notification, function(msg){

      console.log('Incoming notification');
      platform.apiCall({
          url: '/account/~/extension/~/message-store',
          method: 'GET',
          get: {perPage: 1, direction: 'Inbound'} //phoneNumber:'16506193390'
      }).then(function(ajax) {
          console.log('Success: ' + ajax.data.records.length);
          var records = ajax.data.records[0];

          console.log("------------------");
          console.log(last_sig);
          console.log(records.from.phoneNumber+records.subject);
          console.log("------------------");

          if(last_sig===records.from.phoneNumber+records.subject){
            // do nothing
          }else{
            MessageProcessor(records.from.phoneNumber, records.subject);
            last_sig = records.from.phoneNumber+records.subject;
          }

      }).catch(function(e) {
          console.log('Error: ' + e.message);
      });
    });

  subscription.register()
  .then(function(){
    console.log('Subscription is ready');
  })
  .error(function(e){
    console.error('Subscription error', e.stack);
  });


});


  function sendTextMsgTo(outgoing_number, message_content){
    // sending out messages
    platform.apiCall({
        url: '/account/~/extension/~/sms',
        method: 'POST',
        post: {
            from: {phoneNumber:'+17322764466'}, // Your sms-enabled phone number
          to: [
            {phoneNumber:outgoing_number} // Second party's phone number ex. ('+16502356324')
        ],
          text: message_content // 'message content'
        }
    }).then(function(ajax) {
        console.log('Success: Sending Text Message To '+ outgoing_number + ' ..... ' + ajax.data.id);
    }).catch(function(e) {
        console.log('Error: ' + e.message);
    });
  }



  function exitHandler(options, err) {
    subscription.unsubscribe(); // missedCalls.unsubscribe();    // messages.unsubscribe();

    if (options.cleanup) {
        console.log('Cleanung up');
    }

    if (err) {
        console.error(err.stack);
    }

    if (options.exit) {
        process.exit();
    }
  }


//so the program will not close instantly
process.stdin.resume();

//do something when app is closing
process.on('exit', exitHandler.bind(null, {cleanup: true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit: true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit: true}));

// ----------------------
// ----------------------
// AI Code
// ----------------------
// ----------------------
// states ->  1: Greet User, Waiting for Type
//            2:
var userState = {}; // json file that stores all the users state
var last_msg = "";

function MessageProcessor(phoneNumber, message){
  console.log("processing message ...");

  if(userState[phoneNumber]){ // already talking to this user
    console.log("user already in state ...");
    StateController(userState[phoneNumber], message, phoneNumber);
  }else{ // new user encounter
    console.log("creating new state ...");
    userState[phoneNumber] = 1;
    StateController(userState[phoneNumber], message, phoneNumber);
  }
}

function StateController(state, message, phoneNumber){
  console.log("processing state ...");
  console.log(state);
  console.log(message);
  console.log(phoneNumber);
  switch (state) {
    case 1:
        process_state_one(phoneNumber);
        userState[phoneNumber] = 2;
        break;
    case 2:
        process_state_two(phoneNumber, message);
        break;
    case 3:
        process_state_three(phoneNumber, message);
        break;
    case 4:
        process_state_fourth(phoneNumber, message);
        break;
    case 5:
        process_state_fifth(phoneNumber, message);
        break;
    case 6:
        day = "Saturday";
        break;
  }
}
// greetings
function process_state_one(phoneNumber){
  var replymsg = "what would you like to buy? clothing, or trips?";
  sendTextMsgTo(phoneNumber, replymsg);
}
// decide category
function process_state_two(phoneNumber, message){
  var replymsg = "Sorry, what you entered is not supported by our API system, please type either electronics, clothing, or trips.";
  message = message.toLowerCase();
  if (message==="electronics"){
    replymsg = "what kind of "+message+" would you like? ex. iPod, Speaker, etc.";
    userState[phoneNumber] = 6;
  }else if (message==="clothing"){
    replymsg = "what kind of "+message+" would you like? ex. Men's Jeans, Women's Sweater etc.";
    userState[phoneNumber] = 5;
  }else if (message==="trips"){
    replymsg = "where would you like to go? enter airport code, such as TPE, LAX.";
    userState[phoneNumber] = 3;
  }
  sendTextMsgTo(phoneNumber, replymsg);
}

// trips expedia
function process_state_three(phoneNumber, message){

  var http = require('http');
  //The url we want is: 'www.random.org/integers/?num=1&min=1&max=10&col=1&base=10&format=plain&rnd=new'
  var options = {
    host: 'terminal2.expedia.com',
    path: '/packages?departureDate=2015-03-02&originAirport=SFO&destinationAirport='+message+'&returnDate=2015-03-16&regionid=6000479&apikey=GzGaVoYOQQ9K85Jzs6F72XaALff1Fuzk'
  };

  callback = function(response) {
    var str = '';

    //another chunk of data has been recieved, so append it to `str`
    response.on('data', function (chunk) {
      str += chunk;
    });

    //the whole response has been recieved, so we just print it out here
    response.on('end', function () {
      try{
        var json = JSON.parse(str);
        var pkg_res = json.PackageSearchResultList['PackageSearchResult'];
        pkg_res = pkg_res[0];
        var price = pkg_res.PackagePrice['TotalPrice']['Value'];
        var saving = pkg_res.PackagePrice['TotalSavings'];
        var replymsg = "I found you this awesome package on Expedia, the price is $"+price+" includes hotel and flight, you want me to book this deal? (yes, no)";
        sendTextMsgTo(phoneNumber, replymsg);
        userState[phoneNumber] = 4;
      }
      catch(err){
        var replymsg = "I can't find the airport code you tell me, can you enter again?"
        sendTextMsgTo(phoneNumber, replymsg);
        userState[phoneNumber] = 3;
      }


    });
  }
  http.request(options, callback).end();
}

function process_state_fourth(phoneNumber, message){
  message = message.toLowerCase();
  if (message==='yes'){
    var replymsg = "great, send the money to this bitcoin wallet (1DvV7h3YXkfU6ZLVXVgryVNw7zaJ2eD88K) using coinbase, your product will be on the way :)"
    userState[phoneNumber] = 1;
  }else{
    var replymsg = "let's see if we can find you other deals."
    userState[phoneNumber] = 1;
  }
  sendTextMsgTo(phoneNumber, replymsg);
}

function process_state_fifth(phoneNumber, message){
  var sp = message.split(' ');
  var http = require('http');
  //The url we want is: 'www.random.org/integers/?num=1&min=1&max=10&col=1&base=10&format=plain&rnd=new'
  var options = {
    host: 'api.macys.com',
    path: '/v4/catalog/search?searchphrase='+sp.join('+'),
    headers: {'Accept':'application/json','X-Macys-Webservice-Client-Id': 'Launch2015'}
  };

  callback = function(response) {
    var str = '';

    //another chunk of data has been recieved, so append it to `str`
    response.on('data', function (chunk) {
      str += chunk;
    });

    //the whole response has been recieved, so we just print it out here
    response.on('end', function () {
      var json = JSON.parse(str);
      var one = json.searchresultgroups[0];
      var two = one.products['product'];
      var product = two[0].summary['name'];
      var price = two[0].price.everydayvalue['value'];
      var replymsg = "Hey, I found you this " + product + ", it cost $"+price+"  would you like me to place the order? (yes, no)";
      sendTextMsgTo(phoneNumber, replymsg);
      userState[phoneNumber] = 4;
    });
  }
  http.request(options, callback).end();
}


// ----------------------
// ----------------------
// Coinbase Code
// ----------------------
// ----------------------
var Coinbase = require('coinbase');
var coinbase = new Coinbase({
  APIKey:'YOUR KEY',
  APISecret: 'YOUR SECRET'
});
coinbase.account.balance(function (err, data) {
  if (err) throw err;
  console.log(data.amount);
  console.log(data.currency);
});

// coinbase.transactions.list(function (err, data) {
//   if (err) throw err;
//
//   console.log(data.current_user);
//   console.log(data.balance);
//   console.log(data.total_count);
//   console.log(data.transactions);
//
// });
