//////////////////////////////////////////////////////////////////////////////
// Nation Website 2016
// Site Header
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("NATION2016.views");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var SiteHeader = function(element) {
		this.__DOMElement = element;
		this.__navLinks = this.__DOMElement.querySelectorAll(".js-main-nav [data-view]");
		this.__breadcrumbs = this.__DOMElement.querySelector(".js-breadcrumbs");
		this.__headerBackground = this.__DOMElement.querySelector(".js-header-background");
		this.__menuButton = this.__DOMElement.querySelector(".js-menu-button");
		this.__menuButtonLabel = this.__menuButton.querySelector(".js-label");
		this.__mainMenu = this.__DOMElement.querySelector(".js-menu");
		this.sideMenu = null;
		this.activeSectionID = -1;
		this.previousSectionArrayLength = -1;
		this.headerSolid = false;
		this.MAX_SCROLL = 100;
		this.sectionArray = [];
		this.backCopy = this.__breadcrumbs.getAttribute("data-back-copy");
		this.previousScrollProgress = (NATION.Utils.getPageElement().scrollTop > this.MAX_SCROLL) ? 1 : NATION.Utils.getPageElement().scrollTop / this.MAX_SCROLL;
		// Boolean that is true when the page scroll is > 0 and the header has shrunk in size
		this.smallModeActive = false;
		// Boolean that is true when the side menu is in use (menu button is showing)
		this.sideMenuEnabled = false;
		this.setup();
		this.createListeners();
	}

	//------------------------------------------------
	// Perform initial setup
	//------------------------------------------------
	SiteHeader.prototype.setup = function() {
		var i = 0, length = this.__navLinks.length;
		for (; i < length; i++) {
			// Make sure none of the main nav options are shown as active initially
			if (this.__navLinks[i].className.search(/active/i) >= 0) {
				this.__navLinks[i].className = this.__navLinks[i].className.replace(/ active|active/i, "");
			}
		}
		// Store the copy for the mobile menu button
		this.menuButtonOpenCopy = this.__menuButtonLabel.innerHTML;
		this.menuButtonCloseCopy = this.__menuButtonLabel.getAttribute("data-close");
		// Add a class to the body if user is on a mobile device
		this.decideMobileClass();
		// Create the side menu that shows at smaller widths
		this.createSideMenu();
		// Perform initial resize to make sure the home screen takes up the right amount of space from the start
		this.resize();
	}

	//------------------------------------------------
	// Add a class to the body if user is on a mobile device
	//------------------------------------------------
	SiteHeader.prototype.decideMobileClass = function() {
		if (NATION2016.Settings.TOUCH_DEVICE) {
			document.documentElement.className += " touch";
		}
	}

	//------------------------------------------------
	// Get index of nav item matching the passed section name
	// In the current navigation:
	// -1 = home
	// 0 = work, 1 = about, 2 = careers, 3 = contact
	//------------------------------------------------
	SiteHeader.prototype.getSectionIndex = function(sectionName) {
		var id = -1;
		var i = 0, length = this.__navLinks.length;
		for (; i < length; i++) {
			if (this.__navLinks[i].getAttribute("data-view").search(sectionName) > -1) {
				id = i;
				break;
			}
		}
		return id;
	}

	//------------------------------------------------
	// Slide open the side menu in response to a menu click
	//------------------------------------------------
	SiteHeader.prototype.openSideMenu = function(immediate) {
		if (this.sideMenuEnabled) {
			this.sideMenu.open(immediate);
			this.__DOMElement.className += " menu-open";
			this.showCloseIcon(immediate);
		}
	}

	//------------------------------------------------
	// Fade in the header (only on homepage)
	//------------------------------------------------
	SiteHeader.prototype.show = function(immediate) {
		if (!immediate) {
			NATION.Animation.start(this.__DOMElement, {opacity: 1}, {duration: 300});
		} else {
			this.__DOMElement.style.opacity = 1;
		}
	}

	//------------------------------------------------
	// Animate the menu icon towards the close icon
	//------------------------------------------------
	SiteHeader.prototype.showCloseIcon = function(immediate) {
		this.menuOpenColor = NATION.Utils.getStyle(this.__menuButton.querySelector(".top"), "backgroundColor");
		if (!immediate) {
			var easing = "easeInQuad";
			var duration = 150;
			NATION.Animation.start(this.__menuButton.querySelector(".top"), {top: "50%", transform: "translateY(-1px)"}, {duration: duration, easing: easing});
			NATION.Animation.start(this.__menuButton.querySelector(".bottom"), {bottom: "50%", transform: "translateY(1px)"}, {duration: duration, easing: easing});
			NATION.Animation.start(this.__menuButton.querySelector(".arrowhead"), {transform: "scale(0, 0)"}, {duration: duration, easing: easing});
			NATION.Animation.start(this.__menuButton.querySelector(".center"), {transform: "translateX(0)"}, {duration: duration, easing: easing}, this.animateToCloseIcon.bind(this));
		} else {
			NATION.Utils.setStyle(this.__menuButton.querySelector(".top"), {
				top: "50%",
				transform: "translateY(-1px) rotate(-45deg)"
			});
			NATION.Utils.setStyle(this.__menuButton.querySelector(".bottom"), {
				bottom: "50%",
				transform: "translateY(-1px)"
			});
			NATION.Utils.setStyle(this.__menuButton.querySelector(".arrowhead"), {
				transform: "scale(0, 0)"
			});
			NATION.Utils.setStyle(this.__menuButton.querySelector(".center"), {
				background: "#1299DC",
				transform: "rotate(45deg)"
			});
			this.__menuButtonLabel.innerHTML = this.menuButtonCloseCopy;
		}

	}
	//------------------------------------------------
	// End of the animation showing the close icon in
	// the menu button
	//------------------------------------------------
	SiteHeader.prototype.animateToCloseIcon = function() {
		var easing = "easeOutQuart";
		var duration = 250;
		this.__menuButtonLabel.innerHTML = this.menuButtonCloseCopy;
		this.__menuButton.querySelector(".bottom").style.display = "none";
		NATION.Animation.start(this.__menuButton.querySelector(".top"), {background: "#1299DC", transform: "translateY(-1px) rotate(-45deg)"}, {duration: duration, easing: easing});
		NATION.Animation.start(this.__menuButton.querySelector(".center"), {background: "#1299DC", transform: "rotate(45deg)"}, {duration: duration, easing: easing});
	}

	//------------------------------------------------
	// Animate the menu button towards the open icon
	//------------------------------------------------
	SiteHeader.prototype.showOpenIcon = function(immediate) {
		if (!immediate) {
			var easing = "easeInQuad";
			var duration = 200;
			NATION.Animation.start(this.__menuButton.querySelector(".top"), {background: this.menuOpenColor, transform: "translateY(-1px) rotate(0)"}, {duration: duration, easing: easing});
			NATION.Animation.start(this.__menuButton.querySelector(".center"), {background: this.menuOpenColor, transform: "translateX(0)"}, {duration: duration, easing: easing}, this.animateToOpenIcon.bind(this));
		} else {
			NATION.Utils.setStyle(this.__menuButton.querySelector(".top"), {
				top: 0,
				background: "#0965DA",
				transform: "translateY(0)"
			});
			NATION.Utils.setStyle(this.__menuButton.querySelector(".bottom"), {
				bottom: 0,
				transform: "translateY(0)"
			});
			NATION.Utils.setStyle(this.__menuButton.querySelector(".center"), {
				transition: "none",
				background: "#0965DA",
				transform: "translateX(0)"
			});
			this.clearMenuIconStyles();
			this.__menuButtonLabel.innerHTML = this.menuButtonOpenCopy;
		}
	}
	//------------------------------------------------
	// Finish animating towards the open icon
	//------------------------------------------------
	SiteHeader.prototype.animateToOpenIcon = function() {
		var easing = "cubic-bezier(0, 0, 0.1, 2)";//"cubic-bezier(0.15, 0.15, 0.3, 1.5)";
		var duration = 200;
		this.__menuButtonLabel.innerHTML = this.menuButtonOpenCopy;
		this.__menuButton.querySelector(".bottom").style.display = "block";
		NATION.Animation.start(this.__menuButton.querySelector(".bottom"), {bottom: 0, transform: "translateY(0)"}, {duration: duration, easing: easing});
		NATION.Animation.start(this.__menuButton.querySelector(".center"), {transform: "translateX(0) rotate(0)"}, {duration: duration, easing: easing}, this.clearMenuIconStyles.bind(this));
		NATION.Animation.start(this.__menuButton.querySelector(".top"), {top: 0, transform: "translateY(0)"}, {duration: duration, easing: easing});
	}
	//------------------------------------------------
	// Clear out old styles
	//------------------------------------------------
	SiteHeader.prototype.clearMenuIconStyles = function() {
		this.__menuButton.querySelector(".bottom").removeAttribute("style");
		this.__menuButton.querySelector(".top").removeAttribute("style");
		this.__menuButton.querySelector(".center").removeAttribute("style");
		this.__menuButton.querySelector(".arrowhead").removeAttribute("style");
	}

	//------------------------------------------------
	// Hide the side menu
	//------------------------------------------------
	SiteHeader.prototype.closeSideMenu = function(immediate) {
		this.sideMenu.close(immediate);
		this.__DOMElement.className = this.__DOMElement.className.replace(/ menu-open|menu-open/gi, "");
		this.showOpenIcon(immediate);
	}

	//------------------------------------------------
	// Handles menu behaviour when in small screen mode
	//------------------------------------------------
	SiteHeader.prototype.createSideMenu = function() {
		this.sideMenu = new NATION2016.views.header.SideMenu(this.__mainMenu);
	}

	//------------------------------------------------
	// Listen for the user scrolling, so we know when
	// to shrink the header
	//------------------------------------------------
	SiteHeader.prototype.createListeners = function() {
		window.addEventListener("scroll", this.onWindowScrolled.bind(this));
		this.__menuButton.addEventListener("click", this.onMenuButtonClicked.bind(this));
	}

	//------------------------------------------------
	// Swap colour scheme styles in the header depending
	// on the project displayed
	//------------------------------------------------
	SiteHeader.prototype.setColorSchemeStyles = function(styleElement) {
		var existingThemeStyles = document.getElementById("case-study-colors");
		// Remove old styles if they exist
		if (existingThemeStyles) {
			document.getElementsByTagName("head")[0].removeChild(existingThemeStyles);
		}
		// Add the new styles if some were found in the latest loaded page
		if (styleElement) {
			document.getElementsByTagName("head")[0].appendChild(styleElement);
		}
	}

	//------------------------------------------------
	// Change the copy shown in the page <title>
	//------------------------------------------------
	SiteHeader.prototype.setPageTitle = function(title) {
		if (title) {
			document.getElementsByTagName("title")[0].innerHTML = title;
		}
	}

	//------------------------------------------------
	// Set the active section based on sectionArray
	// Also update the style of the header depending on
	// which section we're in
	//------------------------------------------------
	SiteHeader.prototype.update = function(sectionArray, force) {
		this.sectionArray = sectionArray;
		// Change the text shown beside the flag icon
		this.updateBreadcrumbs();
		this.currentSectionName = this.sectionArray[0].toLowerCase();
		// Decide if the header should be transparent or solid
		this.updateHeaderStyle(force);
		var regex = new RegExp(this.currentSectionName, "i");
		var i = 0, length = this.__navLinks.length, newSectionID = -1, viewPath = "";
		// Figure out the ID of the active section
		for (; i < length; i++) {
			viewPath = this.__navLinks[i].getAttribute("data-view").toLowerCase();
			if (viewPath.search(regex) >= 0 || (viewPath === "/" && this.currentSectionName === "home")) {
				newSectionID = i;
				break;
			}
		}
		if (this.activeSectionID >= 0) {
			this.__navLinks[this.activeSectionID].className = this.__navLinks[this.activeSectionID].className.replace("active", "");
		}
		// If the section ID changed, make sure the correct nav item is shown as active
		if (newSectionID > -1) {
			if (this.__navLinks[newSectionID].className.search(/active/i) < 0) {
				this.__navLinks[newSectionID].className += " active";
			}
		}
		this.activeSectionID = newSectionID;
		// Used to work out if we moved between site depths
		this.previousSectionArrayLength = this.sectionArray.length;
	}

	//------------------------------------------------
	// Decide which class to attach to the header depending
	// on which section we're currently in
	//------------------------------------------------
	SiteHeader.prototype.updateHeaderStyle = function(force) {
		// Ensure the breadcrumbs don't show on error pages
		if (this.currentSectionName === "error") {
			if (this.__DOMElement.className.search("error") < 0) {
				this.__DOMElement.className += " error";
			}
		} else {
			if (this.__DOMElement.className.search("error") > -1) {
				this.__DOMElement.className = this.__DOMElement.className.replace(/ error-page|error-page/gi, "");
			}
		}
		// Make sure scrolled class isn't still added when first loading a page
		this.__DOMElement.className = this.__DOMElement.className.replace(/ scrolled|scrolled/gi, "");

		if ((this.currentSectionName === "home" || this.currentSectionName === "error" || this.sectionArray.length > 1) && (this.headerSolid || force)) {
			// Show the transparent header if on home, or more than one section deep
			this.showTransparentHeader();
		} else if (this.currentSectionName !== "home" && this.currentSectionName !== "error" && !this.headerSolid && this.sectionArray.length <= 1) {
			// Show solid header if only one section deep
			this.showSolidHeader();
		}
		// Landing-page class hides the breadcrumbs
		if (this.currentSectionName === "home") {
			if (this.__DOMElement.className.search("landing-page") < 0) {
				this.__DOMElement.className += " landing-page";
			}
		} else if (this.__DOMElement.className.search("landing-page") >= 0) {
			this.__DOMElement.className = this.__DOMElement.className.replace(/ landing-page|landing-page/gi, "");
		}
		// Subsection class keeps text white, to stop it changing colour during fade out
		if (this.sectionArray.length > 1) {
			if (this.__DOMElement.className.search("subsection") < 0) {
				this.__DOMElement.className += " subsection";
			}
		} else if (this.__DOMElement.className.search("subsection") >= 0) {
			this.__DOMElement.className = this.__DOMElement.className.replace(/ subsection|subsection/gi, "");
		}
	}

	//------------------------------------------------
	// Makes header transparent by removing the 'solid'
	// class name
	//------------------------------------------------
	SiteHeader.prototype.showTransparentHeader = function() {
		this.__DOMElement.className = this.__DOMElement.className.replace(/ solid|solid/gi, "");
		this.headerSolid = false;
	}

	//------------------------------------------------
	// Makes header solid by adding the 'solid' class
	//------------------------------------------------
	SiteHeader.prototype.showSolidHeader = function() {
		this.__DOMElement.className += " solid";
		this.headerSolid = true;
	}

	//------------------------------------------------
	// Make sure the right copy is shown beside the flag icon
	//------------------------------------------------
	SiteHeader.prototype.updateBreadcrumbs = function() {
		if (this.sectionArray[0].toLowerCase() !== this.currentSectionName || this.sectionArray.length !== this.previousSectionArrayLength) {
			// Remove old breadcrumbs
			while (this.__breadcrumbs.firstChild) {
				this.__breadcrumbs.removeChild(this.__breadcrumbs.firstChild);
			}
			// Create new breadcrumbs
			var anchor = document.createElement("a");
			anchor.setAttribute("href", "#");
			anchor.setAttribute("data-view", "/" + this.sectionArray[0].toLowerCase() + "/");
			// Figure out the copy to show by using the first part if tge section array
			var displayCopy = (this.sectionArray.length > 1) ? this.backCopy : this.sectionArray[0].toLowerCase();
			// Create a simple text node with the new copy
			var textNode = document.createTextNode(NATION.Utils.camelcaseString(displayCopy));
			// Add it to the breadcrumb anchor
			anchor.appendChild(textNode);
			this.__breadcrumbs.appendChild(anchor);
		}
	}

	//------------------------------------------------
	// Update state of header after a resize event
	//------------------------------------------------
	SiteHeader.prototype.resize = function() {
		// Update the height of the header in the global site settings
		NATION2016.Settings.headerHeight = this.__DOMElement.offsetHeight;
		// Figure out if we're in small mode or not
		if (NATION.Utils.getStyle(this.__menuButton, "display") === "none") {
			this.smallModeActive = false;
			NATION2016.Settings.mobileHeader = false;
		} else {
			this.smallModeActive = true;
			NATION2016.Settings.mobileHeader = true;
		}
		// If not currently in small mode
		if (!this.smallModeActive) {
			// Make sure side menu isn't active and is hidden
			if (this.sideMenuEnabled) {
				this.disableSideMenu();
			}
		} else if (!this.sideMenuEnabled) {
			// Otherwise make sure the side menu is ready to go
			this.enableSideMenu();
		}
		// If side menu is active, stop shrinking the header
		if (this.sideMenuEnabled) {
			if (this.previousScrollProgress > 0) {
				NATION.Utils.setStyle(this.__DOMElement, {transform: "translateY(0)"});
			}
			this.sideMenu.resize();
		} //else {
			// Otherwise restart shrinking
			this.repositionHeader();
		//}
	}

	//------------------------------------------------
	// Make the side menu active and add the relevant class
	// to change the appearance of the header
	//------------------------------------------------
	SiteHeader.prototype.enableSideMenu = function() {
		this.sideMenuEnabled = true;
		this.sideMenu.enable();
		if (this.__DOMElement.className.search("side-menu-header")) {
			this.__DOMElement.className += " side-menu-header";
		}
	}

	//------------------------------------------------
	// Disable the side menu and remove the relevant class
	//------------------------------------------------
	SiteHeader.prototype.disableSideMenu = function() {
		this.sideMenuEnabled = false;
		this.closeSideMenu(true);
		this.sideMenu.disable();
		if (this.__DOMElement.className.search("side-menu-header")) {
			this.__DOMElement.className = this.__DOMElement.className.replace(/side-menu-header/gi, "");
		}
		this.__DOMElement.className = this.__DOMElement.className.replace(/ menu-open|menu-open/gi, "");
	}

	//------------------------------------------------
	// Work out if the header should be shrunk or not
	//------------------------------------------------
	SiteHeader.prototype.repositionHeader = function() {
		// Don't do this stuff on error pages, as it's not needed there
		if (this.currentSectionName !== "error") {
			var currentScroll = NATION.Utils.getPageElement().scrollTop;
			var progress = (currentScroll > this.MAX_SCROLL) ? 1 : currentScroll / this.MAX_SCROLL;
			// Slide header up where needed
			if (this.previousScrollProgress !== progress) {
				if (!this.sideMenuEnabled) {
					var newOffset = (this.currentSectionName !== "home") ? -20 * progress : -currentScroll;
					NATION.Utils.setStyle(this.__DOMElement, {transform: "translateY(" + newOffset + "px)"});
				}
				this.previousScrollProgress = progress;
				if (progress >= 1 && this.currentSectionName !== "") {
					if (this.__DOMElement.className.search(/scrolled/i) < 0) {
						this.__DOMElement.className += " scrolled";
					}
				} else {
					if (this.__DOMElement.className.search(/scrolled/i) >= 0) {
						this.__DOMElement.className = this.__DOMElement.className.replace(/ scrolled|scrolled/gi, "");
					}
				}
				if (this.sectionArray.length > 1) {
					if (progress == 1 && !this.headerSolid) {
						this.showSolidHeader();
					} else if (progress < 1 && this.headerSolid) {
						this.showTransparentHeader();
					}
				}
			}
		}
	}

	//------------------------------------------------
	// Keep header up to date when window is scrolled
	//------------------------------------------------
	SiteHeader.prototype.onWindowScrolled = function() {
		this.resize();
	}

	//------------------------------------------------
	// Show or hide the side menu in repsonse to the
	// button being clicked
	//------------------------------------------------
	SiteHeader.prototype.onMenuButtonClicked = function(e) {
		if (this.sideMenuEnabled) {
			if (this.sideMenu.isOpen()) {
				this.closeSideMenu();
			} else {
				this.openSideMenu();
			}
		}
		e.stopPropagation();
		e.preventDefault();
	}

	window.NATION2016.views.SiteHeader = SiteHeader;

}(window, document, undefined));
