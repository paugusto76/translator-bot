var https = require('https');
var config = require('config');

var botConfig = config.get('bot');

exports.languages = null;

exports.get_languages = function(){
    let request_params = {
        method : 'GET',  
        hostname : botConfig.host,
        path : botConfig.pathLangs,
        headers : {
            'Ocp-Apim-Subscription-Key' : botConfig.translateKey,
        }
    };

    var req = https.request (request_params, function(response) {
        
        var body = '';
        response.on ('data', function (d) {
            body += d;
        });

        response.on ('end', function () {
            exports.languages = JSON.parse(body);
        });

        response.on ('error', function (e) {
            console.log (' *** Error: ' + e.message);
        });
    });
    req.end ();
};

exports.language_found = function(session, lang) {
    var languageFound = false;

    for(var key in exports.languages.translation)
    {
        if (key.toLowerCase() === lang)
        {
            languageFound = true;
            session.dialogData.tranlateTo = key;
            session.dialogData.translateToNativeName = exports.languages.translation[key].nativeName;
            break;

            console.log(exports.languages.translation[key]);

            if (exports.languages.translation[key].name.toLowerCase() === lang)
            {
                languageFound = true;
                session.dialogData.tranlateTo = key;
                session.dialogData.translateToNativeName = exports.languages.translation[key].nativeName;
                break;
            }

            if (exports.languages.translation[key].nativeName.toLowerCase() == lang)
            {
                languageFound = true;
                session.dialogData.tranlateTo = key;
                session.dialogData.translateToNativeName = exports.languages.translation[key].nativeName;
                break;
            }
        }
    }

    return languageFound;
}