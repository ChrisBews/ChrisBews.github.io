//////////////////////////////////////////////////////////////////////////////
// Snowbeat 2016
// Global Event Names
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("SNOWBEAT.models");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var Events = {
		SECTION_EXPAND_REQUESTED: "SectionExpandRequested",
		SECTION_SHRINK_REQUESTED: "SectionShrinkRequested",
		URL_CHANGED: "URLChanged"
	};

	SNOWBEAT.models.Events = Events;

}(window, document, undefined));