////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
// 
////////////////////////////////////////////////////////////////////////////////

class BasicShape extends EventDispatcher {

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	constructor(DOMElement, color, strokeWidth, scale) {
		super();
		// Variables
		this.DOMElement = DOMElement;
		
		this.frameTimer = null;
		this.endTime = 0;
		this.currentTime = 0;
		this.startTime = 0;
		this.previousSegments = [];

		this.shape = null;
		this._mass = 1;
		this.selectSpeed();
		this._angle = Math.random() * 180;
		this._colliders = [];
		this.segments = [];
		this.boundingBox = {};
		this.segmentPath = "";
		this.minX = 0;
		this.minY = 0;
		this.maxX = 0;
		this.maxY = 0;
		this.originX = 0;
		this.originY = 0;
		this.effectsShape = null;
		this.boundingBoxGuide = null;
		this.segmentGuide = null;
		this.centerGuide = null;
	}

	//------------------------------------------------
	// Decide how fast this shape should move
	//------------------------------------------------
	selectSpeed() {
		this._xSpeed = (Math.random() * (Settings.MAX_SHAPE_SPEED*2) - Settings.MAX_SHAPE_SPEED);
		this._ySpeed = (Math.random() * (Settings.MAX_SHAPE_SPEED*2) - Settings.MAX_SHAPE_SPEED);

		if (this._xSpeed === 0) this._xSpeed = (Math.random() > 0.5) ? -Settings.MAX_SHAPE_SPEED : Settings.MAX_SHAPE_SPEED;
		if (this._ySpeed === 0) this._ySpeed = (Math.random() > 0.5) ? -Settings.MAX_SHAPE_SPEED : Settings.MAX_SHAPE_SPEED;
		this._rotationSpeed = (Math.random() * (Settings.MAX_ROTATION*2)) - Settings.MAX_ROTATION;
	}

	//------------------------------------------------
	// Start rendering the collision model for this shape
	//------------------------------------------------
	showCollisionModel() {
		this.shape.setAttribute("stroke-opacity", 0);

		this.DOMElement.appendChild(this.boundingBoxGuide);
		this.DOMElement.appendChild(this.centerGuide);
		this.DOMElement.appendChild(this.segmentGuide);
	}

	//------------------------------------------------
	// Hide the collision model for this shape
	//------------------------------------------------
	hideCollisionModel() {
		this.shape.setAttribute("stroke-opacity", 1);

		if (this.contains(this.boundingBoxGuide)) {
			this.DOMElement.removeChild(this.boundingBoxGuide);
			this.DOMElement.removeChild(this.centerGuide);
			this.DOMElement.removeChild(this.segmentGuide);
		}
	}

	//------------------------------------------------
	// Getters
	//------------------------------------------------
	get color() {
		return this._color;
	}

	get xSpeed() {
		return this._xSpeed;
	}

	get ySpeed() {
		return this._ySpeed;
	}

	get mass() {
		return this._mass;
	}

	get rotationSpeed() {
		return this._rotationSpeed;
	}

	get angle() {
		return this._angle;
	}

	get colliders() {
		return this._colliders;
	}

	get origin() {
		return {
			x: this.originX,
			y: this.originY
		}
	}

	get width() {
		return this.halfWidth*2;
	}

	get center() {
		return {
			x: this.boundingBox.x + (this.boundingBox.width/2),
			y: this.boundingBox.y + (this.boundingBox.height/2)
		}
	}

	//------------------------------------------------
	// Setters
	//------------------------------------------------
	set xSpeed(value) {
		this._xSpeed = value;
	}

	set ySpeed(value) {
		this._ySpeed = value;
	}

	set mass(value) {
		this.mass = value;
	}

	set rotationSpeed(value) {
		this._rotationSpeed = value;
	}

	set angle(value) {
		this._angle = value;
	}

	//------------------------------------------------
	// Draw the guides if required
	//------------------------------------------------
	draw() {
		this.boundingBoxGuide = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		this.boundingBoxGuide.setAttribute("stroke-width", 2);
		this.boundingBoxGuide.setAttribute("fill", "transparent");
		this.boundingBoxGuide.setAttribute("stroke", "#ff0066");
		

		this.centerGuide = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		this.centerGuide.setAttribute("r", 10);
		this.centerGuide.setAttribute("fill", "#ff0066");
		

		this.segmentGuide = document.createElementNS("http://www.w3.org/2000/svg", "path");
		this.segmentGuide.setAttribute("fill", "transparent");
		this.segmentGuide.setAttribute("stroke", "#000000");
		this.segmentGuide.setAttribute("stroke-width", 2);
		
	}

