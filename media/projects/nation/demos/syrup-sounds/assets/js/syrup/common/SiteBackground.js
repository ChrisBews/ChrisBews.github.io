////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
// Main Site Background
////////////////////////////////////////////////////////////////////////////////

class SiteBackground extends EventDispatcher {

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	constructor(DOMElement) {
		super();
		// Variables
		this.DOMElement = DOMElement;
		this.shapesElement = this.DOMElement.querySelector(".js-background-shapes");
		this.backgroundElement = this.DOMElement.querySelector(".js-background-lines");
		this.currentScale = 1;
		this.naturalScale = 1;
		this.previousSection = 0;
		this.currentSection = 0;
		this.siteSections = 1;
		this.originalStrokeWidth = 53;
		this.previousScale = 1;
		this.previousX = 0;
		this.animating = false;
		this.shapeSystems = [];
		this.calculateScale();
		this.frameRequest = null;
		this.backgroundLines = null;
		this.strokeWidth = this.currentScale * this.originalStrokeWidth;
		let halfWidth = window.innerWidth/2;
		NATION.Utils.setStyle(this.DOMElement, {transformOrigin: halfWidth + "px 50%"});
		NATION.Utils.setStyle(this.DOMElement, {transform: "translateX(0) scale(1)"});
		this.createBackgroundLines();
		this.createShapeSystems();
		this.createListeners();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	overrideScale(newScale) {
		newScale = this.naturalScale * newScale;
		this.currentScale = newScale;
		this.strokeWidth = this.currentScale * this.originalStrokeWidth;
		this.resizeShapes();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	randomiseBackgroundLines() {
		this.backgroundLines.randomise();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	updateShapeSpeeds() {
		for (let i = 0, length = this.shapeSystems.length; i < length; i++) {
			this.shapeSystems[i].updateSpeeds();
		}
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	randomiseShapes() {
		for (let i = 0, length = this.shapeSystems.length; i < length; i++) {
			this.shapeSystems[i].randomise();
		}
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	showOnlyArcs() {
		for (let i = 0, length = this.shapeSystems.length; i < length; i++) {
			this.shapeSystems[i].showArcs();
		}
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	showOnlyCorners() {
		for (let i = 0, length = this.shapeSystems.length; i < length; i++) {
			this.shapeSystems[i].showCorners();
		}
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	showOnlyTriangles() {
		for (let i = 0, length = this.shapeSystems.length; i < length; i++) {
			this.shapeSystems[i].showTriangles();
		}
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	showOnlyLines() {
		for (let i = 0, length = this.shapeSystems.length; i < length; i++) {
			this.shapeSystems[i].showLines();
		}
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	showOnlyCircles() {
		for (let i = 0, length = this.shapeSystems.length; i < length; i++) {
			this.shapeSystems[i].showCircles();
		}
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	showAllShapes() {
		for (let i = 0, length = this.shapeSystems.length; i < length; i++) {
			this.shapeSystems[i].showAllShapes();
		}
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	randomiseAll() {
		this.randomiseShapes();
		this.randomiseBackgroundLines();
	}

	//------------------------------------------------
	// Listen for requests to add a new shape
	//------------------------------------------------
	createListeners() {
		window.addEventListener("resize", (e) => this.onWindowResized(e));
		Mediator.subscribe(Events.SHAPE_REQUESTED, (e) => this.onShapeRequested(e));
	}

	//------------------------------------------------
	// Fade in the wole background at once
	//------------------------------------------------
	fadeIn(immediate) {
		if (!immediate) {
			this.DOMElement.style.opacity = 0;
			NATION.Animation.start(this.DOMElement, {opacity: 1}, {duration: Settings.BG_FADE_DURTION});
		} else {
			this.DOMElement.style.opacity = 1;
		}
	}

	//------------------------------------------------
	// Resize the background lines and shapes to suit
	// the new browser dimensions
	//------------------------------------------------
	resize() {
		if (this.frameRequest) {
			if (cancelAnimationFrame) cancelAnimationFrame(this.frameRequest);
		}
		this.calculateScale();
		this.strokeWidth = this.originalStrokeWidth * this.currentScale;
		this.backgroundLines.resize(this.strokeWidth, this.currentScale);

		this.resizeShapes();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	resizeShapes() {
		let windowWidth = window.innerWidth;
		let windowHeight = window.innerHeight;

		for (let i = 0, length = this.shapeSystems.length; i < length; i++) {
			let stage = {
				x: i * windowWidth,
				y: 0,
				width: windowWidth,
				height: windowHeight
			};
			this.shapeSystems[i].resize(stage, this.strokeWidth, this.currentScale);
		}
	}

	//------------------------------------------------
	// Work out the general scale for width and height
	// of browser - this is applied to shapes when
	// resizing them
	//------------------------------------------------
	calculateScale() {
		let widthScale = 0;
		if (window.innerWidth >= 1400) {
			widthScale = 1;
		} else {
			widthScale = window.innerWidth / 1400;
		}
		let heightScale = 0;
		if (window.innerHeight >= 800) {
			heightScale = 1;
		} else {
			heightScale = window.innerHeight / 800;
		}
		this.currentScale = (widthScale < heightScale) ? widthScale : heightScale;
		this.naturalScale = this.currentScale;
	}

	//------------------------------------------------
	// Class that handles the creation and resizing of
	// the background lines
	//------------------------------------------------
	createBackgroundLines() {
		this.backgroundLines = new BackgroundLines(this.backgroundElement, this.siteSections, this.strokeWidth);
	}

	//------------------------------------------------
	// Create each of the shape systems, one per section
	//------------------------------------------------
	createShapeSystems() {
		let windowWidth = window.innerWidth;
		let windowHeight = window.innerHeight;
		for (let i = 0; i < this.siteSections; i++) {
			let stage = {
				x: i * windowWidth,
				y: 0,
				width: windowWidth,
				height: windowHeight
			};
			this.shapeSystems.push(new ShapeSystem(this.shapesElement, this.backgroundLines, stage, this.strokeWidth, this.currentScale));
		}
		this.shapeSystems[0].resume();
	}

	//------------------------------------------------
	// Scroll the background to an x position based on
	// the index of the section required
	//------------------------------------------------
	scrollToSection(index, duration, immediate) {
		if (this.animating) {
			// If we were already scrolling, that means deep linking is interupting the scroll
			// So here we make sure that he previous shape system has been paused, as it wont get to
			// it's 'complete' event.
			this.shapeSystems[this.previousSection].pause();
			this.shapeSystems[this.currentSection].pause();
		}
		this.previousSection = this.currentSection;
		this.currentSection = index;
		let targetX = -(window.innerWidth/this.DOMElement.clientWidth) * 100* index;
		this.shapeSystems[index].resume();

		if (!immediate) {
			this.aniamting = true;
			NATION.Animation.start(this.DOMElement, {transform: "translateX(" + targetX + "%) scale(1)"}, {duration: duration, easing: "easeInOutQuad"}, (e) => this.onSectionScrollComplete(e));
		} else {
			NATION.Utils.setStyle(this.DOMElement, {transform: "translateX(" + targetX + "%) scale(1)"});
			this.onSectionScrollComplete();
		}
		this.previousScale = 1;
		this.previousX = targetX;
	}

	//------------------------------------------------
	// Scale up while keeping a particular section centered
	//------------------------------------------------
	scaleSection(sectionID, newScale, duration = 0) {
		let targetX = -(window.innerWidth/this.DOMElement.clientWidth) * 100  * sectionID;
		let originX = (sectionID * window.innerWidth) + (window.innerWidth/2);
		NATION.Utils.setStyle(this.DOMElement, {transformOrigin: originX + "px 50%"});
		if (duration) {
			NATION.Animation.start(this.DOMElement, {transform: "translateX(" + targetX + "%) scale(" + newScale + ")"}, {duration: duration, easing: "easeInOutQuad"}, (e) => this.onScaleComplete(e, sectionID));
		} else {
			NATION.Utils.setStyle(this.DOMElement, {transform: "translateX(" + targetX + "%) scale(" + newScale + ")"});
			this.onScaleComplete(null, sectionID);
		}
		this.previousScale = newScale;
		this.previousX = targetX;
	}

	//------------------------------------------------
	// Pause the previous shape section, since it's
	// off-screen now
	//------------------------------------------------
	onSectionScrollComplete(e) {
		this.animating = false;
		this.shapeSystems[this.previousSection].pause();

	}

	//------------------------------------------------
	// Inform the app that scaling has finished
	//------------------------------------------------
	onScaleComplete(e, index) {
		if (index === 0) {
			this.trigger(Events.INTRO_SCALE_COMPLETE);
		} else {
			this.trigger(Events.SCALE_COMPLETE);
		}
	}

	//------------------------------------------------
	// Delay resizes to prevent killing the browser
	//------------------------------------------------
	onWindowResized(e) {
		this.frameRequest = requestAnimationFrame(() => this.resize());
	}

	//------------------------------------------------
	// Only create new shapes if not on a touch device
	// as otherwise this causes a user to have to double
	// click stuff to get anywhere
	//------------------------------------------------
	onShapeRequested(e) {
		if (!Settings.isTouchDevice) {
			this.shapeSystems[this.currentSection].createNewShape(true);
		}
	}
}