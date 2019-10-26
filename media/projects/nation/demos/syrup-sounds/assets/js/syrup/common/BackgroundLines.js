////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
// Main Site Background Lines
////////////////////////////////////////////////////////////////////////////////

class BackgroundLines {

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	constructor(DOMElement, totalSections, strokeWidth) {
		// Variables
		this.DOMElement = DOMElement;
		this.totalSections = totalSections;
		this.currentScale = 1;
		this.lineData = [];
		this.lineStyles = ["straight", "curve"];
		this.lineElements = [];
		this.strokeWidth = strokeWidth;
		this.totalLines = 5;
		this.pathStrings = [];
		this.collisionPoints = [];
		this.lineSegments = [];
		this.collisionGuide = null;
		this.COLOR = "#00eac4";
		this.MIN_LINE_WIDTH = 400;
		this.guideLines = [];
		this.guideCircles = [];
		this.fadedLines = 0;
		this.collisionLineVisible = false;
		this.createLineElement();
		this.decideLineTypes();
		this.createCollisionGuide();
		this.draw();
		this.createListeners();
	}

	//------------------------------------------------
	// 
	//------------------------------------------------
	randomise() {
		// First remove old elements
		if (this.collisionLineVisible) {
			//this.DOMElement.removeChild(this.collisionGuide);
			//this.hideCollisionModel();
		} else {
			
		}
		// Then create new elements
		this.decideLineTypes();
		//this.createCollisionGuide();
		this.draw();
	}

	//------------------------------------------------
	// Listen for requests for the debug menu
	//------------------------------------------------
	createListeners() {
		Mediator.subscribe(Events.ENABLE_DEBUG_MODE, (data) => this.showCollisionModel(data));
		Mediator.subscribe(Events.DISABLE_DEBUG_MODE, (data) => this.hideCollisionModel(data));
	}

	//------------------------------------------------
	// Start rendering the collision model
	//------------------------------------------------
	showCollisionModel(data) {
		this.collisionLineVisible = true;
		this.DOMElement.appendChild(this.collisionGuide);
		for (let i = 0, length = this.lineElements.length; i < length; i++) {
			this.lineElements[i].setAttribute("stroke-opacity", 0);
		}
	}

	//------------------------------------------------
	// Stop rendering the collision model
	//------------------------------------------------
	hideCollisionModel(data) {
		this.collisionLineVisible = false;
		this.DOMElement.removeChild(this.collisionGuide);
		for (let i = 0, length = this.lineElements.length; i < length; i++) {
			this.lineElements[i].setAttribute("stroke-opacity", 1);
		}
	}

	//------------------------------------------------
	// Returns the collision data for the full background shape
	//------------------------------------------------
	getLineSegments() {
		return this.lineSegments;
	}

	//------------------------------------------------
	// Element that will show the collision data when required
	//------------------------------------------------
	createCollisionGuide() {
		this.collisionGuide = document.createElementNS("http://www.w3.org/2000/svg", "path");
		this.collisionGuide.setAttribute("fill", "transparent");
		this.collisionGuide.setAttribute("stroke", "#000");
		this.collisionGuide.setAttribute("stroke-width", 2);
	}

	//------------------------------------------------
	// This creates the element required for each of
	// the 5 lines, used in the draw() method
	//------------------------------------------------
	createLineElement() {
		let lineElement = null;
		for (let i = 0; i < this.totalLines; i++) {
			lineElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
			lineElement.setAttribute("fill", "transparent");
			lineElement.setAttribute("stroke", this.COLOR);
			lineElement.setAttribute("stroke-width", this.strokeWidth);

			this.DOMElement.appendChild(lineElement);
			this.lineElements.push(lineElement);
		}
	}

