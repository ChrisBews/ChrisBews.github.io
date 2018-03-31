////////////////////////////////////////////////////////////////////////////////
// Nation Library
// Infinite scrolling
// REQUIRES: NATION.EventDispatcher, NATION.Utils
// selector: Either a string or a jQuery object
// paginationSelector: Either a string, DOMElement, or jQuery object
// Style '#infinite-scroll-loading-msg' or '.infinite-scroll-loading-display'
// Loading message also contains a paragraph, which may need to be styled
// to style the loading messages.
// loadButtonSelector will have class 'disabled' during a load.
// .infinite-scroll-loading-display will have class 'complete' added when all content
// has been loaded.
// Options:
// {
// 		nextSelector: ".next",					STRING to location of next link, 
//												anywhere inside paginationSelector
//												If it doesn't exist, the page numbers
//												themselves will be used for links
//		loadButtonSelector: "",					If content loads should be triggered
//												by the user, this should be a selector
//												pointing to the anchor the user will click
//		alwaysButtonTrigger: false,				User must click the loadButtonSelector
//												for each and every load of content
//		loadingCopy: "Loading...",				Copy used for the loading message
//		loadCompleteCopy: "All items loaded"	Copy used when all content is loaded
// }
//
// Fires the following events
// "Loaded": Fired every time some new content is added to the page
// "AllLoaded": Fired when there is no more content to load
////////////////////////////////////////////////////////////////////////////////
var NATION = NATION || {};

