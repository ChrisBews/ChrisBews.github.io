// Currnetly just handles the 'find out more' button

NATION.Utils.createNamespace("BISDT.modules.TopEntries");

BISDT.modules.TopEntries.Controller = function(DOMElement) {
	
	"use strict";
	
	//------------------------------------------------
	// Variables
	//------------------------------------------------

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
		DOMElement.querySelector(".more-button").addEventListener("click", function(e) {onMoreButtonClicked(e);});
		DOMElement.querySelector(".view-gallery").addEventListener("click", function(e) {onViewGalleryClicked(e);});
	}

	//------------------------------------------------
	// Signal to mediator to move to correct section
	//------------------------------------------------
	function onMoreButtonClicked(e) {
		BISDT.Tracking.trackEvent("top entries button", "click", "find out more");
		BISDT.Mediator.publish(BISDT.Events.SCROLL_REQUEST, {selector: ".enter-guide"});
		e.stopPropagation();
		e.preventDefault();
	}

	//------------------------------------------------
	// Track the click on view gallery
	//------------------------------------------------
	function onViewGalleryClicked(e) {
		BISDT.Tracking.trackEvent("top entries button", "click", "see the gallery");
	}

	init();
};