	//------------------------------------------------
	// This decides the types of line sections across
	// the whole site, but doesn't actually draw them
	// Use the draw() method for that
	//------------------------------------------------
	decideLineTypes() {
		this.calculateWidthOptions();
		this.calculateYPosOptions();
		let availableWidth = window.innerWidth;
		this.lineData = [];
		this.targetWidth = availableWidth * this.totalSections;
		let currentWidth = 0, line = {};
		let consecutiveStraights = 0;
		while (currentWidth < this.targetWidth) {
			line = {};
			let previousLine = this.lineData[this.lineData.length-1];
			// Decide on line properties
			line.type = this.lineStyles[Math.round(Math.random() * (this.lineStyles.length-1))];
			if (line.type === "curve") {
				// Curves should only follow straight lines or other curves
				if (previousLine && previousLine.type !== "curve" && consecutiveStraights <= 0) {
					line.type = "straight";
				}
			}
			line.widthOption = Math.round(Math.random() * (this.widthOptions.length-1));
			line.width =  this.widthOptions[line.widthOption];
			if (line.type === "curve" && line.width === availableWidth/3) {
				line.widthOption = 0;
				line.width = availableWidth/2;
			}

			line.x1 = (this.lineData.length === 0) ? 0 : this.lineData[this.lineData.length-1].x2;
			line.x2 = (this.lineData.length === 0) ? line.width : line.x1 + line.width;
			line.y1Option = (this.lineData.length === 0) ? Math.round(Math.random() * (this.yPositions.length-1)) : this.lineData[this.lineData.length-1].y2Option;
			line.y1 = this.yPositions[line.y1Option];
			if (previousLine && previousLine.type === "curve" && line.type === "straight") {
				// A straight must follow a curve, not a line at an angle
				line.y2Option = line.y1Option;
				line.y2 = this.yPositions[line.y2Option];
			} else if (consecutiveStraights >= 2) {
				// We need to force a different Y position, to prevent a constant straight line
				// First, build an array with positions other than the last one
				let differentYPositions = [];
				for (let i = 0; i < this.yPositions.length; i++) {
					if (this.yPositions[i] !== line.y1) {
						differentYPositions.push(this.yPositions[i]);
					}
				}
				// Then choose one from that new array
				line.y2Option = Math.round(Math.random() * (differentYPositions.length-1));
				line.y2 = differentYPositions[line.y2Option];
				// Reset the straight count
				consecutiveStraights = 0;
			} else {
				line.y2Option = Math.round(Math.random() * (this.yPositions.length-1));
				line.y2 = this.yPositions[line.y2Option];
			}
			if (line.type === "straight" && line.y1 === line.y2) {
				consecutiveStraights++;
			} else {
				consecutiveStraights = 0;
			}

			if (line.type === "curve" && line.y1 === line.y2) {
				let differentYPositions = [];
				for (let i = 0; i < this.yPositions.length; i++) {
					if (this.yPositions[i] !== line.y1) {
						differentYPositions.push(this.yPositions[i]);
					}
				}
				// Then choose one from that new array
				line.y2 = differentYPositions[Math.round(Math.random() * (differentYPositions.length-1))];
				// Figure out which option ID that is
				for (let i = 0; i < this.yPositions.length; i++) {
					if (this.yPositions[i] === line.y2) {
						line.y2Option = i;
					}
				}
			}
			// Add this line to the array and update the currently used width
			this.lineData.push(line);
			currentWidth += line.width;
		}
	}

	//------------------------------------------------
	// Updates the possible y co-ordinates for line
	// points based on the current browser height
	//------------------------------------------------
	calculateYPosOptions() {
		this.yPositions = [];
		// Work out y pos options based on current browser dimensions
		let windowHeight = window.innerHeight;
		this.yPositions.push(windowHeight);
		this.yPositions.push(windowHeight*0.75);
		this.yPositions.push(windowHeight*0.5);
	}

	//------------------------------------------------
	// Just creates an array of possible widths for lines
	// Note that it's expected that window.innerWidth/2
	// should be the first option, as curves default to
	// that one if the randomly chosen width was less than that
	//------------------------------------------------
	calculateWidthOptions() {
		let availableWidth = window.innerWidth;
		this.widthOptions = [
			availableWidth/2, 
			availableWidth/3,
			availableWidth/1.5
		];
	}

