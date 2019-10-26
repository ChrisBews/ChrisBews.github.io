//////////////////////////////////////////////////////////////////////////////
// Nation Website 2016
// '404' page view
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("NATION2016.views");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var ErrorView = function(element) {
		NATION2016.views.BasicPageView.call(this);
		this.__DOMElement = element;
	}

	ErrorView.prototype = Object.create(NATION2016.views.BasicPageView.prototype);
	ErrorView.prototype.constructor = ErrorView;

	//------------------------------------------------
	// 
	//------------------------------------------------
	ErrorView.prototype.build = function(pageData) {
		NATION2016.views.BasicPageView.prototype.build.call(this, pageData, true);
		this.trigger(NATION2016.Events.VIEW_READY);
	}

	window.NATION2016.views.ErrorView = ErrorView;

}(window, document, undefined));