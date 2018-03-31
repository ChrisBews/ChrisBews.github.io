////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
// Standard EventDispatcher
////////////////////////////////////////////////////////////////////////////////

class EventDispatcher {

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	constructor() {
		this.eventHandlers = [];
	}

	//------------------------------------------------
	// Add a listener to this class (or, rather, it's 
	// subclass), for a passed event, and run a passed 
	// callback when it's heard
	//------------------------------------------------
	addListener(type, handler) {
		if (typeof this.eventHandlers[type] === "undefined") {
			this.eventHandlers[type] = [];
		}
		this.eventHandlers[type].push(handler);
	}

	//------------------------------------------------
	// Remove an existing listener from this class
	//------------------------------------------------
	removeListener(type, handler) {
		if (this.eventHandlers[type] instanceof Array) {
			let handlers = this.eventHandlers[type];
			// Remove all handlers for this type
			if (!handler) {
				this.eventHandlers[type] = [];
				return;
			}
			// Remove a specific handler
			for (let i = 0, length = handlers.length; i < length; i++) {
				if (String(handlers[i]) === String(handler)) {
					handlers.splice(i, 1);
				}
			}
		}
	}

	//------------------------------------------------
	// Fire an event of the passed type, from this class
	//------------------------------------------------
	trigger(type) {
		let i = 0, length, listeners, listener, event,
		args = Array.prototype.slice.call(arguments).splice(2);
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
		if (this.eventHandlers[event.type] instanceof Array) {
			listeners = this.eventHandlers[event.type];
			length = listeners.length;
			args.unshift(event);
			for (; i < length; i++) {
				listener = listeners[i];
				if (listener) {
					listener.apply(this, args);
				}
			}
		}
	}
}