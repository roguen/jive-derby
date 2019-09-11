'use strict';

var iot = require('aws-iot-device-sdk');
var uuid = require('uuid/v4');
var util = require('util');

const PUSH_STRATEGY = "pushStrategy";
const PUSH_STRATEGY_ALL = "ALL";
const PUSH_STRATEGY_ONCHANGE = "ONCHANGE";

//SEE: https://github.com/aws/aws-iot-device-sdk-js
//SEE: https://us-west-2.console.aws.amazon.com/iotv2/home?region=us-west-2#/thing/JiveWorld17_Derby_Environment

var AwsIotHelper = function Constructor(device,listener,normalizeData) {
  var self = this;
  this.options = device["options"];
  this.pushStrategy = this.options[PUSH_STRATEGY];
  this.lastDataPush = null;
  this.thingName = device["name"];
  this.arn = util.format(device["arn"],device["config"]["region"],this.thingName);
  this.shadowBaseTopic = util.format(device["shadowBaseTopic"],this.thingName);
  this.device = iot.device(device["config"]);

   this.handleSubscription = function(topic) {
     console.log("Subscribing to",topic);
     self.device.subscribe(topic,function(error,result) {
       if (error) {
         console.log("","Unable to subscribe to",topic,error);
       } else {
         console.log("","Successfully subscribed to",topic,result);
       } // end if
     });
   }; // end function

 this.device
    .on('connect', function() {
       console.log('Connected to',self.thingName,'...');
       self.handleSubscription(self.shadowBaseTopic+"/update/accepted");
       self.handleSubscription(self.shadowBaseTopic+"/update/rejected");
    });
 this.device
    .on('close', function() {
       console.log('Disconnected from',self.thingName);
    });
 this.device
    .on('reconnect', function() {
       console.log('Reconnecting to',self.thingName);
    });
 this.device
    .on('offline', function() {
       console.log(self.thingName,'is offline.');
    });
 this.device
    .on('error', function(error) {
      console.log('***','Error occurred',self.thingName,error);
    });
 this.device
    .on('message', function(topic, payload) {
       console.log('device message', topic, payload.toString());
    });
};

AwsIotHelper.prototype.updateShadow = function(data) {
  console.log('***','updateShadow',data);
  if (
      (PUSH_STRATEGY_ALL === this.pushStrategy) ||
      (PUSH_STRATEGY_ONCHANGE === this.pushStrategy && hasDataChanged(data))
    ) {
      var stateDocument = {
        state : {
          desired : data
        }
      };
      this.device.publish(this.shadowBaseTopic+"/update",JSON.stringify(stateDocument));
    } else {
      console.log("Ignoring data push.",this.pushStrategy,data);
    } // end if
} // end function

module.exports = AwsIotHelper;
