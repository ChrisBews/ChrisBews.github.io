// Shows the days/hours/minutes/seconds remaining until target time

NATION.Utils.createNamespace("BISDT.modules.Countdown.models");

BISDT.modules.Countdown.models.TimeModel = function(targetTime) {
	
	"use strict";
	
	//------------------------------------------------
	// Events
	//------------------------------------------------
	var events = {
		TIME_UPDATE: "TimeUpdate",
		COMPLETE: "Complete"
	};

	//------------------------------------------------
	// Variables
	//------------------------------------------------
	var targetTimestamp = 0;
	var currentTimestamp = 0;
	var timeRemaining = 0;
	var timer = null;
	var remainingDays = 0;
	var remainingHours = 0;
	var remainingMinutes = 0;
	var remainingSeconds = 0;

	//------------------------------------------------
	// Init
	//------------------------------------------------
	function init() {
		targetTimestamp = parseInt(targetTime, 10);
	}

	//------------------------------------------------
	// Start counting down to target time
	//------------------------------------------------
	function startTimer() {
		onTimerTicked();
	}

	//------------------------------------------------
	// Stop counting down
	//------------------------------------------------
	function stopTimer() {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
	}

	//------------------------------------------------
	// Split up time remaining into days/hours/etc
	//------------------------------------------------
	function parseTimeRemaining() {
		var seconds = timeRemaining;
		if (timeRemaining < 0) {
			// Avoid negatives, everything should be 0 at this point
			remainingDays = remainingHours = remainingMinutes = remainingSeconds = 0;
		} else {
			// Days
			remainingDays = Math.floor(seconds / 86400);
			seconds -= (remainingDays * 86400);
			// Hours
			remainingHours = Math.floor(seconds / 3600);
			seconds -= (remainingHours * 3600);
			// Minutes
			remainingMinutes = Math.floor(seconds / 60);
			seconds -= (remainingMinutes * 60);
			// Seconds
			remainingSeconds = Math.round(seconds);
		}
	}

	//------------------------------------------------
	// Updates the time remaining
	//------------------------------------------------
	function onTimerTicked() {
		currentTimestamp = Math.round(Date.now() / 1000);
		timeRemaining = targetTimestamp - currentTimestamp;
		parseTimeRemaining();
		api.trigger(events.TIME_UPDATE);
		if (currentTimestamp < targetTimestamp) {
			// Continue counting down
			stopTimer();
			timer = setTimeout(function() {onTimerTicked();}, 1000);
		} else {
			// Target time has been reached
			api.trigger(events.COMPLETE);
		}
	}

	init();

	//----------------------------------------------------------------------
	// Public API
	//----------------------------------------------------------------------
	var api = Object.create(NATION.EventDispatcher());

	api.events = events;
	api.startTimer = startTimer;
	api.stopTimer = stopTimer;
	api.getTimeRemaining = function () {return {
		days: remainingDays,
		hours: remainingHours,
		minutes: remainingMinutes,
		seconds: remainingSeconds
	}};

	
	return api;

};