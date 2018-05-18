var builder = require('botbuilder');
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

            var card = create_card(session, result);

            // attach the card to the reply message
            var msg = new builder.Message(session).addAttachment(card);
            session.send(msg);

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

let create_card = function(session, search_result) {
    return new builder.HeroCard(session)
        .title('Translating Service')
        .subtitle('Your text was translated from "%s" to "%s". Here is the result', search_result[0].detectedLanguage.language, search_result[0].translations[0].to)
        .text('\n' + search_result[0].translations[0].text + '\n')
        // .images([
        //     builder.CardImage.create(session, 'https://docs.microsoft.com/zh-tw/azure/media/index/api_translatortext.svg')
        // ])
        .buttons([
            builder.CardAction.openUrl(session, 'https://docs.microsoft.com/en-us/azure/cognitive-services/translator/reference/v3-0-reference', 'Translator Text API v3.0')
        ]);
}