//////////////////////////////////////////////////////////////////////////////
// Nation Library
// Animation
// Version 2.1.14
// Dependencies: NATION.Utils
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	if (typeof window.NATION === "undefined") window.NATION = {};

	//////////////////////////
	// Depenency Management
	//////////////////////////
	function checkDependencies() {
		var packageName = "NATION.Animation";
		var dependencies = {
			"NATION.Utils": NATION.Utils,
		};
		
		window.waitingDependencies = window.waitingDependencies || {};
		var dependenciesLoaded = true;
		for (var propName in dependencies) {
			if (!dependencies[propName]) {
				window.waitingDependencies[packageName] = {
					dependencies: dependencies,
					callback: function() {checkDependencies();}
				};
				dependenciesLoaded = false;
				break;
			}
		}

		if (dependenciesLoaded) {
			delete window.waitingDependencies[packageName];
			_initClass();
			// Check for any classes waiting on this one
			for (var className in window.waitingDependencies) {
				for (propName in window.waitingDependencies[className].dependencies) {
					if (propName === packageName) {
						// Re-run the waiting class' dependency check
						window.waitingDependencies[className].callback();
					}
				}
			}
		}
	}
	checkDependencies();

	//////////////////////////
	// Create Class
	//////////////////////////
	function _initClass() {
		////////////////////////////////////////////////////////////////////////////////////////
		// Animation
		////////////////////////////////////////////////////////////////////////////////////////

		/**
		* ### Dependencies:
		* [NATION.Utils](Utils.js.html)
		*
		* ### About:
		* Creates animations on one or more elements. This class is static and so doesn't need to be instantiated.
		*
		* Prioritises using CSS3 transitions for animations where possible, and falls back to JavaScript animation when the browser doesn't support CSS3, or the property being animated cannot be done with transitions.
		*
		* Can animate between a number of unit types, depending on the attribute being modified. Supported: px, %, vw, vh, em, rem, rad, grad, deg, turn
		*
		* Automatically adds prefixes to attribute names where needed.
		*
		* Cannot parse matrix transforms. If a matrix is found, this will essentially be reset to the identity matrix. However it can work with any non-matrix transform string defined inline.
		*
		* A demonstration of some of the features of this class can be seen here: [Animation-demo.js.html](Animation-demo.js.html)
		* @class Animation
		* @requires NATION.Utils
		*/
		var Animation = function() {
			// If true, all animations will use JS, regardless of options object
			this.prioritiseJS = false;
			this.transitionString = "";
			this.transitionEndString = "";
			this.checkCSSSupport();
			this.activeAnimations = [];
			this.animRequest = null;
			this.UNITLESS_VALUES = [
				"columnCount",
				"fillOpacity",
				"flexGrow",
				"flexShrink",
				"fontWeight",
				"lineHeight",
				"opacity",
				"order",
				"orphans",
				"widows",
				"zIndex",
				"zoom"
			];
			this.unitRegex = /%|px|#|rgba|rgb|hsla|hsl|pt|em|rem|vh|vw|vmin|vmax|ex|ch|cm|mm|q|in|pc|transparent/i;
			this.colorUnitRegex = /#|rgba|rgb|hsla|hsl|transparent/gi;
		}

		/**
		* Constants
		* @ignore
		*/
		Animation.prototype.DEFAULT_EASING = "linear";
		Animation.prototype.DEFAULT_DURATION = 1000;
		Animation.prototype.CSS3_SUPPORTED = false;

		/**
		* Start a new animation. This will automatically stop existing animations on the passed element, so Animation.stop() doesn't need to be called first.
		*
		* **Inbuilt easing function names**:
		* linear, easeInSine, easeOutSine, easeInOutSine, easeInQuad, easeOutQuad, easeInOutQuad, easeInCubic, easeOutCubic, easeInOutCubic, easeInQuart, easeOutQuart, easeInOutQuart, easeInQuint, easeOutQuint, easeInOutQuint, easeInExpo, easeOutExpo, easeInOutExpo, easeInCirc, easeOutCirc, easeInOutCirc
		* 
		* @param {domelement} element The element(s) to perform the animation on. Either a DOM element, NodeList, or a jQuery selection
		* @param {object} properties The style attributes to animate, with their respective target values
		* @param {object} options (optional) An object containing the settings for this animation<br />
		* <b>duration</b> <i>{number: 1000}</i> Time in milliseconds representing how long the animation should take
		* <b>easing</b> <i>{string: "linear"}</i> The easing function to use. Either the name of an inbuilt method, or a custom easing function defined CSS style, eg. "cubic-bezier(0.68, -0.55, 0.265, 1.55)"
		* <b>delay</b> <i>{number: 0}</i> Time in milliseconds to wait before the animation should start playing
		* <b>loop</b> <i>{boolean: false}</i> Loop the animation from start to end, then jump back to start and replay
		* <b>bounce</b> <i>{boolean: false}</i> Loop animation back and forth in both directions
		* <b>flipBounceEasing</b> <i>{boolean: false}</i> Reverse the easing function while on the return journey
		* <b>jsMode</b> <i>{boolean: false}</i> Have this animation performed by JavaScript, instead of a CSS3 transition
		* <b>progress</b> <i>{function: undefined}</i> A method to run on each frame of the animation. Passes two arguments to the method: an event object, and a progress percentage between 0 and 1
		* <b>loopComplete</b> <i>{function: undefined}</i> A method to run each time a looped animation has completed. This also fires on each end of a bounce animation.
		* @param {function} callback (optional) The method to run after the animation has completed. Passes an event object as an argument, so e.target refers to the DOM element that was animated
		* @jsFiddle //jsfiddle.net/NationStudio/v3sd4mfv/embedded/
		*
		*/
		Animation.prototype.start = function(element, properties, options, callback) {
			var tempObject, propName;
			// Clone the properties object in case it was a shared object
			if (properties) {
				tempObject = {};
				for (propName in properties) {
					tempObject[propName] = properties[propName];
				}
				properties = tempObject;
			}
			// If no options were specified, but a callback was
			if (typeof options === "function") {
				callback = options;
			}
			if (!options) {
				options = {};
			} else {
				// Clone the passed object to keep it unique to this animation
				tempObject = {};
				for (propName in options) {
					tempObject[propName] = options[propName];
				}
				options = tempObject;
			}
			// If we have both options and callback defined
			if (options && callback) {
				options.complete = callback;
			}
			options.easing = options.easing || this.DEFAULT_EASING;
			options.duration = options.duration || this.DEFAULT_DURATION;
			options.delay = options.delay || 0;
			if (options.forcejs || options.useJS) options.jsMode = true;
			if (!options.jsMode) {
				if (!this.CSS3_SUPPORTED || !this.cssAnimationOnPropertiesSupported(properties)) options.jsMode = true;
			}
			var newAnimation;
			var createdAnimations = [];
			var parsedPropeties = [];
			var staggeredDelay = 0;
			// If element has a length, it's a collection of elements, and each should be animated separately
			if (element.length) {
				// Check for jQuery objects before continuing
				var elementList = [];
				var i = 0, length = element.length;
				for (; i < length; i++) {
					elementList[i] = NATION.Utils.getDOMElement(element[i]);
				}
				i = 0;
				for (; i < length; i++) {
					this.stop(elementList[i]);
					// Prefix properties where needed
					parsedPropeties = this.preprocessProperties(elementList[i], properties);
					// If stagger is set, each animation should be that much after the previous one
					if (options.stagger) {
						staggeredDelay += options.stagger;
						options.delay = staggeredDelay;
					}
					newAnimation = new ActiveAnimation(elementList[i], parsedPropeties, options, callback);
					createdAnimations.push(newAnimation);
					this.activeAnimations.push(newAnimation);
				}
			} else {
				element = NATION.Utils.getDOMElement(element);
				this.stop(element);
				// Prefix properties where needed
				parsedPropeties = this.preprocessProperties(element, properties);
				newAnimation = new ActiveAnimation(element, parsedPropeties, options, callback);
				this.activeAnimations.push(newAnimation);
			}
			if (!this.animRequest) {
				this.animRequest = requestAnimationFrame(this.updateActiveAnimations.bind(this));	
			}

			// Animation objects will be returned in future if features like chaining are added
			//return (createdAnimations.length) ? createdAnimations : newAnimation;
		}

		/**
		* Stop all animations on an element
		* @param {domelement} element The element(s) to stop all active animations on. Either a DOM element, NodeList, or a jQuery selection
		*/
		Animation.prototype.stop = function(element) {
			if (element.length) {
				// Check for jQuery objects before continuing
				var elementList = [];
				var i = 0, length = element.length;
				for (; i < length; i++) {
					elementList[i] = NATION.Utils.getDOMElement(element[i]);
				}
				// Multiple elements need to be stopped
				i = 0;
				for (; i < length; i++) {
					this.removeAnimation(elementList[i]);
				}
			} else {
				element = NATION.Utils.getDOMElement(element);
				this.removeAnimation(element);
			}
		}

		/**
		* Pause all animations on an element
		* @param {domelement} element The element(s) with active animations that you wish to pause. Either a DOM element, NodeList, or a jQuery selection
		*/
		Animation.prototype.pause = function(element) {
			var i = 0, length = 0;
			if (element.length) {
				var elementList = [];
				length = element.length;
				for (; i < length; i++) {
					elementList[i] = NATION.Utils.getDOMElement(element[i]);
				}
				element = elementList;
			} else {
				element = NATION.Utils.getDOMElement(element);
			}
			i = 0;
			length = this.activeAnimations.length;
			for (; i < length; i++) {
				if ((element.length && this.inNodeList(this.activeAnimations[i].DOMElement, element)) || (this.activeAnimations[i].DOMElement === element)) {
					this.activeAnimations[i].pause();
				}
			}
		}

		/**
		* Resume animation on an element that has previously been paused
		* @param {domelement} element The element(s) with paused animations on that you wish to resume. Either a DOM element, NodeList, or a jQuery selection
		*/
		Animation.prototype.resume = function(element) {
			var i = 0, length = 0;
			if (element.length) {
				var elementList = [];
				length = element.length;
				for (; i < length; i++) {
					elementList[i] = NATION.Utils.getDOMElement(element[i]);
				}
				element = elementList;
			} else {
				element = NATION.Utils.getDOMElement(element);
			}
			i = 0;
			length = this.activeAnimations.length;
			for (; i < length; i++) {
				if ((element.length && this.inNodeList(this.activeAnimations[i].DOMElement, element)) || (this.activeAnimations[i].DOMElement === element)) {
					this.activeAnimations[i].resume();
				}
			}
		}

		/**
		* Set all animations to either animate with JavaScript or to use CSS animation where possible
		* @param {boolean} prioritiseJS Set to true to have all future animations run with JavaScript by default
		*/
		Animation.prototype.setJSMode = function(prioritiseJS) {
			this.prioritiseJS = prioritiseJS;
		}

		/**
		*
		* @ignore
		*/
		Animation.prototype.inNodeList = function(element, nodeList) {
			var i = 0, length = nodeList.length;
			for (; i < length; i++) {
				if (nodeList[i] === element) return true;
			}
			return false;
		}

		/**
		* 
		* @ignore
		*/
		Animation.prototype.ERROR_INVALID_TRANSFORM = "NATION.Animation: The value '{{value}}' supplied for '{{transform}}' is invalid.";

		/**
		*
		* @ignore
		*/
		Animation.prototype.removeAnimation = function(element) {
			var i = 0, length = this.activeAnimations.length;
			var remainingAnimations = [];
			for (; i < length; i++) {
				if (this.activeAnimations[i].DOMElement === element) {
					this.activeAnimations[i].stop();
				} else {
					remainingAnimations.push(this.activeAnimations[i]);
				}
			}
			this.activeAnimations = remainingAnimations;
		}

		/**
		* Check all properties can be animated with CSS3
		* @ignore
		*/
		Animation.prototype.cssAnimationOnPropertiesSupported = function(properties) {
			var property = null;
			for (property in properties) {
				if (property.search(/scroll/g) >= 0 || properties[property].toString().search("hsl") >= 0) {
					return false;
				}
			}
			return true;
		}

		/**
		* Check for CSS animation support
		* @ignore
		*/
		Animation.prototype.checkCSSSupport = function() {
			var testingElement = document.createElement("div");
			var prefixes = ["", "webkit", "moz", "o"], testString = "", i = 0, length = prefixes.length;
			for (; i < length; i++) {
				testString = (prefixes[i] === "") ? "transition" : prefixes[i] + "Transition";
				if (testString in testingElement.style) {
					this.transitionString = testString;
					if (prefixes[i] === "") {
						this.transitionEndString = "transitionend";
					} else if (prefixes[i] === "webkit") {
						this.transitionEndString = "webkitTransitionEnd";
					} else if (prefixes[i] === "o") {
						this.transitionEndString = "oTransitionEnd";
					}
					this.CSS3_SUPPORTED = true;
					return;
				}
			}
		}

		/**
		* 
		* @ignore
		*/
		Animation.prototype.preprocessProperties = function(element, properties) {
			properties = this.checkForPrefixes(properties);
			var currentTime = Date.now(), propName = "", startValue, targetValue, processed = {};
			var startValues = this.getCSSStartValues(element, properties);
			var colorValue = false;
			for (propName in properties) {
				var startUnit = "", targetUnit = "", parsedProperty;
				if (propName.search(/transform/i) >= 0 && propName.toLowerCase().search(/origin/i) < 0) {
					// Process the transform parts into usable objects
					var processedTransform = this.parseTransformValues(element, startValues[propName], properties[propName]);
					processed[propName] = {
						name: propName,
						start: processedTransform.startValue,
						end: processedTransform.targetValue,
						targetString: processedTransform.targetString,
						startString: processedTransform.startString,
						multiValue: false
					};
				} else {
					var multiValue = false;
					var startString = startValues[propName].toString().trim();
					var targetString = properties[propName].toString().trim();
					// Check for a multi-value attribute, excluding colour values (rgb has commas, for example)
					if (startString.search(this.colorUnitRegex) < 0 && (startString.search(" ") > 0 || startString.search(",") > 0 || targetString.search(" ") > 0 || targetString.search(",") > 0)) {
						// Attribute has multiple values, separated by commas
						multiValue = true;
						// Parse each value in the string
						startString = startString.replace(/, /g, ",");
						var valuesStart = startString.split(/,|\s/);
						targetString = targetString.replace(/, /g, ",");
						var valuesTarget = targetString.split(/,|\s/);
						var valueIndex = 0;
						// Make sure valuesStart has the same, or higher, number of values as valuesTarget
						if (valuesStart.length < valuesTarget.length) {
							var k = valuesStart.length, valueLength = valuesTarget.length;
							for (; k < valueLength; k++) {
								if (valueIndex > valuesStart.length-1) valueIndex = 0;
								valuesStart.push(valuesStart[valueIndex]);
								valueIndex++;
							}
						}
						// Make sure valuesTarget has the same number of values as valuesStart
						if (valuesTarget.length < valuesStart.length) {
							var k = valuesTarget.length, valueLength = valuesStart.length;
							for (; k < valueLength; k++) {
								if (valueIndex > valuesTarget.length-1) valueIndex = 0;
								valuesTarget.push(valuesTarget[valueIndex]);
								valueIndex++;
							}
						}

						var i = 0, length = valuesTarget.length, startVal, targetVal;
						var parsedStartVals = [];
						var parsedTargetVals = [];
						var parsedUnits = [];
						colorValue = [];
						// Build up start, target, and unit arrays
						for (; i < length; i++) {
							startVal = (valuesStart[0].search(/inherit|initial|unset/i) >= 0) ? 0 : valuesStart[i];
							targetVal = valuesTarget[i];
							parsedProperty = this.prepareProperty(element, propName, startVal, targetVal);
							parsedStartVals.push(parsedProperty.startValue);
							parsedTargetVals.push(parsedProperty.targetValue);
							parsedUnits.push(parsedProperty.targetUnit);
							var colorCheck = parsedProperty.targetUnit.match(this.colorUnitRegex);
							colorValue.push((colorCheck && colorCheck.length > 0));
						}
						// Store those arrays in the standard prop values (code will check for arrays later)
						startValues[propName] = parsedStartVals;
						properties[propName] = parsedTargetVals;
						targetUnit = parsedUnits;
					} else {
						// Parse an individual value
						parsedProperty = this.prepareProperty(element, propName, startValues[propName], properties[propName]);
						startValues[propName] = parsedProperty.startValue;
						properties[propName] = parsedProperty.targetValue;
						targetUnit = parsedProperty.targetUnit;
						colorValue = targetUnit.match(this.colorUnitRegex);
					}
					
					processed[propName] = {
						name: propName,
						start: startValues[propName],
						end: properties[propName],
						unit: targetUnit,
						color: colorValue,
						multiValue: multiValue,
						attribute: (propName.search(/scrollTop|scrollLeft/i) >= 0)
					};
				}
			}
			return processed;
		}

		/**
		*
		* @ignore
		*/
		Animation.prototype.prepareProperty = function(element, propName, startValue, targetValue) {
			if (startValue === "left" || startValue === "top") {
				startValue = 0;
			} else if (startValue === "right" || startValue === "bottom") {
				startValue = "100%";
			}
			if (targetValue === "left" || targetValue === "top") {
				targetValue = 0;
			} else if (targetValue === "right" || targetValue === "bottom") {
				targetValue = "100%";
			}
			// Get the start/target units for the property
			var startUnit = startValue.toString().match(this.unitRegex);
			if (startUnit) startUnit = startUnit[0];
			if (startUnit == null) startUnit = "";
			var targetUnit = targetValue.toString().match(this.unitRegex);
			if (targetUnit) targetUnit = targetUnit[0];
			if (targetUnit == null) targetUnit = "";
			// If target unit was blank, but start unit was px, target unit is px
			if (startUnit == "px" && !targetUnit) targetUnit = "px";
			var regex = new RegExp(startUnit + "| |\\(|\\)|%", "gi");
			if (startUnit !== "transparent") startValue = startValue.toString().replace(regex, "");
			regex = new RegExp(targetUnit + "| |\\(|\\)|%", "gi");
			if (targetUnit !== "transparent") targetValue = targetValue.toString().replace(regex, "");
			// Expand shorthand hexes
			if (startUnit === "#") {
				startValue = this.expandHex(startValue);
			}
			if (targetUnit === "#") {
				targetValue = this.expandHex(targetValue);
			}
			var relativeToParent = (propName.search(/transform/i) < 0);
			// If start and target units aren't identical, attempt to convert the startValue to match
			// Colours are always converted to RGBA, so we don't need to match up measurements for those
			if (!startUnit.match(this.colorUnitRegex) && !targetUnit.match(this.colorUnitRegex)) {
				if (startUnit !== targetUnit) {
					startValue = this.convertUnit(element, startValue, startUnit, targetUnit, propName, relativeToParent);
					startUnit = targetUnit;
				} else if (startUnit === "" && targetUnit === "") {
					// Check that this property is allowed to be unitless
					if (this.UNITLESS_VALUES.indexOf(propName) < 0) {
						// Revert to pixels if not
						startUnit = targetUnit = "px";
					}
				}
			}
			
			if (!startUnit.match(this.colorUnitRegex)) {
				startValue = parseFloat(startValue);
			} else {
				// Colours are automatically converted to RGBA, unless the target value is HSL or HSLA
				if (targetUnit.search(/hsla|hsl/g) > -1) {
					startValue = this.convertColorToHSLA(startValue, startUnit);//this.convertUnit(element, startValue, startUnit, targetUnit, propName, relativeToParent);
					startUnit = "hsla";
				} else {
					startValue = this.convertColorToRGBA(startValue, startUnit);
					startUnit = "rgba";
				}
			}
			if (!targetUnit.match(this.colorUnitRegex)) {
				targetValue = parseFloat(targetValue);
			} else {
				// Colours are automatically converted to RGBA, unless the target value is HSL or HSLA
				if (targetUnit.search(/hsla|hsl/g) > -1) {
					targetValue = this.convertColorToHSLA(targetValue, targetUnit);
					targetUnit = "hsla";
				} else {
					targetValue = this.convertColorToRGBA(targetValue, targetUnit);
					targetUnit = "rgba";
				}
			}
			return {
				startValue: startValue,
				targetValue: targetValue,
				startUnit: startUnit,
				targetUnit: targetUnit
			}
		}

		/**
		*
		* @ignore
		*/
		Animation.prototype.expandHex = function(hex) {
			if (hex.toString().length === 3) {
				hex = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, function(m, r, g, b) {
					return r + r + g + g + b + b;
				});
			}
			return hex;
		}

		/**
		*
		* @ignore
		*/
		Animation.prototype.transformContains = function(attributeName, transformData) {
			var i = 0, length = transformData.length;
			for (; i < length; i++) {
				if (transformData[i].attributeName === attributeName) return i;
			}
			return 0;
		}

		/**
		* Takes start and end transform values, converts them into a usable object format,
		* and ensures both have matching sets of attributes in the same order
		* @ignore
		*/
		Animation.prototype.parseTransformValues = function(element, startValue, targetValue) {
			var targetString = targetValue;
			if (startValue === "none") startValue = "";
			var startString = startValue;
			startValue = this.convertTransformString(startValue);
			targetValue = this.convertTransformString(targetValue);
			// Here we make sure that missing attributes are filled in and in the correct order, to ensure a smooth transition between transforms
			var i = 0;
			var length = (targetValue.length > startValue.length) ? targetValue.length : startValue.length;
			if (startValue.length === 1) {
				var matchIndex = this.transformContains(startValue[0].attributeName, targetValue);
				if (matchIndex) {
					var existingAttributeName = startValue[0].attributeName;
					// Target does contain this attribute
					for (; i < length; i++) {
						if (targetValue[i].attributeName !== existingAttributeName) {
							startValue.splice(i, 0, this.prepareAutoTransformValue(targetValue[i], true));
						}
					}
				}
			}
			i = 0;
			if (startValue.length !== targetValue.length) {
				for (; i < length; i++) {
					if (!startValue[i]) {
						startValue[i] = this.prepareAutoTransformValue(targetValue[i], true);
					} //else if (!targetValue[i]) {
						//targetValue[i] = this.prepareAutoTransformValue(startValue[i], true);
					//}
				}
			}
			i = 0;
			length = (targetValue.length > startValue.length) ? targetValue.length : startValue.length;
			// Insert missing start attributes into the target array, set to 0, to bring them back down during the animation
			var previousTargetValue = targetValue;
			for (; i < length; i++) {
				if (!previousTargetValue[i] || startValue[i].attributeName !== previousTargetValue[i].attributeName) {
					targetValue.splice(i, 0, this.prepareAutoTransformValue(startValue[i], true));
				}
			}
			// Make sure the lengths match, otherwise we need to add some 0 values to the end of targetValue
			if (targetValue.length > startValue.length) {
				// StartValue now needs some extra default values on the end to match targetValue
				i = startValue.length; length = targetValue.length;
				for (; i < length; i++) {
					startValue[i] = this.prepareAutoTransformValue(targetValue[i], true);
				}
			}
			// Compare units and perform conversion as required
			i = 0;
			length = targetValue.length;
			var converted = {};
			for (; i < length; i++) {
				if (startValue[i].multiValue) {
					// Convert each unit where needed
					var k = 0, valueLength = targetValue.length;
					for (; k < valueLength; k++) {
						var thisAttributeName = targetValue[i].attributeName;
						if (thisAttributeName === "translate" || thisAttributeName === "translate3d") {
							if (k === 1) {
								thisAttributeName = "translateY";
							}
						}
						if (!startValue[i].unit[k]) {
							// If there is no start unit, use the target unit
							converted = this.convertUnit(element, startValue[i].value[k], startValue[i].unit[k], targetValue[i].unit[k], targetValue[i].attributeName, false);
							startValue[i].unit[k] = targetValue[i].unit[k];
							startValue[i].value[k] = converted;
						} else {
							// Otherwise if we have no target unit, go the other way around
							converted = this.convertUnit(element, targetValue[i].value[k], targetValue[i].unit[k], startValue[i].unit[k], startValue[i].attributeName, false);
							targetValue[i].unit[k] = startValue[i].unit[k];
							targetValue[i].value[k] = converted;
						}
					}
				} else {
					if (startValue[i].unit !== targetValue[i].unit) {
						if (!startValue[i].unit) {
							// Convert the startValue unit to match the targetValue unit
							converted = this.convertUnit(element, startValue[i].value, startValue[i].unit, targetValue[i].unit, targetValue[i].attributeName, false);
							startValue[i].unit = targetValue[i].unit;
							startValue[i].value = converted;
						} else {
							// Otherwise if we have no target unit, go the other way around
							converted = this.convertUnit(element, targetValue[i].value, targetValue[i].unit, startValue[i].unit, startValue[i].attributeName, false);
							targetValue[i].unit = startValue[i].unit;
							targetValue[i].value = converted;
						}
					}
				}
			};
			return {
				startValue: startValue,
				targetValue: targetValue,
				targetString: targetString,
				startString: startString
			}
		}

		/**
		* Convert mis-matched units of measurement where possible
		* @ignore
		*/
		Animation.prototype.convertUnit = function(element, value, unit, targetUnit, attributeName, relativeToParent) {
			// No need to convert if value is just 0, so return immediately
			if (value == 0 || !value) return 0;
			var relevantDimension = 0;
			// We don't need a comparison dimension for colour animations
			if (attributeName.search(/color/i) < 0) {
				if (attributeName.search(/top|height|minHeight|maxHeight|translateY/g) >= 0) {
					if (relativeToParent) {
						relevantDimension = element.parentNode.clientHeight;
					} else {
						relevantDimension = element.clientHeight;
					}
				} else {
					if (relativeToParent) {
						relevantDimension = element.parentNode.clientWidth;
					} else {
						relevantDimension = element.clientWidth;
					}
				}
			}
			// Basic unit conversion for px, %, vw, and vh
			if (targetUnit === "%") {
				if (unit === "px") {
					value = (value / relevantDimension) * 100;
				} else if (unit === "vh") {
					value = ((window.innerHeight*value) / relevantDimension) * 100;
				} else if (unit === "vw") {
					value = ((window.innerWidth*value) / relevantDimension) * 100;
				}
			} else if (targetUnit === "px") {
				if (unit === "%") {
					value = (value/100) * relevantDimension;
				} else if (unit === "vh") {
					value = window.innerHeight * value;
				} else if (unit === "vw") {
					value = window.innerWidth * value;
				}
			} else if (targetUnit === "vw") {
				if (unit === "px") {
					value = value / window.innerWidth;
				} else if (unit === "%") {
					value = ((value/100) * relevantDimension) / window.innerWidth;
				}
			} else if (targetUnit === "vh") {
				if (unit === "px") {
					value = value / window.innerHeight;
				} else if (unit === "%") {
					value = ((value/100) * relevantDimension) / window.innerHeight;
				}
			}

			// Font size conversion
			if (targetUnit === "em") {
				if (unit === "px") {
					value = value / parseInt(getComputedStyle(element.parentNode, null)["fontSize"], 10);
				} else if (unit === "rem") {
					value = parseInt(getComputedStyle(element, null)[attributeName], 10) / parseInt(getComputedStyle(element.parentNode, null)["fontSize"], 10);
				}
			} else if (targetUnit === "rem") {
				if (unit === "px") {
					value = value / parseInt(getComputedStyle(document.body, null)["fontSize"], 10);
				} else if (unit === "em") {
					value = parseInt(getComputedStyle(element, null)[attributeName], 10) / parseInt(getComputedStyle(document.body, null)["fontSize"], 10)
				}
			}

			// Rotation unit conversion
			if (targetUnit === "rad") {
				if (unit === "deg") {
					value = value * (Math.PI/180);
				} else if (unit === "grad") {
					value = (value / 400) * (Math.PI*2);
				} else if (unit === "turn") {
					value = value * (Math.PI*2);
				}
			} else if (targetUnit === "deg") {
				if (unit === "rad") {
					value = value * (180/Math.PI);
				} else if (unit === "grad") {
					value = (value/400) * 360;
				} else if (unit === "turn") {
					value = value * 360;
				}
			} else if (targetUnit === "grad") {
				if (unit === "rad") {
					value = (value / (Math.PI*2)) * 400;
				} else if (unit === "deg") {
					value = (value/360) * 400;
				} else if (unit === "turn") {
					value = value * 400;
				}
			} else if (targetUnit === "turn") {
				if (unit === "rad") {
					value = (value / (Math.PI*2));
				} else if (unit === "grad") {
					value = value / 400;
				} else if (unit === "deg") {
					value = value / 360;
				}
			}
			return value;
		}

		/**
		*
		* @ignore
		*/
		Animation.prototype.hexToRGBA = function(hex) {
			// Expand shorthand hexes first
			var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
			hex = hex.replace(shorthandRegex, function(m, r, g, b) {
				return r + r + g + g + b + b;
			});
			// Convert to RGB values for each colour
			var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
			return parseInt(result[1], 16) + "," + 
				parseInt(result[2], 16) + "," + 
				parseInt(result[3], 16) + ",1";
		}

		/**
		*
		* @ignore
		*/
		Animation.prototype.rgbToRGBA = function(rgb) {
			rgb += ",1";
			return rgb;
		}

		/**
		* Forumla adapted from:
		* http://axonflux.com/handy-rgb-to-hsl-and-rgb-to-hsv-color-model-c
		* via http://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
		* @ignore
		*/
		Animation.prototype.hslToRGBA = function(hsl) {
			hsl = hsl.split(",");
			var h = hsl[0], s = hsl[1], l = hsl[2];
			// Convert to percentages between 0 and 1
			h = (h === 0) ? 0 : h/360;
			s = parseInt(s, 10) / 100;
			l = parseInt(l, 10) / 100;
			var r = 0, g = 0, b = 0;
			if (s === 0) {
				r = g = b = 1; // Achromatic
			} else {
				var q = (1 < 0.5) ? l * (1 + s) : l + s - l * s;
				var p = 2 * l - q;
				r = this.hueToRGB(p, q, h + 1/3);
				g = this.hueToRGB(p, q, h);
				b = this.hueToRGB(p, q, h - 1/3);
			}
			return Math.round(r*255) + "," + Math.round(g*255) + "," + Math.round(b*255) + "," + 1;
		}

		/**
		*
		* @ignore
		*/
		Animation.prototype.HSLToHSLA = function(hsl) {
			hsl += ",1";
			return hsl;
		}

		/**
		*
		* @ignore
		*/
		Animation.prototype.RGBAToHSLA = function(rgba) {
			var result = this.RGBToHSLA(rgba).split(",");
			result[3] = rgba.split(",")[3];
			return result.join(",");
		}

		/**
		*
		* @ignore
		*/
		Animation.prototype.RGBToHSLA = function(rgb) {
			rgb = rgb.split(",");
			var r = rgb[0] / 255;
			var g = rgb[1] / 255;
			var b = rgb[2] / 255;
			var max = Math.max(r, g, b), min = Math.min(r, g, b);
			var h, s, l = (max + min) / 2;
			if (max === min) {
				h = s = 0; // Achromatic
			} else {
				var d = max - min;
				s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
				if (max === r) {
					h = (g - b) / d + (g < b ? 6 : 0);
				} else if (max === g) {
					h = (b - r) / d + 2;
				} else if (max === b) {
					h = (r - g) / d + 4;
				}
				h /= 6;
			}
			h *= 360;
			s *= 100;
			l *= 100;
			return h + "," + s + "%," + l + "%,1";
		}

		/**
		*
		* @ignore
		*/
		Animation.prototype.hexToHSLA = function(hex) {
			hex = this.hexToRGBA(hex);
			hex = this.RGBAToHSLA(hex);
			return hex;
		}

		/**
		*
		* @ignore
		*/
		Animation.prototype.hueToRGB = function(p, q, t) {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1/6) return p + (q - p) * 6 * t;
			if (t < 1/2) return q;
			if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		}

		/**
		*
		* @ignore
		*/
		Animation.prototype.hslaToRGBA = function(hsla) {
			var hsl = hsla.split(",");
			hsl = hsl[0] + "," + hsl[1] + "," + hsl[2];
			hsl = this.hslToRGBA(hsl).split(",");
			hsl[3] = hsla.split(",")[3];
			return hsl[0] + "," + hsl[1] + "," + hsl[2] + "," + hsl[3];
		}

		/**
		* Generate a clone of a transform attribute object, 
		* and optionally set it back to it's default value
		* @ignore
		*/
		Animation.prototype.prepareAutoTransformValue = function(targetValue, reset) {
			var newValue = {
				attributeName: targetValue.attributeName,
				multiValue: targetValue.multiValue,
				unit: targetValue.unit,
				value: targetValue.value
			};
			if (reset) {
				var j = 0, valueLength = 0;
				var defaultValue = (newValue.attributeName.search("scale") >= 0) ? 1 : 0;
				if (newValue.multiValue) {
					j = 0;
					valueLength = newValue.value.length;
					newValue.value = [];
					for (; j < valueLength; j++) {
						newValue.value.push(defaultValue);
					}
				} else {
					newValue.value = defaultValue;
				}
			}
			return newValue;
		}

		/**
		* Break a transform string into it's component parts, with each part represented as an object
		* Each object contains the attribute name, it's value, it's unit of measurement, and whether
		* it has multiple values - eg. translate(20px, 20px) has two values, not just one.
		* @ignore
		*/
		Animation.prototype.convertTransformString = function(transform) {
			// Wipe out spaces around commas, so that we can split array on spaces safely
			transform = transform.trim().replace(/, | ,/g, ",").split(" ");
			var i = 0, length = transform.length, values = [], attributeName, unit, value, startIndex, multiValue = false;
			// If this is an empty transform string, return an empty array
			// Note that values is not an object, as objects don't maintain order
			if (transform.toString().replace(/\s/g, "") === "" || transform === "none") {
				return values;
			} else {
				// Otherwise, return an array with each transform value separated
				for (; i < length; i++) {
					transform[i] = transform[i].replace(/\s/g, "");
					startIndex = transform[i].indexOf("(");
					attributeName = transform[i].substr(0, startIndex);
					value = transform[i].substr(startIndex + 1, transform[i].indexOf(")") - (startIndex + 1));
					// Check if there is a coma-separated list of values for this transform attribute
					multiValue = value.indexOf(",") > -1;
					if (multiValue) {
						// This is a coma-separated list of values, eg. translate(23px,56px), so split them up into an array
						value = value.split(",");
						var j = 0, valueLength = value.length;
						unit = [];
						for (; j < valueLength; j++) {
							unit.push(value[j].replace(/\d+|-|\./g, "").toLowerCase());
							value[j] = parseFloat(value[j].replace(unit[j], ""));
						}
					} else {
						unit = value.replace(/\d+|-|\./g, "").toLowerCase();
						value = parseFloat(value.replace(unit, ""));
					}
					values.push({
						attributeName: attributeName,
						value: value,
						multiValue: multiValue,
						unit: unit
					});
				}
				return values;
			}
		}

		/**
		* 
		* @ignore
		*/
		Animation.prototype.getCSSStartValues = function(element, properties) {
			var startValues = {}, value, scrollAttribute;
			var computedStyles = getComputedStyle(element, null);
			for (var propName in properties) {
				scrollAttribute = false;
				if (propName.search(/scrollLeft|scrollTop/i) >= 0) {
					scrollAttribute = true;
					if (element === document.documentElement || element === document || element === window || element === document.body) {
						element = NATION.Utils.getPageElement();
					}
					value = element[propName];
				} else {
					value = computedStyles[propName];
					if (propName === "background" && properties[propName].search(" ")) {
						// Could just be a colour animation on bakground, check for that
						if (properties[propName].search(this.colorUnitRegex) >= 0) {
							value = computedStyles["backgroundColor"];
						}
					}
				}
				var computedStartUnit = value.toString().match(this.unitRegex);
				// match returns an array, so use the first result if one was found
				if (computedStartUnit) computedStartUnit = computedStartUnit[0];
				if (computedStartUnit == null) computedStartUnit = "";
				var targetUnit = properties[propName].toString().match(this.unitRegex);
				// match returns an array, so use the first result if one was found
				if (targetUnit) targetUnit = targetUnit[0];
				if (targetUnit == null) targetUnit = "";
				// If target unit was blank, but start unit was px, target unit is px
				if (computedStartUnit == "px" && !targetUnit) targetUnit = "px";
				if (element.style && element.style[propName]) {
					// If the style is set directly on the element, use that as the start value
					startValues[propName] = element.style[propName];
				} else if ((propName.search(/transform/i) < 0 || propName.search(/origin/i) >= 0) && (computedStartUnit == targetUnit)) {
					// If this isn't a transform, and the target value is either unitless or in pixels, just use the computedStyle
					if (scrollAttribute) {
						startValues[propName] = value;
					} else if (computedStartUnit) {
						startValues[propName] = computedStyles[propName];
					} else {
						startValues[propName] = parseFloat(computedStyles[propName]);
					}
				} else {
					if (propName.search(/transform/i) >= 0 && propName.search(/origin/i) < 0) {
						// Check if the computed value of the transform is just an identity matrix
						// If it is, consider the starting value blank and move on
						var isIdentity = this.isMatrixIdentity(computedStyles[propName]) || computedStyles[propName] === "none" || computedStyles[propName] === "";
						if (isIdentity) {
							startValues[propName] = "";
						} else {
							// Existing transform is not the identity matrix, but as matrix decomposition isn't accurate enough for animations,
							// we need to reset the transform to actually be the identity matrix
							element.style[propName] = "none";
							// TODO: Should we fire a warning here?
							startValues[propName] = "";
						}
					} else {
						// If we got here, this is a normal non-transform CSS value or scroll attribute, but start unit and target unit don't match
						startValues[propName] = value;
					}
				}
			}
			
			return startValues;
		}

		/**
		* Returns true if matrix is just the identity matrix
		* @ignore
		*/
		Animation.prototype.isMatrixIdentity = function(matrixString) {
			if (matrixString.search("matrix3d")) {
				return (matrixString === "matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)");
			} else {
				return (matrixString === "matrix(1,0,0,1,0,0)" || matrixString === "matrix(1,0,0,0,1,0,0,0,1)");
			}
		}

		/**
		*
		* @ignore
		*/
		Animation.prototype.checkForPrefixes = function(properties) {
			var processed = {}, propName, value;
			for (propName in properties) {
				value = properties[propName];
				propName = NATION.Utils.getPrefixedName(propName);
				processed[propName] = value;
			}
			return processed;
		}

		/**
		* Called by ActiveAnimations that are in the process of animating a transform string
		* Works out how that string should look at the passed progress value
		* @ignore
		*/
		Animation.prototype.calculateTransformProgress = function(transformData, progress) {
			var i = 0, length = transformData.end.length, newString = "", attributeUnit, attributeValue, attributeName, k = 0, valueLength = 0;
			for (; i < length; i++) {
				if (i !== 0) newString += " ";
				if (transformData.end[i].multiValue) {
					k = 0; valueLength = transformData.end[i].value.length;
					attributeName = transformData.end[i].attributeName;
					newString += attributeName + "(";
					for (; k < valueLength; k++) {
						attributeValue = transformData.start[i].value[k] + ((transformData.end[i].value[k] - transformData.start[i].value[k]) * progress);
						attributeUnit = transformData.end[i].unit[k];

						if (k !== 0) newString += ", ";
						newString += attributeValue + attributeUnit;
					}
					
					newString += ")";
				} else {
					attributeValue = transformData.start[i].value + ((transformData.end[i].value - transformData.start[i].value) * progress);
					attributeUnit = transformData.end[i].unit;
					attributeName = transformData.end[i].attributeName;
					newString += attributeName + "(" + attributeValue + attributeUnit + ")";
				}
			}
			return newString;
		}

		/**
		* Always convert to RGBA
		* @ignore
		*/
		Animation.prototype.calculateColorProgress = function(progress, start, end, unit) {
			// Convert to arrays for each processing
			start = start.toString().split(",");
			end = end.split(",");
			var i = 0, length = start.length;
			for (; i < length; i++) {
				start[i] = parseFloat(start[i]);
				end[i] = parseFloat(end[i]);
			}
			var alpha = (start[3] + (progress * ((end[3] - start[3]))));
			if (unit === "rgba") {
				return "rgba(" + 
					Math.round(start[0] + (progress * (end[0] - start[0])))  + "," + 
					Math.round(start[1] + (progress * (end[1] - start[1]))) + "," + 
					Math.round(start[2] + (progress * (end[2] - start[2]))) + "," + 
					alpha + ")";
			} else {
				return "hsla(" +
					Math.round(start[0] + (progress * (end[0] - start[0]))) + "," +
					Math.round(start[1] + (progress * (end[1] - start[1]))) + "%," + 
					Math.round(start[2] + (progress * (end[2] - start[2]))) + "%," + 
					alpha + ")";
			}
		}

		/**
		* Convert a color to RGBA format when required
		* @ignore
		*/
		Animation.prototype.convertColorToRGBA = function(color, unit) {
			if (color.toLowerCase() === "transparent") {
				color = "0,0,0,0";
			} else if (unit === "#") {
				color = this.hexToRGBA(color);
			} else if (unit === "rgb") {
				color = this.rgbToRGBA(color);
			} else if (unit == "hsl") {
				color = this.hslToRGBA(color);
			} else if (unit === "hsla") {
				color = this.hslaToRGBA(color);
			}
			return color;
		}

		/**
		*
		* @ignore
		*/
		Animation.prototype.convertColorToHSLA = function(color, unit) {
			if (color.toLowerCase() === "transparent") {
				color = "0,0,0,0";
			} else if (unit === "#") {
				color = this.hexToHSLA(color);
			} else if (unit === "rgb") {
				color = this.RGBToHSLA(color);
			} else if (unit === "rgba") {
				color = this.RGBAToHSLA(color);
			} else if (unit === "hsl") {
				color = this.HSLToHSLA(color);
			}
			return color;
		}

		/**
		* Cycle through each active animation and update it's progress
		* @ignore
		*/
		Animation.prototype.updateActiveAnimations = function() {
			var i = 0, incompleteAnimations = [];
			for (; i < this.activeAnimations.length; i++) {
				// User can potentially stop animations on a completed element after an update()
				// So here we make sure that an animation at this index still exists
				if (this.activeAnimations[i]) {
					this.activeAnimations[i].update();
					if (this.activeAnimations[i]) {
						if (!this.activeAnimations[i].complete) {
							incompleteAnimations.push(this.activeAnimations[i]);
						}
					}
				}
			}
			this.activeAnimations = incompleteAnimations;
			this.animRequest = requestAnimationFrame(this.updateActiveAnimations.bind(this));
		}

		////////////////////////////////////////////////////////////////////////////////////////
		// Easing Controls
		////////////////////////////////////////////////////////////////////////////////////////

		/**
		* CSS easing functions -> JavaScript easing functions system learned from:
		* GaÃ«tan Renaudeau & Firefox source code
		* http://greweb.me/2012/02/bezier-curve-based-easing-functions-from-concept-to-implementation/
		* @ignore
		*/
		var Easing = function() {
			/**
			* Inbuilt easing methods
			* @ignore
			*/
			this.EASING_METHODS = {
				"linear": {x1: 0.00, y1: 0.0, x2: 1.00, y2: 1.0},
				"easeInSine": {x1: 0.47, y1: 0.0, x2: 0.745, y2: 0.715},
				"easeOutSine": {x1: 0.39, y1: 0.575, x2: 0.565, y2: 1},
				"easeInOutSine": {x1: 0.445, y1: 0.05, x2: 0.55, y2: 0.95},
				"easeInQuad": {x1: 0.55, y1: 0.085, x2: 0.68, y2: 0.53},
				"easeOutQuad": {x1: 0.25, y1: 0.46, x2: 0.45, y2: 0.94},
				"easeInOutQuad": {x1: 0.455, y1: 0.03, x2: 0.515, y2: 0.955},
				"easeInCubic": {x1: 0.55, y1: 0.055, x2: 0.675, y2: 0.19},
				"easeOutCubic": {x1: 0.215, y1: 0.61, x2: 0.355, y2: 1},
				"easeInOutCubic": {x1: 0.645, y1: 0.045, x2: 0.355, y2: 1},
				"easeInQuart": {x1: 0.895, y1: 0.03, x2: 0.685, y2: 0.22},
				"easeOutQuart": {x1: 0.165, y1: 0.84, x2: 0.44, y2: 1},
				"easeInOutQuart": {x1: 0.77, y1: 0, x2: 0.175, y2: 1},
				"easeInQuint": {x1: 0.755, y1: 0.05, x2: 0.855, y2: 0.06},
				"easeOutQuint": {x1: 0.23, y1: 1, x2: 0.32, y2: 1},
				"easeInOutQuint": {x1: 0.86, y1: 0, x2: 0.07, y2: 1},
				"easeInExpo": {x1: 0.95, y1: 0.05, x2: 0.795, y2: 0.035},
				"easeOutExpo": {x1: 0.19, y1: 1, x2: 0.22, y2: 1},
				"easeInOutExpo": {x1: 1, y1: 0, x2: 0, y2: 1},
				"easeInCirc": {x1: 0.6, y1: 0.04, x2: 0.98, y2: 0.335},
				"easeOutCirc": {x1: 0.075, y1: 0.82, x2: 0.165, y2: 1},
				"easeInOutCirc": {x1: 0.785, y1: 0.135, x2: 0.15, y2: 0.86}
			};

			/**
			*
			* @ignore
			*/
			this.getEasingObject = function(easing) {
				var easingObject = {};
				if (easing.search("bezier") > -1) {
					easing = easing.replace("cubic-bezier(", "");
					easing = easing.replace(")", "");
					easing = easing.replace(/ /g, "");
					easing = easing.split(",");
					easingObject.x1 = parseFloat(easing[0]);
					easingObject.y1 = parseFloat(easing[1]);
					easingObject.x2 = parseFloat(easing[2]);
					easingObject.y2 = parseFloat(easing[3]);
				} else {
					easingObject = this.EASING_METHODS[easing];
				}
				return easingObject;
			}

			/**
			* http://stackoverflow.com/questions/23453721/opposite-of-ease-cubic-bezier-function
			* @ignore
			*/
			this.getFlippedEasingObject = function(easingObject) {
				var point1 = this.halfUnitTurn({x: easingObject.x1, y: easingObject.y1}, 1, 1);
				var point2 = this.halfUnitTurn({x: easingObject.x2, y: easingObject.y2}, 1, 1);
				return {
					x1: point1.x,
					y1: point1.y,
					x2: point2.x,
					y2: point2.y
				}
			}

			/**
			*
			* @ignore
			*/
			this.halfUnitTurn = function(point, maxX, maxY) {
				var tx = maxX/2, ty = maxY/2;
				return {
					x: tx - (point.x - tx),
					y: ty - (point.y - ty)
				}
			}

			/**
			* Returns the easing percentage towards end value
			* @ignore
			*/
			this.easeOnBezierCurve = function(easingObject, percentage) {
				// If ease is linear, the progress percentage is just returned straight away
				if (easingObject.x1 === easingObject.y1 && easingObject.x2 === easingObject.y2) return percentage;
				return this.calculateBezier(this.getPositionOnCurve(easingObject, percentage), easingObject.y1, easingObject.y2);
			}

			/**
			* Figure out position on the bezier curve
			* @ignore
			*/
			this.getPositionOnCurve = function(easingObject, percentage) {
				// Newton method of guessing the position through iterations
				var bezierGuess = percentage, i = 0, currentBezierSlope = 0, currentBezierX = 0;
				for (; i < 4; i++) {
					currentBezierSlope = this.getBezierSlope(bezierGuess, easingObject.x1, easingObject.x2);
					if (currentBezierSlope == 0.0) return bezierGuess;
					currentBezierX = this.calculateBezier(bezierGuess, easingObject.x1, easingObject.x2) - percentage;
					bezierGuess -= currentBezierX / currentBezierSlope;
				}
				return bezierGuess;
			}

			/**
			* 
			* @ignore
			*/
			this.calculateBezier = function(guess, start, end) {
				return ((this.calculateBezierPropA(start, end) * guess + this.calculateBezierPropB(start, end)) * guess + this.calculateBezierPropC(start)) * guess;
			}

			/**
			* 
			* @ignore
			*/
			this.getBezierSlope = function(guess, start, end) {
				return 3.0 * this.calculateBezierPropA(start, end) * guess * guess + 2.0 * this.calculateBezierPropB(start, end) * guess + this.calculateBezierPropC(start);
			}

			/**
			* Methods to process each argument of the bezier curve
			* @ignore
			*/
			this.calculateBezierPropA = function(start, end) {
				return 1.0 - 3.0 * end + 3.0 * start;
			}
			this.calculateBezierPropB = function(start, end) {
				return 3.0 * end - 6.0 * start;
			}
			this.calculateBezierPropC = function(start) {
				return 3.0 * start;
			}
		};
		Easing = new Easing();

		////////////////////////////////////////////////////////////////////////////////////////
		// Active Animation
		////////////////////////////////////////////////////////////////////////////////////////

		/**
		* Class that represents a running animation
		* @ignore
		*/
		var ActiveAnimation = function(element, properties, options, callback) {
			this.DOMElement = element;
			this.properties = properties;
			this.options = options;
			this.callback = callback;
			this.easingMethod = Easing.getEasingObject(options.easing);
			this.startTime = Date.now() + parseInt(this.options.delay, 10);
			this.endTime = this.startTime + options.duration;
			this.currentTime = this.startTime;
			this.progress = 0;
			this.reversing = false;
			this.complete = false;
			this.paused = false;
			this.remainingDelay = 0;
			var scope = this;
			if (!this.options.jsMode) {
				var scope = this;
				this.transitionCallback = function(e) {scope.onCycleComplete(e);};
			}
			if (this.options.bounce && this.options.flipBounceEasing) {
				this.normalEasingMethod = this.easingMethod;
				this.flippedEasingMethod = Easing.getFlippedEasingObject(this.easingMethod);
			}
			if (this.options.delay) {
				this.startDelayTimer();
			} else if (!this.options.jsMode) {
				this.startCSSAnimation(this.properties);
			}
		}

		/**
		* Wait for the time specified in options.delay before starting this animation
		* @ignore
		*/
		ActiveAnimation.prototype.startDelayTimer = function() {
			this.delayActive = true;
			var scope = this;
			this.delayTimer = setTimeout(function() {
				scope.delayActive = false;
				scope.remainingDelay = 0;
				if (!scope.options.jsMode) {
					scope.startCSSAnimation(scope.properties);
				}
			}, (this.remainingDelay > 0) ? this.remainingDelay : this.options.delay);
		}

		/**
		* Start the animation with CSS transitions
		* @ignore
		*/
		ActiveAnimation.prototype.startCSSAnimation = function(newTargetProperties, offset) {
			offset = offset || 0;
			var cssEasingString = "cubic-bezier(" + this.easingMethod.x1 + "," + this.easingMethod.y1 + "," + this.easingMethod.x2 + "," + this.easingMethod.y2 + ")";
			this.progress =  (-offset / this.options.duration);
			var newCSSProps = this.createCSSState(1);
			this.DOMElement.style[NATION.Animation.transitionString] = "all " + parseInt(this.options.duration, 10) + "ms " + cssEasingString + " " + parseInt(offset,10) + "ms";
			NATION.Utils.setStyle(this.DOMElement, newCSSProps);
		}

		/**
		* Create a state according to current animation progress
		* @ignore
		*/
		ActiveAnimation.prototype.createCSSState = function(progress) {
			var parsedCSSProperties = {};
			var newValue = 0;
			for (var propName in this.properties) {
				// Don't include scroll attributes in the CSS object
				if (!this.properties[propName].attribute) {
					if (propName.search(/transform/i) >= 0 && propName.search(/origin/i) < 0) {
						// Transform value, just assign the end string if progress = 1
						if (progress >= 1) {
							parsedCSSProperties[propName] = this.properties[propName].targetString;
						} else {
							newValue = NATION.Animation.calculateTransformProgress(this.properties[propName], progress);
							parsedCSSProperties[propName] = newValue;
						}
					} else if (this.properties[propName].multiValue) {
						// Multi-value
						var i = 0, length = this.properties[propName].end.length;
						newValue = "";
						for (; i < length; i++) {
							if (i > 0) newValue += " ";
							if (this.properties[propName].color[i]) {
								newValue += NATION.Animation.calculateColorProgress(progress, this.properties[propName].start[i], this.properties[propName].end[i], this.properties[propName].unit[i]);
							} else {
								var tempValue = (this.properties[propName].start[i] + (progress * (this.properties[propName].end[i] - this.properties[propName].start[i])));
								if (propName.search(/transform/i) >= 0 && propName.search(/origin/i) >= 0) {
									tempValue = Math.floor(tempValue);
								}
								newValue += tempValue + this.properties[propName].unit[i];
							}
							parsedCSSProperties[propName] = newValue;

						}
					} else if (this.properties[propName].color) {
						// Colour value, generate a standard rgba string
						newValue = NATION.Animation.calculateColorProgress(progress, this.properties[propName].start, this.properties[propName].end, this.properties[propName].unit);
						parsedCSSProperties[propName] = newValue;
					} else {
						// Normal value, so assign value + unit of measurement
						newValue = (this.properties[propName].start + (progress * (this.properties[propName].end - this.properties[propName].start))) + this.properties[propName].unit;
						parsedCSSProperties[propName] = newValue;
					}
				}
			}
			return parsedCSSProperties;
		}

		/**
		*
		* @ignore
		*/
		ActiveAnimation.prototype.updateElementAttributes = function(progress) {
			var newValue;
			for (var propName in this.properties) {
				if (this.properties[propName].attribute) {
					newValue = (this.properties[propName].start + (progress * (this.properties[propName].end - this.properties[propName].start)));
					this.DOMElement[propName] = newValue;
				}
			}
		}

		/**
		* Update animation
		* @ignore
		*/
		ActiveAnimation.prototype.update = function() {
			if (!this.delayActive && !this.paused) {
				this.currentTime = Date.now();
				this.progress = (this.currentTime - this.startTime) / (this.endTime - this.startTime);
				var easedProgress = 0;
				easedProgress = Easing.easeOnBezierCurve(this.easingMethod, (this.progress > 1) ? 1 : this.progress);
				if (this.options.jsMode) {
					// Calculate new values for each CSS attribute
					var newState = this.createCSSState(easedProgress);
					NATION.Utils.setStyle(this.DOMElement, newState);
					// Calculate new values for scroll attributes
					this.updateElementAttributes(easedProgress);
				}
				// Run the progress callback and hand it the current progress
				// Also pass the eased progress value, enabling other hand-coded animations
				// to work at the same time, if the user desires to do that.
				if (this.options.progress) {
					this.options.progress({
						target: this.DOMElement,
						currentTarget: this.DOMElement,
						cancelable: false,
						defaultPrevented: false,
						eventPhase: 2,
						timestamp: this.currentTime,
						isTrusted: false
					},
					this.progress > 1 ? 1 : this.progress,
					easedProgress);
				}
				if (this.progress >= 1) {
					this.onCycleComplete();
				} else {
					this.complete = false;
				}
				if (this.complete && (this.options.loop || this.options.bounce)) {
					this.complete = false;
					this.progress = 0;
				}

				if (this.complete) {
					this.stop();
					this.onAnimationComplete();
				}	
			}
		}

		/**
		* Stop this animation and mark it for removal
		* @ignore
		*/
		ActiveAnimation.prototype.stop = function() {
			// Clear the delay timer, if it's running
			if (this.delayTimer) {
				clearTimeout(this.delayTimer);
				this.delayTimer = null;
			}
			// If using CSS animation, set each property to it's current progess value
			if (!this.options.jsMode && this.progress < 1) {
				var easedProgress = Easing.easeOnBezierCurve(this.easingMethod, (this.progress > 1) ? 1 : this.progress);
				var newState = this.createCSSState(easedProgress);
				NATION.Utils.setStyle(this.DOMElement, newState);
			}
			if (!this.options.jsMode) {
				this.DOMElement.style.removeProperty(NATION.Animation.transitionString);
			}
			// Mark this animation for removal
			this.complete = true;
		}

		/**
		* Freeze the animation in it's current state, and wait for resume to be called
		* @ignore
		*/
		ActiveAnimation.prototype.pause = function() {
			this.paused = true;
			// Handle animations that are still on a delay timer
			if (this.delayTimer) {
				clearTimeout(this.delayTimer);
				this.delayTimer = null;
				var currentTime = Date.now();
				var elapsed = currentTime - this.startTime;
				this.remainingDelay = this.options.delay - elapsed;
			}
			if (!this.options.jsMode && this.progress > 0) {
				this.DOMElement.style.removeProperty(NATION.Animation.transitionString);
				var easedProgress = Easing.easeOnBezierCurve(this.easingMethod, (this.progress > 1) ? 1 : this.progress);
				NATION.Utils.setStyle(this.DOMElement, this.createCSSState(easedProgress));
			}
		}

		/**
		* Resume the animation from where it was last paused
		* @ignore
		*/
		ActiveAnimation.prototype.resume = function() {
			this.paused = false;
			if (this.delayActive) {
				this.startDelayTimer();
			} else {
				// Update the start and end time to resume correctly
				this.currentTime = Date.now();
				this.startTime = this.currentTime - (this.options.duration * this.progress);
				this.endTime = this.startTime + this.options.duration;
				if (!this.options.jsMode) {
					var newCSSProps = this.createCSSState(0);
					NATION.Utils.setStyle(this.DOMElement, newCSSProps);
					var easedProgress = Easing.easeOnBezierCurve(this.easingMethod, (this.progress > 1) ? 1 : this.progress);
					this.startCSSAnimation(this.properties, -(this.progress * this.options.duration));
				}

				// NOTE: To resume a CSS transition, we need to create a temporary duration for this cycle
				// This cycle will also need it's transition to have a delay of a negative number, in order
				// to have the easing function start part way through.
				// SEE: http://tympanus.net/codrops/css_reference/transition-delay/
				// If the value for transition-delay is a negative time offset then the transition will execute 
				// the moment the property is changed, but will appear to have begun execution at the specified 
				// offset. That is, the transition will appear to begin part-way through its play cycle.
			}
		}

		/**
		* The animation has completed, so check for any form of looping
		* If no looping is required, run the onComplete method
		* @ignore
		*/
		ActiveAnimation.prototype.onCycleComplete = function(e) {
			this.currentTime = Date.now();
			if (this.options.loop || this.options.bounce) {
				if (this.options.jsMode) {
					this.complete = true;
				}
				// Account for browser jank and/or tab switching - progress could be a large number
				// if window focus has been lost, so we need to factor out multiples of 1 before calculating
				// the new start time
				var elapsed = (this.progress < 1) ? 0 : this.progress % 1;
				this.startTime = this.currentTime - (elapsed * this.options.duration);
				this.endTime = this.startTime + this.options.duration;
				var offset = -(elapsed * this.options.duration);
				if (this.options.bounce) {
					// Only flip directions if progress is an odd number
					var newValue = "";
					if (this.progress % 2 >= 1 || (this.progress < 1 && !this.options.jsMode)) {
						for (var propName in this.properties) {
							newValue = this.properties[propName].start;
							this.properties[propName].start = this.properties[propName].end;
							this.properties[propName].end = newValue;
							newValue = this.properties[propName].targetString;
							if (propName.search(/transform/i) >= 0 && propName.search(/origin/i) < 0) {
								this.properties[propName].targetString = this.properties[propName].startString;
								this.properties[propName].startString = newValue;
							}
						}
						if (this.options.flipBounceEasing) {
							this.reversing = !this.reversing;
							this.easingMethod = this.reversing ? this.flippedEasingMethod : this.normalEasingMethod;
						}
					}

					if (!this.options.jsMode) {
						this.complete = false;
						this.DOMElement.style[NATION.Animation.transitionString] = "";
						NATION.Utils.setStyle(this.DOMElement, this.createCSSState(elapsed));
						this.DOMElement.offsetHeight;
						this.startCSSAnimation(this.properties, offset);
					}
				} else if (!this.options.jsMode) {
					this.DOMElement.style[NATION.Animation.transitionString] = "";
					NATION.Utils.setStyle(this.DOMElement, this.createCSSState(0));
					this.DOMElement.offsetHeight;
					if (!this.options.jsMode) {
						this.complete = false;
						this.startCSSAnimation(this.properties, offset);
					}
				}
				this.progress = 0;
				if (this.options.loopComplete) {
					this.options.loopComplete({
						target: this.DOMElement,
						currentTarget: this.DOMElement,
						cancelable: false,
						defaultPrevented: false,
						eventPhase: 2,
						timestamp: this.currentTime,
						isTrusted: false
					});
				}
			} else {
				this.complete = true;
			}
			if (e && e.preventDefault) e.preventDefault();
		}

		/**
		* Run the callback method if one was defined in the options object
		* @ignore
		*/
		ActiveAnimation.prototype.onAnimationComplete = function(e) {
			if (this.options.complete) {
				this.options.complete({
					target: this.DOMElement,
					currentTarget: this.DOMElement,
					cancelable: false,
					defaultPrevented: false,
					eventPhase: 2,
					timestamp: this.currentTime,
					isTrusted: false
				});
			}
		}


		window.NATION.Animation = new Animation();
	}
}(window, document, undefined));