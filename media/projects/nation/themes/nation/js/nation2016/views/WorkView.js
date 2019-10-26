//////////////////////////////////////////////////////////////////////////////
// Nation Website 2016
// 'Work index' page view
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("NATION2016.views");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var WorkView = function(element) {
		NATION2016.views.BasicPageView.call(this);
		this.__DOMElement = element;
		this.__slideshowElement = null;
		this.__skipButton = null;
		this.__slideshowTitle = null;
		this.skipTarget = "";
		this.hiding = false;
		this.hidden = false;
		this.slideshow = null;
	}

	WorkView.prototype = Object.create(NATION2016.views.BasicPageView.prototype);
	WorkView.prototype.constructor = WorkView;

	//------------------------------------------------
	// Perform initial page setup
	//------------------------------------------------
	WorkView.prototype.build = function(pageData) {
		NATION2016.views.BasicPageView.prototype.build.call(this, pageData, true);
		// Store references to key elements
		this.__slideshowElement = this.__DOMElement.querySelector(".js-slideshow");
		this.__slideshowTitle = this.__DOMElement.querySelector(".js-slideshow-title");
		this.__skipButton = this.__DOMElement.querySelector(".js-skip-button");
		this.skipTarget = this.__skipButton.getAttribute("href");
		// Create the main slideshow
		this.createSlideshow();
		this.createListeners();
	}

	//------------------------------------------------
	// Create the latest work slideshow
	//------------------------------------------------
	WorkView.prototype.createSlideshow = function() {
		var options = {
			slide: true,
			pips: true,
			duration: 400,
			easing: "easeInOutQuart",
			touch: false
		}
		this.slideshow = new NATION2016.views.work.WorkSlideshow(this.__slideshowElement, options);
	}

	//------------------------------------------------
	// Listen for slideshow events
	//------------------------------------------------
	WorkView.prototype.createListeners = function() {
		NATION2016.views.BasicPageView.prototype.createListeners.call(this);
		if (this.buildComplete) {
			var __slideImage = this.__DOMElement.querySelector(".js-slide-image img");
			if (__slideImage) {
				if (__slideImage.complete) {
					this.onFirstSlideLoaded();
				} else {
					this.handler_imageLoadComplete = this.onFirstSlideLoaded.bind(this);
					__slideImage.addEventListener("load", this.handler_imageLoadComplete);
				}
			}
			// Listen for the user clicking to scroll to the project list
			if (this.__skipButton) {
				this.handler_skipButtonClicked = this.onSkipButtonClicked.bind(this);
				this.__skipButton.addEventListener("click", this.handler_skipButtonClicked);
			}
		}
	}

	//------------------------------------------------
	// Remove listeners ready for page to be destroyed
	//------------------------------------------------
	WorkView.prototype.removeListeners = function() {
		NATION2016.views.BasicPageView.prototype.removeListeners.call(this);
		if (this.buildComplete) {
			if (this.__slideImage) {
				this.__slideImage.removeEventListener("load", this.handler_imageLoadComplete);
			}
			if (this.__skipButton) {
				this.__skipButton.removeEventListener("click", this.handler_skipButtonClicked);
			}
		}
	}

	//------------------------------------------------
	// Resize the slideshow element to fill the browser window
	//------------------------------------------------
	WorkView.prototype.resize = function() {
		NATION2016.views.BasicPageView.prototype.resize.call(this);
		// Adding title's top margin into the calculation
		var titleTopMargin = NATION.Utils.getStyle(this.__slideshowTitle, "marginTop");
		if (!titleTopMargin) titleTopMargin = 0;
		titleTopMargin = parseInt(titleTopMargin, 10);
		// Total height of the header including the margin
		var titleHeight = this.__slideshowTitle.clientHeight + titleTopMargin;
		var slideshowHeight = window.innerHeight - (NATION2016.Settings.headerHeight + titleHeight - 6);
		this.__slideshowElement.style.height = slideshowHeight + "px";
		if (this.slideshow) this.slideshow.resize();
	}

	//------------------------------------------------
	// Hide differently when the user is going into a project
	//------------------------------------------------
	WorkView.prototype.hide = function() {
		if (this.buildComplete && !this.hiding) {
			this.hiding = true;
			this.slideshow.stopAutoCycling();
			// Move page upwards
			var easing = "easeOutQuad";
			var duration = 500;

			// Get current slide ID
			this.activeSlide = this.slideshow.getCurrentSlideID();
			// Hide that slide's button
			this.activeSlide = this.__slideshowElement.querySelectorAll(".js-slide")[this.activeSlide];
			var button = this.activeSlide.querySelector(".js-button-container");
			// Set jsMode to true for animations, since we're animating scroll position and don't want
			// the other animations to use CSS while scroll uses JS - this causes stutter since the two
			// are not sequenced.
			var jsMode = true;
		
			button.style.height = parseInt(NATION.Utils.getStyle(button, "height"), 10) + "px";
			NATION.Animation.start(button, {opacity: 0}, {jsMode: jsMode, duration: duration/2, easing: easing}, function(e) {
				NATION.Animation.start(button, {height: 0}, {jsMode: jsMode, duration: duration/2, easing: easing});
			});
			var __scrollable = NATION.Utils.getPageElement();
			if (__scrollable.scrollTop !== 0) {
				NATION.Animation.start(__scrollable, {scrollTop: 0}, {duration: duration, easing: easing});
			}
			var activeSlideID = this.slideshow.getCurrentSlideID();
			var activeSlideMedia = this.__slideshowElement.querySelectorAll(".js-slide")[activeSlideID].querySelector(".media");
			var slideContent = this.activeSlide.querySelector(".slide-content");
			this.animatingSummary = this.activeSlide.querySelector(".project-summary");

			// Slideshow changes height between sections
			var newHeight =  (window.innerHeight - this.animatingSummary.clientHeight - NATION2016.Settings.fullPanelOffset);
			var minHeight = NATION.Utils.getStyle(this.__slideshowElement, "minHeight");
			if (newHeight < minHeight) newHeight = minHeight;
			var marginTop = NATION.Utils.getStyle(document.querySelector(".page-content"), "paddingTop"); // Main page content top padding
			// Hide other slides
			var slides = this.__slideshowElement.querySelectorAll(".js-slide");
			var i = 0, length = slides.length;
			for (; i < length; i++) {
				if (i !== activeSlideID) {
					slides[i].style.visibility = "hidden";
				}
				slides[i].style.overflow = "visible";
			}

			var summaryHeight =  this.activeSlide.querySelector(".project-summary").clientHeight;
			// Fade out the existing content, since it may be in view
			var __workContent = this.__DOMElement.querySelector(".js-work-content");
			NATION.Animation.start(__workContent, {opacity: 0}, {jsMode: jsMode, duration: duration, easing: easing});
			var __overlays = this.__DOMElement.querySelector(".js-additional-overlays");
			NATION.Animation.start(__overlays, {opacity: 0}, {jsMode: jsMode, duration: duration, easing: easing});
			var __projectButton = this.__DOMElement.querySelectorAll(".js-project-button")[0];
			NATION.Animation.start(__projectButton, {opacity: 0}, {jsMode: jsMode, duration: duration, easing: easing});

			// Animate slide media back to default position
			this.slideshow.resetSlideMedia(false, duration, easing);

			// Animate the current slide so that it isn't centered anymore
			NATION.Animation.start(slideContent, {height: newHeight}, {jsMode: jsMode, duration: duration, easing: easing});
			NATION.Animation.start(this.__slideshowElement, {height: newHeight + summaryHeight}, {jsMode: jsMode, duration: duration, easing: easing});
			NATION.Animation.start(activeSlideMedia, {top: 0, left: 0, transform: "translateX(-5%) translateY(-5%)", width: "120%", height: "120%"}, {jsMode: jsMode, duration: duration, easing: easing});

			// Move whole page up temporarily, so that the slideshow is at the top of the screen
			this.slideshowOffset = NATION.Utils.getOffset(this.__slideshowElement).top;
			// Subtract 6 extra pixels due to extra padding appearing on the page-content div at larger sizes
			if (window.innerWidth > 550) this.slideshowOffset += 6;
			
			NATION.Utils.setStyle(this.animatingSummary, {transform: "translateY(0)"});
			this.__skipButton.style.display = "none";
			this.targetSlideHeight = newHeight;	

			NATION.Animation.start(this.animatingSummary, {transform: "translateY(-100%)"}, {jsMode: jsMode, duration: 200, easing: "easeInOutQuad"}, this.onSummaryMovedUp.bind(this));

			NATION.Animation.start(this.__DOMElement, {transform: "translateY(-" + this.slideshowOffset + "px)"}, {jsMode: jsMode, duration: duration, easing: easing});

			// Get the header to turn transparent
			this.trigger(NATION2016.Events.USE_TRANSPARENT_HEADER);
		} else {
			this.onHideComplete();
		}
	}

	//------------------------------------------------
	// Different stages of the hide transition follow
	//------------------------------------------------
	WorkView.prototype.onSummaryMovedUp = function(e) {
		setTimeout(this.onSummaryTimerTicked.bind(this), 100);
		NATION.Animation.start(this.animatingSummary, {transform: "translateY(-95%)"}, {duration: 150, easing: "easeInOutQuad"}, this.onSummaryMovedDown.bind(this));
	}
	WorkView.prototype.onSummaryTimerTicked = function() {
		var contentBody = this.animatingSummary.querySelector(".content-body");
		NATION.Utils.setStyle(contentBody, {
			transform: "translateY(100%)",
			opacity: 0
		});
		NATION.Animation.start(contentBody, {opacity: 1, transform: "translateY(0)"}, {duration: 300, easing: "easeOutQuad"});
	}
	WorkView.prototype.onSummaryMovedDown = function(e) {
		NATION.Animation.start(this.animatingSummary, {transform: "translateY(-102.5%)"}, {duration: 150, easing: "easeInOutQuad"}, this.onSummaryResizing.bind(this));
	}
	WorkView.prototype.onSummaryResizing = function(e) {
		NATION.Animation.start(this.animatingSummary, {transform: "translateY(-97.5%)"}, {duration: 150, easing: "easeInOutQuad"}, this.onSummaryFinishing.bind(this));
	}
	WorkView.prototype.onSummaryFinishing = function(e) {
		NATION.Animation.start(this.animatingSummary, {transform: "translateY(-100%)"}, {duration: 200, easing: "easeOutQuad"}, this.onHideComplete.bind(this));
	}

	//------------------------------------------------
	// Signal that this page has finished hiding
	// (meaining it's time to show the case study page
	// that was requested)
	//------------------------------------------------
	WorkView.prototype.onHideComplete = function() {
		this.hidden = true;
		this.hiding = false;
		this.trigger(NATION2016.Events.HIDE_COMPLETE);
	}

	//------------------------------------------------
	// Perform cleanup when the user leaves the page
	//------------------------------------------------
	WorkView.prototype.destroy = function() {
		NATION2016.views.BasicPageView.prototype.destroy.call(this);
		if (this.buildComplete) {
			// Stop a running hide animation
			if (this.hiding) {
				this.hiding = false;
				var __scrollable = NATION.Utils.getPageElement();
				NATION.Animation.stop(__scrollable);
				__scrollable.scrollTop = 0;
				NATION.Animation.stop(this.__DOMElement);
				// Get current slide ID
				var activeSlide = this.slideshow.getCurrentSlideID();
				// Hide that slide's button
				activeSlide = this.__slideshowElement.querySelectorAll(".js-slide")[activeSlide];
				
				var button = activeSlide.querySelector(".js-button-container");
				NATION.Animation.stop(button);
				var __workContent = this.__DOMElement.querySelector(".js-work-content");
				NATION.Animation.stop(__workContent);
				var __overlays = this.__DOMElement.querySelector(".js-additional-overlays");
				NATION.Animation.stop(__overlays);
				var __projectButton = this.__DOMElement.querySelectorAll(".js-project-button")[0];
				NATION.Animation.stop(__projectButton);
				NATION.Animation.stop(this.__slideshowElement);
			}
			// Stop listening for the view to be ready
			if (this.__DOMElement.querySelector(".js-slide img")) {
				this.__DOMElement.querySelector(".js-slide img").removeEventListener("complete", this.handler_imageLoadComplete);
			}
			// Stop listening to the skip button
			if (this.__skipButton) {
				this.__skipButton.addEventListener("click", this.handler_skipButtonClicked);
			}
			// Kill the latest work slideshow
			if (this.slideshow) {
				this.slideshow.stopAutoCycling();
				this.slideshow.destroy();
			}
			// Make sure the page element has no styles left over from a hide animation
			this.__DOMElement.removeAttribute("style");
		}
	}

	//------------------------------------------------
	// Signal that the first slide's image has finished
	// loading and the page is ready to be displayed
	//------------------------------------------------
	WorkView.prototype.onFirstSlideLoaded = function() {
		this.trigger(NATION2016.Events.VIEW_READY);
	}

	//------------------------------------------------
	// Scroll down to the project list
	//------------------------------------------------
	WorkView.prototype.onSkipButtonClicked = function(e) {
		this.handler_mouseWheelScrolled = this.onMouseWheelScrolled.bind(this);
		window.addEventListener("wheel", this.handler_mouseWheelScrolled);
		window.addEventListener("DOMMouseWheel", this.handler_mouseWheelScrolled);
		var target = NATION.Utils.getOffset(this.__DOMElement.querySelector(this.skipTarget)).top;
		NATION.Animation.start(NATION.Utils.getPageElement(), {scrollTop: target}, {duration: 500, easing: "easeInOutQuad"}, this.onAutoScrollComplete.bind(this));
		e.stopPropagation();
		e.preventDefault();
	}

	//------------------------------------------------
	// Stop a scroll in progress
	//------------------------------------------------
	WorkView.prototype.onMouseWheelScrolled = function(e) {
		this.onAutoScrollComplete(e);
	}

	//------------------------------------------------
	// Stop listening for the user interupting an 
	// auto-scroll that has just finished
	//------------------------------------------------
	WorkView.prototype.onAutoScrollComplete = function(e) {
		window.removeEventListener("wheel", this.handler_mouseWheelScrolled);
		window.removeEventListener("DOMMouseWheel", this.handler_mouseWheelScrolled);
		NATION.Animation.stop(NATION.Utils.getPageElement());
	}

	window.NATION2016.views.WorkView = WorkView;

}(window, document, undefined));