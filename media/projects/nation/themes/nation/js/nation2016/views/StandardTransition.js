//////////////////////////////////////////////////////////////////////////////
// Nation Website 2016
// The main swipe transition between pages
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("NATION2016.views");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var StandardTransition = function(element) {
		NATION.EventDispatcher.call(this);
		this.__DOMElement = element;
		// Store references to key elements
		this.__leftNarrow = this.__DOMElement.querySelector(".js-left-narrow");
		this.__leftWideInner = this.__DOMElement.querySelector(".js-left-wide .inner");
		this.__leftNarrowInner = this.__DOMElement.querySelector(".js-left-narrow .inner");
		this.__leftWide = this.__DOMElement.querySelector(".js-left-wide");
		this.__overlay = this.__DOMElement.querySelector(".js-overlay");
		this.__overlayEnd = this.__DOMElement.querySelector(".js-overlay-end");
		this.__pageFade = this.__DOMElement.querySelector(".js-page-fade");
		this.__logo = this.__DOMElement.querySelector(".js-logo");
		this.__logoPathWhite = this.__DOMElement.querySelector(".js-logo-path-white");
		this.__logoPathColored = this.__DOMElement.querySelector(".js-logo-path-color");
		this.__bubbleContainer = this.__DOMElement.querySelector(".js-bubble-container");
		this.__bubble = this.__DOMElement.querySelector(".js-bubble");
		this.animating = false;
		this.showing = false;
		this.hiding = false;
		this.showComplete = false;
		this.hideRequested = false;
		this.showRequested = false;
		this.logoTimer = null;
		this.bubbleTimer = null;
		this.showDirection = "";
		this.requestedDirection = "";
		this.setup();
	}

	StandardTransition.prototype = Object.create(NATION.EventDispatcher.prototype);
	StandardTransition.prototype.constructor = StandardTransition;

	//------------------------------------------------
	// Constants
	//------------------------------------------------
	StandardTransition.prototype.FLAG_LOOP_DELAY = 1000;
	StandardTransition.prototype.DIRECTION_LEFT = "DirectionLeft";
	StandardTransition.prototype.DIRECTION_RIGHT = "DirectionRight";
	StandardTransition.prototype.DIRECTION_DOWN = "DirectionDown";
	StandardTransition.prototype.DIRECTION_UP = "DirectionUp";

	//------------------------------------------------
	// Returns true if transition is in progress
	//------------------------------------------------
	StandardTransition.prototype.isAnimating = function() {
		return this.animating;
	}

	//------------------------------------------------
	// Returns true if the transition is fully covering
	// the browser window
	//------------------------------------------------
	StandardTransition.prototype.isShowComplete = function() {
		return this.showComplete;
	}

	//------------------------------------------------
	// Animate the transition in so that it's covering
	// the browser window
	//------------------------------------------------
	StandardTransition.prototype.show = function(direction) {
		// Default to moving left
		direction = direction || this.DIRECTION_LEFT;
		if (!this.showing && !this.hiding) {
			this.showDirection = direction;
			this.animating = true;
			this.showing = true;
			this.showComplete = false;
			this.hideRequested = false;
			var duration = 300;
			var easing = "easeInOutQuad";
			this.__DOMElement.style.display = "block";
			this.__logo.style.opacity = 1;
			this.__logo.style.display = "none";

			var leftWideInnerStart, leftWideInnerEnd, overlayEndStart, leftNarrowStart, leftNarrowEnd, leftNarrowInner, leftWideStart, leftWideEnd, overlayStart, overlayEnd;
			if (direction === this.DIRECTION_LEFT) {
				// Move left
				leftWideInnerStart = {
					transform: "scaleX(0.2) scaleY(1)",
					bottom: 0,
					right: "auto",
					width: 62,
					height: "auto"
				};
				leftWideInnerEnd = "scaleX(2) scaleY(1)";
				overlayEndStart = "translateX(100%) translateY(0)";
				leftNarrowStart = {
					transform: "translateX(-10%) translateY(0)"
				}
				leftNarrowEnd = "translateX(45%) translateY(0)";
				leftWideStart = "translateX(-62px) translateY(0)";
				leftWideEnd = "translateX(50%) translateY(0)";
				overlayStart = "translateX(100%) translateY(0)";
				overlayEnd = "translateX(0) translateY(0)";
				leftNarrowInner = {
					bottom: 0,
					right: "auto",
					width: 5,
					height: "auto",
					transform: "translateX(-10%) translateY(0)"
				}
			} else if (direction === this.DIRECTION_RIGHT) {
				// Move right
				leftWideInnerStart = {
					transform: "scaleX(0.2) scaleY(1)",
					bottom: 0,
					right: "auto",
					width: 62,
					height: "auto"
				};
				leftWideInnerEnd = "scaleX(2) scaleY(1)";
				overlayEndStart = "translateX(-100%) translateY(0)";
				leftNarrowStart = {
					transform: "translateX(110%) translateY(0)"
				};
				leftNarrowEnd = "translateX(55%) translateY(0)";
				leftWideStart = "translateX(" + (this.__leftWide.clientWidth + 62) + "px) translateY(0)";
				leftWideEnd = "translateX(50%) translateY(0)";
				overlayStart = "translateX(-100%) translateY(0)";
				overlayEnd = "translateX(0) translateY(0)";
				leftNarrowInner = {
					bottom: 0,
					right: "auto",
					width: 5,
					height: "auto",
					transform: "translateX(-10%) translateY(0)"
				}
			} else if (direction === this.DIRECTION_UP) {
				// Move up
				leftWideInnerStart = {
					transform: "scaleX(1) scaleY(0.2)",
					bottom: "auto",
					right: 0,
					width: "auto",
					height: 62
				};
				leftWideInnerEnd = "scaleX(1) scaleY(2)";
				overlayEndStart = "translateX(0) translateY(100%)";
				leftNarrowStart = {
					transform: "translateX(0) translateY(-10%)"
				};
				leftNarrowEnd = "translateX(0) translateY(55%)";
				leftWideStart = "translateX(0) translateY(-62px)";
				leftWideEnd = "translateX(0) translateY(50%)";
				overlayStart = "translateX(0) translateY(100%)";
				overlayEnd = "translateX(0) translateY(0)";
				leftNarrowInner = {
					bottom: "auto",
					right: 0,
					width: "100%",
					height: 5,
					transform: "translateX(0) translateY(-10%)"
				}
			} else {
				// Move down
				leftWideInnerStart = {
					transform: "scaleX(1) scaleY(0.2)",
					bottom: "auto",
					right: 0,
					width: "auto",
					height: 62
				};
				leftWideInnerEnd = "scaleX(1) scaleY(2)";
				overlayEndStart = "translateX(0) translateY(100%)";
				leftNarrowStart = {
					transform: "translateX(0) translateY(110%)"
				};
				leftNarrowEnd = "translateX(0) translateY(45%)";
				leftWideStart = "translateX(0) translateY(" + (this.__leftWide.clientHeight + 62) + "px)";
				leftWideEnd = "translateX(0) translateY(50%)";
				overlayStart = "translateX(0) translateY(-100%)";
				overlayEnd = "translateX(0) translateY(0)";
				leftNarrowInner = {
					bottom: "auto",
					right: 0,
					width: "100%",
					height: 5,
					transform: "translateX(0) translateY(-10%)"
				}
			}

			// Wide left bar goes from thin to wide over time
			NATION.Utils.setStyle(this.__leftWideInner, leftWideInnerStart);
			NATION.Animation.start(this.__leftWideInner, {transform: leftWideInnerEnd}, {duration: duration, easing: easing});

			NATION.Utils.setStyle(this.__leftNarrowInner, leftNarrowInner);
			// Set the starting position and animate so that the transition covers the screen
			// Overlay end (green bit) isn't needed here, so is fully hidden
			NATION.Utils.setStyle(this.__overlayEnd, {transform: overlayEndStart});

			NATION.Utils.setStyle(this.__leftNarrow, leftNarrowStart);
			NATION.Animation.start(this.__leftNarrow, {transform: leftNarrowEnd}, {duration: duration, easing: easing});

			// LeftWide starts at 62px width, so it's moved out of view by that amount
			NATION.Utils.setStyle(this.__leftWide, {transform: leftWideStart});
			NATION.Animation.start(this.__leftWide, {transform: leftWideEnd}, {duration: duration, easing: easing});

			NATION.Utils.setStyle(this.__overlay, {transform: overlayStart});
			NATION.Animation.start(this.__overlay, {transform: overlayEnd}, {duration: duration, easing: easing}, this.onShowComplete.bind(this));
		} else {
			this.showRequested = true;
			this.requestedDirection = direction;
		}
	}

	//------------------------------------------------
	// Second half of the transition, where it's hidden again
	// revealing the new page
	//------------------------------------------------
	StandardTransition.prototype.hide = function() {
		var direction = this.showDirection || this.DIRECTION_LEFT;
		if (!this.hiding && !this.showing) {
			this.animating = true;
			this.showComplete = false;
			this.hiding = true;
			this.showRequested = false;
			this.hideRequested = false;

			// Stop waiting to animate the flag loop
			if (this.flagTimer) {
				clearTimeout(this.flagTimer);
				this.flagTimer = null;
			}

			var duration = 400;
			var easing = "easeInQuad";
			if (this.logoTimer) {
				clearTimeout(this.logoTimer);
				this.logoTimer = null;
			}
			if (this.bubbleTimer) {
				clearTimeout(this.bubbleTimer);
				this.bubbleTimer = null;
			}
			// Stop the looping flag animation
			NATION.Animation.stop(this.__logoPathColored);
			NATION.Animation.stop(this.__logoPathWhite);
			NATION.Animation.stop(this.__bubbleContainer);
			NATION.Animation.stop(this.__bubble);
			NATION.Utils.setStyle(this.__bubbleContainer, {transform: "scale(0)"});
			// Fade out the flag logo
			NATION.Animation.start(this.__logo, {opacity: 0}, {duration: 300, bounce: false});
			
			// Fader should be fully visible, ready to fade out
			NATION.Utils.setStyle(this.__pageFade, {opacity: 1});

			// Set the direction variables for start and end positions where required
			// This is based on the 'direction' variable, which is whatever direction the
			// last 'show' animation was moving in
			var overlayEnd, overlayEndStart, overlayEndEnd, leftNarrowStart, leftWideStart, leftWideInnerStart;
			if (direction === this.DIRECTION_LEFT) {
				// Keep moving left
				overlayEnd = "translateX(-120%) translateY(0)";
				overlayEndStart = "translateX(0) translateY(0)";
				overlayEndEnd = "translateX(-100%) translateY(0)";
				leftNarrowStart = {
					transform: "translateX(110%) translateY(0)"
				};
				leftWideStart = "translateX(-62px) translateY(0)";
				leftWideInnerStart = {
					transform: "scaleX(0.2) scaleY(1)",
					bottom: 0,
					right: "auto",
					width: 62,
					height: "auto"
				};
			} else if (direction === this.DIRECTION_RIGHT) {
				// Keep moving right
				overlayEnd = "translateX(120%) translateY(0)";
				overlayEndStart = "translateX(0) translateY(0)";
				overlayEndEnd = "translateX(100%) translateY(0)";
				leftNarrowStart = {
					transform: "translateX(110%) translateY(0)"
				};
				leftWideStart = "translateX(" + (this.__leftWide.clientWidth + 62) + "px) translateY(0)";
				leftWideInnerStart = {
					transform: "scaleX(0.2) scaleY(1)",
					bottom: 0,
					right: "auto",
					width: 62,
					height: "auto"
				};
			} else if (direction === this.DIRECTION_UP) {
				// Keep moving up
				overlayEnd = "translateX(0) translateY(-120%)";
				overlayEndStart = "translateX(0) translateY(0)";
				overlayEndEnd = "translateX(0) translateY(-100%)";
				leftNarrowStart = {
					transform: "translateX(0) translateY(-10%)"
				};
				leftWideStart = "translateX(0) translateY(-62px)";
				leftWideInnerStart = {
					transform: "scaleX(1) scaleY(0.2)",
					bottom: "auto",
					right: 0,
					width: "auto",
					height: 62
				};
			} else {
				// Keep moving down
				overlayEnd = "translateX(0) translateY(120%)";
				overlayEndStart = "translateX(0) translateY(0)";
				overlayEndEnd = "translateX(0) translateY(100%)";
				leftNarrowStart = {
					transform: "translateX(0) translateY(110%)"
				};
				leftWideStart = "translateX(0) translateY(" + (this.__leftWide.clientHeight + 62) + "px)";
				leftWideInnerStart = {
					transform: "scaleX(1) scaleY(0.2)",
					bottom: "auto",
					right: 0,
					width: "auto",
					height: 62
				};
			}

			// Set the starting position of the various bits of the bg
			NATION.Utils.setStyle(this.__leftNarrow, leftNarrowStart);
			NATION.Utils.setStyle(this.__leftWide, {transform: leftWideStart});
			NATION.Utils.setStyle(this.__leftWideInner, leftWideInnerStart);


			NATION.Utils.setStyle(this.__overlayEnd, {transform: overlayEndStart});
			NATION.Animation.stop(this.__overlay);
			// Fade out the white overlay
			NATION.Animation.start(this.__pageFade, {opacity: 0}, {delay: 250, duration: duration-100, easing: easing});
			// Animate the overlay out
			NATION.Animation.start(this.__overlay, {transform: overlayEnd}, {duration: duration, easing: easing});
			NATION.Animation.start(this.__overlayEnd, {transform: overlayEndEnd}, {delay: 250, duration: duration-100, easing: easing}, this.onHideComplete.bind(this));
		} else if (this.showing) {
			// Show animation is still in progress, wait until it's finished first
			this.hideRequested = true;
		}
	}

	//------------------------------------------------
	// Set overlay starting position (off-screen)
	//------------------------------------------------
	StandardTransition.prototype.setup = function() {
		NATION.Utils.setStyle(this.__overlay, {transform: "translateX(100%)"});
	}

	//------------------------------------------------
	// Start the looping flag animation after a delay
	//------------------------------------------------
	StandardTransition.prototype.onShowComplete = function() {
		this.animating = false;
		this.showing = false;
		this.hiding = false;
		this.showComplete = true;
		// If hide was already requested, start hiding now
		if (this.hideRequested) {
			this.hideRequested = false;
			this.hide();
		} else {
			// Otherwise start the looping logo animation after a delay
			this.handler_flagTimerTicked = this.onFlagTimerTicked.bind(this);
			this.flagTimer = setTimeout(this.handler_flagTimerTicked, this.FLAG_LOOP_DELAY);
		}
		this.trigger(NATION2016.Events.SHOW_COMPLETE);
	}

	//------------------------------------------------
	// Start the looping flag animation
	//------------------------------------------------
	StandardTransition.prototype.onFlagTimerTicked = function() {
		this.speedDivision = 0.7;
		this.__logo.style.display = "block";
		this.__logoPathColored.style.display = "none";
		var scope = this;
		// Show the green version after a delay
		this.logoTimer = setTimeout(function() {
			scope.__logoPathColored.style.display = "block";
		}, 190/this.speedDivision);
		// Set starting positions
		this.__logoPathColored.style.strokeDasharray = "1, 200";
		this.__logoPathColored.style.strokeDashoffset = "0";
		this.__logoPathWhite.style.strokeDasharray = "1, 200";
		this.__logoPathWhite.style.strokeDashoffset = "0";
		// Animate using strokeDasharray and strokeDashoffset, standard SVG line animation stuff
		NATION.Animation.start(this.__logoPathColored, {strokeDasharray: "450, 700", strokeDashoffset: -this.__logoPathColored.getTotalLength()-350}, {jsMode: true, delay: 150/this.speedDivision, duration: 1000/this.speedDivision, easing: "linear", loop: true});
		NATION.Animation.start(this.__logoPathWhite, {strokeDasharray: "150, 700", strokeDashoffset: -this.__logoPathWhite.getTotalLength()-350}, {jsMode: true, duration: 1000/this.speedDivision, easing: "linear", loop: true, loopComplete: this.onFlagLoopComplete.bind(this)});
		this.onFlagLoopComplete();
	}

	//------------------------------------------------
	// Play the bubble pop animation at the right time
	//------------------------------------------------
	StandardTransition.prototype.onFlagLoopComplete = function() {
		this.bubbleTimer = setTimeout(this.animateBubble.bind(this), 250/this.speedDivision);
	}

	//------------------------------------------------
	// Animate a bubble pop in the corner of the flag
	//------------------------------------------------
	StandardTransition.prototype.animateBubble = function() {
		NATION.Utils.setStyle(this.__bubbleContainer, {transform: "scale(0)"});
		NATION.Animation.start(this.__bubbleContainer, {transform: "scale(3)"}, {duration: 300, easing: "easeOutQuad"});

		NATION.Utils.setStyle(this.__bubble, {strokeWidth: 4});
		NATION.Animation.start(this.__bubble, {strokeWidth: 0}, {duration: 300, easing: "easeOutQuad"});
	}

	//------------------------------------------------
	// Signal that hide animation has finished
	//------------------------------------------------
	StandardTransition.prototype.onHideComplete = function() {
		this.animating = false;
		this.hiding = false;
		this.showing = false;
		this.showComplete = false;
		this.__DOMElement.style.display = "none";
		// If a show was requested during the hide animation, start that now
		if (this.showRequested) {
			this.showRequested = false;
			// Pass the direction that was originally requested
			this.show(this.requestedDirection);
		} else {
			// Otherwise just signal that the transition has finished hiding
			this.trigger(NATION2016.Events.HIDE_COMPLETE);
		}
	}

	window.NATION2016.views.StandardTransition = StandardTransition;

}(window, document, undefined));