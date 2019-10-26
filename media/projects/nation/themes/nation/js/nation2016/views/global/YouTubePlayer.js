//////////////////////////////////////////////////////////////////////////////
// Nation Website 2016
// Version of the Nation lib's StandardYouTube player, just with different controls
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("NATION2016.views.global");

	var YouTubePlayer = function(selector, options, controlsOptions) {
		NATION.video.StandardYouTubePlayer.call(this, selector, options, controlsOptions);
	}

	YouTubePlayer.prototype = Object.create(NATION.video.StandardYouTubePlayer.prototype);
	YouTubePlayer.prototype.constructor = YouTubePlayer;

	//------------------------------------------------
	// Use custom controls to have a different show/hide animation
	//------------------------------------------------
	YouTubePlayer.prototype.createControls = function() {
		this.controls = new NATION2016.views.global.VideoControls(this.__DOMElement.querySelector(".js-controls-container, .controls-container"), this.controlsOptions);
		if (this.options.mute) {
			this.controls.showUnMuteButton();
		}
	}

	window.NATION2016.views.global.YouTubePlayer = YouTubePlayer;

}(window, document, undefined));