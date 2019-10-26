////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
// 
////////////////////////////////////////////////////////////////////////////////

class LShape extends BasicShape {

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	constructor(DOMElement, color, strokeWidth, scale) {
		super();
		// Variables
		this.DOMElement = DOMElement;
		this._color = color;

		this.originalHalfWidth = 100;
		this.halfWidth = scale * this.originalHalfWidth;
		this.strokeWidth = strokeWidth;

		this.draw();
	}

	//------------------------------------------------
	// Draw the required svg elements
	//------------------------------------------------
	draw() {
		this.shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
		this.shape.setAttribute("fill", "transparent");
		this.shape.setAttribute("stroke-width", this.strokeWidth);
		this.shape.setAttribute("stroke", this.color);

		this.effectsShape = document.createElementNS("http://www.w3.org/2000/svg", "path");
		this.effectsShape.setAttribute("fill", "transparent");
		this.effectsShape.setAttribute("stroke-linecap", "butt");
		this.effectsShape.setAttribute("stroke-width", this.strokeWidth);
		this.effectsShape.setAttribute("stroke", this.color);
		super.draw();
	}

	//------------------------------------------------
	// Calculate the rotated x/y co-ordinates, and
	// store in the segment array
	//------------------------------------------------
	addSegment(x1, y1, x2, y2, angle, originX, originY) {
		let tempx1 = Math.cos(angle) * (x1 - originX) - Math.sin(angle) * (y1 - originY) + originX;
		let tempy1 = Math.sin(angle) * (x1 - originX) + Math.cos(angle) * (y1 - originY) + originY;
		let tempx2 = Math.cos(angle) * (x2 - originX) - Math.sin(angle) * (y2 - originY) + originX;
		let tempy2 = Math.sin(angle) * (x2 - originX) + Math.cos(angle) * (y2 - originY) + originY;
		this.segments.push({x1: tempx1, y1: tempy1, x2: tempx2, y2: tempy2});

		// Set the min/max values to that of the first point, if they have yet to be set
		if (this.minX === 0 && this.minY === 0 && this.maxX === 0 && this.maxY === 0) {
			this.minX = this.maxX = tempx1;
			this.minY = this.maxY = tempy1;
		}

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
	// Generate new segment data based on current x and y position
	//------------------------------------------------
	createSegments(x, y, angle) {
		this.minX = 0;
		this.minY = 0;
		this.maxX = 0;
		this.maxY = 0;
		// Store the previous frame's segment data
		this.previousSegments = this.segments;
		
		this.segments = [];
		this.segmentPath = "";
		let x1 = x;
		let y1 = y - (this.strokeWidth/2);
		let x2 = x + (this.halfWidth*2) + (this.strokeWidth/2);
		let y2 = y - (this.strokeWidth/2);

		this.addSegment(x1, y1, x2, y2, angle, this.originX, this.originY);

		x1 = x2;
		y1 = y2;
		x2 = x2;
		y2 = y + (this.halfWidth*2);
		this.addSegment(x1, y1, x2, y2, angle, this.originX, this.originY);

		x1 = x2;
		y1 = y2;
		x2 = x2 - (this.strokeWidth);
		y2 = y2;
		this.addSegment(x1, y1, x2, y2, angle, this.originX, this.originY);

		x1 = x2;
		y1 = y2;
		x2 = x2;
		y2 = y + (this.strokeWidth/2);
		this.addSegment(x1, y1, x2, y2, angle, this.originX, this.originY);

		x1 = x2;
		y1 = y2;
		x2 = x;
		y2 = y + (this.strokeWidth/2);
		this.addSegment(x1, y1, x2, y2, angle, this.originX, this.originY);

		x1 = x2;
		y1 = y2;
		x2 = x2;
		y2 = y - (this.strokeWidth/2)
		this.addSegment(x1, y1, x2, y2, angle, this.originX, this.originY);

		this.segmentGuide.setAttribute("d", this.segmentPath);
	}

	//------------------------------------------------
	// Calculate the co-ordinates of a point after 
	// being rotated around the shape's origin
	//------------------------------------------------
	rotateCoords(x, y, angle) {
		let rotatedX = Math.cos(angle) * (x - this.originX) - Math.sin(angle) * (y - this.originY) + this.originX;
		let rotatedY = Math.sin(angle) * (x - this.originX) + Math.cos(angle) * (y - this.originY) + this.originY;
		return {
			x: rotatedX,
			y: rotatedY
		}
	}

	//------------------------------------------------
	// Update the x/y co-ordinates of the shape
	//------------------------------------------------
	setPosition(x, y) {
		super.setPosition(x, y);
		
		let angle = this._angle * Math.PI / 180.0;

		this.originX = x + (this.halfWidth*2);
		this.originY = y;

		this.createSegments(x, y, angle);

		this.centerGuide.setAttribute("cx", this.originX);
		this.centerGuide.setAttribute("cy", this.originY);

		let path = "";

		let point = this.rotateCoords(x, y, angle);
		path = "M " + point.x + " " + point.y;

		point = this.rotateCoords(x + (this.halfWidth*2), y, angle);
		path += " L " + point.x + " " + point.y;

		point = this.rotateCoords(x + (this.halfWidth*2), y + this.halfWidth*2, angle);
		path += " " + point.x + " " + point.y;

		this.shape.setAttribute("d", path);
		this.effectsShape.setAttribute("d", path);

		// Figure out the new bounding box
		this.boundingBox.x = this.minX;
		this.boundingBox.y = this.minY;
		this.boundingBox.width = (this.maxX - this.minX);
		this.boundingBox.height = (this.maxY - this.minY);

		this.x = x;
		this.y = y;

		this.boundingBoxGuide.setAttribute("x", this.boundingBox.x);
		this.boundingBoxGuide.setAttribute("y", this.boundingBox.y);
		this.boundingBoxGuide.setAttribute("width", this.boundingBox.width);
		this.boundingBoxGuide.setAttribute("height", this.boundingBox.height);
	}

	//------------------------------------------------
	// Change the width/height of the shape and stroke width
	//------------------------------------------------
	resize(strokeWidth, scale) {
		this.strokeWidth = strokeWidth;
		this.halfWidth = this.originalHalfWidth * scale;
		this.shape.setAttribute("stroke-width", this.strokeWidth);
		this.shape.style.strokeWidth = this.strokeWidth;
	}
}