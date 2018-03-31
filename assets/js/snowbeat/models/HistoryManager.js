//////////////////////////////////////////////////////////////////////////////
// Snowbeat 2016
// Handle state via the History API
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("SNOWBEAT.models");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var HistoryManager = function(selector) {
		NATION.EventDispatcher.call(this);
		// Default state object 
		this.currentState = {
			pathArray: [],
			path: "",
			sectionName: ""
		};
		// Get initial state from the current URL
		this.getStartState();
		// Listen for URL changes
		this.createListeners();
	}

	//------------------------------------------------
	// Extend the EventDispatcher class
	//------------------------------------------------
	HistoryManager.prototype = Object.create(NATION.EventDispatcher.prototype);
	HistoryManager.prototype.constructor = HistoryManager;

	//------------------------------------------------
	// Work out the state object from window.location
	//------------------------------------------------
	HistoryManager.prototype.getStartState = function() {
		// Required for the IE history polyfill
		var url = window.history.location || window.location;
		// Get the currnet path from the location object
		var path = url.pathname;
		// Create a state object based on that path
		this.storeCurrentState(path);
		// Return the currentState (used by onURLChanged when the history API's
		// state object is blank)
		return this.currentState;
	}

	//------------------------------------------------
	// Create a state object based on the passed path
	//------------------------------------------------
	HistoryManager.prototype.storeCurrentState = function(path) {
		// Strip out the forward slash if the path starts with one
		if (path.charAt(0) === "/") {
			path = path.replace("/", "");
		}
		// Convert the path string to an array
		var pathArray = (path) ? path.split("/") : [], newSectionName = "";
		// Store the section name if we're in a subsection
		if (pathArray[0]) {
			newSectionName = pathArray[0];
		} else {
			// Otherwise it's just blank (home)
			newSectionName = "";
		}
		// Create the state object
		this.currentState = {
			pathArray: pathArray,
			path: path,
			sectionName: newSectionName
		};
	}

	//------------------------------------------------
	// Returns the currentState object to the outside world
	//------------------------------------------------
	HistoryManager.prototype.getCurrentState = function() {
		return this.currentState;
	}

	//------------------------------------------------
	// Push a new state to the history api
	//------------------------------------------------
	HistoryManager.prototype.pushState = function(path, simulatePop) {
		// Update this.currentState to match the new path
		this.storeCurrentState(path);
		// Set the title for the page
		var title = SNOWBEAT.Settings.SITE_NAME;
		if (this.currentState.pathArray[0]) {
			title += " " + NATION.Utils.camelcaseString(this.currentState.pathArray[0]);
		}
		// Push the new state to the history API like normal
		history.pushState(this.currentState, title, path);
		// This will force a page view and signal to the app that a change has
		// taken place
		if (simulatePop) this.onURLChanged();
	}

	//------------------------------------------------
	// Listen for URL changes
	//------------------------------------------------
	HistoryManager.prototype.createListeners = function() {
		window.addEventListener("popstate", this.onURLChanged.bind(this));
	}

	//------------------------------------------------
	// Update the current state to match the new URL
	//------------------------------------------------
	HistoryManager.prototype.onURLChanged = function(e) {
		// If the state object is empty, work out a new one from window.location
		this.currentState = (e && e.state) ? e.state : this.getStartState();
		// Track the page view since this didn't reload the page
		if (ga) {
			ga("set", "page", "/" + this.currentState.path);
			ga("send", "pageview");
		}
		// Signal to the app that the URL has been changed. This allows other parts
		// of the app to check this.currentState and adjust accordingly
		this.trigger(SNOWBEAT.Events.URL_CHANGED);
	}

	SNOWBEAT.models.HistoryManager = new HistoryManager();

}(window, document, undefined));