var https = require('https');
var utils = require('./utils');
var config = require('config');

var botConfig = config.get('bot');

exports.translate = function (session, params, text) {
    let request_params = {
        method : 'POST',
        hostname : botConfig.host,
        path : botConfig.pathTrans + params,
        headers : {
            'Content-Type' : 'application/json',
            'Ocp-Apim-Subscription-Key' : botConfig.translateKey,
            'X-ClientTraceId' : utils.get_guid(),
        }
    };

    var result = null;

    let req = https.request (request_params, function (response) {
        let body = '';
        response.on ('data', function (d) {
            body += d;
        });
        response.on ('end', function () {
            result = JSON.parse(body);
            console.log(result[0]);
            session.send(result[0].translations[0].text);
            session.endDialog();
        });
        response.on ('error', function (e) {
            session.send('Ooppsss... an error occurred: %s', e.message);
            session.endDialog();
        });
    });
    let content = JSON.stringify ([{'Text' : text}]);
    req.write (content);
    req.end ();
}
