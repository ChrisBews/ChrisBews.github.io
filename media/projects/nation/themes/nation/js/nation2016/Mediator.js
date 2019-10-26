//////////////////////////////////////////////////////////////////////////////
// Nation Website 2016
// Mediator
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("NATION2016");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var Mediator = function() {
		this.channels = {};
	}

	//------------------------------------------------
	// Listen for a site-wide event
	//------------------------------------------------
	Mediator.prototype.subscribe = function(eventName, callback) {
		if (this.channels[eventName]) this.channels[eventName] = [];
		this.channels[eventName].push({callback: callback});
		return true;
	}

	//------------------------------------------------
	// Publish a new event site-wide
	//------------------------------------------------
	Mediator.prototype.publish = function(eventName) {
		if (!this.channels[eventName]) return false;
		var i = 0, length = this.channels[eventName].length;
		for (; i < length; i++) {
			this.channels[eventName][i].callback(data);
		}
	}

	//------------------------------------------------
	// Remove a single listener, identified by it's callback
	//------------------------------------------------
	Mediator.prototype.unsubscribe = function(eventName, callback) {
		if (!callback) throw new Error("NATION2016.Mediator: No callback supplied to the unsubscribe method for event name '" + eventName + "'.");
		if (!this.channels[eventName]) return false;
		var i = 0, length = this.channels[eventName].length;
		var newChannels = [];
		for (; i < length; i++) {
			if (this.channels[eventName][i].callback != callback) {
				newChannels.push(this.channels[eventName][i]);
			}
		}
		this.channels = newChannels;
	}

	//------------------------------------------------
	// Removes all listeners from an event
	//------------------------------------------------
	Mediator.prototype.unsubscribeAll = function(eventName) {
		if (!this.channels[eventName]) return false;
		delete this.channels[eventName];
	}

	window.NATION2016.Mediator = new Mediator();

}(window, document, undefined));