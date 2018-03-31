//////////////////////////////////////////////////////////////////////////////
// Nation Library
// Vertical Scrollbar
// Version 2.1.8
// Dependencies: NATION.EventDispatcher, NATION.Utils
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	if (typeof window.NATION === "undefined") window.NATION = {};

	//////////////////////////
	// Depenency Management
	//////////////////////////
	function checkDependencies() {
		var packageName = "NATION.VerticalScrollbar";
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
		* A JavaScript-powered scrollbar, used to scroll content vertically
		*
		* @class VerticalScrollbar
		* @param {domelement_or_querystring_or_jqueryobject} contentSelector Selector or element containing content to be scrolled by the scrollbar
		* @param {domelement_or_querystring_or_jqueryobject} scrollbarSelector Selector or element containing the scrollbar HTML. Expected to contain elements with classes 'js-track'/'track', and 'js-handle'/'handle'
		* @param {object} options An object containing the custom settings for this scrollbar<br />
		* <b>enableMouseLock</b> <i>{boolean=false}</i> Prevents the main page from being scrolled when the user uses the mousewheel while hovered over the scrollable content
		* <b>inertiaEnabled</b> <i>{boolean=true}</i> Causes scroll intertia on mobile devices after a vertical swipe
		* <b>inertiaMultiplier</b> <i>{number=0.8}</i> The strength of the inertia effect. A higher number results in a longer ease out that covers more distance
		* @jsFiddle //jsfiddle.net/NationStudio/pz0oeb7c/embedded/
		*/
		var VerticalScrollbar = function(contentSelector, scrollbarSelector, options) {
			// Call the super's constructor
			NATION.EventDispatcher.call(this);
			// Check required selectors have been passed in
			if (!contentSelector) throw new Error(this.ERROR_MISSING_SELECTOR.replace("{{selector}}", "contentSelector"));
			if (!scrollbarSelector) throw new Error(this.ERROR_MISSING_SELECTOR.replace("{{selector}}", "scrollbarSelector"));
			// Store selectors as native DOM elements
			this.__content = NATION.Utils.getDOMElement(contentSelector);
			this.__scrollbar = NATION.Utils.getDOMElement(scrollbarSelector);
			this.__track = this.__scrollbar.querySelector(".js-track, .track");
			this.__handle = this.__scrollbar.querySelector(".js-handle, .handle");
			// Initialise required variables
			this.barHeight = 0;
			this.contentHeight = 0;
			this.handleHeight = 0;
			this.previousScrollPercentage = 0;
			this.lastTouchPosition = 0;
			this.dragStartPos = 0;
			this.resizeTimer = null;
			this.inertiaScrolling = false;
			this.touchPreviousContentPos = 0;
			this.touchPreviousY = 0;
			this.touchDragInProgress = false;
			this.enabled = false;
			// Keep track of whether listeners have been instantiated
			this.listenersCreated = false;
			// Minimum height the handle can ever be
			this.MIN_HANDLE_HEIGHT = 50;
			// Set options defaults
			this.options = {
				enableMouseLock: false,
				inertiaEnabled: true,
				inertiaMultiplier: 0.8
			};
			// Store passed options, if any
			if (options) {
				for (var optionName in options) {
					this.options[optionName] = options[optionName];
				}
			}
			// Perform initial setup
			this.setup();
		}

		/**
		* Inherits from NATION.EventDispatcher
		* @ignore
		*/
		VerticalScrollbar.prototype = Object.create(NATION.EventDispatcher.prototype);
		VerticalScrollbar.prototype.constructor = VerticalScrollbar;

		/**
		* Event that fires each time the content position is changed
		*/
		VerticalScrollbar.prototype.CONTENT_SCROLLED = "ContentScrolled";
		VerticalScrollbar.prototype.REQUIRED = "Required";
		VerticalScrollbar.prototype.NOT_REQUIRED = "NotRequired";
		/**
		* Event that fires when the scrollbar becomes active (due to long content)
		*/
		VerticalScrollbar.prototype.ENABLED = "Enabled";
		/**
		* Event that fires when the scrollbar is disabled (content isn't long enough)
		*/
		VerticalScrollbar.prototype.DISABLED = "Disabled";

		/**
		* Resume listening for user interaction (handle drags, content scrolls, etc)
		*/
		VerticalScrollbar.prototype.enable = function() {
			if (!this.listenersCreated) {
				this.createListeners();
			}
			// Remove the disabled class from the scroll bar, if it exists
			if (this.__scrollbar.className.search("disabled") >= 0) {
				this.__scrollbar.className = this.__scrollbar.className.replace(/ disabled|disabled/g, "");
			}
			if (!this.enabled) {
				this.enabled = true;
				this.trigger(this.ENABLED);
			}
		}

		/**
		* Stop listening to any form of user interaction (handle drags, content scrolls, etc)
		*/
		VerticalScrollbar.prototype.disable = function() {
			if (this.listenersCreated) {
				this.removeListeners();
			}
			// Add the disabled class to the scrollbar, if it isn't already there
			if (this.__scrollbar.className.search("disabled") < 0) {
				this.__scrollbar.className += " disabled";
			}
			if (this.enabled) {
				this.enabled = false;
				this.trigger(this.DISABLED);
			}
		}

		/**
		* Set the scroll position back to the top of the content
		*/
		VerticalScrollbar.prototype.reset = function() {
			// Apply the new position to the handle element
			this.__handle.style.top = 0;
			// Reposition the content to match
			this.repositionContent(0);
			// Update the last touch position to be the top of the content
			this.lastTouchPosition = 0;
		}

		/**
		* Repositions the scrollbar after the content height was changed
		* If the position relative to the content's current scroll should be maintained, maintainPosition should be true. Otherwise this will reset the scrollbar, and associated content, back to the top
		* This method also disables the scrollbar automatically, if the content height has become smaller than the scrollbar height
		* @param {Boolean} maintainPosition Set to true if the handle and content should maintain their relative current scroll position, percentage-wise
		*/
		VerticalScrollbar.prototype.resize = function(maintainPosition) {
			if (typeof maintainPosition === "undefined") maintainPosition = true;
			// Store the previous heights of the content and scrollbar element
			var previousContentHeight = this.contentHeight;
			var previousBarHeight = this.barHeight;
			// Update the current heights with whatever they are now
			this.contentHeight = this.__content.children[0].offsetHeight;
			this.barHeight = this.__scrollbar.offsetHeight;
			// Update the height difference between content and scrollbar
			this.options.heightDifference = this.barHeight - this.__content.clientHeight;
			// If position should be maintained, re-calculate where the handle should be,
			// now that the height of the content has changed
			if (maintainPosition && this.previousScrollPercentage !== 0) {
				// Re-apply the new position to the handle and content
				this.setPosition(this.previousScrollPercentage);
			} else if (!maintainPosition) {
				// Don't need to maintain position, so set content scroll position back to the top
				this.reset();
			}
			this.calculateHandleHeight();
			// If the handle is now as big as the scrollbar itself, we don't need it anymore
			if (this.handleHeight === this.barHeight || this.contentHeight === 0) {
				this.disable();
				this.trigger(this.NOT_REQUIRED);
			} else {
				// Otherwise ensure the scrollbar is enabled
				this.enable();
				this.trigger(this.REQUIRED);
			}
			if (this.resizeTimer) {
				clearTimeout(this.resizeTimer);
				this.resizeTimer = null;
			}
		}

		/**
		* Scroll the content to a passed position, as a percentage between 0 and 1
		* @param {Number} percentage A percentage representing how far down the content should be scrolled, from 0 to 1 
		*/
		VerticalScrollbar.prototype.setPosition = function(percentage) {
			if (percentage >= 0) {
				this.calculateHandleHeight();
				this.repositionContent(percentage);
				var handlePos = percentage * (this.__scrollbar.clientHeight - this.__handle.offsetHeight);
				if (handlePos + this.handleHeight > this.barHeight) {
					handlePos = this.barHeight - this.handleHeight;
				}
				if (handlePos < 0) handlePos = 0;
				this.__handle.style.top = handlePos + "px";
			}
		}

		/**
		* Returns the current scroll position, as a percentage between 0 and 1
		* @return {number} Percentage between 0 and 1
		*/
		VerticalScrollbar.prototype.getPosition = function() {
			return this.previousScrollPercentage;
		}

		/**
		* Error strings
		* @ignore
		*/
		VerticalScrollbar.prototype.ERROR_MISSING_SELECTOR = "NATION.VerticalScrollbar: The '{{selector}}' argument is required.";

		/**
		* Initial setup of scrollbar
		* @ignore
		*/
		VerticalScrollbar.prototype.setup = function() {
			// Make sure the handle doesn't get dragged around the page after mousedown
			this.__handle.setAttribute("draggable", false);
			this.__handle.style.top = 0;
			
			// Prevent default behaviour on mobile IE
			this.__scrollbar.style.touchAction = "none";
			this.__content.style.touchAction = "none";
			// Store the height of the scrollbar for later calculations
			this.barHeight = this.__scrollbar.offsetHeight;
			// Store the height of the content inside the scrollableContent element
			this.contentHeight = this.__content.children[0].offsetHeight;
			// Check for a height difference. Allow the option to take priority if one was set (depreciated option)
			if (!this.options.heightDifference) {
				this.options.heightDifference = this.barHeight - this.__content.clientHeight;
			}
			// Activate the scrollbar if the content is taller than the scrollbar
			if (this.contentHeight > this.barHeight) {
				this.prepareHandle();
				this.createListeners();
			} else {
				this.disable();
			}
			this.__content.scrollTop = 0;
			// Always listen for resize events, to know when to enable/disable the scrollbar
			this.handler_WindowResize = this.onWindowResized.bind(this);
			window.addEventListener("resize", this.handler_WindowResize, false);
		}

		/**
		* Size and position the handle relative to the content
		* @ignore
		*/
		VerticalScrollbar.prototype.prepareHandle = function() {
			// Start handle at the top of the bar
			this.__handle.style.top = 0;
			// Ensure the tab key doesn't select the handle element
			this.__handle.tabIndex = -1;
			this.calculateHandleHeight();
		}

		/**
		* Work out how tall the handle should be relative to content height
		* @ignore
		*/
		VerticalScrollbar.prototype.calculateHandleHeight = function() {
			// Calculate how tall the handle element should be
			this.handleHeight = Math.floor(this.barHeight * ((this.barHeight - this.options.heightDifference) / this.contentHeight));
			// Make sure the handle doesn't get too small
			if (this.handleHeight < this.MIN_HANDLE_HEIGHT || this.contentHeight === 0) {
				this.handleHeight = this.MIN_HANDLE_HEIGHT;
			} else if (this.handleHeight > this.barHeight) {
				// ... or too big
				this.handleHeight = this.barHeight;
			}
			var handleTop = parseInt(this.__handle.style.top, 10);
			if (handleTop + this.handleHeight > this.barHeight) {
				handleTop = this.barHeight - this.handleHeight;
				if (handleTop < 0) handleTop = 0;
				this.__handle.style.top = handleTop + "px";
			}
			// Set the new height on the handle element
			this.__handle.style.height = this.handleHeight + "px";
		}

		/**
		* Start listening for events relating to user interaction
		* @ignore
		*/
		VerticalScrollbar.prototype.createListeners = function() {
			this.listenersCreated = true;
			this.handler_HandleMouseDown = this.onHandleMouseDown.bind(this);
			this.__handle.addEventListener("mousedown", this.handler_HandleMouseDown, false);
			this.handler_HandleClicked = this.onHandleClicked.bind(this);
			this.__handle.addEventListener("click", this.handler_HandleClicked, false);
			this.handler_WheelScrolled = this.onMouseWheelScrolled.bind(this);
			this.__content.addEventListener("mousewheel", this.handler_WheelScrolled, false);
			this.__content.addEventListener("wheel", this.handler_WheelScrolled, false);
			this.__content.addEventListener("DOMMouseScroll", this.handler_WheelScrolled, false)
			if (this.__track) {
				this.handler_TrackMouseDown = this.onTrackMouseDown.bind(this);
				this.__track.addEventListener("mousedown", this.handler_TrackMouseDown, false);
			}
			this.handler_HandleTouchStart = this.onHandleTouchStart.bind(this);
			this.__handle.addEventListener("touchstart", this.handler_HandleTouchStart, false);
			this.__handle.addEventListener("pointerdown", this.handler_HandleTouchStart, false);
			this.handler_ContentTouchStart = this.onContentTouchStart.bind(this);
			this.__content.addEventListener("touchstart", this.handler_ContentTouchStart, false);
			this.__content.addEventListener("pointerdown", this.handler_ContentTouchStart, false);
			
		}

		/**
		* Stop listening for events relating to user interaction
		* @ignore
		*/
		VerticalScrollbar.prototype.removeListeners = function() {
			this.listenersCreated = false;
			this.__handle.removeEventListener("mousedown", this.handler_HandleMouseDown, false);
			this.__handle.removeEventListener("click", this.handler_HandleClicked, false);
			this.__content.removeEventListener("mousewheel", this.handler_WheelScrolled, false);
			this.__content.removeEventListener("wheel", this.handler_WheelScrolled, false);
			this.__content.removeEventListener("DOMMouseScroll", this.handler_WheelScrolled, false);
			if (this.__track) this.__track.removeEventListener("mousedown", this.handler_TrackMouseDown, false);
			this.__handle.removeEventListener("touchstart", this.handler_HandleTouchStart, false);
			this.__handle.removeEventListener("pointerdown", this.handler_HandleTouchStart, false);
			this.__content.removeEventListener("touchstart", this.handler_ContentTouchStart, false);
			this.__content.removeEventListener("pointerdown", this.handler_ContentTouchStart, false);
			document.removeEventListener("mousemove", this.handler_HandleMouseMove, false);
			document.removeEventListener("mouseup", this.handler_HandleMouseUp, false);
			document.removeEventListener("touchmove", this.handler_HandleTouchMove, false);
			document.removeEventListener("touchend", this.handler_HandleTouchEnd, false);
			document.removeEventListener("pointermove", this.handler_HandleTouchMove, false);
			document.removeEventListener("pointerup", this.handler_HandleTouchEnd, false);
			
		}

		/**
		* Scroll the content by a percentage between 0 and 1, with 1 meaning the content is scrolled to the bottom
		* @ignore
		*/
		VerticalScrollbar.prototype.repositionContent = function(percentage) {
			this.previousScrollPercentage = percentage;
			var targetY = ((this.__content.children[0].offsetHeight) - (this.barHeight - this.options.heightDifference)) * percentage;
			this.__content.scrollTop = targetY;
			this.trigger(this.CONTENT_SCROLLED);
		}

		/**
		* Move the handle to the designated y position
		* @ignore
		*/
		VerticalScrollbar.prototype.positionHandle = function(handleY) {
			// Work out where this is relative to the starting y position of the mouse
			var handlePos = handleY - this.dragStartPos;
			// Ensure the handle doesn't move beyond the scrollbar limits
			if (handlePos > (this.barHeight - this.__handle.offsetHeight)) {
				handlePos = this.barHeight - this.__handle.offsetHeight;
			} else if (handlePos < 0) {
				handlePos = 0;
			}
			if (handlePos + this.handleHeight > this.barHeight) {
				handlePos = this.barHeight - this.handleHeight;
			}
			// Set the new position on the handle
			this.__handle.style.top = handlePos + "px";
			// Reposition the content with the updated scroll percentage
			this.repositionContent(handlePos / (this.barHeight - this.__handle.offsetHeight));
		}

		/**
		* Update the inertia effect after a touch end
		* @ignore
		*/
		VerticalScrollbar.prototype.inertiaScroll = function(e) {
			// Prepare required variables
			var elapsed, delta, newPos, percentage;
			// If there is amplitude set
			if (this.inertiaAmplitude) {
				// Calculate the elapsed time since last update
				elapsed = Date.now() - this.inertiaTimestamp;
				// Calculate the new increment based on inertia amplitude
				delta = -this.inertiaAmplitude * Math.exp(-elapsed / 325);
				// If the increment is big enough to bother with, update position
				if (delta > 0.5 || delta < -0.5) {
					// Calculate the new content position
					newPos = this.touchPreviousContentPos = this.inertiaTarget + delta;
					// Schedule another update
					if (this.inertiaScrolling) requestAnimationFrame(this.inertiaScroll.bind(this));
				} else {
					// Inertia scrolling should now stop
					this.inertiaScrolling = false;
					newPos = this.touchPreviousContentPos = this.inertiaTarget;
				}
				// Work out the new percentage, taking into account possible content resize since last update
				percentage = newPos / (this.contentHeight - this.__content.clientHeight);
				// Prevent the scroll going beyond the limits
				if (percentage < 0) {
					percentage = 0;
					// Setting inertiaScrolling to false prevents another update being scheduled on the next frame
					this.inertiaScrolling = false;
				} else if (percentage > 1) {
					percentage = 1;
					this.inertiaScrolling = false;
				}
				// Actually update the content and handle position
				this.setPosition(percentage);
			}
		}

		/**
		* Start scrolling the content while handle is active
		* @ignore
		*/
		VerticalScrollbar.prototype.onHandleMouseDown = function(e) {
			// Ensure no ongoing inertia takes effect
			this.inertiaScrolling = false;
			// Only scroll if the content is taller than the scrollbar
			if (this.__content.children[0].offsetHeight > this.barHeight) {
				// Add the active class to the handle, if not already there
				if (this.__handle.className.search("active") < 0) {
					this.__handle.className += " active";
				}
				// Store the starting position of the mouse relative to the scrollbar itself
				this.dragStartPos = (e.pageY - NATION.Utils.getPosition(this.__scrollbar).top) - NATION.Utils.getPosition(this.__handle).top;
				// Create event handlers for the mousemove/mouseup events, as these need to be removed later
				// and listeners with annonymous callbacks can't be removed
				this.handler_HandleMouseMove = this.onHandleMouseMove.bind(this);
				this.handler_HandleMouseUp = this.onHandleMouseUp.bind(this);
				// Start listening for mouse movement so the content can be scrolled
				document.addEventListener("mousemove", this.handler_HandleMouseMove, false);
				document.addEventListener("mouseup", this.handler_HandleMouseUp, false);
			}
			e.preventDefault();
		}

		/**
		* Don't react to handle clicks
		* @ignore
		*/
		VerticalScrollbar.prototype.onHandleClicked = function(e) {
			e.stopPropagation();
			e.preventDefault();
		}

		/**
		* Normalise the mouse wheel values
		* Taken from https://github.com/facebook/fixed-data-table/blob/master/dist/fixed-data-table.js#L2189
		* @ignore
		*/
		VerticalScrollbar.prototype.normaliseScroll = function(event) {
			var PIXEL_STEP = 10;
			var LINE_HEIGHT = 40;
			var PAGE_HEIGHT = 800;
			// spinX, spinY
			var sX = 0, sY = 0,
			// pixelX, pixelY
			pX = 0, pY = 0;
			// Legacy
			if ('detail' in event) {
				sY = event.detail;
			}
			if ('wheelDelta' in event) {
				sY = -event.wheelDelta / 120;
			}
			if ('wheelDeltaY' in event) {
				sY = -event.wheelDeltaY / 120;
			}
			if ('wheelDeltaX' in event) {
				sX = -event.wheelDeltaX / 120;
			}
			// side scrolling on FF with DOMMouseScroll
			if ('axis' in event && event.axis === event.HORIZONTAL_AXIS) {
				sX = sY;
				sY = 0;
			}
			pX = sX * PIXEL_STEP;
			pY = sY * PIXEL_STEP;
			if ('deltaY' in event) {
				pY = event.deltaY;
			}
			if ('deltaX' in event) {
				pX = event.deltaX;
			}
			if ((pX || pY) && event.deltaMode) {
				if (event.deltaMode == 1) {
					// delta in LINE units
					pX *= LINE_HEIGHT;
					pY *= LINE_HEIGHT;
				} else {
					// delta in PAGE units
					pX *= PAGE_HEIGHT;
					pY *= PAGE_HEIGHT;
				}
			}
			// Fall-back if spin cannot be determined
			if (pX && !sX) {
				sX = pX < 1 ? -1 : 1;
			}
			if (pY && !sY) {
				sY = pY < 1 ? -1 : 1;
			}
			return {
				spinX: sX,
				spinY: sY,
				pixelX: pX,
				pixelY: pY
			};
		}

		/**
		* Reposition the handle based on mouse wheel direction and strength
		* @ignore
		*/
		VerticalScrollbar.prototype.onMouseWheelScrolled = function(e) {
			// Ensure no ongoing inertia takes effect
			this.inertiaScrolling = false;
			var normalised = this.normaliseScroll(e);
			var newPos = NATION.Utils.getPosition(this.__handle).top;
			if (normalised.pixelY) {
				var deltaY = normalised.spinY * Math.abs(normalised.pixelY);
				if (deltaY > 40) {
					deltaY = 40;
				} else if (deltaY < -40) {
					deltaY = -40;
				}
				newPos += deltaY;
				// Ensure the handle can't move beyond the scrollbar limits
				if (newPos > (this.barHeight - this.__handle.offsetHeight)) {
					newPos = this.barHeight - this.__handle.offsetHeight;
				} else if (newPos < 0) {
					newPos = 0;
				}
				// Set the new handle position on the handle element
				this.__handle.style.top = newPos + "px";
				// Work out the new position as a percentage, so repositionContent can be called
				var percentage = 0;
				// Calculate how far down the scrollbar the handle is, as a percentage
				if (newPos !== 0) percentage = newPos / (this.barHeight - this.__handle.offsetHeight);
				// If the pecentage has changed, reposition the content to match the new handle position
				if (percentage !== this.previousScrollPercentage) {
					this.repositionContent(percentage);
					if (e.preventDefault) e.preventDefault();
				}
			}
			if (this.options.enableMouseLock && e.preventDefault) {
				e.preventDefault();
			}
		}

		/**
		* Move the handle to the clicked position on the track, and adjust content to match
		* @ignore
		*/
		VerticalScrollbar.prototype.onTrackMouseDown = function(e) {
			// Stop any ongoing inertia
			this.inertiaScrolling = false;
			// Work out the new handle position
			var newPos = e.pageY - NATION.Utils.getOffset(this.__scrollbar).top - (this.__handle.offsetHeight/2);
			// Ensure the handle can't move beyond the scrollbar limits
			if (newPos > (this.barHeight - this.__handle.offsetHeight)) {
				newPos = this.barHeight - this.__handle.offsetHeight;
			} else if (newPos < 0) {
				newPos = 0;
			}
			if (newPos + this.handleHeight > this.barHeight) {
				newPos = this.barHeight - this.handleHeight;
			}
			// Set the new top position on the handle
			this.__handle.style.top = newPos + "px";
			// Work out the percentage down the scrollbar that this represents, between 0 and 1
			var percentage = newPos / (this.barHeight - this.__handle.offsetHeight);
			// If the percentage has changed, adjust the content to match
			if (percentage !== this.previousScrollPercentage) {
				this.repositionContent(percentage);
			}
			e.preventDefault();
		}

		/**
		* Update the position of the handle and the content
		* @ignore
		*/
		VerticalScrollbar.prototype.onHandleMouseMove = function(e) {
			// Get the new position of the mouse, relative to the scrollbar itself
			var newY = e.pageY - NATION.Utils.getPosition(this.__scrollbar).top;
			this.positionHandle(newY);
			e.preventDefault();
		}

		/**
		* Stop listening for mouse movement, and remove active class from handle
		* @ignore
		*/
		VerticalScrollbar.prototype.onHandleMouseUp = function(e) {
			// Stop listening for mouse movement
			document.removeEventListener("mousemove", this.handler_HandleMouseMove, false);
			document.removeEventListener("mouseup", this.handler_HandleMouseUp, false);
			// If the handle still has it's active class, remove it
			if (this.__handle.className.search("active") >= 0) {
				this.__handle.className = this.__handle.className.replace(/ active|active/g, "");
			}
			e.preventDefault();
		}

		/**
		*  Start scrolling the content while handle is active
		* @ignore
		*/
		VerticalScrollbar.prototype.onHandleTouchStart = function(e) {
			this.inertiaScrolling = false;
			var touches = (typeof e.touches != 'undefined') ? e.touches : [e];
			if (this.__content.children[0].offsetHeight > this.barHeight) {
				// Add the active class to the handle, if not already there
				if (this.__handle.className.search("active") < 0) {
					this.__handle.className += " active";
				}
				// Store the starting position of the mouse relative to the scrollbar itself
				this.dragStartPos = (touches[0].pageY - NATION.Utils.getPosition(this.__scrollbar).top) - NATION.Utils.getPosition(this.__handle).top;
				// Create event handlers for the mousemove/mouseup events, as these need to be removed later
				// and listeners with annonymous callbacks can't be removed
				this.handler_HandleTouchMove = this.onHandleTouchMove.bind(this);
				this.handler_HandleTouchEnd = this.onHandleTouchEnd.bind(this);
				// Start listening for mouse movement so the content can be scrolled
				document.addEventListener("touchmove", this.handler_HandleTouchMove, false);
				document.addEventListener("touchend", this.handler_HandleTouchEnd, false);
				document.addEventListener("pointermove", this.handler_HandleTouchMove, false);
				document.addEventListener("pointerup", this.handler_HandleTouchEnd, false);
			}
			e.preventDefault();
		}

		/**
		* Update the position of the handle and the content
		* @ignore
		*/
		VerticalScrollbar.prototype.onHandleTouchMove = function(e) {
			var touches = (typeof e.changedTouches != 'undefined') ? e.changedTouches : [e];
			var newY = touches[0].pageY - NATION.Utils.getPosition(this.__scrollbar).top;
			this.positionHandle(newY);
			e.preventDefault();
		}

		/**
		* Stop listening for touch drag, and remove active class from handle
		* @ignore
		*/
		VerticalScrollbar.prototype.onHandleTouchEnd = function(e) {
			// Remove listeners for touch move/end
			document.removeEventListener("touchmove", this.handler_HandleTouchMove, false);
			document.removeEventListener("touchend", this.handler_HandleTouchUp, false);
			document.removeEventListener("pointermove", this.handler_HandleTouchMove, false);
			document.removeEventListener("pointerup", this.handler_HandleTouchEnd, false);
			// If the handle still has it's active class, remove it
			if (this.__handle.className.search("active") >= 0) {
				this.__handle.className = this.__handle.className.replace(/ active|active/g, "");
			}
			e.preventDefault();
		}

		/**
		* Start checking for a touch drag
		* @ignore
		*/
		VerticalScrollbar.prototype.onContentTouchStart = function(e) {
			var touches = (typeof e.changedTouches != 'undefined') ? e.changedTouches : [e];
			if (this.options.inertiaEnabled) {
				this.inertiaScrolling = false;
				this.inertiaVelocity = 0;
				this.inertiaAmplitude = 0;
				this.inertiaTimestamp = Date.now();
			}
			this.touchPreviousY = touches[0].pageY;
			this.touchPreviousContentPos = this.__content.scrollTop;
			// Listen for touch dragging
			this.handler_ContentTouchMove = this.onContentTouchMove.bind(this);
			this.handler_ContentTouchEnd = this.onContentTouchEnd.bind(this);
			document.addEventListener("touchmove", this.handler_ContentTouchMove);
			document.addEventListener("touchend", this.handler_ContentTouchEnd);
			document.addEventListener("pointermove", this.handler_ContentTouchMove);
			document.addEventListener("pointerup", this.handler_ContentTouchEnd);
		}

		/**
		* Update the position of the content and handle in response to a touch move
		* @ignore
		*/
		VerticalScrollbar.prototype.onContentTouchMove = function(e) {
			// If this code is running, that means a drag is in progress
			this.touchDragInProgress = true;
			// Normalise the touch event objects
			var touches = (typeof e.changedTouches != 'undefined') ? e.changedTouches : [e];
			// Work out the difference in touch y position
			var difference = touches[0].pageY - this.touchPreviousY;
			// Only do stuff if there was a change in position
			if (difference !== 0) {
				// Add/substract the difference in touch position to the previous content position
				var newPos = this.touchPreviousContentPos - difference;
				// Make sure the new position isn't beyond the scroll limits
				if (newPos < 0) {
					newPos = 0;
				} else if (newPos > this.contentHeight - this.__content.clientHeight) {
					newPos = this.contentHeight - this.__content.clientHeight;
				}
				// Update the calculated inertia, if this is enabled
				if (this.options.inertiaEnabled) {
					// Work out difference between last position and current one
					var delta = newPos - this.touchPreviousContentPos;
					// Work out the velocity of this drag
					var velocity = 1000 * delta / (1 + (Date.now() - this.inertiaTimestamp));
					// Calculate new overall velocity
					this.inertiaVelocity = 0.8 * velocity + 0.2 * this.inertiaVelocity;
					// Update the time of last inertia change
					this.inertiaTimestamp = Date.now();
				}
				// Store the previous content position
				this.touchPreviousContentPos = newPos;
				// Store the previous touch Y position
				this.touchPreviousY = touches[0].pageY;
				// Calculate the percentage
				var percentage = 0;
				if (newPos !== 0) {
					percentage = newPos / (this.contentHeight - this.__content.clientHeight);
				}
				// Update the handle position
				this.setPosition(percentage);
			}
			e.preventDefault();
		}

		/**
		* Stop scrolling content on touch move
		* @ignore
		*/
		VerticalScrollbar.prototype.onContentTouchEnd = function(e) {
			// Start the inertia animation
			if (this.options.inertiaEnabled) {
				if (this.inertiaVelocity > 200 || this.inertiaVelocity < -200) {
					this.inertiaAmplitude = this.options.inertiaMultiplier * this.inertiaVelocity;
					this.inertiaTarget = Math.round(this.touchPreviousContentPos + this.inertiaAmplitude);
					this.inertiaTimestamp = Date.now();
					this.inertiaScrolling = true;
					requestAnimationFrame(this.inertiaScroll.bind(this));
				}
			}
			// Stop listening for touch drags
			document.removeEventListener("touchmove", this.handler_ContentTouchMove);
			document.removeEventListener("touchend", this.handler_ContentTouchEnd);
			document.removeEventListener("pointermove", this.handler_ContentTouchMove);
			document.removeEventListener("pointerup", this.handler_ContentTouchEnd);
			// Prevent default action only if a drag occured (rather than a touch)
			if (this.touchDragInProgress) {
				this.touchDragInProgress = false;
				e.preventDefault();
			}
		}

		/**
		* Resize on a timer to go easy on the DOM
		* @ignore
		*/
		VerticalScrollbar.prototype.onWindowResized = function(e) {

			if (!this.resizeTimer) {
				// Resize on a timer, to avoid hammering the DOM with needless updates
				this.resizeTimer = setTimeout(this.resize.bind(this, true), 20);
			}
		}

		window.NATION.VerticalScrollbar = VerticalScrollbar;
	}

}(window, document, undefined));