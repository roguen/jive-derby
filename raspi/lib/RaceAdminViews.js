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
          "username" : "TODO_REPLACE_ME",
          "password" : "TODO_REPLACE_ME"
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
var RaceManager = require('./RaceManager');
var request = require('request');
//var os = require('os');
//var interfaces = os.networkInterfaces();
var ip = require('ip');

var RaceAdmin = {};

RaceAdmin.startRaceUI = function(req,res,next) {
    var lanes = [];
    var maxLanes = config["defaults"]["maxLanes"];
    for (var x=1; x<=maxLanes; x++) {
      lanes.push(x);
    } // end for x

    // var addresses = [];
    // Object.keys(interfaces).forEach(
    //   function (ifname) {
    //     ifaces[ifname].forEach(
    //       function (iface) {
    //         if ('IPv4' !== iface.family || iface.internal !== false) {
    //           addresses.push(iface);
    //         } // end if
    //       } // end function
    //     );
    //   } // end function
    // );

    res.render('../../templates/race-manager.html',{
      lanes : lanes,
      maxLanes : maxLanes,
      derby : config["derby"],
      diagnosticMode : config["defaults"]["diagnosticMode"],
      proxyURL : config["defaults"]["cloudServiceURL"],
      jiveTenantID : config["jive"]["tenantID"],
      ipAddress : ip.address(),
//      host : jive.service.options.clientUrl
    });
  } // end function

RaceAdmin.startRace = function(req,res,next) {
    //TODO: VALIDATION AND ERROR CHECKING

    var racers = req.body["racers"];
    var derby = req.body["derby"];
    var diagnosticMode = (req.body.hasOwnProperty('diagnosticMode')) ? ('true' === req.body.diagnosticMode) : true;
    RaceManager.reset();
    RaceManager.setDerby(derby);
    RaceManager.setRacers(racers);
    RaceManager.setDiagnosticMode(diagnosticMode);
    var raceID = RaceManager.startRace();
    console.log('adminUI','startRace',raceID,racers);
    res.json({
      id: raceID,
      diagnosticMode: diagnosticMode,
      derby : derby,
      racers: racers
    });
  } // end function

RaceAdmin.resetRace = function(req,res,next) {
    //TODO: VALIDATION AND ERROR CHECKING
    RaceManager.reset();
    res.json({});
  } // end function

RaceAdmin.saveDerby = function(req,res,next) {
  var derby = req.body;
  var requestData = {
    url: config["defaults"]["cloudServiceURL"] + "/api/derby",
    json: derby
  };

  /*** ADD SECURITY HEADER ***/
  var securityHeader = config["security"]["remote"]["header"];
  requestData["headers"] = {};
  requestData["headers"][securityHeader] = config["security"]["remote"]["value"];

  /*** SENDING TO SERVICE ***/
  request.post(requestData, function (err, httpResponse, body) {
    if (err) {
      console.log("Error updating derby details",derby,httpResponse,err);
      res.status(500).end();
      next();
    } else {
      console.log("Successfully updated derby details",derby);
      res.status(200).end();
    }// end if
  });
} // end function

module.exports = RaceAdmin;
