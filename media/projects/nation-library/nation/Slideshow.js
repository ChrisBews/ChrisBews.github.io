//////////////////////////////////////////////////////////////////////////////
// Nation Library
// Slideshow
// Version 2.2.4
// Dependencies: NATION.EventDispatcher, NATION.Utils, and either NATION.Animation or jQuery
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	if (typeof window.NATION === "undefined") window.NATION = {};

	//////////////////////////
	// Depenency Management
	//////////////////////////
	function checkDependencies() {
		var packageName = "NATION.Slideshow";
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
		*
		* ### About:
		* A JavaScript-powered slideshow.
		*
		* In order to function correctly, the HTML representing each slide should have a classname of either 'js-slide' or 'slide'.
		*
		* If previous/next buttons are required, these should have class 'js-next' and 'js-previous', or 'next' and 'previous'.
		*
		* If captions are required, a container must exist with class 'js-captions' or 'captions'. To define a caption for a slide, include elements with the class 'js-caption' or 'caption' anywhere inside selector. These will be gathered and moved into the .captions element by this class, so it's wise to ensure that caption styles aren't affected by the move into the captions container element.
		*
		* If a current slide display is requird, selector must contain an element with classname 'js-current' or 'current'
		* If a total slides display is required, selector must contain an element with classname 'js-total' or 'total'
		*
		* If clickable pips are required, an element should exist with class 'js-pips' or 'pips'. Each element that represents a single pip should have class 'js-pip' or 'pip'.
		*
		* @class Slideshow
		* @param {domelement} element The element to act as a slideshow, containing one or more children with class 'js-slide' or 'slide'
		* @param {object} options An object contianing the settings for this slideshow<br />
		* <b>autoPlay</b> <i>{boolean: true}</i> If true, the slideshow will automatically cycle (and rotate) through slides
		* <b>slide</b> <i>{boolean: false}</i> When moving through slides, animate them from outside the selector and into view
		* <b>fade</b> <i>{boolean: false}</i> When moving through slides, fade the next one in on top of the previous slide. This mode will be used if the 'slide' option is set to false
		* <b>vertical</b> <i>{boolean: false}</i> If true, slides will move up and down, instead of sideways. This only applies when options.slide has been set to true
		* <b>delay</b> <i>{number: 4000}</i> The time, in milliseconds, to stay on each slide before starting to animate in the next one
		* <b>duration</b> <i>{number: 600}</i> The time, in milliseconds, that a transition between slides takes
		* <b>easing</b> <i>{string: "linear"}</i> The easing function to use when animating between slides
		* <b>useCaptions</b> <i>{boolean: false}</i> Enables the cycling of caption elements alongside the cycling of the slides themselves. Caption elements must have class 'js-caption' or 'caption'
		* <b>pips</b> <i>{boolean: false}</i> Enables the use of clickable pips representing the total number of slides, and the currently active slide
		* <b>touch</b> <i>{boolean: true}</i> Enables the use of swipe gestures to move between slides
		* <b>swipeTolerance</b> <i>{number: 100}</i> The distance a finger must travel before the gesture is regonised as a swipe. Only used if the 'touch' option is set to true
		* @jsFiddle //jsfiddle.net/NationStudio/1vw4jgu7/embedded/
		*/
		var Slideshow = function(selector, options) {
			// Call the super's constructor
			NATION.EventDispatcher.call(this);
			// Store reference to parent selector
			this.__DOMElement = NATION.Utils.getDOMElement(selector);
			// To maintain backward-compatibility and flexibility, class names can skip the .js- convention
			this.__slideElements = this.__DOMElement.querySelectorAll(".js-slide, .slide");
			this.__previousButton = this.__DOMElement.querySelector(".js-previous, .previous");
			this.__nextButton = this.__DOMElement.querySelector(".js-next, .next");
			this.__pipsContainer = this.__DOMElement.querySelector(".js-pips, .pips");
			this.__captionsContainer = this.__DOMElement.querySelector(".js-captions, .captions");
			this.__currentSlideDisplay = this.__DOMElement.querySelector(".js-current", ".current");
			this.__totalSlidesDisplay = this.__DOMElement.querySelector(".js-total", ".total");
			this.__captions = null;
			this.__pips = null;
			this.captionDisplayProp = "block";
			// Required variables
			this.totalSlides = this.__slideElements.length;
			this.activeZIndex = 0;
			this.inactiveZIndex = 0;
			this.currentSlideID = 0;
			this.previousSlideID = 0;
			this.autoCycling = false;
			this.cycleTimer = null;
			this.animating = false;
			this.touchStartX = 0;
			this.touchStartY = 0;
			this.slidesPrepared = false;
			this.loadingImages = [];
			this.slideDisplayDefault = "";
			// Set default option values
			this.options = {
				autoPlay: true,
				slide: false,
				fade: false,
				delay: 4000,
				duration: 600,
				easing: "linear",
				useCaptions: false,
				pips: false,
				touch: true,
				swipeTolerance: 100,
				vertical: false
			};
			// Overwrite defaults with passed option values
			if (options) {
				for (var optionName in options) {
					this.options[optionName] = options[optionName];
				}
			}
			// Use jQuery animation if NATION.Animation doesn't exist
			this.usingjQuery = (typeof NATION.Animation === "undefined" && typeof jQuery !== "undefined");
			// Store a reference to all image assets, to check load progress
			this.loadingImages = this.__DOMElement.querySelectorAll("img");
			// Perform standard setup
			this.setup();
		}

		/**
		* Inherits from NATION.EventDispatcher
		* @ignore
		*/
		Slideshow.prototype = Object.create(NATION.EventDispatcher.prototype);
		Slideshow.prototype.constructor = Slideshow;

		/**
		* An event that fires when the current slide is about to change
		*/
		Slideshow.prototype.SLIDE_CHANGE = "SlideChange";

		/**
		* An event that fires when all images found within the slideshow have loaded
		*/
		Slideshow.prototype.IMAGE_LOAD_COMPLETE = "ImageLoadComplete";

		/**
		* Returns the zero-indexed ID of the currently visible slide
		* @return {number} Returns the zero-indexed ID of the currently visible slide
		*/
		Slideshow.prototype.getCurrentSlideID = function() {
			return this.currentSlideID;
		}

		/**
		* Returns the total number of slides
		* @return {number} The total number of slides
		*/
		Slideshow.prototype.getTotalSlides = function() {
			return this.totalSlides;
		}

		/**
		* Start automatically rotating through images
		*/
		Slideshow.prototype.startAutoCycling = function() {
			this.autoCycling = true;
			this.cycleTimer = setTimeout(this.onCycleTimerTicked.bind(this), this.options.delay);
		}

		/**
		* Stop automatically rotating through images
		*/
		Slideshow.prototype.stopAutoCycling = function() {
			this.autoCycling = false;
			if (this.cycleTimer) {
				clearTimeout(this.cycleTimer);
				this.cycleTimer = null;
			}
		}

		/**
		* Show a slide specified by slideID, either via slide or fade, depending on the slideshow options. This will also stop autoCycling if that was active
		* @param {number} slideID The ID (zero-indexed) of the slide to show
		* @param {boolean} immediate If true, no animation will play, and the slide change will happen immediately
		* @jsFiddle //jsfiddle.net/NationStudio/8odz1pb9/embedded/
		*/
		Slideshow.prototype.showSlide = function(slideID, immediate) {
			this.stopAutoCycling();
			var reverse = (slideID < this.currentSlideID);
			this.showSlideByID(slideID, reverse, immediate);
		}

		/**
		* Show a slide specified by slideID, either via slide or fade, depending on the slideshow options
		* @ignore
		*/
		Slideshow.prototype.showSlideByID = function(slideID, reverse, immediate) {
			if (slideID !== this.currentSlideID && !this.animating) {
				if (!this.slidesPrepared) this.prepareSlides();
				var previousSlideStartValues = {}, nextSlideStartValues = {}, previousSlideEndValues = {}, nextSlideEndValues = {};
				if (!immediate) {
					this.animating = true;
				}				
				if (this.autoCycling && this.cycleTimer) {
					clearTimeout(this.cycleTimer);
					this.cycleTimer = null;
				}
				if (this.options.slide) {
					// If using slide animation, decide on the left position of current and next slides
					if (!this.options.vertical) {
						nextSlideStartValues = (reverse) ? {left: "-100%"} : {left: "100%"};
						nextSlideEndValues = {left: 0};
						previousSlideStartValues = {left: 0};
						previousSlideEndValues = (reverse) ? {left: "100%"} : {left: "-100%"};
					} else {
						nextSlideStartValues = (reverse) ? {top: "-100%"} : {top: "100%"};
						nextSlideEndValues = {top: 0};
						previousSlideStartValues = {top: 0};
						previousSlideEndValues = (reverse) ? {top: "100%"} : {top: "-100%"};
					}
				} else if (this.options.fade) {
					// If using fade animation, decide on the opacity and z-index of current and next slides
					// In the fade transition, the next slide was likely set to display:none after animation
					// So make sure it's set to block here
					nextSlideStartValues = {display: this.slideDisplayDefault, opacity: 0, zIndex: this.activeZIndex};
					previousSlideStartValues = {opacity: 1, zIndex: this.inactiveZIndex};
					nextSlideEndValues = {opacity: 1};
					previousSlideEndValues = {opacity: 1};
				}
				var previousSlide = this.__slideElements[this.currentSlideID];
				var nextSlide = this.__slideElements[slideID];
				if (!immediate) {
					// Animate between slides
					if (!this.usingjQuery) {
						// Animate via the Nation library animation class
						// First position and animate the previous slide
						NATION.Utils.setStyle(previousSlide, previousSlideStartValues);
						NATION.Animation.start(previousSlide, previousSlideEndValues, {duration: this.options.duration, easing: this.options.easing});
						// Position and animate the next slide
						NATION.Utils.setStyle(nextSlide, nextSlideStartValues);
						NATION.Animation.start(nextSlide, nextSlideEndValues, {duration: this.options.duration, easing: this.options.easing}, this.onSlideAnimationComplete.bind(this));
					} else {
						// Animate via jQuery's animate method
						$(previousSlide).stop().css(previousSlideStartValues).animate(previousSlideEndValues, this.options.duration, this.options.easing);
						$(nextSlide).stop().css(nextSlideStartValues).animate(nextSlideEndValues, this.options.duration, this.options.easing, this.onSlideAnimationComplete.bind(this));
					}
				} else {
					// Instantly swap slides
					NATION.Utils.setStyle(previousSlide, previousSlideEndValues);
					NATION.Utils.setStyle(nextSlide, nextSlideEndValues);
					this.onSlideAnimationComplete();
				}
				if (this.options.pips) this.updatePips(this.currentSlideID, slideID);
				// Set the new slide as the current one
				this.previousSlideID = this.currentSlideID;
				this.currentSlideID = slideID;
				if (this.options.useCaptions && this.__captionsContainer) {
					if(!this.usingjQuery) {
						NATION.Animation.start(this.__captionsContainer, {opacity: 0}, {duration: this.options.duration/2, easing: "linear"}, this.onCaptionFadedOut.bind(this));
					} else {
						$(this.__captionsContainer).stop().animate({opacity: 0}, this.options.duration/2, "linear", this.onCaptionFadedOut.bind(this));
					}
				}
				// Show the current slide if the element is present
				if (this.__currentSlideDisplay) {
					this.__currentSlideDisplay.innerHTML = this.currentSlideID + 1;
				}
				this.trigger(this.SLIDE_CHANGE);
			}
		}

		/**
		* Initial slideshow setup
		* @ignore
		*/
		Slideshow.prototype.setup = function() {
			// Default to fading if slide wasn't true
			if (!this.options.slide) this.options.fade = true;
			// If there is more than one slide, set up the slideshow
			if (this.totalSlides > 1) {
				// Prepare the captions, if option has been selected
				if (this.options.useCaptions) this.prepareCaptions();
				// Prepare the pips, if they're required
				if (this.options.pips && this.__pipsContainer) this.preparePips();
				// NOTE: Slide elements are prepared when the first showSlideByID is called.
				// This makes it easier to override the default slide transition method
				// Start auomatically cycling through slides, if this option was true
				if (this.options.autoPlay) this.startAutoCycling();
				// Start listening for user interaction
				this.createListeners();
			} else {
				// Hide navigation if there's only one slide
				if (this.__previousButton) this.__previousButton.style.display = "none";
				if (this.__nextButton) this.__nextButton.style.display = "none";
				// Hide the pips if they exist too
				if (this.options.pips && this.__pipsContainer) this.__pipsContainer.style.display = "none";
			}
			// Show the total number of slides if the element is present
			if (this.__totalSlidesDisplay) {
				this.__totalSlidesDisplay.innerHTML = this.totalSlides;
			}
			// Show the current slide if the element is present
			if (this.__currentSlideDisplay) {
				this.__currentSlideDisplay.innerHTML = this.currentSlideID + 1;
			}
			this.checkImageLoadProgress();
		}

		/**
		* Check if all images in the slideshow have fully loaded
		* @ignore
		*/
		Slideshow.prototype.checkImageLoadProgress = function() {
			var i = 0, length = this.loadingImages.length, loadedImages = 0;
			for (; i < length; i++) {
				if (this.loadingImages[i].complete) {
					loadedImages++;
				}
			}
			if (loadedImages === length) {
				this.trigger(this.IMAGE_LOAD_COMPLETE);
			} else {
				this.imageLoader = setTimeout(this.checkImageLoadProgress.bind(this), 200);
			}
		}

		/**
		* Get the slides into their starting positions
		* @ignore
		*/
		Slideshow.prototype.prepareSlides = function() {
			var i = 0, length = this.__slideElements.length;
			if (this.options.fade) {
				this.slideDisplayDefault = NATION.Utils.getStyle(this.__slideElements[0], "display");
				// If fading, ensure the first slide is layers on top of the others
				this.inactiveZIndex = this.totalSlides;
				for (; i < length; i++) {
					if (i !== this.currentSlideID) {
						this.__slideElements[i].style.zIndex = this.inactiveZIndex;
						this.__slideElements[i].style.opacity = 0;
						if (i !== 0) this.__slideElements[i].style.display = "none";
					}
				}
				this.animating = false;
				// First slide should be highest of all, since it's currently visible
				this.activeZIndex = this.totalSlides + 2;
				this.__slideElements[this.currentSlideID].style.zIndex = this.activeZIndex;
			} else {
				// If sliding between slides, move all but the active one off screen
				for (; i < length; i++) {
					// So long as this isn't the currently active slide, move it off-screen
					if (i !== this.currentSlideID) {
						if (!this.options.vertical) {
							this.__slideElements[i].style.left = "100%";
						} else {
							this.__slideElements[i].style.top = "100%";
						}
					}
				}
				if (!this.options.vertical) {
					this.__slideElements[this.currentSlideID].style.left = 0;
				} else {
					this.__slideElements[this.currentSlideID].style.top = 0;
				}
			}
			this.slidesPrepared = true;
		}

		/**
		* Make sure only the caption matching the current slide is visible
		* @ignore
		*/
		Slideshow.prototype.prepareCaptions = function() {
			if (this.__captionsContainer) {
				this.__captions = this.__DOMElement.querySelectorAll(".js-caption, .caption");
				var i = 0, length = this.__captions.length;
				for (; i < length; i++) {
					this.__captionsContainer.appendChild(this.__captions[i]);
				}
				this.captionDisplayProp = NATION.Utils.getStyle(this.__captions[0], "display");
				i = 0;
				for (; i < length; i++) {
					if (i !== this.currentSlideID) {
						this.__captions[i].style.display = "none";
					} else {
						this.__captions[i].style.display = this.captionDisplayProp;
					}
				}
			}
		}

		/**
		* Ensure the correct number of pips exist to match the number of slides
		* @ignore
		*/
		Slideshow.prototype.preparePips = function() {
			if (this.__pipsContainer) {
				this.__pips = this.__pipsContainer.querySelectorAll(".js-pip, .pip");
				// Can't find any pips with the pip classname, so try using anchors instead
				if (this.__pips.length === 0) {
					this.__pips = this.__pipsContainer.querySelectorAll("a");
				}
				var i = 0, length = this.totalSlides, pip, button;
				if (!this.__pips.length) {
					// Pips need to be created from scratch
					var containerName = this.__pipsContainer.nodeName.toLowerCase();
					var container = this.__pipsContainer;
					if (containerName !== "ul" && containerName !== "ol") {
						// Create a new UL element
						container = document.createElement("ul");
					}
					
					for (; i < length; i++) {
						pip = document.createElement("li");
						pip.className = "js-pip-wrapper";
						button = document.createElement("button");
						button.className = "js-pip";
						pip.appendChild(button);
						container.appendChild(pip);
					}
					// Add the new container to the DOM if a new one was created
					if (containerName !== "ul" && containerName !== "ol") {
						this.__pipsContainer.appendChild(container);
					}
					// Update the pips selector to hold the new pips
					this.__pips = this.__pipsContainer.querySelectorAll(".js-pip, .pip");
				} else if (this.__pips.length < this.totalSlides) {
					// Create additional pips to match the number of slides
					pip = null;
					length = this.totalSlides - this.__pips.length;
					for (; i < length; i++) {
						pip = this.__pipsContainer.children[0].cloneNode(true);
						this.__pipsContainer.appendChild(pip);
					}
				}
				if (this.__pips[0].className.search("active") < 0) this.__pips[0].className += " active";
			}
		}

		/**
		* Listen for user ineraction on slideshow elements
		* @ignore
		*/
		Slideshow.prototype.createListeners = function() {
			if (this.__previousButton) this.__previousButton.addEventListener("click", this.onPreviousClicked.bind(this), false);
			if (this.__nextButton) this.__nextButton.addEventListener("click", this.onNextClicked.bind(this), false);
			if (this.options.pips && this.__pips.length) {
				var i = 0, length = this.__pips.length;
				for (; i < length; i++) {
					this.__pips[i].addEventListener("click", this.onPipClicked.bind(this), false);
				}
			}
			// If touch functionality was enabled in the options
			if (this.options.touch) {
				// Add listeners for touchstart, to detect swipes
				this.__DOMElement.addEventListener("touchstart", this.onTouchStart.bind(this), false);
				this.__DOMElement.addEventListener("pointerdown", this.onTouchStart.bind(this), false);
			}
		}

		/**
		* Change which pip is shown as active
		* @ignore
		*/
		Slideshow.prototype.updatePips = function(previousID, nextID) {
			this.__pips[previousID].className = this.__pips[previousID].className.replace(/ active|active/g, "");
			this.__pips[nextID].className += " active";
		}

		/**
		* Show the next slide automatically
		* @ignore
		*/
		Slideshow.prototype.onCycleTimerTicked = function() {
			this.showNextSlide();
		}

		/**
		* Resume autoplay if it was set in the options
		* @ignore
		*/
		Slideshow.prototype.onSlideAnimationComplete = function(e) {
			// Update the overall animating status
			this.animating = false;
			if (this.options.fade) {
				// Hide the previous slide to enable clicks on the content of the current slide
				if (this.previousSlideID > 0) this.__slideElements[this.previousSlideID].style.display = "none";
			}
			// Continue looping through the slides automaticaly if required
			if (this.autoCycling) {
				this.startAutoCycling();
			}
		}

		/**
		* Swap the captions so that the caption for the current slide is visible
		* Then fade the caption container back in
		* @ignore
		*/
		Slideshow.prototype.onCaptionFadedOut = function(e) {
			this.__captions[this.previousSlideID].style.display = "none";
			this.__captions[this.currentSlideID].style.display = this.captionDisplayProp;
			if (!this.usingjQuery) {
				NATION.Animation.start(this.__captionsContainer, {opacity: 1}, {duration: this.options.duration/2, easing: "linear"});
			} else {
				$(this.__captionsContainer).stop().animate({opacity: 1}, this.options.duration/2, "lienar");
			}
		}

		/**
		* Show the previous slide
		* @ignore
		*/
		Slideshow.prototype.onPreviousClicked = function(e) {
			if (this.autoCycling) this.stopAutoCycling();
			this.showPreviousSlide();
			e.preventDefault();
		}

		/**
		* Show the previous slide (looping around when needed)
		* @ignore
		*/
		Slideshow.prototype.showPreviousSlide = function(e) {
			if (!this.animating) {
				var previousSlideID = this.currentSlideID - 1;
				if (previousSlideID < 0) previousSlideID = this.totalSlides - 1;
				this.showSlideByID(previousSlideID, true);
			}
		}

		/**
		* Show the next slide (looping around when needed)
		* @ignore
		*/
		Slideshow.prototype.showNextSlide = function(e) {
			if (!this.animating) {
				var nextSlideID = this.currentSlideID + 1;
				if (nextSlideID > this.totalSlides-1) nextSlideID = 0;
				this.showSlideByID(nextSlideID, false);
			}
		}

		/**
		* Show the next slide
		* @ignore
		*/
		Slideshow.prototype.onNextClicked = function(e) {
			if (this.autoCycling) this.stopAutoCycling();
			this.showNextSlide();
			e.preventDefault();
		}

		/**
		* Show the slide with an ID matching the clicked pip
		* @ignore
		*/
		Slideshow.prototype.onPipClicked = function(e) {
			if (this.autoCycling) this.stopAutoCycling();
			var i = 0, length = this.__pips.length, index = -1;
			for (; i < length; i++) {
				if (this.__pips[i] === e.currentTarget) {
					index = i;
					break;
				}
			}
			this.showSlideByID(index, (index < this.currentSlideID));
			e.preventDefault();
		}

		/**
		* Store start position of a potential swipe
		* @ignore
		*/
		Slideshow.prototype.onTouchStart = function(e) {
			if (!this.animating) {
				var touches = (typeof e.changedTouches != 'undefined') ? e.changedTouches : [e];
				this.touchStartX = touches[0].pageX;
				this.touchStartY = touches[0].pageY;
				this.handler_TouchEnd = this.onTouchEnd.bind(this);
				document.addEventListener("touchend", this.handler_TouchEnd, false);
				document.addEventListener("pointerup", this.handler_TouchEnd, false);
			}
		}

		/**
		* Check if the user swiped the screen horizontally
		* @ignore
		*/
		Slideshow.prototype.onTouchEnd = function(e) {
			var touches = (typeof e.changedTouches != 'undefined') ? e.changedTouches : [e];
			var endPosX = touches[0].pageX, endPosY = touches[0].pageY, swipe = false;
			if (!this.options.vertical) {
				if (endPosX > this.touchStartX + this.options.swipeTolerance) {
					// Swipe was to the right, show previous slide
					if (this.autoCycling) this.stopAutoCycling();
					this.showPreviousSlide();
				} else if (endPosX < this.touchStartX - this.options.swipeTolerance) {
					if (this.autoCycling) this.stopAutoCycling();
					this.showNextSlide();
				}
			} else {
				if (endPosY > this.touchStartY + this.options.swipeTolerance) {
					if (this.autoCycling) this.stopAutoCycling();
					this.showPreviousSlide();
				} else if (endPosY < this.touchStartY - this.options.swipeTolerance) {
					if (this.autoCycling) this.stopAutoCycling();
					this.showNextSlide();
				}
			}
			// Current gesture has completed, so remove listeners
			document.removeEventListener("touchend", this.handler_TouchEnd, false);
			document.removeEventListener("pointerup", this.handler_TouchEnd, false);
		}

		window.NATION.Slideshow = Slideshow;
	}

}(window, document, undefined));