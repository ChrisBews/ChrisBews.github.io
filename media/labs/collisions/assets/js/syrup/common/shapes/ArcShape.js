////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
// 
////////////////////////////////////////////////////////////////////////////////

class ArcShape extends BasicShape {

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	constructor(DOMElement, color, strokeWidth, scale) {
		super();
		this.DOMElement = DOMElement;
		this._color = color;
		
		this.originalHalfWidth = 140;
		this.halfWidth = scale * this.originalHalfWidth;

		this.strokeWidth = strokeWidth;
		this.shape = null;
		this.x = 0;
		this.y = 0;
		this.scale = scale;
		this.boundingBoxGuide = null;
		this.segmentGuide = null;
		this.centerGuide = null;
		
		this.arcStart = {};
		this.arcEnd = {};

		this.radius = (Math.random() > 0.7) ? 140 : 140 + (Math.random() * 140);

		this.draw();

	}

	//------------------------------------------------
	// Create the required SVG elements
	//------------------------------------------------
	draw() {
		this.shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
		let path = "M " + this.x + " " + (this.y+this.halfWidth) + " A " + (this.radius*this.scale) + " " + (this.radius*this.scale) + " 0 0 1 ";
		path += (this.x + (this.halfWidth*2)) + " " + (this.y+this.halfWidth);
		this.shape.setAttribute("d", path);
		this.shape.setAttribute("fill", "transparent");
		this.shape.setAttribute("stroke", this.color);
		this.shape.setAttribute("stroke-width", this.strokeWidth);

		this.effectsShape = document.createElementNS("http://www.w3.org/2000/svg", "path");
		this.effectsShape.setAttribute("stroke-width", this.strokeWidth);
		this.effectsShape.setAttribute("stroke-linecap", "butt");
		this.effectsShape.setAttribute("stroke", this.color);
		this.effectsShape.setAttribute("fill", "transparent");

		super.draw();
	}

	//------------------------------------------------
	// Change the x/y co-ordinates of the shape as a whole
	//------------------------------------------------
	setPosition(x, y) {
		super.setPosition(x, y);

		this.originX = x + (this.halfWidth);
		this.originY = y + (this.halfWidth/2);

		// We need to build the collision model first, because where that line starts and ends
		// is where the visible arc has to start and end. The buildCollisionModel method stores
		// the Y pos of the first point as this.arcStart.y, and the Y pos of the last point as this.arcEndY
		this.buildCollisionModel();

		let tempX1 = 0;
		let tempY1 = 0;
		let tempX2 = 0;
		let tempY2 = 0;

		let path = "M ";
		let effectsPath = "M ";

		let angle = Math.abs(this._angle * Math.PI / 180.0);

		let testX = this.x;
		// Here we use the startY worked out by buildCollisionModel
		let testY = this.arcStart.y;
		tempX1 =  Math.cos(angle) * (testX - this.originX) - Math.sin(angle) * (testY - this.originY) + this.originX
		tempY1 = Math.sin(angle) * (testX - this.originX) + Math.cos(angle) * (testY - this.originY) + this.originY;
		path += tempX1 + " " + tempY1 + " A " + (this.radius*this.scale) + " " + (this.radius*this.scale) + " 0 0 1 ";
		testX = (this.x + (this.halfWidth*2));
		// Here we use the endY worked out by buildCollisionModel
		testY = this.arcEnd.y;
		tempX2 =  Math.cos(angle) * (testX - this.originX) - Math.sin(angle) * (testY - this.originY) + this.originX
		tempY2 = Math.sin(angle) * (testX - this.originX) + Math.cos(angle) * (testY - this.originY) + this.originY;

		path += tempX2 + " " + tempY2;
		this.shape.setAttribute("d", path);

		this.effectsShape.setAttribute("d", path);
	}
	

