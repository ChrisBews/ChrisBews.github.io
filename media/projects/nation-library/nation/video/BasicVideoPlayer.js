//////////////////////////////////////////////////////////////////////////////
// Nation Library
// Barebones HTML5 Video Player
// Version 2.1.4
// Dependencies: NATION.EventDispatcher, NATION.Utils
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	if (typeof window.NATION === "undefined") window.NATION = {};
	if (typeof window.NATION.video === "undefined") window.NATION.video = {};

	//////////////////////////
	// Depenency Management
	//////////////////////////
	function checkDependencies() {
		var packageName = "NATION.video.BasicVideoPlayer";
		var dependencies = {
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
		*
		* ### About:
		* Basic HTML5 video player without custom controls
		*
		* Supports h264, webM, and ogg video formats
		*
		* API has been structured to allow this class to be interchangeable with the BasicYouTubePlayer
		*
		* Can be used with NATION.MediaControls to create a full player
		*
		* @class BasicVideoPlayer
		* @param {domelement_or_querystring_or_jqueryobject} selector The element containing the .js-player or .player element within which the video will be created
		* @param {object} options Object containing the settings for this video player
		* <b>controls</b> <i>{boolean: false}</i> If true, the browser's default controls will be shown
		* <b>autoPlay</b> <i>{boolean: false}</i> If true, the video will automatically start playing as soon as enough data has been downloaded
		* <b>loop</b> <i>{boolean: false}</i> Video will infinitely loop if this is true
		* <b>mute</b> <i>{boolean: false}</i> If true, the video will be muted by default
		* <b>preload</b> <i>{boolean: false}</i> If true, the 'preload' attribute will be set on the created video tag. Usually on desktop this will work, but mobile browsers intentionally ignore this to protec the user's data
		* <b>mobileMode</b> <i>{boolean: false}</i> If true, the browser's default controls will always show, and the video will not attempt to autoplay
		* <b>poster</b> <i>{string: ""}</i> The URL to the poster image to display at the start of the video
		* @jsFiddle //jsfiddle.net/NationStudio/j9xr3av6/embedded/
		*/
		var BasicVideoPlayer = function(selector, options) {
			// Call the super's constructor
			NATION.EventDispatcher.call(this);
			this.__DOMElement = NATION.Utils.getDOMElement(selector);
			this.__playerContainer = this.__DOMElement.querySelector(".js-player, .player");
			if (!this.__playerContainer) {
				throw new Error(this.ERROR_MISSING_ELEMENT.replace("{{className}}", ".js-player"));
			}
			// Variables
			this.options = {
				controls: false,
				autoPlay: false,
				loop: false,
				mute: false,
				preload: false,
				mobileMode: false,
				poster: ""
			};
			this.webmSupport = false;
			this.h264Support = false;
			this.oggSupport = false;
			this.firstPlayHasHappened = false;
			this.__video = null;
			this.currentTime = 0;
			this.currentTimeMS = 0;
			this.currentTimeText = "";
			this.duration = 0;
			this.durationMS = 0;
			this.durationText = "";
			this.videoReady = false;
			this.videoPlaying = false;
			this.loadProgress = 0;
			this.lastCurrentTime = 0;
			this.playProgress = 0;
			this.fullScreenActive = false;
			this.previousVolume = 1;
			if (options) {
				for (var optionName in options) {
					this.options[optionName] = options[optionName];
				}
			}
			if (this.options.mobileMode) {
				this.options.controls = true;
				this.options.autoPlay = false;
			}
			this.checkCodecSupport();
			this.h264URLs = [];
			var firstH264URL = this.__DOMElement.getAttribute("data-video");
			if (firstH264URL) {
				this.h264URLs.push(firstH264URL);
			}
			this.webmURLs = [];
			var firstWebmURL = this.__DOMElement.getAttribute("data-webm");
			if (firstWebmURL) {
				this.webmURLs.push(firstWebmURL);
			}
			this.oggURLs = [];
			var firstOGGURL = this.__DOMElement.getAttribute("data-ogg");
			if (firstOGGURL) {
				this.oggURLs.push(firstOGGURL);
			}
			if (this.h264URLs[0] || this.webmURLs[0] || this.oggURLs[0]) {
				// Set up the player immediately
				this.setup();
			}
		}

		BasicVideoPlayer.prototype = Object.create(NATION.EventDispatcher.prototype);
		BasicVideoPlayer.prototype.constructor = BasicVideoPlayer;

		/**
		* Event that's fired when the video can be played
		*/
		BasicVideoPlayer.prototype.PLAYER_READY = "PlayerReady";
		/**
		* Event that's fired when the video has started playing
		*/
		BasicVideoPlayer.prototype.VIDEO_PLAYING = "VideoPlaying";
		/**
		* Event that's fired when the video has been paused
		*/
		BasicVideoPlayer.prototype.VIDEO_PAUSED = "VideoPaused";
		/**
		* Event that fires when the video reaches the end and stops playing
		*/
		BasicVideoPlayer.prototype.VIDEO_COMPLETE = "VideoComplete";
		/**
		* Event that's fired each time the video's current time changes
		*/
		BasicVideoPlayer.prototype.PLAY_PROGRESS = "PlayProgress";
		/**
		* Event that's fired each time video data has been downloaded
		*/
		BasicVideoPlayer.prototype.LOAD_PROGRESS = "LoadProgress";
		/**
		* Event that's fired when the player enters full screen mode
		*/
		BasicVideoPlayer.prototype.FULL_SCREEN_ENTER = "FullScreenEnter";
		/**
		* Event that's fired when the player exits full screen mode
		*/
		BasicVideoPlayer.prototype.FULL_SCREEN_EXIT = "FullScreenExit";

		/**
		* Play, or resume playing, the video
		*/
		BasicVideoPlayer.prototype.playVideo = function() {
			if (!this.videoPlaying) {
				this.videoPlaying = true;
				this.__video.play();
			}
		}

		/**
		* Pause the video
		*/
		BasicVideoPlayer.prototype.pauseVideo = function() {
			if (this.videoPlaying) {
				this.videoPlaying = false;
				this.__video.pause();
			}
		}

		/**
		* Mute the video's sound
		*/
		BasicVideoPlayer.prototype.mute = function() {
			this.previousVolume = this.__video.volume;
			this.__video.volume = 0;
		}

		/**
		* Unmute the video's sound
		*/
		BasicVideoPlayer.prototype.unMute = function() {
			if (this.previousVolume > 0) {
				this.__video.volume = this.previousVolume;
			} else {
				this.__video.volume = 1;
			}
		}

		/**
		* Seek video to a position
		* @param {number} time Time to seek the current video to (in seconds)
		*/
		BasicVideoPlayer.prototype.seekTo = function(time) {
			this.__video.currentTime = this.currentTime = time;
		}

		/**
		* Returns current play position (in seconds)
		* @param {number} milliseconds If true, this method returns the current time in milliseconds
		*/
		BasicVideoPlayer.prototype.getCurrentTime = function(milliseconds) {
			return (milliseconds) ? this.currentTimeMS : this.currentTime;
		}

		/**
		* Returns current progress percentage between 0 and 1
		*/
		BasicVideoPlayer.prototype.getPlayProgress = function() {
			return this.playProgress;
		}

		/**
		* Returns percentage of current video loaded between 0 and 1
		*/
		BasicVideoPlayer.prototype.getVideoLoadedFraction = function() {
			return this.loadProgress;
		}

		/**
		* Returns duration of current video (in seconds)
		* @param {number} milliseconds If true, this method returns the duration in milliseconds
		*/
		BasicVideoPlayer.prototype.getDuration = function(milliseconds) {
			return (milliseconds) ? this.durationMS : this.duration;
		}

		/**
		* Returns string with duration of video in 0:00:00 format
		*/
		BasicVideoPlayer.prototype.getDurationText = function() {
			return this.durationText;
		}

		/**
		* Returns string with current time in 0:00:00 format
		*/
		BasicVideoPlayer.prototype.getCurrentTimeText = function() {
			return this.currentTimeText;
		}

		/**
		* Returns whether player can be used yet
		*/
		BasicVideoPlayer.prototype.isReady = function() {
			return this.videoReady;
		}

		/**
		* Returns if video is currently playing
		*/
		BasicVideoPlayer.prototype.isPlaying = function() {
			return this.videoPlaying;
		}

		/**
		* Enters full screen mode
		*/
		BasicVideoPlayer.prototype.enterFullScreen = function() {
			this.fullScreenActive = true;
			if (this.__DOMElement.requestFullscreen) {
				this.__DOMElement.requestFullscreen();
			} else if (this.__DOMElement.webkitRequestFullScreen) {
				this.__DOMElement.webkitRequestFullScreen();
			} else if (this.__DOMElement.mozRequestFullScreen) {
				this.__DOMElement.mozRequestFullScreen();
			} else if (this.__DOMElement.msRequestFullscreen) {
				this.__DOMElement.msRequestFullscreen();
			}
		}

		/**
		* Exits full screen mode
		*/
		BasicVideoPlayer.prototype.exitFullScreen = function() {
			this.fullScreenActive = false;
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			} else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if (document.msExitFullscreen) {
				document.msExitFullscreen();
			}
		}

		/**
		* Play a new video (stops any currently playing)
		*/
		BasicVideoPlayer.prototype.playNewVideo = function(autoPlay, videoURL, webmURL, oggURL) {
			this.pauseVideo();
			this.videoReady = false;
			this.h264URLs = [videoURL];
			this.webmURLs = [webmURL];
			this.oggURLs = [oggURL];
			if (autoPlay) {
				this.__video.setAttribute("autoplay", "");
			}
			this.changeElementVideoURL();
			this.updateCurrentTimeText();
			this.updateDurationTimeText();
		}

		/**
		* Returns true if this video has started playing yet. This is useful for mobile devices on data connections
		* @return {boolean} True if video has started playing previously
		*/
		BasicVideoPlayer.prototype.getHasPlayTriggered = function() {
			return this.firstPlayHasHappened;
		}

		/**
		* Rebuild the player completely, stopping the current video and removing it from the DOM
		*/
		BasicVideoPlayer.prototype.rebuild = function(autoPlay, videoURL, webmURL, oggURL) {
			this.remove();
			this.h264URLs = [videoURL];
			this.webmURLs = [webmURL];
			this.oggURLs = [oggURL];
			this.createPlayer();
		}

		/**
		* Remove player from DOM
		*/
		BasicVideoPlayer.prototype.remove = function() {
			this.pauseVideo();
			while (this.__playerContainer.firstChild) {
				this.__playerContainer.removeChild(this.__playerContainer.firstChild);
			}
		}

		/**
		* Error messages
		* @ignore
		*/
		BasicVideoPlayer.prototype.ERROR_MISSING_ELEMENT = "NATION.video.BasicVideoPlayer: Selector is missing a child with class name '{{className}}'.";

		/**
		* Set up the player and listen for events
		* @ignore
		*/
		BasicVideoPlayer.prototype.setup = function() {
			this.createPlayer();
			this.createListeners();
			this.updateCurrentTimeText();
			this.updateDurationTimeText();
		}

		/**
		* Figure out which codecs we can use
		* @ignore
		*/
		BasicVideoPlayer.prototype.checkCodecSupport = function() {
			var tempVideo = document.createElement("video");
			this.webmSupport = !!(tempVideo.canPlayType && tempVideo.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/no/, ''));
			this.h264Support = !!(tempVideo.canPlayType && tempVideo.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, ''));
			this.oggSupport = !!(tempVideo.canPlayType && tempVideo.canPlayType('video/ogg; codecs="theora"').replace(/no/, ''));
		}

		/**
		* Create the video element
		* @ignore
		*/
		BasicVideoPlayer.prototype.createPlayer = function() {
			this.__video = document.createElement("video");
			// Set attributes on the player element as per the current options object
			if (this.options.controls) this.__video.setAttribute("controls", "");
			if (this.options.autoPlay) this.__video.setAttribute("autoplay", "");
			if (this.options.preload) this.__video.setAttribute("preload", "");
			if (this.options.loop) this.__video.setAttribute("loop", "");
			if (this.options.mute) this.__video.setAttribute("muted", "");
			if (this.options.poster) this.__video.setAttribute("poster", this.options.poster);
			this.changeElementVideoURL();
			this.__playerContainer.appendChild(this.__video);
			// Ensures the video mutes in IE9 correctly
			if (this.options.mute) {
				this.__video.volume = 0;
			}
		}

		/**
		* Change the URL currently set on the video element in the DOM
		* @ignore
		*/
		BasicVideoPlayer.prototype.changeElementVideoURL = function() {
			if (this.webmSupport && this.webmURLs[0]) {
				// Use webm video
				this.__video.setAttribute("src", this.webmURLs[0]);
			} else if (this.h264Support && this.h264URLs[0]) {
				// Use h264 video
				this.__video.setAttribute("src", this.h264URLs[0]);
			} else if (this.oggSupport && this.oggURLs[0]) {
				// Use ogg video
				this.__video.setAttribute("src", this.oggURLs[0]);
			}
		}

		/**
		* Listen for video playback events
		* @ignore
		*/
		BasicVideoPlayer.prototype.createListeners = function() {
			this.__video.addEventListener("loadedmetadata", this.onMetaDataLoaded.bind(this));
			this.__video.addEventListener("canplaythrough", this.onVideoCanPlayThrough.bind(this));
			this.__video.addEventListener("playing", this.onVideoPlaying.bind(this));
			this.__video.addEventListener("pause", this.onVideoPaused.bind(this));
			this.__video.addEventListener("ended", this.onVideoEnded.bind(this));
			this.__video.addEventListener("progress", this.onVideoLoadProgress.bind(this));
			this.__video.addEventListener("timeupdate", this.onTimeUpdate.bind(this));
			var fullScreenEventNames = ["fullscreenchange", "msfullscreenchange", "webkitfullscreenchange", "mozfullscreenchange"];
			for (var i in fullScreenEventNames) {
				document.addEventListener(fullScreenEventNames[i], this.onFullScreenChange.bind(this));
			}
		}

		/**
		* Convert current time to a formatted string
		* @ignore
		*/
		BasicVideoPlayer.prototype.updateCurrentTimeText = function() {
			this.currentTimeText = this.createTimeString(this.currentTime);
		}

		/**
		* Convert duration to a formatted string
		* @ignore
		*/
		BasicVideoPlayer.prototype.updateDurationTimeText = function() {
			this.durationText = this.createTimeString(this.duration);
		}

		/**
		* Create a time string in format 0:00:00
		* @ignore
		*/
		BasicVideoPlayer.prototype.createTimeString = function(time) {
			if (!time) time = 0;
			var hours, minutes, seconds, timeString = "";
			hours = Math.floor(time / 1440);
			time = time % 1440;
			minutes = Math.floor(time / 60);
			seconds = Math.floor(time % 60);
			if (hours > 0) {
				// Show an hour display
				timeString += hours + ":";
			}
			if (minutes > 0) {
				// Add a leading zero for minutes < 10
				if (hours > 0 && minutes < 10) {
					timeString += "0";
				}
				timeString += minutes + ":";
			} else {
				if (hours > 0) {
					timeString += "00:";
				} else {
					timeString += "0:";
				}
			}
			if (seconds > 0) {
				// Add a leading zero tfor seconds < 10
				if (seconds < 10) {
					timeString += "0" + seconds;
				} else {
					timeString += seconds;
				}
			} else {
				timeString += "00";
			}
			return timeString;
		}

		/**
		* Update percentage loaded
		* @ignore
		*/
		BasicVideoPlayer.prototype.updateLoadProgress = function() {
			if (this.__video.buffered.length && this.duration) {
				var loadStart = this.__video.buffered.start(0);
				var loadEnd = this.__video.buffered.end(0);
				var progress = loadEnd / this.__video.duration;
				if (this.loadProgress !== progress) {
					this.loadProgress = progress;
					this.trigger(this.LOAD_PROGRESS);
				}
			}
		}

		/**
		* Get the duration of video from the meta data
		* @ignore
		*/
		BasicVideoPlayer.prototype.onMetaDataLoaded = function() {
			this.durationMS = this.__video.duration * 1000;
			this.duration = Math.floor(this.__video.duration);
			this.updateDurationTimeText();
		}

		/**
		* Signal that the video has buffered enough to start playing
		* @ignore
		*/
		BasicVideoPlayer.prototype.onVideoCanPlayThrough = function() {
			if (!this.videoReady) {
				this.videoReady = true;
				this.trigger(this.PLAYER_READY);
			}
		}

		/**
		* Video has started playing
		* @ignore
		*/
		BasicVideoPlayer.prototype.onVideoPlaying = function() {
			this.firstPlayHasHappened = true;
			this.videoPlaying = true;
			this.trigger(this.VIDEO_PLAYING);
		}

		/**
		* Video has paused
		* @ignore
		*/
		BasicVideoPlayer.prototype.onVideoPaused = function() {
			this.videoPlaying = false;
			this.trigger(this.VIDEO_PAUSED);
		}

		/**
		* Video has finished playing
		* @ignore
		*/
		BasicVideoPlayer.prototype.onVideoEnded = function() {
			this.videoPlaying = false;
			this.trigger(this.VIDEO_COMPLETE);
		}

		/**
		* Update load progress
		* @ignore
		*/
		BasicVideoPlayer.prototype.onVideoLoadProgress = function() {
			if (this.loadProgress < 1) {
				this.updateLoadProgress();
			}
		}

		/**
		* Get new current time 
		* @ignore
		*/
		BasicVideoPlayer.prototype.onTimeUpdate = function() {
			if (this.__video.currentTime && this.lastCurrentTime !== this.__video.currentTime && this.duration > 0) {
				this.currentTimeMS = this.__video.currentTime * 1000;
				this.currentTime = Math.floor(this.__video.currentTime);
				var progress = this.__video.currentTime / this.__video.duration;
				this.lastCurrentTime = this.__video.currentTime;
				if (progress !== this.playProgress) {
					this.playProgress = progress;
					this.trigger(this.PLAY_PROGRESS);
				}
			}
			// Sometimes currentTime is undefined in IE, so make sure it's valid first
			if (this.currentTime && this.duration > 0) {
				this.updateCurrentTimeText();
			}
			if (this.loadProgress < 1) this.updateLoadProgress();
		}

		/**
		* Adjust styles according to current full screen mode
		* @ignore
		*/
		BasicVideoPlayer.prototype.onFullScreenChange = function() {
			var fullScreenElement = document.fullscreenElement || document.msFullscreenElement || document.webkitFullscreenElement || document.webkitCurrentFullScreenElement || document.mozFullScreenElement;
			if (!fullScreenElement) {
				// Just exited full screen, remove 100% width/height styles
				this.fullScreenActive = false;
				this.__DOMElement.style.removeProperty("width");
				this.__DOMElement.style.removeProperty("height");
				this.trigger(this.FULL_SCREEN_EXIT);
			} else {
				// Just entered full screen, add 100% width/height styles so video fills screen
				this.fullScreenActive = true;
				this.__DOMElement.style.width = "100%";
				this.__DOMElement.style.height = "100%";
				this.trigger(this.FULL_SCREEN_ENTER);
			}
		}

		window.NATION.video.BasicVideoPlayer = BasicVideoPlayer;
	}

}(window, document, undefined));