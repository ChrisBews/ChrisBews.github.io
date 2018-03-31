////////////////////////////////////////////////////////////////////////////////
// Nation Library
// Barebones animation for when a full library is not already in the project
// Uses CSS3 animation where available
// Animates values in pixels, percentages, colours, and unitless values (eg. opacity)
////////////////////////////////////////////////////////////////////////////////
var NATION = NATION || {};

/**
 * ### Dependencies:
 * [NATION.Utils](Utils.js.html)
 *
 * ### About:
 * Creates animations on elements. This class does not need instantiating.
 * 
 * Animates values in pixels, percentages, colours, and unitless values (eg. opacity). Now also animates CSS transforms. See below for details
 * 
 * CSS3 animation is prioritised, but if the browser lacks support for them, JavaScript animation is used instead.
 * 
 * If the passed DOM element does not have a starting value for a property (eg. width is not set), you're going to have a bad time.
 * 
 * ### Auto-prefixing
 * You can now specify a CSS property, and it will be automatically prefixed for you. This will also work in reverse, meaning you can pass in '-webkit-transition' and this will still work in Firefox etc.
 * 
 * ### Animating CSS Transforms:
 * This class can animate complex CSS transforms, but there is a restriction to it's use. If you want to animate a transform from a starting position other than 'no transform' or a matrix, you must set the style in your JavaScript before animating. Due to the nature of CSS, JavaScript cannot dynamically get the original transform setting from your CSS file (it is only ever recognised as a matrix in the browser, rather than separate values for rotate, translate etc). So in these cases, before starting an animation, always set the style first, eg. NATION.Utils.setStyle(element, {transform: "rotate(90deg)"}) or $(element).css({transform: "rotate(90deg)"}), or element.style.transform = "rotate(90deg)";
 *
 * With that in mind, you can now use this class to animate transforms, such as the following:
 * <ul>
 * <li>transform: "translateY(50px)"</li>
 * <li>transform: "rotate(99deg) translateY(50px)"</li>
 * <li>transform: "translate3d(50px, 400%, 200px) rotate(90deg)"</li>
 * <li>transform: "rotate(90deg) matrix(1, -0.2, 0, 1, 0, 0)"</li>
 * </ul>
 * @class Animation
 * @requires NATION.Utils
 */