	//------------------------------------------------
	// Updates the line widths and y positions respective
	// to the current browser dimensions. Should be run
	// whenever the browser is resized, and the lines
	// should be redrawn afterwards
	//------------------------------------------------
	calculateLineCoordinates() {
		this.calculateWidthOptions();
		this.calculateYPosOptions();
		for (let i = 0, length = this.lineData.length; i < length; i++) {
			let line = this.lineData[i];
			line.width =  this.widthOptions[line.widthOption];
			let lineWidth = (line.width < this.MIN_LINE_WIDTH) ? window.innerWidth : line.width;
			line.x1 = (i === 0) ? 0 : this.lineData[i-1].x2;
			line.x2 = (i === 0) ?lineWidth : line.x1 + lineWidth;

			line.y1 = this.yPositions[line.y1Option];
			line.y2 = this.yPositions[line.y2Option];
		}
	}

	//------------------------------------------------
	// Works out where two lines overlap, or returns
	// false if they don't (or are parallel)
	// Formula taken from here: https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection#Given_two_points_on_each_line
	//------------------------------------------------
	getLineOverlap(line1, line2) {
		let denominator = (line1.x1 - line1.x2) * (line2.y1 - line2.y2) - (line1.y1 - line1.y2) * (line2.x1 - line2.x2);
		let slope1 = (line1.y2 - line1.y1) / (line1.x2 - line1.x1);
		let slope2 = (line2.y2 - line2.y1) / (line2.x2 - line2.x1);

		// If the deniminator is zero, of the slopes are the same, we've got parallel lines
		if (denominator === 0 || (slope1.toFixed(5) === slope2.toFixed(5))) {
			return false;
		}

		let bezierY = line1.y1 - line2.y1;
		let bezierX = line1.x1 - line2.x1;

		// How to find the actual co-ordinates where the contact took place (screen-relative)
		let numeratorX = ((line1.x1 * line1.y2) - (line1.y1 * line1.x2)) * (line2.x1 - line2.x2) - (line1.x1 - line1.x2) * ((line2.x1 * line2.y2) - (line2.y1 * line2.x2));
		let numeratorY = ((line1.x1 * line1.y2) - (line1.y1 * line1.x2)) * (line2.y1 - line2.y2) - (line1.y1 - line1.y2) * ((line2.x1 * line2.y2) - (line2.y1 * line2.x2));
		let numeratorLine2 = ((line2.x2 - line2.x1) * bezierY) - ((line2.y2 - line2.y1) * bezierX);
		let numeratorLine1 = ((line1.x2 - line1.x1) * bezierY) - ((line1.y2 - line1.y1) * bezierX);
		let bezierLine2 = (numeratorLine2 / denominator);
		let bezierLine1 = (numeratorLine1 / denominator);

		let pointX = numeratorX / denominator;
		let pointY = numeratorY / denominator;

		if ((bezierLine2 > 0 && bezierLine2 < 1) && (bezierLine1 > 0 && bezierLine1 < 1)) {
			return {
				x: pointX,
				y: pointY
			}
		} else {
			return false;
		}
	}

	//------------------------------------------------
	// Takes two points, and works out the y co-ordinate
	// on the line between them, given an x co-ordinate
	//------------------------------------------------
	getPointAtXpos(point1, point2, xPos) {
		let slope = (point2.y - point1.y) / (point2.x - point1.x);
		let yPos = point1.y + (xPos - point1.x) * slope;
		return {
			x: xPos,
			y: yPos
		}
	}

