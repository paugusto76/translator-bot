'use strict';

var restify = require('restify');
var builder = require('botbuilder');
var config = require('config');
var translate = require('./translate');
var languages = require('./languages');

// Possible keys in config
//  .port                   -- the port where the restify server will listen
//  .MicrosoftAppId         -- the Id for the Microsoft Bot App
//  .MicrosoftAppPassword   -- the secret for the Microsoft Bot App
//  .translateKey           -- the subscription key to the translator service
var botConfig = config.get('bot');

// Obtain list of languages
languages.get_languages();    

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId || botConfig.microsoftAppId,
    appPassword: process.env.MicrosoftAppPassword || botConfig.microsoftAppPassword
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

var inMemoryStorage = new builder.MemoryBotStorage();

let strip_bot_mention = function(session, result) {
    var text = result.response;

    if (session.message.entities) {
        session.message.entities
            .filter(entity => ((entity.type === "mention") && (entity.mentioned.id.toLowerCase() === session.message.address.bot.id)))
            .forEach(entity => {
                text = text.replace(entity.text, "");
            });
        text = text.trim();
    }

    return text;
}

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, [
    function (session) {
        builder.Prompts.text(session, 'Hello, please give me a language to translate to');
    },
    function (session, result, next)
    {
        var text = strip_bot_mention(session, result);
        session.dialogData.tranlateTo = text;

        var langs = languages.languages;
        var lang = text.toLowerCase();
        var languageFound = false;
        var errorsFound = false;

        if (langs != null && langs.translation)
        {
            languageFound = languages.language_found(session, lang);
        } else {
            session.send('Oops... There are no languages available?! Please try again later...');
            languages.get_languages();
            errorsFound = true;
        }
    
        if (languageFound)
        {
            console.log('Language "%s" found!', text);
        } else {
            if (!errorsFound) {
                session.send('Language %s is unknow. Please start again.', text);
                errorsFound = true;
            }
        }

        session.on('error', function (session, err) {
            session.send('Failed with message : %s', err.message);
            errorsFound = true;
        });

        if (!errorsFound)
        {
            next();
        } else {
            session.endDialog();
        }
    },
    function (session) {
        session.send('I will translate to "%s"', session.dialogData.translateToNativeName);
        builder.Prompts.text(session, 'Give me a text to translate');
    },
    function (session, results) {
        var text = strip_bot_mention(session, result);
        translate.translate(session, '&to=' + session.dialogData.tranlateTo, text);
    }
]).set('storage', inMemoryStorage);


// To continue this:
// https://www.microsoft.com/en-us/translator/trial.aspx
// https://github.com/MicrosoftTranslator/Text-Translation-API-V3-NodeJS
// https://docs.microsoft.com/en-us/azure/bot-service/nodejs/bot-builder-nodejs-samples?view=azure-bot-service-3.0
// https://github.com/Microsoft/BotBuilder-Samples/tree/master/Node/core-MultiDialogs
