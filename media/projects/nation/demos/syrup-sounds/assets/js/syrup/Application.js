////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
////////////////////////////////////////////////////////////////////////////////

class Application {

	//------------------------------------------------
	// Constructor 
	//------------------------------------------------
	constructor() {
		// Variables
		this.DOMElement = document.documentElement;
		this.siteBackground = null;
		// Initialisation
		this.prepareDOM();
		this.createSiteOptions();
		this.createBackground();
		this.createListeners();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	createSiteOptions() {
		this.siteOptions = new SiteOptions(this.DOMElement.querySelector(".options"));
	}

	//------------------------------------------------
	// Add a class to the main DOM element if the user
	// is using Firefox
	//------------------------------------------------
	prepareDOM() {
		if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
			this.DOMElement.className += " firefox";
		}
	}

	//------------------------------------------------
	// Create the background that contains the main horizontal
	// lines, and all of the shape systems (1 per section)
	//------------------------------------------------
	createBackground() {
		this.siteBackground = new SiteBackground(this.DOMElement.querySelector(".site-background"));
	}

	//------------------------------------------------
	// Listen for state changes in the application
	//------------------------------------------------
	createListeners() {
		// Debug modes
		this.siteOptions.addListener(Events.ENABLE_DEBUG_MODE, (e) => this.enableDebugMode(e));
		this.siteOptions.addListener(Events.DISABLE_DEBUG_MODE, (e) => this.disableDebugMode(e));
		this.siteOptions.addListener(Events.RANDOMISE_BACKGROUND_LINES, (e) => this.randomiseBackgroundLines(e));
		this.siteOptions.addListener(Events.RANDOMISE_SHAPES, (e) => this.randomiseShapes(e));
		this.siteOptions.addListener(Events.RANDOMISE_ALL, (e) => this.randomiseAllShapes(e));
		this.siteOptions.addListener(Events.SHOW_ONLY_CORNERS, (e) => this.showOnlyCorners(e));
		this.siteOptions.addListener(Events.SHOW_ONLY_ARCS, (e) => this.showOnlyArcs(e));
		this.siteOptions.addListener(Events.SHOW_ONLY_TRIANGLES, (e) => this.showOnlyTriangles(e));
		this.siteOptions.addListener(Events.SHOW_ONLY_LINES, (e) => this.showOnlyLines(e));
		this.siteOptions.addListener(Events.SHOW_ONLY_CIRCLES, (e) => this.showOnlyCircles(e));
		this.siteOptions.addListener(Events.SHOW_ALL_SHAPES, (e) => this.showAllShapes(e));
		this.siteOptions.addListener(Events.UPDATE_SHAPE_SPEEDS, (e) => this.updateShapeSpeeds(e));
		this.siteOptions.addListener(Events.SCALE_CHANGE_REQUESTED, (e) => this.changeScale(e));
	}

	changeScale(e) {
		this.siteBackground.overrideScale(this.siteOptions.requestedScale);
	}

	updateShapeSpeeds(e) {
		this.siteBackground.updateShapeSpeeds();
	}

	showOnlyCorners(e) {
		this.siteBackground.showOnlyCorners();
	}

	showOnlyArcs(e) {
		this.siteBackground.showOnlyArcs();
	}

	showOnlyTriangles(e) {
		this.siteBackground.showOnlyTriangles();
	}

	showOnlyLines(e) {
		this.siteBackground.showOnlyLines();
	}

	showOnlyCircles(e) {
		this.siteBackground.showOnlyCircles();
	}

	showAllShapes(e) {
		this.siteBackground.showAllShapes();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	enableDebugMode(e) {
		if (!this.debugEnabled) {
			this.debugEnabled = true;
			Mediator.publish(Events.ENABLE_DEBUG_MODE);
		} 
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	disableDebugMode(e) {
		if (this.debugEnabled) {
			this.debugEnabled = false;
			Mediator.publish(Events.DISABLE_DEBUG_MODE);
		}
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	randomiseBackgroundLines(e) {
		this.siteBackground.randomiseBackgroundLines();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	randomiseShapes(e) {
		this.siteBackground.randomiseShapes();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	randomiseAllShapes(e) {
		this.siteBackground.randomiseAll();
	}
}


window.onload = function() {
	// Yeah it's a global, come at me
	window.Settings = new SiteSettings();
	window.Mediator = new SiteMediator();
	let app = new Application();
}