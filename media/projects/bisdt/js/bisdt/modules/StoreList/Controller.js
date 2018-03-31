// Just handles tracking

NATION.Utils.createNamespace("BISDT.modules.StoreList");

BISDT.modules.StoreList.Controller = function(DOMElement) {
	
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
		var buttons = DOMElement.querySelectorAll(".basic-button"), i = 0, length = buttons.length;
		for (; i < length; i++) {
			buttons[i].addEventListener("click", function(e) {onButtonClicked(e);});
		}
	}

	//------------------------------------------------
	// Track this click
	//------------------------------------------------
	function onButtonClicked(e) {
		var storeName = e.target.parentNode.querySelector("img").getAttribute("alt");
		var addressLine = e.target.parentNode.querySelectorAll("span")[0].innerHTML;
		storeName += ", " + addressLine;
		BISDT.Tracking.trackEvent("store list button", "click", storeName);
	}

	init();
};