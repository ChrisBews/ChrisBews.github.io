//////////////////////////////////////////////////////////////////////////////
// Snowbeat 2016
// Homepage View
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("SNOWBEAT.views");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var HomeView = function(selector) {
		SNOWBEAT.views.BaseView.call(this);
		this.__DOMElement = selector;
		this.__pageSectionElements = [];
		this.pageSections = [];
		this.__blogSection = null;
		// Store references to elements that are frequently used
		this.getElementReferences();
		// Add shrink and expand functionality to each page section
		this.createPageSections();
		// Listen for the blog section expanding
		this.createListeners();
	}

	//------------------------------------------------
	// Extend the BaseView class
	//------------------------------------------------
	HomeView.prototype = Object.create(SNOWBEAT.views.BaseView.prototype);
	HomeView.prototype.constructor = HomeView;

	//------------------------------------------------
	// Store references to key elements
	//------------------------------------------------
	HomeView.prototype.getElementReferences = function() {
		// All page section elements (excluding blog)
		this.__pageSectionElements = this.__DOMElement.querySelectorAll(".js-page-section");
		// The page section that contains the newest blog post
		this.__blogSection = this.__DOMElement.querySelector(".js-blog-section");
	}

	//------------------------------------------------
	// Create each page section's functionality
	//------------------------------------------------
	HomeView.prototype.createPageSections = function() {
		var i = 0, length = this.__pageSectionElements.length;
		// Most page sections just have shrink/expand methods
		for (; i < length; i++) {
			this.pageSections.push(new SNOWBEAT.views.home.PageSection(this.__pageSectionElements[i]));
		}
		// Blog section 'shrinks' by reducing the amount of visible content
		this.blogSection = new SNOWBEAT.views.home.BlogSection(this.__blogSection);
	}

	//------------------------------------------------
	// Listen for user navigation within the page
	//------------------------------------------------
	HomeView.prototype.createListeners = function() {
		// User requesting to see the rest of the blog post
		this.blogSection.addListener(SNOWBEAT.Events.SECTION_EXPAND_REQUESTED, this.onSectionExpandRequested.bind(this));
		// Adjust blog section to match URL state
		SNOWBEAT.HistoryManager.addListener(SNOWBEAT.Events.URL_CHANGED, this.onURLChanged.bind(this));
	}

	//------------------------------------------------
	// User wants to expand the blog section and see
	// the rest of the post
	//------------------------------------------------
	HomeView.prototype.onSectionExpandRequested = function(e) {
		// Push the post's URL to the HistoryManager
		SNOWBEAT.HistoryManager.pushState(this.blogSection.getPageURL(), true);
	}

	//------------------------------------------------
	// Expand or shrink the blog post to match the URL
	//------------------------------------------------
	HomeView.prototype.onURLChanged = function(e) {
		var state = SNOWBEAT.HistoryManager.getCurrentState();
		var i = 0, length = this.pageSections.length;
		// Shrink the blog section and returh the others to normal
		if (!state || state.pathArray.length <= 0) {
			for (; i < length; i++) {
				this.pageSections[i].expand();
			}
			this.blogSection.shrink();
			this.trigger(SNOWBEAT.Events.SECTION_SHRINK_REQUESTED);
		} else if (state.pathArray[0] === "blog") {
			// Expand the blog section and shrink the others out of view
			for (; i < length; i++) {
				this.pageSections[i].shrink();
			}
			this.blogSection.expand();
			this.trigger(SNOWBEAT.Events.SECTION_EXPAND_REQUESTED);
		}
	}

	SNOWBEAT.views.HomeView = HomeView;

}(window, document, undefined));