NATION.Animation = (function() {
	"use strict";
	
	var _public = {};

	/**
	* Start a new animation on an element.
	* 
	* Note that this will automatically stop all current animation on the passed element, you don't need to call stop() beforehand.
	* 
	* **Example:**
	*
		// Element that will be animated
		var myElement = document.querySelector(".my-element");
		// Set up a function to call on completion
		var myCallback = function(e) {
			// e.target contains the DOM element that was animated
		}
		// Properties that will be animated
		var properties = {
	 		left: 100,
	 		width: "50%"
	 	}

	 	var options = {
	 		duration: 400,
	 		easing: "easeInOutQuad"
	 	};
	 	// Start the animation
	 	NATION.Animation.start(myElement, properties, options, myCallback);
	* 
	* @function Animation.start
	* @param {domelement} element The DOM element to start performing an animation on
	* @param {object} properties The style properties to animate, and their target values
	* @param {object} options Customisable settings for this animation
	* @param {int} options.duration (default:1000) The length of the animation, in milliseconds
	* @param {string} options.easing (default:"linear") The easing method to use.
	* @param {function} callback Callback function to run after the animation has completed
	*/
	_public.start = function(element, properties, options, callback) {
		options = options || {};
		_private.startAnimation(element, properties, options, callback);
	};

	/**
		* Stops all animations currently active on the passed element
		* 
		* **Example:**
		*
			// Element that will be animated
			var myElement = document.querySelector(".my-element");
			// Stop all animation on selected element
			NATION.Animation.stop(myElement);
		*
		* @function Animation.stop
		* @param {domelement} element - The DOM element on which to stop all animations
	*/
	_public.stop = function(element) {
		_private.stopAnimation(element);
	};

	var _private = {
		//------------------------------------------------
		// Variables
		//------------------------------------------------
		activeAnimations: [],
		animationTimer: null,
		CSS3Available: false,
		testingElement: null,
		transitionEndString: "",
		cssPrefix: "",
		types: {
			PIXELS: "pixels",
			PERCENT: "percent",
			COLOUR: "colour",
			TRANSFORM: "transform",
			NONE: "none"
		},
		easing: {
			linear: function(percent, elapsed, start, end, duration) {
				return start + (end - start) * percent;
			},
			easeInSine: function (percent, elapsed, start, end, duration) {
				return -(end-start) * Math.cos(elapsed/duration * (Math.PI/2)) + (end-start) + start;
			},
			easeOutSine: function (percent, elapsed, start, end, duration) {
				return (end-start) * Math.sin(elapsed/duration * (Math.PI/2)) + start;
			},
			easeInOutSine: function (percent, elapsed, start, end, duration) {
				return -(end-start)/2 * (Math.cos(Math.PI*elapsed/duration) - 1) + start;
			},
			easeInQuad: function (percent, elapsed, start, end, duration) {
				return (end-start)*(elapsed/=duration)*elapsed + start;
			},
			easeOutQuad: function (percent, elapsed, start, end, duration) {
				return -(end-start) *(elapsed/=duration)*(elapsed-2) + start;
			},
			easeInOutQuad: function(percent, elapsed, start, end, duration) {
				if ((elapsed/=duration/2) < 1) return (end-start)/2 * elapsed * elapsed + start;
				return -(end-start)/2 * ((--elapsed) * (elapsed-2) - 1) + start;
			}
		},
		cssEasing: {
			linear: "linear",
			easeInSine: "cubic-bezier(0.47, 0, 0.745, 0.715)",
			easeOutSine: "cubic-bezier(0.39, 0.575, 0.565, 1)",
			easeInOutSine: "cubic-bezier(0.445, 0.05, 0.55, 0.95)",
			easeInQuad: "cubic-bezier(0.55, 0.085, 0.68, 0.53)",
			easeOutQuad: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
			easeInOutQuad: "cubic-bezier(0.455, 0.03, 0.515, 0.955)"
		},
		startTimers: [],

		//------------------------------------------------
		// Init
		//------------------------------------------------
		init: function() {
			this.testingElement = document.createElement("div");
			this.checkForCSS3();
			this.getTransitionEndString();
		},

		//------------------------------------------------
		// Check if we can use CSS3 transitions
		//------------------------------------------------
		checkForCSS3: function() {
			this.CSS3Available = false;
			var availableStyles = this.testingElement.style;
			var prefixes = ["ms", "O", "Moz", "Webkit"], transitionString = "";
			if (availableStyles["transition"] === "") {
				this.transitionString = "transition";
				this.CSS3Available = true;
			}
			while (prefixes.length) {
				transitionString = prefixes.pop() + "Transition";
				if (transitionString in availableStyles) {
					this.transitionString = transitionString;
					this.CSS3Available = true;
					break;
				}
			}
		},

		//------------------------------------------------
		// Can't animate scrollTop or scrollLeft with CSS3
		//------------------------------------------------
		checkForScrollPosChange: function(properties) {
			var scrollPosFound = false;
			var i = 0, length = properties.length;
			for (var prop in properties) {
				if (prop === "scrollLeft" || prop === "scrollTop") {
					scrollPosFound = true;
				}
			}
			return scrollPosFound;
		},

		//------------------------------------------------
		// Create a new animation on an element
		//------------------------------------------------
		startAnimation: function(element, properties, options, callback) {
			// Allows options argument to be missed by user
			if (callback && options) {
				options.complete = callback;
			}
			if (typeof options === "function") {
				var completeMethod = options;
				options = {};
				options.complete = completeMethod;
			}
			// Set defaults
			options.easing = options.easing || "linear";
			options.duration = options.duration || 1000;
			if (this.CSS3Available) {
				if (!this.checkForScrollPosChange(properties)) {
					this.animateWithCSS3(element, properties, options, callback);
				} else {
					this.animateWithJavaScript(element, properties, options, callback);
				}
			} else {
				this.animateWithJavaScript(element, properties, options, callback);
			}
		},

		//------------------------------------------------
		// Ideally let the browser do the work
		//------------------------------------------------
		animateWithCSS3: function(element, properties, options) {
			// Set start styles on element, if any are currently blank
			var startStyles = (window.getComputedStyle) ? getComputedStyle(element) : element.currentStyle;
			var newStyles = {};
			for (var prop in properties) {
				if (!startStyles[prop]) {
					newStyles[prop] = 0;
					if (prop === "opacity") {
						newStyles[prop] = 1;
					} else if (prop.search(/color/i) > -1) {
						if (prop === "color") {
							newStyles[prop] = "#000000";
						} else {
							newStyles[prop] = "transparent";
						}
					}
					NATION.Utils.setStyle(element, newStyles);
				}
			}
			// Apply a transition after a small delay, to allow immediately prior
			// css changes to display in a draw cycle first
			requestAnimationFrame(function() {
				_private.startCSSAnim(element, properties, options);
			});
		},

		//------------------------------------------------
		// Start the CSS transition
		//------------------------------------------------
		startCSSAnim: function(element, properties, options) {
			this.stopAnimation(element);
			properties = this.checkForPrefixes(properties);
			var durationInSeconds = options.duration / 1000 + "s",
			styleString = "", pixels = false, percentage = false, color = false, value = "";
			var organisedProperties = [], startValue;
			var startStyles = (window.getComputedStyle) ? getComputedStyle(element) : element.currentStyle;
			element.style[this.transitionString] = "all " + durationInSeconds + " " + this.cssEasing[options.easing];
			var attributeChanging = false;
			for (var prop in properties) {
				value = properties[prop].toString();
				var valueType = this.types.NONE;
				if (value.search(/px|%|#/gi) < 0) {
					if (prop.search(/transform/i) < 0 && prop !== "opacity") {
						value += "px";
					}
				}
				if (value.search(/transform/i) >= 0) {
					valueType = this.types.TRANSFORM;
				} else {
					if (value.search(/px/i) >= 0) valueType = this.types.PIXELS;
					if (value.search("%") >= 0) valueType = this.types.PERCENT;
					if (value.search(/#|rgb/i) >= 0) valueType = this.types.COLOUR;
				}

				startValue = (element.style[prop]) ? element.style[prop] : startStyles[prop];
				element.style[prop] = value;
				organisedProperties.push({
					name: prop,
					startValue: startValue,
					targetValue: value,
					type: valueType
				});
				if (startValue !== value) {
					attributeChanging = true;
				}
			}
			this.activeAnimations.push({
				element: element,
				properties: organisedProperties,
				options: options
			});
			if (attributeChanging) {
				setTimeout(function() {
					element.addEventListener(_private.transitionEndString, _private.onTransitionEnd, false);
				}, 10);
			} else {
				// Fire complete immediately, as nothing changed
				this.onTransitionEnd({target: element});
			}
		},

		//------------------------------------------------
		// Adds prefixes where needed to all property names
		//------------------------------------------------
		checkForPrefixes: function(properties) {
			// Check properties for any styles that might require prefixes
			// Copy the object temporarily
			var props = {}, newPropName, value;
			for (var propName in properties) {
				newPropName = propName;
				value = properties[propName];
				delete props[propName];
				newPropName = NATION.Utils.getPrefixedName(newPropName);
				props[newPropName] = value;
			}
			return props;
		},

		//------------------------------------------------
		// Returns supported transition end event string
		//------------------------------------------------
		getTransitionEndString: function() {
			var transitionNames = {
				'WebkitTransition' : 'webkitTransitionEnd',
                'MozTransition' : 'transitionend',
                'OTransition' : 'oTransitionEnd otransitionend',
                'transition' : 'transitionend'
            };
            this.cssPrefix = "";
			for (var i in transitionNames) {
				if (this.testingElement.style[i] !== undefined) {
					this.cssPrefix = "-" + i.toLowerCase() + "-";
					this.cssPrefix = this.cssPrefix.replace("transition", "");
					this.transitionEndString = transitionNames[i];
					return;
				}
			}
		},

		//------------------------------------------------
		// Get percentage from -ms-filter string (0-1 format)
		//------------------------------------------------
		getPercentageFromFilter: function(filterString) {
			var percentage = filterString.replace("progid:DXImageTransform.Microsoft.Alpha(Opacity=", "");
			percentage = percentage.replace(")", "");
			return parseInt(percentage, 10) / 100;
		},

		//------------------------------------------------
		// Get percentage from filter string (0-1 format)
		//------------------------------------------------
		convertOpacityToFilterString: function(percentage) {
			percentage = Math.floor(percentage*100);
			return "progid:DXImageTransform.Microsoft.Alpha(Opacity=" + percentage + ")";
		},

		//------------------------------------------------
		// Parse a transform string into an array of values
		//------------------------------------------------
		convertTransformString: function(transformString) {
			// Wipe out spaces around commas, so that we can split array on spaces safely
			transformString = transformString.replace(/, | ,/g, ",");
			var valueArray = transformString.split(" ");
			var i = 0, length = valueArray.length, values = {}, attribute, value, startIndex, endIndex;
			for (; i < length; i++) {
				startIndex = valueArray[i].indexOf("(") + 1;
				endIndex = valueArray[i].indexOf(")") - startIndex;
				attribute = valueArray[i].substr(0, startIndex-1);
				value = valueArray[i].substr(startIndex, endIndex);
				if (value.indexOf(",") > -1) {
					// This is a coma separated value, eg. translate(23px, 56px)
					value = value.split(",");
				}
				values[attribute] = value;
			}
			return values;
		},

		//------------------------------------------------
		// Animate using JavaScript
		//------------------------------------------------
		animateWithJavaScript: function(element, properties, options) {
			this.stopAnimation(element);
			properties = this.checkForPrefixes(properties);
			var currentTime = Date.now();
			var organisedProperties = [], computedStyle;
			for (var prop in properties) {
				var targetValue = properties[prop].toString();
				var valueType = this.types.NONE;
				if (targetValue.search(/px|%|#|rgb/gi) < 0) {
					// Don't add 'px' if this is a transform, or we're just animating opacity
					if (prop.search("transform") < 0 && prop !== "opacity") {
						targetValue += "px";
					}
				}
				// Store the start position
				var startValue = "";
				if (prop.search(/transform/i) >= 0) {
					valueType = this.types.TRANSFORM;
					targetValue = this.convertTransformString(targetValue);
				}
				if (element.style && element.style[prop]) {
					startValue = element.style[prop];
				} else {
					// Will only work for transforms if the target value is a matrix
					computedStyle = (typeof window.getComputedStyle !== "undefined") ? window.getComputedStyle(element, null)[prop] : element.currentStyle[prop];
					if (computedStyle && valueType !== this.types.TRANSFORM) {
						startValue = computedStyle;
					} else {
						startValue = 0;
					}
				}
				if (!startValue || startValue === "none") {
					// Nothing in style tag, compute the style if not animating scroll
					if (valueType === this.types.TRANSFORM) {
						startValue = {};
						for (name in targetValue) {
							startValue[name] = 0;
						}
					} else if (prop !== "scrollLeft" && prop !== "scrollTop") {
						startValue = (window.getComputedStyle) ? getComputedStyle(element)[prop] : element.currentStyle[prop];
					} else {
						// Since we're trying to animate scrollTop or scrollLeft, if user wants to animate the whole page
						// we need to check whether to animate html or body
						if (element === document.documentElement) {
							element = NATION.Utils.getPageElement();
						}
						startValue = element[prop];
					}
				} else if (valueType === this.types.TRANSFORM) {
					startValue = this.convertTransformString(startValue);
					var i = 0, length = targetValue.length;
					for (var propName in targetValue) {
						if (!startValue[propName]) {
							if (window.console && console.warn) console.warn("NATION.Animation: Existing transform function does not match target function. Setting transform to 0 on element " + element.toString());
							startValue[propName] = 0;
						}
					}
				}

				if (valueType !== this.types.TRANSFORM) {
					if (targetValue.search(/px/i) >= 0) {
						// IE sometimes adds px to zero values, so check if that's really what we want
						if (targetValue === "0px") {
							if (startValue.toString().search("%") >= 0) {
								valueType = this.types.PERCENT;
							} else {
								valueType = this.types.PIXELS;
							}
						} else {
							valueType = this.types.PIXELS;
						}
					} else {
						if (targetValue.search("%") >= 0) valueType = this.types.PERCENT;
						if (targetValue.search(/#|rgb/i) >= 0) valueType = this.types.COLOUR;
					}
					targetValue = targetValue.replace(/px|%/gi, "");
				}

				if (startValue === "auto") startValue = 0;
				if (prop === "opacity" && !("opacity" in document.documentElement.style)) {
					prop = "filter";
					startValue = element.currentStyle.filter
					startValue = startValue || "progid:DXImageTransform.Microsoft.Alpha(Opacity=100)";
					startValue = this.getPercentageFromFilter(startValue);
					targetValue = parseInt(targetValue, 10);
				}
				
				organisedProperties.push({
					name: prop,
					startValue: startValue,
					targetValue: targetValue,
					type: valueType
				});
			}
			this.activeAnimations.push({
				element: element,
				properties: organisedProperties,
				options: options,
				startTime: currentTime,
				currentTime: currentTime,
				endTime: currentTime + options.duration
			});
			this.startAnimationInterval();
		},

		//------------------------------------------------
		// Stop an existing animation
		//------------------------------------------------
		stopAnimation: function(element) {
			// Switch to the page element relevant to the current browser if needed
			if (element === document.documentElement) {
				element = NATION.Utils.getPageElement();
				this.stopJSAnimation(element);
			}
			if (this.CSS3Available) {
				// Stop CSS transition in progress
				var currentStyles = (window.getComputedStyle) ? getComputedStyle(element) : element.currentStyle;
				var i = 0, length = this.activeAnimations.length, propName = "";
				for (; i < length; i++) {
					if (this.activeAnimations[i].element === element) {
						var k = 0, propLength = this.activeAnimations[i].properties.length;
						for (; k < propLength; k++) {
							propName = this.activeAnimations[i].properties[k].name;
							element.style[propName] = currentStyles[propName];
						}
					}
				}
				// Remove transition and listeners
				element.removeEventListener(this.transitionEndString, _private.onTransitionEnd, false);
				element.style[this.transitionString] = "none";
				this.removeAnimation(element);
			} else {
				// Stop JS animation in progress
				this.stopJSAnimation(element);
			}
		},

		//------------------------------------------------
		// Stops a JavaScript animation in progress
		//------------------------------------------------
		stopJSAnimation: function(element) {
			this.removeAnimation(element);
			if (this.activeAnimations.length <= 0) {
				cancelAnimationFrame(this.animRequest);
				clearInterval(this.animationTimer);
				this.animationTimer = null;
			}
		},

		//------------------------------------------------
		// Creates timer to loop through all active animations
		//------------------------------------------------
		startAnimationInterval: function() {
			if (this.animationTimer) {
				clearTimeout(this.animationTimer);
			}
			this.animationTimer = setTimeout(function() {
				_private.animRequest = requestAnimationFrame(_private.updateAnimation);
			}, 1000/60);
		},

		//------------------------------------------------
		// Tween from one colour to another based on progress
		//------------------------------------------------
		tweenColour: function(progress, startValue, targetValue) {
			if (startValue.search("#") >= 0) {
				startValue = this.hexToRGB(startValue);
			}
			if (targetValue.search("#") >= 0) {
				targetValue = this.hexToRGB(targetValue);
			}
			startValue = this.RGBToArray(startValue);
			targetValue = this.RGBToArray(targetValue);

			var red = (targetValue[0] * progress) + (startValue[0] * (1 - progress));
			var green = (targetValue[1] * progress) + (startValue[1] * (1 - progress));
			var blue = (targetValue[2] * progress) + (startValue[2] * (1 - progress));
			return this.RGBToHex("(" + red + "," + green + "," + blue + ")");
		},

		//------------------------------------------------
		// Go through each transform property and move
		// them along slightly
		//------------------------------------------------
		tweenTransform: function(easing, progress, elapsed, startValues, targetValues, duration) {
			var newValues = {}, startValue, targetValue, unit, newValue, newNumber;
			for (var propName in targetValues) {
				if (typeof targetValues[propName] !== "string") {
					// Value was comma separated (eg. translate(10px, 20px))
					newValue = "";
					var i = 0, length = targetValues[propName].length;
					for (; i < length; i++) {
						if (typeof startValues[propName] !== "string" && startValues[propName][i]) {
							startValue = parseFloat(startValues[propName][i].replace(unit, ""));
						} else {
							startValue = 0;
						}
						if (targetValues[propName][i]) {
							targetValue = parseFloat(targetValues[propName][i].replace(unit, ""));
						} else {
							targetValue = startValue;
						}
						
						newNumber = this.easing[easing](progress, elapsed, startValue, targetValue, duration);
						unit = targetValues[propName][i].replace(/[0-9|\-|\.]/g, "");
						newValue += newNumber + unit;
						if (i < length-1) newValue += ",";
					}
					newValues[propName] = newValue;
				} else {
					// Standard single value string
					unit = targetValues[propName].replace(/[0-9|\-|\.]/g, "");
					startValue = (startValues[propName] === 0) ? 0 : parseFloat(startValues[propName].replace(unit, ""));
					targetValue = parseFloat(targetValues[propName].replace(unit, ""));
					newValues[propName] = this.easing[easing](progress, elapsed, startValue, targetValue, duration);
					newValues[propName] += unit;
				}
			}
			return newValues;
		},

		//------------------------------------------------
		// Build up transform string from passed values
		//------------------------------------------------
		applyNewTransform: function(element, propertyName, values) {
			var transformString = "";
			for (var attribute in values) {
				transformString += attribute + "(" + values[attribute] + ") ";
			}
			element.style[propertyName] = transformString;
		},

		//------------------------------------------------
		// The main animation loop for javascript mode
		//------------------------------------------------
		updateAnimation: function() {
			var anims = _private.activeAnimations, allAnimsComplete = true;
			var i = 0, length = anims.length, currentValue, newValue, propertyData, optionData, completeAnims;
			var pixels, percentage;
			for (; i < length; i++) {
				anims[i].currentTime = Date.now();
				completeAnims = 0;
				for (var k = 0; k < anims[i].properties.length; k++) {
					propertyData = anims[i].properties[k];
					// If this property is fully animated, ignore it this time around
					if (!propertyData.complete) {
						optionData = anims[i].options;
						var progress = (anims[i].currentTime - anims[i].startTime) / (anims[i].endTime - anims[i].startTime);
						if (progress > 1) progress = 1;
						var newValue = 0;
						if (propertyData.type === _private.types.TRANSFORM) {
							newValue = _private.tweenTransform(optionData.easing, progress, anims[i].currentTime - anims[i].startTime, propertyData.startValue, propertyData.targetValue, anims[i].options.duration);
						} else if (propertyData.type === _private.types.COLOUR) {
							newValue = _private.tweenColour(progress, propertyData.startValue, propertyData.targetValue);
						} else {
							newValue = _private.easing[optionData.easing](progress, anims[i].currentTime - anims[i].startTime, parseInt(propertyData.startValue, 10), propertyData.targetValue, anims[i].options.duration);
						}
						// This property has reached it's target value
						if (progress === 1) {
							// Handle JavaScript's "issues" with floating points
							newValue = propertyData.targetValue;
							anims[i].properties[k].complete = true;
							completeAnims++;
						}
						if (propertyData.name === "scrollLeft" || propertyData.name === "scrollTop") {
							// Animate scroll differently
							anims[i].element[propertyData.name] = newValue;
						} else if (propertyData.type === _private.types.TRANSFORM) {
							// Create the new transform string and apply it to the element
							_private.applyNewTransform(anims[i].element, propertyData.name, newValue);
						} else if (propertyData.type === _private.types.PERCENT) {
							anims[i].element.style[propertyData.name] = newValue + "%";
						} else if (propertyData.type === _private.types.PIXELS) {
							anims[i].element.style[propertyData.name] = newValue + "px";
						} else {
							if (propertyData.name === "filter") {
								// Change to filters for IE8
								newValue = _private.convertOpacityToFilterString(newValue);
							}
							anims[i].element.style[propertyData.name] = newValue;
						}
						if (progress < 1) {
							allAnimsComplete = false;
						}
					}
					if (completeAnims === anims[i].properties.length) {
						anims[i].allComplete = true;
					}
				}
			}
			if (!allAnimsComplete) {
				_private.startAnimationInterval();
			} else {
				cancelAnimationFrame(_private.animRequest);
				clearInterval(_private.animationTimer);
				_private.animationTimer = null;
			}

			i = 0;
			var clonedAnimArray = _private.activeAnimations.slice(0);
			for (; i < length; i++) {
				if (clonedAnimArray[i].allComplete) {
					_private.removeAnimation(clonedAnimArray[i].element);
					if (clonedAnimArray[i].options.complete) {
						clonedAnimArray[i].options.complete(clonedAnimArray[i].element);
					}
				}
			}
		},

		//------------------------------------------------
		// Clear animation data
		//------------------------------------------------
		removeAnimation: function(element) {
			var i = 0, length = this.activeAnimations.length;
			for (; i < length; i++) {
				if (this.activeAnimations[i].element === element) {
					this.activeAnimations.splice(i, 1);
					break;
				}
			}
		},

		//------------------------------------------------
		// Check if element has a callback, then call it
		//------------------------------------------------
		handleCallback: function(element) {
			var i = 0, length = this.activeAnimations.length;
			for (; i < length; i++) {
				if (this.activeAnimations[i].options.complete) {
					this.activeAnimations[i].options.complete(element);
				}
			}
		},

		//------------------------------------------------
		// Convert a hex colour to RGB format
		//------------------------------------------------
		hexToRGB: function(hex) {
			// Expand shorthand hexes first
			var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
			hex = hex.replace(shorthandRegex, function(m, r, g, b) {
				return r + r + g + g + b + b;
			});
			// Convert to RGB values for each colour
			var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
			return "(" + 
				parseInt(result[1], 16) + "," + 
				parseInt(result[2], 16) + "," + 
				parseInt(result[3], 16) + ")";
		},

		//------------------------------------------------
		// Convert an individual colour to hex (eg. red=FF)
		//------------------------------------------------
		colourSectionToHex: function(colour) {
			colour = parseInt(colour, 10);
			var hex = colour.toString(16);
			return (hex.length === 1) ? "0" + hex : hex;
		},

		//------------------------------------------------
		// Convert an RGB colour to hex format
		//------------------------------------------------
		RGBToHex: function(rgb) {
			var colours = this.RGBToArray(rgb);
			return "#" + this.colourSectionToHex(colours[0]) + this.colourSectionToHex(colours[1]) + this.colourSectionToHex(colours[2]);
		},

		//------------------------------------------------
		// Convert an RGB value into an array with separate colours
		//------------------------------------------------
		RGBToArray: function(rgb) {
			rgb = rgb.replace(/ /g, "");
			var colours = rgb.split("(");
			colours = colours[1].split(")");
			colours = colours[0].split(",");
			return colours;
		},

		//------------------------------------------------
		// Fire callback and forget about this animation
		//------------------------------------------------
		onTransitionEnd: function(e) {
			var i = 0, length = _private.activeAnimations.length;
			var clonedAnimArray = _private.activeAnimations.slice(0);
			for (; i < length; i++) {
				if (clonedAnimArray[i].element === e.target) {
					clonedAnimArray[i].element.removeEventListener("transitionend", _private.onTransitionEnd, false);
					clonedAnimArray[i].element.style[_private.transitionString] = "none";
					_private.removeAnimation(clonedAnimArray[i].element);
					if (clonedAnimArray[i].options.complete) {
						var e = {};
						e.target = e.currentTarget = clonedAnimArray[i].element;
						clonedAnimArray[i].options.complete(e);
					}
				}
			}
		}
	};

	_private.init();
	return _public;
}());


(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());