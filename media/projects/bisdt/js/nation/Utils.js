var NATION = NATION || {};

/**
* ### Dependencies:
* None
*
* ### About:
* This class features a number of useful utility methods for use around your site
*
* @class Utils
*/
NATION.Utils = (function() {

	"use strict";
	
	var _public = {};

	/**
	* Dynamically generate a namespace from a string
	*/
	_public.createNamespace = function(namespace) {
			var parts = namespace.split("."),
			parent = window,
			currentPart = "",
			i = 0, length = parts.length;

			for (; i < length; i++) {
				currentPart = parts[i];
				parent[currentPart] = parent[currentPart] || {};
				parent = parent[currentPart];
			}
			return parent;
	};

	/**
	* Check if an event exists in the user's browser
	*/
	_public.isEventSupported = function(eventName) {
		var TAGNAMES = {
			"select": "input", "change": "input", "focusin": "input", "focusout": "input",
			"submit": "form", "reset": "form",
			"error": "img", "load": "img", "abort": "img"
		}
		var element = document.createElement(TAGNAMES[eventName] || "div");
		eventName = "on" + eventName;
		var isSupported = (eventName in element);
		if (!isSupported) {
			element.setAttribute(eventName, "return;");
			isSupported = typeof element[eventName] === "function";
		}
		element = null;
		return isSupported;
	};

	/**
	* Convert a string to camelcase formatting
	*/
	_public.camelcaseString = function(value) {
		return value.replace(/(?:^|\s)\w/g, function(match) {
			return match.toUpperCase();
		});
	};

	/**
	* Get position relative to first positioned parent
	*/
	_public.getPosition = function(element) {
		var position = {top: 0, left: 0};
		if (element.style.position === "fixed") {
			// Element's parent for coords is always documentElement
			var bounds = element.getBoundingClientRect();
			position.top = bounds.top;
			position.left = bounds.left;
		} else {
			var parent = element.offsetParent || document.documentElement;
			while (parent && parent.nodeName !== "html" && parent.style.position === "static") {
				parent = parent.offsetParent;
			}
			var offset = this.getOffset(element);
			var parentOffset = {top: 0, left: 0};
			if (parent.nodeName !== "html") parentOffset = this.getOffset(element.offsetParent);
			var borderTop = this.getPropertyInPixels(parent, "borderTopWidth");
			var borderLeft = this.getPropertyInPixels(parent, "borderLeftWidth");
			if (borderTop === "auto") borderTop = 0;
			if (borderLeft === "auto") borderLeft = 0;
			var marginTop = this.getPropertyInPixels(element, "marginTop");
			var marginLeft = this.getPropertyInPixels(element, "marginLeft");
			position.top = offset.top - parentOffset.top - marginTop;
			position.left = offset.left - parentOffset.left - marginLeft;
			return position;
		}
	};

	/**
	* Will convert percentages to pixels where needed
	*/
	_public.getPropertyInPixels = function(element, property) {
		var value = (typeof window.getComputedStyle !== "undefined") ? window.getComputedStyle(element, null)[property] : element.currentStyle[property];
		var result = 0;
		if (value) {
			if (value.search("%") > -1) {
				var percentage = parseInt(value.replace(/%/, ""), 10) / 100;
				result = element.parentElement.clientHeight * percentage;
			} else {
				result = parseInt(value.replace("px", ""), 10);
			}
		}
		return result;
	};

	/**
	* Get value of an element's style's property
	*/
	_public.getProperty = function(element, property) {
		var value = null;
		property = this.getPrefixedName(property);
		if (element.style && element.style[property]) {
			value = element.style[property];
		} else {
			value = (typeof window.getComputedStyle !== "undefined") ? window.getComputedStyle(element, null)[property] : element.currentStyle[property];
		}
		value = value.replace(/url\(/g, "");
		value = value.replace(/\)/g, "");
		value = value.replace(/px/g, "");
		value = value.replace(/%/g, "");
		value = value.replace(/'/g, "").replace(/"/g, "")
		return value;
	};

	/**
	* Alias for getProperty
	*/
	_public.getStyle = function(element, property) {
		return this.getProperty(element, property);
	};

	/**
	* Get the correct CSS property name with a prefix if needed
	*/
	_public.getPrefixedName = function(property) {
		var prefixes = ["webkit", "moz", "ms"];
		var i = 0, length = prefixes.length, jsProperty = property;
		// Get rid of any pre-existing prefix on the passed property name
		for (; i < length; i++) {
			if (jsProperty.search("-" + prefixes[i]) > -1) {
				jsProperty = jsProperty.replace("-" + prefixes[i] + "-", "");
				break;
			}
		}
		// Check first if the existing property name is fine
		if (_private.testingElement.style[jsProperty] !== undefined || (jsProperty === "scrollLeft" || jsProperty === "scrollTop")) {
			return jsProperty;
		}
		// Otherwise add a prefix
		i = 0;
		jsProperty = jsProperty.charAt(0).toUpperCase() + jsProperty.slice(1);
		for (; i < length; i++) {
			if (_private.testingElement.style[prefixes[i] + jsProperty] !== undefined) {
				return prefixes[i] + jsProperty;
			}
		}
		// If we got here, this property just isn't supported
		throw new Error("NATION.Utils: This browser does not support the CSS property '" + property + "'");
	};

	/**
	* Get element's offset relative to document
	*/
	_public.getOffset = function(element) {
		var containingPosition = {top: 0, left: 0};
		if (typeof element.getBoundingClientRect !== "undefined") {
			var bounds = element.getBoundingClientRect();
			containingPosition = {
				top: bounds.top,
				left: bounds.left
			};
			return {
				top: containingPosition.top + (window.pageYOffset || document.documentElement.scrollTop) - (document.documentElement.clientTop || 0),
				left: containingPosition.left + (window.pageXOffset || document.documentElement.scrollLeft) - (document.documentElement.clientLeft || 0)
			};
		}
	};

	/**
	* Get actual dom element from selector
	*/
	_public.getDOMElement = function(selector) {
		var domElement = {};
		if (typeof selector == "string") {
			domElement = document.querySelector(selector);
		} else if (typeof jQuery !== "undefined") {
			if (selector instanceof jQuery) {
				domElement = jQuery(selector)[0];
			} else {
				domElement = selector;
			}
		} else {
			domElement = selector;
		}
		return domElement;
	};

	/**
	* Returns value of cookie
	*/
	_public.getCookie = function(cookieName) {
		var nameString = cookieName + "=";
		var cookieArray = document.cookie.split(";");
		var cookieValue = null, i = 0, length = cookieArray.length, section = "";
		for (; i < length; i++) {
			section = cookieArray[i];
			while (section.charAt(0) === " ") {
				section = section.substring(1, section.length);
			}
			if (section.indexOf(nameString) === 0) {
				cookieValue = section.substring(nameString.length, section.length);
			}
		}
		return cookieValue;
	};

	/**
	* Set multiple styles on an element in one batch
	* This method also handles opacity for older IEs
	* @param {domelement} element The DOM element to apply styles to
	* @param {object} style An object containing all styles/values to set
	*/
	_public.setStyle = function(element, style) {
		var parsedProp = "";
		for (var prop in style) {
			if (prop === "opacity" && !("opacity" in document.documentElement.style)) {
				element.style.filter = "progid:DXImageTransform.Microsoft.Alpha(Opacity=" + (parseInt(style[prop], 10) * 100) + ")";
			} else {
				parsedProp = this.getPrefixedName(prop);
				element.style[parsedProp] = style[prop];
			}
		}
	};

	/**
	* Returns the element that can be scrolled
	*/
	_public.getPageElement = function() {
		return _private.scrollElement;
	};

	/**
	* Makes an ajax call
	* @param {object} options Object containing all required settings
	* @param {string} url URL to call
	* @param {string} method "post" or "get"
	* @param {string} dataType "json", "jsonp", "script", or "text"
	* @param {object} data Data to pass as part of the call
	* @param {string} responseType Expected response format (json, text)
	* @param {function} success Function to run when call completes successfully
	* @param {function} error Function to run when call completes unsuccessfully
	*/
	_public.ajax = function(options) {
		(function(options) {
			if (options.dataType === "jsonp" ) {
				// Load JSONP
				var scriptTag = document.createElement("script");
				scriptTag.options= src.url + "?callback=NATION.Utils.callbackMethod";
				if (options.data) scriptTag += "&data=" + JSON.stringify(options.data);
				document.getElementsByTagName("body")[0].appendChild(scriptTag);
			} else if (options.dataType === "script") {
				// Load a script file
				var scriptTag = document.createElement("script");
				scriptTag.src= options.url;
				if (options.id) {
					scriptTag.id = options.id;
				}
				if ("onreadystatechange" in scriptTag) {
					scriptTag.onreadystatechange = callbackMethod;
				} else {
					scriptTag.addEventListener("load", callbackMethod);
				}
				document.getElementsByTagName("body")[0].appendChild(scriptTag);
			} else {
				// Use XMLHttpRequest
				if (!options.dataType) options.dataType = "json";
				var request = (typeof XMLHttpRequest != "undefined") ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");

				request.open(options.method, options.url, true);
				if (options.dataType === "json") {
					options.data = JSON.stringify(options.data);
					request.setRequestHeader("Content-Type", "application/json; charset=utf-8");
				} else {
					options.data = JSON.stringify(options.data);
					request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				}

				request.onreadystatechange = function() {
					if (request.readyState !== 4) return;
					if (request.status !== 200 && request.status !== 304) {
						options.error(request.status, request.statusText);
						return;
					}
					response = request.responseText;
					if (!options.responseType || options.responseType === "json") {
						// Auto-convert to JSON if it looks like JSON
						if (request.responseText[0] === "{") {
							var response = JSON.parse(request.responseText);
						}
					}
					options.success(response);
				}
				request.send(options.data);
			}
			function callbackMethod(json) {
				if (this.readyState === "loaded" || this.readyState === "complete") {
					options.success();
				} else if (!this.readyState) {
					options.success(json);
				}
			}
		}(options));
	};

	var _private = {

		//------------------------------------------------
		// Variables
		//------------------------------------------------
		testingElement: null,
		scrollElement: null,

		//------------------------------------------------
		// Constructor
		//------------------------------------------------
		init: function() {
			this.testingElement = document.createElement("div");
			this.checkScrollElement();
		},

		//------------------------------------------------
		// Store a reference to the main scrolling element
		//------------------------------------------------
		checkScrollElement: function() {
			var html = document.documentElement, body = document.body;
			var startY = window.pageYOffset || body.scrollTop || html.scrollTop;
			var newY = startY + 1;
			window.scrollTo(0, newY);
			var element = (html.scrollTop === newY) ? document.documentElement : document.body;
			window.scrollTo(0, startY);
			this.scrollElement = element;
		}
	}

	_private.init();
	return _public;
}());