//////////////////////////////////////////////////////////////////////////////
// Snowbeat 2016
// View that controls the footer
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("SNOWBEAT.views");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var FooterView = function(selector) {
		NATION.EventDispatcher.call(this);
		this.__DOMElement = selector;
	}

	//------------------------------------------------
	// Extend the EventDispatcher class
	//------------------------------------------------
	FooterView.prototype = Object.create(NATION.EventDispatcher.prototype);
	FooterView.prototype.constructor = FooterView;

	//------------------------------------------------
	// Show the dark and minified footer layout
	//------------------------------------------------
	FooterView.prototype.showArticleLayout = function() {
		if (this.__DOMElement.className.search("dark") < 0) {
			this.__DOMElement.className += " dark";
		}
		if (this.__DOMElement.className.search("minified") < 0) {
			this.__DOMElement.className += " minified";
		}
	}

	//------------------------------------------------
	// Show the normal light footer
	//------------------------------------------------
	FooterView.prototype.showNormalLayout = function() {
		this.__DOMElement.className = this.__DOMElement.className.replace(/ dark|dark| minified|minified/gi, "");
	}

	SNOWBEAT.views.FooterView = FooterView;
	
}(window, document, undefined));