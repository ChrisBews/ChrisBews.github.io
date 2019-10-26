//////////////////////////////////////////////////////////////////////////////
// Nation Website 2016
// Version of the Nation lib's MediaControls, just with a different show/hide
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("NATION2016.views.global");

	var VideoControls = function(selector, options) {
		NATION.MediaControls.call(this, selector, options);
	}

	VideoControls.prototype = Object.create(NATION.MediaControls.prototype);
	VideoControls.prototype.constructor = VideoControls;

	//------------------------------------------------
	// Show the controls by moving them up out of hiding
	//------------------------------------------------
	VideoControls.prototype.show = function() {
		this.controlsShowing = true;
		NATION.Animation.start(this.__controls, {transform: "translateY(0px)"}, {duration: this.options.duration, easing: this.options.easing});
	}

	//------------------------------------------------
	// Move the controls down so that only the top
	// section is showing
	//------------------------------------------------
	VideoControls.prototype.hide = function() {
		this.controlsShowing = false;
		NATION.Animation.start(this.__controls, {transform: "translateY(" + (this.__controls.clientHeight-6) + "px)"}, {duration: this.options.duration, easing: this.options.easing});
	}

	window.NATION2016.views.global.VideoControls = VideoControls;

}(window, document, undefined));