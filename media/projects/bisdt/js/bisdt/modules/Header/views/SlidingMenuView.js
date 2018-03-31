// Sliding menu

NATION.Utils.createNamespace("BISDT.modules.Header.views");

BISDT.modules.Header.views.SlidingMenuView = function(DOMElement) {
	
	"use strict";
	
	//------------------------------------------------
	// Variables
	//------------------------------------------------
	var isOpen = false;
	var menuLabel = null;
	var closeText = "";
	var openText = "";
	var animating = false;
	var sideMenu = null;
	var overlay = null;
	var panelWidth = 0;
	var menuButtonVisible = false;
	var menuButtonWasVisible = false;
	var scrollbar = null;

	//------------------------------------------------
	// Init
	//------------------------------------------------
	function init() {
		getDefaults();
		createScrollbar();
		resize();
	}

	//------------------------------------------------
	// Get labels for open/close states
	//------------------------------------------------
	function getDefaults() {
		menuLabel = DOMElement.querySelector(".menu-button .label");
		closeText = DOMElement.querySelector(".menu-button").getAttribute("data-close-copy");
		openText = menuLabel.innerHTML;
		sideMenu = DOMElement.querySelector(".main-menu");
		overlay = DOMElement.querySelector(".overlay");
	}

	//------------------------------------------------
	// Scrolls panel content when too tall for the viewport
	//------------------------------------------------
	function createScrollbar() {
		scrollbar = new NATION.VerticalScrollbar(DOMElement.querySelector(".scrollable-content"), DOMElement.querySelector(".scrollbar"), {enableMouseLock: true});
	}

	//------------------------------------------------
	// Slide open menu
	//------------------------------------------------
	function open() {
		if (!animating) {
			animating = true;
			menuLabel.textContent = closeText;
			isOpen = true;
			overlay.style.display = "block";
			NATION.Animation.start(overlay, {opacity: 1}, {duration: 400, easing: "easeInOutQuad"});
			NATION.Animation.start(sideMenu, {left: 0}, {duration: 400, easing: "easeInOutQuad"}, function(e) {onMenuOpened(e)});
		}
	}

	//------------------------------------------------
	// Slide menu off screen
	//------------------------------------------------
	function close(immediate) {
		if (immediate) {
			if (animating) {
				NATION.Animation.stop(overlay);
				NATION.Animation.stop(sideMenu);
			}
			menuLabel.textContent = openText;
			isOpen = false;
			overlay.removeAttribute("style");
			sideMenu.removeAttribute("style");
		} else if (!animating) {
			animating = true;
			menuLabel.textContent = openText;
			isOpen = false;
			NATION.Animation.start(overlay, {opacity: 0}, {duration: 400, easing: "easeInOutQuad"});
			NATION.Animation.start(sideMenu, {left: -panelWidth + "px"}, {duration: 400, easing: "easeInOutQuad"}, function(e) {onMenuClosed(e);});
		}
	}

	//------------------------------------------------
	// Adjust to browser resizes
	//------------------------------------------------
	function resize() {
		menuButtonVisible = (NATION.Utils.getStyle(DOMElement.querySelector(".menu-button"), "display") !== "none");
		if (menuButtonVisible) {
			// Get new width of the side menu panel
			panelWidth = sideMenu.clientWidth;
			scrollbar.resize();
		} else if (menuButtonWasVisible) {
			// Remove any styles that were added by JavaScript
			sideMenu.removeAttribute("style");
			close(true);
		}
		BISDT.Settings.headerHeight = DOMElement.querySelector(".logo").clientHeight;
		BISDT.Settings.smallLayoutVisible = menuButtonWasVisible = menuButtonVisible;
	}

	//------------------------------------------------
	// Update animation state
	//------------------------------------------------
	function onMenuOpened(e) {
		animating = false;
	}

	//------------------------------------------------
	// Hide the overlay so that stuff behind is clickable
	//------------------------------------------------
	function onMenuClosed(e) {
		animating = false;
		overlay.style.display = "none";
	}

	init();

	return {
		toggle: function() {
			if (isOpen) {
				close();
			} else {
				open();
			}
		},
		close: close,
		resize: resize
	}
};