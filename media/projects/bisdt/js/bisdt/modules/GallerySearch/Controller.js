// Searches the gallery database

NATION.Utils.createNamespace("BISDT.modules.GallerySearch");

BISDT.modules.GallerySearch.Controller = function(DOMElement) {
	
	"use strict";
	
	//------------------------------------------------
	// Variables
	//------------------------------------------------
	var formView = null;
	var resizeTimer = null;

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	function init() {
		createViews();
		createListeners();
	}

	//------------------------------------------------
	// View that handles display of the form
	//------------------------------------------------
	function createViews() {
		formView = new BISDT.modules.GallerySearch.views.SearchFormView(DOMElement);
		formView.resize();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	function createListeners() {
		window.addEventListener("resize", function(e) {onWindowResized(e);});
	}

	//------------------------------------------------
	// Inform view of resize
	//------------------------------------------------
	function resize() {
		if (resizeTimer) {
			clearTimeout(resizeTimer);
			resizeTimer = null;
		}
		formView.resize();
	}

	//------------------------------------------------
	// Resize on a timer
	//------------------------------------------------
	function onWindowResized(e) {
		if (!resizeTimer) {
			resizeTimer = setTimeout(function() {resize();}, 20);
		}
	}

	init();
};