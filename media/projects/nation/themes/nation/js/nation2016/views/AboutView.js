//////////////////////////////////////////////////////////////////////////////
// Nation Website 2016
// 'About us' page view
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("NATION2016.views");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var AboutView = function(element) {
		NATION2016.views.BasicPageView.call(this);
		this.__DOMElement = element;
		this.__introHeader = null;
		this.__introTitle = null;
		this.__headerVideo = null;
		this.__approachVideos = [];
		this.approachVideoPlayers = [];
		this.__subtitleGraphic = null;
		this.__headerSlideshowElement = null;
		this.headerSlideshow = null;
		this.__titleCopy = null;
		this.videoPlayer = null;
	}

	AboutView.prototype = Object.create(NATION2016.views.BasicPageView.prototype);
	AboutView.prototype.constructor = AboutView;

	//------------------------------------------------
	// Perform initial setup
	//------------------------------------------------
	AboutView.prototype.build = function(pageData) {
		NATION2016.views.BasicPageView.prototype.build.call(this, pageData, true);
		// Store references to key elements
		this.__introTitle = this.__DOMElement.querySelector(".js-intro-title");
		this.__titleCopy = this.__DOMElement.querySelector(".js-title-copy");
		this.__introHeader = this.__DOMElement.querySelector(".js-intro-header");
		this.__headerVideo = this.__introHeader.querySelector(".js-video-player");
		this.__approachVideos = this.__DOMElement.querySelectorAll(".js-approach .js-video-player");
		this.__subtitleGraphic = this.__introHeader.querySelector(".js-subtitle-graphic");
		this.__headerImage = this.__introHeader.querySelector("img");
		this.headerImageTimer = null;
		// Create video player in header, and those in the 'how we do it' section
		this.createVideoPlayers();
		this.createListeners();
		// Initial resize to make sure header element takes up the right amount of the browser window
		this.resize();
		// Wait for the header image to load on mobile devices
		if (NATION2016.Settings.TOUCH_DEVICE) {
			this.checkHeaderImageLoaded();
		} else {
			this.trigger(NATION2016.Events.VIEW_READY);
		}
	}

	//------------------------------------------------
	// Signal that the view is ready when header image has loaded
	//------------------------------------------------
	AboutView.prototype.checkHeaderImageLoaded = function() {
		if (this.headerImageTimer) {
			clearTimeout(this.headerImageTimer);
			this.headerImageTimer = null;
		}
		if (this.__headerImage.complete) {
			// View is ready to be displayed
			this.trigger(NATION2016.Events.VIEW_READY);
		} else {
			// Try again after a short wait
			this.headerImageTimer = setTimeout(this.checkHeaderImageLoaded.bind(this), 200);
		}
	}

	//------------------------------------------------
	// Perform cleanup after page has been removed
	//------------------------------------------------
	AboutView.prototype.destroy = function() {
		NATION2016.views.BasicPageView.prototype.destroy.call(this);
	}

	//------------------------------------------------
	// Create videos through the whole page
	//------------------------------------------------
	AboutView.prototype.createVideoPlayers = function() {
		if (!NATION2016.Settings.TOUCH_DEVICE) {
			var options = {
				mute: true,
				preload: true,
				loop: true,
				autoPlay: true
			};
			// Header video
			this.videoPlayer = new NATION.video.BasicVideoPlayer(this.__headerVideo, options);
			// Our approach videos
			var i = 0, length = this.__approachVideos.length, player;
			for (; i < length; i++) {
				player = new NATION.video.BasicVideoPlayer(this.__approachVideos[i], options);
				this.approachVideoPlayers.push(player);
			}
		}
	}

	//------------------------------------------------
	// Listen for the video player to be playable
	//------------------------------------------------
	AboutView.prototype.createListeners = function() {
		NATION2016.views.BasicPageView.prototype.createListeners.call(this);
	}

	//------------------------------------------------
	// Make sure header area covers enough of the viewport
	//------------------------------------------------
	AboutView.prototype.resize = function() {
		var windowWidth = (NATION2016.Settings.TOUCH_DEVICE) ? window.outerWidth : window.innerWidth;
		if (this.__introHeader) {
			if (windowWidth > 550) {
				// Use outerHeight on mobile devices to avoid pixel density issues
				var windowHeight = (NATION2016.Settings.TOUCH_DEVICE) ? window.outerHeight : window.innerHeight;
				this.__introHeader.style.height = (windowHeight - (NATION2016.Settings.headerHeight + this.__introTitle.clientHeight - 6 + NATION2016.Settings.fullPanelOffset)) + "px";
			} else {
				this.__introHeader.style.removeProperty("height");
			}
		}
	}

	window.NATION2016.views.AboutView = AboutView;

}(window, document, undefined));