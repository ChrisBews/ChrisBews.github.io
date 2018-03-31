// Event tracking

NATION.Utils.createNamespace("BISDT.modules.EnterGuide");

BISDT.modules.EnterGuide.Controller = function(DOMElement) {
	
	"use strict";
	
	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	function init() {
		createListeners();
	}

	//------------------------------------------------
	// Listen for button clicks
	//------------------------------------------------
	function createListeners() {
		DOMElement.querySelector(".view-gallery").addEventListener("click", function(e) {onViewGalleryClicked(e);});
	}

	//------------------------------------------------
	// Track the click to GA
	//------------------------------------------------
	function onViewGalleryClicked(e) {
		BISDT.Tracking.trackEvent("how to enter button", "click", "view the gallery");
	}

	init();
};