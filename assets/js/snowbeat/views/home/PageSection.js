//////////////////////////////////////////////////////////////////////////////
// Snowbeat 2016
// Regular section on the homepage
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("SNOWBEAT.views.home");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var PageSection = function(selector) {
		NATION.EventDispatcher.call(this);
		this.__DOMElement = selector;
		this.transitionEasing = "easeInOutQuad";
		this.transitionDuration = 600;
	}

	//------------------------------------------------
	// Extend the EventDispatcher class
	//------------------------------------------------
	PageSection.prototype = Object.create(NATION.EventDispatcher.prototype);
	PageSection.prototype.constructor = PageSection;

	//------------------------------------------------
	// 
	//------------------------------------------------
	PageSection.prototype.expand = function(immediate) {
		var fullHeight = this.__DOMElement.children[0].clientHeight;
		if (!immediate) {
			NATION.Animation.start(this.__DOMElement, {height: fullHeight}, {jsMode: true, duration: this.transitionDuration, easing: this.transitionEasing}, this.onExpandComplete.bind(this));
		} else {
			this.onExpandComplete();
		}
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	PageSection.prototype.shrink = function(immediate) {
		if (!immediate) {
			NATION.Animation.start(this.__DOMElement, {height: 0}, {jsMode: true, duration: this.transitionDuration, easing: this.transitionEasing});
		} else {
			this.__DOMElement.style.height = 0;
		}
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	PageSection.prototype.onExpandComplete = function() {
		this.__DOMElement.style.removeProperty("height");
	}

	SNOWBEAT.views.home.PageSection = PageSection;

}(window, document, undefined));