////////////////////////////////////////////////////////////////////////////////
// Nation Library
// Basic Event Dispatcher
////////////////////////////////////////////////////////////////////////////////
var NATION = NATION || {};

/**
* ### Dependencies:
* None
*
* ### About:
* Enables any class to dispatch custom events, and adds addListener and removeListener methods to enable any parent class to listen for those custom events.
*
* ### Notes:
* - It is expected that this class is to be used as a superclass, giving your own classes these capabilities.
*
* @class EventDispatcher
*/
NATION.EventDispatcher = function() {

	"use strict";
	
	var _public = {};

	/**
	* METHODS
	* ==============
	* The following methods can be called externally
	*/

	/**
	* Add a listener to this class (or, rather, it's subclass), for a passed event, and run a passed callback when it's heard
	* @param {string} type The event to be listened for
	* @param {function} handler The callback function to run when the event is fired
	*/
	_public.addListener = function(type, handler) {
		if (type === "mousewheel") {
			type = _private.normaliseMouseWheelEvent();
		}

		if (typeof _private.eventHandlers[type] === "undefined") {
			_private.eventHandlers[type] = [];
		}
		_private.eventHandlers[type].push(handler);
	};

	/**
	* Remove an existing listener from this class
	* @param {string} type The event to no longer listen for
	* @param {function} handler The callback function that was previously being run when the event fired. If no handler is passed in, all listeners for the passed event will be removed
	*/
	_public.removeListener = function(type, handler) {
		if (type === "mousewheel") {
			type = _private.normaliseMouseWheelEvent();
		}
		if (_private.eventHandlers[type] instanceof Array) {
			var handlers = _private.eventHandlers[type],
			i = 0, length = handlers.length;
			// Remove all handlers for this type
			if (!handler) {
				_private.eventHandlers[type] = [];
				return;
			}
			// Remove a specific handler
			for (; i < length; i++) {
				if (String(handlers[i]) === String(handler)) {
					handlers.splice(i, 1);
				}
			}
		}
	};

	/**
	* Fire an event of the passed type, from this class
	* @param {string} type The event name to fire
	*/
	_public.trigger = function(type) {
		var i = 0, length, listeners, listener, event,
		args = Array.prototype.slice.call(arguments).splice(2);
		if (type === "mousewheel") {
			type = _private.normaliseMouseWheelEvent();
		}
		if (typeof type === "string") {
			event = {type: type};
		} else {
			event = type;
		}
		if (!event) {
			throw new Error("Type is undefined");
		}
		if (!event.target) {
			event.target = this;
		}
		if (!event.type) {
			throw new Error("Object missing 'type' property");
		}
		if (_private.eventHandlers[event.type] instanceof Array) {
			listeners = _private.eventHandlers[event.type];
			length = listeners.length;
			args.unshift(event);
			for (; i < length; i++) {
				listener = listeners[i];
				if (listener) {
					listener.apply(this, args);
				}
			}
		}
	};

	var _private = {

		//------------------------------------------------
		// Variables
		//------------------------------------------------
		eventHandlers: [],

		//------------------------------------------------
		// Handle mouse events in lesser browsers
		//------------------------------------------------
		normaliseMouseWheelEvent: function() {
			if (!NATION.Utils.isEventSupported("mousewheel")) {
				type = "DOMMouseScroll";
			}
			return type;
		}
	}

	return _public;
};