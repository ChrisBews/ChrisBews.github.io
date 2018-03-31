// Create applications
NATION.Utils.createNamespace("BISDT.modules.PageManager.models");

BISDT.modules.PageManager.models.Events = (function() {
	
	"use strict";

	//------------------------------------------------
	// All settings are public
	//------------------------------------------------
	return {
		SCROLL_REQUEST: "ScrollRequest",
		CHANGE_URL: "ChangeURL",
		URL_CHANGED: "URLChanged",
		SECTION_CHANGE: "SectionChange"
	};

}());