//////////////////////////////////////////////////////////////////////////////
// Nation Website 2016
// Map showing the studio location, with directions
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	NATION.Utils.createNamespace("NATION2016.views.contact");

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	var StudioMap = function(element) {
		NATION.EventDispatcher.call(this);
		this.__DOMElement = element;
		this.__mapElement = null;
		this.__directionsButtons = null;
		this.__mapZoomButtons = [];
		this.__customDirectionsBubble = null;
		this.__customDirectionsButton = null;
		this.__customDirectionsForm = null;
		this.__customDirectionsInput = null;
		this.nationLatLng = {};
		this.markerIcon = {};
		this.mapOptions = {};
		this.googleMap = null;
		this.mapMarker = null;
		this.directionsRenderer = null;
		this.directionsService = null;
		this.customDirectionsFormURL = "";
		this.inputErrorText = "";
		this.IE9PlaceholderText = "";
		this.mapColorScheme = [
			{
				"featureType": "administrative",
				"elementType": "labels.text.fill",
				"stylers": [
					{"color": "#444444 "}
				]
			}, {
				"featureType": "landscape",
				"elementType": "all",
				"stylers": [
					{"color": "#f2f2f2 "}
				]
			}, {
				"featureType": "poi",
				"elementType": "all",
				"stylers": [
					{"visibility": "off"}
				]
			}, {
				"featureType": "road",
				"elementType": "all",
				"stylers": [
					{"saturation": -100},
					{"lightness": 45}
				]
			}, {
				"featureType": "road.highway",
				"elementType": "all",
				"stylers": [
					{"visibility": "simplified"}
				]
			}, {
				"featureType": "road.arterial",
				"elementType": "labels.icon",
				"stylers": [
					{"visibility": "off"}
				]
			}, {
				"featureType": "transit",
				"elementType": "all",
				"stylers": [
					{"visibility": "off"}
				]
			}, {
				"featureType": "transit.station.rail",
				"elementType": "labels",
				"stylers": [
					{"visibility": "on"}
				]
			}, {
				"featureType": "water",
				"elementType": "all",
				"stylers": [
					{"color": "#3a94d6"},
					{"visibility": "on"}
				]
			}
		];

		this.setup();
	}

	StudioMap.prototype = Object.create(NATION.EventDispatcher.prototype);
	StudioMap.prototype.constructor = StudioMap;

	//------------------------------------------------
	// Perform initial setup
	//------------------------------------------------
	StudioMap.prototype.setup = function() {
		// Store references to directions buttons
		this.__directionsButtons = this.__DOMElement.querySelectorAll(".js-directions-button");
		// Store a reference to the map container
		this.__mapElement = this.__DOMElement.querySelector(".js-google-map");
		// Store a reference to the directions button
		this.__customDirectionsButton = this.__DOMElement.querySelector(".js-custom-directions-button");
		// Store a reference to the directions form bubble
		this.__customDirectionsBubble = this.__DOMElement.querySelector(".js-directions-bubble");
		// Store a reference to the input field
		this.__customDirectionsInput = this.__customDirectionsBubble.querySelector(".js-directions-input");
		// Store a reference to the search form element
		this.__customDirectionsForm = this.__customDirectionsBubble.querySelector(".js-search-form");
		// Get the action to use for the form
		this.customDirectionsFormURL = this.__customDirectionsForm.getAttribute("data-action");
		// Get the error copy to show when the form isn't filled in correctly
		this.inputErrorText = this.__customDirectionsInput.getAttribute("data-error");
		this.createMapSettings();
		// Build the dynamic page elements
		this.createMap();
		this.createMarker();
		this.createZoomControls();
		if (NATION2016.Settings.IS_IE9) {
			this.prepareIE9();
		}
		this.createListeners();
	}

	//------------------------------------------------
	// Make sure the Google map is centered on the 
	// target location after a resize event
	//------------------------------------------------
	StudioMap.prototype.resize = function() {
		this.googleMap.setCenter(this.nationLatLng);
	}

	//------------------------------------------------
	// Kill the various listeners
	//------------------------------------------------
	StudioMap.prototype.destroy = function() {
		this.hideDirectionsBubble();
		// Hide the directions bubble and remove it's listener on documentElement
		this.removeListeners();
	}

	//------------------------------------------------
	// Get various map settings from the DOM, and store
	// them for later use
	//------------------------------------------------
	StudioMap.prototype.createMapSettings = function() {
		// Get the office location from the DOM
		this.nationLatLng = {
			lat: parseFloat(this.__mapElement.getAttribute("data-lat")),
			lng: parseFloat(this.__mapElement.getAttribute("data-lng"))
		};
		// Get the icon URL from the DOM
		this.markerIcon = {
			url: this.__mapElement.getAttribute("data-marker-url"),
			size: new google.maps.Size(72, 72),
			origin: new google.maps.Point(0, 0),
			anchor: new google.maps.Point(36, 36)
		};
		// Set up the map options object
		this.mapOptions = {
			zoom: 15,
			center: this.nationLatLng,
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			disableDefaultUI: true,
			scrollWheel: false,
			draggable: (!NATION2016.Settings.TOUCH_DEVICE),// Set to false on mobile
			styles: this.mapColorScheme
		};
	}

	//------------------------------------------------
	// Prepare the zoom in/out buttons on the map
	//------------------------------------------------
	StudioMap.prototype.createZoomControls = function() {
		var __zoomElement = document.createElement("div");
		__zoomElement.className = "js-zoom-controls";
		var buttonNames = ["zoom-in", "zoom-out"], i = 0, length = buttonNames.length;
		var __buttonElement = null;
		for (; i < length; i++) {
			__buttonElement = document.createElement("div");
			__buttonElement.className = "js-zoom-button " + buttonNames[i];
			__zoomElement.appendChild(__buttonElement);
			this.__mapZoomButtons.push(__buttonElement);
		}
		__zoomElement.style.zIndex = 1;
		this.googleMap.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(__zoomElement);
	}

	//------------------------------------------------
	// Set the placeholder text for the input
	//------------------------------------------------
	StudioMap.prototype.prepareIE9 = function() {
		this.IE9PlaceholderText = this.__customDirectionsInput.getAttribute("placeholder");
		this.__customDirectionsInput.value = this.IE9PlaceholderText;
	}

	//------------------------------------------------
	// Create the Google map
	//------------------------------------------------
	StudioMap.prototype.createMap = function() {
		// First create the directions renderer
		this.directionsRenderer = new google.maps.DirectionsRenderer({
			suppressMarkers: true, 
			polylineOptions: {
				strokeWeight: 10,
				strokeOpacity: 0.4,
				strokeColor: this.__mapElement.getAttribute("data-line-color")
			}
		});
		// Create service to handle directions requests
		this.directionsService = new google.maps.DirectionsService();
		this.googleMap = new google.maps.Map(this.__mapElement, this.mapOptions);
		this.directionsRenderer.setMap(this.googleMap);
	}

	//------------------------------------------------
	// Create the marker that will be shown on the map
	//------------------------------------------------
	StudioMap.prototype.createMarker = function() {
		this.mapMarker = new google.maps.Marker({
			position: this.nationLatLng,
			map: this.googleMap,
			icon: this.markerIcon,
			optimized: false
		});
	}

	//------------------------------------------------
	// Listen for map interaction from the user
	//------------------------------------------------
	StudioMap.prototype.createListeners = function() {
		var i = 0, length = this.__directionsButtons.length;
		// Listen for clicks on the tube icons to the right of the map itself
		this.handler_directionsButtonClicked = this.onDirectionsButtonClicked.bind(this);
		for (; i < length; i++) {
			this.__directionsButtons[i].addEventListener("click", this.handler_directionsButtonClicked);
		}
		// Listen for clicks on the zoom in/out buttons
		this.handler_zoomInClicked = this.onZoomInButtonClicked.bind(this);
		this.__mapZoomButtons[0].addEventListener("click", this.handler_zoomInClicked);
		this.handler_zoomOutClicked = this.onZoomOutButtonClicked.bind(this);
		this.__mapZoomButtons[1].addEventListener("click", this.handler_zoomOutClicked);
		// Listen for clicks on the directions button, to show the input field for a search term
		this.handler_customDirectionsButtonClicked = this.onCustomDirectionsButtonClicked.bind(this);
		this.__customDirectionsButton.addEventListener("click", this.handler_customDirectionsButtonClicked)
		// Listen for custom direction submissions
		this.handler_customDirectionSubmitted = this.onCustomDirectionSubmitted.bind(this);
		this.__customDirectionsForm.addEventListener("submit", this.handler_customDirectionSubmitted);
		// TODO: If IE9, add/remove input placeholder manually
		this.handler_customDirectionsInputFocusIn = this.onCustomDirectionsInputFocusIn.bind(this);
		this.__customDirectionsInput.addEventListener("focus", this.handler_customDirectionsInputFocusIn);
		if (NATION2016.Settings.IS_IE9) {
			this.handler_customDirectionsInputFocusOut = this.onCustomDirectionsInputFocusOut.bind(this);
			this.__customDirectionsInput.addEventListener("blur", this.handler_customDirectionsInputFocusOut);
		}
		// Listen for the first batch of tiles to load
		this.handler_mapTilesLoaded = this.onFirstMapTilesLoaded.bind(this);
		this.mapListener = google.maps.event.addListener(this.googleMap, "tilesloaded", this.handler_mapTilesLoaded);
	}

	//------------------------------------------------
	// Remove all listeners before the map is removed
	//------------------------------------------------
	StudioMap.prototype.removeListeners = function() {
		var i = 0, length = this.__directionsButtons.length;
		if (length > 0) {
			for (; i < length; i++) {
				this.__directionsButtons[i].removeEventListener("click", this.handler_directionsButtonClicked);
			}
		}
		if (this.__mapZoomButtons.length > 0) {
			this.__mapZoomButtons[0].removeEventListener("click", this.handler_zoomInClicked);
			this.__mapZoomButtons[1].removeEventListener("click", this.handler_zoomOutClicked);
		}
		this.__customDirectionsButton.removeEventListener("click", this.handler_customDirectionsButtonClicked)
		google.maps.event.removeListener(this.mapListener);
	}

	//------------------------------------------------
	// Show the directions from the requested location
	//------------------------------------------------
	StudioMap.prototype.displayDirections = function(latLng) {
		this.directionsService.route({
			origin: latLng,
			destination: this.nationLatLng,
			travelMode: google.maps.TravelMode.WALKING
		}, this.onDirectionsReceived.bind(this));
	}

	//------------------------------------------------
	// Fade in the input field via the 'active' class name
	//------------------------------------------------
	StudioMap.prototype.showDirectionsBubble = function() {
		this.__customDirectionsInput.value = "";
		this.__customDirectionsBubble.className += " active";
		this.__customDirectionsInput.focus();
		this.handler_documentClicked = this.onDocumentClicked.bind(this);
		// Listen for external clicks
		document.documentElement.addEventListener("click", this.handler_documentClicked);
	}

	//------------------------------------------------
	// Hide the input field by removing the 'active' class
	//------------------------------------------------
	StudioMap.prototype.hideDirectionsBubble = function() {
		this.__customDirectionsBubble.className = this.__customDirectionsBubble.className.replace(/ active|active/gi, "");
		this.removeBubbleErrorState();
		// Stop listening for directions clicks
		if (this.handler_documentClicked) {
			document.documentElement.removeEventListener("click", this.handler_documentClicked);
		}
	}

	//------------------------------------------------
	// Show the new directions on the map
	//------------------------------------------------
	StudioMap.prototype.onDirectionsReceived = function(response, status) {
		if (status === google.maps.DirectionsStatus.OK) {
			this.directionsRenderer.setDirections(response);
		} else {
			// TODO: Show error message
			if (window.console) console.warn("ERROR - " + status + ", response:");
			if (window.console) console.log(response);
		}
	}

	//------------------------------------------------
	// When a tube icon is clicked, get it's latlng from
	// the DOM, and then show directions from that location
	//------------------------------------------------
	StudioMap.prototype.onDirectionsButtonClicked = function(e) {
		var target = (e.target.nodeName.toLowerCase() === "span") ? e.target.parentNode : e.target;
		var latLng = {
			lat: parseFloat(target.getAttribute("data-lat")),
			lng: parseFloat(target.getAttribute("data-lng"))
		};
		this.displayDirections(latLng);
		// Scroll to map
		this.trigger(NATION2016.Events.DIRECTIONS_CLICKED);
		e.stopPropagation();
		e.preventDefault();
	}

	//------------------------------------------------
	// Zoom the map in
	//------------------------------------------------
	StudioMap.prototype.onZoomInButtonClicked = function(e) {
		this.googleMap.setZoom(this.googleMap.getZoom() + 1);
		e.stopPropagation();
		e.preventDefault();
	}

	//------------------------------------------------
	// Zoom the map out
	//------------------------------------------------
	StudioMap.prototype.onZoomOutButtonClicked = function(e) {
		this.googleMap.setZoom(this.googleMap.getZoom() - 1);
		e.stopPropagation();
		e.preventDefault();
	}

	//------------------------------------------------
	// Show or hide the directions input field, depending
	// on the current state of the bubble
	//------------------------------------------------
	StudioMap.prototype.onCustomDirectionsButtonClicked = function(e) {
		if (this.__customDirectionsBubble.className.search("active") < 0) {
			this.showDirectionsBubble();
		} else {
			this.hideDirectionsBubble();
		}
		e.stopPropagation();
		e.preventDefault();
	}

	//------------------------------------------------
	// Hide the directions input field if it's visible
	//------------------------------------------------
	StudioMap.prototype.onDocumentClicked = function(e) {
		var bubblePos = NATION.Utils.getOffset(this.__customDirectionsBubble);
		bubblePos.width = this.__customDirectionsBubble.offsetWidth;
		bubblePos.height = this.__customDirectionsBubble.offsetHeight;
		if (e.pageX < bubblePos.left || e.pageX > bubblePos.left + bubblePos.width || e.pageY < bubblePos.top || e.pageY > bubblePos.top + bubblePos.height) {
			this.hideDirectionsBubble();
		}
	}

	//------------------------------------------------
	// Clear the error state from the bubble after the
	// user begins to correct their error
	//------------------------------------------------
	StudioMap.prototype.removeBubbleErrorState = function() {
		if (this.__customDirectionsBubble.className.search("error") >= 0) {
			this.__customDirectionsBubble.className = this.__customDirectionsBubble.className.replace(/ error|error/gi, "");
		}
	}

	//------------------------------------------------
	// Check the input field was filled in correctly,
	// and then open a new tab with the search results
	//------------------------------------------------
	StudioMap.prototype.onCustomDirectionSubmitted = function(e) {
		var currentValue = this.__customDirectionsInput.value;
		if (currentValue.replace(/ /g, "") === "" || currentValue === this.IE9PlaceholderText || currentValue === this.inputErrorText) {
			if (this.__customDirectionsBubble.className.search("error") < 0) {
				this.__customDirectionsBubble.className += " error";
				this.__customDirectionsInput.value = this.inputErrorText;
			}
		} else {
			this.removeBubbleErrorState();
			var startPoint = encodeURIComponent(currentValue);
			var url = this.customDirectionsFormURL.replace("[[startPoint]]", startPoint);
			var newWindow = window.open(url, "_blank");
			newWindow.focus();
		}
		e.stopPropagation();
		e.preventDefault();
	}

	//------------------------------------------------
	// Clear fake placeholder text when in IE9
	//------------------------------------------------
	StudioMap.prototype.onCustomDirectionsInputFocusIn = function(e) {
		this.removeBubbleErrorState();
		var currentValue = this.__customDirectionsInput.value;
		if (currentValue === this.IE9PlaceholderText || currentValue === this.inputErrorText) {
			this.__customDirectionsInput.value = "";
		}
	}

	//------------------------------------------------
	// Set fake placeholder text when in IE9
	//------------------------------------------------
	StudioMap.prototype.onCustomDirectionsInputFocusOut = function(e) {
		var currentValue = this.__customDirectionsInput.value;
		if (currentValue.replace(/ /g, "") === "") {
			this.__customDirectionsInput.value = this.IE9PlaceholderText;
		}
	}

	//------------------------------------------------
	// Fire ready event when first set of tiles have loaded
	//------------------------------------------------
	StudioMap.prototype.onFirstMapTilesLoaded = function(e) {
		google.maps.event.removeListener(this.mapListener);
		this.trigger(NATION2016.Events.MAP_READY);
	}

	window.NATION2016.views.contact.StudioMap = StudioMap;

}(window, document, undefined));