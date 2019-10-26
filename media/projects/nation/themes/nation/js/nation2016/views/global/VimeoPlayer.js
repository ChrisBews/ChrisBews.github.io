//////////////////////////////////////////////////////////////////////////////
// Nation Website 2016
// Vimeo video player
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("NATION2016.views.global");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var VimeoPlayer = function(element, options, controlsOptions) {
		NATION.EventDispatcher.call(this);
		this.__DOMElement = element;
		this.options = options;
		// Event names
		this.PLAYER_READY = "PlayerReady";
		this.VIDEO_COMPLETE = "VideoComplete";
		this.VIDEO_PLAYING = "VideoStarted";
		this.VIDEO_STOPPED = "VideoStopped";
		this.PLAY_PROGRESS = "PlayProgress";
		// API URLs
		this.PLAYER_API = "http://a.vimeocdn.com/js/froogaloop2.min.js";
		this.PLAYER_URL = "http://player.vimeo.com/video/";
		// Other variables
		this.videoURL = this.__DOMElement.getAttribute("data-video");
		this.videoID = 0;
		this.videoPlaying = false;
		this.player = null;
		this.playerReady = false;
		this.apiLoaded = false;
		this.preventEvent = false;
		this.vimeoCheckTimer = null;
		this.firstPlayHasHappened = false;
		if (this.videoURL) {
			this.setup();
		}
	}

	VimeoPlayer.prototype = Object.create(NATION.EventDispatcher.prototype);
	VimeoPlayer.prototype.constructor = VimeoPlayer;

	//------------------------------------------------
	// Load the API if it hasn't already been loaded
	//------------------------------------------------
	VimeoPlayer.prototype.setup = function() {
		if (document.getElementById("vimeo-api")) {
			this.onAPILoaded();
		} else {
			NATION.Utils.ajax({
				url: this.PLAYER_API,
				dataType: "script",
				id: "vimeo-api",
				success: this.onAPILoaded.bind(this)
			});
		}
	}

	//------------------------------------------------
	// Returns true if this video has started playing yet. 
	// This is useful for mobile devices on data connections
	//------------------------------------------------
	VimeoPlayer.prototype.getHasPlayTriggered = function() {
		return this.firstPlayHasHappened;
	}

	//------------------------------------------------
	// Parse the passed URL for the unique video ID
	//------------------------------------------------
	VimeoPlayer.prototype.getVideoID = function(videoURL) {
		var startIndex = (videoURL.search("hd#") > -1) ? videoURL.search("hd#")-3 : videoURL.search("vimeo.com/") + 10;
		var endIndex = (videoURL.search("&") > -1) ? videoURL.search("&") : videoURL.length;
		this.videoID = videoURL.substr(startIndex, (endIndex - startIndex));
	}

	//------------------------------------------------
	// Returns true if video is currently playing
	//------------------------------------------------
	VimeoPlayer.prototype.isPlaying = function() {
		return this.videoPlaying;
	}

	//------------------------------------------------
	// Start playing the video
	//------------------------------------------------
	VimeoPlayer.prototype.playVideo = function() {
		if (this.playerReady && this.apiLoaded) {
			this.player.api("play");
			this.videoPlaying = true;
		}
	}

	//------------------------------------------------
	// Pause the video, and optionally prevent a 'pause'
	// event from being sent out
	//------------------------------------------------
	VimeoPlayer.prototype.pauseVideo = function(preventEvent) {
		if (this.playerReady && this.apiLoaded) {
			this.preventEvent = preventEvent;
			this.player.api("pause");
			this.videoPlaying = false;
		}
	}

	//------------------------------------------------
	// Listen for video events
	//------------------------------------------------
	VimeoPlayer.prototype.createListeners = function() {
		this.player.addEvent("play", this.onVideoPlayed.bind(this));
		this.player.addEvent("pause", this.onVideoPaused.bind(this));
		this.player.addEvent("finish", this.onVideoFinished.bind(this));
		this.__DOMElement.querySelector(".js-video-overlay").addEventListener("click", this.onOverlayClicked.bind(this));
	}

	//------------------------------------------------
	// Create the vimeo player iframe
	//------------------------------------------------
	VimeoPlayer.prototype.createPlayer = function() {
		var currentTime = Date.now();
		var html = "<iframe width='100%' height='100%' src='" + this.PLAYER_URL + this.videoID + "?api=1&player_id=" + this.videoID + currentTime + "' id='" + this.videoID + currentTime + "' ></iframe>";
		this.__DOMElement.querySelector(".js-player, .player").innerHTML = html;
		var iframe = this.__DOMElement.querySelector("iframe");
		this.player = window["$f"](iframe);
	}

	//------------------------------------------------
	// Instantiate the player now that the API has loaded
	//------------------------------------------------
	VimeoPlayer.prototype.onAPILoaded = function() {
		if (window["$f"]) {
			this.apiLoaded = true;
			this.getVideoID(this.videoURL);
			this.createPlayer();
			this.player.addEvent("ready", this.onPlayerReady.bind(this));
		} else {
			if (this.vimeoCheckTimer) {
				clearTimeout(this.vimeoCheckTimer);
				this.vimeoCheckTimer = null;
			}
			this.vimeoCheckTimer = setTimeout(this.onAPILoaded.bind(this), 300);
		}
	}

	//------------------------------------------------
	// Set options on the player, and listen for video events
	//------------------------------------------------
	VimeoPlayer.prototype.onPlayerReady = function() {
		this.playerReady = true;
		this.player.api("setColor", this.__DOMElement.getAttribute("data-player-color"));
		if (this.options.autoPlay) this.playVideo();
		if (this.options.mute) this.player.api("setVolume", 0);
		if (this.options.loop) this.player.api("setLoop", true);
		this.createListeners();
		this.trigger(this.PLAYER_READY);
	}

	//------------------------------------------------
	// Signal that the video has started playback
	//------------------------------------------------
	VimeoPlayer.prototype.onVideoPlayed = function(e) {
		this.videoPlaying = true;
		this.firstPlayHasHappened = true;
		if (!this.preventEvent) {
			this.trigger(this.VIDEO_PLAYING);
		} else {
			this.preventEvent = false;
		}
	}

	//------------------------------------------------
	// Signal that the video has paused playback
	//------------------------------------------------
	VimeoPlayer.prototype.onVideoPaused = function(e) {
		this.videoPlaying = false;
		if (!this.preventEvent) {
			this.trigger(this.VIDEO_STOPPED);
		} else {
			this.preventEvent = false;
		}
	}

	//------------------------------------------------
	// Signal that the video has finished
	//------------------------------------------------
	VimeoPlayer.prototype.onVideoFinished = function(e) {
		this.videoPlaying = false;
		if (!this.preventEvent) {
			this.trigger(this.VIDEO_STOPPED);
		} else {
			this.preventEvent = false;
		}
	}

	//------------------------------------------------
	// Start playing the video
	//------------------------------------------------
	VimeoPlayer.prototype.onOverlayClicked = function(e) {
		var __controlsContainer = this.__DOMElement.querySelector(".js-controls-container");
		if (__controlsContainer) {
			__controlsContainer.style.display = "none";
		}
		var __placeholder = this.__DOMElement.querySelector(".js-placeholder");
		if (__placeholder) {
			__placeholder.style.zIndex = -1;
		}
		this.playVideo();
		e.stopPropagation();
		e.preventDefault();
	}

	window.NATION2016.views.global.VimeoPlayer = VimeoPlayer;

}(window, document, undefined));