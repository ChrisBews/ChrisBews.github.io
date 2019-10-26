//////////////////////////////////////////////////////////////////////////////
// Nation Website 2016
// 'Case study' page view
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("NATION2016.views");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var WorkPageView = function(element) {
		NATION2016.views.BasicPageView.call(this);
		this.__DOMElement = element;
		this.__scrollButton = null;
		this.__moreContentButtons = null;
		this.__moreContentLabels = null;
		this.__introCopy = null;
		this.__projectHeader = null;
		this.__viewListButton = null;
		this.__accordionElements = [];
		this.extraContentAccordions = [];
		this.scrollTarget = "";
		this.videoPlayers = [];
		this.__headerImage = null;
		this.imageLoadTimer = null;
		this.animatedButtons = [];
		this.showMoreContentTexts = [];
		this.hideMoreContentTexts = [];
	}

	WorkPageView.prototype = Object.create(NATION2016.views.BasicPageView.prototype);
	WorkPageView.prototype.constructor = WorkPageView;

	//------------------------------------------------
	// Perform initial setup
	//------------------------------------------------
	WorkPageView.prototype.build = function(pageData) {
		NATION2016.views.BasicPageView.prototype.build.call(this, pageData, true);
		// Store references to key elements
		this.__scrollButton = this.__DOMElement.querySelector(".js-scroll-button");
		this.scrollTarget = this.__scrollButton.getAttribute("href");
		this.__moreContentButtons = this.__DOMElement.querySelectorAll(".js-more-content-button");
		this.__moreContentLabels = this.__DOMElement.querySelectorAll(".js-more-content-button span");
		this.__projectHeader = this.__DOMElement.querySelector(".js-project-header");
		this.__introCopy = this.__DOMElement.querySelector(".js-intro-copy");
		this.__viewListButton = this.__DOMElement.querySelector(".js-view-list");
		this.__headerImage = this.__projectHeader.querySelector("img");
		this.__bottomNavImages = this.__DOMElement.querySelectorAll(".project-nav img");
		this.headerImageTimer = null;
		// Create one or more video players as they're found on the page
		this.createVideoPlayers();
		// Create any required 'show more' expanders
		this.createExtraContentAccordions();
		// Create any 'show more' button animations
		this.createAnimatedButtons();
		this.createListeners();
		this.resize();
		if (this.__headerImage) {
			// Wait for header image to load before signalling the OK
			this.checkHeaderImageLoaded();
		} else {
			// No image for some reason, just signal OK immediately
			this.trigger(NATION2016.Events.VIEW_READY);
		}
	}

	//------------------------------------------------
	// Wait for the header image to load before signalling
	// that the page is ready to be shown
	//------------------------------------------------
	WorkPageView.prototype.checkHeaderImageLoaded = function() {
		if (this.headerImageTimer) {
			clearTimeout(this.headerImageTimer);
			this.headerImageTimer = null;
		}
		if (this.__headerImage.complete) {
			this.trigger(NATION2016.Events.VIEW_READY);
		} else {
			this.headerImageTimer = setTimeout(this.checkHeaderImageLoaded.bind(this), 200);
		}
	}

	//------------------------------------------------
	// Create an animation for each 'show more' button
	// found on the page
	//------------------------------------------------
	WorkPageView.prototype.createAnimatedButtons = function() {
		var buttonElements =  this.__DOMElement.querySelectorAll(".js-more-content-button");
		var i = 0, length = buttonElements.length;
		for (; i < length; i++) {
			this.animatedButtons.push(new NATION2016.views.global.AnimatedVectorButton(buttonElements[i]));
		}
	}

	//------------------------------------------------
	// Resize the header to fit the right amount of the
	// browser window
	//------------------------------------------------
	WorkPageView.prototype.resize = function() {
		// Resize the header
		this.__projectHeader.style.height = (window.innerHeight - this.__introCopy.clientHeight - NATION2016.Settings.fullPanelOffset) + "px";
		this.resizeViewListButton();
		// Make sure all animated buttons have their backgrounds at the right size for their text
		var i = 0, length = this.animatedButtons.length;
		for (; i < length; i++) {
			this.animatedButtons[i].resize();
		}
	}

	//------------------------------------------------
	// Make sure the 'view projects list' square at the 
	// bottom of the page fills the available width correctly
	//------------------------------------------------
	WorkPageView.prototype.resizeViewListButton = function() {
		this.__viewListButton.style.height = "auto";
		// The +1 is just to help with pixel-rounding in Chrome
		this.__viewListButton.style.height = (this.__viewListButton.parentNode.clientHeight+1) + "px";
	}

	//------------------------------------------------
	// Create all the video players
	//------------------------------------------------
	WorkPageView.prototype.createVideoPlayers = function() {
		var __videoElements = this.__DOMElement.querySelectorAll(".js-video-player");
		var i = 0, length = __videoElements.length, player;
		var options = {
			preload: true,
			mobileMode: NATION2016.Settings.TOUCH_DEVICE
		};
		var controlsOptions = {
			slide: true,
			mobileMode: NATION2016.Settings.TOUCH_DEVICE
		};
		// Create a new player for each video element found
		for (; i < length; i++) {
			// Make sure a video url exists before creating the player
			if (__videoElements[i].getAttribute("data-video")) {
				player = new NATION2016.views.global.MultiSourceVideoPlayer(__videoElements[i], options, controlsOptions);
				this.videoPlayers.push(player);
			}
		}
	}

	//------------------------------------------------
	// Create the 'more content' expanders
	//------------------------------------------------
	WorkPageView.prototype.createExtraContentAccordions = function() {
		this.__accordionElements = this.__DOMElement.querySelectorAll(".js-more-content-accordion");
		if (this.__accordionElements && this.__accordionElements.length > 0) {
			var options = {
				duration: 1000,
				easing: "easeInOutQuart",
				autoScroll: true,
				autoScrollOffset: 79
			};
			var i = 0, length = this.__accordionElements.length;
			// Create one for each expander element found
			for (; i < length; i++) {
				this.extraContentAccordions.push(new NATION.Accordion(this.__accordionElements[i], options));
				// Store the show/hide copy for each button in an array
				this.showMoreContentTexts.push(this.__moreContentButtons[i].getAttribute("data-show"));
				this.hideMoreContentTexts.push(this.__moreContentButtons[i].getAttribute("data-hide"));
			}
		}
	}

	//------------------------------------------------
	// Listen for user events
	//------------------------------------------------
	WorkPageView.prototype.createListeners = function() {
		NATION2016.views.BasicPageView.prototype.createListeners.call(this);
		// Listen for clicks on the scroll button found just below the header
		if (this.__scrollButton) {
			this.handler_scrollButtonClicked = this.onScrollButtonClicked.bind(this);
			this.__scrollButton.addEventListener("click", this.handler_scrollButtonClicked);
		}
		// Listen for clicks on the 'show more' button of each accordion
		if (this.extraContentAccordions.length) {
			var i = 0, length = this.extraContentAccordions.length;
			for (; i < length; i++) {
				this.handler_moreContentClicked = this.onMoreContentButtonClicked.bind(this);
				this.extraContentAccordions[i].addListener(this.extraContentAccordions[i].HEADER_CLICKED, this.handler_moreContentClicked);
			}
		}
		this.handler_pageContentLoaded = this.onPageContentLoaded.bind(this);
		window.addEventListener("load", this.handler_pageContentLoaded);
		i = 0; length = this.__bottomNavImages.length;
		this.handler_bottomNavImageLoaded = this.onBottomNavImageLoaded.bind(this);
		for (; i < length; i++) {
			this.__bottomNavImages[i].addEventListener("load", this.handler_bottomNavImageLoaded);
		}
	}

	//------------------------------------------------
	// Stop listening for user clicks
	//------------------------------------------------
	WorkPageView.prototype.removeListeners = function() {
		NATION2016.views.BasicPageView.prototype.removeListeners.call(this);
		if (this.__scrollButton) {
			this.__scrollButton.removeEventListener("click", this.handler_scrollButtonClicked);
		}
		if (this.extraContentAccordions.length) {
			var i = 0, length = this.extraContentAccordions.length;
			for (; i < length; i++) {
				this.extraContentAccordions[i].removeListener(this.extraContentAccordions[i].HEADER_CLICKED, this.handler_moreContentClicked);
			}
		}
		window.removeEventListener("load", this.handler_pageContentLoaded);
		i = 0; length = this.__bottomNavImages.length;
		for (; i < length; i++) {
			this.__bottomNavImages[i].removeEventListener("load", this.handler_bottomNavImageLoaded);
		}
	}

	//------------------------------------------------
	// Animate in the view - called when user is
	// coming from the work index page
	//------------------------------------------------
	WorkPageView.prototype.show = function() {
		this.showing = true;
		// Make sure the page container is no longer translated upwards
		NATION.Utils.setStyle(this.__DOMElement, {transform: "none"});
		var __contentContainer = this.__DOMElement.querySelector(".js-work-page-content");
		__contentContainer.style.opacity = 0;
		// Fade in content below header
		__contentContainer.style.opacity = 1;
		this.onShowComplete();
		//NATION.Animation.start(__contentContainer, {opacity: 1}, {duration: 500, easing: "easeInOutQuad"}, this.onShowComplete.bind(this));
	}

	//------------------------------------------------
	// Show animation is no longer playing
	//------------------------------------------------
	WorkPageView.prototype.onShowComplete = function(e) {
		this.showing = false;
	}

	//------------------------------------------------
	// Perform post-page removal cleanup
	//------------------------------------------------
	WorkPageView.prototype.destroy = function() {
		NATION2016.views.BasicPageView.prototype.destroy.call(this);
		// Stop a running show animation
		if (this.showing) {
			this.showing = false;
			var __contentContainer = this.__DOMElement.querySelector(".js-work-page-content");
			NATION.Animation.stop(__contentContainer);
		}
		// Pause videos where needed
		if (this.videoPlayers.length) {
			var i = 0, length = this.videoPlayers.length;
			for (; i < length; i++) {
				if (this.videoPlayers[i].pauseVideo) {
					this.videoPlayers[i].pauseVideo();
				}
			}
		}
		// Stop any page scroll in progress
		this.onAutoScrollComplete();
		this.removeListeners();
		// Kill any animated buttons
		var i = 0, length = this.animatedButtons.length;
		for (; i < length; i++) {
			this.animatedButtons[i].destroy();
		}
		// Kill the accordion, if it exists
		if (this.extraContentAccordion) {
			this.extraContentAccordion.destroy();
		}
	}

	//------------------------------------------------
	// Scroll the page to the 'section referenced by the 
	// ID in the href
	//------------------------------------------------
	WorkPageView.prototype.onScrollButtonClicked = function(e) {
		this.handler_mouseWheelScrolled = this.onMouseWheelScrolled.bind(this);
		window.addEventListener("wheel", this.handler_mouseWheelScrolled);
		window.addEventListener("DOMMouseWheel", this.handler_mouseWheelScrolled);
		var target = NATION.Utils.getOffset(this.__DOMElement.querySelector(this.scrollTarget)).top;
		NATION.Animation.start(NATION.Utils.getPageElement(), {scrollTop: target}, {duration: 500, easing: "easeInOutQuad"}, this.onAutoScrollComplete.bind(this));
		e.stopPropagation();
		e.preventDefault();
	}

	//------------------------------------------------
	// Stop a scroll in progress
	//------------------------------------------------
	WorkPageView.prototype.onMouseWheelScrolled = function(e) {
		this.onAutoScrollComplete(e);
	}

	//------------------------------------------------
	// Stop listening for a mid-autoscroll mousewheel spin
	//------------------------------------------------
	WorkPageView.prototype.onAutoScrollComplete = function(e) {
		window.removeEventListener("wheel", this.handler_mouseWheelScrolled);
		window.removeEventListener("DOMMouseWheel", this.handler_mouseWheelScrolled);
		NATION.Animation.stop(NATION.Utils.getPageElement());
	}

	//------------------------------------------------
	// Swap the copy on the relevant 'show more' button
	//------------------------------------------------
	WorkPageView.prototype.onMoreContentButtonClicked = function(e) {
		// Work out which accordion this is
		var accordionID = 0, i = 0, length = this.extraContentAccordions.length;
		for (; i < length; i++) {
			if (e.target === this.extraContentAccordions[i]) {
				accordionID = i;
				break;
			}
		}
		var panelOpen = this.extraContentAccordions[accordionID].getOpenPanelID() > -1;
		var __label = this.__moreContentLabels[accordionID];
		while (this.__moreContentLabels[accordionID].firstChild) {
			this.__moreContentLabels[accordionID].removeChild(this.__moreContentLabels[accordionID].firstChild);
		}
		if (panelOpen) {
			this.__moreContentLabels[accordionID].appendChild(document.createTextNode(this.hideMoreContentTexts[accordionID]));
		} else {
			this.__moreContentLabels[accordionID].appendChild(document.createTextNode(this.showMoreContentTexts[accordionID]));
		}
		// Copy length may have changed, so resize the button
		this.animatedButtons[accordionID].resize();
	}

	//------------------------------------------------
	// An extra resize to make sure the footer's
	// "view list" button is the correct height
	//------------------------------------------------
	WorkPageView.prototype.onPageContentLoaded = function(e) {
		this.resize();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	WorkPageView.prototype.onBottomNavImageLoaded = function(e) {
		this.resizeViewListButton();
	}

	window.NATION2016.views.WorkPageView = WorkPageView;

}(window, document, undefined));