// Controls the header navigation panel when in small layout

NATION.Utils.createNamespace("BISDT.modules.Header");

BISDT.modules.Header.Controller = function(DOMElement) {
	
	"use strict";
	
	//------------------------------------------------
	// Variables
	//------------------------------------------------
	var resizeTimer = null;
	var slidingMenuView = null;

	//------------------------------------------------
	// Init
	//------------------------------------------------
	function init() {
		createViews();
		createDOMListeners();
	}

	//------------------------------------------------
	// Create sliding menu view
	//------------------------------------------------
	function createViews() {
		slidingMenuView = new BISDT.modules.Header.views.SlidingMenuView(DOMElement);
	}

	//------------------------------------------------
	// Handle events
	//------------------------------------------------
	function createDOMListeners() {
		window.addEventListener("resize", function(e) {onWindowResized(e);});
		DOMElement.querySelector(".menu-button").addEventListener("click", function(e) {onMenuButtonClicked(e);});
		DOMElement.querySelector(".overlay").addEventListener("click", function(e) {onOverlayClicked(e);});
	}

	//------------------------------------------------
	// Respond to browser resizing
	//------------------------------------------------
	function resize() {
		if (resizeTimer) {
			clearTimeout(resizeTimer);
			resizeTimer = null;
		}
		slidingMenuView.resize();
	}

	//------------------------------------------------
	// Open or close the menu
	//------------------------------------------------
	function onMenuButtonClicked(e) {
		slidingMenuView.toggle();
		e.stopPropagation();
		e.preventDefault();
	}

	//------------------------------------------------
	// Close the side menu
	//------------------------------------------------
	function onOverlayClicked(e) {
		slidingMenuView.close();
		e.stopPropagation();
		e.preventDefault();
	}

	//------------------------------------------------
	// Pace resize events so they don't kill the browser
	//------------------------------------------------
	function onWindowResized(e) {
		if (!resizeTimer) {
			resizeTimer = setTimeout(function() {resize();}, 20);
		}
	}

	init();
};