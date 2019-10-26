//////////////////////////////////////////////////////////////////////////////
// Nation Website 2016
// Video player that can handle YouTube, Vimeo, and locally hosted videos
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("NATION2016.views.global");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var MultiSourceVideoPlayer = function(element, options, controlsOptions, disableControls) {
		NATION.EventDispatcher.call(this);
		this.__DOMElement = element;
		this.options = options;
		this.controlsOptions = controlsOptions;
		if (this.__DOMElement.getAttribute("data-poster")) {
			this.options.poster = this.__DOMElement.getAttribute("data-poster");
		}
		if (this.controlsOptions !== false) {
			if (!this.controlsOptions.duration) {
				this.controlsOptions.duration = 300;
			}
			if (!this.controlsOptions.easing) {
				this.controlsOptions.easing = "easeInOutQuad";
			}
		}
		this.disableControls = disableControls;
		this.__placeholder = this.__DOMElement.querySelector(".js-placeholder");
		this.placeholderHidden = false;
		// Event names
		this.VIDEO_COMPLETE = "VideoComplete";
		this.PLAYER_READY = "PlayerReady";
		this.PLAY_PROGRESS = "PlayProgress";
		this.player = null;
		this.setup();
		this.createListeners();
	}

	MultiSourceVideoPlayer.prototype = Object.create(NATION.EventDispatcher.prototype);
	MultiSourceVideoPlayer.prototype.constructor = MultiSourceVideoPlayer;

	//------------------------------------------------
	// Returns true if this video has started playing yet. 
	// This is useful for mobile devices on data connections
	//------------------------------------------------
	MultiSourceVideoPlayer.prototype.getHasPlayTriggered = function() {
		return this.player.getHasPlayTriggered();
	}

	//------------------------------------------------
	// Play this video, if not currently playing
	//------------------------------------------------
	MultiSourceVideoPlayer.prototype.playVideo = function() {
		if (!this.player.isPlaying()) {
			this.player.playVideo(true);
		}
	}

	//------------------------------------------------
	// Pause this video, if currently playing
	//------------------------------------------------
	MultiSourceVideoPlayer.prototype.pauseVideo = function() {
		if (this.player.isPlaying()) {
			this.player.pauseVideo(true);
		}
	}

	//------------------------------------------------
	// Seek to a given time
	//------------------------------------------------
	MultiSourceVideoPlayer.prototype.seekTo = function(time) {
		this.player.seekTo(time);
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	MultiSourceVideoPlayer.prototype.getCurrentTime = function(milliseconds) {
		return this.player.getCurrentTime(milliseconds);
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	MultiSourceVideoPlayer.prototype.getDuration = function(milliseconds) {
		return this.player.getDuration(milliseconds);
	}

	//------------------------------------------------
	// Build either a HTML5 player, a YouTube player, 
	// or a Vimeo player
	//------------------------------------------------
	MultiSourceVideoPlayer.prototype.setup = function() {
		var videoURL = this.__DOMElement.getAttribute("data-video");
		if (videoURL) {
			if (videoURL.search(/youtube/i) > -1 || videoURL.search(/youtu\.be/i) > -1) {
				// Create a YouTube player
				if (this.disableControls) {
					this.player = new NATION.video.BasicYouTubePlayer(this.__DOMElement, this.options);
				} else {
					this.player = new NATION2016.views.global.YouTubePlayer(this.__DOMElement, this.options, this.controlsOptions);
				}
			} else if (videoURL.search(/vimeo/i) > -1) {
				// Create a Vimeo player
				this.__DOMElement.className += " vimeo";
				var __controls = this.__DOMElement.querySelector(".js-controls");
				if (__controls) {
					__controls.style.display = "none";
				}
				this.player = new NATION2016.views.global.VimeoPlayer(this.__DOMElement, this.options);
			} else {
				// Create a local player
				if (this.disableControls) {
					this.player = new NATION.video.BasicVideoPlayer(this.__DOMElement, this.options);
				} else {
					this.player = new NATION2016.views.global.LocalVideoPlayer(this.__DOMElement, this.options, this.controlsOptions);
				}
			}
		}
	}

	//------------------------------------------------
	// Listen for the video starting
	//------------------------------------------------
	MultiSourceVideoPlayer.prototype.createListeners = function() {
		this.handler_videoStarted = this.onVideoStarted.bind(this);
		this.player.addListener(this.player.VIDEO_PLAYING, this.handler_videoStarted);
		this.handler_playerReady = this.onPlayerReady.bind(this);
		this.player.addListener(this.player.PLAYER_READY, this.handler_playerReady);
		this.handler_videoComplete = this.onVideoComplete.bind(this);
		this.player.addListener(this.player.VIDEO_COMPLETE, this.handler_videoComplete);
		this.handler_videoPlayProgress = this.onVideoPlayProgress.bind(this);
		this.player.addListener(this.player.PLAY_PROGRESS, this.handler_videoPlayProgress);
	}

	//------------------------------------------------
	// Stop listening for the video starting
	//------------------------------------------------
	MultiSourceVideoPlayer.prototype.removeListeners = function() {
		this.player.removeListener(this.player.VIDEO_PLAYING, this.handler_videoStarted);
		this.player.removeListener(this.player.PLAYER_READY, this.handler_playerReady);
		this.player.removeListener(this.player.VIDEO_COMPLETE, this.handler_videoComplete);
		this.player.removeListener(this.player.PLAY_PROGRESS, this.handler_videoPlayProgress);
	}

	//------------------------------------------------
	// Hide placeholder if needed
	//------------------------------------------------
	MultiSourceVideoPlayer.prototype.onVideoStarted = function(e) {
		if (this.__placeholder && !this.placeholderHidden) {
			this.placeholderHidden = true;
			if (this.__DOMElement.className.search(/started/i) < 0) {
				this.__DOMElement.className += " started";
			}
		}
		if (this.__DOMElement.className.search(/active/i) < 0) {
			this.__DOMElement.className += " active";
		}
	}

	//------------------------------------------------
	// Signal that the player is ready to go
	//------------------------------------------------
	MultiSourceVideoPlayer.prototype.onPlayerReady = function(e) {
		this.trigger(this.PLAYER_READY);
	}

	//------------------------------------------------
	// Signal that the video has finished
	//------------------------------------------------
	MultiSourceVideoPlayer.prototype.onVideoComplete = function(e) {
		this.trigger(this.VIDEO_COMPLETE);
	}

	//------------------------------------------------
	// Signal that the video has played some more
	//------------------------------------------------
	MultiSourceVideoPlayer.prototype.onVideoPlayProgress = function(e) {
		this.trigger(this.PLAY_PROGRESS);
	}

	window.NATION2016.views.global.MultiSourceVideoPlayer = MultiSourceVideoPlayer;

}(window, document, undefined));