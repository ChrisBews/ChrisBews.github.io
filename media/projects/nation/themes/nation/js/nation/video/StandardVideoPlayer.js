//////////////////////////////////////////////////////////////////////////////
// Nation Library
// Standard HTML5 Video Player with Controls
// Version 2.1.3
// Dependencies: NATION.video.BasicVideoPlayer, NATION.MediaControls, NATION.Utils, NATION.EventDispatcher,
// Optional Dependencies: NATION.ProgressBar
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	if (typeof window.NATION === "undefined") window.NATION = {};
	if (typeof window.NATION.video === "undefined") window.NATION.video = {};

	//////////////////////////
	// Depenency Management
	//////////////////////////
	function checkDependencies() {
		var packageName = "NATION.video.StandardVideoPlayer";
		var dependencies = {
			"NATION.video.BasicVideoPlayer": NATION.video.BasicVideoPlayer,
			"NATION.MediaControls": NATION.MediaControls,
			"NATION.Utils": NATION.Utils,
			"NATION.EventDispatcher": NATION.EventDispatcher
		};
		window.waitingDependencies = window.waitingDependencies || {};
		var dependenciesLoaded = true;
		for (var propName in dependencies) {
			if (!dependencies[propName]) {
				window.waitingDependencies[packageName] = {
					dependencies: dependencies,
					callback: function() {checkDependencies();}
				};
				dependenciesLoaded = false;
				break;
			}
		}

		if (dependenciesLoaded) {
			delete window.waitingDependencies[packageName];
			_initClass();
			// Check for any classes waiting on this one
			for (var className in window.waitingDependencies) {
				for (propName in window.waitingDependencies[className].dependencies) {
					if (propName === packageName) {
						// Re-run the waiting class' dependency check
						window.waitingDependencies[className].callback();
					}
				}
			}
		}
	}
	checkDependencies();

	//////////////////////////
	// Create Class
	//////////////////////////
	function _initClass() {
		/**
		* ### Dependencies:
		* [NATION.Utils](../Utils.js.html)
		* [NATION.EventDispatcher](../EventDispatcher.js.html)
		* [NATION.video.BasicVideoPlayer](BasicVideoPlayer.js.html)
		* [NATION.MediaControls](../MediaControls.js.html)
		* [NATION.ProgressBar](../ProgressBar.js.html)
		*
		* ### About:
		* A shortcut to creating an HTML5 video player with custom controls
		*
		* This class is a working example of combining BasicVideoPlayer and MediaControls. If additional functionality is required, it is best to do this yourself, but for many use-cases this class provides the required functionality.
		*
		* As this class is a subclass of NATION.video.BasicVideoPlayer, it fires all the same events, and has all the same methods
		*
		* @class StandardVideoPlayer
		* @param {domelement_or_querystring_or_jqueryobject} selector The element containing the .js-player or .player element within which the video will be created
		* @param {object} options Object containing the settings for this video player. See [NATION.video.BasicYouTubePlayer](../BasicYouTubePlayer.js.html) for a full list
		* @param {object} controlsOptions Object containing the settings for the MediaControls. See [NATION.MediaControls](../MediaControls.js.html) for a full list
		* @jsFiddle //jsfiddle.net/NationStudio/4c4jdqpL/embedded/
		*/
		var StandardVideoPlayer = function(selector, options, controlsOptions) {
			NATION.video.BasicVideoPlayer.call(this, selector, options);
			this.options = options;
			this.controlsOptions = controlsOptions;
			this.controls = null;
			this.__DOMElement = NATION.Utils.getDOMElement(selector);
			this.__placeholder = this.__DOMElement.querySelector(".js-placeholder, .placeholder");
			this.videoWasPlaying = false;
			this.createControls();
			this.createVideoListeners();
		}

		StandardVideoPlayer.prototype = Object.create(NATION.video.BasicVideoPlayer.prototype);
		StandardVideoPlayer.prototype.constructor = StandardVideoPlayer;

		/**
		* Creates basic controls
		* @ignore
		*/
		StandardVideoPlayer.prototype.createControls = function() {
			this.controls = new NATION.MediaControls(this.__DOMElement.querySelector(".js-controls-container, .controls-container"), this.controlsOptions);
			if (this.options.mute) {
				this.controls.showUnMuteButton();
			}
		}

		/**
		* Listen for events from both the video and the controls
		* @ignore
		*/
		StandardVideoPlayer.prototype.createVideoListeners = function() {
			// Handle events from the controls
			this.controls.addListener(this.controls.PLAY_CLICKED, this.onPlayClicked.bind(this));
			this.controls.addListener(this.controls.PAUSE_CLICKED, this.onPauseClicked.bind(this));
			this.controls.addListener(this.controls.MUTE_CLICKED, this.onMuteClicked.bind(this));
			this.controls.addListener(this.controls.UNMUTE_CLICKED, this.onUnMuteClicked.bind(this));
			this.controls.addListener(this.controls.PROGRESS_CLICKED, this.onProgressClicked.bind(this));
			this.controls.addListener(this.controls.ENTER_FULL_SCREEN_CLICKED, this.onEnterFullScreenClicked.bind(this));
			this.controls.addListener(this.controls.EXIT_FULL_SCREEN_CLICKED, this.onExitFullScreenClicked.bind(this));
			this.controls.addListener(this.controls.HANDLE_MOUSE_DOWN, this.onHandleMouseDown.bind(this));
			this.controls.addListener(this.controls.HANDLE_DRAGGED, this.onHandleDragged.bind(this));
			this.controls.addListener(this.controls.HANDLE_RELEASED, this.onHandleReleased.bind(this));
			this.controls.addListener(this.controls.OVERLAY_HIDDEN, this.onOverlayHidden.bind(this));

			// Handle events from the video player
			this.addListener(this.PLAYER_READY, this.onPlayerReady.bind(this));
			this.addListener(this.VIDEO_PLAYING, this.onVideoPlayStarted.bind(this));
			this.addListener(this.VIDEO_PAUSED, this.onVideoPaused.bind(this));
			this.addListener(this.VIDEO_COMPLETE, this.onVideoComplete.bind(this));
			this.addListener(this.PLAY_PROGRESS, this.onPlaybackProgress.bind(this));
			this.addListener(this.LOAD_PROGRESS, this.onLoadProgress.bind(this));
			this.addListener(this.FULL_SCREEN_ENTER, this.onFullScreenEnter.bind(this));
			this.addListener(this.FULL_SCREEN_EXIT, this.onFullScreenExit.bind(this));
		}

		/**
		* Play the video
		* @ignore
		*/
		StandardVideoPlayer.prototype.onPlayClicked = function(e) {
			this.playVideo();
		}

		/**
		* Pause the video
		* @ignore
		*/
		StandardVideoPlayer.prototype.onPauseClicked = function(e) {
			this.pauseVideo();
		}

		/**
		* Mute audio in the video
		* @ignore
		*/
		StandardVideoPlayer.prototype.onMuteClicked = function(e) {
			this.mute();
		}

		/**
		* Unmute audio in the video
		* @ignore
		*/
		StandardVideoPlayer.prototype.onUnMuteClicked = function(e) {
			this.unMute();
		}

		/**
		* Seek the video to the time corresponding to click position
		* @ignore
		*/
		StandardVideoPlayer.prototype.onProgressClicked = function(e) {
			var percentage = this.controls.getRequestedPercentage();
			this.seekTo(percentage * this.duration);
			this.controls.setProgress(percentage);
		}

		/**
		* Enter full screen mode
		* @ignore
		*/
		StandardVideoPlayer.prototype.onEnterFullScreenClicked = function(e) {
			this.enterFullScreen();
		}

		/**
		* Exit full screen mode
		* @ignore
		*/
		StandardVideoPlayer.prototype.onExitFullScreenClicked = function(e) {
			this.exitFullScreen();
		}

		/**
		* 
		* @ignore
		*/
		StandardVideoPlayer.prototype.onHandleMouseDown = function(e) {
			this.videoWasPlaying = this.videoPlaying;
		}

		/**
		* Do nothing
		* @ignore
		*/
		StandardVideoPlayer.prototype.onHandleDragged = function(e) {
			//
		}

		/**
		* 
		* @ignore
		*/
		StandardVideoPlayer.prototype.onHandleReleased = function(e) {
			var percentage = this.controls.getRequestedPercentage();
			this.pauseVideo();
			this.seekTo(percentage * this.duration);
			this.controls.setProgress(percentage);
			if (this.videoWasPlaying) {
				this.videoWasPlaying = false;
				this.playVideo();
			}
		}

		/**
		* Set the video duration text
		* @ignore
		*/
		StandardVideoPlayer.prototype.onPlayerReady = function(e) {
			this.controls.setDisplayedDuration(this.getDurationText());
		}

		/**
		* Change controls to show the pause icon
		* @ignore
		*/
		StandardVideoPlayer.prototype.onVideoPlayStarted = function(e) {
			this.controls.showPauseButton();
			this.controls.setDisplayedDuration(this.getDurationText());
		}

		/**
		* Change controls to show the play icon
		* @ignore
		*/
		StandardVideoPlayer.prototype.onVideoPaused = function(e) {
			this.controls.showPlayButton();
		}

		/**
		* Change controls to show the play icon
		* @ignore
		*/
		StandardVideoPlayer.prototype.onVideoComplete = function(e) {
			this.controls.showPlayButton();
			this.controls.show();
		}

		/**
		* Update the progress bar to show the updated progress
		* @ignore
		*/
		StandardVideoPlayer.prototype.onPlaybackProgress = function(e) {
			var progress = this.playProgress;
			this.controls.setProgress(progress);
			this.controls.setDisplayedCurrentTime(this.getCurrentTimeText());
		}

		/**
		* Update the progress bar to show the amount loaded
		* @ignore
		*/
		StandardVideoPlayer.prototype.onLoadProgress = function(e) {
			var progress = this.getVideoLoadedFraction();
			this.controls.setLoaded(progress);
		}

		/**
		* Do nothing
		* @ignore
		*/
		StandardVideoPlayer.prototype.onFullScreenEnter = function(e) {
			//
		}

		/**
		* Do nothing
		* @ignore
		*/
		StandardVideoPlayer.prototype.onFullScreenExit = function(e) {
			//
		}

		/**
		* Push the placeholder back in depth, if one exists
		* @ignore
		*/
		StandardVideoPlayer.prototype.onOverlayHidden = function(e) {
			if (this.options.mobileMode && this.__placeholder) {
				this.__placeholder.style.zIndex = -1;
			}
		}

		window.NATION.video.StandardVideoPlayer = StandardVideoPlayer;
	}

}(window, document, undefined));