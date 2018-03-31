// Controls the visual state of the form

NATION.Utils.createNamespace("BISDT.modules.NewsletterForm.views");

BISDT.modules.NewsletterForm.views.FormView = function(DOMElement, model) {
	
	"use strict";
	
	//------------------------------------------------
	// Events
	//------------------------------------------------
	var events = {
		FORM_SUBMIT: "FormSubmit"
	};

	//------------------------------------------------
	// Variables
	//------------------------------------------------
	var supportsPlaceholder = true;
	var emailSelector = null;
	var termsSelector = null;
	var defaultEmailValue = "";
	var requiredCheckboxes = [];
	var errorMessageShowing = false;
	var submissionsDisabled = false;

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	function init() {
		checkForPlaceholderSupport();
		getFieldReferences();
		if (!supportsPlaceholder) {
			getDefaultEmailValue();
			emailSelector.value = defaultEmailValue;
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
	// Stores the placeholder text for <IE10
	//------------------------------------------------
	function getDefaultEmailValue() {
		defaultEmailValue = emailSelector.getAttribute("placeholder");
	}

	//------------------------------------------------
	// Store references to elements
	//------------------------------------------------
	function getFieldReferences() {
		emailSelector = document.getElementById("email");
		requiredCheckboxes = DOMElement.querySelectorAll("input[type='checkbox'][data-required]");
	}

	//------------------------------------------------
	// Listen for form interaction
	//------------------------------------------------
	function createListeners() {
		var focusOutEvent = (NATION.Utils.isEventSupported("focusout")) ? "focusout" : "blur";
		var focusInEvent = (NATION.Utils.isEventSupported("focusin")) ? "focusin" : "focus";
		if (!supportsPlaceholder) {
			emailSelector.addEventListener(focusOutEvent, function(e) {onEmailFocusOut(e);});
		}
		emailSelector.addEventListener(focusInEvent, function(e) {onEmailFocusIn(e);});
		DOMElement.querySelector("form").addEventListener("submit", function(e) {onFormSubmit(e);});
		var i = 0, length = requiredCheckboxes.length;
		for (; i < length; i++) {
			requiredCheckboxes[i].addEventListener("click", function(e) {onCheckboxClicked(e);});
		}
	}

	//------------------------------------------------
	// Check form for errors
	//------------------------------------------------
	function validateForm() {
		var email = emailSelector.value;
		var emailValid = model.validateEmail(email, defaultEmailValue);
		var validForm = true;
		if (!emailValid) {
			emailSelector.className += " error";
			validForm = false;
		}
		var i = 0, length = requiredCheckboxes.length;
		for (; i < length; i++) {
			if (!requiredCheckboxes[i].checked) {
				requiredCheckboxes[i].className += " error";
				validForm = false;
			}
		}
		return validForm;
	}

	//------------------------------------------------
	// Reveal standard error message
	//------------------------------------------------
	function showErrorMessage() {
		errorMessageShowing = true;
		var errorMessage = DOMElement.querySelector(".errors");
		errorMessage.style.display = "block";
		var errorHeight = errorMessage.clientHeight;
		errorMessage.style.height = 0;
		errorMessage.firstChild.style.opacity = 0;
		NATION.Animation.start(errorMessage, {height: errorHeight}, {easing: "easeInOutQuad", duration: 200}, function() {onSpaceForErrorReady();});
	}

	//------------------------------------------------
	// Fade in the error copy
	//------------------------------------------------
	function onSpaceForErrorReady() {
		var errorMessage = DOMElement.querySelector(".errors");
		errorMessage.style.height = "auto";
		var error = DOMElement.querySelector(".errors").firstChild;
		NATION.Animation.start(error, {opacity: 1}, {easing: "linear", duration: 200});
	}

	//------------------------------------------------
	// Fade out error copy
	//------------------------------------------------
	function hideErrorMessage() {
		errorMessageShowing = false;
		var error = DOMElement.querySelector(".errors").firstChild;
		NATION.Animation.start(error, {opacity: 0}, {easing: "linear", duration: 200}, function() {onErrorCopyHidden();});
	}

	//------------------------------------------------
	// Show button as disabled
	//------------------------------------------------
	function disableSubmissions() {
		submissionsDisabled = true;
		DOMElement.querySelector("input[type='submit']").className += " disabled";
	}

	//------------------------------------------------
	// Gather form data
	//------------------------------------------------
	function updateFormData() {
		var inputs = DOMElement.querySelectorAll("input");
		var data = "", name, value;
		var i = 0, length = inputs.length;
		for (; i < length; i++) {
			name = inputs[i].name
			if (name) {
				value = (inputs[i].type === "checkbox") ? inputs[i].checked : inputs[i].value;
				data += name + "=" + value + "&";
			}
		}
		data = data.substring(0, data.lastIndexOf("&"));
		model.setFormData(data);
	}

	//------------------------------------------------
	// Fade out the form first
	//------------------------------------------------
	function showSuccessMessage() {
		NATION.Animation.start(DOMElement.querySelector("form"), {opacity: 0}, {easing: "linear", duration: 300}, function() {onFormHidden();});
	}

	//------------------------------------------------
	// Fade in complete panel
	//------------------------------------------------
	function onFormHidden() {
		DOMElement.querySelector("form").style.display = "none";
		var completePanel = DOMElement.querySelector(".complete");
		completePanel.style.display = "block";
		completePanel.style.opacity = 0;
		NATION.Animation.start(completePanel, {opacity: 1}, {easing: "linear", duration: 300});
	}

	//------------------------------------------------
	// Shrink error container
	//------------------------------------------------
	function onErrorCopyHidden() {
		var errorMessage = DOMElement.querySelector(".errors");
		NATION.Animation.start(errorMessage, {height: 0}, {easing: "easeInOutQuad", duration: 200});
	}

	//------------------------------------------------
	// Insert placeholder if needed
	//------------------------------------------------
	function onEmailFocusOut(e) {
		var currentValue = emailSelector.value;
		if (currentValue.replace(/ /g, "") === "") {
			e.target.value = defaultEmailValue;
		}
	}

	//------------------------------------------------
	// Clear default value if needed
	//------------------------------------------------
	function onEmailFocusIn(e) {
		if (emailSelector.className.search("error") > -1) {
			emailSelector.className = emailSelector.className.replace(/error| error/g, "");
		}
		if (!supportsPlaceholder) {
			var currentValue = emailSelector.value;
			if (currentValue === defaultEmailValue) {
				emailSelector.value = "";
			}
		}
	}

	//------------------------------------------------
	// Remove error state from checkbox if needed
	//------------------------------------------------
	function onCheckboxClicked(e) {
		if (e.target.checked) {
			if (e.target.className.search("error")) {
				e.target.className = e.target.className.replace(/error| error/g, "");
			}
		}
	}

	//------------------------------------------------
	// Check form is valid first
	//------------------------------------------------
	function onFormSubmit(e) {
		if (!submissionsDisabled) {
			emailSelector.blur();
			var validForm = validateForm();
			if (!validForm) {
				if (!errorMessageShowing) showErrorMessage();
			} else {
				if (errorMessageShowing) {
					hideErrorMessage();
				}
				updateFormData();
				api.trigger(events.FORM_SUBMIT);
			}
		}
		e.stopPropagation();
		e.preventDefault();
	}

	init();

	//----------------------------------------------------------------------
	// Public API
	//----------------------------------------------------------------------
	var api = Object.create(NATION.EventDispatcher());

	api.events = events;
	api.disableSubmissions = disableSubmissions;
	api.showSuccessMessage = showSuccessMessage;

	return api;
};