////////////////////////////////////////////////////////////////////////////////
// Nation Library
// Basic Slideshow, defaults to fades unless otherwise specified
// selector: Main slideshow selector. Must contain one or more '.slide'
// Optional .previous and .next buttons if user interaction is required
// options: {
//		autoPlay: true			// Rotate through slides
//		slide: false, 			// Use a sliding transition (false = fade)
//		delay: 4000,			// Time to wait before changing slides
//		duration: 600,			// Duration of transition animation,
//		easing: "linear",		// Easing to apply to slide animation
//		useCaptions: false,		// Enables separate captions 
//								(.captions must exist, not inside any slide,
//								and .caption must exist inside each slide). 
//								Captions fade in/out separately.
//		pips: false,			// Selector must contain .pips, and not inside any
//								slide. If .pips is empty, default pip HTML will 
//								be created, otherwise the existing children will
//								be used as pips. Default pip HTML is:
//								<li class="pip"><a href="#"></a></li>
//		touch: true,			// Enable or disable swipe left/swipe right for
//								previous/next slide (true = enabled)
//		swipeTolerance: 100		// Distance finger must travel before it is
//								considered a swipe
//		useSlideWidth: false	// Useful if your slides are wider than your container
//								// Uses the width of slides for positioning, rather than
//								// just setting left to 100%/-100%. This will
//								// also recalculate slideWidth on window resize
// }
////////////////////////////////////////////////////////////////////////////////
var NATION = NATION || {};

