// Create applications
NATION.Utils.createNamespace("BISDT.modules.PageManager.models");

BISDT.modules.PageManager.models.History = function() {
	
	"use strict";

	//------------------------------------------------
	// Variables
	//------------------------------------------------
	var location = "";
	var pathPrefix = "";
	var currentState = "";

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	function init() {
		getCurrentState();
		createListeners();
	}

	//------------------------------------------------
	// Store starting point as an array
	//------------------------------------------------
	function getCurrentState() {
		location = window.history.location || window.location;
		if (location.pathname.search("/static") > -1) {
			pathPrefix = "/static";
			currentState = location.pathname.replace("/static", "");
		}
		currentState = removeTrailingSlashes(currentState);
		currentState = currentState.split("/");
	}

	//------------------------------------------------
	// Clear out first and last slash where needed
	//------------------------------------------------
	function removeTrailingSlashes(path) {
		var newPath = path;
		// Get rid of the first backslash
		if (newPath.charAt(0) === "/") {
			newPath = newPath.substring(1);
		}
		// Get rid of the trailing backslash, if one exists
		if (newPath.slice(-1) === "/") {
			newPath = newPath.substring(0, newPath.length-1);
		}
		return newPath;
	}

	//------------------------------------------------
	// Listen for url change requests
	//------------------------------------------------
	function createListeners() {
		window.addEventListener("popstate", function(e) {onPopState(e);});
		BISDT.Mediator.subscribe(BISDT.Events.CHANGE_URL, function(data) {onURLChangeRequest(data);});
	}

	//------------------------------------------------
	// Something wants to change the URL, so do it
	// Path to use is expected to be in data.path
	//------------------------------------------------
	function onURLChangeRequest(data) {
		var state = null;
		if (data.state) {
			state = data.state;
		}
		data.path = pathPrefix + data.path;
		history.pushState(state, data.title, data.path);
	}

	//------------------------------------------------
	// Deep link changed, signal this with the state
	//------------------------------------------------
	function onPopState(e) {
		// We know e.state is an object, so it can be the second arg directly
		BISDT.Mediator.publish(BISDT.Events.URL_CHANGED, e.state);
	}

	init();

	return {
		getCurrentState: function() {
			return currentState;
		}
	};

};