/**
* ### Dependencies:
* [NATION.EventDispatcher](EventDispatcher.js.html)
* [NATION.Utils](Utils.js.html)
*
* ### About:
* Enables infinite scrolling of paginated content
* 
* ### Notes:
* - If ***nextSelector*** is defined in options, the URL in that element's href is used for each next page, otherwise this class will attempt to use the individual page number links. The latter requires all possible pages to be listed at once.
*
* ### Example:
*
	<!-- HTML -->
	<div class="my-page">
		<ul class="container">
			<li>Item 1</li>
			<li>Item 2</li>
			<li>Item 3</li>
		</ul>
		<div class="pagination">
			<ul>
				<li><a href="/?page=2" class="next">Next page</a></li>
			</ul>
		</div>
	</div>

	// JavaScript
	var mySelector = ".container";
	var paginationSelector = ".pagination";
	var options = {
		nextSelector: ".next",
		loadingCopy: "Loading content",
		loadCompleteCopy: "All content loaded"
	};
	var loader = new NATION.InfiniteScroll(mySelector, paginationSelector, options);
*
* @class InfiniteScroll
* @param {string} selector Query string leading to the content that should be added to the page
* @param {domelement,string} paginationSelector DOM element, or query string, of the pagination to be used when getting next page URLs
* @param {object} options Customisable options for infinite scrolling
* @param {string} options.nextSelector (default:".next") Query string to the 'next page' link inside pagination. If this isn't set, the page numbers will be used instead
* @param {domelement,string} options.loadButtonSelector (default:"") If content loads should be triggered by the user at any point, this should be a selector pointing to the anchor the user will click
* @param {boolean} options.alwaysButtonTrigger (default:false) If true, and options.loadButtonSelector is defined, each load of content will be triggered by the user clicking the button, not through scrolling
* @param {string} options.loadingCopy (default:"Loading...") Copy used for the loading message
* @param {string} options.loadCompleteCopy (default:"All items loaded") Copy used when all content is loaded
*/
NATION.InfiniteScroll = function(selector, paginationSelector, options) {

	"use strict";

	var _public = new NATION.EventDispatcher();

	/**
	* EVENTS
	* ==============
	* The following events are fired by this class.
	*/

	/**
	* Some content has been loaded from the next page
	*/
	_public.LOADED = "Loaded";
	/**
	* There is no more content to load
	*/
	_public.ALL_LOADED = "AllLoaded";

	/**
	* First load of content has been triggered
	*/
	_public.FIRST_LOAD = "FirstLoad"

	var _private = {
		//------------------------------------------------
		// Variables
		//------------------------------------------------
		SELECTOR_ERROR: "InfiniteScroll: Passed selector must be either a string or a jQuery object.",
		selector: null,
		options: {
			nextSelector: ".next",
			loadButtonSelector: "",
			alwaysButtonTrigger: false,
			loadingCopy: "Loading...",
			loadCompleteCopy: "All items loaded"
		},
		selectorString: "",
		paginationSelector: null,
		loading: false,
		currentPage: 0,
		totalPages: 0,
		loadingHTML: "<p>{copy}</p>",
		loadingSelector: "#infinite-scroll-loading-msg",
		loadMessage: "",
		loadingCopy: "Loading...",
		loadCompleteCopy: "All items loaded",
		loadTimer: null,
		loadsEnabled: false,
		loadInProgress: false,
		nextPageAnchor: null,

		//------------------------------------------------
		// Init
		//------------------------------------------------
		init: function() {
			this.selector = NATION.Utils.getDOMElement(selector);
			this.getSelectorString(selector);
			this.paginationSelector = NATION.Utils.getDOMElement(paginationSelector);
			if (options) {
				for (var i in options) {
					this.options[i] = options[i];
				}
			}
			if (this.options.loadButtonSelector) {
				this.options.loadButtonSelector = NATION.Utils.getDOMElement(this.options.loadButtonSelector);
			} else {
				// Automatically allow content loads, since there is no button prompt
				this.loadsEnabled = true;
			}
			this.totalPages = this.paginationSelector.querySelectorAll("a").length;
			this.prepareLoadingMessage();
			this.createListeners();
		},

		//------------------------------------------------
		// Handle jQuery objects
		//------------------------------------------------
		getSelectorString: function(selector) {
			if (typeof selector === "string") {
				this.selectorString = selector;
			} else if (typeof jQuery !== "undefined") {
				if (selector instanceof jQuery) {
					this.selectorString = selector.selector;
				} else {
					throw new Error(this.SELECTOR_ERROR);
				}
			} else {
				throw new Error(this.SELECTOR_ERROR);
			}
		},

		//------------------------------------------------
		// Insert message and hide it
		//------------------------------------------------
		prepareLoadingMessage: function() {
			this.loadMessage = document.createElement("div");
			this.loadMessage.setAttribute("id", "infinite-scroll-loading-msg");
			this.loadMessage.className = "infinite-scroll-loading-display";
			this.loadMessage.innerHTML = this.loadingHTML;
			this.selector.appendChild(this.loadMessage);
			this.updateLoadMessageReference();
			this.loadMessage.style.display = "none";
		},

		//------------------------------------------------
		// Make sure reference to the load copy is up to date
		//------------------------------------------------
		updateLoadMessageReference: function() {
			this.loadMessage = document.querySelector(this.loadingSelector);
		},

		//------------------------------------------------
		// Listen for page scroll
		//------------------------------------------------
		createListeners: function() {
			if (this.options.loadButtonSelector) {
				this.options.loadButtonSelector.addEventListener("click", function(e) {_private.onLoadButtonClicked(e);});
			}
			window.addEventListener("scroll", function(e) {_private.onWindowScroll(false);});
		},

		//------------------------------------------------
		// Hide message after a delay
		//------------------------------------------------
		hideFinalLoadingMessage: function() {
			this.updateLoadMessageReference();
			this.loadMessage.querySelector("p").innerHTML = this.options.loadCompleteCopy;
			this.loadMessage.className += " complete";
			if (this.options.loadButtonSelector) {
				this.options.loadButtonSelector.style.display = "none";
			}
			if (this.loadTimer) clearTimeout(this.loadTimer);
			this.loadTimer = setTimeout(function() {_private.onLoadTimerTicked();}, 2000);
		},

		//------------------------------------------------
		// Hide loading message
		//------------------------------------------------
		hideLoadingMessage: function() {
			this.updateLoadMessageReference();
			//
			// Tom S: removed the hiding of final
			// loading message as of client feedback
			//
			// this.loadMessage.style.display = "none";
		},

		//------------------------------------------------
		// Time to hide 'all items loaded' message
		//------------------------------------------------
		onLoadTimerTicked: function() {
			this.hideLoadingMessage();
		},

		//------------------------------------------------
		// Register the button has been clicked
		//------------------------------------------------
		onLoadButtonClicked: function(e) {
			if (!this.loadInProgress) {
				if (!this.options.alwaysButtonTrigger) {
					_public.trigger(_public.FIRST_LOAD);
					this.options.loadButtonSelector.style.display = "none";
					this.loadsEnabled = true;
				} else {
					this.options.loadButtonSelector.className += " disabled";
				}
				this.onWindowScroll(true);
			}
			e.stopPropagation();
			e.preventDefault();
		},

		//------------------------------------------------
		// Check scroll postiion
		//------------------------------------------------
		onWindowScroll: function(buttonTriggered) {
			if (this.paginationSelector && (this.loadsEnabled || buttonTriggered) && !this.loadInProgress) {
				var contentBottom = this.selector.getBoundingClientRect().bottom;
				var windowHeight = window.innerHeight;
				if (contentBottom <= windowHeight && !this.loading) {
					this.loading = true;
					this.currentPage++;
					var pageElement;
					if (this.currentPage === 1) {
						if (this.paginationSelector.querySelector(this.options.nextSelector)) {
							pageElement = this.paginationSelector.querySelector(this.options.nextSelector);
						} else if (!this.options.nextSelector) {
							pageElement = this.paginationSelector.getElementsByTagName("a")[this.currentPage];
						}
					} else {
						pageElement = this.nextPageAnchor;
					}
					if (pageElement) {
						// Show loading message
						this.loadMessage.querySelector("p").innerHTML = this.options.loadingCopy;
						this.loadMessage.style.display = "block";
						// Load content of next page
						this.loadInProgress = true;
						var urlToLoad = pageElement.getAttribute("href");
						NATION.Utils.ajax({
							url: urlToLoad,
							method: "get",
							dataType: "text",
							success: function(data) {_private.onPageLoadComplete(data);},
							error: function(e) {_private.onPageLoadError(e);}
						});
					}
				}
			}
		},

		//------------------------------------------------
		// Parse loaded HTML and get the bit we want
		//------------------------------------------------
		onPageLoadComplete: function(data) {
			this.loadInProgress = false;
			if (this.options.loadButtonSelector) {
				this.options.loadButtonSelector.className = this.options.loadButtonSelector.className.replace(/ disabled|disabled/g, "");
			}
			var pageCode = document.createElement("div");
			pageCode.innerHTML = data;
			var newEntries = pageCode.querySelector(this.selectorString).children;
			var i = 0, length = newEntries.length, node = null;
			for (; i < length; i++) {
				if (newEntries[i].className !== "") {
					newEntries[i].className += " loaded-item";
				} else {
					newEntries[i].className = "loaded-item";
				}
			}
			i = 0; length = newEntries.length, node = null;
			for (; i < length; i++) {
				node = newEntries[i].cloneNode(true);
				this.selector.appendChild(node);
			}
			this.loading = false;
			// Get anchor element for next link
			if (this.options.nextSelector) {
				if (pageCode.querySelector(this.options.nextSelector)) {
					this.nextPageAnchor = pageCode.querySelector(this.options.nextSelector);
				} else {
					this.nextPageAnchor = null;
				}
			} else {
				if (pageCode.getElementsByTagName("a")[this.currentPage]) {
					this.nextPageAnchor = pageCode.getElementsByTagName("a")[this.currentPage];
				} else {
					this.nextPageAnchor = null;
				}
			}
			// Hide loading message after a delay
			var nextLinkFound = (this.nextPageAnchor);
			if ((this.currentPage === this.totalPages-1 && !this.options.nextSelector) || (this.options.nextSelector && !nextLinkFound)) {
				this.hideFinalLoadingMessage();
				_public.trigger(_public.ALL_LOADED);
			} else {
				this.hideLoadingMessage();
				_public.trigger(_public.LOADED);
			}
			// Fade in each new item (TBC)
			//newEntries = document.querySelector(this.selector).children;
			//i = 0; length = newEntries.length;
			//var classNames = "";
			//for (; i < length; i++) {
			//	classNames = newEntries[i].className;
			//	if (classNames.search("visible") <= -1) {
			//		newEntries[i].className += " visible";
			//	}
			//}
		},

		//------------------------------------------------
		// Something went wrong
		//------------------------------------------------
		onPageLoadError: function(e) {
			if (window.console) console.log("NATION.InfiniteScroll: Load error");
		}
	};

	_private.init();
	return _public;
};