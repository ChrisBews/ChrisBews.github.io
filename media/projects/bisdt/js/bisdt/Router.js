// Create applications
NATION.Utils.createNamespace("BISDT");

BISDT.Router = (function() {

	"use strict";

	//------------------------------------------------
	// List of initialised modules
	//------------------------------------------------
	var activeModules = {};

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	function init() {
		createModules();
	};

	//------------------------------------------------
	// Instantiate all required modules
	// Elements on pages are marked up with:
	// data-module="GallerySlideshow"
	//------------------------------------------------
	function createModules() {
		var moduleElements = document.documentElement.querySelectorAll("[data-module]"), moduleName = "";
		if (moduleElements.length) {
			// If this page requires any modules to be created, attempt to comply for each of them
			var i = 0, length = moduleElements.length;
			for (; i < length; i++) {escape
				moduleName = moduleElements[i].getAttribute("data-module");
				if (BISDT.modules[moduleName]) {
					// If this module does actually exist, create it
					if (!activeModules[moduleName]) activeModules[moduleName] = [];
					activeModules[moduleName].push(new BISDT.modules[moduleName].Controller(moduleElements[i]));
				} else {
					if (window.console && console.warn) console.warn("Found a module request for '" + moduleName + "', but no module with that name exists.");
				}
			}
		}
	};

	init();
}());