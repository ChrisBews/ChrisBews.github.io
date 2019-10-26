//////////////////////////////////////////////////////////////////////////////
// Nation Website 2016
// Site-wide settings
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("NATION2016.models");

	window.NATION2016.Settings = {
		TOUCH_DEVICE: (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)),
		IS_IE9: (document.body.className.search(/ie9/i) > -1),
		headerHeight: 0,
		fullPanelOffset: 80,
		mobileHeader: false,
		firstPageLoad: true
	};

}(window, document, undefined));