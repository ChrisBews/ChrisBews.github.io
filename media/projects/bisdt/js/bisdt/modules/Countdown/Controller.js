// Countdown to end of race

NATION.Utils.createNamespace("BISDT.modules.Countdown");

BISDT.modules.Countdown.Controller = function(DOMElement) {
	
	"use strict";
	
	//------------------------------------------------
	// Variables
	//------------------------------------------------
	var timeModel = null;
	var timeRemainingView = null;

	//------------------------------------------------
	// Init
	//------------------------------------------------
	function init() {
		createModels();
		createViews();
		createListeners();
		timeModel.startTimer();
	}

	//------------------------------------------------
	// Handle events
	//------------------------------------------------
	function createListeners() {
		DOMElement.querySelector(".details-scroll").addEventListener("click", function(e) {onDetailsScrollClicked(e);});
		timeModel.addListener(timeModel.events.TIME_UPDATE, function(e) {onTimeUpdate(e);});
	}

	//------------------------------------------------
	// Model counts down the time
	//------------------------------------------------
	function createModels() {
		var targetTime = DOMElement.getAttribute("data-time");
		timeModel = new BISDT.modules.Countdown.models.TimeModel(targetTime);
	}

	//------------------------------------------------
	// Displays the separated time periods
	//------------------------------------------------
	function createViews() {
		timeRemainingView = new BISDT.modules.Countdown.views.TimeRemainingView(DOMElement);
	}
	
	//------------------------------------------------
	// Update the time displayed
	//------------------------------------------------
	function onTimeUpdate() {
		timeRemainingView.update(timeModel.getTimeRemaining());
	}

	//------------------------------------------------
	// Scroll page to relevant section
	//------------------------------------------------
	function onDetailsScrollClicked(e) {
		BISDT.Mediator.publish(BISDT.Events.SCROLL_REQUEST, {selector: ".stores"});
		e.stopPropagation();
		e.preventDefault();
	}

	init();
};