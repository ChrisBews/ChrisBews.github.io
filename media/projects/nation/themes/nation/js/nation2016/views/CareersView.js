//////////////////////////////////////////////////////////////////////////////
// Nation Website 2016
// 'Careers' page view
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("NATION2016.views");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var CareersView = function(element) {
		NATION2016.views.BasicPageView.call(this);
		this.__DOMElement = element;
		this.__videoElement = null;
		this.__videoPlaceholderImage = null;
		this.bgVideo = null;
		this.__accordionElement = null;
		this.__siteContent = null;
		this.__mainTitle = null;
		this.__careersContent = null;
		this.__contactsPanel = null;
		this.__positionsHeader = null;
		this.__noVacanciesPanel = null;
		this.__applyButtons = [];
		this.animatedButtons = [];
		this.jobsAccordion = null;
	}

	CareersView.prototype = Object.create(NATION2016.views.BasicPageView.prototype);
	CareersView.prototype.constructor = CareersView;

	//------------------------------------------------
	// Perform initial setup
	//------------------------------------------------
	CareersView.prototype.build = function(pageData) {
		NATION2016.views.BasicPageView.prototype.build.call(this, pageData);
		// Create the jobs accordion if jobs exist on the page
		this.__accordionElement = this.__DOMElement.querySelector(".js-accordion");
		if (this.__accordionElement) {
			this.createAccordion();
		}
		// Store references to other key elements
		this.__mainTitle = this.__DOMElement.querySelector(".js-fade-title");
		this.__careersContent = this.__DOMElement.querySelector(".js-careers-content");
		this.__contactsPanel = this.__DOMElement.querySelector(".js-contacts-panel");
		this.__siteContent = document.querySelector(".page-content");
		this.__videoElement = this.__DOMElement.querySelector(".js-bg-video");
		this.__positionsHeader = this.__DOMElement.querySelector(".js-positions-header");
		this.__noVacanciesPanel = this.__DOMElement.querySelector(".js-no-vacancies-panel");
		this.__applyButtons = this.__DOMElement.querySelectorAll(".js-apply-button");
		this.__videoPlaceholderImage = this.__DOMElement.querySelector(".js-placeholder img");
		this.createAnimatedButtons();
		// Create the no vacancies video player only on desktops
		// and only if the no vacancies panel exists
		if (this.__videoElement && !NATION2016.Settings.TOUCH_DEVICE) {
			this.createVideoPlayer();
		}
		// Perform initial resize to make sure no vacancies panel fills browser height
		this.resize();
		// View is immediately ready to be shown, unless there's a placeholder image
		if (!this.__videoPlaceholderImage || NATION2016.Settings.TOUCH_DEVICE) {
			this.trigger(NATION2016.Events.VIEW_READY);
		}
	}

	//------------------------------------------------
	// Create an animation for each 'apply now' button
	// found on the page
	//------------------------------------------------
	CareersView.prototype.createAnimatedButtons = function() {
		var i = 0, length = this.__applyButtons.length;
		for (; i < length; i++) {
			this.animatedButtons.push(new NATION2016.views.global.AnimatedVectorButton(this.__applyButtons[i]));
		}
	}

	//------------------------------------------------
	// Make sure everything has the correct height
	//------------------------------------------------
	CareersView.prototype.resize = function() {
		if (this.__noVacanciesPanel) {
			// If the no vacancies panel exists, size it to fit the browser window height
			// OuterHeight is used on mobiles to avoid pixel density issues
			var windowHeight = (NATION2016.Settings.TOUCH_DEVICE) ? window.outerHeight : window.innerHeight;
			this.__noVacanciesPanel.style.height = (windowHeight - (this.__positionsHeader.clientHeight + parseInt(NATION.Utils.getStyle(this.__siteContent, "paddingTop"), 10))) + "px";
		}
		if (this.jobsAccordion) {
			// If jobs exist, but there's only one and it doesn't fill enough height
			// Make sure it, and the contacts panel, are 50/50 of the available height
			if (this.jobsAccordion.getTotalSections() === 1 && this.jobsAccordion.getOpenPanelID() === -1) {
				// Clear any existing height styles
				var __header = this.__DOMElement.querySelector(".js-header");
				__header.style.height = "auto";
				this.__contactsPanel.style.height = "auto";
				// Get the actual height of the content
				var contentHeight = this.__careersContent.clientHeight;
				// Get the available height
				var siteContentHeight = (this.__siteContent.clientHeight - parseInt(NATION.Utils.getStyle(this.__siteContent, "paddingTop"), 10)) - this.__positionsHeader.clientHeight;
				// If the content height is less than available height, do the 50/50 thing
				if (contentHeight < siteContentHeight) {
					var newHeight = Math.floor(siteContentHeight/2) + "px";
					// Set the job header to 50% of available height
					__header.style.height = newHeight;
					// Set the contacts panel to 50% of available height
					this.__contactsPanel.style.height = newHeight;
				}
			}
			// Make sure all animated buttons have their backgrounds at the right size for their text
			if (this.jobsAccordion) {
				var i = 0, length = this.animatedButtons.length;
				for (; i < length; i++) {
					this.animatedButtons[i].resize();
				}
			}
		}
	}

	//------------------------------------------------
	// Stop listening for the video player to be ready
	//------------------------------------------------
	CareersView.prototype.removeListeners = function() {
		NATION2016.views.BasicPageView.prototype.removeListeners.call(this);
		if (this.bgVideo) {
			this.bgVideo.removeListener(this.bgVideo.PLAYER_READY, this.handler_playerReady);
		}
		if (this.jobsAccordion) {
			this.jobsAccordion.removeListener(this.jobsAccordion.PANEL_OPEN_COMPLETE, this.handler_accordionOpened);
		}
	}

	//------------------------------------------------
	// Create the jobs accordion using the Nation lib
	//------------------------------------------------
	CareersView.prototype.createAccordion = function() {
		var options = {
			easing: "easeInOutQuad",
			duration: 700,
			autoScroll: true,
			autoScrollOffset: 58
		}
		this.jobsAccordion = new NATION.Accordion(this.__accordionElement, options);
		this.handler_accordionOpened = this.onAccordionOpened.bind(this);
		this.jobsAccordion.addListener(this.jobsAccordion.PANEL_OPEN_COMPLETE, this.handler_accordionOpened);
	}

	//------------------------------------------------
	// Create the no vacancies video
	//------------------------------------------------
	CareersView.prototype.createVideoPlayer = function() {
		if (!NATION2016.Settings.TOUCH_DEVICE) {
			var options = {
				loop: true,
				mute: true,
				autoPlay: true
			};
			this.bgVideo = new NATION.video.BasicVideoPlayer(this.__videoElement, options);
			// Wait for video to be ready to play
			this.handler_playerReady = this.onBGVideoReady.bind(this);
			this.bgVideo.addListener(this.bgVideo.PLAYER_READY, this.handler_playerReady);
		}
		if (!this.__videoPlaceholderImage.complete) {
			this.handler_placeholderLoaded = this.onPlaceholderLoaded.bind(this);
			this.__videoPlaceholderImage.addEventListener("load", this.handler_placeholderLoaded);
		} else {
			this.trigger(NATION2016.Events.VIEW_READY);
		}
	}

	//------------------------------------------------
	// Fade the loaded video in and start looping it
	//------------------------------------------------
	CareersView.prototype.onBGVideoReady = function(e) {
		this.__videoElement.style.opacity = 0;
		NATION.Animation.start(this.__videoElement, {opacity: 1}, {duration: 400});
		this.bgVideo.playVideo();
	}

	//------------------------------------------------
	// Signal view is ready is video is also ready
	//------------------------------------------------
	CareersView.prototype.onPlaceholderLoaded = function(e) {
		this.trigger(NATION2016.Events.VIEW_READY);
	}

	//------------------------------------------------
	// Cleanup after page has been removed
	//------------------------------------------------
	CareersView.prototype.destroy = function() {
		// Remove all event listeners
		this.removeListeners();
		// Kill the jobs accordion if it exists
		if (this.jobsAccordion) {
			this.jobsAccordion.destroy();
		}
		// Pause the looping video if it exists
		if (this.bgVideo) {
			this.bgVideo.pauseVideo();
		}
		// Kill any animated buttons
		var i = 0, length = this.animatedButtons.length;
		for (; i < length; i++) {
			this.animatedButtons[i].destroy();
		}
		// Do standard cleanup
		NATION2016.views.BasicPageView.prototype.destroy.call(this);
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	CareersView.prototype.onAccordionOpened = function(e) {
		this.animatedButtons[this.jobsAccordion.getOpenPanelID()].resize();
	}

	window.NATION2016.views.CareersView = CareersView;

}(window, document, undefined));