	//------------------------------------------------
	// Draws a line parallel to the passed lineData.
	// The new line will be a distance away from the
	// existing line by 'offset' pixels. The new line
	// can also be made longer by specifying an addedWidth.
	// This added width will be split into two and added
	// onto each end of the new line.
	// Example here: http://stackoverflow.com/questions/2825412/draw-a-parallel-line
	//------------------------------------------------
	getParallelLine(lineData, offset, addedWidth, color, thickness) {
		// Store start and end points in objects to pass to the getPointAtXPos function
		let point1 = {
			x: lineData.x1,
			y: lineData.y1
		};
		let point2 = {
			x: lineData.x2,
			y: lineData.y2
		};

		// Bump the desired x co-ordinates on the line
		let extendedX1 = (!addedWidth || addedWidth === 0) ? lineData.x1 : lineData.x1 - (addedWidth/2);
		let extendedX2 = (!addedWidth || addedWidth === 0) ? lineData.x2 : lineData.x2 + (addedWidth/2);
		// Get the y position required for the given X position
		let extendedPos1 = this.getPointAtXpos(point1, point2, extendedX1);
		let extendedPos2 = this.getPointAtXpos(point1, point2, extendedX2);

		let extendedPos = {
			x1: extendedPos1.x,
			y1: extendedPos1.y,
			x2: extendedPos2.x,
			y2: extendedPos2.y
		};

		let gap = (offset) ? offset : 0;

		let denominator = Math.sqrt((extendedPos.x1 - extendedPos.x2) * (extendedPos.x1 - extendedPos.x2) + (extendedPos.y1 - extendedPos.y2) * (extendedPos.y1 - extendedPos.y2));

		let line1X1 = extendedPos.x1 - gap * (extendedPos.y2 - extendedPos.y1) / denominator;
		let line1X2 = extendedPos.x2 - gap * (extendedPos.y2 - extendedPos.y1) / denominator;
		let line1Y1 = extendedPos.y1 - gap * (extendedPos.x1 - extendedPos.x2) / denominator;
		let line1Y2 = extendedPos.y2 - gap * (extendedPos.x1 - extendedPos.x2) / denominator;
	
		if (color) {
			this.createGuideLine(line1X1, line1Y1, line1X2, line1Y2, color, 2);
		}

		return {
			x1: line1X1,
			y1: line1Y1,
			x2: line1X2,
			y2: line1Y2
		};
	}

	//------------------------------------------------
	// This extends out a line beyond it's original
	// start and end points, but maintains the same angle
	// and position. We need to do this to ensure that
	// the two lines overlap, to work out where a line
	// should end
	//------------------------------------------------
	getExtendedLine(lineData, lineNumber, addedWidth, color) {
		let offset = lineNumber * (this.strokeWidth*2);
		return this.getParallelLine(lineData, offset, addedWidth, color);
	}

	//------------------------------------------------
	// Figures out the collision mode via the top line
	//------------------------------------------------
	getBoundingLine(lineData, color, thickness) {
		// We just need to take the top line, and move it up by half of the stroke width
		// So the offet will just be minus that
		let offset = -this.strokeWidth/2;
		return this.getParallelLine(lineData, offset, 100, color, thickness);
	}

