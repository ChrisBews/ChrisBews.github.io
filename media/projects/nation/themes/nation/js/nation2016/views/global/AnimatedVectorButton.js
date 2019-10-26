//////////////////////////////////////////////////////////////////////////////
// Nation Website 2016
// Animates vector shapes on mouse hover, and resizes the vector to fit the text
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("NATION2016.views.global");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var AnimatedVectorButton = function(element, options) {
		NATION.EventDispatcher.call(this);
		this.__DOMElement = element;
		this.__backgroundShape = null;
		this.__foregroundShape = null;
		this.setup();
	}

	//------------------------------------------------
	// Perform initial setup
	//------------------------------------------------
	AnimatedVectorButton.prototype.setup = function() {
		this.prepareShapes();
		this.createListeners();
	}

	//------------------------------------------------
	// Set each shape to it's starting position, and
	// store the lineLength of one of them for later
	// animation
	//------------------------------------------------
	AnimatedVectorButton.prototype.prepareShapes = function() {
		this.__foregroundShape = this.__DOMElement.querySelector(".js-foreground-shape");
		this.__backgroundShape = this.__DOMElement.querySelector(".js-background-shape");
		this.lineLength = this.__backgroundShape.getTotalLength();
		this.__backgroundShape.style.strokeDasharray = this.lineLength + " " + this.lineLength;
		this.__backgroundShape.style.strokeDashoffset = 0;
		this.__foregroundShape.style.strokeDasharray = this.lineLength + " " + this.lineLength;
		this.__foregroundShape.style.strokeDashoffset = this.lineLength;
	}

	//------------------------------------------------
	// Listen for mouse enter/leave events, to know when
	// to start the line animations
	//------------------------------------------------
	AnimatedVectorButton.prototype.createListeners = function() {
		if (!NATION2016.Settings.TOUCH_DEVICE) {
			// Listen for project button mouse over/outs
			this.handler_projectButtonMouseOver = this.onProjectButtonMouseOver.bind(this);
			this.handler_projectButtonMouseOut = this.onProjectButtonMouseOut.bind(this);
			this.__DOMElement.addEventListener("mouseenter", this.handler_projectButtonMouseOver);
			this.__DOMElement.addEventListener("mouseleave", this.handler_projectButtonMouseOut);
			this.handler_pageLoadComplete = this.onPageLoadComplete.bind(this);
			window.addEventListener("load", this.handler_pageLoadComplete);
		}
	}

	//------------------------------------------------
	// Ensure the bubble wraps around the text properly
	//------------------------------------------------
	AnimatedVectorButton.prototype.resize = function() {
		var buttonWidth = this.__DOMElement.clientWidth - 6;
		var buttonHeight = this.__DOMElement.clientHeight - 4;
		var newPath = "M" + (buttonWidth - 27) + " " + (buttonHeight + 2) + " L 30 " + (buttonHeight + 2) + " C -5 " + (buttonHeight + 2) + ", -5 2, 30, 2 L " + (buttonWidth - 27) + " 2 C " + (buttonWidth + 11) + " 2, " + (buttonWidth + 11) + " " + (buttonHeight + 2) + ", " + (buttonWidth - 27) + " " + (buttonHeight + 2);
		this.__backgroundShape.setAttribute("d", newPath);
		this.__foregroundShape.setAttribute("d", newPath);
		this.prepareShapes();
	}

	//------------------------------------------------
	// Kill this button animation, ready for removal
	//------------------------------------------------
	AnimatedVectorButton.prototype.destroy = function() {
		NATION.Animation.stop(this.__backgroundShape);
		NATION.Animation.stop(this.__foregroundShape);
		if (!NATION2016.Settings.TOUCH_DEVICE) {
			this.__DOMElement.removeEventListener("mouseenter", this.handler_projectButtonMouseOver);
			this.__DOMElement.removeEventListener("mouseleave", this.handler_projectButtonMouseOut);
			window.removeEventListener("load", this.handler_pageLoadComplete);
		}
	}

	//------------------------------------------------
	// Start animating the button via line animations
	//------------------------------------------------
	AnimatedVectorButton.prototype.onProjectButtonMouseOver = function(e) {
		NATION.Animation.stop(this.__backgroundShape);
		NATION.Animation.stop(this.__foregroundShape);
		this.__foregroundShape.style.strokeDasharray = 0 + " " + this.lineLength;
		this.__foregroundShape.style.strokeDashoffset = 0;
		this.__foregroundShape.style.opacity = 1;
		var scope = this;
		this.foregroundAnimating = true;
		NATION.Animation.start(this.__backgroundShape, {strokeDashoffset: this.lineLength}, {jsMode: true, duration: 250, easing: "easeInOutQuad"});
		// Animate the green outline on a delay after the white one
		NATION.Animation.start(this.__foregroundShape, {strokeDashoffset: this.lineLength+400, strokeDasharray: 200 + " " + this.lineLength}, {jsMode: true, delay: 200, duration: 300, easing: "easeInOutQuad"}, function(e) {
			scope.foregroundAnimating = false;
			e.target.style.strokeDasharray = scope.lineLength + " " + scope.lineLength;
			e.target.style.strokeDashoffset = 0;
		});
	}

	//------------------------------------------------
	// Snap back to the normal button state on mouse out
	// No animation is played here for immediacy
	//------------------------------------------------
	AnimatedVectorButton.prototype.onProjectButtonMouseOut = function(e) {
		NATION.Animation.stop(this.__backgroundShape);
		NATION.Animation.stop(this.__foregroundShape);
		this.__backgroundShape.style.strokeDashoffset = 0;
		if (this.foregroundAnimating) {
			// If over animation was in progress, a fade would look pretty bad, so just instantly hide it
			this.onForegroundHidden();
		} else {
			NATION.Animation.start(this.__foregroundShape, {opacity: 0}, {duration: 150}, this.onForegroundHidden.bind(this));
		}
		
	}

	//------------------------------------------------
	// Quickly hide the foreground
	//------------------------------------------------
	AnimatedVectorButton.prototype.onForegroundHidden = function(e) {
		this.__foregroundShape.style.strokeDasharray = "0 " + this.lineLength;
		this.__foregroundShape.style.strokeDashoffset = 0;
		this.foregroundAnimating = false;
	}

	//------------------------------------------------
	// Make sure the butotn adapts to font loads
	//------------------------------------------------
	AnimatedVectorButton.prototype.onPageLoadComplete = function(e) {
		this.resize();
	}

	NATION2016.views.global.AnimatedVectorButton = AnimatedVectorButton;

}(window, document, undefined));