////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
// Shape Physics
////////////////////////////////////////////////////////////////////////////////

class ShapeSystem extends EventDispatcher {

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	constructor(DOMElement, backgroundLines, stage, strokeWidth, scale) {
		super();
		// Variables
		this.DOMElement = DOMElement;
		this.backgroundLines = backgroundLines;
		this.stage = stage;
		this.totalShapes = 0;
		this.maxShapes = 5;
		this.paused = true;
		this.debugMode = false;
		this.flightControlEnabled = false
		this.strokeWidth = strokeWidth;
		this.scale = scale;
		this.shapes = [];
		this.flightControlShapes = [];
		this.flightControlCopy = [];
		this.fadedShapes = 0;
		this.shapeOptions = [ArcShape, CircleShape, LineShape, LShape, TriangleShape];
		//this.shapeOptions = [LineShape];
		this.createStartingShapes();
		this.createListeners();
		this.requestFrameID = requestAnimationFrame(() => this.updateSimulation());
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	randomise() {
		// Remove old shapes
		while (this.shapes.length > 0) {
			this.shapes[0].destroy(true);
			this.shapes.shift();
		}
		// Recreate shapes
		this.createStartingShapes();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	updateSpeeds() {
		// Remove old shapes
		var i = 0, length = this.shapes.length;
		for (; i < length; i++) {
			this.shapes[i].selectSpeed();
		}
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	showArcs() {
		this.shapeOptions = [ArcShape];
		this.randomise();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	showCircles() {
		this.shapeOptions = [CircleShape];
		this.randomise();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	showLines() {
		this.shapeOptions = [LineShape];
		this.randomise();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	showCorners() {
		this.shapeOptions = [LShape];
		this.randomise();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	showTriangles() {
		this.shapeOptions = [TriangleShape];
		this.randomise();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	showAllShapes() {
		this.shapeOptions = [ArcShape, CircleShape, LineShape, LShape, TriangleShape];
		this.randomise();
	}

	//------------------------------------------------
	// Listen to debug mode requests
	//------------------------------------------------
	createListeners() {
		Mediator.subscribe(Events.ENABLE_DEBUG_MODE, (data) => this.enableDebugMode(data));
		Mediator.subscribe(Events.DISABLE_DEBUG_MODE, (data) => this.disableDebugMode(data));
		Mediator.subscribe(Events.ENABLE_FLIGHT_CONTROL, (data) => this.enableFlightControl(data));
		Mediator.subscribe(Events.DISABLE_FLIGHT_CONTROL, (data) => this.disableFlightControl(data));
	}

	//------------------------------------------------
	// Start rendering the collision models for all shapes
	//------------------------------------------------
	enableDebugMode() {
		this.debugMode = true;
		for (let i = 0, length = this.shapes.length; i < length; i++) {
			this.shapes[i].showCollisionModel();
		}
	}

	//------------------------------------------------
	// Stop rendering the collision models for all shapes
	//------------------------------------------------
	disableDebugMode() {
		this.debugMode = false;
		for (let i = 0, length = this.shapes.length; i < length; i++) {
			this.shapes[i].hideCollisionModel();
		}
	}

	//------------------------------------------------
	// Start rendering the collision lines and line angle
	//------------------------------------------------
	enableFlightControl(data) {
		this.flightControlEnabled = true;
	}

	//------------------------------------------------
	// Remove any currently rendered collision line data
	//------------------------------------------------
	disableFlightControl(data) {
		this.flightControlEnabled = false;
		if (this.flightControlShapes.length > 0) {
			for (let i = 0, length = this.flightControlShapes.length; i < length; i++) {
				this.DOMElement.removeChild(this.flightControlShapes[i]);
			}
			this.flightControlShapes = [];
		}
		if (this.flightControlCopy.length) {
			for (let i =0, length = this.flightControlCopy.length; i < length; i++) {
				document.body.removeChild(this.flightControlCopy[i]);
			}
			this.flightControlCopy = [];
		}
	}

	//------------------------------------------------
	// Stop updating shape positions
	//------------------------------------------------
	pause() {
		this.paused = true;
	}

	//------------------------------------------------
	// Resume updating shape positions
	//------------------------------------------------
	resume() {
		this.paused = false;
	}

	//------------------------------------------------
	// Create a random selection of shapes
	//------------------------------------------------
	createStartingShapes() {
		let color = "#00eac4";
		for (let i = 0, length = this.maxShapes; i < length; i++) {
			// Colour changing for testing purposes
			/*if (i === 0) {
				color = "#000000";
			} else {
				color = "#00eac4";
			}*/
			this.createNewShape(false, color);
		}
	}

	//------------------------------------------------
	// Create a new shape
	//------------------------------------------------
	createNewShape(triggerSound, color="#00eac4") {
		let randomNumber = Math.floor(Math.random() * this.shapeOptions.length);
		let shape = new this.shapeOptions[randomNumber](this.DOMElement, color, this.strokeWidth, this.scale, triggerSound);
		this.setRandomPosition(shape);
		let segmentWidth = 50;
		let segmentHeight = 50;
		let xPos = this.stage.x, yPos = this.stage.y;
		let shapeCreated = true;
		if (this.shapes.length >= this.maxShapes) {
			this.shapes[0].destroy();
			this.shapes.shift();
		}

		// Split the screen up into segments, and try placing the shape in each
		// until it isn't colliding with another shape
		while ((this.checkBoundingBoxes(shape) || this.checkScreenEdges(shape) || this.checkBackgroundLine(shape))) {
			shape.setPosition(xPos, yPos);
			xPos += segmentWidth;
			if (xPos > (this.stage.x + this.stage.width)) {
				xPos = this.stage.x;
				yPos += segmentHeight;
			}
			if (yPos > this.stage.y + ((this.stage.height/2) - 150)) {
				shapeCreated = false;
				break;
			}
		}
		if (shapeCreated) {
			this.shapes.push(shape);
			shape.addToStage();
			if (triggerSound && !this.debugMode) {
				let stagePosition = ((shape.getBoundingBox().x + (shape.getBoundingBox().width/2)) - this.stage.x) / this.stage.width;
				//shape.collide(stagePosition);
				shape.playCollisionSound(stagePosition);
			}
			if (this.debugMode) {
				shape.showCollisionModel();
			}
		} else {
			shape.destroy();
		}
	}

	//------------------------------------------------
	// Check if a shape is colliding with the main background lines
	//------------------------------------------------
	checkBackgroundLine(shape) {
		let result = this.checkLineCollisions(shape, this.backgroundLines);
		return result.collision;
	}

	//------------------------------------------------
	// Make sure a shape isn't outside it's target area
	//------------------------------------------------
	checkScreenEdges(shape) {
		var box = shape.getBoundingBox();
		if (box.x < this.stage.x || box.x + box.width > (this.stage.x + this.stage.width) || box.y < this.stage.y || box.y + box.height > (this.stage.y + this.stage.height)) {
			return true;
		} else {
			return false;
		}
	}

	//------------------------------------------------
	// Choose a random position on the screen
	//------------------------------------------------
	setRandomPosition(shape) {
		let x = this.stage.x + (100 + (Math.random() * (this.stage.width-200)));
		let y = 100 + (Math.random() * ((this.stage.height/2)-200));
		shape.setPosition(x, y);
	}

	//------------------------------------------------
	// Check a shape isn't overlapping another's box
	//------------------------------------------------
	checkBoundingBoxes(shape) {
		let collision = false;
		for (let i = 0, length = this.shapes.length; i < length; i++) {
			// Don't check for collisions with yourself
			if (this.shapes[i] !== shape) {
				if (this.checkBoundingBox(shape, this.shapes[i])) {
					collision = true;
					break;
				}
			}
		}
		return collision;
	}

	//------------------------------------------------
	// Compare the bounding boxes of two shapes
	//------------------------------------------------
	checkBoundingBox(shape1, shape2) {
		let collision = false;
		let shape1Box = shape1.getBoundingBox();
		let shape2Box = shape2.getBoundingBox();

		if (shape1Box.x < shape2Box.x + shape2Box.width &&
			shape1Box.x + shape1Box.width > shape2Box.x &&
			shape1Box.y < shape2Box.y + shape2Box.height &&
			shape1Box.height + shape1Box.y > shape2Box.y) {
			collision = true;
		}

		return collision;
	}

	//------------------------------------------------
	// A shape should flip it's xSpeed if it hits a 
	// steep enough slope, and should always be moving
	// upwards, since the lines are always at the bottom
	// of the screen
	//------------------------------------------------
	createBackgroundCollision(shape, result) {
		// Get away from the lines
		let shapePos = shape.getPosition();
		// Work out new speed and direction
		// We know line2 is the background's line because it's always the second argument to that method
		let bgLine = result.line2;
		// Get the slope of the background line the shape hit
		let slope = 0;
		if (bgLine.x2 === bgLine.x1) {
			slope = 1;
		} else if (bgLine.y2 !== bgLine.y1) {
			slope = (bgLine.y2 - bgLine.y1) / (bgLine.x2 - bgLine.x1);
		}
		if (slope > 0.4 && shape.xSpeed < 0) {
			shape.xSpeed *= -1;
		}
		if (slope < -0.4 && shape.xSpeed > 0) {
			shape.xSpeed *= -1;
		}

		// Shape should always move up as lines are below them at all times in impacts
		shape.ySpeed = -Math.abs(shape.ySpeed);
		if (Math.abs(shape.ySpeed) < 1) {
			var position = shape.getPosition();
			shape.setPosition(position.x, position.y - 2);
		}

		// Work out rotation
		shape.rotationSpeed *= -1;
		let stagePosition = ((shape.getBoundingBox().x + (shape.getBoundingBox().width/2)) - this.stage.x) / this.stage.width;
		shape.collide(stagePosition, true);
	}

	//------------------------------------------------
	// Move shapes, then check for collisions
	//------------------------------------------------
	updateSimulation() {
		if (!this.paused) {
			for (let i = 0, length = this.shapes.length; i < length; i++) {
				this.shapes[i].update();
			}

			let result = false;
			
			// Compare each shape to the sweeping background lines, and see if they hit it
			let bgCollisionModel = this.backgroundLines.getLineSegments();
			for (let i = 0, length = this.shapes.length; i < length; i++) {
				let shape = this.shapes[i];
				// BackgroundLines also has a getLineSegments method, so can also be fed in here directly
				result = this.checkLineCollisions(shape, this.backgroundLines);
				if (result.collision) {
					this.createBackgroundCollision(shape, result);
				}
			}

			// Compare each shape to the stage bounds
			for (let i = 0, length = this.shapes.length; i < length; i++) {
				let shape = this.shapes[i];
				let boundingBox = this.shapes[i].getBoundingBox();
				if (boundingBox.x < this.stage.x) {
					shape.xSpeed = Math.abs(shape.xSpeed);
					shape.rotationSpeed *= -1;
				} else if (boundingBox.x + boundingBox.width > (this.stage.x + this.stage.width)) {
					shape.xSpeed = -Math.abs(shape.xSpeed);
					shape.rotationSpeed *= -1;
				} else if (boundingBox.y < this.stage.y) {
					shape.ySpeed = Math.abs(shape.ySpeed);
					shape.rotationSpeed *= -1;
				} else if (boundingBox.y + boundingBox.height > (this.stage.y + this.stage.height)) {
					shape.ySpeed = -Math.abs(shape.ySpeed);
					shape.rotationSpeed *= -1;
				}
			}

			// Compare each shape to every other shape, and see if they collide
			for (let i = 0, length = this.shapes.length; i < length; i++) {
				for (let k = i+1, kLength = this.shapes.length; k < length; k++) {
					if (this.checkBoundingBox(this.shapes[i], this.shapes[k])) {
						// If bounding box is overlapping, do more complicated stuff
						result = this.checkLineCollisions(this.shapes[i], this.shapes[k], true);
						if (result.length > 0) {
							//if (this.shapes[i].colliders.indexOf(this.shapes[k]) < 0 || this.shapes[k].colliders.indexOf(this.shapes[i]) < 0) {
								result.shape1 = this.shapes[i];
								result.shape2 = this.shapes[k];

								this.createCollision(this.shapes[i], this.shapes[k], result);
								this.shapes[i].addCollider(this.shapes[k]);
								this.shapes[k].addCollider(this.shapes[i]);
							//}
						} else {
							this.shapes[i].removeCollider(this.shapes[k]);
							this.shapes[k].removeCollider(this.shapes[i]);
						}
						
					} else {
						this.shapes[i].removeCollider(this.shapes[k]);
						this.shapes[k].removeCollider(this.shapes[i]);
					}
				}
			}
		}

		this.requestFrameID = requestAnimationFrame(() => this.updateSimulation());
	}

	//------------------------------------------------
	// Check line segemnts between two shapes
	// @allMatches: Return an array of matching collisions
	// This is since a line on shape1 can cross more than one
	// line on shape2 at once (ie. a corner hit will match
	// two lines at once)
	//------------------------------------------------
	checkLineCollisions(shape1, shape2, allMatches) {
		let shape1Segments = shape1.getLineSegments();
		let shape2Segments = shape2.getLineSegments();
		let result = {
			line1Impact: 0,
			line2Impact: 0,
			collision: false
		};
		let collisions = [];
		for (let i = 0, length = shape1Segments.length; i < length; i++) {
			for (let k = 0, kLength = shape2Segments.length; k < kLength; k++) {
				result = this.testLines(shape1Segments[i], shape2Segments[k]);
				if (result.collision) {
					result.line1ID = i;
					result.line2ID = k;
					if (allMatches) {
						collisions.push(result);
					} else {
						return result;
					}
				}
			}
		}
		if (allMatches) {
			return collisions;
		} else {
			return result;
		}
	}

	//------------------------------------------------
	// Check if two lines overlap
	//------------------------------------------------
	testLines(line1, line2) {
		// This link helped a lot: https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection#Intersection_of_two_lines
		let denominator = (line1.x1 - line1.x2) * (line2.y1 - line2.y2) - (line1.y1 - line1.y2) * (line2.x1 - line2.x2);
		let slope1 = (line1.y2 - line1.y1) / (line1.x2 - line1.x1);
		let slope2 = (line2.y2 - line2.y1) / (line2.x2 - line2.x1);
		
		// How to find the actual co-ordinates where the contact took place (screen-relative)
		let numeratorX = ((line1.x1 * line1.y2) - (line1.y1 * line1.x2)) * (line2.x1 - line2.x2) - (line1.x1 - line1.x2) * ((line2.x1 * line2.y2) - (line2.y1 * line2.x2));
		let numeratorY = ((line1.x1 * line1.y2) - (line1.y1 * line1.x2)) * (line2.y1 - line2.y2) - (line1.y1 - line1.y2) * ((line2.x1 * line2.y2) - (line2.y1 * line2.x2));

		let pointX = numeratorX / denominator;
		let pointY = numeratorY / denominator;
		// If the denominator is 0, that means both lines are parallel
		// Return true, since we already know the bounding boxes are overlapping
		if (denominator === 0 || (slope1.toFixed(5) === slope2.toFixed(5))) {
			return {
				line1: line1,
				line2: line2,
				line1Impact: 0.5,
				line2Impact: 0.5,
				x: pointX,
				y: pointY,
				collision: false
			}
		}

		// First see how far along the connecting point is between the two lines
		// Between 0 and 1 means it's somewhere on the lines, otherwise it's further off the actual lines
		// https://en.wikipedia.org/wiki/B%C3%A9zier_curve#Linear_curves
		let bezierY = line1.y1 - line2.y1;
		let bezierX = line1.x1 - line2.x1;
		let numeratorLine2 = ((line2.x2 - line2.x1) * bezierY) - ((line2.y2 - line2.y1) * bezierX);
		let numeratorLine1 = ((line1.x2 - line1.x1) * bezierY) - ((line1.y2 - line1.y1) * bezierX);

		// This is how far along the lines the overlapping point is, from 0 to 1
		let bezierLine2 = numeratorLine2 / denominator;
		let bezierLine1 = numeratorLine1 / denominator;

		// If line1 is a segment, and line2 is infinite, they intersect if bezierLine2 is between 0 and 1
		if ((bezierLine2 > 0 && bezierLine2 < 1) && (bezierLine1 > 0 && bezierLine1 < 1)) {
			return {
				line1: line1,
				line2: line2,
				line1Angle: Math.atan2(line1.y2 - line1.y1, line1.x1 - line1.x2) * (180/Math.PI),
				line2Angle: Math.atan2(line2.y2 - line2.y1, line2.x1 - line2.x2) * (180/Math.PI),
				line1Impact: bezierLine2,
				line2Impact: bezierLine1,
				x: pointX,
				y: pointY,
				collision: true
			}
		}
		return {
			line1: line1,
			line2: line2,
			line1Impact: 0.5,
			line2Impact: 0.5,
			x: pointX,
			y: pointY,
			collision: false
		};
	}

	//------------------------------------------------
	// incomingShape = Shape with more than one collision
	// impactedShape = Shape with one collision
	// collisions = Array of collisions for the incomingShape
	//------------------------------------------------
	selectCollidingLine(incomingShape, impactedShape, collisions, angleName) {
		let collisionData = {};
		if (Math.abs(impactedShape.xSpeed) > Math.abs(impactedShape.ySpeed)) {
			if (impactedShape.xSpeed > 0 || (impactedShape.xSpeed < 0 && incomingShape.xSpeed < 0 && incomingShape.xSpeed < impactedShape.xSpeed)) {
				if (collisions[0].y > incomingShape.center.y) {
					collisionData = (collisions[0][angleName] > collisions[1][angleName]) ? collisions[0] : collisions[1];
				} else {
					collisionData = (collisions[0][angleName] < collisions[1][angleName]) ? collisions[0] : collisions[1];
				}
			} else {
				if (collisions[0].y > incomingShape.center.y) {
					collisionData = (collisions[0][angleName] < collisions[1][angleName]) ? collisions[0] : collisions[1];
				} else {
					collisionData = (collisions[0][angleName] > collisions[1][angleName]) ? collisions[0] : collisions[1];
				}
			}
		} else {
			if (impactedShape.ySpeed > 0 || (impactedShape.ySpeed < 0 && incomingShape.ySpeed < 0 && incomingShape.ySpeed < impactedShape.ySpeed)) {
				if (impactedShape.xSpeed > 0) {
					collisionData = (collisions[0][angleName] > collisions[1][angleName]) ? collisions[0] : collisions[1];
				} else {
					collisionData = (collisions[0][angleName] < collisions[1][angleName]) ? collisions[0] : collisions[1];
				}
			} else {
				if (impactedShape.xSpeed > 0) {
					collisionData = (collisions[0][angleName] < collisions[1][angleName]) ? collisions[0] : collisions[1];
				} else {
					collisionData = (collisions[0][angleName] > collisions[1][angleName]) ? collisions[0] : collisions[1];
				}
			}
		}
		return collisionData;
	}

	//------------------------------------------------
	// Get the point of collision on an impacted line,
	// and get where it was in the previous frame,
	// then work out the overall speed. This approach
	// factors in rotation when calculating overall speed
	//------------------------------------------------
	getCollisionSpeeds(shape, lineID, lineImpact) {
		let segmentData = shape.getLineSegments()[lineID];
		let previousSegmentData = shape.getPreviousLineSegments()[lineID];
		let prevPoint = {
			x: previousSegmentData.x1 + ((previousSegmentData.x2 - previousSegmentData.x1) * lineImpact),
			y: previousSegmentData.y1 + ((previousSegmentData.y2 - previousSegmentData.y1) * lineImpact)
		};
		let thisPoint = {
			x: segmentData.x1 + ((segmentData.x2 - segmentData.x1) * lineImpact),
			y: segmentData.y1 + ((segmentData.y2 - segmentData.y1) * lineImpact)
		};
		// Shape's point's position difference (AKA speed)
		let shapeXSpeed = thisPoint.x - prevPoint.x;
		let shapeYSpeed = thisPoint.y - prevPoint.y;
		return {
			x: shapeXSpeed,
			y: shapeYSpeed
		};
	}

	//------------------------------------------------
	// Move a shape back in the direction it came. This
	// is required immediately after a collision to make
	// sure the two shapes stop colliding
	//------------------------------------------------
	reverseShape(shape, collisionSpeeds) {
		let reverseX = 0;
		if (Math.abs(shape.xSpeed) > Math.abs(collisionSpeeds.x)) {
			reverseX = shape.xSpeed;
		} else {
			if (shape.xSpeed > 0) {
				reverseX = Math.abs(collisionSpeeds.x);
			} else {
				reverseX = -Math.abs(collisionSpeeds.x);
			}
		}
		let reverseY = 0;
		if (Math.abs(shape.ySpeed) > Math.abs(collisionSpeeds.y)) {
			reverseY = shape.ySpeed;
		} else {
			if (shape.ySpeed > 0) {
				reverseY = Math.abs(collisionSpeeds.y);
			} else {
				reverseY = -Math.abs(collisionSpeeds.y);
			}
		}
		let shapePosition = shape.getPosition();
		shape.setPosition(shapePosition.x + (reverseX*-3), shapePosition.y + (reverseY*-3));
	}

	//------------------------------------------------
	// Work out how the shape should turn after a collision
	// The further away the impact is from the center 
	// of mass, the stronger the resulting rotation
	//------------------------------------------------
	calculateNewRotation(shape, collisionData, collisionSpeeds, incomingSpeeds) {
		// Keep the angle between 0 - 180 degrees, as that's all we really need
		let lineAngle = collisionData.line2Angle;
		if (lineAngle < 0) {
			lineAngle = Math.abs(lineAngle);
		} else {
			lineAngle = (360 - lineAngle) - 180;
		}
		// Get distance between impact point and object's center of mass (origin)
		let distance = Math.sqrt((collisionData.x - shape.origin.x) * (collisionData.x - shape.origin.x) + (collisionData.y - shape.origin.y) * (collisionData.y - shape.origin.y));
		let rotationStrength = (distance / (shape.width)) * Settings.MAX_ROTATION;

		if (lineAngle < 60 || lineAngle > 145) {
			// Line is more horizontal
			if (incomingSpeeds.y < 0 || (incomingSpeeds.y > 0 && collisionSpeeds.y > 0)) {
				// Other shape was moving up
				if (collisionData.x > shape.center.x) {
					// Impact point is on the right of the shape
					shape.rotationSpeed = -rotationStrength
				} else {
					// Impact point is on the left of the shape
					shape.rotationSpeed = rotationStrength;
				}
			} else {
				// Other shape was moving down
				if (collisionData.x > shape.center.x) {
					// Impact point is on the right of the shape
					shape.rotationSpeed = rotationStrength;
				} else {
					// Impact point is on the left of the shape
					shape.rotationSpeed = -rotationStrength;
				}
			}
		} else {
			// Line is more vertical
			if (incomingSpeeds.x < 0 || (collisionSpeeds.x > 0 && incomingSpeeds.x > 0)) {
				// Other shape was moving left
				if (collisionData.y > shape.center.y) {
					// Impact point is below center of shape
					shape.rotationSpeed = rotationStrength;
				} else {
					// Impact point is above center of shape
					shape.rotationSpeed = -rotationStrength;
				}
			} else {
				// Other shape was moving right
				if (collisionData.y > shape.center.y) {
					// Impact point is below center of shape
					shape.rotationSpeed = -rotationStrength;
				} else {
					// Impact point is above center of shape
					shape.rotationSpeed = rotationStrength;
				}
			}
		}
	}

	//------------------------------------------------
	// Work out how each shape should respond to the collision
	//------------------------------------------------
	createCollision(shape1, shape2, collisionData) {
		let shape1LineIDs = [];
		let shape2LineIDs = [];
		let shape1Collisions = [];
		let shape2Collisions = [];
		// Loop through collisions and find number of collisions per shape
		for (let i = 0, length = collisionData.length; i < length; i++) {
			if (shape1LineIDs.indexOf(collisionData[i].line1ID) < 0) {
				shape1LineIDs.push(collisionData[i].line1ID);
				shape1Collisions.push(collisionData[i]);
			}
			if (shape2LineIDs.indexOf(collisionData[i].line2ID) < 0) {
				shape2LineIDs.push(collisionData[i].line2ID);
				shape2Collisions.push(collisionData[i]);
			}
		}

		if (shape1LineIDs.length === 1 && shape2LineIDs.length === 1) {
			// Only one line crossed, so use that directly
			collisionData = collisionData[0];
		} else {
			// Choose which line collision we care about
			if (shape1LineIDs.length > 1) {
				// 2 points of impact on shape 1
				collisionData = this.selectCollidingLine(shape1, shape2, shape1Collisions, "line1Angle");
			} else {
				// 2 points of impact on shape 2
				collisionData = this.selectCollidingLine(shape2, shape1, shape2Collisions, "line2Angle");
			}
		}

		let previousShape1XSpeed = shape1.xSpeed;
		let previousShape1YSpeed = shape1.ySpeed;
		let previousShape2XSpeed = shape2.xSpeed;
		let previousShape2YSpeed = shape2.ySpeed;

		// We need to work out the exact point of impact on each shape
		// and how far that point travelled in the previous frame
		// So first we calculate the point of impact in the current frame,
		// and that same point as it was in the previous frame
		// Shape 1's point:
		let shape1CollisionSpeeds = this.getCollisionSpeeds(shape1, collisionData.line1ID, collisionData.line1Impact);
		let shape2CollisionSpeeds = this.getCollisionSpeeds(shape2, collisionData.line2ID, collisionData.line2Impact);

		// Store the previous rotation value for each shape
		let previousShape1Rotation = shape1.rotationSpeed;
		let previousShape2Rotation = shape2.rotationSpeed;

		

		// Conservation of momentum, learned from the book Apress Foundation HTML5 Animation
		let speedTotal = shape1.xSpeed - shape2.xSpeed;
		let newXSpeed1 = (((shape1.mass - shape2.mass) * shape1.xSpeed + 2 * shape2.mass * shape2.xSpeed) / (shape1.mass + shape2.mass));
		let newXSpeed2 = (speedTotal + newXSpeed1);

		speedTotal = shape1.ySpeed - shape2.ySpeed;
		let newYSpeed1 = (((shape1.mass - shape2.mass) * shape1.ySpeed + 2 * shape2.mass * shape2.ySpeed) / (shape1.mass + shape2.mass));
		let newYSpeed2 = (speedTotal + newYSpeed1);

		// TODO: We need to add a portion of randomness to the resulting speeds
		// This is to avoid shapes repeatedly bouncing off each other back and forth
		
		
		// Make sure shapes don't continue moving into each other
		let shape1Position = shape1.getPosition();
		let shape2Position = shape2.getPosition();

		if (newYSpeed1 > 0 && newYSpeed2 > 0) {
			if (newYSpeed1 >= newYSpeed2 && shape1Position.y < shape2Position.y) {
				newYSpeed1 *= -1;
			} else if (newYSpeed2 >= newYSpeed1 && shape1Position.y > shape2Position.y) {
				newYSpeed2 *= -1;
			}
		} else if (newYSpeed1 < 0 && newYSpeed2 < 0) {
			if (newYSpeed1 <= newYSpeed2 && shape1Position.y > shape2Position.y) {
				newYSpeed1 *= -1;
			} else if (newYSpeed2 <= newYSpeed1 && shape2Position.y > shape1Position.y) {
				newYSpeed2 *= -1;
			}
		}
		if (newXSpeed1 > 0 && newXSpeed2 > 0) {
			if (newXSpeed1 >= newXSpeed2 && shape1Position.x < shape2Position.x) {
				newXSpeed1 *= -1;
			} else if (newXSpeed2 >= newXSpeed1 && shape2Position.x > shape1Position.x) {
				newXSpeed2 *= -1;
			}
		} else if (newXSpeed1 < 0 && newXSpeed2 < 0) {
			if (newXSpeed1 <= newXSpeed2 && shape1Position.x > shape2Position.x) {
				newXSpeed1 *= -1;
			} else if (newXSpeed2 <= newXSpeed1 && shape2Position.x > shape1Position.x) {
				newXSpeed2 *= -1;
			}
		}

		// Draw collision data (debug mode)
		if (this.flightControlEnabled) {
			let segmentData = shape1.getLineSegments()[collisionData.line1ID];
			let thisPoint = {
				x: segmentData.x1 + ((segmentData.x2 - segmentData.x1) * collisionData.line1Impact),
				y: segmentData.y1 + ((segmentData.y2 - segmentData.y1) * collisionData.line1Impact)
			};

			let tempShape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
			tempShape.setAttribute("fill", "#FF0066");
			tempShape.setAttribute("cx", thisPoint.x);
			tempShape.setAttribute("cy", thisPoint.y);
			tempShape.setAttribute("r", 5);
			this.DOMElement.appendChild(tempShape);
			this.flightControlShapes.push(tempShape);

			let lineAngle = collisionData.line1Angle;
			let color = "#0000ff";
			if (lineAngle < 0) {
				lineAngle = Math.abs(lineAngle);
			} else {
				color = "#ff0066";
				lineAngle = (360 - lineAngle) - 180;
			}

			let line = collisionData.line1;
			tempShape = document.createElementNS("http://www.w3.org/2000/svg", "line");
			tempShape.setAttribute("stroke-width", 2);
			tempShape.setAttribute("stroke", color);
			tempShape.setAttribute("fill", "transparent");
			tempShape.setAttribute("x1", line.x1);
			tempShape.setAttribute("x2", line.x2);
			tempShape.setAttribute("y1", line.y1);
			tempShape.setAttribute("y2", line.y2);
			this.DOMElement.appendChild(tempShape);
			this.flightControlShapes.push(tempShape);

			tempShape = document.createElement("p");
			tempShape.setAttribute("style", "position: absolute; color: " + color + "; top: " + (line.y1-20) + "px; left: " + (line.x1+20) + "px");
			tempShape.innerHTML = lineAngle;
			document.body.appendChild(tempShape);
			this.flightControlCopy.push(tempShape);
		}

		this.calculateNewRotation(shape1, collisionData, shape1CollisionSpeeds, shape2CollisionSpeeds);
		this.calculateNewRotation(shape2, collisionData, shape2CollisionSpeeds, shape1CollisionSpeeds);

		let angleIncrement1 = 0;
		let angleIncrement2 = 0;

		// Un-rotate by the biggest quantity
		if (Math.abs(previousShape1Rotation) > Math.abs(shape1.rotationSpeed)) {
			angleIncrement1 = (previousShape1Rotation*-3);
		} else {
			if (previousShape1Rotation > 0) {
				angleIncrement1 = (Math.abs(shape1.rotationSpeed)*-3);
			} else {
				angleIncrement1 = (Math.abs(shape1.rotationSpeed)*3);
			}
		}
		shape1.angle = shape1.angle + angleIncrement1;

		if (Math.abs(previousShape2Rotation) > Math.abs(shape2.rotationSpeed)) {
			angleIncrement2 = (previousShape2Rotation*-3);
		} else {
			if (previousShape2Rotation > 0) {
				angleIncrement2 = (Math.abs(shape2.rotationSpeed)*-3);
			} else {
				angleIncrement2 = (Math.abs(shape2.rotationSpeed)*3);
			}
		}
		shape2.angle = shape2.angle + angleIncrement2;

		// Reverse the shapes away from each other
		this.reverseShape(shape1, shape1CollisionSpeeds);
		this.reverseShape(shape2, shape2CollisionSpeeds);

		// Now switch to the new direction speeds
		shape1.xSpeed = newXSpeed1;
		shape1.ySpeed = newYSpeed1;
		shape2.xSpeed = newXSpeed2;
		shape2.ySpeed = newYSpeed2;

		let stagePosition = 0;
		if (Math.random() > 0.5) {
			stagePosition = ((shape1.getBoundingBox().x + (shape1.getBoundingBox().width/2)) - this.stage.x) / this.stage.width;
			shape1.collide(stagePosition);
		} else {
			stagePosition = ((shape2.getBoundingBox().x + (shape2.getBoundingBox().width/2)) - this.stage.x) / this.stage.width;
			shape2.collide(stagePosition);
		}

		let collisions = this.checkLineCollisions(shape1, shape2, true);
		if (collisions.length) {
			// Fail-safe: If the shapes are stuck together, just re-position one of them
			// somewhere on the screen
			// Should never get here, but better to be safe than sorry.
			// First try getting further away
			let attempts = 0;
			let startPos1 = shape1.getPosition();
			let startPos2 = shape2.getPosition();
			let attemptX = 0;
			let attemptY = 0;
			while (collisions.length && attempts < 50) {
				if (window.console) console.log("Shape adjusted 1");
				//shape1.angle = shape1.angle - (angleIncrement1*3);
				//shape2.angle = shape2.angle - (angleIncrement2*3);

				// Make sure the shapes are moving in different directions
				if ((previousShape1XSpeed > 0 && previousShape2XSpeed > 0) || (previousShape1XSpeed < 0 && previousShape2XSpeed < 0)) {
					attemptX = -previousShape1XSpeed;
				} else {
					attemptX = previousShape1XSpeed;
				}
				if ((previousShape1YSpeed > 0 && previousShape2YSpeed > 0) || (previousShape1YSpeed < 0 && previousShape2YSpeed < 0)) {
					attemptY = -previousShape1YSpeed;
				} else {
					attemptY = previousShape1YSpeed;
				}

				shape1.setPosition(shape1.getPosition().x - attemptX, shape1.getPosition().y - attemptY);
				shape2.setPosition(shape2.getPosition().x - previousShape2XSpeed, shape2.getPosition().y - previousShape2YSpeed);
				
				collisions = this.checkLineCollisions(shape1, shape2, true);
				attempts++;
			}
			
			// If that didn't work, reset and try the opposite direction
			if (collisions.length) {
				attempts = 0;
				shape1.setPosition(startPos1.x, startPos1.y);
				shape2.setPosition(startPos2.x, startPos2.y);
				while (collisions.length && attempts < 50) {
					if (window.console) console.log("Shape adjusted 2");

					shape1.setPosition(shape1.getPosition().x + attemptX, shape1.getPosition().y + attemptY);
					shape2.setPosition(shape2.getPosition().x + previousShape2XSpeed, shape2.getPosition().y + previousShape2YSpeed);
					
					collisions = this.checkLineCollisions(shape1, shape2, true);
					attempts++;
				}
			}
			// Still have a problem? Seriously? Fine, reposition the shape altogether
			if (collisions.length) {
				if (window.console) console.log("Shape adjusted 3");
				this.findNewPosition(shape1);
			}
		}
	}

	//------------------------------------------------
	// Change the size of all shapes in the system to
	// suit the size of the browser window
	//------------------------------------------------
	resize(stage, strokeWidth, scale) {
		let previousStage = this.stage;
		
		let scaleChangeX = (stage.width / this.stage.width);
		let scaleChangeY = stage.height / this.stage.height;

		this.stage = stage;
		for (let i = 0, length = this.shapes.length; i < length; i++) {
			let currentPos = this.shapes[i].getPosition();
			this.shapes[i].resize(strokeWidth, scale);

			let boundingBox = this.shapes[i].getBoundingBox();
			// Calculate the new X position based on the shape's current position, while factoring in the scale change
			let newX = stage.x + ((currentPos.x - previousStage.x) * scaleChangeX);
			if (newX > (stage.x + stage.width) - boundingBox.width) {
				newX = (stage.x + stage.width) - (boundingBox.width+40);
			}
			// Do the same for the Y position
			let newY = currentPos.y * scaleChangeY;
			if (currentPos.y + boundingBox.height + 40 > (stage.y + (stage.height/2))) {
				newY = (stage.height/2) - ((boundingBox.height/2) + 40);
			} else if (currentPos.y < stage.y) {
				newY = stage.y + ((boundingBox.height*scaleChangeY)/2);
			}
			// Gets the shape to update it's current position
			this.shapes[i].setPosition(newX, newY);
		}
		// Loop through the newly positioned shapes, and if this new position 
		// results in this shape overlapping another, find a new position for it
		for (let i = 0, length = this.shapes.length; i < length; i++) {
			let shape = this.shapes[i];
			this.findNewPosition(shape);
		}
		this.scale = scale;
		this.strokeWidth = strokeWidth;
	}

	//------------------------------------------------
	// Find an empty area to place the passed shape
	//------------------------------------------------
	findNewPosition(shape) {
		let newX = this.stage.x, newY = this.stage.y;
		while ((this.checkBoundingBoxes(shape) || this.checkScreenEdges(shape) || this.checkBackgroundLine(shape))) {
			shape.setPosition(newX, newY);
			newX += 50;
			if (newX > (this.stage.x + this.stage.width)) {
				newX = this.stage.x;
				newY += 50;
			}
			if (newY > this.stage.y + ((this.stage.height/2) - 150)) {
				break;
			}
		}
	}
}