	//------------------------------------------------
	// Uses the data established in decideLineTypes()
	// to draw the lines required
	//------------------------------------------------
	draw() {
		// Before doing anything, we need to re-calculate each line's co-ordinates
		this.calculateLineCoordinates();
		let lineData = null;
		let pathStrings = [];
		let lastXPos = [0, 0, 0, 0, 0];
		let lastYPos = [0, 0, 0, 0, 0];
		let lastExtendedLines = [];
		let firstExtendedLine = null;
		let parallel = false;
		this.collisionPoints = [];
		this.lineSegments = [];
		let previousPoint = {};
		let lastEndX = 0, lastEndY = 0;
		let startX = 0, startY = 0, endX = 0, endY = 0;

		for (let i = 0, length = this.lineData.length; i < length; i++) {
			parallel = false;
			// Calculate where the two lines meet
			// This result is the X2/Y2 for the current line
			lineData = this.lineData[i];
			let xPos = 0, yPos = 0;
			let lineOffset = this.strokeWidth;
			let secondCP = 0;
			let firstCP = 0;
			let firstYPos = 0;
			let chosenPointX = 0, chosenPointY = 0, chosenPointX2 = 0, chosenPointY2 = 0;

			for (let k = 0; k < this.totalLines; k++) {
				let line1 = this.getExtendedLine(lineData, k, 400);
				if (i === 0) {
					// Start the line by moving to the correct position
					lastXPos[k] = line1.x1;
					lastYPos[k] = line1.y1;
					if (!this.pathStrings[k]) {
						this.pathStrings.push( "M " + line1.x1 + " " + line1.y1);
					} else {
						this.pathStrings[k] = "M " + line1.x1 + " " + line1.y1;
					}
				}
				let line2 = null;
				let secondLineData = this.lineData[i+1];
				// Second line
				if (secondLineData) {
					line2 = this.getExtendedLine(secondLineData, k, 400);
				}

				// Find the overlap between the two lines if there is a next line
				if (secondLineData) {
					let overlap = this.getLineOverlap(line1, line2);
					if (!overlap) {
						// Lines were parallel
						parallel = true;
						xPos = line1.x2 - ((line1.x2 - line2.x1)/2);
						yPos = this.getPointAtXpos({x: line2.x1, y: line2.y1}, {x: line2.x2, y: line2.y2}, xPos).y;
					} else {
						// Use the overlap point as the x2/y2
						xPos = (overlap.x === 0) ? line2.x1 + ((line2.x1 - line1.x2)/2) : overlap.x;
						yPos = (overlap.y === 0) ? line1.y2 : overlap.y;
					}
				} else {
					// We're on the last line, so just use the points defined by the line 1 guide
					xPos = line1.x2;
					yPos = line1.y2;
				}
				
				let extendedLine = this.getExtendedLine(lineData, k, 0);

				if (lineData.type === "straight") {
					this.pathStrings[k] += " L " + xPos + " " + yPos;
				} else if (lineData.type === "curve") {
					let firstLine = (lastExtendedLines[k]) ? lastExtendedLines[k] : extendedLine;
					let secondLine = (secondLineData) ? this.getExtendedLine(secondLineData, k, 0) : extendedLine;

					let tempPoint = this.getPointAtXpos({x: firstLine.x1, y: firstLine.y1}, {x: firstLine.x2, y: firstLine.y2}, extendedLine.x1 + ((extendedLine.x2 - extendedLine.x1)/3));
					let tempPoint2 = this.getPointAtXpos({x: secondLine.x1, y: secondLine.y1}, {x: secondLine.x2, y: secondLine.y2}, extendedLine.x2 - (((extendedLine.x2 - extendedLine.x1)/3)));

					
					if (k === 0) {
						firstCP = tempPoint.y;
						secondCP = tempPoint2.y;
						firstYPos = yPos;
						if (secondLineData && lineData.type === "curve" && secondLineData.type === "curve") {
							secondCP = yPos;
						} else if (lineData.type === "curve" && !secondLineData) {
							secondCP = yPos;
						}
						if (this.lineData[i-1] && lineData.type === "curve" && this.lineData[i-1].type === "curve") {
							firstCP = lastYPos[0];
						}
					}

					chosenPointX = tempPoint.x;
					chosenPointX2 = tempPoint2.x;
					chosenPointY = 0;
					chosenPointY2 = 0;
					let newY = (firstCP + ((this.strokeWidth*2)*k));
					chosenPointY = newY;
					if (k === 0) this.pathStrings[k] += " C " + tempPoint.x + " " + chosenPointY;

					let newY2 = (secondCP + ((this.strokeWidth*2)*k));

					if (secondLineData && secondLineData.type === "curve" && lineData.type === "curve") {
						yPos = newY2;
					} else if (this.lineData[i].type === "curve") {
						newY2 = yPos;
					}

					chosenPointY2 = newY2;
					if (k === 0) this.pathStrings[k] += " " + tempPoint2.x + " " + chosenPointY2 + " " + xPos + " " + yPos;

					// It is mathematically impossible to create a bezier curve parallel to another,
					// so here we split the curves up into straight line segments, and then create
					// parallel lines of those. While this is a bit intense, it is only run once during
					// page load, and during resizes, so it should be ok.
					let point1 = {
						x: lastXPos[k],
						y: lastYPos[k]
					};
					let point2 = {
						x: xPos,
						y: yPos
					};
					let cp1 = {
						x: chosenPointX,
						y: chosenPointY
					};
					let cp2 = {
						x: chosenPointX2,
						y: chosenPointY2
					};

					let newPoint = 0;
					let totalPoints = 30; // Number of additional points along the curve (between start pos and end pos, not including them)
					for (let j = 1; j < totalPoints; j++) {
						let percentage = (1 / (totalPoints+1)) * j;
						newPoint = this.getPointOnBezierCurve(point1, cp1, cp2, point2, percentage);
						if (newPoint.x > xPos) {
							break;
						}
						if (k > 0) {
							this.pathStrings[k] += " L " + newPoint.x + " " + newPoint.y;
						}
						previousPoint = newPoint;
					}
					// End pos of the line
					if (k > 0) {
						this.pathStrings[k] += " L " + xPos + " " + yPos;
					}

					//this.createGuideCircle(chosenPointX, chosenPointY, "#0000FF");
					//this.createGuideCircle(chosenPointX2, chosenPointY2, "#0000FF");
				}
				//this.createGuideCircle(xPos, yPos, "#000");
				//this.createGuideCircle(lastXPos[k], lastYPos[k], "#000");


				// Add new points to the collision point array, but only for the top line (hence k=0)
				// We're doing this here because we need the control point positions for curves, which
				// are decided above
				if (k === 0) {
					
					let firstBoundingLine = this.getBoundingLine(lineData);
					if (i === 0) {
						startX = firstBoundingLine.x1;
						startY = firstBoundingLine.y1;
						this.collisionPoints.push({
							x: startX,
							y: startY
						});
						// Store 'previous point' as the first point here
						previousPoint = this.collisionPoints[0];
					} else {
						startX = lastEndX;
						startY = lastEndY;
					}
					
					if (secondLineData) {
						let secondBoundingLine = this.getBoundingLine(secondLineData);
						let overlap = this.getLineOverlap(firstBoundingLine, secondBoundingLine);
						if (!overlap) {
							// This means the lines were parallel
							let newPoint = this.getPointAtXpos({x: secondBoundingLine.x1, y: secondBoundingLine.y1}, {x: secondBoundingLine.x2, y: secondBoundingLine.y2}, firstBoundingLine.x2 - ((firstBoundingLine.x2 - secondBoundingLine.x1)/2));
							endX = newPoint.x;
							endY = newPoint.y;
						} else {
							endX = (overlap.x === 0) ? secondBoundingLine.x1 + ((secondBoundingLine.x1 - firstBoundingLine.x2)/2) : overlap.x;
							endY = (overlap.y === 0) ? firstBoundingLine.y2 : overlap.y;
						}
					} else {
						endX = firstBoundingLine.x2;
						endY = firstBoundingLine.y2;
					}
					lastEndX = endX;
					lastEndY = endY;

					if (lineData.type === "straight") {
						// Straights
						this.collisionPoints.push({
							x: endX,
							y: endY
						});
						this.lineSegments.push({
							x1: startX,
							y1: startY,
							x2: endX,
							y2: endY
						});
						previousPoint = {
							x: endX,
							y: endY
						};
					} else {
						// Curves
						// Work out some points along the line
						// We actually use the points that are in the center of the top line here
						// as these have already been calculated above. To nudge the bounding lines
						// to the top of the green line, we just subtract (this.strokeWidth/2) from
						// the resulting y co-ordinates
						let point1 = {
							x: lastXPos[0],
							y: lastYPos[0]
						};
						let point2 = {
							x: xPos,
							y: yPos
						};
						let cp1 = {
							x: chosenPointX,
							y: chosenPointY
						};
						let cp2 = {
							x: chosenPointX2,
							y: chosenPointY2
						};

						let newPoint = 0;
						
						let totalPoints = 9; // Number of additional points along the curve (between start pos and end pos, not including them)
						for (let j = 1; j < totalPoints; j++) {
							let percentage = (1 / (totalPoints+1)) * j;
							newPoint = this.getPointOnBezierCurve(point1, cp1, cp2, point2, percentage);
							// Subtract half the stroke width here, to nudge the bounding line up to the top
							// of the green line, rather than in the middle
							newPoint.y -= this.strokeWidth/2;
							this.collisionPoints.push(newPoint);
							this.lineSegments.push({
								x1: previousPoint.x,
								y1: previousPoint.y,
								x2: newPoint.x,
								y2: newPoint.y
							});
							previousPoint = newPoint;
						}
						// Add the last point
						this.collisionPoints.push({
							x: endX,
							y: endY
						});
						this.lineSegments.push({
							x1: previousPoint.x,
							y1: previousPoint.y,
							x2: endX,
							y2: endY
						});
					}
				}
				// End of collision point calculations
				lastXPos[k] = xPos;
				lastYPos[k] = yPos;
				lastExtendedLines[k] = extendedLine;
			}
		}
		for (let i = 0, length = this.totalLines; i < length; i++) {
			this.lineElements[i].setAttribute("d", this.pathStrings[i]);
		}

		this.drawCollisionBoundary();
	}

