//////////////////////////////////////////////////////////////////////////////
// Nation Website 2016
// Application Bootstrap
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("NATION2016");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var Application = function() {
		this.__DOMElement = document.querySelector(".js-site");
		this.__pageContainer = this.__DOMElement.querySelector("[data-page-content]");
		this.header = null;
		this.standardTransition = null;
		this.activeView = null;
		this.resizeTimer = null;
		this.createGlobalViews();
		this.createListeners();
		// Active the page we landed on
		this.createPageView();
		if (!history.emulate || NATION2016.Router.getCurrentSection() === "home") {
			this.activeView.build();
		} else {
			NATION2016.Router.setPageLoadForced(true);
			NATION2016.Router.quickLoadPage("/" + NATION2016.Router.getActiveSections().join("/"));
		}
		// Update the section shown as active in the header
		this.header.update(NATION2016.Router.getActiveSections(), true);
	}

	//------------------------------------------------
	// Create views seen on every page
	//------------------------------------------------
	Application.prototype.createGlobalViews = function() {
		// Main site header
		this.header = new NATION2016.views.SiteHeader(this.__DOMElement.querySelector(".js-header"));
		// The swipe page transition
		this.standardTransition = new NATION2016.views.StandardTransition(this.__DOMElement.querySelector(".js-standard-transition"));
	}

	//------------------------------------------------
	// Listen for the user moving around the site
	// or resizing their browser window
	//------------------------------------------------
	Application.prototype.createListeners = function() {
		NATION2016.Router.addListener(NATION2016.Events.PAGE_REQUESTED, this.onPageRequested.bind(this));
		NATION2016.Router.addListener(NATION2016.Events.PAGE_LOAD_COMPLETE, this.onPageLoadComplete.bind(this));
		this.standardTransition.addListener(NATION2016.Events.SHOW_COMPLETE, this.onTransitionShowComplete.bind(this));
		window.addEventListener("resize", this.onWindowResized.bind(this));
	}

	//------------------------------------------------
	// Start revealing the next page
	//------------------------------------------------
	Application.prototype.showNextPage = function() {
		// Set the scroll position back to the top
		NATION.Utils.getPageElement().scrollTop = 0;
		if (!NATION2016.Settings.firstPageLoad) {
			// TODO: Decide on a ruleset for custom view transitions
			if (NATION2016.Router.getActiveSections()[1] && this.activeView.show) {
				// Do a custom transition if we're 2 layers deep and the new view has a show method
				if (this.standardTransition.isShowComplete()) {
					this.standardTransition.hide();
				}
				this.activeView.show();
			} else {
				// Otherwise hide the normal transition
				this.standardTransition.hide();
			}
		} else {
			// User has viewed a page now, so if they return to the homepage
			// the usual overlay animation there will just skip to the 
			// 'fully visible' state
			NATION2016.Settings.firstPageLoad = false;
		}
	}

	//------------------------------------------------
	// Transition is covering the screen, prepare the
	// new page now
	//------------------------------------------------
	Application.prototype.onTransitionShowComplete = function() {
		if (NATION2016.Router.isPageLoaded()) {
			this.prepareNextPage();
		}
	}

	//------------------------------------------------
	// Get the header into the correct state before
	// revealing the new page
	//------------------------------------------------
	Application.prototype.prepareNextPage = function() {
		if (this.activeView) {
			this.activeView.destroy();
			this.activeView.removeListener(NATION2016.Events.HIDE_COMPLETE, this.handler_transitionShowComplete);
			this.activeView.removeListener(NATION2016.Events.USE_TRANSPARENT_HEADER, this.handler_transparentHeaderRequested);
			this.activeView.removeListener(NATION2016.Events.VIEW_READY, this.handler_viewReady);
		}
		// Create the view that controls the new page
		this.createPageView();
		// Update the section shown as active in the header
		this.header.update(NATION2016.Router.getActiveSections());
		this.header.setColorSchemeStyles(NATION2016.Router.getColorSchemeStyles());
		this.header.setPageTitle(NATION2016.Router.getHeaderTitle());
		// Pass the new page HTML to the view
		var newPageData = NATION2016.Router.getNextPageData();
		this.activeView.build(newPageData);
		// Hide the side menu immediately, if open
		this.header.closeSideMenu(true);
		var activeSections = NATION2016.Router.getActiveSections();
		var sectionName = NATION.Utils.camelcaseString(activeSections[0]);
		// Make sure header is showing if moving to the homepage
		if (sectionName === "Home" || sectionName === "Error" && !NATION2016.Settings.firstPageLoad) {
			this.header.show(true);
		}
		// Now we wait for the new view to signal that it's ready before showing next page
		// This allows each new view to preload whatever it needs before reveal
		
	}

	//------------------------------------------------
	// Create a new view for the requested page
	//------------------------------------------------
	Application.prototype.createPageView = function() {
		var activeSections = NATION2016.Router.getActiveSections();
		var activeViewName = NATION.Utils.camelcaseString(activeSections[0]);
		if (activeSections.length === 1) {
			// Create a landing page view
			activeViewName +=  "View";
		} else {
			// Create an individual page view (rather than a landing page view)
			activeViewName += "PageView";
		}
		if (NATION2016.views[activeViewName]) {
			this.activeView = new NATION2016.views[activeViewName](this.__pageContainer);
		} else {
			NATION2016.Router.overrideActiveSections(["error"]);
			this.activeView = new NATION2016.views.ErrorView(this.__pageContainer);
			activeSections = NATION2016.Router.getActiveSections();
			activeViewName = NATION.Utils.camelcaseString(activeSections[0]);
		}
		this.handler_transitionShowComplete = this.onTransitionShowComplete.bind(this);
		this.activeView.addListener(NATION2016.Events.HIDE_COMPLETE, this.handler_transitionShowComplete);
		this.handler_transparentHeaderRequested = this.onTransparentHeaderRequested.bind(this);
		this.activeView.addListener(NATION2016.Events.USE_TRANSPARENT_HEADER, this.handler_transparentHeaderRequested);
		// Wait for the new page to be ready to show
		this.handler_viewReady = this.onViewReady.bind(this);
		this.activeView.addListener(NATION2016.Events.VIEW_READY, this.handler_viewReady);
		if (activeViewName === "HomeView") {
			this.handler_homeSubnavShown = this.onHomeSubnavShown.bind(this);
			this.activeView.addListener(NATION2016.Events.SUBNAV_SHOWN, this.handler_homeSubnavShown);
		}
	}

	//------------------------------------------------
	// Resize the header and active page view when the
	// browser is resized
	//------------------------------------------------
	Application.prototype.resize = function() {
		if (this.resizeTimer) {
			clearTimeout(this.resizeTimer);
			this.resizeTimer = null;
		}
		this.header.resize();
		this.activeView.resize();
	}

	//------------------------------------------------
	// Hide the current page before adding the new
	// page content
	//------------------------------------------------
	Application.prototype.onPageRequested = function() {
		var nextSections = NATION2016.Router.getActiveSections();
		// If we are 2 layers deep and the current view has a hide method, use that
		if (nextSections[1] && this.activeView.hide) {
			this.activeView.hide();
		} else {
			// Otherwise show the normal swipe transition
			// TODO: Work out which direction the transition should move in, based on previous and next location
			var previousSections = NATION2016.Router.getPreviousSections();
			// nextSections
			var previousSectionIndex = this.header.getSectionIndex(previousSections[0]);
			var nextSectionIndex = this.header.getSectionIndex(nextSections[0]);
			var direction = "";
			if (nextSectionIndex < previousSectionIndex) {
				direction = this.standardTransition.DIRECTION_RIGHT;
			} else if (nextSectionIndex > previousSectionIndex) {
				direction = this.standardTransition.DIRECTION_LEFT;
			} else {
				direction = this.standardTransition.DIRECTION_UP;
			}

			this.standardTransition.show(direction);
		}
	}

	//------------------------------------------------
	// New HTML is ready, prepare the next page view
	//------------------------------------------------
	Application.prototype.onPageLoadComplete = function() {
		if (this.standardTransition.isShowComplete() || this.activeView.hasHidden() || NATION2016.Router.isPageLoadForced()) {
			NATION2016.Router.setPageLoadForced(false);
			this.prepareNextPage();
		}
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	Application.prototype.onHomeSubnavShown = function(e) {
		this.header.show();
	}

	//------------------------------------------------
	// Resize on a timer to avoid hurting browser performance
	//------------------------------------------------
	Application.prototype.onWindowResized = function() {
		if (!this.resizeTimer) {
			this.resizeTimer = setTimeout(this.resize.bind(this), 20);
		}
	}

	//------------------------------------------------
	// When new view is ready, reveal the next page and
	// resize it immediately to fit the browser window
	//------------------------------------------------
	Application.prototype.onViewReady = function() {
		this.showNextPage();
		this.resize();
		// Set the scroll position back to the top
		NATION.Utils.getPageElement().scrollTop = 0;
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	Application.prototype.onTransparentHeaderRequested = function(e) {
		this.header.update(NATION2016.Router.getActiveSections());
	}

	window.NATION2016.Application = new Application();

}(window, document, undefined));