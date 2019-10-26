//////////////////////////////////////////////////////////////////////////////
// Nation Website 2016
// Latest work slideshow
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("NATION2016.views.work");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var WorkSlideshow = function(element, options) {
		this.__DOMElement = element;
		NATION.Slideshow.call(this, element, options);
		this.__flourish = this.__DOMElement.querySelector(".js-flourish");
		this.__customStylesheet = null;
		this.deaultMediaTransform = "translateX(-5%) translateY(-5%)";
		this.currentMediaX = -5;
		this.currentMediaY = -5;
		this.targetMediaX = 0;
		this.targetMediaY = 0;
		this.mouseRequest = null;
		this.projectButtonLength = 0;
		this.animatedButtons = [];
		this.createAnimatedButtons();
		this.createSlideStyles();
		this.setFlourishColors(0, true);
	}

	WorkSlideshow.prototype = Object.create(NATION.Slideshow.prototype);
	WorkSlideshow.prototype.constructor = WorkSlideshow;

	//------------------------------------------------
	// Create an animated vector button for each slide
	//------------------------------------------------
	WorkSlideshow.prototype.createAnimatedButtons = function() {
		var buttonElements = this.__DOMElement.querySelectorAll(".js-project-button");
		var i = 0, length = buttonElements.length;
		for (; i < length; i++) {
			this.animatedButtons.push(new NATION2016.views.global.AnimatedVectorButton(buttonElements[i]));
		}
	}

	//------------------------------------------------
	// Listen for mouse movements to position the active
	// slide's background dynamically in response
	//------------------------------------------------
	WorkSlideshow.prototype.createListeners = function() {
		NATION.Slideshow.prototype.createListeners.call(this);
		if (!NATION2016.Settings.TOUCH_DEVICE) {
			// Listen for mouse move events
			this.handler_mouseMoved = this.onMouseMoved.bind(this);
			this.__DOMElement.addEventListener("mousemove", this.handler_mouseMoved);
			this.onMouseTimerTicked();
		}
	}

	//------------------------------------------------
	// Cleanup before the slideshow is removed from the page
	//------------------------------------------------
	WorkSlideshow.prototype.destroy = function() {
		document.getElementsByTagName("head")[0].removeChild(this.__customStylesheet);
		// Stop any potentially running animations
		var __previousSlideImage = this.__slideElements[this.previousSlideID].querySelector(".js-slide-image");
		NATION.Animation.stop(__previousSlideImage);
		var __nextSlide = this.__slideElements[this.currentSlideID];
		NATION.Animation.stop(__nextSlide);
		var __nextSlideOverlay = __nextSlide.querySelector(".js-overlay");
		NATION.Animation.stop(__nextSlideOverlay);
		// Remove extra listeners
		if (!NATION2016.Settings.TOUCH_DEVICE) {
			this.__DOMElement.removeEventListener("mousemove", this.handler_mouseMoved);
			if (this.mouseRequest) {
				cancelAnimationFrame(this.mouseRequest);
				this.mouseRequest = null;
			}
			var i = 0, length = this.animatedButtons.length;
			for (; i < length; i++) {
				this.animatedButtons[i].destroy();
			}
		}
	}

	//------------------------------------------------
	// Resize each animated button to ensure it wraps
	// correctly around it's text
	//------------------------------------------------
	WorkSlideshow.prototype.resize = function() {
		var i = 0, length = this.animatedButtons.length;
		for (; i < length; i++) {
			this.animatedButtons[i].resize();
		}
	}

	//------------------------------------------------
	// Generate new style rules for each slide's colour scheme
	//------------------------------------------------
	WorkSlideshow.prototype.createSlideStyles = function() {
		var newCSS = "";
		// Create new CSS rules
		var i = 0, length = this.__slideElements.length, primaryColor, summaryBG, summaryCopy, summaryArrow, slideID = 0;
		for (; i < length; i++) {
			slideID = i + 1;
			primaryColor = this.__slideElements[i].getAttribute("data-primary-color");
			summaryBG = this.__slideElements[i].getAttribute("data-summary-bg");
			summaryCopy = this.__slideElements[i].getAttribute("data-summary-copy");
			summaryArrow = this.__slideElements[i].getAttribute("data-summary-arrow");

			// Set new rules for each slide
			newCSS += ".work-latest .js-slide:nth-child(" + slideID + ") .js-primary {\n";
			newCSS += "	color: " + primaryColor + ";\n";
			newCSS += "}\n";
			newCSS += ".work-latest .js-slide:nth-child(" + slideID + ") {\n";
			newCSS += " background: " + summaryBG + ";\n";
			newCSS += "}\n";
			// Set new rules for each project button
			newCSS += ".work-latest .js-slide:nth-child(" + slideID + ") .js-foreground-shape {\n";
			newCSS += " stroke: " + primaryColor + ";\n";
			newCSS += "}\n";
			// Set new rules for the summary background
			newCSS += ".work-latest .js-slide:nth-child(" + slideID + ") .project-summary {\n";
			newCSS += " background: " + summaryBG + ";\n";
			newCSS += "}\n";
			newCSS += ".work-latest .js-slide:nth-child(" + slideID + ") .summary-body {\n";
			newCSS += " color: " + summaryCopy + ";\n";
			newCSS += "}\n";

			// Set new rules for the summary background
			newCSS += ".work-latest .js-slide:nth-child(" + slideID + ") .project-summary .view-details-button:after {\n";
			newCSS += " border-color: " + summaryArrow + ";\n";
			newCSS += "}\n";

			// Set new rules for each pip
			newCSS += ".work-latest .js-pips li:nth-child(" + slideID + ") a:hover,\n";
			newCSS += ".work-latest .js-pips li:nth-child(" + slideID + ") a.active {\n";
			newCSS += "	color: " + primaryColor + ";\n";
			newCSS += "}\n";
			newCSS += ".work-latest .js-pips li:nth-child(" + slideID + ") .active .number:after,";
			newCSS += ".work-latest .js-pips li:nth-child(" + slideID + ") a:hover .number:after {\n";
			newCSS += "	background: " + primaryColor + ";\n";
			newCSS += "}\n";
		}

		this.__customStylesheet = document.createElement("style");
		if (this.__customStylesheet.stylesheet) {
			this.__customStylesheet.stylesheet.cssText = newCSS;
		} else {
			this.__customStylesheet.appendChild(document.createTextNode(newCSS));
		}
		document.getElementsByTagName("head")[0].appendChild(this.__customStylesheet);

		i = 0;
		for (; i < length; i++) {
			// Hide slides except the first one
			if (i > 0) {
				NATION.Utils.setStyle(this.__slideElements[i], {transform: "translateY(100%)"});
			}
		}
	}

	//------------------------------------------------
	// Show a slide specified by slideID
	//------------------------------------------------
	WorkSlideshow.prototype.showSlideByID = function(slideID, reverse, immediate) {
		// NATION.Slideshow.prototype.showSlideByID.call(this, slideID, reverse, immediate);
		if (slideID !== this.currentSlideID && !this.animating) {
			if (!immediate) {
				this.animating = true;
			}
			if (this.autoCycling && this.cycleTimer) {
				clearTimeout(this.cycleTimer);
				this.cycleTimer = null;
			}
			var __previousSlide = this.__slideElements[this.currentSlideID];
			var __nextSlide = this.__slideElements[slideID];
			var __previousSlideImage = __previousSlide.querySelector(".js-slide-image");
			var __nextSlideOverlay = __nextSlide.querySelector(".js-overlay");
			if (!immediate) {
				// Swap slide depths to ensure next slide is on top of previous slide
				NATION.Utils.setStyle(__previousSlide, {transform: "translateY(0)", zIndex: "auto"});
				NATION.Utils.setStyle(__nextSlide, {transform: "translateY(100%)", zIndex: 20});
				// Animate current slide out
				NATION.Utils.setStyle(__previousSlideImage, {transform: "translate(-50%, -50%)"});
				NATION.Animation.start(__previousSlideImage, {transform: "translate(-50%, -57%)"}, {duration: this.options.duration, easing: this.options.easing});
				// Animate new slide in
				NATION.Animation.start(__nextSlide, {transform: "translateY(0)"}, {duration: this.options.duration, easing: this.options.easing});
				// Fade in the overlay after a delay
				NATION.Utils.setStyle(__nextSlideOverlay, {opacity: 0});
				NATION.Animation.start(__nextSlideOverlay, {opacity: 1}, {delay: 250, duration: this.options.duration, easing: this.options.easing}, this.onSlideAnimationComplete.bind(this));
			} else {
				NATION.Utils.setStyle(__previousSlide, {transform: "translateY(100%)", zIndex: "auto"});
				NATION.Utils.setStyle(__nextSlide, {transform: "translateY(0)", zIndex: 20});
			}
			if (this.options.pips) this.updatePips(this.currentSlideID, slideID);
			// Set the new slide as the current one
			this.previousSlideID = this.currentSlideID;
			this.currentSlideID = slideID;
			// Get next slide into the right position for the mouse
			this.positionSlideMedia();

			this.setFlourishColors(slideID);
			this.trigger(this.SLIDE_CHANGE);
		}
	}

	//------------------------------------------------
	// Animate the flourish to the new slide's colour
	// scheme, or fade it out if it's not needed for
	// the current slide
	//------------------------------------------------
	WorkSlideshow.prototype.setFlourishColors = function(slideID, immediate) {
		var __slide = this.__slideElements[slideID];
		// If the next slide should show the flourish
		if (__slide.getAttribute("data-has-flourish")) {
			var primaryColor = __slide.getAttribute("data-primary-color");
			// Set fill colours where needed
			var __graphics = this.__flourish.querySelectorAll(".js-flourish-graphic");
			for (var i = 0, length = __graphics.length; i < length; i++) {
				if (!immediate) {
					NATION.Animation.start(__graphics[i], {fill: primaryColor}, {duration: 500});
				} else {
					__graphics[i].style.fill = primaryColor;
				}
			}

			// Set stroke colours where needed
			if (!immediate) {
				NATION.Animation.start(this.__flourish.querySelector(".js-flourish-line"), {stroke: primaryColor}, {duration: 500});
			} else {
				this.__flourish.querySelector(".js-flourish-line").style.stroke = primaryColor;
			}

			// Fade flourish back in if needed
			if (this.__flourish.style.opacity !== 1) {
				if (!immediate) {
					NATION.Animation.start(this.__flourish, {opacity: 1}, {duration: 300});
				} else {
					this.__flourish.style.opacity = 1;
				}
			}
		} else {
			// If flourish is not needed for this slide, fade it out
			if (this.__flourish.style.opacity !== 0) {
				if (!immediate) {
					NATION.Animation.start(this.__flourish, {opacity: 0}, {duration: 300});
				} else {
					this.__flourish.style.opacity = 0;
				}
			}
		}
	}

	//------------------------------------------------
	// Stop animation of the flourish elements
	//------------------------------------------------
	WorkSlideshow.prototype.stopFlourishAnimations = function() {
		var __graphics = this.__flourish.querySelectorAll(".js-flourish-graphic");
		for (var i = 0, length = __graphics.length; i < length; i++) {
			NATION.Animation.stop(__graphics[i]);
		}
		NATION.Animation.stop(this.__flourish.querySelector(".js-flourish-line"));
		NATION.Animation.stop(this.__flourish.querySelector(".js-flourish-line"));
		NATION.Animation.stop(this.__flourish);
	}

	//------------------------------------------------
	// Reset the previous slide's state
	//------------------------------------------------
	WorkSlideshow.prototype.onSlideAnimationComplete = function(e) {
		NATION.Slideshow.prototype.onSlideAnimationComplete.call(this, e);
		var __previousSlideImage = this.__slideElements[this.previousSlideID].querySelector(".js-slide-image");
		NATION.Utils.setStyle(__previousSlideImage, {transform: "translate(-50%, -50%)"});
		NATION.Utils.setStyle(this.__slideElements[this.previousSlideID], {transform: "translateY(100%)"});
		var previousSlideMedia = this.__slideElements[this.previousSlideID].querySelector(".js-media");
		NATION.Utils.setStyle(previousSlideMedia, {transform: this.deaultMediaTransform});
	}

	//------------------------------------------------
	// Work out the new target position for the active
	// slide's background image
	//------------------------------------------------
	WorkSlideshow.prototype.onMouseMoved = function(e) {
		if (!this.animating) {
			var percentageX = e.pageX / this.__DOMElement.offsetWidth;
			var percentageY = e.pageY / this.__DOMElement.offsetHeight;
			// Images are at 110% width/height
			var newX = -(percentageX * 5);
			var newY = -(percentageY * 5);

			this.targetMediaX = newX;
			this.targetMediaY = newY;
		}
	}

	//------------------------------------------------
	// Ease towards the target position for the slide image
	//------------------------------------------------
	WorkSlideshow.prototype.onMouseTimerTicked = function() {
		if (!this.animating) {
			var diffX = (this.targetMediaX - this.currentMediaX)/10;
			var diffY = (this.targetMediaY - this.currentMediaY)/10;
			this.currentMediaX = Math.round((this.currentMediaX + diffX) * 1000) / 1000;
			this.currentMediaY = Math.round((this.currentMediaY + diffY) * 1000) / 1000;
			// Actually positon the image
			this.positionSlideMedia();
		}
		// Reposition again on the next frame
		this.mouseRequest = requestAnimationFrame(this.onMouseTimerTicked.bind(this));
	}

	//------------------------------------------------
	// Set the new position of the slide's background
	// image as it gradually moves towards the new
	// target position
	//------------------------------------------------
	WorkSlideshow.prototype.positionSlideMedia = function() {
		var activeSlide = this.__slideElements[this.currentSlideID].querySelector(".js-media");
		NATION.Utils.setStyle(activeSlide, {transform: "translateX(" + this.currentMediaX + "%) translateY(" + this.currentMediaY + "%)"});
	}

	//------------------------------------------------
	// Clear changed styles on the current slide
	//------------------------------------------------
	WorkSlideshow.prototype.resetSlideMedia = function(immediate, duration, easing) {
		var activeSlideMedia = this.__slideElements[this.currentSlideID].querySelector(".js-media");
		if (!immediate) {
			NATION.Animation.start(activeSlideMedia, {transform: this.deaultMediaTransform}, {duration: duration, easing: easing});
		} else {
			NATION.Utils.setStyle(activeSlideMedia, {transform: this.deaultMediaTransform});
		}
		if (this.mouseRequest) {
			cancelAnimationFrame(this.mouseRequest);
			this.mouseRequest = null;
		}
	}

	window.NATION2016.views.work.WorkSlideshow = WorkSlideshow;

}(window, document, undefined));