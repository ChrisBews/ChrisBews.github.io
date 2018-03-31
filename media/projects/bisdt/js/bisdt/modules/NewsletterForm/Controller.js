// Newsletter form that appears on the entry page

NATION.Utils.createNamespace("BISDT.modules.NewsletterForm");

BISDT.modules.NewsletterForm.Controller = function(DOMElement) {
	
	"use strict";
	
	//------------------------------------------------
	// Variables
	//------------------------------------------------
	var formView = null;
	var subscriptionModel = null;

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	function init() {
		createModels();
		createViews();
		createListeners();
	}

	//------------------------------------------------
	// Model that handles new subs
	//------------------------------------------------
	function createModels() {
		var subscribeURL = DOMElement.querySelector("form").getAttribute("action");
		var subscribeMethod = DOMElement.querySelector("form").getAttribute("method");
		subscriptionModel = new BISDT.modules.NewsletterForm.models.SubscriptionModel(subscribeURL, subscribeMethod);
	}

	//------------------------------------------------
	// Shows errors and complete state
	//------------------------------------------------
	function createViews() {
		formView = new BISDT.modules.NewsletterForm.views.FormView(DOMElement, subscriptionModel);
	}

	//------------------------------------------------
	// Listen for form submissions
	//------------------------------------------------
	function createListeners() {
		formView.addListener(formView.events.FORM_SUBMIT, function() {onFormSubmit();});
		subscriptionModel.addListener(subscriptionModel.events.SUBSCRIBE_COMPLETE, function() {onUserSubscribed();});
	}

	//------------------------------------------------
	// Process form data
	//------------------------------------------------
	function onFormSubmit(e) {
		formView.disableSubmissions();
		subscriptionModel.subscribeUser();
	}

	//------------------------------------------------
	// Show success screen to user
	//------------------------------------------------
	function onUserSubscribed() {
		formView.showSuccessMessage();
	}

	init();
};