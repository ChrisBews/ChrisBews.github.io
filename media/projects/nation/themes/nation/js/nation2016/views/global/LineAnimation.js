//////////////////////////////////////////////////////////////////////////////
// Nation Website 2016
// Class to control the animation of line drawings
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("NATION2016.views.global");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var LineAnimation = function(element, options) {
		NATION.EventDispatcher.call(this);
		this.__DOMElement = element;
		this.options = options;
		this.__paths = [];
		this.__bouncers = [];
		this.bounceOffsets = [];
		this.bounceDelays = [];
		this.bounceStrokeWidths = [];
		this.pathDelays = [];
		this.strokeWidths = [];
		this.pathReversed = [];
		this.__bubbles = [];
		this.bubbleDelays = [];
		this.bubbleRadii = [];
		this.bubbleStrokeWidths = [];
		this.progressedBounces = [];
		this.progressedBubbles = [];
		this.setup();
	}

	LineAnimation.prototype = Object.create(NATION.EventDispatcher.prototype);
	LineAnimation.prototype.constructor = LineAnimation;

	//------------------------------------------------
	// Perform initial setup
	//------------------------------------------------
	LineAnimation.prototype.setup = function() {
		this.preparePaths();
		this.prepareBouncers();
		this.prepareBubbles();
		this.__DOMElement.style.opacity = 1;
	}

	//------------------------------------------------
	// Get each path into it's starting position (fully hidden)
	// and store their delay and strokeWidth
	//------------------------------------------------
	LineAnimation.prototype.preparePaths = function() {
		this.__paths = this.__DOMElement.querySelectorAll("[data-path]");
		this.pathDelays = [];
		this.strokeWidths = [];
		this.pathReversed = [];
		var i = 0, length = this.__paths.length, path, pathLength, delay;
		for (; i < length; i++) {
			path = this.__paths[i];
			delay = (path.getAttribute("data-delay")) ? parseInt(path.getAttribute("data-delay"), 10) : 0;
			this.pathDelays.push(delay);
			pathLength = path.getTotalLength();
			this.pathReversed.push((path.getAttribute("data-reverse") ? true : false));
			path.style.strokeDasharray = (pathLength) + " " + (pathLength);
			path.style.strokeDashoffset = pathLength;
			this.strokeWidths.push(NATION.Utils.getStyle(path, "strokeWidth"));
			path.style.strokeWidth = 0;
		}
	}

	//------------------------------------------------
	// Get each bouncing element's offsets and delay,
	// and store them for layer use
	//------------------------------------------------
	LineAnimation.prototype.prepareBouncers = function() {
		this.__bouncers = this.__DOMElement.querySelectorAll("[data-bouncer]");
		this.bounceStrokeWidths = [];
		this.bounceOffsets = [];
		this.bounceDelays = [];
		var i = 0, length = this.__bouncers.length, offsetX, offsetY, delay;
		for (; i < length; i++) {
			this.bounceStrokeWidths.push(NATION.Utils.getStyle(this.__bouncers[i], "strokeWidth"));
			this.__bouncers[i].style.strokeWidth = 0;
			offsetX = this.__bouncers[i].getAttribute("data-offset-x");
			if (!offsetX) offsetX = "0";
			offsetY = this.__bouncers[i].getAttribute("data-offset-y");
			if (!offsetY) offsetY = "0";
			this.bounceOffsets.push(offsetX + "px, " + offsetY + "px");
			delay = this.__bouncers[i].getAttribute("data-delay");
			if (!delay) delay = 0;
			this.bounceDelays.push(parseInt(delay, 10));
		}
	}

	//------------------------------------------------
	// Get bubbles into their starting positions,
	// and store their delay and radius
	//------------------------------------------------
	LineAnimation.prototype.prepareBubbles = function() {
		this.__bubbles = this.__DOMElement.querySelectorAll("[data-bubble]");
		this.bubbleStrokeWidths = [];
		this.bubbleDelays = [];
		this.bubbleRadii = [];
		var i = 0, length = this.__bubbles.length, delay;
		for (; i < length; i++) {
			this.bubbleStrokeWidths.push(NATION.Utils.getStyle(this.__bubbles[i], "strokeWidth"));
			delay = this.__bubbles[i].getAttribute("data-delay");
			if (!delay) delay = 0;
			// Store this bubble's time delay
			this.bubbleDelays.push(delay);
			// Store this bubble's radius for later animation
			this.bubbleRadii.push(parseInt(this.__bubbles[i].getAttribute("r"), 10));
			this.__bubbles[i].style.strokeWidth = 0;
			this.__bubbles[i].setAttribute("r", 0);
		}
	}

	//------------------------------------------------
	// Start the line animation (or skip straight to 
	// the end state if immediate = true)
	//------------------------------------------------
	LineAnimation.prototype.start = function(immediate) {
		this.progressedBounces = 0;
		this.progressedBubbles = 0;
		var i = 0, length = this.__paths.length, delay = 0, newOffset;
		// Start each line animation
		for (; i < length; i++) {
			delay = this.pathDelays[i];
			newOffset = 0;
			if (this.pathReversed[i]) {
				this.__paths[i].style.strokeDashoffset = -this.__paths[i].getTotalLength();
			}
			if (!immediate) {
				NATION.Animation.start(this.__paths[i], {strokeWidth: this.strokeWidths[i], strokeDashoffset: newOffset}, {jsMode: true, delay: delay, duration: this.options.duration, easing: this.options.easing});
			} else {
				NATION.Utils.setStyle(this.__paths[i], {
					strokeWidth: this.strokeWidths[i],
					strokeDashoffset: 0
				});
			}
		}
		i = 0; length = this.__bouncers.length;
		// Start each bounce animation, factoring in their delays
		for (; i < length; i++) {
			delay = this.bounceDelays[i];
			if (!immediate) {
				NATION.Animation.start(this.__bouncers[i], {strokeWidth: this.bounceStrokeWidths[i]/2, transform: "translate(" + this.bounceOffsets[i] + ")"}, {jsMode: true, delay: delay, duration: 120, easing: "easeInQuad"}, this.onBounceHalfComplete.bind(this));
			} else {
				NATION.Utils.setStyle(this.__bouncers[i], {
					strokeWidth: this.bounceStrokeWidths[i],
					transform: "translate(0, 0)"
				});
			}
		}
		i = 0; length = this.__bubbles.length;
		// Start each bubble animation, factoring in their delays 
		for (; i < length; i++) {
			if (!immediate) {
				NATION.Animation.start(this.__bubbles[i], {strokeWidth: this.bubbleStrokeWidths[i]}, {jsMode: true, delay: this.bubbleDelays[i], duration: 120, easing: "easeInQuad", progress: this.onBubbleProgress.bind(this)}, this.onBubbleHalfComplete.bind(this));
			} else {
				NATION.Utils.setStyle(this.__bubbles[i], {
					strokeWidth: 0,
				});
			}
		}
	}

	//------------------------------------------------
	// Move the bouncing element back to it's starting position
	//------------------------------------------------
	LineAnimation.prototype.onBounceHalfComplete = function(e) {
		NATION.Animation.start(e.target, {strokeWidth: this.bounceStrokeWidths[this.progressedBounces], transform: "translate(0px, 0px)"}, {jsMode: true, duration: 120, easing: "cubic-bezier(0.175, 0.885, 0.22, 1.5)"});
		this.progressedBounces++;
	}

	//------------------------------------------------
	// Animate the radius towards half of it's target radius
	// since we need to start some other stuff half way through
	//------------------------------------------------
	LineAnimation.prototype.onBubbleProgress = function(e, progress) {
		var newRadius = 7.5 * progress;
		e.target.setAttribute("r", newRadius);
	}

	//------------------------------------------------
	// Animate the bubble's stroke to 0, thus hiding it
	//------------------------------------------------
	LineAnimation.prototype.onBubbleHalfComplete = function(e) {
		NATION.Animation.start(e.target, {strokeWidth: 0}, {jsMode: true, duration: 120, easing: "easeOutQuad", progress: this.onBubbleProgressPart2.bind(this)});
		this.progressedBubbles++;
	}

	//------------------------------------------------
	// Animate the bubble to it's full radius now
	//------------------------------------------------
	LineAnimation.prototype.onBubbleProgressPart2 = function(e, progress) {
		var newRadius = 7.5 + (7.5 * progress);
		e.target.setAttribute("r", newRadius);
	}

	//------------------------------------------------
	// Stop any existing animation
	//------------------------------------------------
	LineAnimation.prototype.stop = function() {
		var i =0 , length = this.__paths.length;
		// Stop all line animations
		for (; i < length; i++) {
			NATION.Animation.stop(this.__paths[i]);
		}
		i = 0; length = this.__bouncers.length;
		// Stop all bouncing animations
		for (; i < length; i++) {
			NATION.Animation.stop(this.__bouncers[i]);
		}
		i = 0; length = this.__bubbles.length;
		// Stop all bubble animations
		for (; i < length; i++) {
			NATION.Animation.stop(this.__bubbles[i]);
		}
	}

	//------------------------------------------------
	// Reset the whole animation back to it's starting
	// position, ready to be played again
	//------------------------------------------------
	LineAnimation.prototype.reset = function() {
		this.stop();
		this.preparePaths();
		this.prepareBouncers();
		this.prepareBubbles();
	}

	window.NATION2016.views.global.LineAnimation = LineAnimation;

}(window, document, undefined));