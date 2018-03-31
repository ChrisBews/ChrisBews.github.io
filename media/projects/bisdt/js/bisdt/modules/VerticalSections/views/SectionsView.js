// 

NATION.Utils.createNamespace("BISDT.modules.VerticalSections.views");

BISDT.modules.VerticalSections.views.SectionsView = function(DOMElement) {
	
	"use strict";
	
	//------------------------------------------------
	// Variables
	//------------------------------------------------
	var sections = [];
	var activeSection = "";
	var animating = false;

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	function init() {
		sections = DOMElement.querySelectorAll(".section");
	}

	//------------------------------------------------
	// Returns string taken from active element's ID
	//------------------------------------------------
	function getCurrentSection() {
		return activeSection;
	}

	//------------------------------------------------
	// Jump to section
	//------------------------------------------------
	function setCurrentSection(id) {
		scrollToSection(id);
	}

	//------------------------------------------------
	// Returns true if page is scrolling via JS
	//------------------------------------------------
	function getAnimating() {
		return animating;
	}

	//------------------------------------------------
	// Work out which section user is looking at
	//------------------------------------------------
	function updateCurrentSection(scrollPos, windowHeight) {
		var i = 0, length = sections.length, newSection;
		// Use half way down the page as the trigger point
		var currentScrollPos = scrollPos + (window.innerHeight/2);
		for (; i < length; i++) {
			if (NATION.Utils.getOffset(sections[i]).top < currentScrollPos) {
				newSection = sections[i].getAttribute("id");
			}
		}
		if (newSection !== activeSection) {
			activeSection = newSection;
			api.trigger(BISDT.Events.SECTION_CHANGE);
		}
	}

	//------------------------------------------------
	// Animate page to requested section
	//------------------------------------------------
	function scrollToSection(sectionID) {
		if (sectionID !== activeSection) {
			activeSection = sectionID;
			animating = true;
			var yPos = NATION.Utils.getOffset(document.getElementById(sectionID)).top;
			NATION.Utils.getPageElement().scrollTop = yPos;
			NATION.Animation.start(NATION.Utils.getPageElement(), {scrollTop: yPos}, {easing: "easeInOutQuad", duration: 500}, function(e) {onScrollComplete(e);});
		}
	}

	//------------------------------------------------
	// Animation has completed
	//------------------------------------------------
	function onScrollComplete(e) {
		animating = false;
	}

	init();

	//----------------------------------------------------------------------
	// Public API
	//----------------------------------------------------------------------
	var api = new NATION.EventDispatcher();

	api.updateCurrentSection = updateCurrentSection;
	api.getCurrentSection = getCurrentSection;
	api.scrollToSection = scrollToSection;
	api.getAnimating = getAnimating;
	api.setCurrentSection = setCurrentSection;

	return api;
};