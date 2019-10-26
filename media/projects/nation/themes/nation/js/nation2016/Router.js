//////////////////////////////////////////////////////////////////////////////
// Nation Website 2016
// Router
// TODO: Move page requests into a model. Potentially move state out too
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("NATION2016");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var Router = function() {
		NATION.EventDispatcher.call(this);
		this.siteDomain = window.location.protocol + "//" + window.location.host;
		this.urlPrefix = "";
		this.urlSuffix = "";
		this.pageLoaded = false;
		if (window.location.pathname.search("/static") >= 0) {
			this.urlPrefix += "/static";
		}
		this.activePath = "/";
		this.activeSections = [];
		this.previousSections = [];
		this.currentSection = "home";
		this.pageData = "";
		this.colorSchemeStyles = "";
		this.pageDataURL = "";
		this.previousPageDataURL = "";
		this.headerTitle = "";
		this.loadingNotFoundPage = false;
		this.createListeners();
		this.checkCurrentPage();
		// Active path will always be whatever we landed on initially
		this.activePath = this.pageDataURL;
	}

	Router.prototype = Object.create(NATION.EventDispatcher.prototype);
	Router.prototype.constructor = Router;

	//------------------------------------------------
	// Listen for section changes
	//------------------------------------------------
	Router.prototype.createListeners = function() {
		window.addEventListener("popstate", this.onPopState.bind(this));
		document.documentElement.addEventListener("click", this.onElementClicked.bind(this));
	}

	//------------------------------------------------
	// Return path for current page
	//------------------------------------------------
	Router.prototype.getCurrentPath = function() {
		return this.pageDataURL;
	}

	//------------------------------------------------
	// Return path for previous page
	//------------------------------------------------
	Router.prototype.getPreviousPath = function() {
		return this.previousPageDataURL;
	}

	//------------------------------------------------
	// Returns the HTML for the loaded page
	//------------------------------------------------
	Router.prototype.getNextPageData = function() {
		return this.pageData;
	}

	//------------------------------------------------
	// Returns the style tag found in the header for
	// custom project themes
	//------------------------------------------------
	Router.prototype.getColorSchemeStyles = function() {
		return this.colorSchemeStyles;
	}

	//------------------------------------------------
	// Returns text to be used as the <title>
	//------------------------------------------------
	Router.prototype.getHeaderTitle = function() {
		return this.headerTitle;
	}

	//------------------------------------------------
	// Fires if the page load was forced to happen when
	// the user first lands on the site in IE9, and the
	// URL isn't the homepage URL
	//------------------------------------------------
	Router.prototype.isPageLoadForced = function() {
		return this.pageLoadForced;
	}

	//------------------------------------------------
	// Store true if the page load is a forced one for IE9
	//------------------------------------------------
	Router.prototype.setPageLoadForced = function(value) {
		this.pageLoadForced = value;
	}

	//------------------------------------------------
	// Return the array of current sections/subsections
	//------------------------------------------------
	Router.prototype.getActiveSections = function() {
		return this.activeSections;
	}

	//------------------------------------------------
	// Force the active section to be something other than
	// the current URL
	//------------------------------------------------
	Router.prototype.overrideActiveSections = function(sectionArray) {
		this.activeSections = sectionArray;
		this.currentSection = (this.activeSections[0]) ? this.activeSections[0] : "home";
	}

	//------------------------------------------------
	// Return the array of previous sections/subsections
	//------------------------------------------------
	Router.prototype.getPreviousSections = function() {
		return this.previousSections;
	}

	//------------------------------------------------
	// Returns the name of the current section
	//------------------------------------------------
	Router.prototype.getCurrentSection = function() {
		return this.currentSection;
	}

	//------------------------------------------------
	// Returns true if the page has finished loading
	//------------------------------------------------
	Router.prototype.isPageLoaded = function() {
		return this.pageLoaded;
	}

	//------------------------------------------------
	// When anywhere on the page is clicked, check if
	// the clicked element is a new page trigger
	// This is defined by the element having a data
	// attribute called "data-view"
	//------------------------------------------------
	Router.prototype.onElementClicked = function(e) {
		var url = "";
		if (e.target !== e.currentTarget && ((url = e.target.getAttribute("data-view")) || (url = this.findParentWithView(e.target)))) {
			// Don't set the URL to the same thing over and over
			if (url !== this.activePath) {
				// If the URL should change, do it here and fire the response
				history.pushState({}, "Nation", this.urlPrefix + url);
				this.onPopState();
			}
			e.stopPropagation();
			e.preventDefault();
		}
	}

	//------------------------------------------------
	// It might be that the current click target isn't
	// the one the user tried to click, so check parents
	// for the "data-view" attribute too
	//------------------------------------------------
	Router.prototype.findParentWithView = function(element) {
		var url = "";
		while (element.parentNode && element.parentNode.getAttribute) {
			if (url = element.parentNode.getAttribute("data-view")) {
				return url;
			}
			element = element.parentNode;
		}
		return false;
	}

	//------------------------------------------------
	// Work out the activeSections array, and store the name
	// of the current section
	//------------------------------------------------
	Router.prototype.checkCurrentPage = function() {
		this.previousSections = this.activeSections;
		var url = window.history.location || window.location;
		var regexp = new RegExp(this.siteDomain + "|#|", "gi")
		url = url.toString().replace(regexp, "");
		if (url !== "/") url = this.removeTrailingSlash(url);
		this.previousPageDataURL = this.pageDataURL;
		this.pageDataURL = url;
		regexp = new RegExp(this.siteDomain + "|" + this.urlPrefix, "gi");
		url = url.replace(regexp, "");
		if (url.charAt(0) === "/") {
			url = url.substring(1, url.length);
		}
		if (url === "") url = "home";
		this.activeSections = url.split("/");
		this.currentSection = (this.activeSections[0]) ? this.activeSections[0] : "home";
	}

	//------------------------------------------------
	// Respond to the user pressing the back/forward buttons
	//------------------------------------------------
	Router.prototype.onPopState = function(e) {
		this.checkCurrentPage();
		if (this.pageDataURL != this.activePath) {
			// Only make the current path 'active' if we changed pages
			this.activePath = this.pageDataURL;
			this.trigger(NATION2016.Events.PAGE_REQUESTED);
			this.loadPage(this.pageDataURL);
		}
	}

	//------------------------------------------------
	// Trim trailing slashes off of URLs
	//------------------------------------------------
	Router.prototype.removeTrailingSlash = function(path) {
		if (path.charAt(path.length-1) === "/") {
			path = path.substring(0, path.length-1);
		}
		return path;
	}

	//------------------------------------------------
	// Forces a page load (IE9 only)
	//------------------------------------------------
	Router.prototype.quickLoadPage = function(url) {
		this.activePath = url;
		url = this.urlPrefix + url;
		this.loadPage(url);
	}

	//------------------------------------------------
	// Load a new page defined by a data-view attribute
	//------------------------------------------------
	Router.prototype.loadPage = function(url) {
		// Track the page view
		if (ga) {
			ga("set", "page", url);
			ga("send", "pageview");
		}
		this.pageLoaded = false;
		NATION.Utils.ajax({
			url: url,
			success: this.onPageLoaded.bind(this),
			error: this.onPageLoadError.bind(this)
		});
	}

	//------------------------------------------------
	// When page has loaded, parse it and 
	// signal that it's ready
	//------------------------------------------------
	Router.prototype.onPageLoaded = function(data) {
		this.pageLoaded = true;
		this.loadingNotFoundPage = false;
		var container = document.createElement("div");
		container.innerHTML = data;
		var bodyHTML = container.querySelector("[data-page-content]").innerHTML;
		this.pageData = bodyHTML;
		this.colorSchemeStyles = container.querySelector("#case-study-colors");
		// Title to replace the contents of the 'live' <title> tag with
		this.headerTitle = container.getElementsByTagName("title")[0].innerHTML;
		this.trigger(NATION2016.Events.PAGE_LOAD_COMPLETE);
	}

	//------------------------------------------------
	// Throw an error is something went pearshaped
	//------------------------------------------------
	Router.prototype.onPageLoadError = function(status, responseText) {
		var error = this.ERROR_PAGE_NOT_FOUND.replace("{{url}}", this.activePath).replace("{{status}}", status).replace("{{responseText}}", responseText);
		if (!this.loadingNotFoundPage) {
			if (console) console.warn(error);
			this.loadingNotFoundPage = true;
			this.loadPage("/not-found");
		} else {
			throw new Error(error);
		}
	}

	//------------------------------------------------
	// Error Messages
	//------------------------------------------------
	Router.prototype.ERROR_PAGE_NOT_FOUND = "NATION2016.Router: The page '{{url}}' could not be loaded. Status: '{{status}}', response: '{{responseText}}'";

	window.NATION2016.Router = new Router();

}(window, document, undefined));