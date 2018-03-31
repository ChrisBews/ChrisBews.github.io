// Handle tracking via Google Analytics

NATION.Utils.createNamespace("BISDT.modules.PageManager.models");

BISDT.modules.PageManager.models.Tracking = (function() {
	
	"use strict";

	//------------------------------------------------
	// Variables
	//------------------------------------------------
	var trackingTimer = null;
	var requestedCategory = "";
	var requestedAction = "";
	var requestedLabel = "";
	var requestedValue = "";
	var requestedFields = [];

	//------------------------------------------------
	// Standard GA event tracking
	//------------------------------------------------
	function trackEvent(category, action, label, value) {
		if (typeof ga !== "undefined") {
			if (value) {
				ga("send", "event", category, action, label, value);
			} else if (label) {
				ga("send", "event", category, action, label);
			} else if (action) {
				ga("send", "event", category, action);
			} else {
				throw new Error("TrackingManager: Category and action are required to track an event.");
			}
		} else {
			if (console && console.warn) console.warn("Attempted to track event category: " + category + ", action: " + action + ", label = " + label + ", but GA was undefined. Attempting to retry after a delay.");
			trackingTimer = setTimeout(function() {checkForGA();}, 1000);
		}
	}

	//------------------------------------------------
	// Allows custom fields to be defined
	// Potential fields are defined at the following URL:
	// https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference
	//------------------------------------------------
	function trackEventWithFields(category, action, fields) {
		if (typeof ga !== "undefined") {
			if (fields) {
				ga("send", "event", category, action, fields);
			} else {
				ga("send", "event", category, action);
			}
		} else {
			if (console && console.warn) console.warn("Attempted to track event with fields category: " + category + ", action: " + action + ", but GA was undefined. Attempting to retry after a delay.");
			trackingTimer = setTimeout(function() {checkForGA();}, 1000);
		}
	}

	//------------------------------------------------
	// Wait for GA to become available
	//------------------------------------------------
	function checkForGA() {
		clearTimeout(trackingTimer);
		if (typeof ga !== "undefined") {
			if (console && console.warn) console.warn("GA is now ready. Tracking last requested event.");
			if (requestedFields) {
				trackEventWithFields(requestedCategory, requestedAction, requestedFields);
			} else {
				trackEvent(requestedCategory, requestedAction, requestedLabel, requestedLabel);
			}
		} else {
			trackingTimer = setTimeout(function() {checkForGA();}, 1000);
		}
	}

	return {
		trackEvent: trackEvent,
		trackEventWithFields: trackEventWithFields
	};
}());