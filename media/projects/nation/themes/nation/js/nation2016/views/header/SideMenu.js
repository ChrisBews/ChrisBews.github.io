//////////////////////////////////////////////////////////////////////////////
// Nation Website 2016
// Site Header Main Navigation for Small Screens
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("NATION2016.views.header");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var SideMenu = function(element) {
		NATION.EventDispatcher.call(this);
		this.__DOMElement = element;
		this.enabled = false;
		this.panelOpen = true;
		this.setup();
	}

	SideMenu.prototype = Object.create(NATION.EventDispatcher.prototype);
	SideMenu.prototype.constructor = SideMenu;

	//------------------------------------------------
	// Perform initial setup
	//------------------------------------------------
	SideMenu.prototype.setup = function() {
		this.createScrollbar();
	}

	//------------------------------------------------
	// Create scrollbar used when browser height isn't
	// tall enough for the full menu
	//------------------------------------------------
	SideMenu.prototype.createScrollbar = function() {
		var __content = this.__DOMElement.querySelector(".js-scrollable-content");
		var __scrollbar = this.__DOMElement.querySelector(".js-scrollbar");
		var options = {
			enableMouseLock: true
		};
		this.scrollbar = new NATION.VerticalScrollbar(__content, __scrollbar, options);
	}

	//------------------------------------------------
	// Returns true if the side menu is open
	//------------------------------------------------
	SideMenu.prototype.isOpen = function() {
		return this.panelOpen;
	}

	//------------------------------------------------
	// Ope the side menu after resizing it's scrollbar
	//------------------------------------------------
	SideMenu.prototype.open = function(immediate) {
		if (!this.panelOpen) {
			this.panelOpen = true;
			// Make sure scrollbar is the right size
			if (this.scrollbar) {
				this.scrollbar.resize();
			}
			if (!immediate) {
				NATION.Animation.start(this.__DOMElement, {transform: "translateX(-100%)"}, {duration: 400, easing: "easeInOutQuad"});
			} else {
				NATION.Utils.setStyle(this.__DOMElement, {transform: "translateX(-100%)"});
			}
		}
	}

	//------------------------------------------------
	// Close the side menu
	//------------------------------------------------
	SideMenu.prototype.close = function(immediate) {
		if (this.panelOpen) {
			this.panelOpen = false;
			if (!immediate) {
				NATION.Animation.start(this.__DOMElement, {transform: "translateX(0)"}, {duration: 400, easing: "easeInOutQuad"});
			} else {
				NATION.Utils.setStyle(this.__DOMElement, {transform: "translateX(0)"});
			}
		}
	}

	//------------------------------------------------
	// Resize the side menu and it's scrollbar
	//------------------------------------------------
	SideMenu.prototype.resize = function() {
		if (this.enabled) {
			this.__DOMElement.style.height = window.innerHeight + "px";
		}
		if (this.scrollbar && this.panelOpen) {
			this.scrollbar.resize();
		}
	}

	//------------------------------------------------
	// Allow the side menu to be opened and closed
	//------------------------------------------------
	SideMenu.prototype.enable = function() {
		if (!this.enabled) {
			this.enabled = true;
			this.close(true);
		}
	}

	//------------------------------------------------
	// Stop the side menu from being opened, and
	// immediately hide it
	//------------------------------------------------
	SideMenu.prototype.disable = function() {
		if (this.enabled) {
			this.enabled = false;
			// Make sure the panel is hidden
			this.close(true);
			// Allows the header to return to normal height and behaviour
			this.__DOMElement.style.removeProperty("height");
		}
	}

	window.NATION2016.views.header.SideMenu = SideMenu;

}(window, document, undefined));