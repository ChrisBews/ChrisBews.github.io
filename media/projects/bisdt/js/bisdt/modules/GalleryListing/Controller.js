// Infinite scrollling list of entries

NATION.Utils.createNamespace("BISDT.modules.GalleryListing");

BISDT.modules.GalleryListing.Controller = function(DOMElement) {
	
	"use strict";
	
	//------------------------------------------------
	// Variables
	//------------------------------------------------
	var infiniteScroll = null;

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	function init() {
		createInfiniteScroll();
		createListeners();
	}

	//------------------------------------------------
	// Initialise infinite scroll class
	//------------------------------------------------
	function createInfiniteScroll() {
		var selector = ".listing";
		var paginationSelector = ".pager";
		var nextSelector = ".pager-next a";
		var loadButtonSelector = DOMElement.querySelector(".more-button");
		var loadingCopy = DOMElement.getAttribute("data-loading-copy");
		var completeCopy = DOMElement.getAttribute("data-complete-copy");
		var options = {
			nextSelector: nextSelector,
			loadButtonSelector: loadButtonSelector,
			loadingCopy: loadingCopy,
			loadCompleteCopy: completeCopy
		};

		if (loadButtonSelector) {
			infiniteScroll = new NATION.InfiniteScroll(selector, paginationSelector, options);
		}
	}

	//------------------------------------------------
	// Wait for content loading to start
	//------------------------------------------------
	function createListeners() {
		if (infiniteScroll) {
			infiniteScroll.addListener(infiniteScroll.FIRST_LOAD, function(e) {onFirstLoadStarted(e);});
			infiniteScroll.addListener(infiniteScroll.ALL_LOADED, function(e) {onAllEntriesLoaded(e);});
		}
	}

	//------------------------------------------------
	// Add bottom margin to listing so 'loading' message
	// can appear below the listing itself
	//
	// Tom S: add padding to listing background so this
	// is also visible behind the 'loading' message
	//------------------------------------------------
	function onFirstLoadStarted() {
		var button = DOMElement.querySelector(".more-button");
		var padding = parseInt(NATION.Utils.getStyle(button, "marginTop"), 10);
		padding += button.clientHeight;
		padding += parseInt(NATION.Utils.getStyle(button, "marginBottom"), 10);
		DOMElement.querySelector(".listing").style.marginBottom = padding + "px";
		document.querySelector(".gallery-content").style.paddingBottom = 10 + "px";
	}

	//------------------------------------------------
	// Change button style when all content has loaded
	//------------------------------------------------
	function onAllEntriesLoaded() {
		var message = DOMElement.querySelector(".infinite-scroll-loading-display p");
		message.className += " complete";
	}

	init();

};