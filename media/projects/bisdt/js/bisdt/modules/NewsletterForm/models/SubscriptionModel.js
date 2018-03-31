// Handles new subscriptions

NATION.Utils.createNamespace("BISDT.modules.NewsletterForm.models");

BISDT.modules.NewsletterForm.models.SubscriptionModel = function(subscribeURL, method) {
	
	"use strict";
	
	//------------------------------------------------
	// Events
	//------------------------------------------------
	var events = {
		SUBSCRIBE_COMPLETE: "SubscribeComplete"
	};

	//------------------------------------------------
	// Variables
	//------------------------------------------------
	var formData = "";

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	function init() {

	}

	//------------------------------------------------
	// Check if email address is valid
	//------------------------------------------------
	function validateEmail(value, defaultValue) {
		if (value.replace(/ /g, "") === "" || value === defaultValue || value.search("@") < 0) {
			return false;
		} else {
			return true;
		}
	}

	//------------------------------------------------
	// Expects a serialized string
	//------------------------------------------------
	function setFormData(data) {
		formData = data;
	}

	//------------------------------------------------
	// Subscribe user server-side
	//------------------------------------------------
	function subscribeUser() {
		console.log(formData);
		NATION.Utils.ajax({
			url: subscribeURL,
			method: method,
			data: formData,
			success: function() {
				api.trigger(events.SUBSCRIBE_COMPLETE);
			},
			error: function() {
				if (typeof window.console !== "undefined" && console.warn) console.warn("Unable to subscribe user to competition");
			}
		});
	}

	init();

	//----------------------------------------------------------------------
	// Public API
	//----------------------------------------------------------------------
	var api = Object.create(NATION.EventDispatcher());

	api.events = events;
	api.validateEmail = validateEmail;
	api.setFormData = setFormData;
	api.subscribeUser = subscribeUser;

	return api;
};