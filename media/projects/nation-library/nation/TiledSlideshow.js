//////////////////////////////////////////////////////////////////////////////
// Nation Library
// Tiled Slideshow
// Version 2.1.0
// Dependencies: NATION.Utils, NATION.EventDispatcher
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	if (typeof window.NATION === "undefined") window.NATION = {};

	var loadComplete = false;

	function checkDependencies() {
		var packageName = "NATION.VerticalScrollbar";
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

	function _initClass() {
		/**
		* ### Dependencies:
		* [NATION.Utils](Utils.js.html)
		* [NATION.EventDispatcher](EventDispatcher.js.html)
		*
		* ### About:
		* Carousel that shows slides in groups, with the number depending on the current styles
		* The selector must contain one or more elements with class ".js-slide"/".slide", as these are considered the individual slide elements
		* The selector may also contain navigation, in the form of elements with class "js-next"/"next" and "js-previous"/"previous". This functionality is handled automatically if these are found
		* 
		* The direct parent of the slide elements will be sized and postioned automatically to hold all slides in one row. Somewhere above this you will want an element with a width set, and overflow set to hidden, to hide the 'out of view' slides
		*
		* Built to work with responsive styles, so the number of slides visible at once can be changed via CSS
		* 
		* @class TiledSlideshow
		* @param {domelement_or_querystring_or_jqueryobject} selector The element containing all of the slides, and the optional navigation
		* @param {object} options Object containing settings for the slideshow<br />
		* <b>loop</b> <i>{boolean}</i> If true, the slideshow will loop around infinitely. To achieve seamless looping, some slides will be duplicatd behind the scenes
		* <b>autoPlay</b> <i>{boolean}</i> If true, the slideshow will move through the slides automatically
		* <b>delay</b> <i>{number: 4000}</i> The length of time, in milliseconds, to wait on a set of slides before moving to the next set
		* <b>duration</b> <i>{number: 600}</i> The length of time, in milliseconds, an animation between sets of slides takes
		* <b>easing</b> <i>{string: "linear"}</i> The easing function to use during an animation between sets of slides
		* <b>animateTransitions</b> <i>{boolean: true}</i> If this is set to false, slide sets will change instantly, without an animation
		* <b>disableSpaceFilling</b> <i>{boolean: false}</i> If this is true, this stops the slideshow from create duplicate slides to fill in space when there aren't enough slides to fill the available visible space. When false (default), if there is only one slide with width 25%, the slideshow creates 3 duplicates of that slide to fill the area
		* @jsFiddle //jsfiddle.net/NationStudio/jtkkkaLj/embedded/
		*/
		var TiledSlideshow = function(selector, options) {
			// Call the super's constructor
			NATION.EventDispatcher.call(this);
			this.__DOMElement = NATION.Utils.getDOMElement(selector);
			this.__slides = this.__DOMElement.querySelectorAll(".js-slide, .slide");
			if (!this.__slides.length) {
				throw new Error (this.ERROR_MISSING_ELEMENT.replace("{{className}}", "js-slide"));
			}
			this.__slideContainer = this.__slides[0].parentNode;
			this.__previousButton = this.__DOMElement.querySelector(".js-previous, .previous");
			this.__nextButton = this.__DOMElement.querySelector(".js-next, .next");
			this.options = {
				loop: true,
				autoPlay: false,
				delay: 4000,
				duration: 600,
				easing: "linear",
				animateTransitions: true,
				disableSpaceFilling: false
			};
			if (options) {
				for (var optionName in options) {
					this.options[optionName] = options[optionName];
				}
			}
			// Prioritise the Nation Animation lib if it exists
			this.jQueryMode = (typeof jQuery !== "undefined" && typeof NATION.Animation === "undefined");
			this.totalSlides = this.uniqueSlides = this.__slides.length;
			this.visibleSlides = 0;
			this.preloadingImage = null;
			this.resizeTimer = null;
			this.slideWidth = 0;
			this.currentSlideID = 0;
			this.prependedSlides = 0;
			this.appendedSlides = 0;
			this.nextButtonDisabled = false;
			this.previousButtonDisabled = false;
			if (this.__slides[0].querySelector("img")) {
				this.preloadFirstImage();
			} else {
				this.calculateVisibleSlides();
				this.setup();
			}
		}

		TiledSlideshow.prototype = Object.create(NATION.EventDispatcher.prototype);
		TiledSlideshow.prototype.constructor = TiledSlideshow;

		/**
		* Even that fires when the next button is clicked
		*/
		TiledSlideshow.prototype.NEXT_CLICKED = "NextClicked";
		/**
		* Event that fires when the previous button is clicked
		*/
		TiledSlideshow.prototype.PREVIOUS_CLICKED = "PreviousClicked";
		/**
		* Event that fires when it's time to automatically move to the next set of slides
		*/
		TiledSlideshow.prototype.AUTOPLAY_TIMER = "AutoPlayTimer";
		/**
		* Event that fires when the number of slides shown at once has changed. This happens when the browser is resized and the styles change in a media query
		*/
		TiledSlideshow.prototype.VISIBLE_SLIDES_CHANGED = "VisibleSlidesChanged";

		/**
		* Start moving through slides automatically
		*/
		TiledSlideshow.prototype.startAutoCycling = function() {
			this.autoCycling = true;
			this.cycleTimer = setTimeout(this.onCycleTimerTicked.bind(this), this.options.delay);
		}

		/**
		* Stop moving through slides automatically
		*/
		TiledSlideshow.prototype.stopAutoCycling = function() {
			this.autoCycling = false;
			if (this.cycleTimer) {
				clearTimeout(this.cycleTimer);
				this.cycleTimer = null;
			}
		}

		/**
		* Return the zero-indexed ID of the slide currently visible on the left
		* @return {number} Zero-indexed ID of the left-most visible slide
		*/
		TiledSlideshow.prototype.getCurrentSlideID = function() {
			return this.currentSlideID;
		}

		/**
		* Returns the number of slides visible at any one time
		*/
		TiledSlideshow.prototype.getVisibleSlides = function() {
			return this.visibleSlides;
		}

		/**
		* Show the next set of slides
		*/
		TiledSlideshow.prototype.showNextSlides = function() {
			var nextSlide = this.currentSlideID + this.visibleSlides;
			this.showSlide(nextSlide, false, false);
		}

		/**
		* Show the previous set of slides
		*/
		TiledSlideshow.prototype.showPreviousSlides = function() {
			var nextSlide = this.currentSlideID - this.visibleSlides;
			this.showSlide(nextSlide, false, true);
		}

		/**
		* Move to a set of slides starting with the specified slide ID
		* @param {number} slideID Zero-indexed ID of the first slide to show
		* @param {boolean} immediate If true, the slide change will happen without an animation
		* @param {boolean} reverseDirection If true, the transition between slidesets will happen by moving the slides right. This can make sense when slideID is less than the currently visible slide ID
		*/
		TiledSlideshow.prototype.showSlide = function(slideID, immediate, reverseDirection) {
			// Figure out looping logic, show/hide navigation, then move to the selected slide
			if (this.options.loop) {
				// If looping is enabled
				if (slideID > this.totalSlides) {
					slideID = slideID - this.totalSlides;
					this.moveToSlide(slideID - this.visibleSlides, true);
				}

				if (this.uniqueSlides !== this.visibleSlides && this.visibleSlides % this.uniqueSlides) {
					this.enableNextButton();
					this.enablePreviousButton();
				} else {
					this.disableNextButton();
					this.disablePreviousButton();
				}
			} else {
				// If looping is disabled
				if (slideID >= this.totalSlides - this.visibleSlides) {
					slideID = this.totalSlides - this.visibleSlides;
					if (slideID <= 0) {
						slideID = 0;
						this.disablePreviousButton();
					}
					this.disableNextButton();
				} else if (slideID <= 0) {
					this.disablePreviousButton();
					slideID = 0;
				}
				if (slideID > 0) {
					this.enablePreviousButton();
				}
				if (slideID < this.totalSlides - this.visibleSlides && this.visibleSlides % this.uniqueSlides) {
					this.enableNextButton();
				} else {
					this.disableNextButton();
				}
			}
			this.moveToSlide(slideID, immediate, reverseDirection);
			this.currentSlideID = slideID;
		}

		/**
		* Error messages
		* @ignore
		*/
		TiledSlideshow.prototype.ERROR_MISSING_ELEMENT = "NATION.TiledSlideshow: Selector is missing a child with class name '{{className}}'.";

		/**
		* Perform initial setup
		* @ignore
		*/
		TiledSlideshow.prototype.setup = function() {
			if (this.totalSlides < this.visibleSlides && !this.options.disableSpaceFilling) {
				this.createRequiredDuplicates();
			}
			if (this.options.loop && this.totalSlides !== this.visibleSlides) {
				this.createLoopDuplicates();
			}
			this.moveToSlide(0, true);
			this.__slides = this.__DOMElement.querySelectorAll(".js-slide, .slide");
			this.resizeSlideContainer();
			// If the number of slides is exactly how many can be shown at once, or the slides have been duplicated (thus creating more than visibleSlides)
			// disable the navigation buttons
			if (this.totalSlides === this.visibleSlides || (this.totalSlides <= this.visibleSlides && !this.options.loop) || (this.totalSlides < this.visibleSlides && this.options.disableSpaceFilling)) {
				this.disablePreviousButton();
				this.disableNextButton();
			} else {
				// Otherwise continue with normal setup
				if (this.options.autoPlay) {
					this.startAutoCycling();
				}
				// If looping is disabled, user can't initially go backwards, as the slideshow starts on the first slide
				if (!this.options.loop) this.disablePreviousButton();
			}
			this.createListeners();
		}

		/**
		* Listen for navigation events
		* @ignore
		*/
		TiledSlideshow.prototype.createListeners = function() {
			if (this.__previousButton) {
				this.__previousButton.addEventListener("click", this.onPreviousClicked.bind(this));
			}
			if (this.__nextButton) {
				this.__nextButton.addEventListener("click", this.onNextClicked.bind(this));
			}
			window.addEventListener("resize", this.onWindowResized.bind(this));
		}

		/**
		* Allow previous button clicks
		* @ignore
		*/
		TiledSlideshow.prototype.enablePreviousButton = function() {
			if (this.__previousButton && this.previousButtonDisabled) {
				this.previousButtonDisabled = false;
				this.__previousButton.className = this.__previousButton.className.replace(/ disabled|disabled/g, "");
			}
		}

		/**
		* Ignore previous button clicks
		* @ignore
		*/
		TiledSlideshow.prototype.disablePreviousButton = function() {
			if (this.__previousButton && !this.previousButtonDisabled) {
				this.previousButtonDisabled = true;
				this.__previousButton.className += " disabled";
			}
		}

		/**
		* Allow next button clicks
		* @ignore
		*/
		TiledSlideshow.prototype.enableNextButton = function() {
			if (this.__nextButton && this.nextButtonDisabled) {
				this.nextButtonDisabled = false;
				this.__nextButton.className = this.__nextButton.className.replace(/ disabled|disabled/g, "");
			}
		}

		/**
		* Ignore next button clicks
		* @ignore
		*/
		TiledSlideshow.prototype.disableNextButton = function() {
			if (this.__nextButton && !this.nextButtonDisabled) {
				this.nextButtonDisabled = true;
				this.__nextButton.className += " disabled";
			}
		}

		/**
		* Load first image before getting the slide width
		* @ignore
		*/
		TiledSlideshow.prototype.preloadFirstImage = function() {
			var imageURL = this.__slides[0].querySelector("img").getAttribute("src");
			this.preloadingImage = document.createElement("img");
			this.preloadingImage.addEventListener("load", this.onFirstImageLoadComplete.bind(this));
			this.preloadingImage.src = imageURL;
		}

		/**
		* Work out how many slides are visible at once
		* @ignore
		*/
		TiledSlideshow.prototype.calculateVisibleSlides = function() {
			var previousVisibleSlides = this.visibleSlides;
			this.__slides = this.__DOMElement.querySelectorAll(".js-slide, .slide");
			if (this.__slides[this.prependedSlides].clientWidth > 0) {
				this.visibleSlides = Math.round(this.__DOMElement.clientWidth / this.__slides[this.prependedSlides].clientWidth);
			}
			if (this.visibleSlides !== previousVisibleSlides && previousVisibleSlides > 0) {
				this.trigger(this.VISIBLE_SLIDES_CHANGED);
			}
		}

		/**
		* Ensure we have enough slides to play with
		* @ignore
		*/
		TiledSlideshow.prototype.createRequiredDuplicates = function() {
			var i = 0, length = this.totalSlides;
			var html = this.__slideContainer.innerHTML;
			var createdSlides = this.totalSlides;
			var newSlides = 0;
			while (createdSlides < this.visibleSlides) {
				for (; i < length; i++) {
					if (createdSlides < this.visibleSlides) {
						html += this.__slides[i].outerHTML;
						newSlides++;
					}
				}
				createdSlides += this.totalSlides;
				i = 0;
			}
			if (this.totalSlides > 1) {
				this.totalSlides += newSlides;
			}
			this.__slideContainer.innerHTML = html;
			this.__slides = this.__DOMElement.querySelectorAll(".js-slide, .slide");
		}

		/**
		* Create duplicate slides before and after the starting slides, used for looping
		* @ignore
		*/
		TiledSlideshow.prototype.createLoopDuplicates = function() {
			this.__slides = this.__DOMElement.querySelectorAll(".js-slide, .slide");
			var html = this.__slideContainer.innerHTML, i = 0;
			var length = this.visibleSlides + this.appendedSlides, newSlides = 0;
			// Create duplicates on the end
			var previousDuplicates = this.prependedSlides;
			i = previousDuplicates + this.appendedSlides;
			while (this.appendedSlides < this.visibleSlides) {
				//i = this.appendedSlides;
				for (; i < length; i++) {
					if (this.__slides[i] && this.appendedSlides < this.visibleSlides) {
						html += this.__slides[i].outerHTML;
						newSlides++;
						this.appendedSlides++;
					}
				}
				if (i >= this.totalSlides) {
					i = 0;
				}
			}
			// Create duplicates at the start for looping backwards
			if (this.uniqueSlides > 1) {
				i = (this.totalSlides - 1) - (this.prependedSlides);
				if (i < 0) {
					i = this.totalSlides + i;
				}
				previousDuplicates = this.prependedSlides;
				i += previousDuplicates;
				length = (this.totalSlides - (this.visibleSlides + 1) + previousDuplicates);
				if (length < 0) length = this.totalSlides;
			} else {
				i = 1;
				length = 0;
			}
			while (this.prependedSlides < this.visibleSlides) {
				for (; i > length; i--) {
					if (this.prependedSlides < this.visibleSlides) {
						html = this.__slides[i].outerHTML + html;
						this.prependedSlides++;
						newSlides++;
					} else {
						break;
					}
				}
				if (this.uniqueSlides > 1) {
					i = this.totalSlides-1;
					length = this.totalSlides - (this.visibleSlides + 1);
				} else {
					i = 1;
					length = 0;
				}
			}
			this.__slideContainer.innerHTML = html;
			this.__slides = this.__DOMElement.querySelectorAll(".js-slide, .slide");
		}

		/**
		* Make container big enough to hold all slides horizontally
		* @ignore
		*/
		TiledSlideshow.prototype.resizeSlideContainer = function() {
			this.__slideContainer.style.removeProperty("width");
			var i = 0, length = this.__slides.length;
			for (; i < length; i++) {
				this.__slides[i].style.removeProperty("width");
			}
			this.calculateVisibleSlides();
			// Make sure there are still enough duplicate slides after the resize
			if (this.options.loop && this.appendedSlides < this.visibleSlides) {
				this.createLoopDuplicates();
				this.showSlide(this.currentSlideID, true);
			} else if ((!this.options.loop && length < this.visibleSlides) || (this.options.loop && this.totalSlides < this.visibleSlides)) {
				this.createRequiredDuplicates();
				this.showSlide(this.currentSlideID, true);
			} else if (this.visibleSlides % this.uniqueSlides === 0) {
				this.showSlide(0, true);
			}
			// Here we use getBoundingClientRect to achieve sub-pixel accuracy
			this.slideWidth = this.__slides[this.currentSlideID].getBoundingClientRect().width;
			length = this.__slides.length;
			var newSlideWidth = 100 / this.__slides.length;
			i = 0;
			for (; i < length; i++) {
				this.__slides[i].style.width = newSlideWidth + "%";
			}
			var newContainerWidth = this.slideWidth * this.__slides.length;
			newContainerWidth = (newContainerWidth / this.__DOMElement.clientWidth) * 100;
			if (newContainerWidth > 0) {
				this.__slideContainer.style.width = newContainerWidth + "%";
			}
		}

		/**
		* Jump or animate to a new slide ID
		* @ignore
		*/
		TiledSlideshow.prototype.moveToSlide = function(slideID, immediate, reverseDirection) {
			slideID += this.prependedSlides;
			var newLeft = -(slideID * (100/this.visibleSlides)) + "%";
			if (!immediate) {
				this.animating = true;
				if (!this.jQueryMode) {
					NATION.Animation.start(this.__slideContainer, {left: newLeft}, {duration: this.options.duration, easing: this.options.easing}, this.onSlideAnimationComplete.bind(this));
				} else {
					$(this.__slideContainer).stop().animate({left: newLeft}, this.options.duration, this.options.easing, this.onSlideAnimationComplete.bind(this));
				}
			} else {
				this.animating = false;
				this.__slideContainer.style.left = newLeft;
				this.onSlideAnimationComplete();
			}
			
		}

		/**
		* Adjust for loops after a previous button click
		* @ignore
		*/
		TiledSlideshow.prototype.checkForLoopingBackwards = function() {
			if (this.currentSlideID < 0) {
				this.currentSlideID = this.totalSlides + this.currentSlideID;
				this.moveToSlide(this.currentSlideID, true);
			}
		}

		/**
		* Reposition slides as required by current styles
		* @ignore
		*/
		TiledSlideshow.prototype.resize = function() {
			if (this.resizeTimer) {
				clearTimeout(this.resizeTimer);
				this.resizeTimer = null;
			}
			this.resizeSlideContainer();
			this.showSlide(this.currentSlideID, true);
		}

		/**
		* We now have a reliable slide width to work with
		* @ignore
		*/
		TiledSlideshow.prototype.onFirstImageLoadComplete = function() {
			this.calculateVisibleSlides();
			this.setup();
		}

		/**
		* Delay has passed, so show next set of slides
		* @ignore
		*/
		TiledSlideshow.prototype.onCycleTimerTicked = function() {
			this.trigger(this.AUTOPLAY_TIMER);
			this.showNextSlides();
		}

		/**
		* Show the previous set of slides
		* @ignore
		*/
		TiledSlideshow.prototype.onPreviousClicked = function(e) {
			if (!this.animating) {
				this.stopAutoCycling();
				this.showPreviousSlides();
				this.trigger(this.PREVIOUS_CLICKED);
			}
			e.preventDefault();
		}

		/**
		* Show the next set of slides
		* @ignore
		*/
		TiledSlideshow.prototype.onNextClicked = function(e) {
			if (!this.animating) {
				this.stopAutoCycling();
				this.showNextSlides();
				this.trigger(this.NEXT_CLICKED);
			}
			e.preventDefault();
		}

		/**
		* Adjust for looping and unpause autoPlay if required
		* @ignore
		*/
		TiledSlideshow.prototype.onSlideAnimationComplete = function(e) {
			this.animating = false;
			this.checkForLoopingBackwards();
			if (this.autoCycling) {
				this.stopAutoCycling();
				if (this.options.loop || (!this.options.loop && this.currentSlideID < (this.totalSlides - this.visibleSlides))) {
					this.startAutoCycling();
				}
			}
		}

		/**
		* Resize on a timer to pace events
		* @ignore
		*/
		TiledSlideshow.prototype.onWindowResized = function(e) {
			if (!this.resizeTimer) {
				this.resizeTimer = setTimeout(this.resize.bind(this), 20);
			}
		}

		window.NATION.TiledSlideshow = TiledSlideshow;
	}
}(window, document, undefined));