// Standard slideshow that clears itself if prev/next buttons are no longer visible

NATION.Utils.createNamespace("BISDT.modules.Slideshow");

BISDT.modules.Slideshow.Controller = function(DOMElement) {
	
	"use strict";
	
	//------------------------------------------------
	// Variables
	//------------------------------------------------
	var slideshow = null;
	var slideElements = null;
	var navigationElement = null;
	var paginationElement = null;
	var resizeTimer = null;
	var smallLayoutWasShowing = false;
	var sectionID = "";

	//------------------------------------------------
	// Init
	//------------------------------------------------
	function init() {
		getReferences();
		createSlideshow();
		resize();
		createListeners();
	}

	//------------------------------------------------
	// Listen for window resizes
	//------------------------------------------------
	function createListeners() {
		window.addEventListener("resize", function(e) {onWindowResized(e);});
		slideshow.addListener(slideshow.SLIDE_CHANGE, function(e) {onSlideChanged(e);});
	}

	//------------------------------------------------
	// Store refeerences to main elements
	//------------------------------------------------
	function getReferences() {
		sectionID = (DOMElement.getAttribute("id")) ? DOMElement.getAttribute("id") : "";
		slideElements = DOMElement.querySelectorAll(".slide");
		navigationElement = DOMElement.querySelector(".navigation");
		paginationElement = DOMElement.querySelector(".pips");
	}

	//------------------------------------------------
	// Create slideshow from Nation library
	//------------------------------------------------
	function createSlideshow() {
		var selector = DOMElement.querySelector(".slideshow");
		var hasPips = (DOMElement.querySelector(".pips")) ? true : false;
		var options = {
			slide: true,
			autoPlay: false,
			duration: 400,
			easing: "easeInOutQuad",
			pips: hasPips,
			touch: true
		};
		slideshow = new NATION.Slideshow(selector, options);
	}

	//------------------------------------------------
	// Clear JS-added styles when needed
	//------------------------------------------------
	function resize() {
		if (resizeTimer) {
			clearTimeout(resizeTimer);
			resizeTimer = null;
		}
		// Use visibility of the pips, as the breakpoint where these show is later than
		// when the small site header shows. If prev/next buttons are also hidden,
		// then we don't want to act like a slideshow anymore

		// Tom S: have used visibility of .navigation instead of pips here.
		// Reason: ISDT History section slideshow did not have pips, but
		// still needed to be a functioning slideshow.

		var navigationVisible = (NATION.Utils.getStyle(navigationElement, "display") !== "none");
		if (!navigationVisible) {
			// Pips are hidden, reset slide styles
			var i = 0, length = slideElements.length;
			for (; i < length; i++) {
				slideElements[i].removeAttribute("style");
			}
			slideshow.disableTouch();
		} else if (!smallLayoutWasShowing) {
			slideshow.reposition();
			slideshow.enableTouch();
		}
		// Check whether we need swipe listeners or not (eg. prizes section on homepage
		// is only a slideshow at smaller sizes)
		smallLayoutWasShowing = navigationVisible;
	}

	//------------------------------------------------
	// Pace resizes with a timer
	//------------------------------------------------
	function onWindowResized(e) {
		if (!resizeTimer) {
			resizeTimer = setTimeout(function() {resize();}, 50);
		}
	}

	//------------------------------------------------
	// Track which slide has been viewed
	//------------------------------------------------
	function onSlideChanged(e) {
		var slideID = slideshow.getCurrentSlideID().toString();
		BISDT.Tracking.trackEvent("history slide", "view", slideID);
	}

	init();

};
