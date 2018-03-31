//////////////////////////////////////////////////////////////////////////////
// Snowbeat 2016
// View that controls the header
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("SNOWBEAT.views");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var HeaderView = function(selector) {
		NATION.EventDispatcher.call(this);
		this.__DOMElement = selector;
		this.setup();
	}

	//------------------------------------------------
	// Extend the EventDispatcher class
	//------------------------------------------------
	HeaderView.prototype = Object.create(NATION.EventDispatcher.prototype);
	HeaderView.prototype.constructor = HeaderView;

	//------------------------------------------------
	// Perform initial setup
	//------------------------------------------------
	HeaderView.prototype.setup = function() {
		// Check if the current browser supports touch events or pointer events
		var touchDevice = "ontouchstart" in document.documentElement || window.PointerEvent;
		if (touchDevice) {
			// If it does, add a class to the documentElement for styling purposes
			document.documentElement.className += " touch";
		}
	}

	SNOWBEAT.views.HeaderView = HeaderView;
	
}(window, document, undefined));