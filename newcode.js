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
var appKey = 'hvQrpf1eQ7ayirsUgOAyNg';
var appSecret = 'AGyp3SzWR9CBagkyLW1HMwyFBQFKNBSCSX-vuUTrDViA';

platform.apiKey = new Buffer(appKey+ ':' + appSecret).toString('base64');

var message = rcsdk.getMessageHelper();
platform
    .authorize({
        username: '17322764466', // phone number in full format
        password: 'V7xXboIbH8'
    })
    .then(function() {

        return platform.apiCall({
            url: message.createUrl({sync: true}),
            get: {syncType: 'FSync', recordCount: 1, direction: 'Inbound'}
        });

    })
    .then(main)
    .catch(function(e) {
        console.error('Authentification failed');
        errorHandler(e);
    });

platform.on([platform.events.accessViolation, platform.events.refreshError], errorHandler);

function main(syncAjax) {

    var messageSubscription = message.getSubscription({}),
        timeout = null;

    messageSubscription
        .on(messageSubscription.events.notification, onMessageChange)
        .register()
        .then(function() {
            console.log('Messages subscription was set up');
        })
        .catch(errorHandler);

    console.log('Initial sync data', syncAjax.data);

    function onMessageChange(msg) {

        console.log('Incoming notification received:', msg.body.changes.map(function(change) {
            return change.type + ': updated ' + change.updatedCount + ', new ' + change.newCount;
        }));

        sendTextMsgTo("+16502356324", "Hi, what would you like to buy, electronics, clothing, or shoes");


        // Debounce synchronization
        clearTimeout(timeout);
        timeout = setTimeout(function() {

            platform
                .apiCall({
                    url: message.createUrl({sync: true}),
                    get: {syncType: 'ISync', syncToken: syncAjax.data.syncInfo.syncToken}
                })
                .then(function(ajax) {

                    var updatedMessages = ajax.data.records,
                        filteredMessages = updatedMessages.filter(message.filter({direction: 'Inbound', type: 'SMS', readStatus: 'Unread'}));

                    console.log('Delta', updatedMessages.length, 'filtered', filteredMessages.length);
                    console.log(filteredMessages.map(function(fmsg) {
                        return fmsg.from.phoneNumber + ' - ' + fmsg.subject;
                    }));

                })
                .catch(errorHandler);

        }, 1000);

    }

    /////

    function exitHandler(options, err) {

        messageSubscription.remove({async: false});

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
}

function errorHandler(e){
  console.log("ERROR: ", e);
}




// ----------------------
// ----------------------
// Coinbase Code
// ----------------------
// ----------------------
/*
var Coinbase = require('coinbase');
var coinbase = new Coinbase({
  APIKey:'EvIu0rntrtKJnShp',
  APISecret: 'vOP3q8lSKcsxL8bcUBctoY7PmENkPygi'
});
coinbase.account.balance(function (err, data) {
  if (err) throw err;
  console.log(data.amount);
  console.log(data.currency);
});

coinbase.transactions.list(function (err, data) {
  if (err) throw err;

  console.log(data.current_user);
  console.log(data.balance);
  console.log(data.total_count);
  console.log(data.transactions);

});
d
*/