	//------------------------------------------------
	// Return the x/y co-ordinates of this shape
	//------------------------------------------------
	getPosition() {
		return {
			x: this.x,
			y: this.y
		}
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	hide() {
		this.shape.style.strokeOpacity = 0;
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	fadeIn() {
		NATION.Animation.start(this.shape, {strokeOpacity: 1}, {forcejs: true, duration: Settings.SHAPE_FADE_DURATION});
	}

	//------------------------------------------------
	// IE-friendly version of Node.contains
	//------------------------------------------------
	contains(target) {
		if (!this.DOMElement.contains) {
			return this.DOMElement === target || Boolean(this.DOMElement.compareDocumentPosition(target) & 16);

		} else {
			return this.DOMElement.contains(target);
		}
	}

	//------------------------------------------------
	// Increment the current rotation
	//------------------------------------------------
	updateRotation() {
		this._angle += this._rotationSpeed;
		if (this._angle > 360) this._angle = 0;
		if (this._angle < 0) this._angle = 360;
	}

	//------------------------------------------------
	// Currently colliding with passed shape
	//------------------------------------------------
	addCollider(shape) {
		if (this._colliders.indexOf(shape) < 0) {
			this._colliders.push(shape);
		}
	}

	//------------------------------------------------
	// No longer colliding with passed shape
	//------------------------------------------------
	removeCollider(shape) {
		for (let i = 0, length = this._colliders.length; i < length; i++) {
			if (this._colliders[i] === shape) {
				this._colliders.splice(i, 1);
			}
		}
	}

	//------------------------------------------------
	// Set new x/y co-ordinate
	//------------------------------------------------
	setPosition(x, y) {
		this.x = x;
		this.y = y;
	}

	//------------------------------------------------
	// Returns x/y/width/height in an object
	//------------------------------------------------
	getBoundingBox() {
		return this.boundingBox;
	}

	//------------------------------------------------
	// Returns an array of line segments
	// Each is an object of x1,y1,x2,y2
	//------------------------------------------------
	getLineSegments() {
		return this.segments;
	}

	//------------------------------------------------
	// Return an array of the line segments for the shape
	// as it was in the previous frame
	//------------------------------------------------
	getPreviousLineSegments() {
		return this.previousSegments;
	}
	

	//------------------------------------------------
	// Check the stage bounds for collisions
	//------------------------------------------------
	update() {
		this.x += this._xSpeed;
		this.y += this._ySpeed;
		this.updateRotation();
		this.setPosition(this.x, this.y);
	}

	//------------------------------------------------
	// Remove this shape from the DOM
	//------------------------------------------------
	destroy(immediate=false) {
		this.hideCollisionModel();
		if (this.contains(this.shape)) {
			if (!immediate) {
				NATION.Animation.start(this.shape, {opacity: 1}, {duration: 100, easing: "easeInOutQuad"}, (e) => this.onShapeHidden(e));
			} else {
				this.onShapeHidden();
			}
			
		}
		if (this.contains(this.effectsShape)) {
			this.DOMElement.removeChild(this.effectsShape);
		}
	}

	//------------------------------------------------
	// Remove this shape from the DOM
	//------------------------------------------------
	onShapeHidden() {
		NATION.Animation.stop(this.shape);
		this.DOMElement.removeChild(this.shape);
	}

	//------------------------------------------------
	// Add the shape to the DOM
	//------------------------------------------------
	addToStage() {
		this.DOMElement.appendChild(this.shape);
		this.shape.style.strokeWidth = this.strokeWidth/2;
		this.shape.style.opacity = 0;
		NATION.Animation.start(this.shape, {opacity: 1, strokeWidth: this.strokeWidth}, {duration: 1000, easing: "easeInOutQuad"});
		//this.DOMElement.appendChild(this.boundingBoxGuide);
		//this.DOMElement.appendChild(this.centerGuide);
		//this.DOMElement.appendChild(this.segmentGuide);
	}

	//------------------------------------------------
	// Show a visual effect after a collision, and request
	// for a sound to be played by the audio manager
	//------------------------------------------------
	collide(stagePercentage, bgImpact) {
		// Play the visual impact effect if we're not rendering the bounding box
		if (this.effectsShape && !this.contains(this.boundingBoxGuide)) {
			if (this.frameTimer) {
				cancelAnimationFrame(this.frameTimer);
			}
			this.endTime = Date.now() + 300;
			this.currentTime = this.startTime = Date.now();
			this.DOMElement.insertBefore(this.effectsShape, this.shape);
			this.frameTimer = requestAnimationFrame(() => this.animateCollision());
		}
		// Play this shape's sound effect via the central audio manager
		this.playCollisionSound(stagePercentage, bgImpact);
	}

	//------------------------------------------------
	// Get the audio manager to play this shape's collision sound
	//------------------------------------------------
	playCollisionSound(percentage, bgImpact) {
		//AudioManager.playSound(this.audioID, percentage, bgImpact);
	}

	//------------------------------------------------
	// Progress the collision animation until complete
	//------------------------------------------------
	animateCollision() {
		this.currentTime = Date.now();
		let progress = (this.currentTime - this.startTime) / (this.endTime - this.startTime);
		if (progress > 1) progress = 1;

		let newWidth = this.strokeWidth + ((this.strokeWidth*0.6) * progress);

		this.effectsShape.setAttribute("stroke-width", newWidth);
		this.effectsShape.setAttribute("stroke-opacity", 0.9 * (1-progress));

		if (progress < 1) { 
			this.frameTimer = requestAnimationFrame(() => this.animateCollision());
		} else {
			if (this.contains(this.effectsShape)) {
				this.DOMElement.removeChild(this.effectsShape);
			}
			cancelAnimationFrame(this.frameTimer);
		}
	}
}