//////////////////////////////////////////////////////////////////////////////
// Nation Library
// Accordion
// Version 2.3.6
// Dependencies: NATION.Utils, NATION.EventDispatcher
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	if (typeof window.NATION === "undefined") window.NATION = {};

	//////////////////////////
	// Depenency Management
	//////////////////////////
	function checkDependencies() {
		var packageName = "NATION.Accordion";
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
		* [NATION.VerticalScrollbar](VerticalScrollbar.js.html) if scrollbars required
		* Either [NATION.Animation](Animation.js.html) or jQuery
		*
		* ### About:
		* A basic accordion with optional scrollbar support
		*
		* Header/content pairs are identified by using the class 'js-header' or 'header' for the clickable titles, and 'js-content' or 'content' for the expandable content areas. These are generally expected to sit next to each other as siblings
		*
		* Both the header element and the content element will have class 'active' added to them when they are open. This allows for style changes to open panels/headers via CSS
		*
		* @class Accordion
		* @param {domelement_or_jqueryobject} selector The element that wraps the accordion contents, containing pairs of elements with classes 'js-header'/'header' and 'js-content/content'
		* @param {object} options Object contianing required options for this accordion<br />
		* <b>animateTransitions</b> <i>{boolean: true}</i> Indicates whether to open/close sections with animation using either NATION.Animation or jQuery, or not
		* <b>duration</b> <i>{number: 400}</i> The time a panel takes to animate open/closed
		* <b>easing</b> <i>{string: "linear"}</i> The easing function to use when opening and closing sections
		* <b>openPanel</b> <i>{number: -1}</i> Zero-indexed ID of the panel to have opened by default. If left at the default of -1, all sections will be initially closed
		* <b>maxPanelHeight</b> <i>{number: -1}</i> The maximum height a panel can open to before a scrollbar is enabled
		* <b>scrollbarTemplateID</b> <i>{string: ""}</i> An ID referencing a JavaScript template on the current page, containing the HTML for a scrollbar. Must contain classes 'js-scrollbar'/'scrollbar', 'js-track'/'track', and js-handle'/'handle'. If left blank, the default template will be used
		* <b>enableMouseLock</b> <i>{boolean: false}</i> If true, scrolling the mousewheel when hovered over a panel with a scrollbar will not scroll the main page even when the panel's scrollbar is at the top or bottom
		* <b>autoScroll</b> <i>{boolean: false}</i> If true, the window will be automatically scrolled so that the clicked header is at the top of the viewport
		* <b>autoScrollOffset</b> <i>{number: 0}</i> If autoScroll is true, this number represents the distance from the top of the browser to stop at, in pixels
		* @jsFiddle //jsfiddle.net/NationStudio/dptkd4bp/embedded/
		*/
		var Accordion = function(selector, options) {
			// Call the super's constructor
			NATION.EventDispatcher.call(this);
			this.__DOMElement = NATION.Utils.getDOMElement(selector);
			this.options = {
				duration: 400,
				easing: "linear",
				animateTransitions: true,
				openPanel: -1,
				maxPanelHeight: -1,
				scrollbarTemplateID: "",
				enableMouseLock: false,
				autoScroll: false,
				autoScrollOffset: 0
			};
			if (options) {
				for (var optionName in options) {
					this.options[optionName] = options[optionName];
				}
			}
			// Backwards compatibility
			if (options.firstPanelOpen) this.options.openPanel = 0;
			// Prioritise the Nation Animation lib if it exists
			this.jQueryMode = (typeof jQuery !== "undefined" && typeof NATION.Animation === "undefined");
			this.scrollbarTemplate = '<div class="js-scrollbar"><div class="js-track"></div><a href="#" class="js-handle"></a></div>';
			this.openPanelID = -1;
			this.autoScrolling = false;
			this.enabled = true;
			this.handler_windowScrolled = null;
			this.resizeTimer = null;
			this.scrollbars = [];
			this.setup();
		}

		Accordion.prototype = Object.create(NATION.EventDispatcher.prototype);
		Accordion.prototype.constructor = Accordion;

		/**
		* Event that fires when a panel has finished opening
		*/
		Accordion.prototype.PANEL_OPEN_COMPLETE = "PanelOpenComplete";
		/**
		* Event that fires when a panel has finished closing
		*/
		Accordion.prototype.PANEL_CLOSE_COMPLETE = "PanelCloseComplete";
		/**
		* Event that fires when a header element has been clicked
		*/
		Accordion.prototype.HEADER_CLICKED = "HeaderClicked";
		/**
		* Event that fires each frame of an open/close animation
		*/
		Accordion.prototype.PANEL_RESIZED = "PanelResized";

		/**
		* Returns the zero-indexed ID of the currently open panel. Returns -1 if no panel is currently open
		* @return {number} Zero-indexed ID of the currently open panel
		*/
		Accordion.prototype.getOpenPanelID = function() {
			return this.openPanelID;
		}

		/**
		* Returns the total number of clickable headers
		* @return {number} A non-zero-indexed number
		*/
		Accordion.prototype.getTotalSections = function() {
			return this.__clickableHeaders.length;
		}

		/**
		* Open a panel by it's zero-indexed ID
		* @param {number} index The zero-indexed ID of the panel to open
		* @param {boolean} immediate If set to true, the panel will open without animation
		*/
		Accordion.prototype.openPanel = function(index, immediate) {
			if (this.openPanelID >= 0) {
				this.closePanel(this.openPanelID, immediate);
			}
			var panel = this.__contentPanels[index];
			panel.style.display = "block";
			if (this.__clickableHeaders[index].className.search("active") < 0) {
				this.__clickableHeaders[index].className += " active";
			}
			if (panel.className.search("active") < 0) {
				panel.className += " active";
			}
			var newHeight = panel.children[0].offsetHeight;
			if (this.options.maxPanelHeight > 0 && newHeight > this.options.maxPanelHeight) {
				newHeight = this.options.maxPanelHeight;
			}
			if (this.options.maxPanelHeight > -1 && this.scrollbars[index]) {
				this.scrollbars[index].setPosition(0);
			}
			var headerOffset = 0;
			if (this.options.autoScroll) {
				this.autoScrolling = true;
				headerOffset = NATION.Utils.getOffset(this.__clickableHeaders[index]).top;
				headerOffset -= this.options.autoScrollOffset;
				if (this.openPanelID > -1 && this.openPanelID < index) {
					var heightToRemove = (this.options.maxPanelHeight > 0) ? this.options.maxPanelHeight : this.__contentPanels[this.openPanelID].children[0].offsetHeight;
					headerOffset -= heightToRemove;
				}
				this.listenForWindowScrolling();
			}
			if (immediate) {
				panel.style.height = newHeight + "px";
				if (this.options.autoScroll) {
					NATION.Utils.getPageElement().style.scrollTop = headerOffset + "px";
				}
				this.onPanelOpenComplete();
			} else {
				if (!this.jQueryMode) {
					if (this.options.autoScroll) {
						NATION.Animation.start(NATION.Utils.getPageElement(), {scrollTop: headerOffset}, {duration: this.options.duration, easing: this.options.easing}, this.onAutoScrollComplete.bind(this));
					}
					NATION.Animation.start(panel, {height: newHeight}, {duration: this.options.duration, easing: this.options.easing, progress: this.onPanelResizeInProgress.bind(this)}, this.onPanelOpenComplete.bind(this));
				} else {
					if (this.options.autoScroll) {
						$(window).stop().animate({scrollTop: headerOffset}, {
							duration: this.options.duration, 
							easing: this.options.easing, 
							progress: this.onPanelResizeInProgress.bind(this),
							complete: this.onAutoScrollComplete.bind(this, e.target)
						});
					}
					$(panel).stop().animate({height: newHeight}, this.options.duration, this.options.easing, this.onPanelOpenComplete.bind(this));
				}
			}
			this.openPanelID = index;
		}

		/**
		* Close a panel by it's zero-indexed ID
		* @param {number} index The zero-indexed ID of the panel to close
		* @param {boolean} immediate If set to true, the panel will close without animation
		*/
		Accordion.prototype.closePanel = function(index, immediate) {
			this.autoScrolling = false;
			if (this.openPanelID === index) this.stopListeningForWindowScrolling();
			this.__clickableHeaders[index].className = this.__clickableHeaders[index].className.replace(/ active|active/g, "");
			this.__contentPanels[index].className = this.__contentPanels[index].className.replace(/ active|active/g, "");
			var panel = this.__contentPanels[index];
			panel.style.display = "block";
			if (immediate) {
				panel.style.height = 0;
				this.onPanelCloseComplete(panel);
			} else {
				if (!this.jQueryMode) {
					panel.style.height = panel.offsetHeight + "px";
					NATION.Animation.start(panel, {height: 0}, {duration: this.options.duration, easing: this.options.easing, progress: this.onPanelResizeInProgress.bind(this)}, this.onPanelCloseComplete.bind(this));
				} else {
					$(panel).stop().animate({height: 0}, {
						duration: this.options.duration, 
						easing: this.options.easing, 
						progress: this.onPanelResizeInProgress.bind(this),
						complete: this.onPanelCloseComplete.bind(this, e.target)
					});
				}
			}
		}

		/**
		* Re-enable accordion functionality. This will close all panels, except when reopenPanel is set to true, which will keep the previously open panel open.
		* @param {boolean} reopenPanel Keep open, or re-open, the panel that was last open when the disable method was called
		*/
		Accordion.prototype.enable = function(reopenPanel) {
			if (!this.enabled) {
				this.enabled = true;
				var i = 0, length = this.__contentPanels.length;
				for (; i < length; i++) {
					this.__contentPanels[i].style.overflow = "hidden";
					// Re-enable the scrollbar
					if (this.options.maxPanelHeight > -1 && this.scrollbars[i]) {
						this.scrollbars[i].enable();
						this.__contentPanels[i].children[0].style.maxHeight = this.options.maxPanelHeight + "px";
						this.__contentPanels[i].querySelector(".js-scrollbar, .scrollbar").style.removeProperty("display");
						this.scrollbars[i].resize();
					}

					if (i !== this.openPanelID || !reopenPanel) {
						this.__contentPanels[i].style.height = 0;
						this.__contentPanels[i].style.display = "none";
					} else if (reopenPanel) {
						this.openPanel(this.openPanelID, true);
					}
				}
			}
		}

		/**
		* Disable all accordion functionality on the content. This opens all panels to their full height, and ignores clicks on header
		*/
		Accordion.prototype.disable = function() {
			if (this.enabled) {
				this.enabled = false;
				var i = 0, length = this.__contentPanels.length;
				for (; i < length; i++) {
					this.__contentPanels[i].style.removeProperty("height");
					this.__contentPanels[i].style.removeProperty("display");
					this.__contentPanels[i].style.removeProperty("overflow");
					this.__contentPanels[i].className = this.__contentPanels[i].className.replace(/ active|active/g, "");
					this.__clickableHeaders[i].className = this.__clickableHeaders[i].className.replace(/ active|active/g, "");
					// Disable the scrollbar
					if (this.options.maxPanelHeight > -1 && this.scrollbars[i]) {
						this.scrollbars[i].disable();
						this.__contentPanels[i].children[0].style.removeProperty("max-height");
						this.__contentPanels[i].querySelector(".js-scrollbar, .scrollbar").style.display = "none";
					}
				}
			}
		}

		/**
		* Change the maximum possible height of a panel
		* @param height The new maximum height, in pixels
		*/
		Accordion.prototype.setMaxPanelHeight = function(height) {
			this.options.maxPanelHeight = height;
			if (this.openPanelID > -1) {
				// Force the currently open panel to be re-opened with the new maxHeight
				this.openPanel(this.openPanelID, true);
			}
		}

		/**
		* Re-initialise the accordion. Useful if the content of the accordion
		* has been dynamically changed
		*/
		Accordion.prototype.refresh = function() {
			this.destroy();
			this.openPanelID = -1;
			this.options.openPanel = -1;
			this.setup();
			this.enable();
		}

		/**
		* Disable, remove all listeners, and kill off this instance of the class. Permanent!
		*/
		Accordion.prototype.destroy = function() {
			this.disable();
			var i = 0, length = this.__clickableHeaders.length;
			for (; i < length; i++) {
				this.__clickableHeaders[i].removeEventListener("click", this.handler_headerClicked);
			}
			window.removeEventListener("resize", this.handler_windowResized);
			this.stopListeningForWindowScrolling();
		}

		/**
		* Error messages
		* @ignore
		*/
		Accordion.prototype.ERROR_MISSING_ELEMENT = "NATION.Accordion: Selector is missing a child with class name '{{className}}'.";
		Accordion.prototype.ERROR_MISSING_TEMPLATE_CLASS = "NATION.Accordion: The provided scrollbar template does not contain an element with the required class '{{className}}'";

		/**
		* Perform initial setup
		* @ignore
		*/
		Accordion.prototype.setup = function() {
			// Get references to all clickable headers
			this.__clickableHeaders = this.__DOMElement.querySelectorAll(".js-header, .header");
			if (this.__clickableHeaders.length <= 0) {
				throw new Error(this.ERROR_MISSING_ELEMENT.replace("{{className}}", ".js-header"));
			}
			// Get references to all matching content panels
			this.__contentPanels = this.__DOMElement.querySelectorAll(".js-content, .content");
			if (this.__contentPanels.length <= 0) {
				throw new Error(this.ERROR_MISSING_ELEMENT.replace("{{className}}", ".js-content"));
			}
			// Ensure each header and panel has the correct starting style
			this.prepareContent();
			// If a panel should start out open (as defined in the options argument), open it without transition
			if (this.options.openPanel > -1) this.openPanel(this.options.openPanel, true);
			// Listen for header clicks
			this.createListeners();
			// Perform an initial resize
			this.resize();
		}

		/**
		* Listen for header elements being clicked
		* @ignore
		*/
		Accordion.prototype.createListeners = function() {
			var i = 0, length = this.__clickableHeaders.length;
			this.handler_headerClicked = this.onHeaderClicked.bind(this);
			for (; i < length; i++) {
				this.__clickableHeaders[i].addEventListener("click", this.handler_headerClicked);
			}
			this.handler_windowResized = this.onWindowResized.bind(this);
			window.addEventListener("resize", this.handler_windowResized);
		}

		/**
		* Listen for the user using the mouse wheel during an auto-scroll
		* @ignore
		*/
		Accordion.prototype.listenForWindowScrolling = function() {
			if (this.options.autoScroll) {
				this.handler_windowScrolled = this.onWindowScrolled.bind(this);
				window.addEventListener("wheel", this.handler_windowScrolled);
				window.addEventListener("DOMMouseWheel", this.handler_windowScrolled);
			}
		}

		/**
		* Stop listening for the user using the mouse wheel during an auto-scroll
		* @ignore
		*/
		Accordion.prototype.stopListeningForWindowScrolling = function() {
			window.removeEventListener("wheel", this.handler_windowScrolled);
			window.removeEventListener("DOMMouseWheel", this.handler_windowScrolled);
		}

		/**
		* Override the default template if a custom one was passed in
		* @ignore
		*/
		Accordion.prototype.selectScrollbarTemplate = function() {
			if (this.options.scrollbarTemplateID) {
				this.scrollbarTemplate = document.getElementById(this.options.scrollbarTemplateID).innerHTML;
				// Check template for the required classnames
				if (this.scrollbarTemplate.search(/js-scrollbar|scrollbar/g) < 0) {
					throw new Error(this.ERROR_MISSING_TEMPLATE_CLASS.replace("\{\{className\}\}", ".js-scrollbar"));
				}
			}
		}

		/**
		* Create scrollbars where required and set some required styles
		* @ignore
		*/
		Accordion.prototype.prepareContent = function() {
			if (this.options.maxPanelHeight > -1) this.selectScrollbarTemplate();
			var i = 0, length = this.__contentPanels.length, scrollbar, __content, __scrollbar;
			for (; i < length; i++) {
				// Add the scrollbar template to each panel if required
				if (this.options.maxPanelHeight > -1) {
					this.__contentPanels[i].innerHTML = this.__contentPanels[i].innerHTML + this.scrollbarTemplate;
					__scrollbar = this.__contentPanels[i].querySelector(".js-scrollbar, .scrollbar");
				}
				__content = this.__contentPanels[i].children[0];
				__content.style.overflow = "hidden";
				if (this.options.maxPanelHeight > -1) {
					__content.style.maxHeight = this.options.maxPanelHeight + "px";
				}
				// Ensure that the panel height isn't initally zero
				this.__contentPanels[i].style.height = "auto";
				this.__contentPanels[i].style.display = "block";
				// Create the scrollbar if required
				if (__scrollbar) {
					// Add a wrapper around the content, to allow VerticalScrollbar to work properly
					if (__content.children.length > 1) {
						__content.innerHTML = "<div>" + __content.innerHTML + "</div>";
					}
					this.scrollbars.push(new NATION.VerticalScrollbar(__content, __scrollbar, {enableMouseLock: this.options.enableMouseLock}));
				} else {
					this.scrollbars.push(null);
				}
				// Re-hide the content
				this.__contentPanels[i].style.overflow = "hidden";
				this.__contentPanels[i].style.display = "none";
				this.__contentPanels[i].style.height = 0;
			}
		}

		/**
		* Resize each scrollbar, ensuring it's container is visible while doing so
		* @ignore
		*/
		Accordion.prototype.resize = function() {
			if (this.resizeTimer) {
				clearTimeout(this.resizeTimer);
				this.resizeTimer = null;
			}
			if (this.enabled) {
				if (this.scrollbars.length) {
					var i = 0, length = this.__contentPanels.length;
					for (; i < length; i++) {
						if (this.scrollbars[i]) {
							if (this.openPanelID !== i) {
								this.__contentPanels[i].style.height = "auto";
								this.__contentPanels[i].style.display = "block";
							}
							this.scrollbars[i].resize();
							if (this.openPanelID !== i) {
								this.__contentPanels[i].style.height = 0;
								this.__contentPanels[i].style.display = "none";
							}
						}
					}
				}
			}
		}

		/**
		* Expand or contract selected content
		* @ignore
		*/
		Accordion.prototype.onHeaderClicked = function(e) {
			if (this.enabled) {
				var clickedIndex = -1, i = 0, length = this.__clickableHeaders.length;
				for (; i < length; i++) {
					if (this.__clickableHeaders[i] === e.currentTarget) {
						clickedIndex = i;
						break;
					}
				}
				if (this.openPanelID !== clickedIndex) {
					this.openPanel(clickedIndex, !this.options.animateTransitions);
				} else {
					this.closePanel(clickedIndex, !this.options.animateTransitions);
					this.openPanelID = -1;
				}
				this.trigger(this.HEADER_CLICKED);
				e.preventDefault();
			}
		}

		/**
		* Hide panel completely then signal that close has finished
		* @ignore
		*/
		Accordion.prototype.onPanelCloseComplete = function(panel) {
			panel = (panel.target) ? panel.target : panel;
			panel.style.display = "none";
			this.trigger(this.PANEL_CLOSE_COMPLETE);
		}

		/**
		* Fire an event each frame of an open/close animation
		* @ignore
		*/
		Accordion.prototype.onPanelResizeInProgress = function(progress) {
			this.trigger(this.PANEL_RESIZED);
		}

		/**
		* Resize on a timer to limit DOM interaction
		* @ignore
		*/
		Accordion.prototype.onWindowResized = function(e) {
			if (!this.resizeTimer) {
				this.resizeTimer = setTimeout(this.resize.bind(this), 20);
			}
		}

		/**
		* Signal a panel has finished opening
		* @ignore
		*/
		Accordion.prototype.onPanelOpenComplete = function(e) {
			if (this.options.maxPanelHeight < 0 && this.openPanelID > -1) {
				this.__contentPanels[this.openPanelID].style.removeProperty("height");
			}
			this.trigger(this.PANEL_OPEN_COMPLETE);
		}

		/**
		* Update auto-scroll status
		* @ignore
		*/
		Accordion.prototype.onAutoScrollComplete = function(e) {
			this.autoScrolling = false;
			this.stopListeningForWindowScrolling();
		}

		/**
		* Stop an auto-scroll if one was in progress
		* @ignore
		*/
		Accordion.prototype.onWindowScrolled = function(e) {
			if (this.autoScrolling) {
				this.autoScrolling = false;
				if (!this.jQueryMode) {
					NATION.Animation.stop(NATION.Utils.getPageElement());
				} else {
					$(NATION.Utils.getPageElement()).stop();
				}
				this.stopListeningForWindowScrolling();
			}
		}

		window.NATION.Accordion = Accordion;
	}

}(window, document, undefined));