	//------------------------------------------------
	// Recalculate the collision model, which is a series
	// of straight line segments running around the outside
	// of the arc
	//------------------------------------------------
	buildCollisionModel() {
		let minX = 0;
		let minY = 0;
		let maxX = 0;
		let maxY = 0;
		let point1 = {};
		let point2 = {};

		// We need to find the angle of the circle that the resulting arc represents
		// This involves basic trig, eg. https://www.mathsisfun.com/algebra/trig-solving-sss-triangles.html
		// First we find the length of the line between the start and end points (horizontal)
		let thisAngle = this.halfWidth*2;
		// Then we use trig to find the angle of the pie section at the circle's centre
		// The angle of the circle that the arc represents will always be the same as this.
		var scaledRadius = (this.radius*this.scale);
		thisAngle = (Math.pow(scaledRadius, 2) + Math.pow(scaledRadius, 2) - Math.pow(thisAngle, 2)) / (2*scaledRadius*scaledRadius);
		thisAngle = Math.acos(thisAngle) * 180/Math.PI;
		// Now we can use this angle to work out where the arc's collision segments should be positioned
		// The maths is easy when we've got half a circle (180 degrees angle), but otherwise we need to offset the start and end positions
		// This keeps the arc centred, we just have to work out how far off -180 the start needs to be

		let requiredSegments = 8;
		// Make sure the guide arc starts in the right place
		let start = -((thisAngle/2)) - 90;
		let end = -((thisAngle/2)) - 90;
		let line = {};
		// Store the previous frame's segment data
		this.previousSegments = this.segments;
		this.segments = [];
		let guidePath = "";
		// Convert angle to radians, since cos/sin take radians as their arg
		let angle = this._angle * Math.PI / 180.0;

		let arcCenterX = this.x + this.halfWidth;
		let arcCenterY = this.originY + scaledRadius;

		let radius = scaledRadius + (this.strokeWidth/2);
		let rotatedArcStart = {};

		for (let i = 0; i < requiredSegments; i++) {
			start = end;
			end = start + (thisAngle/requiredSegments);
			// Work out positions needed for the actual green arc drawing
			// These remain un-rotated for now
			if (i === 0) {
				this.arcStart = {
					x: parseInt(arcCenterX + scaledRadius * Math.cos(Math.PI * start/180)),
					y: parseInt(arcCenterY + scaledRadius * Math.sin(Math.PI * start/180))
				};
			} else if (i === requiredSegments-1) { 
				this.arcEnd = {
					x: parseInt(arcCenterX + scaledRadius * Math.cos(Math.PI * end/180)),
					y: parseInt(arcCenterY + scaledRadius * Math.sin(Math.PI * end/180))
				};
			}
			line = {};
			// Centre of circle + radius + cos or sin of angle in radians (Math.PI * angle in degrees / 180)
			let testX1 = parseInt(arcCenterX + radius * Math.cos(Math.PI * start/180));
			let testY1 = parseInt(arcCenterY + radius * Math.sin(Math.PI * start/180));
			let testX2 = parseInt(arcCenterX + radius * Math.cos(Math.PI * end/180));
			let testY2 = parseInt(arcCenterY + radius * Math.sin(Math.PI * end/180));
			point1 = this.rotateCoords(testX1, testY1, angle);
			point2 = this.rotateCoords(testX2, testY2, angle);

			// Store the rotated start position of the outer arc
			if (i === 0) {
				rotatedArcStart = point1;
			}

			// Store the new line values
			line.x1 = point1.x;
			line.x2 = point2.x;
			line.y1 = point1.y;
			line.y2 = point2.y;

			// Build the guide path
			if (i === 0) {
				guidePath = "M " + line.x1 + " " + line.y1 + " L " + line.x2 + " " + line.y2;
			} else {
				guidePath += " L " + line.x2 + " " + line.y2;
			}

			// Update min/max values for the bounding box
			if (i === 0) {
				minX = maxX = line.x1;
				minY = maxY = line.y1;
			}
			if (line.x1 < minX) minX = line.x1;
			if (line.x2 < minX) minX = line.x2;
			if (line.x1 > maxX) maxX = line.x1;
			if (line.x2 > maxX) maxX = line.x2;

			if (line.y1 < minY) minY = line.y1;
			if (line.y2 < minY) minY = line.y2;
			if (line.y1 > maxY) maxY = line.y1;
			if (line.y2 > maxY) maxY = line.y2;

			// Add to the segments array
			this.segments.push(line);
		}

		// Create a line joining the two arcs on the right side (the bottom of the arc)
		let x1 = parseInt(arcCenterX + radius * Math.cos(Math.PI * end/180));
		let y1 = parseInt(arcCenterY + radius * Math.sin(Math.PI * end/180));
		let joinPoint1 = this.rotateCoords(x1, y1, angle);
		let joinPoint2 = {};

		// Now draw the inner arc
		radius = scaledRadius - (this.strokeWidth/2);
		for (let i = requiredSegments; i > 0; i--) {
			start = end;
			end = start - (thisAngle/requiredSegments);
			// Work out positions needed for the actual green arc drawing
			// These remain un-rotated for now
			line = {};
			// Centre of circle + radius + cos or sin of angle in radians (Math.PI * angle in degrees / 180)
			let testX1 = parseInt(arcCenterX + radius * Math.cos(Math.PI * start/180));
			let testY1 = parseInt(arcCenterY + radius * Math.sin(Math.PI * start/180));
			let testX2 = parseInt(arcCenterX + radius * Math.cos(Math.PI * end/180));
			let testY2 = parseInt(arcCenterY + radius * Math.sin(Math.PI * end/180));
			point1 = this.rotateCoords(testX1, testY1, angle);
			point2 = this.rotateCoords(testX2, testY2, angle);

			// Create the joining line between the two arcs
			if (i === requiredSegments) {
				joinPoint2 = point1;
				let joinLine = {
					x1: joinPoint1.x,
					y1: joinPoint1.y,
					x2: joinPoint2.x,
					y2: joinPoint2.y
				};
				guidePath += " L " + joinLine.x2 + " " + joinLine.y2;
				this.segments.push(joinLine);
			}
			// Store the new line values
			line.x1 = point1.x;
			line.x2 = point2.x;
			line.y1 = point1.y;
			line.y2 = point2.y;

			// Build the guide path
			if (i === 0) {
				guidePath = "M " + line.x1 + " " + line.y1 + " L " + line.x2 + " " + line.y2;
			} else {
				guidePath += " L " + line.x2 + " " + line.y2;
			}

			// Update min/max values for the bounding box
			if (i === 0) {
				minX = maxX = line.x1;
				minY = maxY = line.y1;
			}
			if (line.x1 < minX) minX = line.x1;
			if (line.x2 < minX) minX = line.x2;
			if (line.x1 > maxX) maxX = line.x1;
			if (line.x2 > maxX) maxX = line.x2;

			if (line.y1 < minY) minY = line.y1;
			if (line.y2 < minY) minY = line.y2;
			if (line.y1 > maxY) maxY = line.y1;
			if (line.y2 > maxY) maxY = line.y2;

			// Add to the segments array
			this.segments.push(line);

			// If this is the end of the second arc, join back up to the first one
			if (i === 1) {
				joinPoint2 = point2;
				let joinLine = {
					x1: joinPoint2.x,
					y1: joinPoint2.y,
					x2: rotatedArcStart.x,
					y2: rotatedArcStart.y
				};
				guidePath += " L " + joinLine.x2 + " " + joinLine.y2;
				this.segments.push(joinLine);
			}
		}

		this.segmentGuide.setAttribute("d", guidePath);

		// Generate the bounding box
		this.boundingBox.x = minX;
		this.boundingBox.y = minY;

		this.boundingBox.width = (maxX - minX);
		this.boundingBox.height = (maxY - minY);

		this.boundingBoxGuide.setAttribute("x", this.boundingBox.x);
		this.boundingBoxGuide.setAttribute("y", this.boundingBox.y);
		this.boundingBoxGuide.setAttribute("width", this.boundingBox.width);
		this.boundingBoxGuide.setAttribute("height", this.boundingBox.height);

		this.centerGuide.setAttribute("cx", this.originX);
		this.centerGuide.setAttribute("cy", this.originY);
	}

	//------------------------------------------------
	// Work out the co-ordinates of a point after being
	// rotated by a given angle around the shape's origin
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
	// Change the radius of the arc to suit the current
	// browser dimensions, and change the stroke width
	//------------------------------------------------
	resize(strokeWidth, scale) {
		this.strokeWidth = strokeWidth;
		this.halfWidth = this.originalHalfWidth * scale;
		this.scale = scale;
		this.shape.setAttribute("stroke-width", this.strokeWidth);
		this.shape.style.strokeWidth = this.strokeWidth;
	}
}