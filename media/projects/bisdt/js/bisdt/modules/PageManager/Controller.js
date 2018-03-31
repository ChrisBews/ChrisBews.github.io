// Create site constants and handle automated page scrolls

NATION.Utils.createNamespace("BISDT.modules.PageManager");

BISDT.modules.PageManager.Controller = function(DOMElement) {
	
	"use strict";
	
	//------------------------------------------------
	// Variables
	//------------------------------------------------
	var scrolling = false;

	//------------------------------------------------
	// Init
	//------------------------------------------------
	function init() {
		createConstants();
		handleMobiles();
		applyBackgrounds();
		createListeners();
	}

	//------------------------------------------------
	// Listen for page scroll requests
	//------------------------------------------------
	function createListeners() {
		window.addEventListener("wheel", function(e) {onMouseWheelScrolled(e);});
		window.addEventListener("mousewheel", function(e) {onMouseWheelScrolled(e);});
		BISDT.Mediator.subscribe(BISDT.Events.SCROLL_REQUEST, function(data) {onScrollRequested(data);});
	}

	//------------------------------------------------
	// Sets up shortcuts
	//------------------------------------------------
	function createConstants() {
		BISDT.Settings = BISDT.modules.PageManager.models.Settings;
		BISDT.Events = BISDT.modules.PageManager.models.Events;
		BISDT.Tracking = BISDT.modules.PageManager.models.Tracking;
		// Init history module
		BISDT.History = new BISDT.modules.PageManager.models.History();
	}

	//------------------------------------------------
	// Add class to main container if on mobile device
	//------------------------------------------------
	function handleMobiles() {
		if (BISDT.Settings.IS_MOBILE) {
			DOMElement.className += " mobile";
		}
		if (BISDT.Settings.IS_IE) {
			DOMElement.className += " ie";
		}
	}

	//------------------------------------------------
	// Adds class to start large backgorund image loads
	//------------------------------------------------
	function applyBackgrounds() {
		var backgroundElements = document.querySelectorAll("[data-has-background]");
		var i = 0, length = backgroundElements.length;
		for (; i < length; i++) {
			backgroundElements[i].className += " background";
		}
	}

	//------------------------------------------------
	// Stop an active scroll
	//------------------------------------------------
	function stopScrolling() {
		// Stop any other active page scroll
		NATION.Animation.stop(document.documentElement);
		scrolling = false;
	}

	//------------------------------------------------
	// Scroll to element matching passed selector
	// - Expects {selector: "selector string"}
	//------------------------------------------------
	function onScrollRequested(data) {
		if (data.selector) {
			var element = DOMElement.querySelector(data.selector);
			var yPos = NATION.Utils.getOffset(element).top;
			if (BISDT.Settings.smallLayoutVisible) {
				// If small layout is showing, header is expected to be floating,
				// so set target a bit higher up the page so that target is just
				// below the header
				yPos -= BISDT.Settings.headerHeight;
			}
			if (scrolling) {
				stopScrolling();
			}
			scrolling = true;
			NATION.Animation.start(document.documentElement, {scrollTop: yPos}, {duration: 600, easing: "easeInOutQuad"}, function(e) {onPageScrollComplete(e);});
		} else {
			if (console && console.warn) console.warn("Page Controller: Scroll request did not provide a selector");
		}
	}

	//------------------------------------------------
	// Page is no longer scrolling
	//------------------------------------------------
	function onPageScrollComplete(e) {
		scrolling = false;
	}

	//------------------------------------------------
	// Page is no longer scrolling
	//------------------------------------------------
	function onMouseWheelScrolled(e) {
		if (scrolling) {
			stopScrolling();
		}
	}

	init();
};