//////////////////////////////////////////////////////////////////////////////
// Nation Library
// Basic HTML5 Audio Player
// Version 2.0
// Dependencies: NATION.Utils, NATION.EventDispatcher
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	if (typeof window.NATION === "undefined") window.NATION = {};
	if (typeof window.NATION.audio === "undefined") window.NATION.audio = {};

	var loadComplete = false;
	
	function checkDependencies() {
		if (NATION.Utils && NATION.EventDispatcher) {
			_initClass();
			window.removeEventListener("load", checkDependencies, false);
		} else {
			if (loadComplete) {
				throw new Error("NATION.Accordion: Could not find one or more required dependencies.");
			} else {
				loadComplete = true;
				window.addEventListener("load", checkDependencies, false);
			}
		}
	}
	checkDependencies();

	function _initClass() {
		/**
		* ### Dependencies:
		* [NATION.Utils](../Utils.js.html)
		* [NATION.EventDispatcher](../EventDispatcher.js.html)
		*
		* ### About:
		* HTML5 audio player. Can be used with [NATION.MediaControls](../MediaControls.js.html) for custom controls
		*
		* Supports MP3, OGG, and WebM audio file formats, each of which are optional
		*
		* To immediately start an audio file loading, include one of the following data attributes on the element represented by 'selector': data-mpeg, data-ogg, data-webm
		*
		* 
		* @class BasicAudioPlayer
		* @param {domelement_or_querystring_or_jqueryobject} selector The element that contains a .js-player or .player element
		* @param {object} options An object containing the settings for this audio player<br />
		* <b>controls</b> <i>{boolean=true}</i> If true, the browser's default audio controls will be shown
		* <b>autoPlay</b> <i>{boolean=false}</i> If true, the audio will be begin playing as soon as it has started to load. Note that this will not work on mobile devices
		* <b>loop</b> <i>{boolean=false}</i> Loops the audio infinitely if true
		* <b>preload</b> <i>{boolean=false}</i> Start loading the audio file straight away. This doesn't make any difference on mobile devices, where bandwidth is protected. In those cases, the file will not start to download until the user presses the play button
		* @jsFiddle //jsfiddle.net/NationStudio/0apgvbby/embedded/
		*/
		var BasicAudioPlayer = function(selector, options) {
			// Call the super's constructor
			NATION.EventDispatcher.call(this);
			this.__DOMElement = NATION.Utils.getDOMElement(selector);
			this.__playerContainer = this.__DOMElement.querySelector(".js-player, .player");
			if (!this.__playerContainer) {
				throw new Error(this.ERROR_MISSING_ELEMENT.replace("{{className}}", ".js-player"));
			}
			this.options = {
				controls: true,
				autoPlay: false,
				loop: false,
				preload: false
			};
			if (options) {
				for (var optionName in options) {
					this.options[optionName] = options[optionName];
				}
			}
			// Variables
			this.mp3Support = false;
			this.oggSupport = false;
			this.webmSupport = false;
			this.__audio = null;
			this.currentTime = 0;
			this.currentTimeText = "0:00";
			this.duration = 0;
			this.durationText = "0:00";
			this.loadProgress = 0;
			this.audioReady = false;
			this.firstPlayHasHappened = false;
			this.audioPlaying = false;
			this.playProgress = 0;
			this.lastCurrentTime = 0;
			this.previousVolume = 1;

			this.mp3URL = this.__DOMElement.getAttribute("data-mpeg");
			this.oggURL = this.__DOMElement.getAttribute("data-ogg");
			this.webmURL = this.__DOMElement.getAttribute("data-webm");
			this.checkCodecSupport();
			// URL exists, so set up the player immediately
			if (this.mp3URL || this.webmURL || this.oggURL) {
				this.setup();
			}
		}

		BasicAudioPlayer.prototype = Object.create(NATION.EventDispatcher.prototype);
		BasicAudioPlayer.prototype.constructor = BasicAudioPlayer;

		/**
		* Event that fires when the current track is ready to play
		*/
		BasicAudioPlayer.prototype.PLAYER_READY = "PlayerReady";
		/**
		* Event that fires when the audio starts playing
		*/
		BasicAudioPlayer.prototype.AUDIO_PLAYING = "AudioPlaying";
		/**
		* Event that fires when the audio is paused
		*/
		BasicAudioPlayer.prototype.AUDIO_PAUSED = "AudioPaused";
		/**
		* Event that fires when the audio completes
		*/
		BasicAudioPlayer.prototype.AUDIO_COMPLETE = "AutioComplete";
		/**
		* Event that fires when some of the audio file is loaded
		*/
		BasicAudioPlayer.prototype.LOAD_PROGRESS = "LoadProgress";
		/**
		* Event that fires regularly while audio file is playing
		*/
		BasicAudioPlayer.prototype.PLAY_PROGRESS = "PlayProgress";
		/**
		* Event that fires when the audio file's meta data has been loaded
		*/
		BasicAudioPlayer.prototype.META_LOADED = "MetaLoaded";

		/**
		* Check if the current audio file has ever been played
		*
		* Useful for mobile devices where you might want an external play button (which wont work until the audio file has been played using native controls)
		* @return {boolean}
		*/
		BasicAudioPlayer.prototype.getHasPlayTriggered = function() {
			return this.firstPlayHasHappened;
		}

		/**
		* Returns the current play position (in seconds)
		* @return {boolean}
		*/
		BasicAudioPlayer.prototype.getCurrentTime = function() {
			return this.currentTime;
		}

		/**
		* Returns the current progress percentage (0-1)
		* @return {number}
		*/
		BasicAudioPlayer.prototype.getPlayProgress = function() {
			return this.playProgress;
		}

		/**
		* Returns percentage of current audio loaded
		* @return {number}
		*/
		BasicAudioPlayer.prototype.getLoadProgress = function() {
			return this.loadProgress;
		}

		/**
		* Returns duration of current track (in seconds)
		* @return {number}
		*/
		BasicAudioPlayer.prototype.getDuration = function() {
			return this.duration;
		}

		/**
		* Returns string with duration in 0:00:00 format
		* @return {string}
		*/
		BasicAudioPlayer.prototype.getDurationText = function() {
			return this.durationText;
		}

		/**
		* Returns string with current time in 0:00:00 format
		* @return {string}
		*/
		BasicAudioPlayer.prototype.getCurrentTimeText = function() {
			return this.currentTimeText;
		}

		/**
		* Returns whether player can be used yet
		* @return {boolean}
		*/
		BasicAudioPlayer.prototype.isReady = function() {
			return this.audioReady;
		}

		/**
		* Returns if video is currently playing
		* @return {boolean}
		*/
		BasicAudioPlayer.prototype.isPlaying = function() {
			return this.audioPlaying;
		}

		/**
		* Plays the current track
		*/
		BasicAudioPlayer.prototype.play = function() {
			if (!this.audioPlaying) {
				this.audioPlaying = true;
				if (!this.__audio) {
					this.options.autoPlay = true;
					this.setup();
				} else {
					this.__audio.play();
				}
			}
		}

		/**
		* Pauses the current track, if it's playing
		*/
		BasicAudioPlayer.prototype.pause = function() {
			if (this.audioPlaying) {
				this.audioPlaying = false;
				this.__audio.pause();
			}
		}

		/**
		* Mutes the current track
		*/
		BasicAudioPlayer.prototype.mute = function() {
			this.previousVolume = this.__audio.volume;
			this.__audio.volume = 0;
		}

		/**
		* Unmutes the current track
		*/
		BasicAudioPlayer.prototype.unMute = function() {
			this.__audio.volume = this.previousVolume;
		}

		/**
		* Seek audio to position
		* @param {number} time Time, in seconds, to seek to
		*/
		BasicAudioPlayer.prototype.seekTo = function(time) {
			this.__audio.currentTime = time;
		}

		/**
		* Play a new track (stops any currently playing)
		* @param {boolean} autoPlay Start playing the new track immediately
		* @param {object} options Object contianing the settings for the new track<br />
		* <b>mp3URL</b> <i>{string=""}</i> The URL to the mp3 file
		* <b>oggURL</b> <i>{string=""}</i> The URL to the ogg file
		* <b>webmURL</b> <i>{string=""}</i> The URL to the webm audio file
		*/
		BasicAudioPlayer.prototype.playNewTrack = function(autoPlay, options) {
			this.options.autoPlay = autoPlay;
			if (!this.__audio) {
				this.setup();
			}
			this.mp3URL = options.mp3URL;
			this.oggURL = options.oggURL;
			this.webmURL = options.webmURL;
			if (this.mp3Support && this.mp3URL) {
				this.__audio.setAttribute("src", this.mp3URL);
			} else if (this.oggSupport && this.oggURL) {
				this.__audio.setAttribute("src", this.oggURL);
			} else if (this.webmSupport && this.webmURL) {
				this.__audio.setAttribute("src", this.webmURL);
			}
			if (autoPlay) {
				this.play();
			}
		}

		/**
		* Rebuild the player completely
		* This calls remove() and then creates a brand new HTML5 audio player using the last set audio URLs
		*/
		BasicAudioPlayer.prototype.rebuild = function() {
			this.remove();
			this.setup();
		}

		/**
		* Stops audio and removes player from the DOM
		*/
		BasicAudioPlayer.prototype.remove = function() {
			this.pause();
			while (this.__playerContainer.firstChild) {
				this.__playerContainer.removeChild(this.__playerContainer.firstChild);
			}
		}

		/**
		* Error messages
		* @ignore
		*/
		BasicAudioPlayer.prototype.ERROR_MISSING_ELEMENT = "NATION.audio.BasicAudioPlayer: Selector is missing a child with class name '{{className}}'.";


		/**
		* Check which codecs we can use
		* @ignore
		*/
		BasicAudioPlayer.prototype.checkCodecSupport = function() {
			var tempAudio = document.createElement("audio");
			this.mp3Support = !!(tempAudio.canPlayType && tempAudio.canPlayType('audio/mpeg;').replace(/no/, ''));
			this.webmSupport = !!(tempAudio.canPlayType && tempAudio.canPlayType('audio/webm;').replace(/no/, ""));
			this.oggSupport = !!(tempAudio.canPlayType && tempAudio.canPlayType('audio/ogg;').replace(/no/, ''));
		}

		/**
		* Perform initial setup
		* @ignore
		*/
		BasicAudioPlayer.prototype.setup = function() {
			this.createPlayer();
			this.createListeners();
		}

		/**
		* Creates the HTML5 audio element
		* @ignore
		*/
		BasicAudioPlayer.prototype.createPlayer = function() {
			this.firstPlayHasHappened = false;
			this.__audio = document.createElement("audio");
			if (this.options.controls) this.__audio.setAttribute("controls", "");
			if (this.options.autoPlay) this.__audio.setAttribute("autoplay", "");
			if (this.options.preload) this.__audio.setAttribute("preload", "");
			if (this.options.loop) this.__audio.setAttribute("loop", "");
			if (this.mp3Support && this.mp3URL) {
				this.__audio.setAttribute("src", this.mp3URL);
			} else if (this.oggSupport && this.oggURL) {
				this.__audio.setAttribute("src", this.oggURL);
			} else if (this.webmSupport && this.webmURL) {
				this.__audio.setAttribute("src", this.webmURL);
			}
			this.__playerContainer.appendChild(this.__audio);
		}

		/**
		* Listen for audio events
		* @ignore
		*/
		BasicAudioPlayer.prototype.createListeners = function() {
			this.__audio.addEventListener("loadedmetadata", this.onMetaDataLoaded.bind(this));
			this.__audio.addEventListener("canplaythrough", this.onAudioCanPlayThrough.bind(this));
			this.__audio.addEventListener("playing", this.onAudioPlaying.bind(this));
			this.__audio.addEventListener("pause", this.onAudioPaused.bind(this));
			this.__audio.addEventListener("ended", this.onAudioEnded.bind(this));
			this.__audio.addEventListener("progress", this.onAudioLoadProgress.bind(this));
			this.__audio.addEventListener("timeupdate", this.onTimeUpdate.bind(this));
		}

		/**
		* Convert current time to a string
		* @ignore
		*/
		BasicAudioPlayer.prototype.updateCurrentTimeText = function() {
			this.currentTimeText = this.createTimeString(this.currentTime);
		}

		/**
		* Convert duration to a string
		* @ignore
		*/
		BasicAudioPlayer.prototype.updateDurationText = function() {
			this.durationText = this.createTimeString(this.duration);
		}

		/**
		* Create a time string in format 00:00:00
		* @ignore
		*/
		BasicAudioPlayer.prototype.createTimeString = function(time) {
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
		BasicAudioPlayer.prototype.updateLoadProgress = function() {
			if (this.__audio.buffered.length && this.duration) {
				var loadedStart = this.__audio.buffered.start(0);
				var loadedEnd = this.__audio.buffered.end(0);
				var progress = loadedEnd / this.duration;
				if (this.loadProgress !== progress) {
					this.loadProgress = progress;
					this.trigger(this.LOAD_PROGRESS);
				}
			}
		}

		/**
		* Get duration of audio track
		* @ignore
		*/
		BasicAudioPlayer.prototype.onMetaDataLoaded = function() {
			this.duration = Math.floor(this.__audio.duration);
			this.updateDurationText();
			this.trigger(this.META_LOADED);
		}

		/**
		* Audio has buffered enough to start playing
		* @ignore
		*/
		BasicAudioPlayer.prototype.onAudioCanPlayThrough = function(e) {
			this.audioReady = true;
			this.trigger(this.PLAYER_READY);
		}

		/**
		* Signal that audio has started playing
		* @ignore
		*/
		BasicAudioPlayer.prototype.onAudioPlaying = function(e) {
			this.firstPlayHasHappened = true;
			this.audioPlaying = true;
			this.trigger(this.AUDIO_PLAYING);
		}

		/**
		* Signal that audio has paused
		* @ignore
		*/
		BasicAudioPlayer.prototype.onAudioPaused = function(e) {
			this.audioPlaying = false;
			this.trigger(this.AUDIO_PAUSED);
		}

		/**
		* Signal that audio track is complete
		* @ignore
		*/
		BasicAudioPlayer.prototype.onAudioEnded = function(e) {
			this.audioPlaying = false;
			if (!this.options.loop) {
				this.__audio.currentTime = 0;
				this.__audio.pause();
			}
			this.trigger(this.AUDIO_COMPLETE);
		}

		/**
		* Update load progress
		* @ignore
		*/
		BasicAudioPlayer.prototype.onAudioLoadProgress = function(e) {
			if (this.loadProgress < 1) this.updateLoadProgress();
		}

		/**
		* Get new current time
		* @ignore
		*/
		BasicAudioPlayer.prototype.onTimeUpdate = function(e) {
			if (this.lastCurrentTime !== this.__audio.currentTime && this.duration > 0) {
				this.currentTime = this.__audio.currentTime;
				var progress = this.currentTime / this.duration;
				this.lastCurrentTime = this.currentTime;
				if (progress !== this.playProgress) {
					this.playProgress = progress;
					this.trigger(this.PLAY_PROGRESS);
				}
				// Sometimes currentTime is undefined in IE
				if (this.currentTime && this.duration > 0) {
					this.updateCurrentTimeText();
				}
				if (this.loadProgress < 1) this.updateLoadProgress();
			}
		}

		window.NATION.audio.BasicAudioPlayer = BasicAudioPlayer;
	}

}(window, document, undefined));