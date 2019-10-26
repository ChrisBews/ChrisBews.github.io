////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
// 
////////////////////////////////////////////////////////////////////////////////

class CircleShape extends BasicShape {

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	constructor(DOMElement, color, strokeWidth, scale) {
		super();
		this.DOMElement = DOMElement;
		this._color = color;
		this.x = 0;
		this.y = 0;

		this.originalHalfWidth = 80;
		this.halfWidth = scale * this.originalHalfWidth;
		this.strokeWidth = strokeWidth;

		this.draw();
	}

	//------------------------------------------------
	// Create the required SVG elements
	//------------------------------------------------
	draw() {
		this.shape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		this.shape.setAttribute("fill", "transparent");
		this.shape.setAttribute("stroke", this.color);
		this.shape.setAttribute("stroke-width", this.strokeWidth);
		this.shape.setAttribute("r", this.halfWidth);

		this.effectsShape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		this.effectsShape.setAttribute("stroke-width", this.strokeWidth);
		this.effectsShape.setAttribute("stroke-linecap", "butt");
		this.effectsShape.setAttribute("stroke", this.color);
		this.effectsShape.setAttribute("fill", "transparent");
		this.effectsShape.setAttribute("r", this.halfWidth);

		super.draw();
	}

	//------------------------------------------------
	// Change the x/y position of the circle's center
	//------------------------------------------------
	setPosition(x, y) {
		super.setPosition(x, y);
		this.shape.setAttribute("cx", x);
		this.shape.setAttribute("cy", y);
		this.effectsShape.setAttribute("cx", x);
		this.effectsShape.setAttribute("cy", y);
		this.buildCollisionModel();
	}

	//------------------------------------------------
	// Calculate the straight line segments that should
	// run around the outside of the circle, that will
	// form the collision model for this shape
	//------------------------------------------------
	buildCollisionModel() {
		let tempX1 = 0;
		let tempX2 = 0;
		let tempY1 = 0;
		let tempY2 = 0;
		// Increase this number to increase accuracy (less is better for performance)
		let requiredSegments = 12;
		// Make sure the guide arc starts in the right place
		let start = -180;
		let end = -180;
		let line = {};
		// Store the previous frame's segment data
		this.previousSegments = this.segments;
		this.segments = [];
		let guidePath = "";
		// Convert angle to radians, since cos/sin take radians as their arg
		let angle = this._angle * Math.PI / 180.0;
		for (let i = 0; i < requiredSegments; i++) {
			start = end;
			end = start + (360/requiredSegments);
			line = {};
			line.x1 = parseInt(this.x + (this.halfWidth+(this.strokeWidth/2)) * Math.cos(Math.PI * start/180));
			line.y1 = parseInt(this.y + (this.halfWidth+(this.strokeWidth/2)) * Math.sin(Math.PI * start/180));
			line.x2 = parseInt(this.x + (this.halfWidth+(this.strokeWidth/2)) * Math.cos(Math.PI * end/180));
			line.y2 = parseInt(this.y + (this.halfWidth+(this.strokeWidth/2)) * Math.sin(Math.PI * end/180));
			// Build the guide path
			if (i === 0) {
				guidePath = "M " + line.x1 + " " + line.y1 + " L " + line.x2 + " " + line.y2;
			} else {
				guidePath += " L " + line.x2 + " " + line.y2;
			}
			// Add to the segments array
			this.segments.push(line);
		}
		this.segmentGuide.setAttribute("d", guidePath);

		// Update bounding box
		this.boundingBox.x = this.x - (this.halfWidth + (this.strokeWidth/2));
		this.boundingBox.y = this.y - (this.halfWidth + (this.strokeWidth/2));
		this.boundingBox.width = (this.halfWidth * 2) + this.strokeWidth;
		this.boundingBox.height = this.boundingBox.width;
		// Update bounding box guide
		this.boundingBoxGuide.setAttribute("x", this.boundingBox.x);
		this.boundingBoxGuide.setAttribute("y", this.boundingBox.y);
		this.boundingBoxGuide.setAttribute("width", this.boundingBox.width);
		this.boundingBoxGuide.setAttribute("height", this.boundingBox.height);
		// Update the center point guide
		this.centerGuide.setAttribute("cx", this.x);
		this.centerGuide.setAttribute("cy", this.y);
	}

	//------------------------------------------------
	// Change the circle radius to match the current browser
	// dimensions, and change the stroke width
	//------------------------------------------------
	resize(strokeWidth, scale) {
		this.strokeWidth = strokeWidth;
		this.halfWidth = this.originalHalfWidth * scale;
		this.shape.setAttribute("r", this.halfWidth);
		this.shape.setAttribute("stroke-width", this.strokeWidth);
		this.shape.style.strokeWidth = this.strokeWidth;

		this.effectsShape.setAttribute("r", this.halfWidth);
		this.effectsShape.setAttribute("stroke-width", this.strokeWidth);
	}
}
