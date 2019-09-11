'use strict';

//var config = jive.service.options["ext"];
var Thunderboard = require('thunderboard-ble');
var RaceManager = require('./RaceManager');
var lightTree = require('./LightTreeHelper');
var AwsIot = require('./AwsIotHelper');
var fs = require('fs');
var request = require('request');

function resetRace(delayMs) {
  if (delayMs) {
    setTimeout(
      function() {
        RaceManager.reset();
      }, // end function
      delayMs
    );
  } else {
    RaceManager.reset();
  } // end if
} // end function

function raceResultListener(data) {
  console.log("***","Results Received",data);


  var results = data["raceResults"];
  var photoPath = data["photo"]["file"];

  lightTree.setYellowState(true,true);

  var formData = {
    raceData: JSON.stringify(results),
    racePhoto: fs.createReadStream(photoPath)
  };

/*  var requestData = {
    url: config["defaults"]["cloudServiceURL"] + "/api/races",
    formData: formData
  };

  /*** ADD SECURITY HEADER ***/
/*  var securityHeader = config["security"]["remote"]["header"];
  requestData["headers"] = {};
  requestData["headers"][securityHeader] = config["security"]["remote"]["value"];

  /*** SENDING TO SERVICE ***/
/*  request.post(requestData, function (err, httpResponse, body) {
    if (err) {
      jive.logger.error("Error submitting race results",results["raceID"],httpResponse,err);
      lightTree.setRedState(true,true);
    } else {
      lightTree.setGreenState(true,true);
      jive.logger.info("Successfully sent Race Results to Cloud",results["raceID"]);
      /**** REMOVE FILE FROM FILE-SYSTEM SINCE IT WAS SUCCESSFULLY STORED IN THE CLOUD ****/
/*      fs.unlink(photoPath);
    } // end if

    /*** DELAYING THE RESET ***/
    resetRace(5000);

  });

} // end function

exports.onBootstrap = function(app) {
  lightTree.setYellowState(true,true);

  console.log('Initializing Services ....');
  console.log('Setting Race Results Listener...');

  RaceManager.setResultsCallback(raceResultListener);

  /*** PUTTING IN A DELAY TO INSURE WE CAN SEE OTHER START UP STATS FIRST ***/
  resetRace(15000);

  console.log('Creating Derby Record...');

/*  if (false) {
    var requestData = {
      url: config["defaults"]["cloudServiceURL"] + "/api/derby",
      json : config["derby"]
    };
    /*** ADD SECURITY HEADER ***/
/*    var securityHeader = config["security"]["remote"]["header"];
    requestData["headers"] = {};
    requestData["headers"][securityHeader] = config["security"]["remote"]["value"];

    /*** SENDING TO SERVICE ***/
/*    request.post(requestData, function (err, httpResponse, body) {
      if (err) {
        lightTree.setRedState(true,true);
        console.log("Failed to POST Derby Details",err);
        return;
      } // end if
      lightTree.setGreenState(true,true);
      console.log("Successfully created Derby",config["derby"]["id"],config["derby"]["name"]);
    });
  } // end if
*/
//  var awsIot = new AwsIot(config["aws"]["iot"]["thing"]);

  var iotValues = {};
  var awsPushTimer = null;
    var tbConfig = {
        "000b570C7156" : {
         "uuid" : "000b570C7156",
         "enabled" : true,
         "family" : "thunderboard",
         "type" : "react",
         "autoconnect" : true,
         "readIntervals" : {
           "environment" : {
             "humidity" : 15000,
             "temperature" : 15000,
             "uv" : 15000
           },
           "ambient-light" : {
             "ambient-light" : 15000
           }
          },
         "services" : {
           "environment" : ["humidity","temperature","uv"],
           "ambient-light" : ["ambient-light"]
        }
      }
    };
  var thunderboard = new Thunderboard(tbConfig,
    function(event) {
      console.log("***",event["service"]["name"],event["characteristic"]["name"],event["value"]);

      var serv = event["service"]["name"];
      var char = event["characteristic"]["name"];

      iotValues[serv] = iotValues[serv] || {};
      iotValues[serv][char] = iotValues[serv][char] || {};

      iotValues[serv][char]["value"] = event["value"];
      iotValues[serv][char]["ts"] = new Date().getTime();

      if (awsPushTimer) {
        console.log('***','Clearing existing timer, as there is more data to send');
        clearTimeout(awsPushTimer);
        awsPushTimer = null;
      } // end if

      if (!awsPushTimer) {
        awsPushTimer = setTimeout(
          function() {
            console.log('***','Sending Data to AWS IoT',iotValues);
//            awsIot.updateShadow(iotValues);
            awsPushTimer = null;
          }, // end function
          3000
        );
      } // end if
    }, // end function
    true
  );

};
