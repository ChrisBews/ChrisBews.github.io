//////////////////////////////////////////////////////////////////////////////
// Nation Website 2016
// Version of the Nation lib's StandardVideoPlayer with different controls
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("NATION2016.views.global");

	var LocalVideoPlayer = function(selector, options, controlsOptions) {
		NATION.video.StandardVideoPlayer.call(this, selector, options, controlsOptions);
	}

	LocalVideoPlayer.prototype = Object.create(NATION.video.StandardVideoPlayer.prototype);
	LocalVideoPlayer.prototype.constructor = LocalVideoPlayer;

	//------------------------------------------------
	// Use custom controls to have a different show/hide animation
	//------------------------------------------------
	LocalVideoPlayer.prototype.createControls = function() {
		this.controls = new NATION2016.views.global.VideoControls(this.__DOMElement.querySelector(".js-controls-container, .controls-container"), this.controlsOptions);
		if (this.options.mute) {
			this.controls.showUnMuteButton();
		}
	}

	window.NATION2016.views.global.LocalVideoPlayer = LocalVideoPlayer;

}(window, document, undefined));