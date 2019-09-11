'use strict';
var config = {
      "defaults" : {
        "diagnosticMode" : true,
        "maxLanes" : 4,
        "cloudServiceURL" : "https://TODO_YOUR_JIVE_DERBY_CLOUD_SERVICE_URL.com",
        "bleStartupDelay" : 1000
      },
      "jive" : {
        "tenantID" : "TODO_YOUR_JIVE_TENANT_ID",
        "extendedProfileFields" : {
          "company" : "Company",
          "title" : "Title",
          "todo" : "Note to customizer.  See also: service/jiveclientconfiguration.json > ext.jive.options.apiUserFields"
        }
      },
      "security" : {
        "local" : {
          "username" : "admin",
          "password" : "admin"
        },
        "remote" : {
          "header": "X-API-KEY",
          "value": "TODO_REPLACE_ME"
        }
      },
      "derby" : {
        "id" : "todo",
        "name" : "TODO: Replace Me",
        "public" : true,
        "active" : true,
        "createOnStartup" : true
      },
      "ryg-light-tree" : {
        "enabled" : false,
        "defaultTimeout" : 60000,
        "blinkInterval" : 500,
        "light-pins" : {
          "red" : 38,
          "yellow" : 40,
          "green" : 36
        }
      },
      "ir-break-sensors" : [
        {
        "enabled" : false,
        "label"  : "1/2 Way Point",
        "gpio-sensor-pin" : 3
        },
        {
        "enabled" : false,
        "label"  : "1/4 Way Point",
        "gpio-sensor-pin" : 5
        }
      ],
      "camera" : {
        "mode" : "timelapse",
        "encoding" : "jpg",
        "quality" : 100,
        "width" : 474,
        "height" : 648,
        "timeout" : 4500,
        "tl" : 500,
        "awb" : "auto",
        "ex" : "sports",
        "ifx" : "none",
        "burst" : true,
        "roi" : "0.5,0.5,0.41,1",
        "output" : "/tmp/default.jpg"
      },
      "gifencoder" : {
        "repeat" : 0,
        "delay" : 500,
        "quality" : 100,
        "files" : "/tmp/%d-jive-derby-??.jpg",
        "output" : "/tmp/jive-derby-%d-cam.gif",
        "label" : {
          "enabled" : false,
          "text" : "%s #%d\n%s",
          "gravity" : "NorthWest",
          "font" : "Helvetica",
          "fontColor" : "white",
          "fontSize" : 10
        }
      },
      "derby-timer": {
        "enabled" : false,
        "device" : "/dev/derby-timer",
        "baudRate" : 19200,
        "raceResultsTimeoutMs" : 10500,
        "autoResetTimeoutMs" : 10000,
        "trackDistanceFt" : 32,
        "sendRaceStartSignal" : true
      },
      "aws" : {
        "iot" : {
          "thing": {
            "name" : "TODO_REPLACE_WITH_AWS_IOT_DEVICE_NAME",
            "arn" : "arn:aws:iot:$s:TODO_REPLACE:thing/%s",
            "shadowBaseTopic" : "$aws/things/%s/shadow",
            "options" : {
              "pushStrategy" : "ALL",
              "pushDelayMs" : 3000
            },
            "config" : {
                "host" : "TODO_REPLACE.iot.us-east-1.amazonaws.com",
               "keyPath": "lib/certs/jive-derby-environment.private.key",
              "certPath": "lib/certs/jive-derby-environment.cert.pem",
                "caPath": "lib/certs/root.pem",
                "clientId" : "JiveDerby-Raspi",
                "region": "us-east-1",
                "debug" : false
            }
          }
        }
      },
      "iot-devices" : {
        "000b57xxxxxx" : {
           "enabled" : false,
           "uuid" : "000b57xxxxxx",
           "address" : "00:0B:57:xx:xx:xx",
           "name" : "TODO: CUSTOMIZE IOT DEVICE ADDRESS",
           "family" : "thunderboard",
           "type" : "sense",
           "autoconnect" : true,
           "readIntervals" : {
             "environment" : {
               "humidity" : 15000,
               "temperature" : 15000,
               "uv" : 15000,
               "ambient-light" : 15000,
               "pressure" : 15000,
               "sound-level" : 15000
             }
           },
           "services" : {
             "environment" : ["humidity","temperature","uv","ambient-light","pressure","sound-level"]
          }
        }
      }
    };
var q = require('q');
var views = require('./RaceAdminViews');

var express = require('express');
var basicAuth = require('express-basic-auth');

var api = express.Router();

var authConfig = {
  challenge: true,
  users : {},
  unauthorizedResponse : function(req) {
      return "UNAUTHORIZED"
  }
};
authConfig["users"][config["security"]["local"]["username"]] = config["security"]["local"]["password"];

api.use(
  basicAuth(authConfig)
);

api.get('/race',views.startRaceUI);
api.post('/race/start',views.startRace);
api.post('/race/reset',views.resetRace);
api.post('/derby/save',views.saveDerby);

function sendJSON(res,status,body) {
  //NOTE: res isn't honoring status(201).json(xxxxx), so trying something else
  res.status(status);
  res.type("application/json");
  if (body) {
    res.send(JSON.stringify(body));
  } // end if
  res.end();
};

/*** THIS MIDDLEWARE ERROR HANLDER IS OUR PRIMARY ERROR HANDLER ****/
api.use(
  function(err,req,res,next) {
    var status = err.status || 500;
    sendJSON(res,status,{
      "message" : err.message,
      "status" : status,
      "details" : err["details"]
    });
  } // end function
);

module.exports = api;
