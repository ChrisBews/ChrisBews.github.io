//////////////////////////////////////////////////////////////////////////////
// Nation Website 2016
// 'Contact' page view
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("NATION2016.views");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var ContactView = function(element) {
		NATION2016.views.BasicPageView.call(this);
		this.__DOMElement = element;
		this.__mapContainer = null;
		this.__optionsTitle = null;
		this.__optionsPanel = null;
		this.studioMap = null;
	}

	ContactView.prototype = Object.create(NATION2016.views.BasicPageView.prototype);
	ContactView.prototype.constructor = ContactView;

	//------------------------------------------------
	// Perform initial setup
	//------------------------------------------------
	ContactView.prototype.build = function(pageData) {
		NATION2016.views.BasicPageView.prototype.build.call(this, pageData, true);
		// Store references to key elements
		this.__mapContainer = this.__DOMElement.querySelector(".js-studio-map");
		this.__optionsTitle = this.__DOMElement.querySelector(".js-options-title");
		this.__optionsPanel = this.__DOMElement.querySelector(".js-options-panel");
		// Create the studio location map
		this.createMap();
		this.createListeners();
		this.trigger(NATION2016.Events.VIEW_READY);
	}

	//------------------------------------------------
	// Google map that appears next to the address
	//------------------------------------------------
	ContactView.prototype.createMap = function() {
		this.studioMap = new NATION2016.views.contact.StudioMap(this.__mapContainer);
	}

	//------------------------------------------------
	// Make sure options panel fills enough of the browser window
	//------------------------------------------------
	ContactView.prototype.resize = function() {
		// Keep the Google map filling it's space
		this.studioMap.resize();
		// Resize the options panel
		if (this.__optionsPanel) {
			var marginTop = NATION.Utils.getStyle(this.__optionsPanel, "marginTop");
			if (!marginTop) marginTop = 0;
			marginTop = parseInt(marginTop, 10);
			var newHeight = (window.innerHeight - (NATION2016.Settings.headerHeight + this.__optionsTitle.clientHeight + marginTop - 6 + NATION2016.Settings.fullPanelOffset)) + "px";
			this.__optionsPanel.style.height = newHeight;
		}
	}

	//------------------------------------------------
	// Cleanup after page has been removed
	//------------------------------------------------
	ContactView.prototype.destroy = function() {
		NATION2016.views.BasicPageView.prototype.destroy.call(this);
		// If the Google map exists, kill it
		if (this.studioMap) {
			this.studioMap.destroy();
		}
		this.removeListeners();
	}

	//------------------------------------------------
	// Listen for users filling in the directions input box
	//------------------------------------------------
	ContactView.prototype.createListeners = function() {
		NATION2016.views.BasicPageView.prototype.createListeners.call(this);
		if (this.studioMap) {
			this.handler_directionsButtonClicked = this.onDirectionsButtonClicked.bind(this);
			this.studioMap.addListener(NATION2016.Events.DIRECTIONS_CLICKED, this.handler_directionsButtonClicked);
		}
	}

	//------------------------------------------------
	// Stop listening for address searches
	//------------------------------------------------
	ContactView.prototype.removeListeners = function() {
		NATION2016.views.BasicPageView.prototype.removeListeners.call(this);
		if (this.studioMap) {
			this.studioMap.removeListener(NATION2016.Events.DIRECTIONS_CLICKED, this.handler_directionsButtonClicked);
			this.studioMap.removeListener(NATION2016.Events.MAP_READY, this.handler_mapReady);
		}
	}

	//------------------------------------------------
	// Scroll the browser to where the map is
	//------------------------------------------------
	ContactView.prototype.scrollToMap = function() {
		this.handler_mouseWheelScrolled = this.onMouseWheelScrolled.bind(this);
		// Allow the user to stop the scroll if they scroll their mouse wheel
		window.addEventListener("wheel", this.handler_mouseWheelScrolled);
		window.addEventListener("DOMMouseWheel", this.handler_mouseWheelScrolled);
		var target = NATION.Utils.getOffset(this.__mapContainer).top - 59;
		if (NATION.Utils.getPageElement().scrollTop !== target) {
			NATION.Animation.start(NATION.Utils.getPageElement(), {scrollTop: target}, {duration: 500, easing: "easeInOutQuad"}, this.onAutoScrollComplete.bind(this));
		}
	}

	//------------------------------------------------
	// Stop a scroll in progress if the user scrolls during one
	//------------------------------------------------
	ContactView.prototype.onMouseWheelScrolled = function(e) {
		this.onAutoScrollComplete(e);
	}

	//------------------------------------------------
	// Stop listening for the user scrolling
	//------------------------------------------------
	ContactView.prototype.onAutoScrollComplete = function(e) {
		window.removeEventListener("wheel", this.handler_mouseWheelScrolled);
		window.removeEventListener("DOMMouseWheel", this.handler_mouseWheelScrolled);
		NATION.Animation.stop(NATION.Utils.getPageElement());
	}

	//------------------------------------------------
	// Auto-scroll to the map when a tube station is clicked
	//------------------------------------------------
	ContactView.prototype.onDirectionsButtonClicked = function(e) {
		this.scrollToMap();
	}
	
	window.NATION2016.views.ContactView = ContactView;

}(window, document, undefined));