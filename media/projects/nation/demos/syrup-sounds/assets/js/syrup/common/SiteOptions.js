////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
// Options to control app output
////////////////////////////////////////////////////////////////////////////////

class SiteOptions extends EventDispatcher {

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	constructor(DOMElement) {
		super();
		// Variables
		this.DOMElement = DOMElement;
		this.SNAP_SEGMENTS = 9;
		this.showCollisions = null;
		this.hideCollisions = null;
		this.randomiseShapes = null;
		this.randomiseBackground = null;
		this.randomiseAll = null;
		this.originalShapeSpeed = Settings.MAX_SHAPE_SPEED;
		this.originalRotationSpeed = Settings.MAX_ROTATION;
		this.requestedScale = 1;
		this.speedProgressBar = null;
		this.scaleProgressBar = null;
		this.speedDisplay = null;
		this.scaleDisplay = null;
		this.reset = null;
		this.getReferences();
		this.createProgressBars();
		this.createListeners();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	createProgressBars() {
		var options = {
			snapSegments: this.SNAP_SEGMENTS,
			handlePositioning: "inside"
		};
		this.speedProgressBar = new NATION.ProgressBar(this.DOMElement.querySelector(".speed-progress-bar"), options);
		this.scaleProgressBar = new NATION.ProgressBar(this.DOMElement.querySelector(".scale-progress-bar"), options);
		this.scaleProgressBar.setProgress(1);
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	getReferences() {
		this.showCollisions = this.DOMElement.querySelector(".show-collisions");
		this.hideCollisions = this.DOMElement.querySelector(".hide-collisions");
		this.randomiseShapes = this.DOMElement.querySelector(".randomise-shapes");
		this.randomiseBackground = this.DOMElement.querySelector(".randomise-background");
		this.randomiseAll = this.DOMElement.querySelector(".randomise-all");
		this.shapesArcs = this.DOMElement.querySelector(".shapes-arcs");
		this.shapesCorners = this.DOMElement.querySelector(".shapes-corners");
		this.shapesTriangles = this.DOMElement.querySelector(".shapes-triangles");
		this.shapesLines = this.DOMElement.querySelector(".shapes-lines");
		this.shapesCircles = this.DOMElement.querySelector(".shapes-circles");
		this.shapesAll = this.DOMElement.querySelector(".shapes-all");
		this.speedDisplay = this.DOMElement.querySelector(".speed .js-number-display");
		this.scaleDisplay = this.DOMElement.querySelector(".scale .js-number-display");
		this.reset = this.DOMElement.querySelector(".reset");
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	createListeners() {
		this.showCollisions.addEventListener("click", (e) => this.onShowCollisionsClicked(e));
		this.hideCollisions.addEventListener("click", (e) => this.onHideCollisionsClicked(e));
		this.randomiseShapes.addEventListener("click", (e) => this.onRandomiseShapesClicked(e));
		this.randomiseBackground.addEventListener("click", (e) => this.onRandomiseBackgroundClicked(e));
		this.randomiseAll.addEventListener("click", (e) => this.onRandomiseAllClicked(e));
		// Shape selection
		this.shapesArcs.addEventListener("click", (e) => this.onArcsClicked(e));
		this.shapesCorners.addEventListener("click", (e) => this.onCornersClicked(e));
		this.shapesTriangles.addEventListener("click", (e) => this.onTrianglesClicked(e));
		this.shapesLines.addEventListener("click", (e) => this.onLinesClicked(e));
		this.shapesCircles.addEventListener("click", (e) => this.onCirclesClicked(e));
		this.shapesAll.addEventListener("click", (e) => this.onAllShapesClicked(e));
		this.reset.addEventListener("click", (e) => this.onResetClicked(e));
		this.speedProgressBar.addListener(this.speedProgressBar.VALUE_CHANGED, (e) => this.onSpeedChanged(e));
		this.scaleProgressBar.addListener(this.scaleProgressBar.VALUE_CHANGED, (e) => this.onScaleChanged(e));
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	showActive(element) {
		if (element.className.search("active") < 0) {
			element.className += " active";
		}
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	showInactive(element) {
		element.className = element.className.replace(/ active|active/gi, "");
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	onRandomiseShapesClicked(e) {
		this.trigger(Events.RANDOMISE_SHAPES);
		e.stopPropagation();
		e.preventDefault();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	onRandomiseBackgroundClicked(e) {
		this.trigger(Events.RANDOMISE_BACKGROUND_LINES);
		e.stopPropagation();
		e.preventDefault();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	onRandomiseAllClicked(e) {
		this.trigger(Events.RANDOMISE_ALL);
		e.stopPropagation();
		e.preventDefault();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	onShowCollisionsClicked(e) {
		this.showActive(this.showCollisions);
		this.showInactive(this.hideCollisions);
		this.trigger(Events.ENABLE_DEBUG_MODE);
		e.stopPropagation();
		e.preventDefault();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	onHideCollisionsClicked(e) {
		this.showActive(this.hideCollisions);
		this.showInactive(this.showCollisions);
		this.trigger(Events.DISABLE_DEBUG_MODE);
		e.stopPropagation();
		e.preventDefault();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	onArcsClicked(e) {
		this.showActive(this.shapesArcs);
		this.showInactive(this.shapesCorners);
		this.showInactive(this.shapesTriangles);
		this.showInactive(this.shapesLines);
		this.showInactive(this.shapesCircles);
		this.showInactive(this.shapesAll);
		this.trigger(Events.SHOW_ONLY_ARCS);
		e.stopPropagation();
		e.preventDefault();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	onCornersClicked(e) {
		this.showInactive(this.shapesArcs);
		this.showActive(this.shapesCorners);
		this.showInactive(this.shapesTriangles);
		this.showInactive(this.shapesLines);
		this.showInactive(this.shapesCircles);
		this.showInactive(this.shapesAll);
		this.trigger(Events.SHOW_ONLY_CORNERS);
		e.stopPropagation();
		e.preventDefault();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	onTrianglesClicked(e) {
		this.showInactive(this.shapesArcs);
		this.showInactive(this.shapesCorners);
		this.showActive(this.shapesTriangles);
		this.showInactive(this.shapesLines);
		this.showInactive(this.shapesCircles);
		this.showInactive(this.shapesAll);
		this.trigger(Events.SHOW_ONLY_TRIANGLES);
		e.stopPropagation();
		e.preventDefault();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	onLinesClicked(e) {
		this.showInactive(this.shapesArcs);
		this.showInactive(this.shapesCorners);
		this.showInactive(this.shapesTriangles);
		this.showActive(this.shapesLines);
		this.showInactive(this.shapesCircles);
		this.showInactive(this.shapesAll);
		this.trigger(Events.SHOW_ONLY_LINES);
		e.stopPropagation();
		e.preventDefault();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	onCirclesClicked(e) {
		this.showInactive(this.shapesArcs);
		this.showInactive(this.shapesCorners);
		this.showInactive(this.shapesTriangles);
		this.showInactive(this.shapesLines);
		this.showActive(this.shapesCircles);
		this.showInactive(this.shapesAll);
		this.trigger(Events.SHOW_ONLY_CIRCLES);
		e.stopPropagation();
		e.preventDefault();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	onAllShapesClicked(e) {
		this.showInactive(this.shapesArcs);
		this.showInactive(this.shapesCorners);
		this.showInactive(this.shapesTriangles);
		this.showInactive(this.shapesLines);
		this.showInactive(this.shapesCircles);
		this.showActive(this.shapesAll);
		this.trigger(Events.SHOW_ALL_SHAPES);
		e.stopPropagation();
		e.preventDefault();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	onSpeedChanged(e) {
		Settings.MAX_SHAPE_SPEED = this.originalShapeSpeed + (this.originalShapeSpeed * (15 * this.speedProgressBar.getPercentage()));
		Settings.MAX_ROTATION = this.originalRotationSpeed + (this.originalRotationSpeed * (15 * this.speedProgressBar.getPercentage()));
		this.speedDisplay.innerHTML = Settings.MAX_SHAPE_SPEED.toFixed(2);
		this.trigger(Events.UPDATE_SHAPE_SPEEDS);
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	onScaleChanged(e) {
		this.requestedScale = 0.1 + (0.9 * this.scaleProgressBar.getPercentage());
		this.scaleDisplay.innerHTML = this.requestedScale.toFixed(2);
		this.trigger(Events.SCALE_CHANGE_REQUESTED);
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	onResetClicked(e) {
		// Reset progress bars
		if (this.scaleProgressBar.getPercentage() !== 1) {
			this.scaleProgressBar.setProgress(1);
			this.onScaleChanged(e);
		}
		if (this.speedProgressBar.getPercentage() !== 0) {
			this.speedProgressBar.setProgress(0);
			this.onSpeedChanged(e);
		}

		// Reset other settings
		this.onHideCollisionsClicked(e);
		if (this.shapesAll.className.search("active") < 0) {
			this.onAllShapesClicked(e);
		}
		e.stopPropagation();
		e.preventDefault();
	}
}