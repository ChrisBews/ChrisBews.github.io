//////////////////////////////////////////////////////////////////////////////
// Nation Website 2016
// Basic page functionality
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("NATION2016.views");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var BasicPageView = function(element) {
		NATION.EventDispatcher.call(this);
		this.__DOMElement = element;
		this.__topTitle = null;
		this.buildComplete = false;
		this.hidden = false;
		this.previousScroll = 0;
		this.titleVisible = true;
	}

	BasicPageView.prototype = Object.create(NATION.EventDispatcher.prototype);
	BasicPageView.prototype.constructor = BasicPageView;

	//------------------------------------------------
	// Listen for scrolls if page header has to fade out
	//------------------------------------------------
	BasicPageView.prototype.createListeners = function() {
		if (this.__topTitle) {
			this.handler_windowScrolled = this.onWindowScrolled.bind(this);
			window.addEventListener("scroll", this.handler_windowScrolled);
		}
	}

	//------------------------------------------------
	// Stop listening for scroll events
	//------------------------------------------------
	BasicPageView.prototype.removeListeners = function() {
		if (this.__topTitle) {
			window.removeEventListener("scroll", this.handler_windowScrolled);
		}
	}

	//------------------------------------------------
	// Returns true if the view is fully hidden
	//------------------------------------------------
	BasicPageView.prototype.hasHidden = function() {
		return this.hidden
	}

	//------------------------------------------------
	// Deconstructor
	//------------------------------------------------
	BasicPageView.prototype.destroy = function() {
		this.removeListeners();
	}

	//------------------------------------------------
	// Basic resize method
	//------------------------------------------------
	BasicPageView.prototype.resize = function() {

	}

	//------------------------------------------------
	// Populate page with loaded HTML
	//------------------------------------------------
	BasicPageView.prototype.build = function(pageData, preventListeners) {
		if (pageData) {
			this.__DOMElement.innerHTML = pageData;
			// Update picturefill to catch newly inserted images
			if (picturefill) picturefill();
		}
		// Store reference to the top page title, if one has to be faded
		this.__topTitle = this.__DOMElement.querySelector(".js-fade-title");
		if (!preventListeners) this.createListeners();
		// Update page state
		this.buildComplete = true;
	}

	//------------------------------------------------
	// Fade out, or in, the top page title when the
	// page has been scrolled to or from 0
	//------------------------------------------------
	BasicPageView.prototype.onWindowScrolled = function(e) {
		var currentScroll = NATION.Utils.getPageElement().scrollTop;
		if (!NATION2016.Settings.mobileHeader && this.titleVisible && currentScroll > this.previousScroll && currentScroll > 20) {
			// Page has scrolled down, fade out the title now
			this.titleVisible = false;
			NATION.Animation.start(this.__topTitle, {opacity: 0}, {duration: 150});
		} else if (!this.titleVisible && currentScroll < this.previousScroll && currentScroll < 20) {
			// Page has scrolled to near the top, so fade the title back in
			this.titleVisible = true;
			NATION.Animation.start(this.__topTitle, {opacity: 1}, {duration: 150});
		}
		// Store reference to current scroll position for next time
		// This allows us to check if the scroll was up or down
		this.previousScroll = currentScroll;
	}

	window.NATION2016.views.BasicPageView = BasicPageView;

}(window, document, undefined));