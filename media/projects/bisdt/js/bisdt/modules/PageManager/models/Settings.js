// Create applications
NATION.Utils.createNamespace("BISDT.modules.PageManager.models");

BISDT.modules.PageManager.models.Settings = (function() {
	
	"use strict";

	//------------------------------------------------
	// All settings are public
	//------------------------------------------------
	return {
		smallLayoutVisible: false,
		// Fully aware of this nasty line.
		// Need to chat through MSMouseUp event when
		// Bews has the time.
		// More comments on modules/EntrySlideshow/Controller.js line 168
		IS_IE: (/IEMobile/i.test(navigator.userAgent)),
		IS_MOBILE: (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
	};

}());