	//------------------------------------------------
	// Returns a point a percentage distance along a bezier curve
	// Helpfully explained further here:
	// http://stackoverflow.com/questions/14174252/how-to-find-out-y-coordinate-of-specific-point-in-bezier-curve-in-canvas
	//------------------------------------------------
	getPointOnBezierCurve(point1, cp1, cp2, point2, percentage) {
		// Work out the points on the triangle sitting within all 4 points
		// This also factors in the percentage for P1 and P3, as these points
		// need to be a percentage along the lines connecting point1 and cp1,
		// and cp2 and point2
		let p1X = ((1 - percentage) * point1.x) + (percentage * cp1.x);
		let p1Y = ((1 - percentage) * point1.y) + (percentage * cp1.y);
		let p2X = ((1 - percentage) * cp1.x) + (percentage * cp2.x);
		let p2Y = ((1 - percentage) * cp1.y) + (percentage * cp2.y);
		let p3X = ((1 - percentage) * cp2.x) + (percentage * point2.x);
		let p3Y = ((1 - percentage) * cp2.y) + (percentage * point2.y);
		// Now we find the points a percentage along the newly found lines
		// This is to figure out the point on the curve we need, as the curve
		// will intersect this new line at some point
		let lineX1 = ((1 - percentage) * p1X) + (percentage * p2X);
		let lineY1 = ((1 - percentage) * p1Y) + (percentage * p2Y);
		let lineX2 = ((1 - percentage) * p2X) + (percentage * p3X);
		let lineY2 = ((1 - percentage) * p2Y) + (percentage * p3Y);
		// Now with that line figured out we can calculate where it hits the curve
		return {
			x: ((1 - percentage) * lineX1) + (percentage * lineX2),
			y: ((1 - percentage) * lineY1) + (percentage * lineY2)
		}
	}

