//////////////////////////////////////////////////////////////////////////////
// Nation Library
// Event Dispatcher
// Version 2.1.2
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	if (typeof window.NATION === "undefined") window.NATION = {};

	//////////////////////////
	// Depenency Management
	//////////////////////////
	_initClass();
	var packageName = "NATION.EventDispatcher";
	window.waitingDependencies = window.waitingDependencies || {};
	// Check for any classes waiting on this one
	for (var className in window.waitingDependencies) {
		for (var propName in window.waitingDependencies[className].dependencies) {
			if (propName === packageName) {
				// Re-run the waiting class' dependency check
				window.waitingDependencies[className].callback();
			}
		}
	}

	//////////////////////////
	// Create Class
	//////////////////////////
	function _initClass() {
		/**
		* ### Dependencies:
		* None
		*
		* ### About:
		* Enables any class to dispatch custom events, and adds addListener and removeListener methods to enable any parent class to listen for those custom events
		*
		* @class EventDispatcher
		*/
		var EventDispatcher = function() {
			this.wheelEventName = "";
			this.eventHandlers = {};
		}

		/**
		* Add a listener for a custom event, and run a callback when the event fires
		* @param {string} eventNames One or more event names, separated by spaces
		* @param {function} callback The callback method to run when the event fires
		*/
		EventDispatcher.prototype.addListener = function(eventNames, callback) {
			// Throw an error for a missing event name
			if (!eventNames) throw new Error(this.ERROR_MISSING_EVENT_NAME);
			eventNames = eventNames.split(" ");
			var i = 0, length = eventNames.length;
			for (; i < length; i++) {
				// Throw an error for a missing callback (else nothing would happen when the event fires)
				if (!callback) throw new Error(this.ERROR_MISSING_CALLBACK.replace("{{eventName}}", eventNames[i]));
				// Ensure the wheel event is named correctly for the current browser
				eventNames[i] = this.normalizeMouseWheelEvent(eventNames[i]);
				// If an array hasn't yet been created for this event type, create a blank one
				if (typeof this.eventHandlers[eventNames[i]] === "undefined") this.eventHandlers[eventNames[i]] = [];
				// Add the new handler to the array
				this.eventHandlers[eventNames[i]].push(callback);
			}
		}

		/**
		* Remove a listener for a custom event
		* @param {string} eventNames One or more event names, separated by spaces, to stop listening for
		* @param {function} callback The callback method that was due to run. If this argument is blank, all listeners for the event name will be removed
		*/
		EventDispatcher.prototype.removeListener = function(eventNames, callback) {
			// Throw an error for a missing event name
			if (!eventNames) throw new Error(this.ERROR_MISSING_EVENT_NAME);
			eventNames = eventNames.split(" ");
			var i = 0, length = eventNames.length;
			for (; i < length; i++) {
				// Ensure the wheel event is named correctly for the current browser
				eventNames[i] = this.normalizeMouseWheelEvent(eventNames[i]);
				if (this.eventHandlers[eventNames[i]] instanceof Array) {
					// Remove all callbacks for this event if no callback was specified
					if (!callback) {
						this.eventHandlers[eventNames[i]] = [];
						return;
					}
					// If a callback was specified, remove the matching handler
					var i = 0, length = this.eventHandlers[eventNames[i]].length;
					for (; i < length; i++) {
						// If the callback argument matches the callback in the registered handler
						if (String(this.eventHandlers[eventNames[i]]) === String(callback)) {
							// Remove it from the handler array
							this.eventHandlers[eventNames[i]].splice(i, 1);
						}
					}
				}
			}
		}

		/**
		* Fire one or more custom events
		* @param {string} eventName The name of the event to fire. Can be multiple event names separated by spaces
		*/
		EventDispatcher.prototype.trigger = function(eventNames) {
			// Throw an error for a missing event name
			if (!eventNames) throw new Error(this.ERROR_MISSING_EVENT_NAME);
			// Multiple events can be fired at once, so convert arguments to an array
			if (arguments.length > 1) {
				// If the event names were passed as separate arguments, pull them into an array
				eventNames = (Array.prototype.slice.call(arguments, 0));
			} else {
				// Event names were separated by spaces, so convert them to an array by splitting on spaces
				eventNames = eventNames.split(" ");
			}
			// Initialise variables used to loop through handlers
			var i = 0, length = eventNames.length;
			var handlers = [], totalHandlers, k = 0, eventObject;
			// Cycle through each event name
			for (; i < length; i++) {
				// Ensure the wheel event is named correctly for the current browser
				eventNames[i] = this.normalizeMouseWheelEvent(eventNames[i]);
				// Find existing handlers for this event name
				handlers = this.eventHandlers[eventNames[i]];
				// If there is one or more handlers for this event, call them
				if (typeof handlers !== "undefined") {
					totalHandlers = handlers.length;
					// Loop through each registered handler
					for (k = 0; k < totalHandlers; k++) {
						// Make sure the handler's value is non-null
						if (handlers[k]) {
							// Build an object similar to a standard event object
							eventObject = {
								target: this,
								currentTarget: this,
								type: eventNames[i],
								bubbles: false,
								cancelable: false,
								defaultPrevented: false,
								timestamp: Date.now(),
								isTrusted: false
							};
							// Call the target function in the current scope, while also passing the event object
							handlers[k].apply(this, [eventObject]);
						}
					}
				}
			}
		}

		EventDispatcher.prototype.ERROR_MISSING_EVENT_NAME = "NATION.EventDispatcher: The argument 'eventName' is required";
		EventDispatcher.prototype.ERROR_MISSING_CALLBACK = "NATION.EventDispatcher: The 'callback' argument is required to listen for event '{{eventName}}'";

		/**
		* Check which mousewheel event name is supported in the current browser
		* @ignore
		*/
		EventDispatcher.prototype.normalizeMouseWheelEvent = function(eventName) {
			if (eventName.search(/mousewheel|wheel|DOMMouseScroll/g) >= 0) {
				// It is only required to run this once
				if (!this.wheelEventName) {
					// "wheel" is the standards-compliant event name
					if ("onwheel" in document.createElement("div")) {
						this.wheelEventName = "wheel";
					} else if (document.onmousewheel !== undefined) {
						this.wheelEventName = "mousewheel";
					} else {
						this.wheelEventName = "DOMMouseScroll";
					}
				}
				return this.wheelEventName;
			} else {
				// Remove any spaces from the event name
				return eventName.replace(/ /g, "");
			}
		}

		window.NATION.EventDispatcher = EventDispatcher;
	}

}(window, document, undefined));