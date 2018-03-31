//////////////////////////////////////////////////////////////////////////////
// Nation Library
// Infinite Scroll
// Version 2.1.2
// Dependencies: NATION.EventDispatcher, NATION.Utils
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	if (typeof window.NATION === "undefined") window.NATION = {};

	var loadComplete = false;
	
	function checkDependencies() {
		var packageName = "NATION.VerticalScrollbar";
		var dependencies = {
			"NATION.Utils": NATION.Utils,
			"NATION.EventDispatcher": NATION.EventDispatcher
		};
		
		window.waitingDependencies = window.waitingDependencies || {};
		var dependenciesLoaded = true;
		for (var propName in dependencies) {
			if (!dependencies[propName]) {
				window.waitingDependencies[packageName] = {
					dependencies: dependencies,
					callback: function() {checkDependencies();}
				};
				dependenciesLoaded = false;
				break;
			}
		}

		if (dependenciesLoaded) {
			delete window.waitingDependencies[packageName];
			_initClass();
			// Check for any classes waiting on this one
			for (var className in window.waitingDependencies) {
				for (propName in window.waitingDependencies[className].dependencies) {
					if (propName === packageName) {
						// Re-run the waiting class' dependency check
						window.waitingDependencies[className].callback();
					}
				}
			}
		}
	}
	checkDependencies();

	function _initClass() {
		/**
		* ### Dependencies:
		* [NATION.Utils](Utils.js.html)
		* [NATION.EventDispatcher](EventDispatcher.js.html)
		*
		* ### About:
		* Loads content asynchronously and appends it to the bottom of the existing content.
		*
		* Can work with the main browser scrollbar, but can also work within scrollable elements (with overflow:scroll).
		*
		* Can load content based on scrolling, or on the press of a 'load more' button.
		*
		* ### Example code:
			<!-- HTML -->
			<section class="scrollable-content">
				<div class="article-list">
					<article>
						<h1>Article 1</h1>
					</article>
					<article>
						<h1>Article 2</h1>
					</article>
					<article>
						<h1>Article 3</h1>
					</article>
				</div>
				<ul class="pagination">
					<li><a href="/?page=2" class="js-next">Next page</a></li>
				</ul>
			</section>

			// JavaScript
			var selector = ".article-list";
			var paginationSelector = ".pagination";
			var options = {
				loadingCopy: "Loading content...",
				loadCompleteCopy: "All content loaded"
			};
			var infiniteScroll = new NATION.InfiniteScroll(selector, paginationSelector, options);
		*
		* @class InfiniteScroll
		* @param {string_or_domelement_or_jqueryobject} selector A selector string, DOM element, or jQuery object containing content that will be updated asynchronously
		* @param {string_or_domelement_or_jqueryobject} paginationSelector A selector string, DOM element, or jQuery object containing the content pagination
		* @param {object} options An object containing required options for this instance<br />
		* <b>nextSelector</b> <i>{string: ".next"}</i> The selector string to use to locate the 'next page' link within the paginationSelector
		* <b>loadButtonSelector</b> <i>{string: ""}</i> The selector string to use to locate the 'load more' button, if this functionality is required
		* <b>alwaysButtonTrigger</b> <i>{boolean: false}</i> Requires the option 'loadButtonSelector' to be defined. If true, loads will only ever occur when the user presses the next button. If false, the button will be hidden after first click, and all content loads thereafter will be triggered by scrolling
		* <b>loadingCopy</b> <i>{string: "Loading..."}</i> Defines the copy shown while a content load is in progress
		* <b>loadCompleteCopy</b> <i>{string: "All items loaded"}</i> Defines the copy shown when there is no more content to load
		* <b>scrollSelector</b> <i>{string_or_domelement_or_jqueryobject: window}</i> Specifies where the application should listen for scroll events from. Defaults to window, but can be any scrollable element (even matching the 'selector' argument)
		* <b>scrollTrigger</b> <i>{number: 100}</i> The distance from the bottom of the scrollable element that has to be reached before a new content load begins
		*/
		var InfiniteScroll = function(selector, paginationSelector, options) {
			// Call the super's constructor
			NATION.EventDispatcher.call(this);
			if (!selector) throw new Error(this.ERROR_MISSING_SELECTOR.replace("{{selector}}", "selector"));
			if (!paginationSelector) throw new Error(this.ERROR_MISSING_SELECTOR.replace("{{selector}}", "paginationSelector"));
			// Variables used to make sure the right elements are selected from the loaded page data
			this.selectorMatchID = 0;
			this.paginationMatchID = 0;
			this.loadButtonMatchID = 0;
			this.selector = selector;
			this.paginationSelector = paginationSelector;
			// Default options
			this.options = {
				nextSelector: ".next",
				loadButtonSelector: "",
				alwaysButtonTrigger: false,
				loadingCopy: "Loading...",
				loadCompleteCopy: "All items loaded",
				scrollSelector: window,
				scrollTrigger: 100
			};
			if (options) {
				for (var i in options) {
					this.options[i] = options[i];
				}
			}
			// Other variables required for the class to function
			this.autoLoadEnabled = false;
			if (!this.options.loadButtonSelector) {
				this.autoLoadEnabled = true;
			}
			this.__loadMessage = null;
			this.loadedEntries = [];
			this.loading = false;
			this.lastScrollPosition = 0;
			this.lastItemLoadCount = 0;
			this.allContentLoaded = false;
			this.updateElementReferences();
			if (!options.nextSelector) {
				// Check if js-next should be used instead
				if (this.__paginationElement.querySelector(".js-next")) {
					this.options.nextSelector = ".js-next";
				}
			}
			// First URL to load from the next link (or blank if next link doesn't exist)
			this.nextURL = (this.__paginationElement.querySelector(this.options.nextSelector)) ? this.__paginationElement.querySelector(this.options.nextSelector).getAttribute("href") : "";
			this.setup();
		}

		/**
		* Inherits from NATION.EventDispatcher
		* @ignore
		*/
		InfiniteScroll.prototype = Object.create(NATION.EventDispatcher.prototype);
		InfiniteScroll.prototype.constructor = InfiniteScroll;

		/**
		* Event that fires when a new set of content has finished loading
		*/
		InfiniteScroll.prototype.LOADED = "Loaded";
		/**
		* Event that fires when there is no more content to load
		*/
		InfiniteScroll.prototype.ALL_LOADED = "AllLoaded";
		/**
		* Event that fires when the first set of additional content is loaded. Useful if your application/website needs to change UI once an infinite scroll has been initiated
		*/
		InfiniteScroll.prototype.FIRST_LOAD = "FirstLoad";
		/**
		* Event that fires when a new load request has just been sent to the server
		*/
		InfiniteScroll.prototype.LOAD_STARTED = "LoadStarted";
		/**
		* Event that fires when a new set of content has been prepared and is ready to be inserted into the DOM
		*/
		InfiniteScroll.prototype.CONTENT_READY = "ContentReady";

		/**
		* Returns a NodeList of all items added in all previous loads
		* @param {boolean} previousLoadOnly If true, this will only return items from the previous load. This will return an Array, rather than a NodeList.
		* @return {nodelist} A list of all loaded items requested
		*/
		InfiniteScroll.prototype.getLoadedItems = function(previousLoadOnly) {
			if (previousLoadOnly) {
				var nodeArray = [].slice.call(this.__DOMElement.querySelectorAll(".js-loaded-item"));
				nodeArray = nodeArray.slice(-this.lastItemLoadCount);
				return nodeArray;
			} else {
				return this.__DOMElement.querySelectorAll(".js-loaded-item");
			}
		}

		/**
		* Re-fetches the next URL from the pagination as it currently exists and updates all selectors
		*
		* This is useful if you wish to re-use the same container for a whole new set of content/pagination
		*/
		InfiniteScroll.prototype.reset = function() {
			this.loading = false;
			this.updateElementReferences();
			this.nextURL = (this.__paginationElement.querySelector(this.options.nextSelector)) ? this.__paginationElement.querySelector(this.options.nextSelector).getAttribute("href") : "";
			this.prepareLoadingMessage();
			// Scroll the element back to the top
			if (this.options.scrollSelector !== window) {
				this.options.scrollSelector.scrollTop = 0;
			}
			// Remove old listeners and create new ones based on the updated element references
			this.removeListeners();
			if (!this.allContentLoaded) {
				this.createListeners();
			}
		}

		/**
		* Error strings
		* @ignore
		*/
		InfiniteScroll.prototype.ERROR_MISSING_SELECTOR = "NATION.InfiniteScroll: The '{{selector}}' argument is required.";
		InfiniteScroll.prototype.ERROR_LOAD_FAILED = "NATION.InfiniteScroll: The url '{{url}}' could not be loaded.";

		/**
		* Perform initial setup
		* @ignore
		*/
		InfiniteScroll.prototype.setup = function() {
			this.prepareLoadingMessage();
			this.createListeners();
		}

		/**
		* Refresh stored selectors for key elements. Useful when all infinite scroll content has been changed externally
		* @ignore
		*/
		InfiniteScroll.prototype.updateElementReferences = function() {
			// Store or generate the unique selector string for the content selector
			var uniqueSelector = {};
			if (typeof this.selector !== "string") {
				uniqueSelector = this.generateUniqueSelectorString(this.selector);
				this.selectorString = uniqueSelector.selectorString;
				this.selectorMatchID = uniqueSelector.matchID;
			} else {
				this.selectorString = this.selector;
			}
			this.__DOMElement = document.documentElement.querySelectorAll(this.selectorString)[this.selectorMatchID];
			// Store or generate the unique selector string for the pagination selector
			if (typeof this.paginationSelector !== "string") {
				uniqueSelector = this.generateUniqueSelectorString(this.paginationSelector);
				this.paginationString = uniqueSelector.selectorString;
				this.paginationMatchID = uniqueSelector.matchID;
			} else {
				this.paginationString = this.paginationSelector;
			}
			this.__paginationElement = document.documentElement.querySelectorAll(this.paginationString)[this.paginationMatchID];
			// If a load button selector exists, make sure it's a DOM element
			if (this.options.loadButtonSelector) {
				if (typeof this.options.loadButtonSelector !== "string") {
					uniqueSelector = this.generateUniqueSelectorString(this.options.loadButtonSelector);
					this.loadButtonSelectorString = uniqueSelector.selectorString;
					this.loadButtonMatchID = uniqueSelector.matchID;
				} else {
					this.loadButtonSelectorString = this.options.loadButtonSelector;
				}
				this.__loadButton = document.documentElement.querySelectorAll(this.loadButtonSelectorString)[this.loadButtonMatchID];
			}
			// If a scroll selector was passed in, make sure it's a DOM element
			if (this.options.scrollSelector && this.options.scrollSelector !== window) {
				var scrollSelectorString = "", scrollMatchID = 0;
				if (typeof this.options.scrollSelector !== "string") {
					uniqueSelector = this.generateUniqueSelectorString(this.options.scrollSelector);
					scrollSelectorString = uniqueSelector.selectorString;
					scrollMatchID = uniqueSelector.matchID;
				} else {
					scrollSelectorString = this.options.scrollSelector;
				}
				this.options.scrollSelector = document.documentElement.querySelectorAll(scrollSelectorString)[scrollMatchID];
			}
		}

		/**
		* Insert the message that shows during a page load
		* @ignore
		*/
		InfiniteScroll.prototype.prepareLoadingMessage = function() {
			if (this.__loadMessage && this.__DOMElement.contains(this.__loadMessage)) {
				this.__DOMElement.removeChild(this.__loadMessage);
			}
			this.__loadMessage = document.createElement("div");
			this.__loadMessage.setAttribute("id", "infinite-scroll-loading-msg");
			this.__loadMessage.className = "infinite-scroll-loading-display";
			var __paragraph = document.createElement("p");
			__paragraph.innerHTML = this.options.loadingCopy;
			this.__loadMessage.appendChild(__paragraph);
			this.__DOMElement.appendChild(this.__loadMessage);
			this.__loadMessage.style.display = "none";
		}

		/**
		* Listen for scroll events, and potentially, clicks of a load more button
		* @ignore
		*/
		InfiniteScroll.prototype.createListeners = function() {
			if (this.__loadButton) {
				this.handler_loadButtonClicked = this.onLoadButtonClicked.bind(this);
				this.__loadButton.addEventListener("click", this.handler_loadButtonClicked);
			}
			this.handler_containerScrolled = this.onContainerScrolled.bind(this);
			this.options.scrollSelector.addEventListener("scroll", this.handler_containerScrolled);
		}

		/**
		* Remove existing listeners (called by the new reset method)
		* @ignore
		*/
		InfiniteScroll.prototype.removeListeners = function() {
			if (this.__loadButton) {
				this.__loadButton.removeEventListener("click", this.handler_loadButtonClicked);
			}
			if (this.handler_containerScrolled) {
				this.options.scrollSelector.removeEventListener("scroll", this.handler_containerScrolled);
			}
		}

		/**
		* If a DOM element or jQuery object got passed in, a selector string must be generated here
		* as this is used to pick content out from the loaded pages
		* @ignore
		*/
		InfiniteScroll.prototype.generateUniqueSelectorString = function(selector) {
			var selectorType = typeof selector;
			if (selectorType.toLowerCase() === "string") {
				// Selector is already a string, return it directly
				return selector;
			} else {
				selector = NATION.Utils.getDOMElement(selector);
				// Otherwise build up a selector string
				var selectorString = this.getSelectorSection(selector);
				var selectorParent = selector;
				var parentElement = null, matchID = 0;
				// Loop through the element's parents, and build up a query string
				while (selectorParent.parentNode.nodeName.toLowerCase() !== "body") {
					parentElement = selectorParent.parentNode;
					selectorString = this.getSelectorSection(parentElement) + " > " + selectorString;
					selectorParent = parentElement;
				}
				// If there is still more than one match for the generated selector string
				var matches = document.documentElement.querySelectorAll(selectorString);
				if (matches.length > 1) {
					var i = 0, length = matches.length
					for (; i < length; i++) {
						// Check if this match is the same element as the element that was originally passed into the class
						if (matches[i] === selector) {
							// Store the ID of the match for later use when parsing a loaded page
							matchID = i;
							break;
						}
					}
				}
				return {
					selectorString: selectorString,
					matchID: matchID
				};
			}
		}

		/**
		* Generate part of a selector string based on whether the element has a class or id
		* If it has neither, just use the tag name itself as the selector
		* @ignore
		*/
		InfiniteScroll.prototype.getSelectorSection = function(element) {
			var selectorString = "";
			if (element.className) {
				selectorString = "." + element.className.replace(/\s/g, ".");
			} else if (element.id) {
				selectorString = "#" + element.id;
			} else {
				selectorString = element.nodeName;
			}
			return selectorString;
		}

		/**
		* Load a new page using the previously populated this.nextURL variable
		* @ignore
		*/
		InfiniteScroll.prototype.loadContent = function() {
			if (this.nextURL && !this.loading) {
				if (this.options.scrollSelector === window) {
					this.lastScrollPosition = window.pageYOffset - this.options.scrollTrigger;
				} else {
					this.lastScrollPosition = this.options.scrollSelector.scrollTop - this.options.scrollTrigger;
				}
				this.loading = true;
				this.__loadMessage.style.display = "block";
				NATION.Utils.ajax({
					url: this.nextURL,
					dataType: "text",
					success: this.onContentLoadComplete.bind(this),
					error: this.onContentLoadError.bind(this)
				});
			}
		}

		/**
		* Append the new content to the main container and get the next URL to load from the loaded page
		* @ignore
		*/
		InfiniteScroll.prototype.onContentLoadComplete = function(data) {
			// Force the scroll position to before the trigger point, to prevent Firefox jumping to the bottom of the page constantly
			if (this.options.scrollSelector === window) {
				if (window.pageYOffset >= this.lastScrollPosition) {
					window.scrollTo(window.pageXOffset, this.lastScrollPosition);
				}
			} else {
				if (this.options.scrollSelector.scrollTop >= this.lastScrollPosition) {
					this.options.scrollSelector.scrollTop = this.lastScrollPosition - 200;
				}
			}

			this.loading = false;
			if (this.__loadButton && this.options.alwaysButtonTrigger) {
				this.__loadButton.className = this.__loadButton.className.replace(/ disabled|disabled/gi, "");
			}
			var loadedPage = document.createElement("div");
			loadedPage.innerHTML = data;
			// If a next button is found in the loaded page, remove it/them
			if (this.loadButtonSelectorString) {
				var duplicateLoadButton = loadedPage.querySelector(this.loadButtonSelectorString);
				if (duplicateLoadButton) {
					var regex = new RegExp(duplicateLoadButton.outerHTML, "gi");
					loadedPage.innerHTML = data.toString().replace(regex, "");
				}
			}
			if (this.selectorMatchID > 0) {
				this.loadedEntries = loadedPage.querySelectorAll(this.selectorString)[this.selectorMatchID].children;
			} else {
				this.loadedEntries = loadedPage.querySelector(this.selectorString).children;
			}
			this.lastItemLoadCount = this.loadedEntries.length;
			// Only run the following code if new entries were indeed loaded
			if (this.loadedEntries.length) {
				// Cycle through each item and add a 'loaded-item' class
				var i = 0, length = this.loadedEntries.length;
				for (; i < length; i++) {
					if (this.loadedEntries[i].className.search("js-loaded-item")) {
						this.loadedEntries[i].className += " js-loaded-item";
					}
				}
				// Signal that items have been loaded and are ready to be added to the DOM
				this.trigger(this.CONTENT_READY);
				// Add each item to the DOMElement
				while (this.loadedEntries.length) {
					this.__DOMElement.appendChild(this.loadedEntries[0]);
				}
				// Move the loading message to the bottom of the container
				this.__DOMElement.appendChild(this.__loadMessage);

				// Get the url for the next page from within the loaded page
				if (loadedPage.querySelector(this.paginationString)) {
					this.nextURL = loadedPage.querySelector(this.paginationString).querySelector(this.options.nextSelector);
				} else {
					this.nextURL = "";
				}
				this.trigger(this.LOADED);
				if (this.nextURL) {
					// Next anchor was found, so get the URL
					this.nextURL = this.nextURL.getAttribute("href");
					this.hideLoadMessage(false);
				} else {
					// No more pages to load
					this.hideLoadMessage(true);
					this.removeListeners();
					this.allContentLoaded = true;
					this.trigger(this.ALL_LOADED);
				}
			}
		}

		/**
		* Hide the loading message instantly if there is more pages to load
		* Otherwise, leave it visible for a short while before hiding it
		* @ignore
		*/
		InfiniteScroll.prototype.hideLoadMessage = function(noMorePages) {
			if (!noMorePages) {
				this.__loadMessage.style.display = "none";
			} else {
				this.__loadMessage.querySelector("p").innerHTML = this.options.loadCompleteCopy;
				this.__loadMessage.className += " complete";
				if (this.__loadButton) {
					this.__loadButton.style.display = "none";
				}
				if (this.loadCompleteTimer) clearTimeout(this.loadCompleteTimer);
				this.loadCompleteTimer = setTimeout(this.onLoadCompleteTimerTicked.bind(this), 2000);
			}
		}

		/**
		* Hide the loading message fully
		* @ignore
		*/
		InfiniteScroll.prototype.onLoadCompleteTimerTicked = function() {
			this.hideLoadMessage(false);
		}

		/**
		* A page failed to load, throw a warning in the console
		* @ignore
		*/
		InfiniteScroll.prototype.onContentLoadError = function(e) {
			if (window.console && window.console.warn) console.warn(this.ERROR_LOAD_FAILED.replace("{{url}}", this.nextURL));
		}

		/**
		* Load more content if a load isn't already in progress
		* @ignore
		*/
		InfiniteScroll.prototype.onLoadButtonClicked = function(e) {
			if (!this.loading) {
				if (!this.options.alwaysButtonTrigger) {
					// Enable scroll-triggered loads to happen
					this.autoLoadEnabled = true;
					this.__loadButton.style.display = "none";
					this.trigger(this.FIRST_LOAD);
				} else {
					// Show the button as disabled
					this.__loadButton.style.className += " disabled";
				}
				this.loadContent();
			}
			e.preventDefault();
		}

		/**
		* Load more content if the container scrolls past the trigger point
		* @ignore
		*/
		InfiniteScroll.prototype.onContainerScrolled = function(e) {
			if (!this.loading && this.paginationSelector && this.autoLoadEnabled) {
				var currentScrollTop = this.options.scrollSelector.scrollTop;
				if (this.options.scrollSelector === window) {
					var contentBottom = this.__DOMElement.getBoundingClientRect().bottom;
					if ((contentBottom - this.options.scrollTrigger <= window.innerHeight)) {
						this.loadContent();
					}
				} else {
					var scrollTriggerY = 0;
					scrollTriggerY = (this.__DOMElement.scrollHeight - this.__DOMElement.clientHeight) - this.options.scrollTrigger;
					if (currentScrollTop >= scrollTriggerY) {
						this.loadContent();
					}
				}
				
			}
		}
		window.NATION.InfiniteScroll = InfiniteScroll;
	}

}(window, document, undefined));