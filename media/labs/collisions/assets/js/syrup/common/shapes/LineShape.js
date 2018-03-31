////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
// 
////////////////////////////////////////////////////////////////////////////////

class LineShape extends BasicShape {

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	constructor(DOMElement, color, strokeWidth, scale) {
		super();
		this.DOMElement = DOMElement;
		this._color = color;

		this.originalHalfWidth = 150;
		this.halfWidth = scale * this.originalHalfWidth;
		this.strokeWidth = strokeWidth;

		this.draw();
	}

	//------------------------------------------------
	// Create the required SVG elements
	//------------------------------------------------
	draw() {
		this.shape = document.createElementNS("http://www.w3.org/2000/svg", "line");
		this.shape.setAttribute("fill", "transparent");
		this.shape.setAttribute("stroke", this.color);
		this.shape.setAttribute("stroke-width", this.strokeWidth);

		this.effectsShape = document.createElementNS("http://www.w3.org/2000/svg", "line");
		this.effectsShape.setAttribute("fill", "transparent");
		this.effectsShape.setAttribute("stroke-linecap", "butt");
		this.effectsShape.setAttribute("stroke", this.color);
		this.effectsShape.setAttribute("stroke-width", this.strokeWidth);

		super.draw();
	}

	//------------------------------------------------
	// Change the x/y position of the shape
	//------------------------------------------------
	setPosition(x, y) {
		super.setPosition(x, y);

		// Perform rotation
		let angle = this._angle * Math.PI / 180.0;

		let x1 = x;
		let x2 = x + (this.halfWidth*2);
		let y1 = y;
		let y2 = y;

		this.originX = x + (this.halfWidth);
		this.originY = y;

		let tempx1 = Math.cos(angle) * (x1 - this.originX) - Math.sin(angle) * (y1 - this.originY) + this.originX;
		let tempy1 = Math.sin(angle) * (x1 - this.originX) + Math.cos(angle) * (y1 - this.originY) + this.originY;
		
		let tempx2 = Math.cos(angle) * (x2 - this.originX) - Math.sin(angle) * (y2 - this.originY) + this.originX;
		let tempy2 = Math.sin(angle) * (x2 - this.originX) + Math.cos(angle) * (y2 - this.originY) + this.originY;

		this.shape.setAttribute("x1", tempx1);
		this.shape.setAttribute("x2", tempx2);
		this.shape.setAttribute("y1", tempy1);
		this.shape.setAttribute("y2", tempy2);
		this.effectsShape.setAttribute("x1", tempx1);
		this.effectsShape.setAttribute("x2", tempx2);
		this.effectsShape.setAttribute("y1", tempy1);
		this.effectsShape.setAttribute("y2", tempy2);

		// Work out the bounding box
		let boxX = (tempx1 < tempx2) ? tempx1 : tempx2;
		let boxY = (tempy1 < tempy2) ? tempy1 : tempy2;
		let width = (tempx1 < tempx2) ? tempx2 - tempx1 : tempx1 - tempx2;
		let height = (tempy1 < tempy2) ? tempy2 - tempy1 : tempy1 - tempy2;
		angle = (this._angle > 180) ? this._angle - 180 : this._angle;
		angle = Math.abs(angle * Math.PI / 180.0);
		
		this.createLineSegments(angle, this.originX, this.originY);
		this.updateBoundingBox();

		this.centerGuide.setAttribute("cx", this.originX);
		this.centerGuide.setAttribute("cy", this.originY);
	}

	//------------------------------------------------
	// Update the bounding box rect
	//------------------------------------------------
	updateBoundingBox() {
		this.boundingBox = {
			x: this.minX,
			y: this.minY,
			width: this.maxX - this.minX,
			height: this.maxY - this.minY
		};
		this.boundingBoxGuide.setAttribute("x", this.boundingBox.x);
		this.boundingBoxGuide.setAttribute("y", this.boundingBox.y);
		this.boundingBoxGuide.setAttribute("width", this.boundingBox.width);
		this.boundingBoxGuide.setAttribute("height", this.boundingBox.height);
	}

	//------------------------------------------------
	// Recalculate the x/y of all points based on current
	// shape x/y, and angle of rotation
	//------------------------------------------------
	createLineSegments(angle, originX, originY) {
		// Store the previous frame's segment data
		this.previousSegments = this.segments;
		this.segments = [];
		this.segmentPath = "";
		let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
		this.minX = 0; this.minY = 0; this.maxX = 0; this.maxY = 0;

		x1 = this.x;
		y1 = this.y - (this.strokeWidth/2);
		x2 = this.x + (this.halfWidth*2);
		y2 = y1;
		this.addSegment(x1, y1, x2, y2, angle, originX, originY);

		x1 = x2;
		y1 = y2;
		x2 = x2;
		y2 = this.y + (this.strokeWidth/2);
		this.addSegment(x1, y1, x2, y2, angle, originX, originY);

		x1 = x2;
		y1 = y2;
		x2 = this.x;
		y2 = y2;
		this.addSegment(x1, y1, x2, y2, angle, originX, originY);

		x1 = x2;
		y1 = y2;
		x2 = x2;
		y2 = this.y - (this.strokeWidth/2);
		this.addSegment(x1, y1, x2, y2, angle, originX, originY);

		this.segmentGuide.setAttribute("d", this.segmentPath);
	}

	//------------------------------------------------
	// Calculate the position of a point after being rotated
	// by a given angle around the shape's origin
	//------------------------------------------------
	addSegment(x1, y1, x2, y2, angle, originX, originY) {
		let tempx1 = Math.cos(angle) * (x1 - originX) - Math.sin(angle) * (y1 - originY) + originX;
		let tempy1 = Math.sin(angle) * (x1 - originX) + Math.cos(angle) * (y1 - originY) + originY;
		let tempx2 = Math.cos(angle) * (x2 - originX) - Math.sin(angle) * (y2 - originY) + originX;
		let tempy2 = Math.sin(angle) * (x2 - originX) + Math.cos(angle) * (y2 - originY) + originY;
		// Set the min/max values to that of the first point, if they have yet to be set
		if (this.minX === 0 && this.minY === 0 && this.maxX === 0 && this.maxY === 0) {
			this.minX = this.maxX = tempx1;
			this.minY = this.maxY = tempy1;
		}
		// Add this new line to the collision segments
		this.segments.push({x1: tempx1, y1: tempy1, x2: tempx2, y2: tempy2});
		if (this.segmentPath === "") {
			this.segmentPath = "M " + tempx1 + " " + tempy1;
		}
		this.segmentPath += " L " + tempx2 + " " + tempy2;

		// Update min/max values
		if (tempx1 < this.minX) this.minX = tempx1;
		if (tempx2 < this.minX) this.minX = tempx2;
		if (tempy1 < this.minY) this.minY = tempy1;
		if (tempy2 < this.minY) this.minY = tempy2;

		if (tempx1 > this.maxX) this.maxX = tempx1;
		if (tempx2 > this.maxX) this.maxX = tempx2;
		if (tempy1 > this.maxY) this.maxY = tempy1;
		if (tempy2 > this.maxY) this.maxY = tempy2;
	}

	//------------------------------------------------
	// Change the width of the shape and it's stroke width
	//------------------------------------------------
	resize(strokeWidth, scale) {
		this.strokeWidth = strokeWidth;
		this.halfWidth = this.originalHalfWidth * scale;
		this.shape.setAttribute("stroke-width", this.strokeWidth);
		this.shape.style.strokeWidth = this.strokeWidth;
		// We don't update the width of the effects shape stroke here,
		// since it could be currently animating
	}
}