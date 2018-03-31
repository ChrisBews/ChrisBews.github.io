//////////////////////////////////////////////////////////////////////////////
// Snowbeat 2016
// Foundation for other views
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("SNOWBEAT.views");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var BaseView = function() {
		NATION.EventDispatcher.call(this);
	}

	//------------------------------------------------
	// Extend the EventDispatcher class
	//------------------------------------------------
	BaseView.prototype = Object.create(NATION.EventDispatcher.prototype);
	BaseView.prototype.constructor = BaseView;

	SNOWBEAT.views.BaseView = BaseView;
	
}(window, document, undefined));