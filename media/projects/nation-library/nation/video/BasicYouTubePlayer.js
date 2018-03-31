//////////////////////////////////////////////////////////////////////////////
// Nation Library
// Barebones YouTube Video Player
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
		var packageName = "NATION.video.BasicYouTubePlayer";
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
		* Basic YouTube video player without custom controls
		*
		* To immediately initiate a video, use the data attribute 'data-video' on the selector, and set this to the YouTube video's URL
		*
		* API has been structured to allow this class to be interchangeable with the BasicVideoPlayer
		*
		* Can be used with NATION.MediaControls to create a full player
		*
		* @class BasicYouTubePlayer
		* @param {domelement_or_querystring_or_jqueryobject} selector The element containing the .js-player or .player element within which the video will be created
		* @param {object} options Object containing the settings for this video player
		* <b>controls</b> <i>{boolean: false}</i> If true, the browser's default controls will be shown
		* <b>autoPlay</b> <i>{boolean: false}</i> If true, the video will automatically start playing as soon as enough data has been downloaded
		* <b>preventInit</b> <i>{boolean: false}</i> If true, the YouTube video will not actually be created until playVideo is called
		* <b>loop</b> <i>{boolean: false}</i> Video will infinitely loop if this is true
		* <b>mute</b> <i>{boolean: false}</i> If true, the video will be muted by default
		* <b>mobileMode</b> <i>{boolean: false}</i> If true, the browser's default controls will always show, and the video will not attempt to autoplay
		* @jsFiddle //jsfiddle.net/NationStudio/nLrn0a0s/embedded/
		*/
		var BasicYouTubePlayer = function(selector, options) {
			// Call the super's constructor
			NATION.EventDispatcher.call(this);
			this.__DOMElement = NATION.Utils.getDOMElement(selector);
			this.__playerContainer = this.__DOMElement.querySelector(".js-player, .player");
			if (!this.__playerContainer) {
				throw new Error(this.ERROR_MISSING_ELEMENT.replace("{{className}}", ".js-player"));
			}
			// Variables
			this.API_URL = "//www.youtube.com/iframe_api",
			this.options = {
				controls: true,
				autoPlay: false,
				preventInit: false,
				loop: false,
				mute: false,
				mobileMode: false
			};
			this.videoID = "";
			this.player = null;
			this.apiLoading = false;
			this.apiLoadTimer = null;
			this.playRequested = false;
			this.pauseRequested = false;
			this.playProgress = 0;
			this.currentTime = 0;
			this.currentTimeMS = 0;
			this.currentTimeText = "0:00";
			this.duration = 0;
			this.durationMS = 0;
			this.durationText = "0:00";
			this.loadTimer = null;
			this.loadProgress = 0;
			this.videoPlaying = false;
			this.firstPlayHasHappened = false;
			this.fullScreenActive = false;
			this.muted = false;
			this.playTimer = null;
			this.hasSetup = false;
			this.touchDevice = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
			if (options) {
				for (var optionName in options) {
					this.options[optionName] = options[optionName];
				}
			}
			if (this.options.mobileMode) {
				this.options.controls = true;
				this.options.autoPlay = false;
			}
			this.videoURLs = [this.__DOMElement.getAttribute("data-video")];
			if (!this.options.preventInit && this.videoURLs[0]) {
				this.setup();
			}
		}

		BasicYouTubePlayer.prototype = Object.create(NATION.EventDispatcher.prototype);
		BasicYouTubePlayer.prototype.constructor = BasicYouTubePlayer;

		/**
		* Event that's fired when the video can be played
		*/
		BasicYouTubePlayer.prototype.PLAYER_READY = "PlayerReady";
		/**
		* Event that's fired when the video has started playing
		*/
		BasicYouTubePlayer.prototype.VIDEO_PLAYING = "VideoPlaying";
		/**
		* Event that's fired when the video has been paused
		*/
		BasicYouTubePlayer.prototype.VIDEO_PAUSED = "VideoPaused";
		/**
		* Event that fires when the video reaches the end and stops playing
		*/
		BasicYouTubePlayer.prototype.VIDEO_COMPLETE = "VideoComplete";
		/**
		* Event that's fired each time the video's current time changes
		*/
		BasicYouTubePlayer.prototype.PLAY_PROGRESS = "PlayProgress";
		/**
		* Event that's fired each time video data has been downloaded
		*/
		BasicYouTubePlayer.prototype.LOAD_PROGRESS = "LoadProgress";
		/**
		* Event that's fired when the player enters full screen mode
		*/
		BasicYouTubePlayer.prototype.FULL_SCREEN_ENTER = "FullScreenEnter";
		/**
		* Event that's fired when the player exits full screen mode
		*/
		BasicYouTubePlayer.prototype.FULL_SCREEN_EXIT = "FullScreenExit";

		/**
		* Play, or resume playing, the video
		*/
		BasicYouTubePlayer.prototype.playVideo = function() {
			if (this.player && this.player.playVideo) {
				if (this.touchDevice) {
					if (this.player && this.firstPlayHasHappened) {
						this.player.playVideo();
					}
				} else {
					this.player.playVideo();
				}
			} else {
				this.playRequested = true;
				if (!this.hasSetup) {
					this.setup();
				}
			}
		}

		/**
		* Pause the video
		*/
		BasicYouTubePlayer.prototype.pauseVideo = function() {
			if (this.player && this.player.pauseVideo) {
				if (this.touchDevice) {
					if (this.firstPlayHasHappened) this.pauseVideo();
				} else {
					this.player.pauseVideo();
				}
			} else {
				this.pauseRequested = true;
			}
			this.stopLoadTimer();
		}

		/**
		* Mute the video's sound
		*/
		BasicYouTubePlayer.prototype.mute = function() {
			if (!this.muted) {
				this.muted = true;
				if (this.player) this.player.mute();
			}
		}

		/**
		* Unmute the video's sound
		*/
		BasicYouTubePlayer.prototype.unMute = function() {
			if (this.muted) {
				this.muted = false;
				if (this.player) this.player.unMute();
			}
		}

		/**
		* Seek video to a position
		* @param (number) time Time to seek the current video to (in seconds)
		*/
		BasicYouTubePlayer.prototype.seekTo = function(time) {
			this.seekingToTime = Math.floor(time);
			if (this.player && this.player.seekTo) {
				this.player.seekTo(time);
			}
		}

		/**
		* Returns current play position (in seconds)
		* @param {number} milliseconds If true, this method returns the current time in milliseconds
		*/
		BasicYouTubePlayer.prototype.getCurrentTime = function(milliseconds) {
			return (milliseconds) ? this.currentTimeMS : this.currentTime;
		}

		/**
		* Returns current progress percentage between 0 and 1
		*/
		BasicYouTubePlayer.prototype.getPlayProgress = function() {
			return Math.floor(this.playProgress * 100) / 100;
		}

		/**
		* Returns percentage of current video loaded between 0 and 1
		*/
		BasicYouTubePlayer.prototype.getVideoLoadedFraction = function() {
			return this.player.getVideoLoadedFraction();
		}

		/**
		* Returns duration of current video (in seconds)
		* @param {number} milliseconds If true, this method returns the duration in milliseconds
		*/
		BasicYouTubePlayer.prototype.getDuration = function() {
			return (milliseconds) ? this.durationMS : this.duration;
		}

		/**
		* Returns string with duration of video in 0:00:00 format
		*/
		BasicYouTubePlayer.prototype.getDurationText = function() {
			return this.durationText;
		}

		/**
		* Returns string with current time in 0:00:00 format
		*/
		BasicYouTubePlayer.prototype.getCurrentTimeText = function() {
			return this.currentTimeText;
		}

		/**
		* Returns whether player can be used yet
		*/
		BasicYouTubePlayer.prototype.isReady = function() {
			return this.playerReadyState;
		}

		/**
		* Returns if video is currently playing
		*/
		BasicYouTubePlayer.prototype.isPlaying = function() {
			return this.videoPlaying;
		}

		/**
		* Enters full screen mode
		*/
		BasicYouTubePlayer.prototype.enterFullScreen = function() {
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
		BasicYouTubePlayer.prototype.exitFullScreen = function() {
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
		BasicYouTubePlayer.prototype.playNewVideo = function(autoPlay, videoURL) {
			this.getVideoID(videoURL);
			this.playRequested = this.pauseRequested = false;
			if (!this.player || !this.player.playVideo) {
				this.options.autoPlay = autoPlay;
				if (!this.apiLoading) {
					this.apiLoading = true;
					this.loadAPI();
					this.createListeners();
				} else {
					this.playRequested = true;
				}
			} else {
				if (this.touchDevice && !this.firstPlayHasHappened) {
					this.player.cueVideoById(this.videoID);
				} else if (!this.touchDevice || (this.touchDevice && this.firstPlayHasHappened)) {
					this.player.loadVideoById(this.videoID);
				}
			}
		}

		/**
		** Returns true if this video has started playing yet. This is useful for mobile devices on data connections
		* @return {boolean} True if video has started playing previously
		*/
		BasicYouTubePlayer.prototype.getHasPlayTriggered = function() {
			return this.firstPlayHasHappened;
		}

		/**
		* Rebuild the YouTube player
		*/
		BasicYouTubePlayer.prototype.rebuild = function() {
			this.stopLoadTimer();
			this.stopPlayTimer();
			this.videoURL = videoURL;
			this.getVideoID(videoURL);
			this.options.autoPlay = autoPlay;
			this.player = null;
			this.apiLoading = true;
			this.firstPlayHasHappened = false;
			if (typeof YT === "undefined") {
				this.loadAPI();
			} else {
				this.createPlayer();
			}
		}

		/**
		* Destroy the player completely
		*/
		BasicYouTubePlayer.prototype.remove = function() {
			if (typeof swfobject !== "undefined") swfobject.removeSWF("youtube-video");
			window.onPlayerStateChange = function() {};
			if (this.player && this.player.stopVideo) this.player.stopVideo();
			this.__DOMElement.querySelector(".player").innerHTML = "";
		}

		/**
		* Error messages
		* @ignore
		*/
		BasicYouTubePlayer.prototype.ERROR_MISSING_ELEMENT = "NATION.video.BasicYouTubePlayer: Selector is missing a child with class name '{{className}}'.";
		BasicYouTubePlayer.prototype.ERROR_INVALID_URL = "NATION.video.BasicYouTubePlayer: Passed video URL is not a valid YouTube URL. URL was = '{{url}}'.";
		BasicYouTubePlayer.prototype.ERROR_FAILED_API_LOAD = "NATION.video.BasicYouTubePlayer: YouTube API load error. Status: '{{status}}', statusText: '{{statusText}}'.";

		/**
		* Initial setup
		* @ignore
		*/
		BasicYouTubePlayer.prototype.setup = function() {
			this.hasSetup = true;
			this.getVideoID(this.videoURLs[0])
			this.loadAPI();
			this.createListeners();
		}

		/**
		* Parse the ID for the YoUTube video from the passed URL
		* @ignore
		*/
		BasicYouTubePlayer.prototype.getVideoID = function(url) {
			var startIndex = -1, endIndex = 0;
			if (url.search("youtube.com") > -1) {
				startIndex = parseInt(url.search("v=")) + 2;
			} else if (url.search("youtu.be/") > -1) {
				startIndex = parseInt(url.search("youtu.be/"), 10) + 9;
			} else {
				this.videoID = "";
				throw new Error(this.ERROR_INVALID_URL.replace("{{url}}", url));
			}
			// If URL was valid, start index won't be -1
			if (startIndex > -1) {
				if (url.search("&") > -1) {
					endIndex = url.search("&");
				} else if (url.search("#") > -1) {
					endIndex = url.search("#");
				} else {
					endIndex = url.length;
				}
				this.videoID = url.substr(startIndex, (endIndex - startIndex));
			}
		}

		/**
		* Load YouTube API
		* @ignore
		*/
		BasicYouTubePlayer.prototype.loadAPI = function() {
			// url: this.API_URL + "?host=" + window.location.host,
			if (!document.documentElement.querySelectorAll("#youtube-api").length) {
				NATION.Utils.ajax({
					url: this.API_URL,
					dataType: "script",
					id: "youtube-api",
					success: this.onAPILoaded.bind(this),
					error: this.onAPILoadError.bind(this)
				});
			} else {
				this.onAPILoaded();
			}
		}

		/**
		* Create the player now that the API is loaded
		* @ignore
		*/
		BasicYouTubePlayer.prototype.onAPILoaded = function(data) {
			this.apiLoading = true;
			this.createPlayer();
		}

		/**
		* Inform the author of an error
		* @ignore
		*/
		BasicYouTubePlayer.prototype.onAPILoadError = function(status, statusText) {
			throw new Error(this.ERROR_FAILED_API_LOAD.replace("{{status}}", status).replace("{{statusText}}", statusText));
		}

		/**
		* Wait for player object to exist before creation
		* @ignore
		*/
		BasicYouTubePlayer.prototype.createPlayer = function() {
			if (typeof YT !== "undefined") {
				if (YT.Player) {
					this.player = new YT.Player(this.__playerContainer, {
						width: "100%",
						height: "100%",
						videoId: this.videoID,
						playerVars: {
							playlist: this.videoID,
							controls: (this.options.controls) ? 1 : 0,
							modestBranding: 1,
							showinfo: 0,
							origin: document.domain,
							rel: 0,
							disablekb: 0,
							enablejsapi: 1,
							wmode: "opaque",
							autoplay: (this.options.autoPlay) ? 1 : 0,
							loop: (this.options.loop) ? 1 : 0,
							iv_load_policy: (this.options.annotations) ? 1 : 3
						},
						events: {
							"onReady": this.onPlayerReady.bind(this),
							"onStateChange": this.onPlayerStateChange.bind(this),
							"onError": this.onVideoError.bind(this)
						}
					});
				} else {
					// Make sure the player object exists before continuing
					this.recheckAPILoad();
				}
			} else {
				// Make sure the player object exists before continuing
				this.recheckAPILoad();
			}
		}

		/**
		* Make sure the player object exists before continuing
		* @ignore
		*/
		BasicYouTubePlayer.prototype.recheckAPILoad = function() {
			if (this.apiLoadTimer) {
				clearTimeout(this.apiLoadTimer);
			}
			this.apiLoadTimer = setTimeout(this.createPlayer.bind(this), 300);
		}

		/**
		* Listen for full screen enter/exit
		* @ignore
		*/
		BasicYouTubePlayer.prototype.createListeners = function() {
			var fullScreenEventNames = ["fullscreenchange", "msfullscreenchange", "webkitfullscreenchange", "mozfullscreenchange"];
			for (var i in fullScreenEventNames) {
				document.addEventListener(fullScreenEventNames[i], this.onFullScreenChange.bind(this));
			}
		}

		/**
		* Loop that runs during playback
		* @ignore
		*/
		BasicYouTubePlayer.prototype.startPlayTimer = function() {
			// Update duration
			this.duration = Math.floor(this.player.getDuration());
			this.updateDurationTimeText();
			if (this.playTimer) clearInterval(this.playTimer);
			this.playTimer = setInterval(this.onPlayProgress.bind(this), 20);
		}

		/**
		* Stop look that runs during playback
		* @ignore
		*/
		BasicYouTubePlayer.prototype.stopPlayTimer = function() {
			if (this.playTimer) {
				clearInterval(this.playTimer);
				this.playTimer = null;
			}
		}

		/**
		* Loop that runs during load
		* @ignore
		*/
		BasicYouTubePlayer.prototype.startLoadTimer = function() {
			if (this.loadTimer) clearInterval(this.loadTimer);
			this.loadTimer = setInterval(this.onLoadProgress.bind(this), 200);
		}

		/**
		* Stop updating load progress
		* @ignore
		*/
		BasicYouTubePlayer.prototype.stopLoadTimer = function() {
			if (this.loadTimer) {
				clearInterval(this.loadTimer);
				this.loadTimer = null;
			}
		}

		/**
		* Convert current time to a formatted string
		* @ignore
		*/
		BasicYouTubePlayer.prototype.updateCurrentTimeText = function() {
			this.currentTimeText = this.createTimeString(this.currentTime);
		}

		/**
		* Convert duration to a formatted string
		* @ignore
		*/
		BasicYouTubePlayer.prototype.updateDurationTimeText = function() {
			this.durationText = this.createTimeString(this.duration);
		}

		/**
		* Create a time string in format 0:00:00
		* @ignore
		*/
		BasicYouTubePlayer.prototype.createTimeString = function(time) {
			if (!time) time = 0;
			if (time === 0) {
				return "0:00";
			}
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
		* Update time and progress displayed
		* @ignore
		*/
		BasicYouTubePlayer.prototype.onPlayProgress = function() {
			// Work out the current time as a string
			this.currentTimeMS = this.player.getCurrentTime() * 1000;
			this.currentTime = Math.floor(this.player.getCurrentTime());
			this.updateCurrentTimeText();
			// Work out the duration as a string (just to ensure it's up to date)
			this.durationMS = this.player.getDuration() * 1000;
			this.duration = Math.floor(this.player.getDuration());
			this.updateDurationTimeText();
			var progress = 0;
			// Keep progress reports up to date while seeking
			if (this.seekingToTime > 0) {
				progress = this.seekingToTime / this.duration;
			} else {
				progress = this.currentTime / this.duration;
			}
			if (progress !== this.playProgress) {
				this.playProgress = progress;
				this.trigger(this.PLAY_PROGRESS);
			}

		}

		/**
		* Update current load percentage
		* @ignore
		*/
		BasicYouTubePlayer.prototype.onLoadProgress = function() {
			var progress = this.player.getVideoLoadedFraction();
			if (progress !== this.loadProgress) {
				this.loadProgress = progress;
				this.trigger(this.LOAD_PROGRESS);
			}
		}

		/**
		* PLayer is ready if the playVideo method is exposed
		* @ignore
		*/
		BasicYouTubePlayer.prototype.onPlayerReady = function() {
			if (this.player.playVideo) {
				this.onPlayerReadyToPlay();
			} else {
				// Keep checking until the play method is ready
				if (this.apiLoadTimer) {
					clearTimeout(this.apiLoadTimer);
				}
				this.apiLoadTimer = setTimeout(this.onPlayerReady.bind(this), 20);
			}
		}

		/**
		* Player is now PROPERLY ready to go
		* @ignore
		*/
		BasicYouTubePlayer.prototype.onPlayerReadyToPlay = function() {
			this.playerReadyState = true;
			this.startLoadTimer();
			if (this.playRequested && !this.pauseRequested) {
				this.playRequested = false;
				this.playVideo();
			}
			this.durationMS = this.player.getDuration() * 1000;
			this.duration = Math.floor(this.player.getDuration());
			this.updateDurationTimeText();
			this.trigger(this.PLAYER_READY);
		}

		/**
		* Handle state changes
		* @ignore
		*/
		BasicYouTubePlayer.prototype.onPlayerStateChange = function(e) {
			if (e.data === YT.PlayerState.ENDED) {
				this.playProgress = 1;
				this.videoPlaying = false;
				this.stopPlayTimer();
				this.trigger(this.PLAY_PROGRESS);
				this.trigger(this.VIDEO_COMPLETE);
			} else if (e.data === YT.PlayerState.PLAYING) {
				this.videoPlaying = true;
				this.firstPlayHasHappened = true;
				this.startPlayTimer();
				if (this.options.mute) this.mute();
				this.trigger(this.VIDEO_PLAYING);
			} else if (e.data === YT.PlayerState.PAUSED) {
				this.stopPlayTimer();
				this.videoPlaying = false;
				this.trigger(this.VIDEO_PAUSED);
			}
		}

		/**
		* Error with video playback, show it in the console
		* @ignore
		*/
		BasicYouTubePlayer.prototype.onVideoError = function(e) {
			if (window && window.console) console.dir(e);
		}

		/**
		* Adjust styles according to current full screen mode
		* @ignore
		*/
		BasicYouTubePlayer.prototype.onFullScreenChange = function() {
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

		window.NATION.video.BasicYouTubePlayer = BasicYouTubePlayer;
	}

}(window, document, undefined));