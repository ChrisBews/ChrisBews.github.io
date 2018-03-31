// Updates deep links during a scroll using the IDs of children as they come into view

NATION.Utils.createNamespace("BISDT.modules.VerticalSections");

BISDT.modules.VerticalSections.Controller = function(DOMElement) {
	
	"use strict";
	
	//------------------------------------------------
	// Variables
	//------------------------------------------------
	var sectionsView = null;
	var sections = [];
	var activeSection = "";
	var scrollTimer = null;
	var scrollPos = 0;

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	function init() {
		sections = DOMElement.querySelectorAll(".section");
		createViews();
		checkStartingState();
		createListeners();
	}

	//------------------------------------------------
	// Check if the user already deep linked in
	//------------------------------------------------
	function checkStartingState() {
		var state = BISDT.History.getCurrentState();
		if (state.length) {
			sectionsView.setCurrentSection(state[0]);
		}
	}

	//------------------------------------------------
	// View that handles sections
	//------------------------------------------------
	function createViews() {
		sectionsView = new BISDT.modules.VerticalSections.views.SectionsView(DOMElement);
	}

	//------------------------------------------------
	// Listen for section changes
	//------------------------------------------------
	function createListeners() {
		BISDT.Mediator.subscribe(BISDT.Events.URL_CHANGED, function(data) {onURLChanged(data);});
		sectionsView.addListener(BISDT.Events.SECTION_CHANGE, function(e) {onActiveSectionChange(e);});
		window.addEventListener("scroll", function(e) {onWindowScrolled(e);});
	}

	//------------------------------------------------
	// Check for the highest section
	//------------------------------------------------
	function adjustToScroll() {
		if (scrollTimer) {
			clearTimeout(scrollTimer);
			scrollTimer = null;
		}
		scrollPos = NATION.Utils.getPageElement().scrollTop;
		sectionsView.updateCurrentSection(scrollPos, window.innerHeight);
	}

	//------------------------------------------------
	// Update the URI shown in the address bar
	//------------------------------------------------
	function onActiveSectionChange(e) {
		if (!sectionsView.getAnimating()) {
			var data = {
				path: "/" + sectionsView.getCurrentSection(),
				state: {
					id: sectionsView.getCurrentSection()
				}
			};
			scrollPos = NATION.Utils.getPageElement().scrollTop;
			BISDT.Mediator.publish(BISDT.Events.CHANGE_URL, data);
		}
	}

	//------------------------------------------------
	// Update scroll on a timer to avoid too many calls
	//------------------------------------------------
	function onWindowScrolled(e) {
		if (!scrollTimer) {
			scrollTimer = setTimeout(function() {adjustToScroll();}, 20);
		}
	}

	//------------------------------------------------
	// Move to requested section
	//------------------------------------------------
	function onURLChanged(data) {
		if (data) {
			if (data.id !== sectionsView.getCurrentSection()) {
				sectionsView.scrollToSection(data.id);
			}
		}
	}

	init();
};