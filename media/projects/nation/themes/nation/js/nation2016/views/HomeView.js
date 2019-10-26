//////////////////////////////////////////////////////////////////////////////
// Nation Website 2016
// Homepage view
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("NATION2016.views");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var HomeView = function(element) {
		NATION2016.views.BasicPageView.call(this);
		this.__DOMElement = element;
		this.REQUIRED_FLAG_LOOPS = 3;
		this.OVERLAY_DELAY = 2500;
		this.REEL_VIDEO_WIDTH = 1920;
		this.REEL_VIDEO_HEIGHT = 1080;
		this.__flagVideoElement = null;
		this.__loopVideoElement = null;
		this.__reelVideoElement = null;
		this.__reelCloseButton = null;
		this.__reelButton = null;
		this.__title = null;
		this.overlayTimer = null;
		this.__subtitle = null;
		this.__subnav = null;
		this.flagVideo = null;
		this.loopVideo = null;
		this.reelVideo = null;
		this.flagLoops = 0;
		this.logoAnimation = null;
		this.__subnavDivider = null;
		this.__subnavLeft = null;
		this.__subnavRight = null;
		this.__subnavUnderlineLeft = null;
		this.__subnavUnderlineRight = null;
		this.reelVideoPadding = 0;
	}

	HomeView.prototype = Object.create(NATION2016.views.BasicPageView.prototype);
	HomeView.prototype.constructor = HomeView;

	//------------------------------------------------
	// Perform initial setup
	//------------------------------------------------
	HomeView.prototype.build = function(pageData) {
		NATION2016.views.BasicPageView.prototype.build.call(this, pageData, true);
		this.prepareElements();
		this.createLineAnimations();
		this.createVideos();
		this.createListeners();
		// When firstPageLoad is true, the flag video is created in createVideos
		// which then triggers the full intro sequence. If firstPageLoad is false,
		// we just want to skip straight to the end screen with everything visible
		// and the looping video playing
		if (!NATION2016.Settings.firstPageLoad) {
			// Show the logo complete immediately
			this.logoAnimation.start(true);
			// Wait for loop video to be ready
			if (this.loopVideo) {
				this.handler_loopVideoReady = this.onLoopVideoReady.bind(this);
				this.loopVideo.addListener(this.loopVideo.PLAYER_READY, this.handler_loopVideoReady);
			}
		}
		// If there's no loop video, and only the flag video, we need to start the overlay animation
		// on a timeout, rather than video loops
		if (!this.__loopVideoElement && NATION2016.Settings.firstPageLoad && !NATION2016.Settings.TOUCH_DEVICE) {
			this.overlayTimer = setTimeout(this.onOverlayTimerTicked.bind(this), this.OVERLAY_DELAY);
		} else {
			this.revealOverlay(true);
		}

		// Signal that this view is ready to be shown
		this.trigger(NATION2016.Events.VIEW_READY);
	}

	//------------------------------------------------
	// Create the class that handles the logo line animation
	//------------------------------------------------
	HomeView.prototype.createLineAnimations = function() {
		var options = {
			duration: 250,
			easing: "linear"
		};
		this.logoAnimation = new NATION2016.views.global.LineAnimation(this.__title, options);
	}

	//------------------------------------------------
	// Start playing the loop video immediately
	// This only fires if it's not the first page load
	// (see code in build function)
	//------------------------------------------------
	HomeView.prototype.onLoopVideoReady = function() {
		this.playLoopVideo();
	}

	//------------------------------------------------
	// Store references to key elements
	//------------------------------------------------
	HomeView.prototype.prepareElements = function() {
		this.__flagVideoElement = this.__DOMElement.querySelector(".js-flag-video");
		this.__loopVideoElement = this.__DOMElement.querySelector(".js-loop-video");
		this.__reelButton = this.__DOMElement.querySelector(".js-reel-button");
		this.__reelVideoElement = this.__DOMElement.querySelector(".js-reel-video");
		this.__reelPlayerContainer = this.__reelVideoElement.querySelector(".js-player");
		this.__reelPlayerControls = this.__reelVideoElement.querySelector(".js-controls-container");
		this.__reelCloseButton = this.__reelVideoElement.querySelector(".js-close-button");
		this.__subnav = this.__DOMElement.querySelector(".js-subnav");
		this.__subnavDivider = this.__subnav.querySelector(".divider");
		this.__subnavLeft = this.__subnav.querySelectorAll(".copy")[0];
		this.__subnavRight = this.__subnav.querySelectorAll(".copy")[1];
		this.__subnavUnderlineLeft = this.__subnavLeft.querySelector(".underline");
		this.__subnavUnderlineRight = this.__subnavRight.querySelector(".underline");
		// Used for the intro sequence
		this.__title = this.__DOMElement.querySelector(".js-title");
		this.__subtitle = this.__DOMElement.querySelector(".js-subtitle");
		this.reelVideoPadding = NATION.Utils.getStyle(this.__reelVideoElement.querySelector(".video-content"), "left");
		if (!this.reelVideoPadding) this.reelVideoPadding = 0;
		this.reelVideoPadding = parseInt(this.reelVideoPadding, 10);
		
	}

	//------------------------------------------------
	// Create the flag, loop, and reel video players
	//------------------------------------------------
	HomeView.prototype.createVideos = function() {
		// Flag video
		var options = {
			mute: true,
			preload: true
		};
		var controlsOptions = {
			fade: true
		};
		if (!this.__loopVideoElement) {
			options.loop = true;
		}
		// Only create videos on desktops
		if (!NATION2016.Settings.TOUCH_DEVICE) {
			// Create flag video if this isn't the first page load on the site in this session
			if ((this.__loopVideoElement && NATION2016.Settings.firstPageLoad) || !this.__loopVideoElement) {
				this.flagVideo = new NATION2016.views.global.MultiSourceVideoPlayer(this.__flagVideoElement, options, false, true);
			}
			// Create loop video if the relevant element exists (loop video is optional)
			if (this.__loopVideoElement) {
				// Looping background video
				options.loop = true;
				this.loopVideo = new NATION2016.views.global.MultiSourceVideoPlayer(this.__loopVideoElement, options, false, true);
			}
		}
		// Create the reel video player
		// Reel video gets created on both desktop and mobile
		options.loop = false;
		options.mute = false;
		options.mobileMode = NATION2016.Settings.TOUCH_DEVICE;
		controlsOptions.mobileMode = NATION2016.Settings.TOUCH_DEVICE;
		this.reelVideo = new NATION2016.views.global.MultiSourceVideoPlayer(this.__reelVideoElement, options, controlsOptions, false);
	}

	//------------------------------------------------
	// Handle video related events
	//------------------------------------------------
	HomeView.prototype.createListeners = function() {
		NATION2016.views.BasicPageView.prototype.createListeners.call(this);
		// Only do this stuff if the flag video has been created (this means we're on desktop)
		if (this.flagVideo) {
			this.handler_videoReady = this.onFlagVideoReady.bind(this);
			this.flagVideo.addListener(this.flagVideo.PLAYER_READY, this.handler_videoReady);
			// If the loop video exists, start counting flag video loops
			if (this.__loopVideoElement) {
				this.handler_flagVideoComplete = this.onFlagVideoComplete.bind(this);
				this.flagVideo.addListener(this.flagVideo.VIDEO_COMPLETE, this.handler_flagVideoComplete);
			}
		}
		// Listen for user requesting the reel
		this.handler_reelButtonClicked = this.onReelButtonClicked.bind(this);
		this.__reelButton.addEventListener("click", this.handler_reelButtonClicked);
		this.handler_reelCloseClicked = this.onReelCloseButtonClicked.bind(this);
		this.__reelCloseButton.addEventListener("click", this.handler_reelCloseClicked);
	}

	//------------------------------------------------
	// Remove all created event listeners
	//------------------------------------------------
	HomeView.prototype.removeListeners = function() {
		NATION2016.views.BasicPageView.prototype.removeListeners.call(this);
		if (this.flagVideo) {
			this.flagVideo.removeListener(this.flagVideo.PLAYER_READY, this.handler_videoReady);
			this.flagVideo.removeListener(this.flagVideo.VIDEO_COMPLETE, this.handler_flagVideoComplete);
		}
		this.__reelButton.removeEventListener("click", this.handler_reelButtonClicked);
		this.__reelCloseButton.removeEventListener("click", this.handler_reelCloseClicked);
	}

	//------------------------------------------------
	// Start the full intro with flag video first
	//------------------------------------------------
	HomeView.prototype.onFlagVideoReady = function(e) {
		this.flagVideo.playVideo();
		NATION.Animation.start(this.__flagVideoElement, {opacity: 1}, {duration: 400});
	}

	//------------------------------------------------
	// Time to start the logo animation
	//------------------------------------------------
	HomeView.prototype.onOverlayTimerTicked = function(e) {
		this.revealOverlay();
	}

	//------------------------------------------------
	// Count flag video loops, to check when to show
	// the loop video
	//------------------------------------------------
	HomeView.prototype.onFlagVideoComplete = function(e) {
		this.flagLoops++;
		if (this.flagLoops === 1) {
			// Start revealing the overlay text
			this.revealOverlay();
		}
		// If the flag video has looped the the required number of times
		if (this.flagLoops >= this.REQUIRED_FLAG_LOOPS) {
			this.flagVideo.removeListener(this.flagVideo.VIDEO_COMPLETE, this.handler_flagVideoComplete);
			// Play and show the main loop video
			this.playLoopVideo();
			NATION.Animation.start(this.__flagVideoElement, {opacity: 0}, {duration: 400}, this.onFlagVideoHideComplete.bind(this));
		}
		// Keep the flag video playing during loop fade in
		this.flagVideo.seekTo(0);
		this.flagVideo.playVideo();
	}

	//------------------------------------------------
	// Start the sequenced overlay animation
	//------------------------------------------------
	HomeView.prototype.revealOverlay = function(immediate) {
		// If immediate, skip to the end state of the overlay animation
		if (immediate) {
			this.__title.style.opacity = 1;
			this.__subtitle.style.opacity = 1;
			this.__subnav.style.opacity = 1;
			this.__subnavRight.style.opacity = 1;
			this.__subnavUnderlineLeft.style.opacity = 1;
			this.__subnavUnderlineRight.style.opacity = 1;
			this.logoAnimation.start(true);
			// Fade in the main nav
			this.trigger(NATION2016.Events.SUBNAV_SHOWN);
		} else {
			// Fade in the subtitle and subnav on delays
			this.logoAnimation.start();
			NATION.Animation.start(this.__subtitle, {opacity: 1}, {delay: 800, duration: 500});

			NATION.Utils.setStyle(this.__subnavLeft, {transform: "translateX(5%)"});
			NATION.Utils.setStyle(this.__subnavRight, {transform: "translateX(-5%)", opacity: 0});
			NATION.Utils.setStyle(this.__subnavDivider, {transform: "scaleX(0.3)"});

			NATION.Animation.start(this.__subnav, {opacity: 1}, {delay: 1600, duration: 150, easing: "easeInOutQuad"});

			NATION.Animation.start(this.__subnavLeft, {transform: "translateX(-5%)"}, {delay: 1600, duration: 150, easing: "easeInQuad"});
			NATION.Animation.start(this.__subnavRight, {opacity: 1, transform: "translateX(5%)"}, {delay: 1600, duration: 150, easing: "easeInQuad"});
			
			
			NATION.Animation.start(this.__subnavUnderlineLeft, {opacity: 1}, {delay: 1750, duration: 200});
			NATION.Animation.start(this.__subnavUnderlineRight, {opacity: 1}, {delay: 1750, duration: 200});

			NATION.Animation.start(this.__subnavDivider, {transform: "scaleX(1.1)"}, {delay: 1600, duration: 150, easing: "easeInQuad"}, this.onDividerEnlarged.bind(this));
		}
	}
	HomeView.prototype.onDividerEnlarged = function(e) {
		NATION.Animation.start(this.__subnavLeft, {transform: "translateX(1.5%)"}, {duration: 150, easing: "easeOutQuad"});
		NATION.Animation.start(this.__subnavRight, {transform: "translateX(-1.5%)"}, {duration: 150, easing: "easeOutQuad"});
		NATION.Animation.start(this.__subnavDivider, {transform: "scaleX(0.9)"}, {duration: 150, easing: "easeOutQuad"}, this.onDividerShrunk.bind(this));
	}
	HomeView.prototype.onDividerShrunk = function(e) {
		// Fade in the main nav
		this.trigger(NATION2016.Events.SUBNAV_SHOWN);
		
		NATION.Animation.start(this.__subnavLeft, {transform: "translateX(0)"}, {duration: 400, easing: "easeOutQuad"});
		NATION.Animation.start(this.__subnavRight, {transform: "translateX(0)"}, {duration: 400, easing: "easeOutQuad"});
		NATION.Animation.start(this.__subnavDivider, {transform: "scaleX(1)"}, {duration: 400, easing: "easeOutQuad"}, this.onSubnavShown.bind(this));
	}

	HomeView.prototype.onSubnavShown = function(e) {
		
	}

	//------------------------------------------------
	// Start the loop video playing
	//------------------------------------------------
	HomeView.prototype.playLoopVideo = function(e) {
		if (this.loopVideo) {
			this.__loopVideoElement.style.opacity = 1;
			this.loopVideo.playVideo();
		}
	}

	//------------------------------------------------
	// Hide the flag video from display
	//------------------------------------------------
	HomeView.prototype.onFlagVideoHideComplete = function(e) {
		//this.flagVideo.pauseVideo();
		this.__flagVideoElement.style.display = "none";
	}

	//------------------------------------------------
	// Pause the loop video and show the reel
	//------------------------------------------------
	HomeView.prototype.onReelButtonClicked = function(e) {
		// Start fading in the reel video
		this.__reelVideoElement.style.display = "block";
		this.__reelVideoElement.style.opacity = 0;
		NATION.Animation.start(this.__reelVideoElement, {opacity: 1}, {duration: 300});
		// Pause the loop video if it was created
		if (this.loopVideo) {
			this.loopVideo.pauseVideo();
		}
		// Start the reel video playing immediately (fade is short)
		if (!NATION2016.Settings.TOUCH_DEVICE || this.reelVideo.getHasPlayTriggered()) {
			this.reelVideo.playVideo();
		}
		//this.__reelVideoElement.querySelector("video").className += " active";
		e.stopPropagation();
		e.preventDefault();
	}

	//------------------------------------------------
	// Start the loop video playing again and hide the reel
	//------------------------------------------------
	HomeView.prototype.onReelCloseButtonClicked = function(e) {
		// Start loop if it exists
		if (this.loopVideo) {
			this.loopVideo.playVideo();
		}
		// Reset the reel video
		this.reelVideo.seekTo(0);
		this.reelVideo.pauseVideo();
		// Then hide it
		NATION.Animation.start(this.__reelVideoElement, {opacity: 0}, {duration: 300}, this.onReelHidden.bind(this));
		e.stopPropagation();
		e.preventDefault();
	}

	//------------------------------------------------
	// Clean up after being removed from the page
	//------------------------------------------------
	HomeView.prototype.destroy = function() {
		// Ensure all videos are paused
		if (this.flagVideo) {
			this.flagVideo.pauseVideo();
		}
		if (this.loopVideo) {
			this.loopVideo.pauseVideo();
		}
		if (this.reelVideo) {
			this.reelVideo.pauseVideo();
		}
		if (this.logoAnimation) {
			this.logoAnimation.stop();
		}
		if (this.overlayTimer) {
			clearTimeout(this.overlayTimer);
			this.overlayTimer = null;
		}
		// Remove all event listeners
		this.removeListeners();
		NATION.Animation.stop(this.__reelVideoElement);
		NATION2016.views.BasicPageView.prototype.destroy.call(this);
	}

	//------------------------------------------------
	// Resize the reel's controls to match the video's
	// aspect ratio
	//------------------------------------------------
	HomeView.prototype.resize = function() {
		// Video is 1920x1280
		var newWidth = 0;
		var newHeight = 0;
		var videoPadding = this.reelVideoPadding * 2;
		if ((this.REEL_VIDEO_WIDTH / (window.innerWidth-videoPadding)) > (this.REEL_VIDEO_HEIGHT / (window.innerHeight-videoPadding))) {
			newWidth = "100%";
			newHeight = (((window.innerWidth-videoPadding) / this.REEL_VIDEO_WIDTH) * this.REEL_VIDEO_HEIGHT) + "px";
		} else {
			newHeight = "100%";
			newWidth = (((window.innerHeight-videoPadding) / this.REEL_VIDEO_HEIGHT) * this.REEL_VIDEO_WIDTH) + "px";
		}
		this.__reelPlayerControls.style.width = newWidth;
		this.__reelPlayerControls.style.height = newHeight;
	}

	//------------------------------------------------
	// Remove reel element from display
	//------------------------------------------------
	HomeView.prototype.onReelHidden = function() {
		this.__reelVideoElement.style.display = "none";
	}

	window.NATION2016.views.HomeView = HomeView;

}(window, document, undefined));