	//------------------------------------------------
	// Draws the collision model segments
	// This will only be rendered if debug mode is active
	//------------------------------------------------
	drawCollisionBoundary() {
		let path = "";
		for (let i = 0, length = this.collisionPoints.length; i < length; i++) {
			if (i === 0) {
				path = "M " + this.collisionPoints[i].x + " " + this.collisionPoints[i].y;
			} else {
				path += " L " + this.collisionPoints[i].x + " " + this.collisionPoints[i].y;
			}
		}
		this.collisionGuide.setAttribute("d", path);
	}

	//------------------------------------------------
	// Guides used for development to show curve control
	// points, among other things
	//------------------------------------------------
	createGuideCircle(x, y, color) {
		let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		circle.setAttribute("fill", color);
		circle.setAttribute("cx", x);
		circle.setAttribute("cy", y);
		circle.setAttribute("r", 10);
		this.guideCircles.push(circle);
		//this.DOMElement.appendChild(circle);
	} 

	//------------------------------------------------
	// Shows where actual lines were drawn at 2px width
	//------------------------------------------------
	createGuideLine(x1, y1, x2, y2, color, thickness) {
		// Create a test line
		if (!thickness) thickness = 2;
		let testLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
		testLine.setAttribute("stroke-width", thickness);
		testLine.setAttribute("fill", "transparent");
		testLine.setAttribute("stroke", color);
		testLine.setAttribute("x1", x1);
		testLine.setAttribute("x2", x2);
		testLine.setAttribute("y1", y1);
		testLine.setAttribute("y2", y2);
		this.guideLines.push(testLine);
		//this.DOMElement.appendChild(testLine);
	}

	//------------------------------------------------
	// Resize with new dimensions and line thickness
	//------------------------------------------------
	resize(strokeWidth, scale) {
		this.strokeWidth = strokeWidth;
		for (let i = 0, length = this.totalLines; i < length; i++) {
			this.lineElements[i].setAttribute("stroke-width", this.strokeWidth);
		}
		this.draw();
	}
}