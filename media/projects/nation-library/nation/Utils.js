//////////////////////////////////////////////////////////////////////////////
// Nation Library
// Core utilities
// Version 2.1.2
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	if (typeof window.NATION === "undefined") window.NATION = {};

	//////////////////////////
	// Depenency Management
	//////////////////////////
	_initClass();
	var packageName = "NATION.Utils";
	window.waitingDependencies = window.waitingDependencies || {};
	// Check for any classes waiting on this one
	for (var className in window.waitingDependencies) {
		for (var propName in window.waitingDependencies[className].dependencies) {
			if (propName === packageName) {
				// Re-run the waiting class' dependency check
				window.waitingDependencies[className].callback();
			}
		}
	}

	//////////////////////////
	// Create Class
	//////////////////////////
	function _initClass() {
		/**
		* ### Dependencies:
		* None
		*
		* ### About:
		* This class features a number of useful utility methods for use around your site
		*
		* @class Utils
		*/
		var Utils = function() {
			/**
			* Instance variables
			* @ignore
			*/
			this.requestID = 0;
			this.testElement = document.createElement("div");
			this.pageElement = null;
		}

		/**
		* Load a URL
		* Note: If loading binary data, a handy reference: http://www.html5rocks.com/en/tutorials/file/xhr2/
		* @param {object} options Object containing required settings. The only required option is 'url' <br />
		* <b>url</b> <i>{string}</i> (Required) The URL to load
		* <b>method</b> <i>{string: "get"}</i> Load the URL via either get or post
		* <b>success</b> <i>{function}</i> A method to call when the URL has been successfully loaded
		* <b>error</b> <i>{function}</i>  A method to call when an error occurs after attempting to load the URL
		* <b>dataType</b> <i>{string}</i> The type of data that will be loaded: "text", json", "jsonp", "script", "arraybuffer", "blob", or "document"
		* <b>data</b> <i>{string/object}</i> Data to send to the server as part of the request. Either a query string or an object of key/value pairs
		* <b>id</b> <i>{string}</i> A unique ID to attach to script loads. Allows author to check document if a script has already loaded before loading it.
		* <b>contentType</b> <i>{string} Override the content type sent to the server in the request's header
		* <b>progress</b> <i>{function}</i> A method to call when load progress occurs. The method will receive a percentage between 0 and 1 representing progress. Only called in IE10+ and modren browsers
		*/
		Utils.prototype.ajax = function(options) {
			// First make sure the options argument is a valid object.
			if (!options || options !== Object(options)) {
				throw new Error(this.ERROR_INVALID_OPTIONS);
			}
			// The URL option is mandatory, so throw an error if this is missing
			if (!options.url) {
				throw new Error(this.ERROR_UNDEFINED_URL);
			}
			// Set default values if options are passed in
			options.method = options.method || "GET";
			options.dataType = options.dataType || "text";
			// Decide which load method is required based on the type of data expected back
			if (options.dataType === "jsonp" || options.dataType === "script") {
				// Load via the script tag
				this.loadScript(options);
			} else {
				// Load via XMLHttpRequest
				this.createRequest(options);
			}
		}

		/**
		* Dynamically generate a namespace from a string
		* @param {string} namespace A namespace string separated by periods
		*/
		Utils.prototype.createNamespace = function(namespace) {
			// Split the passed string into an array separated by periods
			var parts = namespace.split("."), currentPart = "", i = 0, length = parts.length;
			// Created objects are nested, starting with the window object
			var parentObject = window;
			for (; i < length; i++) {
				// Reference to the current string in the array
				currentPart = parts[i];
				// Create a new object for this part if one didn't already exist
				parentObject[currentPart] = parentObject[currentPart] || {};
				// The next object will be a decendant of this one
				parentObject = parentObject[currentPart];
			}
		}

		/**
		* Returns the position of an element relative to the top left of the whole page
		* @param {domelement} element The element to find the position of, relative to the document root
		*/
		Utils.prototype.getOffset = function(element) {
			var bounds = element.getBoundingClientRect();
			return {
				top: bounds.top + window.pageYOffset - (document.documentElement.clientTop || 0),
				left: bounds.left + window.pageXOffset - (document.documentElement.clientLeft || 0)
			};
		}

		/**
		* Returns the position of an element relative to it's nearest positioned parent
		* @param {domelement} element The element to find the position of, relative to it's nearest positioned parent
		*/
		Utils.prototype.getPosition = function(element) {
			return {
				top: element.offsetTop,
				left: element.offsetLeft
			};
		}

		/**
		* Get the value of a style currently on an element
		* @param {domelement} element The element that has the style in question
		* @param {string} property The name of the property style who's value is returned
		* @param {boolean} preventCompute Set to true to return the style as originally defined in the stylesheet. Note that as this temporarily hides the element, it is more than a little abusive, so leave false if you can manage with the computed value
		*/
		Utils.prototype.getStyle = function(element, property, preventCompute) {
			var value = 0;
			if (property === "float") property = "cssFloat";
			property = this.getPrefixedName(property);
			if (!preventCompute) {
				value = window.getComputedStyle(element, null)[property];
				if (value.search(/px|%|em|rem|vh|vw|vmin|vmax|ex|ch/g) > -1) {
					value = parseInt(value, 10);
				}
			} else {
				var originalDisplay = window.getComputedStyle(element, null)["display"];
				var hadStyleApplied = (element.style.display != false);
				element.style.display = "none";
				value = window.getComputedStyle(element, null)[property];
				if (hadStyleApplied) {
					element.style.display = originalDisplay;
				} else {
					element.style.removeProperty("display");
				}
			}
			return value || "";
		}

		/**
		* Set one or more styles on an element
		* @param {domelement} element The DOM element to apply the new styles to
		* @param {object} styles An object of key-value pairs stating each new style's name and it's new value
		*/
		Utils.prototype.setStyle = function(element, styles) {
			var parsedProp = "";
			for (var prop in styles) {
				parsedProp = this.getPrefixedName(prop);
				// If the value after being converted to an int matches the passed value, and this isn't a unitless CSS attribute
				if (parseInt(styles[prop], 10) == styles[prop] && prop.search(/opacity|margin|z-index|zIndex|font-weight|fontWeight|line-height|lineHeight|counter-reset|counterReset|counter-increment|counterIncrement|volume|stress|pitch-range|pitchRange|richness/g) < 0) {
					// This was a pure number, and should be converted to pixels
					styles[prop] += "px";
				}
				if (element.length) {
					for (var i = 0, length = element.length; i < length; i++) {
						element[i].style[parsedProp] = styles[prop];
					}
				} else {
					element.style[parsedProp] = styles[prop];
				}
			}
		}

		/**
		* Get a cookie value by name
		* @param {string} cookieName The name of the cookie to find a value for
		*/
		Utils.prototype.getCookie = function(cookieName) {
			var cookieArray = document.cookie.split("; ");
			var cookies = {}, i = cookieArray.length-1, cookieValue = "";
			for (; i >= 0; i--) {
				cookieValue = cookieArray[i].split("=");
				cookies[cookieValue[0]] = cookieValue[1];
			}
			return cookies[cookieName];
		}

		/**
		* Set a new cookie for the current domain
		* @param {string} cookieName The name of the new cookie
		* @param {string} cookieValue The value the new cookie should contain
		* @param {string} days Optional cookie duration, in days. If left blank, the cookie will act as a session cookie
		*/
		Utils.prototype.setCookie = function(cookieName, cookieValue, days) {
			var expires = "";
			if (days) {
				// Create a new date object
				var date = new Date();
				// Set the time to X days ahead of the current time
				date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
				// Store the new expirey string for later
				expires = "; expires=" + date.toGMTString();
			}
			// Create the new cookie string and set it as a cookie
			document.cookie = cookieName + "=" + cookieValue + expires + ";path=/";
		}

		/**
		* Get the main element that can scroll the whole page
		* @return {domelement} The element that can control the scroll position of the whole page
		*/
		Utils.prototype.getPageElement = function() {
			if (!this.pageElement) {
				// Get the current scroll position
				var startY = window.pageYOffset || document.body.scrollTop;
				// Calculate a test scroll (1px lower than current)
				var testY = startY + 1;
				// Scroll the page to that test value
				window.scrollTo(0, testY);
				// Work out which element changed position - that's the scrollable element
				this.pageElement = (document.documentElement.scrollTop === testY) ? document.documentElement : document.body;
				// Reset the scroll position back to where it was
				window.scrollTo(0, startY);
				// Return the scrollable element
			}
			return this.pageElement;
		}

		/**
		* Check if an element supports a particular event
		* Via Modernizer and http://perfectionkills.com/detecting-event-support-without-browser-sniffing/
		* @param {string} eventName The name of the event to check exists
		* @param {domelement_or_string} element The element that may contain the event. If set as a string, eg. "span", the element matching the string will be created. Leave out to just test a standard div
		*/
		Utils.prototype.isEventSupported = function(eventName, element) {
			var supported = false;
			var fallbackRequired = !("onblur" in document.documentElement);
			// If no event name was passed in, the result will always be false
			if (!eventName) return false;
			if (eventName === "hover") eventName = "mouseover";
			// Ensure there is a valid element to test
			if (!element) {
				element = this.testElement;
			} else if (typeof element === "string") {
				element = document.createElement(element);
			}
			// Append "on" as the method on the element will be named in this style
			eventName = "on" + eventName.toLowerCase();
			supported = eventName in element;
			// If user is using an old version of Firefox, we need a different approach
			if (!supported && fallbackRequired) {
				// Ensure the element in play actually has the setAttribute method
				if (!element.setAttribute) element = document.createElement("div");
				// Set the event name on the element. This will coax old FF into creating a function for a known event
				element.setAttribute(eventName, "");
				// Check if the funciton was created. If it was, the event is known and supported
				supported = typeof element[eventName] === "function";
				// Cleanup the dummy function
				if (element[eventName] !== undefined) element[eventName] = undefined;
				element.removeAttribute(eventName);
			}
			return supported;
		}

		/**
		* Serialise form data
		* @param {domelement} formElement The form element containing fields to serialise
		*/
		Utils.prototype.serializeForm = function(formElement) {
			var field, values = [];
			// Ensure passed element is actually a form
			if (typeof formElement === "object" && formElement.nodeName === "FORM") {
				// Loop through child elements for the form element
				var length = formElement.elements.length, i = 0, j = 0;
				for (; i < length; i++) {
					// Store reference to this field
					field = formElement.elements[i];
					// Only process the field if it is a parsable type, and isn't disabled
					if (field.name && !field.disabled && field.type.toString().indexOf(/file|reset|submit|button/i) < 0) {
						// If the field can have multiple values, we need to step through them
						if (field.type === "select-multiple") {
							// For each value in the field
							for (j = field.length-1; j >= 0; j--) {
								// If this value has been selected
								if (fieldElement.options[j].selected) {
									// Add the new value to the array
									values[values.length] = encodeURIComponent(field.name) + "=" + encodeURIComponentfield.options[j].value;
								}
							}
						} else if (field.type.toString().indexOf(/checkbox|radio/i) < 0 || field.checked) {
							// If this isn't a checkbox/radio button, or if it is and it has been checked, add this value to the array
							values[values.length] = encodeURIComponent(field.name) + "=" + encodeURIComponent(field.value);
						}
					}
				}
			}
			// Convert the array to a string separated by ampersands
			return values.join("&").replace(/%20/g, "+");
		}

		/**
		* Get actual DOM element from a selector
		* @param {domelement_or_string_or_jQuery object} selector A selector string, DOM element, or jQuery object from which to return a matching DOM element
		*/
		Utils.prototype.getDOMElement = function(selector) {
			// If a selector string was passed in, find it in the DOM and return the result
			if (typeof selector === "string") return document.querySelector(selector);
			// If jQuery is present and the selector was a jQuery object, return the native DOM element from that
			if (typeof jQuery !== "undefined" && selector instanceof jQuery) {
				return jQuery(selector)[0];
			} else {
				// Otherwise, just return the selector directly as the DOM element
				return selector;
			}
		}

		/**
		* Return a version of the passed property name that is supported by the current browser
		* This will either be the one passed in, or a prefixed version of it
		* @param {string} propertyName The name of the style that may require a prefix before it works
		*/
		Utils.prototype.getPrefixedName = function(propertyName) {
			var prefixes = ["webkit", "Moz", "ms", "moz"];
			var i = 0, length = prefixes.length, jsName = propertyName;
			// First, get rid of any pre-existing prefix on the passed property name
			for (; i < length; i++) {
				if (jsName.search("-" + prefixes[i] + "-") > -1) {
					// If there was a match for this prefix, remove it so we can generate the right prefix for the current browser
					jsName = jsName.replace("-" + prefixes[i] + "-", "");
					// Now it is known there's no prefix in the passed propertyName, so no need to continue here
					break;
				}
			}
			// Check if the existing property name works in this browser
			if (this.testElement.style[jsName] !== undefined || (jsName === "scrollLeft" || jsName === "scrollTop")) {
				// If so, return it straight back
				return jsName;
			}
			// propertyName isn't natively supported raw, so try adding prefixes
			// First convert the first character to uppercase, as this will come after a prefix
			jsName = (jsName.charAt(0).toUpperCase() + jsName.slice(1));
			// Also replace any dashes followed by a letter with just the uppercased letter
			jsName = this.camelcaseString(jsName, true, true);
			for (i = 0; i < length; i++) {
				// If this prefixed name was found on the style object, it's supported
				if (this.testElement.style[prefixes[i] + jsName] !== undefined) {
					// Return the prefixed property name as it appears on the style object
					return prefixes[i] + jsName;
				}
			}
			// Throw an error here, as otherwise the author will get all sorts of mysterious errors otherwise
			if (propertyName != "transition") throw new Error(this.ERROR_UNSUPPORTED_STYLE.replace("{{property}}", propertyName));
		}

		/**
		* Convert a passed string to camelcase format
		* @param {string} value The string to camelcase
		* @param {boolean} jsProperty True if value should be treated as a code property (remove dashes and uppercase the letter that follows one)
		* @param {boolean} upperFirstChat True if the first character should always be uppercase (overrides jsProperty, when true, so that the first character is uppercase)
		*/
		Utils.prototype.camelcaseString = function(value, jsProperty, upperFirstChar) {
			if (!jsProperty) {
				// Standard camelcasing
				return value.replace(/(?:^\w|[A-Z]|\b\w|)/g, function(match, index) {
					if (+match === 0) return "";
					return match.toUpperCase();
				});
			} else {
				// Replace a dash followed by a letter with just an uppercase letter
				value = value.replace(/\-[a-zA-Z]|\s[a-zA-Z]|\s+/g, function(match, index) {
					return match.replace(/-|\s/g, "").toUpperCase();
				});
				if (!upperFirstChar) {
					value = value.charAt(0).toLowerCase() + value.substring(1);
				}
				return value;
			}
		}

		/**
		* Error strings
		* @ignore
		*/
		Utils.prototype.ERROR_INVALID_OPTIONS = "NATION.Utils: ajax argument 'options' is not a valid object";
		Utils.prototype.ERROR_UNDEFINED_URL = "NATION.Utils: ajax argument 'options.url' is undefined";
		Utils.prototype.ERROR_INVALID_DATA = "Nation.Utils: ajax argument 'options.data' must be either a querystring or an object consisting of key/value pairs";
		Utils.prototype.ERROR_REQUEST_FAILED = "NATION.Utils: ajax load failed wth error code '{{status}}' and response '{{response}}'";
		Utils.prototype.ERROR_UNSUPPORTED_STYLE = "NATION.Utils: This browser does not support the CSS property '{{property}}'";

		/**
		* Ensures data is in query string format
		* @ignore
		*/
		Utils.prototype.prepareRequestData = function(data) {
			if (typeof data !== "string") {
				// If options.data wasn't a string, and isn't an object, throw an error
				if (data !== Object(data)) {
					throw new Error(this.ERROR_INVALID_DATA);
				}
				// Convert the object to a valid query string
				data = this.objectToQueryString(data);
			}
			return data;
		}

		/**
		* Load data via the script tag
		* @ignore
		*/
		Utils.prototype.loadScript = function(options) {
			// Create script element used to load this URL
			var scriptTag = document.createElement("script");
			// If the id option was populated, apply it to the script tag
			if (options.id) {
				scriptTag.setAttribute("id", options.id);
			}
			// Create a new request ID for this script
			if (options.dataType === "jsonp") options.id = this.requestID = this.requestID + 1;
			// If a query string doesn't already exist, start one
			if (options.url.indexOf("?") < 0) options.url += "?";
			// If the ? isn't right at the end of the string, that means there is already a query string there
			// So an ampersand is needed to continue the chain
			if (options.url.indexOf("?") !== options.url.length-1) options.url += "&";
			if (options.data) {
				// Make sure the passed data is a query string
				options.data = this.prepareRequestData(options.data);
				// Add the data to the url in query string format
				options.url += options.data;
				// Add an extra ampersand to prepare for the callback argument
				if (options.dataType === "jsonp") options.url += "&";
			}
			if (options.success && options.dataType !== "jsonp") {
				scriptTag.addEventListener("load", options.success);
			}
			// Add the callback name to the query string
			if (options.dataType === "jsonp") options.url += "callback=NATION.jsonpCallback" + options.id;
			
			// Create a callback if request is a JSONP request
			if (options.dataType === "jsonp") {
				// Create a dynamically named method to keep the callback reference unique
				NATION["jsonpCallback" + options.id] = function(response) {
					// Make sure the response was actually a JSON object, then parse it
					if (response[0] === "{") response = JSON.parse(response); 
					// Call the success method, assuming one exists
					if (options.success) options.success(response);
					// Remove the original script tag from the DOM, since it's no longer required
					// This is only done as this is a JSONP load - normal script tags remain in place
					document.getElementsByTagName("body")[0].removeChild(scriptTag);
					// Delete the callback method, as it's no longer needed
					delete NATION["jsonpCallback" + options.id];
				}
			}
			// Set the script tag source with the final url
			scriptTag.setAttribute("src", options.url);
			// Add the completed tag to the page
			document.getElementsByTagName("body")[0].appendChild(scriptTag);
		}

		/**
		* Handle potential errors in XMLHttpRequest calls
		* @ignore
		*/
		Utils.prototype.handleRequestError = function(request, options) {
			if (!request.status || (request.status !== 200 && request.status !== 304)) {
				if (options.error) {
					options.error(request.status, request.statusText);
				} else if (console && console.warn) {
					// Otherwise if console.warn is available, show the error information there
					console.warn(this.ERROR_REQUEST_FAILED.replace("{{status}}", request.status).replace("{{response}}", request.response));
				}
				return true;
			} else {
				return false;
			}
		}

		/**
		* Load data using XMLHttpRequest
		* @ignore
		*/
		Utils.prototype.createRequest = function(options) {
			// Instantiate XMLHttpRequest object
			var request = new XMLHttpRequest();
			request.open(options.method, options.url, true);
			// Convert the passed data to a query string if required
			if (options.data) {
				options.data = this.prepareRequestData(options.data);
				// Set the content type header, since this request is sending data
				if (!options.contentType) options.contentType = "application/x-www-form-urlencoded; charset=UTF-8";
				request.setRequestHeader("Content-type", options.contentType);
			}
			var binaryRequested = (options.dataType.indexOf(/text|arraybuffer|blob|document/i) > -1);
			var scope = this;
			// Handle request state changes
			if (request.upload) {
				// XMLHttpRequest level 2 supported
				if (binaryRequested) {
					// Set the response type of the request to a binary format if required
					request.responseType = options.dataType;
				}
				request.addEventListener("load", function(e) {
					// If the result was something other than a success, handle the error
					if (scope.handleRequestError(request, options)) {
						// Stop executing this method
						return;
					}
					var response = request.responseText;
					// Check the loaded data and handle it appropriately
					if (binaryRequested) {
						// Don't touch the response, since some form of binary data was requested
						response = request.response;
					} else if (options.dataType === "json" && response[0] === "{") {
						// Parse the response as json if required
						response = JSON.parse(response);
					}
					// Call the success method with the response
					if (options.success) options.success(response);
				});
				request.addEventListener("error", function(e) {
					// If the URL couldn't be loaded, handle the error
					scope.handleRequestError(request, options);
				});
				if (options.progress) {
					// If a progress callback was in options, listen for progress events
					request.addEventListener("progress", function(e) {
						// If a percentage can be calculated
						if (e.lengthComputable) {
							// call the progress callback with the updated load percentage
							options.progress(e.loaded/e.total);
						}
					});
				}
			} else {
				// XMLHttpRequest level 1 supported. This will be depreciated when IE9 support drops out.
				if (binaryRequested) {
					// Hack to pass byte data through unprocessed
					request.overrideMimeType('text/plain; charset=x-user-defined');
				}
				request.onreadystatechange = function() {
					// Do nothing if the request has not yet completed
					if (request.readyState !== 4) return;
					// If the result was something other than a success, handle the error
					if (scope.handleRequestError(request, options)) {
						// Stop executing this method
						return;
					}
					// Parse the response as json if required
					var response = request.responseText;
					if (options.dataType === "json" && response[0] === "{") response = JSON.parse(response); 
					// Call the success method with the response
					if (options.success) options.success(response);
				}
			}
			// Send the request to the server
			request.send(options.data);
		}

		/**
		* Converts an object to a valid query string
		* @ignore
		*/
		Utils.prototype.objectToQueryString = function(data) {
			// Loop through each value in the data object
			return Object.keys(data).map(function(key) {
				// This value was an array, so join those values together
				if (typeof data[key] === "Array") {
					data[key] = data[key].join("&");
				}
				// Return the new key/value as part of the string
				return encodeURIComponent(key) + "=" + encodeURIComponent(data[key]);
			}).join("&");
		}

		window.NATION.Utils = new Utils();
	}

	// requestAnimationFrame polyfill
	// Will be removed when IE9 support is dropped
	if (!window.requestAnimationFrame) {
		var lastTime = 0;
		window.requestAnimationFrame = function(callback, element) {
			var currentTime = Date.now();
			var timeToCall = Math.max(0, 16 - Math.abs(currentTime - lastTime));
			var id = window.setTimeout(function() {callback(currentTime + timeToCall); }, timeToCall);
			lastTime = currentTime + timeToCall;
			return id;
		}
	}
	if (!window.cancelAnimationFrame) {
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		}
	}

}(window, document, undefined));