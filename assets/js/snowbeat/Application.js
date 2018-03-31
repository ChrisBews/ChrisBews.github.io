//////////////////////////////////////////////////////////////////////////////
// Snowbeat 2016
// Core Application Bootstrap
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("SNOWBEAT");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var Application = function() {
		this.__DOMElement = document.documentElement;
		this.header = null;
		this.footer = null;
		this.createModels();
		this.createViews();
	}

	//------------------------------------------------
	// Global models used across the site
	//------------------------------------------------
	Application.prototype.createModels = function() {
		// Shorthand references
		SNOWBEAT.Events = SNOWBEAT.models.Events;
		SNOWBEAT.Settings = SNOWBEAT.models.Settings;
		SNOWBEAT.HistoryManager = SNOWBEAT.models.HistoryManager;
	}

	//------------------------------------------------
	// Create a view for the active page
	//------------------------------------------------
	Application.prototype.createViews = function() {
		// Create the view for the header
		this.header = new SNOWBEAT.views.HeaderView(this.__DOMElement.querySelector(".js-header"));
		// Create the view for the footer
		this.footer = new SNOWBEAT.views.FooterView(this.__DOMElement.querySelector(".js-footer"));
		// Work out which page view to create from the data-view attribute on the .page-view element
		var __viewContainer = this.__DOMElement.querySelector("[data-view]");
		var startViewName = __viewContainer.getAttribute("data-view");
		if (startViewName) {
			this.activeView = new SNOWBEAT.views[startViewName](__viewContainer);
			// Listen for sections shrinking or expanding within the page view
			this.activeView.addListener(SNOWBEAT.Events.SECTION_EXPAND_REQUESTED, this.onSectionExpanding.bind(this));
			this.activeView.addListener(SNOWBEAT.Events.SECTION_SHRINK_REQUESTED, this.onSectionShrinking.bind(this));
		}
	}

	//------------------------------------------------
	// Show the dark and minified footer
	//------------------------------------------------
	Application.prototype.onSectionExpanding = function(e) {
		this.footer.showArticleLayout();
	}

	//------------------------------------------------
	// Show the light footer
	//------------------------------------------------
	Application.prototype.onSectionShrinking = function(e) {
		this.footer.showNormalLayout();
	}

	SNOWBEAT.Application = new Application();
	
}(window, document, undefined));