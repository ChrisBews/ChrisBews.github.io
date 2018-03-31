// Handles events between modules
NATION.Utils.createNamespace("BISDT");

BISDT.Mediator = (function() {

	"use strict";

	//------------------------------------------------
	// List of events and their intereted parties
	//------------------------------------------------
	var channels = {};

	//------------------------------------------------
	// Register an interested party to an event
	//------------------------------------------------
	function subscribe(eventName, callback) {
		if (!channels[eventName]) channels[eventName] = [];
		channels[eventName].push({callback: callback});
		return this;
	};

	//------------------------------------------------
	// Fires an event to all interested parties
	//------------------------------------------------
	function publish(eventName, data) {
		if (!channels[eventName]) return false;
		var i = 0, length = channels[eventName].length, subscription;
		for (; i < length; i++) {
			subscription = channels[eventName][i];
			subscription.callback(data);
		}
	};

	return {
		subscribe: subscribe,
		publish: publish
	}
}());

/*
BISDT.Mediator.subscribe("thingHappened", function() {alert("Stuff");});
*/