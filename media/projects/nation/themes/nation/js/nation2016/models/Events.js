//////////////////////////////////////////////////////////////////////////////
// Nation Website 2016
// Event Names
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("NATION2016");

	window.NATION2016.Events = {
		PAGE_REQUESTED: "PageRequested",
		PAGE_LOAD_COMPLETE: "ShowSection",
		SHOW_COMPLETE: "ShowComplete",
		HIDE_COMPLETE: "HideComplete",
		VIEW_READY: "ViewReady",
		DIRECTIONS_CLICKED: "DirectionsClicked",
		MAP_READY: "MapReady",
		SUBNAV_SHOWN: "SubnavShown",
		USE_TRANSPARENT_HEADER: "UseTransparentHeader"
	}

}(window, document, undefined));