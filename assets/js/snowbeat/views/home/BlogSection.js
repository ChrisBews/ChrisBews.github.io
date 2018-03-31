//////////////////////////////////////////////////////////////////////////////
// Snowbeat 2016
// Blog section on the homepage
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("SNOWBEAT.views.home");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var BlogSection = function(selector) {
		NATION.EventDispatcher.call(this);
		this.__DOMElement = selector;
		this.__expandTriggers = [];
		this.__clickedExpandElement = null;
		this.transitionDuration = 600;
		this.transitionEasing = "easeInOutQuad";
		this.pageURL = "";
		this.getElementReferences();
		this.createListeners();
	}

	//------------------------------------------------
	// Extend the EventDispatcher class
	//------------------------------------------------
	BlogSection.prototype = Object.create(NATION.EventDispatcher.prototype);
	BlogSection.prototype.constructor = BlogSection;

	//------------------------------------------------
	// 
	//------------------------------------------------
	BlogSection.prototype.getElementReferences = function() {
		this.__expandTriggers = this.__DOMElement.querySelectorAll(".js-expand-trigger");
		this.__expandableContent = this.__DOMElement.querySelector(".js-expandable-content");
		this.__showOnExpand = this.__DOMElement.querySelectorAll(".js-show-on-expand");
		this.__hideOnExpand = this.__DOMElement.querySelectorAll(".js-hide-on-expand");
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	BlogSection.prototype.createListeners = function() {
		var i = 0, length = this.__expandTriggers.length;
		for (; i < length; i++) {
			this.__expandTriggers[i].addEventListener("click", this.onExpandTriggerClicked.bind(this));
		}
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	BlogSection.prototype.onExpandTriggerClicked = function(e) {
		this.__clickedExpandElement = e.target;
		this.pageURL = e.target.getAttribute("data-url");
		this.trigger(SNOWBEAT.Events.SECTION_EXPAND_REQUESTED);
		e.preventDefault();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	BlogSection.prototype.expand = function(immediate) {
		var expander = this.__expandableContent || this.__DOMElement; 
		var targetY = NATION.Utils.getPosition(expander).top;

		if (!immediate) {
			NATION.Animation.start(expander, {height: expander.children[0].clientHeight}, {jsMode: true, duration: this.transitionDuration, easing: this.transitionEasing});
			NATION.Animation.start(document.documentElement, {scrollTop: targetY}, {duration: this.transitionDuration, easing: this.transitionEasing});
		} else {
			expander.style.height = expander.children[0].clientHeight + "px";
			NATION.Utils.getPageElement().scrollTop = targetY;
		}
		var i = 0, length = this.__hideOnExpand.length;
		if (length > 0) {
			for (; i < length; i++) {
				if (!immediate) {
					NATION.Animation.start(this.__hideOnExpand[i], {opacity: 0}, {duration: this.transitionDuration/2}, function(e) {e.target.style.display = "none";});
				} else {
					this.__hideOnExpand[i].style.opacity = 0;
				}
			}
		}
		i = 0; length = this.__showOnExpand.length;
		if (length > 0) {
			for (; i < length; i++) {
				this.__showOnExpand[i].style.opacity = 0;
				this.__showOnExpand[i].style.display = "inline-block";
				if (!immediate) {
					NATION.Animation.start(this.__showOnExpand[i], {opacity: 1}, {delay: this.transitionDuration/2, duration: this.transitionDuration/2});
				} else {
					this.__showOnExpand[i].style.opacity = 1;
				}
			}
		}
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	BlogSection.prototype.shrink = function(immediate) {
		var expander = this.__expandableContent || this.__DOMElement; 

		if (!immediate) {
			NATION.Animation.start(expander, {height: 0}, {jsMode: true, duration: this.transitionDuration, easing: this.transitionEasing});
			NATION.Animation.start(document.documentElement, {scrollTop: 0}, {duration: this.transitionDuration, easing: this.transitionEasing});
		} else {
			expander.style.removeProperty("height");
			NATION.Utils.getPageElement().scrollTop = 0;
		}
		var i = 0, length = this.__hideOnExpand.length;
		if (length > 0) {
			for (; i < length; i++) {
				if (!immediate) {
					this.__hideOnExpand[i].style.display = "inline-block";
					NATION.Animation.start(this.__hideOnExpand[i], {opacity: 1}, {duration: this.transitionDuration/2});
				} else {
					this.__hideOnExpand[i].style.opacity = 1;
				}
			}
		}
		i = 0; length = this.__showOnExpand.length;
		if (length > 0) {
			for (; i < length; i++) {
				if (!immediate) {
					NATION.Animation.start(this.__showOnExpand[i], {opacity: 0}, {delay: this.transitionDuration/2, duration: this.transitionDuration/2}, this.onShowOnExpandHidden.bind(this));
				} else {
					this.__showOnExpand[i].style.opacity = 0;
					this.onShowOnExpandHidden();
				}
			}
		}
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	BlogSection.prototype.onShowOnExpandHidden = function(e) {
		e.target.style.display = "none";
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	BlogSection.prototype.getPageURL = function() {
		return this.pageURL;
	}

	SNOWBEAT.views.home.BlogSection = BlogSection;

}(window, document, undefined));