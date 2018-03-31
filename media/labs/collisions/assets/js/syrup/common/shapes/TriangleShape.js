////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
// 
////////////////////////////////////////////////////////////////////////////////

class TriangleShape extends BasicShape {

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	constructor(DOMElement, color, strokeWidth, scale) {
		super();
		this.DOMElement = DOMElement;
		this._color = color;
		this.x = 0;
		this.y = 0;

		this.originalHalfWidth = 90;
		this.halfWidth = scale * this.originalHalfWidth;
		this.strokeWidth = strokeWidth;
		
		this.points = null;
		this.pointArray = [];

		this.draw();
	}

	//------------------------------------------------
	// Create the svg elements to be rendered later
	//------------------------------------------------
	draw() {
		this.shape = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
		this.shape.setAttribute("fill", "transparent");
		this.shape.setAttribute("stroke", this.color);
		this.shape.setAttribute("stroke-width", this.strokeWidth);

		this.effectsShape = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
		this.effectsShape.setAttribute("fill", "transparent");
		this.effectsShape.setAttribute("stroke", this.color);
		this.effectsShape.setAttribute("stroke-linecap", "butt");
		this.effectsShape.setAttribute("stroke-width", this.strokeWidth);

		this.generatePoints();
		super.draw();
	}

	//------------------------------------------------
	// Figure out the 3 points for the triangle, while
	// also factoring in the current rotation
	//------------------------------------------------
	generatePoints() {
		this.pointArray = [];
		this.originX = this.x;
		this.originY = this.y + this.strokeWidth/2;
		let angle = this._angle * Math.PI / 180.0;
		let collisionX = 0, collisionY = 0;

		let collisionWidth = (this.halfWidth + ((this.strokeWidth/4)*3));
		let collisionHeight = (this.halfWidth + (this.strokeWidth/2));

		let xPos = 0, yPos = 0;
		xPos = Math.cos(angle) * (this.x - this.originX) - Math.sin(angle) * ((this.y - this.halfWidth) - this.originY) + this.originX;
		yPos = Math.sin(angle) * (this.x - this.originX) + Math.cos(angle) * ((this.y - this.halfWidth) - this.originY) + this.originY;
		collisionX = Math.cos(angle) * (this.x - this.originX) - Math.sin(angle) * ((this.y - (collisionWidth + (this.strokeWidth/4))) - this.originY) + this.originX;
		collisionY = Math.sin(angle) * (this.x - this.originX) + Math.cos(angle) * ((this.y - (collisionWidth + (this.strokeWidth/4))) - this.originY) + this.originY;
		this.points = xPos + " " + yPos + " ";
		this.pointArray.push({x: xPos, y: yPos, collisionX: collisionX, collisionY: collisionY});

		xPos = Math.cos(angle) * ((this.x + this.halfWidth) - this.originX) - Math.sin(angle) * ((this.y + this.halfWidth) - this.originY) + this.originX;
		yPos = Math.sin(angle) * ((this.x + this.halfWidth) - this.originX) + Math.cos(angle) * ((this.y + this.halfWidth) - this.originY) + this.originY;
		collisionX = Math.cos(angle) * ((this.x + collisionWidth) - this.originX) - Math.sin(angle) * ((this.y + collisionHeight) - this.originY) + this.originX;
		collisionY = Math.sin(angle) * ((this.x + collisionWidth) - this.originX) + Math.cos(angle) * ((this.y + collisionHeight) - this.originY) + this.originY;
		this.points += xPos + " " + yPos + " ";
		this.pointArray.push({x: xPos, y: yPos, collisionX: collisionX, collisionY: collisionY});

		xPos = Math.cos(angle) * ((this.x - this.halfWidth) - this.originX) - Math.sin(angle) * ((this.y + this.halfWidth) - this.originY) + this.originX;
		yPos = Math.sin(angle) * ((this.x - this.halfWidth) - this.originX) + Math.cos(angle) * ((this.y + this.halfWidth) - this.originY) + this.originY;
		collisionX = Math.cos(angle) * ((this.x - collisionWidth) - this.originX) - Math.sin(angle) * ((this.y + collisionHeight) - this.originY) + this.originX;
		collisionY = Math.sin(angle) * ((this.x - collisionWidth) - this.originX) + Math.cos(angle) * ((this.y + collisionHeight) - this.originY) + this.originY;

		this.points += xPos + " " + yPos + " ";
		this.pointArray.push({x: xPos, y: yPos, collisionX: collisionX, collisionY: collisionY});

		this.shape.setAttribute("points", this.points);
		this.effectsShape.setAttribute("points", this.points);
	}

	//------------------------------------------------
	// Update the x/y position of the shape
	//------------------------------------------------
	setPosition(x, y) {
		super.setPosition(x, y);
		this.generatePoints();

		this.buildCollisionModel();
	}

	//------------------------------------------------
	// Figure out where the collision lines should be
	// Here they should be on the outside of the triangle
	//------------------------------------------------
	buildCollisionModel() {
		// Store the previous frame's segment data
		this.previousSegments = this.segments;
		
		this.segments = [];
		let line = {}, path = "";
		let minX = this.pointArray[0].collisionX, minY = this.pointArray[0].collisionY, maxX = this.pointArray[0].collisionX, maxY = this.pointArray[0].collisionY;

		for (let i = 0, length = this.pointArray.length; i < length; i++) {
			line = {};
			line.x1 = this.pointArray[i].collisionX;
			line.y1 = this.pointArray[i].collisionY;
			if (i < this.pointArray.length-1) {
				line.x2 = this.pointArray[i+1].collisionX;
				line.y2 = this.pointArray[i+1].collisionY;
			} else {
				line.x2 = this.pointArray[0].collisionX;
				line.y2 = this.pointArray[0].collisionY;
			}
			if (i === 0) {
				path = "M" + line.x1 + " " + line.y1;
			}
			path += " L" + line.x2 + " " + line.y2;
			this.segments.push(line);

			if (line.x1 < minX) minX = line.x1;
			if (line.x2 < minX) minX = line.x2;
			if (line.y1 < minY) minY = line.y1;
			if (line.y2 < minY) minY = line.y2;

			if (line.x1 > maxX) maxX = line.x1;
			if (line.x2 > maxX) maxX = line.x2;
			if (line.y1 > maxY) maxY = line.y1;
			if (line.y2 > maxY) maxY = line.y2;
		}
		this.segmentGuide.setAttribute("d", path);

		// Update the center point guide
		this.centerGuide.setAttribute("cx", this.originX);
		this.centerGuide.setAttribute("cy", this.originY);
		// Update the actual bounding box
		this.boundingBox.x = minX;
		this.boundingBox.y = minY;
		this.boundingBox.width = (maxX - minX);
		this.boundingBox.height = (maxY - minY);
		// Update the bounding box guide line
		this.boundingBoxGuide.setAttribute("x", this.boundingBox.x);
		this.boundingBoxGuide.setAttribute("y", this.boundingBox.y);
		this.boundingBoxGuide.setAttribute("width", this.boundingBox.width);
		this.boundingBoxGuide.setAttribute("height", this.boundingBox.height);
	}

	//------------------------------------------------
	// Update the size of the shape and change the width
	// of stroke used
	//------------------------------------------------
	resize(strokeWidth, scale) {
		this.strokeWidth = strokeWidth;
		this.halfWidth = this.originalHalfWidth * scale;
		this.shape.setAttribute("stroke-width", this.strokeWidth);
		this.shape.style.strokeWidth = this.strokeWidth;
	}
}
