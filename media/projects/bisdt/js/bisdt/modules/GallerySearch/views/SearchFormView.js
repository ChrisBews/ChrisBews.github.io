// Newsletter form that appears on the entry page

NATION.Utils.createNamespace("BISDT.modules.GallerySearch.views");

BISDT.modules.GallerySearch.views.SearchFormView = function(DOMElement) {
	
	"use strict";
	
	//------------------------------------------------
	// Variables
	//------------------------------------------------
	var supportsPlaceholder = true;
	var searchFieldSelector = null;
	var defaultSearchTerm = "";
	var smallSearchTerm = "";
	var longLabelShowing = true;
	var searchFieldActive = false;

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	function init() {
		checkForPlaceholderSupport();
		searchFieldSelector = document.getElementById("search");
		getDefaultSearchTerm();
		if (!supportsPlaceholder) {
			searchFieldSelector.value = defaultSearchTerm;
		}
		createListeners();
	}

	//------------------------------------------------
	// Create a dummy field and see if placheolder exists
	//------------------------------------------------
	function checkForPlaceholderSupport() {
		var input = document.createElement("input");
		supportsPlaceholder = (input.placeholder !== undefined);
	}

	//------------------------------------------------
	// Placeholder text to use with <IE10
	//------------------------------------------------
	function getDefaultSearchTerm() {
		defaultSearchTerm = searchFieldSelector.getAttribute("placeholder");
		smallSearchTerm = searchFieldSelector.getAttribute("data-small-copy");
	}

	//------------------------------------------------
	// Listen for form interaction
	//------------------------------------------------
	function createListeners() {
		var focusOutEvent = (NATION.Utils.isEventSupported("focusout")) ? "focusout" : "blur";
		var focusInEvent = (NATION.Utils.isEventSupported("focusin")) ? "focusin" : "focus";
		if (!supportsPlaceholder) {
			searchFieldSelector.addEventListener(focusOutEvent, function(e) {onSearchFieldFocusOut(e);});
		}
		searchFieldSelector.addEventListener(focusInEvent, function(e) {onSearchFieldFocusIn(e);});
		DOMElement.querySelector("form").addEventListener("submit", function(e) {onFormSubmit(e);});
	}

	//------------------------------------------------
	// Show error in form field
	//------------------------------------------------
	function showError() {
		searchFieldSelector.className += " error";
		searchFieldSelector.value = searchFieldSelector.getAttribute("data-error");
	}

	//------------------------------------------------
	// Resize
	//------------------------------------------------
	function resize() {
		// 385 = Size of the search box at normal desktop sizes
		if (searchFieldSelector.clientWidth < 385 && longLabelShowing) {
			// Switch to smaller text inside search field
			showSmallerSearchLabel();
		} else if (searchFieldSelector.clientWidth >= 385 && !longLabelShowing) {
			// Switch to longer text inside search field
			showLongerSearchLabel();
		}
	}

	//------------------------------------------------
	// Show the smaller placeholder text
	//------------------------------------------------
	function showSmallerSearchLabel() {
		longLabelShowing = false;
		if (!supportsPlaceholder) {
			searchFieldSelector.value = smallSearchTerm;
		}
		searchFieldSelector.setAttribute("placeholder", smallSearchTerm);
	}

	//------------------------------------------------
	// Show the longer placeholder text
	//------------------------------------------------
	function showLongerSearchLabel() {
		longLabelShowing = true;
		if (!supportsPlaceholder) {
			searchFieldSelector.value = defaultSearchTerm;
		}
		searchFieldSelector.setAttribute("placeholder", defaultSearchTerm);
	}

	//------------------------------------------------
	// Insert placeholder if needed
	//------------------------------------------------
	function onSearchFieldFocusOut(e) {
		var currentValue = searchFieldSelector.value;
		if (currentValue.replace(/ /g, "") === "") {
			searchFieldSelector.value = (longLabelShowing) ? defaultSearchTerm : smallSearchTerm;
		}
	}

	//------------------------------------------------
	// Remove error state if it exists
	//------------------------------------------------
	function onSearchFieldFocusIn(e) {
		if (searchFieldSelector.className.search("error") > -1) {
			searchFieldSelector.className = searchFieldSelector.className.replace(/error| error/g, "");
			searchFieldSelector.value = "";
		}
		if (!supportsPlaceholder) {
			var currentValue = searchFieldSelector.value;
			if (currentValue === defaultSearchTerm || currentValue === smallSearchTerm) {
				searchFieldSelector.value = "";
			}
		}
		searchFieldActive = true;
	}

	//------------------------------------------------
	// Check if a term was entered first
	//------------------------------------------------
	function onFormSubmit(e) {
		searchFieldSelector.blur()
		var currentValue = searchFieldSelector.value;
		if (currentValue.replace(/ /g, "") === "" || currentValue === defaultSearchTerm) {
			showError();
			e.stopPropagation();
			e.preventDefault();
		}
		searchFieldActive = false;
		// Otherwise let the form submit naturally
	}

	init();

	return {
		resize: resize
	}
};