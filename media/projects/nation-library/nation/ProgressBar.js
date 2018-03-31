//////////////////////////////////////////////////////////////////////////////
// Nation Library
// Progress Bar
// Version 2.2.3
// Dependencies: NATION.Utils, NATION.EventDispatcher
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	if (typeof window.NATION === "undefined") window.NATION = {};

	//////////////////////////
	// Depenency Management
	//////////////////////////
	function checkDependencies() {
		var packageName = "NATION.ProgressBar";
		var dependencies = {
			"NATION.Utils": NATION.Utils,
			"NATION.EventDispatcher": NATION.EventDispatcher
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
		/**
		* ### Dependencies:
		* [NATION.Utils](Utils.js.html)
		* [NATION.EventDispatcher](EventDispatcher.js.html)
		*
		* ### About:
		* Progress bar displaying a percentage from 0 to 100
		*
		* Selector is expected to contain an element with class 'js-progress' or 'progress', which is the actual progress bar itself. The width of this element is changed as a percentage to represent the desired percentage to display
		*
		* Selector can contain a clickable hit area. This should be an element with the class 'js-hitarea' or 'hitarea'
		* Selector can also contain a handle, by using class 'js-handle' or 'handle'
		* Selector can also contain a separate load progress bar, marked with class 'js-loaded' or 'loaded'. This can be set to different percentages than the progress bar, via the 'setLoaded' method. This will also resize the hit area element to match
		*
		* @class ProgressBar
		* @param {domelement_or_jqueryobject} selector The element that will behave as a scrollbar
		* @param {object} options Object containing settings for this progress bar<br />
		* <b>handlePositioning</b> <i>{string: "outside"}</i> Either "outside" (default) or "inside". Defines how the handle should be positioned within the bar. "outside" sees the cenre of the handle move between 0 and 100% of the bar, thus leading to it poking outside. "inside" keeps the handle fully within the bar
		* <b>snapSegments</b> <i>{number: 1}</i> Enable snapping by dividing the bar into segments. More than one segment will trigger snapping
		* @jsFiddle //jsfiddle.net/NationStudio/7thLue5y/embedded/
		*/
		var ProgressBar = function(selector, handlePositioning, options) {
			NATION.EventDispatcher.call(this);
			this.options = {
				handlePositioning: "outside",
				snapSegments: 1
			};
			// Keeps older projects working
			if (handlePositioning && typeof handlePositioning === "string") {
				this.options.handlePositioning = handlePositioning;
			} else if (handlePositioning && !options) {
				options = handlePositioning;
			}
			if (options) {
				for (var optionName in options) {
					this.options[optionName] = options[optionName];
				}
			}
			// Store reference to the main selector
			this.__DOMElement = NATION.Utils.getDOMElement(selector);
			// Store references to the child elements
			this.__hitArea = this.__DOMElement.querySelector(".js-hitarea, .hitarea");
			this.__handle = this.__DOMElement.querySelector(".js-handle, .handle");
			this.__progressElement = this.__DOMElement.querySelector(".js-progress, .progress");
			this.__loadedElement = this.__DOMElement.querySelector(".js-loaded, .loaded");
			if (this.__handle) {
				this.__handle.setAttribute("draggable", "false");
			}
			// Variable definitions
			this.requestedPercentage = 0;
			this.displayedPercentage = 0;
			this.displayedLoadedPercentage = 0;
			this.handleDragging = false;
			// Setup
			this.createListeners();
		}

		/**
		* Inherits from NATION.EventDispatcher
		* @ignore
		*/
		ProgressBar.prototype = Object.create(NATION.EventDispatcher.prototype);
		ProgressBar.prototype.constructor = ProgressBar;

		/**
		* Event that fires when the progress bar has been clicked
		*/
		ProgressBar.prototype.CLICKED = "clicked";
		/**
		* Event that fires when a handle drag has started
		*/
		ProgressBar.prototype.HANDLE_MOUSE_DOWN = "HandleMouseDown";
		/**
		* Event that fires each time the user moves the handle during a drag
		*/
		ProgressBar.prototype.HANDLE_DRAGGED = "HandleDragged";
		/**
		* Event that fires when the user releases the handle
		*/
		ProgressBar.prototype.HANDLE_RELEASED = "HandleReleased";
		/**
		* Event that fires when the value of the progress bar changes
		*/
		ProgressBar.prototype.VALUE_CHANGED = "ValueChanged";

		/**
		* Returns true if the user is currently dragging the handle
		* @return {boolean} Whether the user is currently dragging the handle or not
		*/
		ProgressBar.prototype.getHandleDragInProgress = function() {
			return this.handleDragging;
		}

		/**
		* Returns the currently displayed percentage
		* @return {number} Percentage between 0 and 1
		*/
		ProgressBar.prototype.getPercentage = function() {
			return this.displayedPercentage;
		}

		/**
		* Returns the percentage corresponding to where the user last clicked
		* @return {number} Percentage between 0 and 1
		*/
		ProgressBar.prototype.getRequestedPercentage = function() {
			return this.requestedPercentage;
		}

		/**
		* Display a passed percentage
		* @param {number} percentage The percentage to show, between 0 and 1
		*/
		ProgressBar.prototype.setProgress = function(percentage) {
			// Ensure percentage isn't out of bounds
			if (percentage > 1) {
				percentage = 1;
			} else if (percentage < 0) {
				percentage = 0;
			}
			if (percentage !== this.displayedPercentage) {
				valueChanged = true;
			}
			this.displayedPercentage = percentage;
			if (valueChanged) {
				this.trigger(this.VALUE_CHANGED);
			}
			if (this.options.handlePositioning === "inside") {
				percentage = ((this.__DOMElement.offsetWidth - this.__handle.offsetWidth) * percentage) / this.__DOMElement.offsetWidth;
			}
			// Convert percentage to correct value for CSS
			var newWidth = percentage * 100;
			if (newWidth > 0) {
				newWidth += "%";
			}
			// Apply new width to the progress element
			if (this.__progressElement) {
				this.__progressElement.style.width = newWidth;
			}
			var valueChanged = false;
			// Update the currently displayed percentage
			
			this.setNewHandlePosition(percentage);
		}

		/**
		* Set the load bar position via a percentage
		* @param {number} percentage Percentage between 0 and 1
		* @param {boolean} adjustHitArea Whether to match hitarea width to progress bar width
		*/
		ProgressBar.prototype.setLoaded = function(percentage, adjustHitArea) {
			// Ensure percentage isn't out of bounds
			if (percentage > 1) {
				percentage = 1;
			} else if (percentage < 0) {
				percentage = 0;
			}
			// Convert percentage to correct value for CSS
			var newWidth = (percentage * 100) + "%";
			// Apply new width to the loaded element, if one exists
			if (this.__loadedElement) {
				this.__loadedElement.style.width = newWidth;
			}
			// Apply new width to the hit area element, if one exists
			if (adjustHitArea && this.__hitArea) {
				this.__hitArea.style.width = newWidth;
			}
			// Store this percentage as the currently displayed one
			this.displayedLoadedPercentage = percentage;
		}

		/**
		* Set the handle to a percentage along the bar
		* @param {number} percentage Percentage to position the handle at, between 0 and 1
		*/
		ProgressBar.prototype.setNewHandlePosition = function(percentage) {
			if (this.__handle) {
				var progressBarWidth = this.__progressElement.offsetWidth;
				var newPosition = percentage;
				if (newPosition < 0) newPosition = 0;
				var hitAreaWidthPercent = 0;
				if (this.__hitArea) {
					hitAreaWidthPercent = this.__hitArea.offsetWidth / progressBarWidth;
				} else {
					hitAreaWidthPercent = this.__DOMElement.offsetWidth / progressBarWidth;
				}
				if (newPosition > hitAreaWidthPercent) newPosition = hitAreaWidthPercent;
				this.__handle.style.left = (100 * newPosition) + "%";
			}
		}

		/**
		* Listen for clicks on the hit area, if one exists
		* @ignore
		*/
		ProgressBar.prototype.createListeners = function() {
			if (this.__hitArea) {
				this.__hitArea.addEventListener("click", this.onHitAreaClicked.bind(this));
			}
			if (this.__handle) {
				this.__handle.addEventListener("mousedown", this.onHandleMouseDown.bind(this));
				this.__handle.addEventListener("click", this.onHandleClicked.bind(this));
				this.__handle.addEventListener("touchstart", this.onHandleTouchStart.bind(this));
			}
		}

		/**
		* Store the last clicked percentage, and signal that the hit area was clicked
		* @ignore
		*/
		ProgressBar.prototype.onHitAreaClicked = function(e) {
			// Get the click position, relative to the progress bar, rather than the browser window
			var clickedX = e.pageX - NATION.Utils.getOffset(e.currentTarget).left;
			// Convert it to a percentage and store it for later outside access
			this.requestedPercentage = clickedX / this.__DOMElement.offsetWidth;
			// Signal that the progress bar was clicked
			this.trigger(this.CLICKED);
			e.stopPropagation();
			e.preventDefault();
		}

		/**
		* Start dragging handle
		* @ignore
		*/
		ProgressBar.prototype.onHandleMouseDown = function(e) {
			this.handleDragging = true;
			this.handler_MouseMove = this.onHandleDragged.bind(this);
			this.handler_MouseUp = this.onHandleReleased.bind(this);
			document.addEventListener("mousemove", this.handler_MouseMove);
			document.addEventListener("mouseup", this.handler_MouseUp);
			this.trigger(this.HANDLE_MOUSE_DOWN);
			e.stopPropagation();
			e.preventDefault();
		}

		/**
		* Move handle to match touch movement
		* @ignore
		*/
		ProgressBar.prototype.onHandleDragged = function(e) {
			var xPos = e.pageX - NATION.Utils.getOffset(this.__DOMElement).left;
			this.updateHandleOnDrag(xPos);
			this.trigger(this.HANDLE_DRAGGED);
			e.stopPropagation();
			e.preventDefault();
		}

		/**
		* Position the handle correctly in response to a drag
		* @ignore
		*/
		ProgressBar.prototype.updateHandleOnDrag = function(xPos) {
			var progressBarWidth = this.__DOMElement.offsetWidth;
			// Don't allow handlePositioning to break the requested percentage
			if (this.__hitArea && xPos > this.__hitArea.offsetWidth) {
				xPos = this.__hitArea.offsetWidth;
			}

			this.requestedPercentage = xPos / progressBarWidth;
			if (this.options.snapSegments > 1) {
				var newPercentage = 0;
				var visibleSegments = this.options.snapSegments ;
				var segmentPercentage = (100 / visibleSegments) / 100;
				for (var i = 0, length = visibleSegments; i < length; i++) {
					if (this.requestedPercentage >= ((segmentPercentage/2) + (i * segmentPercentage))) {
						newPercentage = segmentPercentage * (i+1);
					}
				}
				this.requestedPercentage = newPercentage;
			}
			// Make sure the percentage stays within bounds
			if (this.requestedPercentage > 1) this.requestedPercentage = 1;
			if (this.requestedPercentage < 0) this.requestedPercentage = 0;
			this.setProgress(this.requestedPercentage);
		}

		/**
		* Stop tracking mouse move events
		* @ignore
		*/
		ProgressBar.prototype.onHandleReleased = function(e) {
			this.handleDragging = false;
			document.removeEventListener("mousemove", this.handler_MouseMove);
			document.removeEventListener("mouseup", this.handler_MouseUp);
			
			this.trigger(this.HANDLE_RELEASED);
			e.stopPropagation();
			e.preventDefault();
		}

		/**
		* Start tracking touch move events
		* @ignore
		*/
		ProgressBar.prototype.onHandleTouchStart = function(e) {
			this.handleDragging = true;
			this.handler_TouchMove = this.onHandleTouchMove.bind(this);
			this.handler_TouchEnd = this.onHandleTouchEnd.bind(this);
			document.addEventListener("touchmove", this.handler_TouchMove);
			document.addEventListener("touchend", this.handler_TouchEnd);
			document.addEventListener("pointermove", this.handler_TouchMove);
			document.addEventListener("pointerup", this.handler_TouchEnd);
			this.trigger(this.HANDLE_MOUSE_DOWN);
			e.stopPropagation();
			e.preventDefault();
		}

		/**
		* Move handle to match touch movement
		* @ignore
		*/
		ProgressBar.prototype.onHandleTouchMove = function(e) {
			var touches = (typeof e.changedTouches != 'undefined') ? e.changedTouches : [e];
			var xPos = touches[0].pageX - NATION.Utils.getOffset(this.__DOMElement).left;
			this.updateHandleOnDrag(xPos);
			e.stopPropagation();
			e.preventDefault();
		}

		/**
		* Stop tracking touch move events
		* @ignore
		*/
		ProgressBar.prototype.onHandleTouchEnd = function(e) {
			this.handleDragging = false;
			document.removeEventListener("touchmove", this.handler_TouchMove);
			document.removeEventListener("touchend", this.handler_TouchEnd);
			document.removeEventListener("pointermove", this.handler_TouchMove);
			document.removeEventListener("pointerup", this.handler_TouchEnd);
			this.trigger(this.HANDLE_RELEASED);
			e.stopPropagation();
			e.preventDefault();
		}

		/**
		* Prevent default action
		* @ignore
		*/
		ProgressBar.prototype.onHandleClicked = function(e) {
			e.preventDefault();
		}

		window.NATION.ProgressBar = ProgressBar;
	}

}(window, document, undefined));