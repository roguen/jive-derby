    var config = {
        "000b570c7156" : {
         "uuid" : "000b570c7156",
         "enabled" : true,
         "family" : "thunderboard",
         "type" : "react",
         "autoconnect" : true,
         "readIntervals" : {
           "acceleration-orientation" : {
             "orientation" : 1000
           },
           "battery" : {
             "battery-level" : 1000
           }
          },
         "services" : {
           "acceleration-orientation" : ["orientation"],
           "battery" : ["battery-level"]
        }
      }
    };

    var dataCallback = function(data) {
      console.log('Thunderboard Event',data);
    };

    var normalizeData = true;

    var ThunderBoard = require('thunderboard-ble');
    var tb = new ThunderBoard(config,dataCallback,normalizeData);
