////////////////////////////////////////////////////////////////////////////////
// Nation Library
// Vertical Scrollbar
// contentSelector: selector for element wrapping actual content - this should
// 					only contain a single child element
// scrollbarSelector: selector for element containing '.handle' and '.track'
// options: {
//				heightDifference:0,		- difference in height between scrollbar and content
//			 	enableMouseLock: false, - Scroll events will continue to be captured
//										  even if the scrollbar is at top/bottom
//				inertiaEnabled: true 	- Enables inertia when swiping on touch devices
//	}
////////////////////////////////////////////////////////////////////////////////
var NATION = NATION || {};

/**
* ### Dependencies
* [NATION.Utils](Utils.js.html)
*
* ### About:
* A JavaScript-powered scrollbar, used to scroll content vertically
*
* ### Style Information:
* - *.handle* is expected to be positioned absolutely, since it's 'top' is modified by this class. This means it's parent should be positioned relatively to avoid unexpected behaviour
* - To position the content, the scrollTop of ***contentSelector***'s direct child is modified
*
* ### Example:
	
	<!-- HTML -->
	<div class="scrollable-content">
		<div>
			<p>Some copy that has to be scrolled.</p>
			<p>Additional copy.</p>
		</div>
	</div>
	<div class="scrollbar">
		<div class="track"></div>
		<a class="handle" href="#"></a>
	</div>

	// JavaScript
	var content = document.querySelector('.scrollable-content');
	var scrollbar = document.querySelector('.scrollbar');
	var options = {
		enableScrollLock: true
	};
	var verticalScrollbar = new NATION.VerticalScrollbar(content, scrollbar, options);

* @class VerticalScrollbar
* @param {domelement,string} contentSelector DOM element, or query string, to the content to be scrolled. This should only contain one direct child element
* @param {domelement,string} scrollbarSelector DOM element, or query string, to the scrollbar. Must contain '.handle' and '.track'
* @param {object} options Object with additional settings
* @param {number} options.heightDifference (default:0) Difference between the height of the scrollbar and content, if any, in pixels
* @param {boolean} options.enableMouseLock (default:false) Scroll events will continue to be captured even if the scrollbar is at top/bottom. Prevents page from scrolling if user's mouse is over the scrollbar/content
* @param {boolean} options.inertiaEnabled (default:true) Enables inertia-based scrolling on touch devices
*/
NATION.VerticalScrollbar = function(contentSelector, scrollbarSelector, options) {

	"use strict";
	
	var _public = {};

	/**
	* Make the scrollbar functional
	*/
	_public.enable = function() {
		if (!_private.listenersCreated) {
			_private.createListeners();
		}
	};

	/**
	* Stop the scrollbar from responding to user interaction
	*/
	_public.disable = function() {
		if (_private.listenersCreated) {
			_private.removeListeners();
		}
	};

	/**
	* Reset handle to the top of the scrollbar
	*/
	_public.reset = function() {
		_private.HANDLE_SELECTOR.style.top = 0;
		_private.repositionContent(0);
		_private.touchLastPos = _private.CONTENT_SELECTOR.scrollTop;
	};

	/**
	* Resize scrollbar to match new content
	* @param {boolean} maintainPosition Retain the current scroll position, regardless of content changing height
	*/
	_public.resize = function(maintainPosition) {
		var previousContentHeight = _private.contentHeight;
		_private.SCROLLBAR_SELECTOR.style.display = "block";
		_private.contentHeight = _private.CONTENT_SELECTOR.children[0].offsetHeight;
		_private.barHeight = _private.SCROLLBAR_SELECTOR.offsetHeight;
		_private.setDefaults();
		if (!_private.listenersCreated) _private.createListeners();
		// If position should be maintained, re-calculate where the handle
		// should be, now that the height of the content has changed
		if (maintainPosition) {
			if (previousContentHeight > 0 && _private.lastPercentage > 0) {
				var newPercentage = previousContentHeight / _private.contentHeight;
				if (newPercentage > 1) newPercentage = 1;
				var newPos = newPercentage * (_private.TRACK_SELECTOR.clientHeight - _private.HANDLE_SELECTOR.offsetHeight);
				_private.lastPercentage = newPos;
				_private.HANDLE_SELECTOR.style.top = newPos + "px";
			}
		} else {
			this.reset();
		}
		if (_private.handleHeight === _private.barHeight) {
			_private.SCROLLBAR_SELECTOR.style.display = "none";
			if (_private.listenersCreated) this.disable();
		} else if (!_private.listenersCreated) {
			this.enable();
		}

	};

	/**
	* Manually set the scrollbar position. This also positions the content.
	*/
	_public.setPosition = function(percentage) {
		_private.repositionContent(percentage);
		var handlePos = percentage * (_private.TRACK_SELECTOR.clientHeight - _private.HANDLE_SELECTOR.offsetHeight);
		_private.HANDLE_SELECTOR.style.top = handlePos + "px";
	};

	var _private = {
		//------------------------------------------------
		// Variables
		//------------------------------------------------
		CONTENT_SELECTOR: null,
		SCROLLBAR_SELECTOR: null,
		TRACK_SELECTOR: null,
		HANDLE_SELECTOR: null,
		MIN_HANDLE_HEIGHT: 50,
		TIME_CONSTANT: 325,
		barHeight: 0,
		contentHeight: 0,
		lastPercentage: 0,
		mouseY: 0,
		listenersCreated: false,
		touchDragInProgress: false,
		touchLastPos: 0,
		touchStartY: 0,
		handleHeight: 0,
		inertiaVelocity: 0,
		inertiaAmplitude: 0,
		inertiaTimestamp: 0,
		inertiaTarget: 0,
		inertiaScrolling: false,
		options: {
			heightDifference: 0,
			enableMouseLock: false,
			inertiaEnabled: true
		},

		//------------------------------------------------
		// Init
		//------------------------------------------------
		init: function() {
			this.CONTENT_SELECTOR = NATION.Utils.getDOMElement(contentSelector);
			this.SCROLLBAR_SELECTOR = NATION.Utils.getDOMElement(scrollbarSelector);
			this.TRACK_SELECTOR = this.SCROLLBAR_SELECTOR.querySelector(".track");
			if (options) {
				for (var i in options) {
					this.options[i] = options[i];
				}
			}
			this.HANDLE_SELECTOR = this.SCROLLBAR_SELECTOR.querySelector(".handle");
			this.HANDLE_SELECTOR.setAttribute("draggable", false);
			this.SCROLLBAR_SELECTOR.style["-ms-touch-action"] = "none";
			this.CONTENT_SELECTOR.style["-ms-touch-action"] = "none";
			this.barHeight = this.TRACK_SELECTOR.offsetHeight + this.options.heightDifference;
			this.contentHeight = this.CONTENT_SELECTOR.children[0].offsetHeight;
			if (this.contentHeight > this.SCROLLBAR_SELECTOR.offsetHeight) {
				this.setDefaults();
				this.createListeners();
			}
		},

		//------------------------------------------------
		// Prepare scrollbar
		//------------------------------------------------
		setDefaults: function() {
			this.HANDLE_SELECTOR.style.top = 0;
			this.HANDLE_SELECTOR.tabIndex = -1;
			var percentage = this.barHeight / this.contentHeight;
			this.handleHeight = Math.floor(this.barHeight * percentage);
			if (this.handleHeight < this.MIN_HANDLE_HEIGHT) {
				this.handleHeight = this.MIN_HANDLE_HEIGHT;
			} else if (this.handleHeight > this.barHeight) {
				this.handleHeight = this.barHeight;
			}
			this.HANDLE_SELECTOR.style.height = this.handleHeight + "px";
		},

		//------------------------------------------------
		// Listen for mouse interaction
		//------------------------------------------------
		createListeners: function() {
			this.listenersCreated = true;
			this.HANDLE_SELECTOR.addEventListener("mousedown", _private.onHandleMouseDown);
			this.HANDLE_SELECTOR.addEventListener("click", _private.preventDefaultAction);
			this.CONTENT_SELECTOR.addEventListener("mousewheel", _private.onMouseWheel);
			this.CONTENT_SELECTOR.addEventListener("wheel", _private.onMouseWheel);
			this.TRACK_SELECTOR.addEventListener("mousedown", _private.onTrackMouseDown);
			this.HANDLE_SELECTOR.addEventListener("touchstart", _private.onTouchStart);
			this.HANDLE_SELECTOR.addEventListener("MSPointerDown", _private.onTouchStart);
			this.CONTENT_SELECTOR.addEventListener("touchstart", _private.onContentTouchStart);
			this.CONTENT_SELECTOR.addEventListener("MSPointerDown", _private.onContentTouchStart);
		},

		//------------------------------------------------
		// Stop listening for interaction
		//------------------------------------------------
		removeListeners: function() {
			this.listenersCreated = false;
			this.HANDLE_SELECTOR.removeEventListener("mousedown", _private.onHandleMouseDown);
			this.HANDLE_SELECTOR.removeEventListener("click", _private.preventDefaultAction);
			this.CONTENT_SELECTOR.removeEventListener("mousewheel", _private.onMouseWheel);
			this.CONTENT_SELECTOR.removeEventListener("wheel", _private.onMouseWheel);
			this.TRACK_SELECTOR.removeEventListener("mousedown", _private.onTrackMouseDown);
			this.HANDLE_SELECTOR.removeEventListener("touchstart", _private.onTouchStart);
			this.HANDLE_SELECTOR.removeEventListener("touchstart", _private.onContentTouchStart);
			document.removeEventListener("mousemove", _private.onHandleDragged);
			document.removeEventListener("mouseup", _private.onHandleReleased);
			window.removeEventListener("touchmove", _private.onTouchMove);
			window.removeEventListener("touchend", _private.onTouchEnd);
			document.removeEventListener("MSPointerMove", _private.onHandleDragged);
			document.removeEventListener("MSPointerUp", _private.onHandleReleased);
			window.removeEventListener("MSPointerMove", _private.onTouchMove);
			window.removeEventListener("MSPointerUp", _private.onTouchEnd);
		},

		//------------------------------------------------
		// Prevent normal browser reaction
		//------------------------------------------------
		preventDefaultAction: function(e) {
			e.stopPropagation();
			e.preventDefault();
		},

		//------------------------------------------------
		// Set content position relative to handle position
		//------------------------------------------------
		repositionContent: function(percentage) {
			this.lastPercentage = percentage;
			var targetY = (this.CONTENT_SELECTOR.children[0].offsetHeight - (this.barHeight - this.options.heightDifference)) * percentage;
			this.CONTENT_SELECTOR.scrollTop = targetY;
		},

		//------------------------------------------------
		// Start scrolling content while handle is moved
		//------------------------------------------------
		onHandleMouseDown: function(e) {
			_private.inertiaScrolling = false;
			if (_private.CONTENT_SELECTOR.children[0].offsetHeight > _private.barHeight) {
				_private.mouseY = e.pageY - NATION.Utils.getOffset(_private.TRACK_SELECTOR).top;
				_private.mouseBarOffset = (e.pageY - NATION.Utils.getPosition(_private.TRACK_SELECTOR).top) - NATION.Utils.getPosition(_private.HANDLE_SELECTOR).top;
				document.addEventListener("mousemove", _private.onHandleDragged);
				document.addEventListener("mouseup", _private.onHandleReleased);
				document.addEventListener("MSPointerMove", _private.onHandleDragged);
				document.addEventListener("MSPointerUp", _private.onHandleReleased);
			}
			
			e.stopPropagation();
			e.preventDefault();
		},

		//------------------------------------------------
		// Scroll content incrementally
		//------------------------------------------------
		onHandleDragged: function(e) {
			var newMouseY = e.pageY - NATION.Utils.getPosition(_private.TRACK_SELECTOR).top;
			var handlePos = newMouseY - _private.mouseBarOffset;
			if (handlePos > (_private.barHeight - _private.HANDLE_SELECTOR.offsetHeight)) {
				handlePos = _private.barHeight - _private.HANDLE_SELECTOR.offsetHeight;
			} else if (handlePos < 0) {
				handlePos = 0;
			}
			_private.HANDLE_SELECTOR.style.top = handlePos + "px";
			var percentage = handlePos / (_private.barHeight - _private.HANDLE_SELECTOR.offsetHeight);
			_private.repositionContent(percentage);
			e.stopPropagation();
			e.preventDefault();
		},

		//------------------------------------------------
		// Scroll content incrementally
		//------------------------------------------------
		onHandleReleased: function(e) {
			document.removeEventListener("mousemove",_private.onHandleDragged);
			document.removeEventListener("mouseup", _private.onHandleReleased);
			document.removeEventListener("MSPointerMove",_private.onHandleDragged);
			document.removeEventListener("MSPointerUp", _private.onHandleReleased);
			e.stopPropagation();
			e.preventDefault();
		},

		//------------------------------------------------
		// Scroll content incrementally
		//------------------------------------------------
		onMouseWheel: function(e) {
			_private.inertiaScrolling = false;
			var delta = e.deltaY;
			if (delta) {
				var increment = ((_private.barHeight - _private.HANDLE_SELECTOR.offsetHeight) / _private.CONTENT_SELECTOR.children[0].clientHeight) * (_private.CONTENT_SELECTOR.offsetHeight - _private.HANDLE_SELECTOR.offsetHeight);
				var newPos = NATION.Utils.getPosition(_private.HANDLE_SELECTOR).top;
				if (delta > 0) {
					newPos += increment;
				} else {
					newPos -= increment;
				}
				if (newPos > (_private.barHeight - _private.HANDLE_SELECTOR.offsetHeight)) {
					newPos = _private.barHeight - _private.HANDLE_SELECTOR.offsetHeight;
				} else if (newPos < 0) {
					newPos = 0;
				}
				_private.HANDLE_SELECTOR.style.top = newPos + "px";
				var percentage = 0;
				if (newPos !== 0) percentage = NATION.Utils.getPosition(_private.HANDLE_SELECTOR).top / (_private.barHeight - _private.HANDLE_SELECTOR.offsetHeight);
				if (percentage !== _private.lastPercentage || _private.options.enableMouseLock) {
					_private.repositionContent(percentage);
					e.stopPropagation();
					e.preventDefault();
				}
			}
		},

		//------------------------------------------------
		// Jump content to click position
		//------------------------------------------------
		onTrackMouseDown: function(e) {
			_private.inertiaScrolling = false;
			_private.mouseY = (e.pageY - NATION.Utils.getOffset(_private.TRACK_SELECTOR).top) - (_private.HANDLE_SELECTOR.offsetHeight/2);
			var newPos = _private.mouseY;
			if (newPos < 0) {
				newPos = 0;
			} else if (newPos > (_private.barHeight - _private.HANDLE_SELECTOR.offsetHeight)) {
				newPos = _private.barHeight - _private.HANDLE_SELECTOR.offsetHeight;
			}
			_private.HANDLE_SELECTOR.style.top = newPos + "px";
			var percentage = NATION.Utils.getPosition(_private.HANDLE_SELECTOR).top / (_private.barHeight - _private.HANDLE_SELECTOR.offsetHeight);
			_private.repositionContent(percentage);
			e.stopPropagation();
			e.preventDefault();
		},

		//------------------------------------------------
		// Start scrolling content
		//------------------------------------------------
		onTouchStart: function(e) {
			var touches = (typeof e.changedTouches != 'undefined') ? e.changedTouches : [e];
			_private.inertiaScrolling = false;
			if (_private.CONTENT_SELECTOR.children[0].offsetHeight > _private.barHeight) {
				_private.mouseY = touches[0].pageY - NATION.Utils.getOffset(_private.TRACK_SELECTOR).top;
				_private.mouseBarOffset = (touches[0].pageY - (NATION.Utils.getPosition(_private.TRACK_SELECTOR).top)) - NATION.Utils.getPosition(_private.HANDLE_SELECTOR).top;
				window.addEventListener("touchmove", _private.onTouchMove);
				window.addEventListener("touchend", _private.onTouchEnd);
				window.addEventListener("MSPointerMove", _private.onTouchMove);
				window.addEventListener("MSPointerUp", _private.onTouchEnd);
			}
			e.stopPropagation();
			e.preventDefault();
		},

		//------------------------------------------------
		// Scroll content respective to touch position
		//------------------------------------------------
		onTouchMove: function(e) {
			var touches = (typeof e.changedTouches != 'undefined') ? e.changedTouches : [e];
			var newMouseY = touches[0].pageY - NATION.Utils.getPosition(_private.TRACK_SELECTOR).top;
			var scrollbarPos = newMouseY - _private.mouseBarOffset;
			if (scrollbarPos > (_private.barHeight - _private.HANDLE_SELECTOR.offsetHeight)) {
				scrollbarPos = _private.barHeight - _private.HANDLE_SELECTOR.offsetHeight;
			} else if (scrollbarPos < 0) {
				scrollbarPos = 0;
			}
			_private.HANDLE_SELECTOR.style.top = scrollbarPos + "px";
			var percentage = scrollbarPos / (_private.barHeight - _private.HANDLE_SELECTOR.offsetHeight);
			_private.repositionContent(percentage);
			e.stopPropagation();
			e.preventDefault();
		},

		//------------------------------------------------
		// Start scrolling content
		//------------------------------------------------
		onTouchEnd: function(e) {
			_private.touchLastPos = _private.CONTENT_SELECTOR.scrollTop;
			window.removeEventListener("touchmove", _private.onTouchMove);
			window.removeEventListener("touchend", _private.onTouchEnd);
			window.removeEventListener("MSPointerMove", _private.onTouchMove);
			window.removeEventListener("MSPointerUp", _private.onTouchEnd);
		},

		//------------------------------------------------
		// Listen for user dragging content
		//------------------------------------------------
		onContentTouchStart: function(e) {
			var touches = (typeof e.changedTouches != 'undefined') ? e.changedTouches : [e];
			// Initiate inertia scrolling variables if required
			if (_private.options.inertiaEnabled) {
				_private.inertiaScrolling = false;
				_private.inertiaVelocity = 0;
				_private.inertiaAmplitude = 0;
				_private.inertiaTimestamp = Date.now();
			}
			_private.lastTouchPos = _private.CONTENT_SELECTOR.scrollTop;
			_private.touchStartY = _private.touchLastY = touches[0].pageY;
			window.addEventListener("touchmove", _private.onContentTouchMove);
			window.addEventListener("touchend", _private.onContentTouchEnd);
			window.addEventListener("MSPointerMove", _private.onContentTouchMove);
			window.addEventListener("MSPointerUp", _private.onContentTouchEnd);
		},

		//------------------------------------------------
		// Scroll content via updating scrollbar
		//------------------------------------------------
		onContentTouchMove: function(e) {
			var touches = (typeof e.changedTouches != 'undefined') ? e.changedTouches : [e];
			_private.touchDragInProgress = true;
			var difference = touches[0].pageY - _private.touchLastY;
			if (difference !== 0) {
				var newPos = 0;
				if (difference > 0) {
					newPos = _private.touchLastPos - difference;
				} else {
					newPos = _private.touchLastPos - difference;
				}

				if (newPos < 0) {
					newPos = 0;
				} else if (newPos > (_private.contentHeight - _private.CONTENT_SELECTOR.clientHeight)) {
					newPos = (_private.contentHeight - _private.CONTENT_SELECTOR.clientHeight);
				}

				if (_private.options.inertiaEnabled) {
					var delta = newPos - _private.touchLastPos;
					var v = 1000 * delta / (1 + (Date.now() - _private.inertiaTimestamp));
					_private.inertiaVelocity = 0.8 * v + 0.2 * _private.inertiaVelocity;
					_private.inertiaTimestamp = Date.now();
				}

				_private.touchLastPos = newPos;
				_private.touchLastY = touches[0].pageY;
			
				var percentage = 0;
				if (newPos !== 0) {
					percentage = (newPos / (_private.contentHeight - _private.CONTENT_SELECTOR.clientHeight));
				}
				_public.setPosition(percentage);
			}
			e.stopPropagation();
			e.preventDefault();
		},

		//------------------------------------------------
		// Automatically scroll based on inertia
		//------------------------------------------------
		inertiaScroll: function() {
			var elapsed, delta, newPos, percentage;
			if (_private.inertiaAmplitude) {
				elapsed = Date.now() - _private.inertiaTimestamp;
				delta = -_private.inertiaAmplitude * Math.exp(-elapsed / _private.TIME_CONSTANT);
				if (delta > 0.5 || delta < -0.5) {
					newPos =  _private.touchLastPos = _private.inertiaTarget + delta;
					if (_private.inertiaScrolling) requestAnimationFrame(function() {_private.inertiaScroll();});
				} else {
					// Inertia scroll stops here
					_private.inertiaScrolling = false;
					newPos =  _private.touchLastPos = _private.inertiaTarget;
				}
				percentage = (newPos / (_private.contentHeight - _private.CONTENT_SELECTOR.clientHeight));
				if (percentage < 0) {
					percentage = 0;
					_private.inertiaScrolling = false;
				} else if (percentage > 1) {
					percentage = 1;
					_private.inertiaScrolling = false;
				}
				_public.setPosition(percentage);
			}
		},

		//------------------------------------------------
		// Stop scrolling content
		//------------------------------------------------
		onContentTouchEnd: function(e) {
			if (_private.options.inertiaEnabled) {
				if (_private.inertiaVelocity > 200 || _private.inertiaVelocity < -200) {
					_private.inertiaAmplitude = 0.8 * _private.inertiaVelocity;
					_private.inertiaTarget = Math.round(_private.touchLastPos + _private.inertiaAmplitude);
					_private.inertiaTimestamp = Date.now();
					_private.inertiaScrolling = true;
					requestAnimationFrame(function() {_private.inertiaScroll();});
				}
			}

			window.removeEventListener("touchmove", _private.onContentTouchMove);
			window.removeEventListener("touchend", _private.onContentTouchEnd);
			window.removeEventListener("MSPointerMove", _private.onContentTouchMove);
			window.removeEventListener("MSPointerUp", _private.onContentTouchEnd);
			if (_private.touchDragInProgress) {
				_private.touchDragInProgress = false;
				e.stopPropagation();
				e.preventDefault();
			}
		}
	};

	_private.init();
	return _public;
};