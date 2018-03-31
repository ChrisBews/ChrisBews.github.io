// Shows the days/hours/minutes/seconds remaining until target time

NATION.Utils.createNamespace("BISDT.modules.Countdown.views");

BISDT.modules.Countdown.views.TimeRemainingView = function(DOMElement) {
	
	"use strict";
	
	//------------------------------------------------
	// Variables
	//------------------------------------------------
	var daysElement = null;
	var hoursElement = null;
	var minutesElement = null;
	var secondsElement = null;

	//------------------------------------------------
	// Init
	//------------------------------------------------
	function init() {
		daysElement = DOMElement.querySelector(".days .value");
		hoursElement = DOMElement.querySelector(".hours .value");
		minutesElement = DOMElement.querySelector(".minutes .value");
		secondsElement = DOMElement.querySelector(".seconds .value");
	}

	//------------------------------------------------
	// Insert the new times into their respective elements
	//------------------------------------------------
	function update(timeRemaining) {
		daysElement.textContent = addLeadingZero(timeRemaining.days);
		hoursElement.textContent = addLeadingZero(timeRemaining.hours);
		minutesElement.textContent = addLeadingZero(timeRemaining.minutes);
		secondsElement.textContent = addLeadingZero(timeRemaining.seconds);
	}

	//------------------------------------------------
	// Add a 0 to the start if value is less than 10
	//------------------------------------------------
	function addLeadingZero(value) {
		if (value < 10) value = "0" + value.toString();
		return value;
	}

	init();

	return {
		update: update
	}
};