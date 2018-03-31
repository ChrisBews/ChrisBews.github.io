//////////////////////////////////////////////////////////////////////////////
// Nation Library
// Video and Audio Player Controls
// Version 2.1.3
// Dependencies: NATION.EventDispatcher, NATION.Utils
// Optional Depencendies: NATION.ProgressBar, either NATION.Animation or jQuery
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
		var packageName = "NATION.MediaControls";
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
		* [NATION.Utils](Utils.js.html)
		* [NATION.EventDispatcher](EventDispatcher.js.html)
		* Either [NATION.Animation](Animation.js.html) or jQuery
		* Optional [NATION.ProgressBar](ProgressBar.js.html) if a progress bar is required
		*
		* ### About:
		* Controls for use with audio and video players. Has support for play/pause button, mute button, progress bar, full screen button, current time display, duration display, and a play/pause area over a video
		*
		* Each button is optional. The class will look for elements within selector and enable them if it finds them. Below are the classnames to use for each feature:
		* * .js-play-button or .play-button for the play/pause toggle
		* * .js-progress-bar or .progress-bar for the draggable progress bar
		* * .js-video-overlay or .video-overlay for the large transparent play/pause button that sits over the video
		* * .js-mute-button or .mute-button for the mute/unmute toggle
		* * .js-full-screen-button or .full-screen-button for the enter/exit full screen toggle
		* * .js-current-time or .current-time for the element that will contain the current video play time
		* * .js-duration or .duration for the element that will contain the full length of the video
		*
		* @class MediaControls
		* @param {domelement_or_querystring_or_jqueryobject} selector The element that wraps the controls HTML
		* @param {object} options Object containing the settings for the controls<br />
		* <b>fade</b> <i>boolean:false</i> If set to true, the controls will show and hide via a simple fade
		* <b>slide</b> <i>boolean:false</i> If set to true, the controls will show and hide by sliding into view from the bottom. This requires selector to have a style of overflow:hidden
		* <b>delay</b> <i>number: 1000</i> The length of idle mouse time to wait before hiding the controls
		* <b>duration</b> <i>number: 300</i> The length of time a fade of hide animation takes to play
		* <b>easing</b> <i>string: "linear"</i> The easing function to use during a show or hide of the controls
		* <b>mobileMode</b> <i>boolean: false</i> If true, controls functionality will not be enabled, except for the large play button that covers a video. When clicked, this button will be hidden so that default controls can be accessed
		* <b>handlePositioning</b> <i>string: "outside"</i> This is an option for the progress bar. "inside" keeps the handle within it's progress bar, whereas "outside" considers the handle to be positioned about it's center, and will allow it to poke out the left and right sides of the progress bar
		* @jsFiddle //jsfiddle.net/NationStudio/fpv3feex/embedded/
		*/
		var MediaControls = function(selector, options) {
			// Call the super's constructor
			NATION.EventDispatcher.call(this);
			this.__DOMElement = NATION.Utils.getDOMElement(selector);
			// Prioritise the Nation Animation lib if it exists
			this.jQueryMode = (typeof jQuery !== "undefined" && typeof NATION.Animation === "undefined");
			this.options = {
				fade: false,
				slide: false,
				delay: 3000,
				duration: 300,
				easing: "linear",
				mobileMode: false,
				handlePositioning: "outside"
			};
			if (options) {
				for (var optionName in options) {
					this.options[optionName] = options[optionName];
				}
			}
			this.__controls = this.__DOMElement.querySelector(".js-controls, .controls");
			if (!this.__controls) {
				throw new Error (this.ERROR_MISSING_ELEMENT.replace("{{className}}", ".js-controls"));
			}
			this.__progressBar = this.__DOMElement.querySelector(".js-progress-bar, .progress-bar");
			this.__playButton = this.__DOMElement.querySelector(".js-play-button, .play-button");
			this.__videoOverlay = this.__DOMElement.querySelector(".js-video-overlay, .video-overlay");
			this.__muteButton = this.__DOMElement.querySelector(".js-mute-button, .mute-button");
			this.__fullScreenButton = this.__DOMElement.querySelector(".js-full-screen-button, .full-screen-button");
			this.__currentTimeDisplay = this.__DOMElement.querySelector(".js-current-time, .current-time");
			this.__durationDisplay = this.__DOMElement.querySelector(".js-duration, .duration");
			this.controlsTimer = null;
			this.listeningForMouseMove = false;
			this.controlsShowing = true;
			this.resizeTimer = null;
			this.height = 0;
			this.lastMouseY = 0;
			this.playActive = 0;
			if (!this.options.slide && !this.options.fade) {
				this.options.fade = true;
			}
			if (this.__progressBar) {
				this.createProgressBar();
			}
			if (!this.options.mobileMode) {
				this.createListeners();
			} else {
				this.__controls.style.display = "none";
				this.createMobileListeners();
			}
			this.resize();
		}

		MediaControls.prototype = Object.create(NATION.EventDispatcher.prototype);
		MediaControls.prototype.constructor = MediaControls;

		/**
		* Event that fires when the play button has been clicked
		*/
		MediaControls.prototype.PLAY_CLICKED = "PlayClicked";
		/**
		* Event that fires when the pause button has been clicked
		*/
		MediaControls.prototype.PAUSE_CLICKED = "PauseClicked";
		/**
		* Event that fires when the mute button has been clicked
		*/
		MediaControls.prototype.MUTE_CLICKED = "MuteClicked";
		/**
		* Event that fires when the unmute button has been clicked
		*/
		MediaControls.prototype.UNMUTE_CLICKED = "UnMuteClicked";
		/**
		* Event that fires when the progress bar has been clicked
		*/
		MediaControls.prototype.PROGRESS_CLICKED = "ProgressClicked";
		/**
		* Event that fires when the 'enter full screen' button has been clicked
		*/
		MediaControls.prototype.ENTER_FULL_SCREEN_CLICKED = "EnterFullScreenClicked";
		/**
		* Event that fires when the 'exit full screen' button has been clicked
		*/
		MediaControls.prototype.EXIT_FULL_SCREEN_CLICKED = "ExitFullScreenClicked";
		/**
		* Event that fires when the user has pressed down on the handle and is about to start dragging
		*/
		MediaControls.prototype.HANDLE_MOUSE_DOWN = "HandleMouseDown";
		/**
		* Event that is fired each time the user moves their mouse horizontally while clicked down on the handle
		*/
		MediaControls.prototype.HANDLE_DRAGGED = "HandleDragged";
		/**
		* Event that fires when the handle has been released by the user
		*/
		MediaControls.prototype.HANDLE_RELEASED = "HandleReleased";
		/**
		* Event that fires when the large play button over the video has been hidden (mobileMode only)
		*/
		MediaControls.prototype.OVERLAY_HIDDEN = "OverlayHidden";

		/**
		* Set play progress percentage
		* @param {number} percentage Percentage to set progress bar to, between 0 and 1
		*/
		MediaControls.prototype.setProgress = function(percentage) {
			if (this.progressBar && !this.progressBar.getHandleDragInProgress()) {
				this.progressBar.setProgress(percentage);
			}
		}

		/**
		* Set the string shown in the .js-duration/.duration element (if one exists)
		* @param {string} timeString This can be any string at all, which will be shown as the media duration
		*/
		MediaControls.prototype.setDisplayedDuration = function(timeString) {
			if (this.__durationDisplay) {
				this.__durationDisplay.innerHTML = timeString;
			}
		}

		/**
		* Set the string shown in the .js-current-time/.current-time element (if one exists)
		* @param {string} timeString This can be any string at all, which will be shown as the media's current timestamp
		*/
		MediaControls.prototype.setDisplayedCurrentTime = function(timeString) {
			if (this.__currentTimeDisplay) {
				this.__currentTimeDisplay.innerHTML = timeString;
			}
		}

		/**
		* Set the percentage loaded
		* @param {number} percentage Percentage between 0 and 1
		* @param {boolean} adjustHitArea Match clickable hitarea to loaded bar
		*/
		MediaControls.prototype.setLoaded = function(percentage, adjustHitArea) {
			if (this.progressBar) {
				this.progressBar.setLoaded(percentage, adjustHitArea);
			}
		}

		/**
		* Returns the percentage the user wants to scan to, between 0 and 1
		* @return {number} A percentage between 0 and 1
		*/
		MediaControls.prototype.getRequestedPercentage = function() {
			if (this.progressBar) {
				return this.progressBar.getRequestedPercentage();
			} else {
				return 0;
			}
		}

		/**
		* Returns whether controls are currently visible or not
		* @return {boolean} Returns true if controls are visible
		*/
		MediaControls.prototype.getControlsShowing = function() {
			return this.controlsShowing;
		}

		/**
		* Switches play button to 'not currently playing' state
		*/
		MediaControls.prototype.showPlayButton = function() {
			this.playActive = false;
			this.startHideTimer();
			if (this.__playButton.className.search("active") >= 0) {
				this.__playButton.className = this.__playButton.className.replace(/ active|active/g, "");
			}
			if (this.__videoOverlay) {
				if (this.__videoOverlay.className.search("active") >= 0) {
					this.__videoOverlay.className = this.__videoOverlay.className.replace(/ active|active/g, "");
				}
			}
		}

		/**
		* Switches play button to 'currently playing' state
		*/
		MediaControls.prototype.showPauseButton = function() {
			this.playActive = true;
			this.startHideTimer();
			if (this.__playButton.className.search("active") < 0) {
				this.__playButton.className += " active";
			}
			if (this.__videoOverlay) {
				if (this.__videoOverlay.className.search("active") < 0) {
					this.__videoOverlay.className += " active";
				}
			}
		}

		/**
		* Show the controls
		*/
		MediaControls.prototype.show = function() {
			this.controlsShowing = true;
			if (!this.jQueryMode) {
				if (this.options.fade) {
					NATION.Animation.start(this.__controls, {opacity: 1}, {duration: this.options.duration, easing: this.options.easing});
				} else if (this.options.slide) {
					NATION.Animation.start(this.__controls, {bottom: 0}, {duration: this.options.duration, easing: this.options.easing});
				} else {
					this.__controls.style.display = "block";
				}
			} else {
				if (this.options.fade) {
					$(this.__controls).stop().fadeIn({duration: this.options.duration, easing: this.options.easing});
				} else if (this.options.slide) {
					$(this.__controls).stop().animate({bottom: 0}, this.options.duration, this.options.easing);
				} else {
					this.__controls.style.display = "block";
				}
			}
		}

		/**
		* Hide the controls
		*/
		MediaControls.prototype.hide = function() {
			this.controlsShowing = false;
			if (!this.jQueryMode) {
				if (this.options.fade) {
					NATION.Animation.start(this.__controls, {opacity: 0}, {duration: this.options.duration, easing: this.options.easing});
				} else if (this.options.slide) {
					NATION.Animation.start(this.__controls, {bottom: -this.height}, {duration: this.options.duration, easing: this.options.easing});
				} else {
					this.__controls.style.display = "none";
				}
			} else {
				if (this.options.fade) {
					$(this.__controls).stop().fadeOut({duration: this.options.duration, easing: this.options.easing});
				} else if (this.options.slide) {
					$(this.__controls).stop().stop().animate({bottom: -this.height}, this.options.duration, this.options.easing);
				} else {
					this.__controls.style.display = "none";
				}
			}
		}

		/**
		* Start the automatic hiding of controls after a period of idle mouse movement
		*/
		MediaControls.prototype.startAutoHiding = function() {
			this.startHideTimer();
		}

		/**
		* Shows large play button that sits over the video
		*/
		MediaControls.prototype.showLargePlayButton = function() {
			if (this.__videoOverlay) {
				this.__videoOverlay.style.display = "block";
			}
		}

		/**
		* Hides the large play button. This means users can click directly on the YouTube video
		*/
		MediaControls.prototype.hideLargePlayButton = function() {
			if (this.__videoOverlay) {
				this.__videoOverlay.style.display = "none";
			}
		}

		/**
		* Show the mute button (ie. the sound is currently on)
		*/
		MediaControls.prototype.showMuteButton = function() {
			var classes = this.__muteButton.className;
			if (classes.search("active") >= 0) {
				classes = classes.replace(/ active|active/g, "");
			}
			this.__muteButton.className = classes;
		}

		/**
		* Show the unmute button (ie. the sound is currently off)
		*/
		MediaControls.prototype.showUnMuteButton = function() {
			var classes = this.__muteButton.className;
			if (classes.search("active") < 0) {
				classes += " active";
			}
			this.__muteButton.className = classes;
		}

		/**
		* Error messages
		* @ignore
		*/
		MediaControls.prototype.ERROR_MISSING_ELEMENT = "NATION.video.Controls: Selector is missing a child with class name '{{className}}'.";

		/**
		* Creates the progress bar from NATION.ProgressBar
		* @ignore
		*/
		MediaControls.prototype.createProgressBar = function() {
			this.progressBar = new NATION.ProgressBar(this.__progressBar, this.options.handlePositioning);
		}

		/**
		* Listen for user interaction
		* @ignore
		*/
		MediaControls.prototype.createListeners = function() {
			this.__playButton.addEventListener("click", this.onPlayButtonClicked.bind(this));
			if (this.__videoOverlay) {
				this.__videoOverlay.addEventListener("click", this.onPlayButtonClicked.bind(this));
			}
			if (this.__muteButton) {
				this.__muteButton.addEventListener("click", this.onMuteButtonClicked.bind(this));
			}
			if (this.__fullScreenButton) {
				this.__fullScreenButton.addEventListener("click", this.onFullScreenButtonClicked.bind(this));
				var fullScreenEventNames = ["fullscreenchange", "msfullscreenchange", "webkitfullscreenchange", "mozfullscreenchange"];
				for (var i in fullScreenEventNames) {
					document.addEventListener(fullScreenEventNames[i], this.onFullScreenChange.bind(this));
				}
			}
			if (this.options.slide || this.options.fade) {
				this.__controls.addEventListener("mouseleave", this.onMouseLeave.bind(this));
			}
			if (this.progressBar) {
				this.progressBar.addListener(this.progressBar.CLICKED, this.onProgressBarClicked.bind(this));
				this.progressBar.addListener(this.progressBar.HANDLE_MOUSE_DOWN, this.onHandleMouseDown.bind(this));
				this.progressBar.addListener(this.progressBar.HANDLE_RELEASED, this.onHandleReleased.bind(this));
				this.progressBar.addListener(this.progressBar.HANDLE_DRAGGED, this.onHandleDragged.bind(this));
			}
			window.addEventListener("resize", this.onWindowResized.bind(this));
		}

		/**
		* Hide the placeholder element on first touch
		* @ignore
		*/
		MediaControls.prototype.createMobileListeners = function() {
			if (this.__videoOverlay) {
				this.__videoOverlay.addEventListener("click", this.onMobileOverlayClicked.bind(this));
			}
		}

		/**
		* Auto-hide controls if requested
		* @ignore
		*/
		MediaControls.prototype.startHideTimer = function() {
			if (this.options.slide || this.options.fade) {
				if (!this.listeningForMouseMove) {
					this.__DOMElement.addEventListener("mousemove", this.onMouseMoved.bind(this));
					this.listeningForMouseMove = true;
				}
				this.restartTimer();
			}
		}

		/**
		* Keep checking mouse position to hide controls
		* @ignore
		*/
		MediaControls.prototype.restartTimer = function() {
			if (this.controlsTimer) {
				clearTimeout(this.controlsTimer);
			}
			this.controlsTimer = setTimeout(this.onControlsTimerTicked.bind(this), this.options.delay);
		}

		/**
		* Start dragging handle
		* @ignore
		*/
		MediaControls.prototype.setNewHandlePosition = function(xPos) {
			this.progressBar.setNewHandlePosition(xPos);
		}

		/**
		* Signal that the user has pressed down on the handle
		* @ignore
		*/
		MediaControls.prototype.onHandleMouseDown = function() {
			this.trigger(this.HANDLE_MOUSE_DOWN);
		}

		/**
		* Signal that the user has dragged the handle
		* @ignore
		*/
		MediaControls.prototype.onHandleDragged = function(e) {
			this.trigger(this.HANDLE_DRAGGED);
		}

		/**
		* Signal the user has stopped dragging the handle
		* @ignore
		*/
		MediaControls.prototype.onHandleReleased = function(e) {
			this.trigger(this.HANDLE_RELEASED);
		}

		/**
		* Reset controls hide timer and re-show controls if needed
		* @ignore
		*/
		MediaControls.prototype.onMouseMoved = function(e) {
			if (this.hideTimer) {
				clearTimeout(this.hideTimer);
				this.hideTimer = null;
			}
			var newY = e.pageY - NATION.Utils.getOffset(this.__DOMElement).top;
			var playerHeight = this.__DOMElement.offsetHeight;
			if (newY !== this.lastMouseY && !this.controlsShowing && newY < playerHeight && newY > 0) {
				this.show();
			}
			this.lastMouseY = newY;
			this.restartTimer();
		}

		/**
		* Change co-ords to something outside the container
		* @ignore
		*/
		MediaControls.prototype.onMouseLeave = function(e) {
			if (this.playActive) {
				var newY = e.pageY - NATION.Utils.getOffset(this.__DOMElement).top;
				this.lastMouseY = newY;
				if (this.hideTimer) clearTimeout(this.hideTimer);
				this.hideTimer = setTimeout(this.hide.bind(this), this.options.delay);
			}
		}

		/**
		* Switch states and signal click
		* @ignore
		*/
		MediaControls.prototype.onPlayButtonClicked = function(e) {
			var playButtonClasses = this.__playButton.className;
			var largePlayButtonClasses = "";
			if (this.__videoOverlay) largePlayButtonClasses = this.__videoOverlay.className;
			if (playButtonClasses.search("active") >= 0) {
				playButtonClasses = playButtonClasses.replace(/ active|active/g, "");
				if (this.__videoOverlay) largePlayButtonClasses = largePlayButtonClasses.replace(/ active|active/g, "");
				if (this.controlsTimer) clearTimeout(this.controlsTimer);
				this.playActive = false;
				this.onPaused();
				this.show();
				this.trigger(this.PAUSE_CLICKED);
			} else {
				playButtonClasses += " active";
				if (this.__videoOverlay) largePlayButtonClasses += " active";
				if (this.options.fade || this.options.slide) {
					this.startHideTimer();
				}
				this.playActive = true;
				this.trigger(this.PLAY_CLICKED);
			}
			this.__playButton.className = playButtonClasses;
			this.show();
			if (this.__videoOverlay) this.__videoOverlay.className = largePlayButtonClasses;
			e.stopPropagation();
			e.preventDefault();
		}

		/**
		* Switch states and signal click
		* @ignore
		*/
		MediaControls.prototype.onMuteButtonClicked = function(e) {
			var classes = this.__muteButton.className;
			if (classes.search("active") >= 0) {
				classes = classes.replace(/ active|active/g, "");
				this.trigger(this.UNMUTE_CLICKED);
			} else {
				classes += " active";
				this.trigger(this.MUTE_CLICKED);
			}
			this.__muteButton.className = classes;
			e.stopPropagation();
			e.preventDefault();
		}

		/**
		* Switch states and signal click
		* @ignore
		*/
		MediaControls.prototype.onFullScreenButtonClicked = function(e) {
			var classes = this.__fullScreenButton.className;
			if (classes.search("active") >= 0) {
				classes = classes.replace(/ active|active/g, "");
				this.trigger(this.EXIT_FULL_SCREEN_CLICKED);
			} else {
				classes += " active";
				this.trigger(this.ENTER_FULL_SCREEN_CLICKED);
			}
			this.__fullScreenButton.className = classes;
			e.stopPropagation();
			e.preventDefault();
		}

		/**
		* Signal a click has occurred
		* @ignore
		*/
		MediaControls.prototype.onProgressBarClicked = function(e) {
			this.trigger(this.PROGRESS_CLICKED);
		}

		/**
		* Hide the controls, since the delay duration has passed without a mouse move
		* @ignore
		*/
		MediaControls.prototype.onControlsTimerTicked = function(e) {
			if (!this.progressBar.getHandleDragInProgress() && this.playActive && this.controlsShowing && this.lastMouseY < (this.__DOMElement.offsetHeight - this.__controls.offsetHeight)) {
				if (this.controlsTimer) clearTimeout(this.controlsTimer);
				this.hide();
			}
		}

		/**
		* Stop hiding controls if video isn't playing
		* @ignore
		*/
		MediaControls.prototype.onPaused = function(e) {
			this.playActive = false;
			if (this.controlsTimer) clearTimeout(this.controlsTimer);
			this.listeningForMouseMove = false;
			if (this.handler_MouseMove) {
				this.__DOMElement.removeEventListener("mousemove", this.handler_MouseMove);
			}

		}

		/**
		* Hide overlay so user can play video on mobiles
		* @ignore
		*/
		MediaControls.prototype.onMobileOverlayClicked = function(e) {
			this.__DOMElement.style.display = "none";
			this.trigger(this.OVERLAY_HIDDEN);
			e.stopPropagation();
			e.preventDefault();
		}

		/**
		* Update the height of the controls
		* @ignore
		*/
		MediaControls.prototype.resize = function(e) {
			if (this.resizeTimer) {
				clearTimeout(this.resizeTimer);
				this.resizeTimer = null;
			}
			this.height = this.__controls.clientHeight;
		}

		/**
		* Resize on a timer
		* @ignore
		*/
		MediaControls.prototype.onWindowResized = function(e) {
			if (!this.resizeTimer) {
				this.resizeTimer = setTimeout(this.resize.bind(this), 20);
			}
		}

		/**
		* This helps keep the full screen button up to date if the escape key is pressed when in full screen
		* @ignore
		*/
		MediaControls.prototype.onFullScreenChange = function(e) {
			var fullScreenElement = document.fullscreenElement || document.msFullscreenElement || document.webkitFullscreenElement || document.webkitCurrentFullScreenElement || document.mozFullScreenElement;
			if (!fullScreenElement) {
				var classes = this.__fullScreenButton.className;
				// Just exited full screen, remove the active class from the full screen button
				if (classes.search("active")) {
					classes = classes.replace(/ active|active/g, "");
					this.__fullScreenButton.className = classes;
				}
			}
		}

		window.NATION.MediaControls = MediaControls;
	}

}(window, document, undefined));