////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
// 
////////////////////////////////////////////////////////////////////////////////

class SiteMediator {

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	constructor() {
		// Variables
		this.channels = {};
	}

	//------------------------------------------------
	// Add a new listener to a global event
	//------------------------------------------------
	subscribe(eventName, callback) {
		if (!this.channels[eventName]) this.channels[eventName] = [];
		this.channels[eventName].push({callback: callback});
		return this;
	}

	//------------------------------------------------
	// Notify all listeners of the new event
	//------------------------------------------------
	publish(eventName, data) {
		if (!this.channels[eventName]) return false;
		let i = 0, length = this.channels[eventName].length, subscription;
		for (; i < length; i++) {
			subscription = this.channels[eventName][i];
			subscription.callback(data);
		}
	}
}