/**
* ### Dependencies:
* [NATION.EventDispatcher](EventDispatcher.js.html)
* [NATION.Utils](Utils.js.html)
* [NATION.Animation](Animation.js.html) or [jQuery](http://www.jquery.com)

* ### About:
* Slideshow that can either fade or slide between slides
*
* ### Notes:
* - selector should contain one or more instances of *.slide*. Selector may also contain:
* - *.next* Class for the 'next slide' button
* - *.previous* Class for the 'previous slide' button
* - *.pips* Needed if pip-based navigation is required
* - If jQuery is already in your project, it will be used for animation

* ### Style Information
* - Slides must be positioned absolutely, as left/z-index are changed. However, the first slide can be positioned relatively, which allows the slideshow to take up space in the document flow

* ### Example:

 	<!-- HTML -->
	<div class="slideshow">
		<ul class="pips">
			<li><a href="#">1</a></li>
			<li><a href="#">2</a></li>
			<li><a href="#">3</a></li>
		</ul>
		<ul class="slides">
			<li class="slide"><img src="image-url.jpg" alt="My slide image" /></li>
			<li class="slide"><img src="image-url.jpg" alt="My slide image" /></li>
			<li class="slide"><img src="image-url.jpg" alt="My slide image" /></li>
		</ul>
		<ul class="navigation">
			<li><a href="#" class="previous">Previous slide</a></li>
			<li><a href="#" class="next">Next slide</a></li>
		</ul>
	</div>

 	// JavaScript
 	var selector = document.querySelector(".slideshow");
 	var options = {
		autoPlay: false,
		slide: true,
		easing: "easeInOutSine",
		pips: true
 	};
 	var slideshow = new NATION.Slideshow(selector, options);

*
* @class Slideshow
* @param {domelement,string} selector DOM element, or query string. See notes below for what this element should contain
* @param {object} options Options used to customise the slideshow
* @param {boolean} options.slide (default:false) Use a sliding transition instead of a fade
* @param {boolean} options.autoPlay (default:true) Start moving through each slide automatically
* @param {number} options.delay (default:4000) Time to wait on each slide before moving to the next, in milliseconds
* @param {number} options.duration (default:600) Duration of a slide transition, in milliseconds
* @param {string} options.easing (default:"linear") Name of the easing function you wish to use
* @param {boolean} options.useCaptions (default:false) Enables separately animated captions. '.captions' must exist, outside of any slide, to show each caption, and each slide must contain '.caption', with the copy to show. Captions are faded in/out
* @param {boolean} options.pips (default:false) Enable clickable pips showing which slide the user is currently viewing. Selector must contain '.pips'. If .pips is empty, default pip HTML will be created, otherwise the existing children will be used as pips. Default pip HTML is: <li class="pip"><a href="#"></a></li>
* @param {boolean} options.touch (default:true) Enable or disable swipe left/swipe right for previous/next slide (true = enabled)
* @param {number} options.swipeTolerance (default:100) Distance finger must travel before it is considered a swipe
* @param {boolean} options.useSlideWidth (default:false) Useful if your slides are wider than your container, but you want to show the full slide during a transition. Uses the width of slides for positioning, rather than just setting left to 100%/-100%. This will also recalculate slideWidth on window resize
*/
NATION.Slideshow = function(selector, options) {

	"use strict";
	
	var _public = new NATION.EventDispatcher();

	/**
	* EVENTS
	* ==============
	* The following events are fired by this class.
	*/

	/**
	* Fires when all images have loaded
	*/
	_public.IMAGE_LOAD_COMPLETE = "ImageLoadComplete";
	/**
	* Fires each time a new slide is shown
	*/
	_public.SLIDE_CHANGE = "SlideChange";

	/**
	* METHODS
	* ==============
	* The following methods can be called externally
	*/
	/**
	* Go to a slide specifified by slideID
	*/
	_public.showSlide = function(slideID) {
		_private.showSlide(slideID);
	};

	/**
	* Stop cycling through slides automatically
	*/
	_public.stopAutoCycling = function() {
		_private.stopAutoCycling();
	};

	/**
	* Start cycling through slides automatically
	*/
	_public.startAutoCycling = function() {
		_private.startAutoCycling();
	};

	/**
	* Reposition slides respecting the currently active slide
	*/
	_public.reposition = function() {
		_private.prepareSlides();
	};

	/**
	* Disable touch events
	*/
	_public.disableTouch = function() {
		_private.removeTouchListeners();
	};

	/**
	* Enable touch events
	*/
	_public.enableTouch = function() {
		_private.createTouchListeners();
	};

	/**
	* Returns the ID of the currently visible slide
	*/
	_public.getCurrentSlideID = function() {
		return _private.currentSlideID;
	}

	var _private = {
		//------------------------------------------------
		// Variables
		//------------------------------------------------
		DOMElement: null,
		jQueryMode: false,
		totalSlides: 0,
		currentSlideID: 0,
		animating: false,
		options: {
			autoPlay: true,
			slide: false,
			delay: 4000,
			duration: 600,
			easing: "linear",
			useCaptions: false,
			pips: false,
			touch: true,
			swipeTolerance: 100,
			useSlideWidth: false
		},
		autoCycling: false,
		cycleTimer: null,
		touchStartX: 0,
		touchStartY: 0,
		lastTouchY: 0,
		slideWidth: 0,
		loadingImages: [],
		touchListenersActive: false,

		//------------------------------------------------
		// Init
		//------------------------------------------------
		init: function() {
			this.DOMElement = NATION.Utils.getDOMElement(selector);
			// Windows phone fix
			this.DOMElement.style["-ms-touch-action"] = "none";
			this.jQueryMode = (typeof jQuery !== "undefined");
			this.totalSlides = this.DOMElement.querySelectorAll(".slide").length;
			if (options) {
				for (var i in options) {
					this.options[i] = options[i];
				}
			}
			if (!this.options.slide) {
				this.options.fade = true;
			}
			if (this.totalSlides > 1) {
				this.prepareSlides();
				if (this.options.useCaptions) {
					this.prepareCaptions();
				}
				if (this.options.pips) {
					this.preparePips();
				}
				if (this.options.autoPlay) {
					this.startAutoCycling();
				}
				this.createListeners();
			} else {
				// Hide navigation if there's only one slide
				if (this.DOMElement.querySelector(".previous")) {
					this.DOMElement.querySelector(".previous").style.display = "none";
				}
				if (this.DOMElement.querySelector(".next")) {
					this.DOMElement.querySelector(".next").style.display = "none";
				}
				
				// Same with pips
				if (this.options.pips) {
					this.DOMElement.querySelector(".pips").style.display = "none";
				}
			}
			if (this.options.useSlideWidth) {
				this.preloadFirstSlide();
			}
			this.loadingImages = this.DOMElement.querySelectorAll("img");
			this.checkAllImagesLoaded();
		},

		//------------------------------------------------
		// Preload first slide image to get width
		//------------------------------------------------
		preloadFirstSlide: function() {
			this.slideWidth = this.DOMElement.querySelectorAll(".slide")[0].clientWidth;
			if (this.DOMElement.querySelectorAll(".slide")[0].querySelector("img")) {
				var imageURL = this.DOMElement.querySelectorAll(".slide")[0].querySelector("img").getAttribute("src");
				var firstImage = document.createElement("img");
				firstImage.onload = function() {_private.onFirstImagePreloaded();};
				firstImage.src = imageURL;
			}
		},

		//------------------------------------------------
		// Check if all images have loaded
		//------------------------------------------------
		checkAllImagesLoaded: function() {
			var i = 0, length = this.loadingImages.length;
			var imageLoadComplete = true;
			if (this.imageLoader) {
				clearTimeout(this.imageLoader);
			}
			for (; i < length; i++) {
				if (!this.loadingImages[i].complete) {
					imageLoadComplete = false;
					this.imageLoader = setTimeout(function() {_private.checkAllImagesLoaded();}, 200);
					return;
				}
			}
			_public.trigger(_public.IMAGE_LOAD_COMPLETE);
		},

		//------------------------------------------------
		// Move slides to starting positions
		//------------------------------------------------
		prepareSlides: function() {
			var slides = this.DOMElement.querySelectorAll(".slide");
			var i = 0, length = slides.length;
			if (this.options.fade) {
				// If fading, ensure first slide is on top
				for (; i < length; i++) {
					slides[i].style.zIndex = 5;
				}
				this.DOMElement.querySelectorAll(".slide")[0].style.zIndex = 10;
			} else if (this.options.slide) {
				// If sliding, move all but first slide off-screen
				i = 0;
				for (; i < length; i++) {
					if (i !== this.currentSlideID) {
						if (this.options.useSlideWidth) {
							slides[i].style.left = this.slideWidth + "px";
						} else {
							slides[i].style.left = "100%";
						}
					}
				}
			}
		},

		//------------------------------------------------
		// Insert first caption
		//------------------------------------------------
		prepareCaptions: function() {
			var i = 0, length = this.totalSlides, caption,
			slides = this.DOMElement.querySelectorAll(".slide");
			this.captions = [];
			for (; i < length; i++) {
				caption = slides[i].querySelector(".caption");
				var captionCopy = (caption) ? caption.innerHTML : "&nbsp;";
				if (captionCopy === "") captionCopy = "&nbsp;";
				this.captions.push(captionCopy);
			}
			this.DOMElement.querySelector(".captions").innerHTML = this.captions[0];
		},

		//------------------------------------------------
		// Create pips if none, or the wrong number, exist
		//------------------------------------------------
		preparePips: function() {
			var pipsContainer = this.DOMElement.querySelector(".pips"), i = 0, length = 0;
			if (pipsContainer.children.length <= 0) {
				// Pips need to be created from scratch
				i = 0; length = this.totalSlides;
				var pipHTML = "", nodeName = pipsContainer.nodeName.toLowerCase();
				if (nodeName !== "ul" && nodeName !== "ol") {
					pipHTML += "<ul>";
				}
				for (; i < length; i++) {
					pipHTML += '<li class="pip';
					if (i === 0) pipHTML += ' active';
					pipHTML += '"><a href="#"></a></li>'
				}
				if (nodeName !== "ul" && nodeName !== "ol") {
					pipHTML += "</ul>";
				}
				pipsContainer.innerHTML = pipHTML;
			} else if (pipsContainer.children.length < this.totalSlides) {
				// We need to generate some extra pips to match the number of slides
				// Duplicate the first child that already exists
				var pip = null;
				i = 0; length = this.totalSlides - pipsContainer.children.length;
				for (; i < length; i++) {
					pip = pipsContainer.firstChild.cloneNode();
					pipsContainer.appendChild(pip);
				}

			}
			pipsContainer.children[0].className += " active";
		},

		//------------------------------------------------
		// Move through slides in a loop
		//------------------------------------------------
		startAutoCycling: function() {
			this.autoCycling = true;
			this.cycleTimer = setTimeout(function() {_private.onCycleTimerTicked();}, this.options.delay);
		},

		//------------------------------------------------
		// Stop automatically moving between slides
		//------------------------------------------------
		stopAutoCycling: function() {
			this.autoCycling = false;
			if (this.cycleTimer) clearTimeout(this.cycleTimer);
		},

		//------------------------------------------------
		// Animate to target slide
		//------------------------------------------------
		showSlide: function(slideID, reverse) {
			if (slideID !== this.currentSlideID && !this.animating) {
				this.animating = true;
				var animOutValues = {}, animInValues = {}, nextStartValues = {}, prevStartValues = {};
				if (this.options.slide) {
					if (reverse) {
						animOutValues = (this.options.useSlideWidth) ? {left: this.slideWidth + "px"} : {left: "100%"};
						nextStartValues = (this.options.useSlideWidth) ? {left: -this.slideWidth + "px"} : {left: "-100%"};
					} else {
						animOutValues = (this.options.useSlideWidth) ? {left: -this.slideWidth + "px"} : {left: "-100%"};
						nextStartValues = (this.options.useSlideWidth) ? {left: this.slideWidth + "px"} : {left: "100%"};
					}
					animInValues = {left: 0};
					prevStartValues = {};
				} else if (this.options.fade) {
					animOutValues = {opacity: 1};
					animInValues = {opacity: 1};
					prevStartValues = {opacity: 1, zIndex: 5};
					nextStartValues = {opacity: 0, zIndex: 10};
				}
				if (this.jQueryMode) {
					$(this.DOMElement).find(".slide").eq(this.currentSlideID).stop().css(prevStartValues).animate(animOutValues, this.options.duration, this.options.easing);
					$(this.DOMElement).find(".slide").eq(slideID).stop().css(nextStartValues).animate(animInValues, this.options.duration, this.options.easing, function() {_private.onAnimationComplete();});
				} else {
					var slide = this.DOMElement.querySelectorAll(".slide")[this.currentSlideID];
					NATION.Utils.setStyle(slide, prevStartValues);
					NATION.Animation.start(slide, animOutValues, {
						duration: this.options.duration,
						easing: this.options.easing
					});
					slide = this.DOMElement.querySelectorAll(".slide")[slideID];
					NATION.Utils.setStyle(slide, nextStartValues);
					NATION.Animation.start(slide, animInValues, {
						duration: this.options.duration,
						easing: this.options.easing
					},
					function() {_private.onAnimationComplete();});
				}
				if (this.options.pips) {
					this.updatePips(this.currentSlideID, slideID);
				}
				this.currentSlideID = slideID;
				_public.trigger(_public.SLIDE_CHANGE);
				// if separate captions are active, fade out current one
				if (this.options.useCaptions) {
					if (this.jQueryMode) {
						$(this.DOMElement).find(".captions").animate({opacity: 0}, this.options.duration/2, "linear", function() {_private.onCaptionFadedOut();});
					} else {
						NATION.Animation.start(this.DOMElement.querySelector(".captions"), {opacity: 0}, {duration: this.options.duration/2, easing: "linear"}, function(e) {_private.onCaptionFadedOut(e);});
					}
				}
			}
		},

		//------------------------------------------------
		// Listen for navigation clicks
		//------------------------------------------------
		createListeners: function() {
			if (this.DOMElement.querySelector(".previous")) {
				this.DOMElement.querySelector(".previous").addEventListener("click", function(e) {_private.onPreviousClicked(e);});
			}
			if (this.DOMElement.querySelector(".next")) {
				this.DOMElement.querySelector(".next").addEventListener("click", function(e) {_private.onNextClicked(e);});
			}
			if (this.options.pips) {
				var pips = this.DOMElement.querySelectorAll(".pips a"), i = 0, length = pips.length;
				for (; i < length; i++) {
					pips[i].addEventListener("click", function(e) {_private.onPipClicked(e);});
				}
			}
			if (this.options.touch) {
				this.createTouchListeners();
			}
			if (this.options.useSlideWidth) {
				window.addEventListener("resize", function(e) {_private.onWindowResized(e);});
			}
		},

		//------------------------------------------------
		// Add touch listeners
		//------------------------------------------------
		createTouchListeners: function() {
			if (!this.touchListenersActive) {
				this.touchListenersActive = true;
				this.DOMElement.addEventListener("touchstart", _private.onTouchStart);
				this.DOMElement.addEventListener("MSPointerDown", _private.onTouchStart);
			}
		},

		//------------------------------------------------
		// Remove touch listeners
		//------------------------------------------------
		removeTouchListeners: function() {
			if (this.touchListenersActive) {
				this.touchListenersActive = false;
				this.DOMElement.removeEventListener("touchstart", _private.onTouchStart);
				this.DOMElement.removeEventListener("MSPointerDown", _private.onTouchStart);
				document.documentElement.removeEventListener("touchmove", _private.onTouchMove);
				document.documentElement.removeEventListener("touchend", _private.onTouchEnd);
				document.documentElement.removeEventListener("MSPointerMove", _private.onTouchMove);
				document.documentElement.removeEventListener("MSPointerUp", _private.onTouchEnd);
			}
		},

		//------------------------------------------------
		// Highlight current slide in pips
		//------------------------------------------------
		updatePips: function(previousID, nextID) {
			var pips = this.DOMElement.querySelector(".pips").children;
			pips[previousID].className = pips[previousID].className.replace(/ active|active/g, "");
			pips[nextID].className += " active";
		},

		//------------------------------------------------
		// Show previous slide
		//------------------------------------------------
		onPreviousClicked: function(e) {
			if (this.autoCycling) this.stopAutoCycling();
			if (!this.animating) {
				var previousSlideID = this.currentSlideID - 1;
				if (previousSlideID < 0) {
					previousSlideID = this.totalSlides - 1;
				}
				this.showSlide(previousSlideID, true);
			}
			e.stopPropagation();
			e.preventDefault();
		},

		//------------------------------------------------
		// Show next slide
		//------------------------------------------------
		onNextClicked: function(e) {
			if (this.autoCycling) this.stopAutoCycling();
			if (!this.animating) {
				var nextSlideID = this.currentSlideID + 1;
				if (nextSlideID > this.totalSlides - 1) {
					nextSlideID = 0;
				}
				this.showSlide(nextSlideID);
			}
			e.stopPropagation();
			e.preventDefault();
		},

		//------------------------------------------------
		// Animation has fished, update state
		//------------------------------------------------
		onAnimationComplete: function() {
			this.animating = false;
			if (this.autoCycling) {
				this.startAutoCycling();
			}
		},

		//------------------------------------------------
		// Move to next slide automatically
		//------------------------------------------------
		onCycleTimerTicked: function() {
			var nextSlideID = this.currentSlideID + 1;
			if (nextSlideID > this.totalSlides - 1) {
				nextSlideID = 0;
			}
			this.showSlide(nextSlideID);
		},

		//------------------------------------------------
		// Fade in next caption
		//------------------------------------------------
		onCaptionFadedOut: function() {
			var nextCaption = this.captions[this.currentSlideID];
			this.DOMElement.querySelector(".captions").innerHTML = nextCaption;
			if (this.jQueryMode) {
				$(this.DOMElement).find(".captions").stop().animate({opacity: 1}, this.options.duration/2, "linear");
			} else {
				NATION.Animation.start(this.DOMElement.querySelector(".captions"), {opacity: 1}, {duration: this.options.duration/2, easing: "linear"});
			}
		},

		//------------------------------------------------
		// Show requested slide after pip click
		//------------------------------------------------
		onPipClicked: function(e) {
			if (this.autoCycling) this.stopAutoCycling();
			var pips = this.DOMElement.querySelectorAll(".pips a"), i = 0, length = pips.length, index = -1;
			for (; i < length; i++) {
				if (pips[i] === e.currentTarget) {
					index = i;
					break;
				}
			}
			this.showSlide(index, (index < this.currentSlideID));
			e.stopPropagation();
			e.preventDefault();
		},

		//------------------------------------------------
		// A potential swipe has started
		//------------------------------------------------
		onTouchStart: function(e) {
			if (!_private.animating) {
				var touches = (typeof e.changedTouches != 'undefined') ? e.changedTouches : [e];
				var bounds = NATION.Utils.getOffset(_private.DOMElement);
				_private.touchStartY = _private.lastTouchY = touches[0].pageY;
				_private.touchStartX = touches[0].pageX;
				// Stuff used to handle vertical swipes over the slideshow
				_private.verticalSwipeInProgress = false;
				var page = NATION.Utils.getPageElement();
				_private.startScroll = page.scrollTop;
				// Track where the touch started, so we know where to base new positions on
				var touchOffset = _private.touchStartY - NATION.Utils.getOffset(_private.DOMElement).top;
				_private.offsetTop = (_private.DOMElement.getBoundingClientRect().top + touchOffset); 

				if (_private.touchStartX > bounds.left && _private.touchStartX < (bounds.left + _private.DOMElement.clientWidth) && _private.touchStartY > bounds.top && _private.touchStartY < (bounds.top+_private.DOMElement.clientHeight)) {
					document.documentElement.addEventListener("touchmove", _private.onTouchMove);
					document.documentElement.addEventListener("touchend", _private.onTouchEnd);
					document.documentElement.addEventListener("MSPointerMove", _private.onTouchMove);
					document.documentElement.addEventListener("MSPointerUp", _private.onTouchEnd);
				}
			}
		},

		//------------------------------------------------
		// Prevent normal move behaviour
		//------------------------------------------------
		onTouchMove: function(e) {
			var touches = (typeof e.changedTouches != 'undefined') ? e.changedTouches : [e];
			// Swipe tolerance is halved to be more sensitive to attempts to scroll away from the slideshow
			if (touches[0].pageY < _private.touchStartY - (_private.options.swipeTolerance/2) || touches[0].pageY > _private.touchStartY +  (_private.options.swipeTolerance/2) || _private.verticalSwipeInProgress) {
				// This has become a swipe, but it's vertical, so the user is
				// probably trying to scroll away. We should therefore stop annexing the touch
				// We have to pretend to do this by manually scrolling the page until touchend
				var page = NATION.Utils.getPageElement();
				page.scrollTop = (_private.startScroll + (page.scrollTop - touches[0].pageY)) + _private.offsetTop;
				_private.verticalSwipeInProgress = true;
			}
			e.stopPropagation();
			e.preventDefault();
		},

		//------------------------------------------------
		// Check for a valid swipe
		//------------------------------------------------
		onTouchEnd: function(e) {
			var touches = (typeof e.changedTouches != 'undefined') ? e.changedTouches : [e];
			_private.verticalSwipeInProgress = false;
			var endPos = touches[0].pageX;
			var nextSlideID = _private.currentSlideID, swipe = false, reverse = false;;
			if (endPos > _private.touchStartX + _private.options.swipeTolerance) {
				// Swipe was to the right, show previous slide
				nextSlideID -= 1;
				if (nextSlideID < 0) nextSlideID = _private.totalSlides-1;
				swipe = reverse = true;
			} else if (endPos < _private.touchStartX - _private.options.swipeTolerance) {
				// Swipe was to the left, show next slide
				nextSlideID += 1;
				if (nextSlideID > _private.totalSlides-1) nextSlideID = 0;
				swipe = true;
			}
			if (swipe) {
				if (_private.autoCycling) _private.stopAutoCycling();
				_private.showSlide(nextSlideID, reverse);
			}
			document.documentElement.removeEventListener("touchmove", _private.onTouchMove);
			document.documentElement.removeEventListener("touchend", _private.onTouchEnd);
			document.documentElement.removeEventListener("MSPointerMove", _private.onTouchMove);
			document.documentElement.removeEventListener("MSPointerUp", _private.onTouchEnd);
			if (swipe) {
				e.stopPropagation();
				e.preventDefault();
			}
		},

		//------------------------------------------------
		// Recalculate slide width
		//------------------------------------------------
		onFirstImagePreloaded: function(e) {
			this.slideWidth = this.DOMElement.querySelectorAll(".slide")[0].clientWidth;
			this.prepareSlides();
		},

		//------------------------------------------------
		// Recalculate slide width
		//------------------------------------------------
		onWindowResized: function(e) {
			if (this.options.useSlideWidth) {
				this.slideWidth = this.DOMElement.querySelectorAll(".slide")[0].clientWidth;
				this.prepareSlides();
			}
		}
	};

	_private.init();
	return _public;
};