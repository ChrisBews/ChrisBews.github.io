//////////////////////////////////////////////////////////////////////////////
// Nation Library
// Dropdown
// Version 2.2.2
// Dependencies: NATION.Utils, NATION.EventDispatcher
// Optional Dependency: NATION.VerticalScrollbar
// Author: Chris Bews
//////////////////////////////////////////////////////////////////////////////

(function(window, document, undefined) {

	"use strict";

	if (typeof window.NATION === "undefined") window.NATION = {};

	var loadComplete = false;

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

	function _initClass() {
		/**
		* ### Dependencies:
		* [NATION.Utils](Utils.js.html)
		* [NATION.EventDispatcher](EventDispatcher.js.html)
		* Optionally [NATION.VerticalScrollbar](VerticalScrollbar.js.html) if you want a scrollbar
		*
		* ### About:
		* JavaScript downdown menu with optional scrollbar (via NATION.VerticalScrollbar)
		*
		* There are two ways this class can work:
		* * It can act on existing HTML (inside selector) and make it function as a dropdown
		* * It can mirror an actual form select element, and keep both synched
		*
		* ### Creating a custom dropdown template
		* If you want to use HTML other than the default, you'll need to either define a template inside your selector (if not mirroring a select field), or define one in a JavaScript template tag, and reference it by ID.
		* 
		* If you're not mirroring a select field, the only tag that needs to be in your HTML is {{defaultOption}}, which should be inside the .js-current element. This is where the code will insert the currently selected option text
		*
		* If you ARE mirroring a select field, your template needs a few more tags in addition:
		* * {{#each options}} - Start of the loop to generate all the different options
		* * {{this.optionValue}} - This is where the select's option 'value' attribute is inserted. Currently this has to be the href attribute of an anchor
		* * {{this.optionLabel}} - This is where the select's option's textContent is inserted. Basically the visible text that the user sees for the option
		* * {{/each}} - End of the option loop
		*
		* @class Dropdown
		* @param {domelement_or_querystring_or_jqueryobject} selector either empty (for select element mirroring), or containing ".js-options"/".options" with the dropdown choices, and ".js-current"/".current" to display the active option. If a scrollbar is desired, it should also contain ".js-scrollable"/".scrollable", ".js-scrollbar"/".scrollbar", ".js-track"/".track", and ".js-handle"/".handle"
		* @param {object} options Object containing the settings for this dropdown<br />
		* <b>label</b> <i>{string: ""}</i> Copy to show in ".js-current"/".current" before an option has been selected. If left empty, the first option in the dropdown will be shown instead
		* <b>selectElement</b> <i>{domelement_or_querystring_or_jqueryobject}</i> If this dropdown should mirror and sync with a real (hidden) form select element, set this option to that select element
		* <b>templateID</b> <i>{string: ""}</i> ID to a JavaScript template in the current page that contains HTML for the dropdown's markup. If left unset, the default template will be used, unless 'selector' already contains dropdown HTML
		* <b>maxHeight</b> <i>{number: 200}</i> Max height of the dropdown when open. Only used if a scrollbar is enabled
		* <b>mobileMode</b> <i>{boolean: false}</i> When true, and the dropdown is mirroring a select element, clicking the dropdown will just trigger the default select element behaviour
		* <b>enableMouseLock</b> <i>{boolean: true}</i> If true, and a scrollbar is in use, scrolling the mouse wheel while hovering over the open dropdown wont scroll the page
		* @jsFiddle //jsfiddle.net/NationStudio/v2vg8kc4/embedded/
		*/
		var Dropdown = function(selector, options) {
			// Call the super's constructor
			NATION.EventDispatcher.call(this);
			this.__DOMElement = NATION.Utils.getDOMElement(selector);
			this.options = {
				label: "",
				selectElement: null, // Replaced formElementSelector
				templateID: "",
				maxHeight: 200,
				mobileMode: false,
				enableMouseLock: true
			};
			this.selectedOptionID = -1;
			this.defaultLabel = "";
			this.scrollbar = null;
			this.__scrollableContent = null;
			this.__currentSelection = null;
			this.__dropdownPane = null;
			this.__scrollbarElement = null;
			this.__options = [];
			this.__formOptions = [];
			this.selectedOptionLabel = "";
			this.selectedOptionValue = "";
			this.openState = false;
			this.mouseDown = false;
			this.startingID = -1;
			this.firstCharMatches = {};
			this.totalFirstCharMatches = {};
			this.characterSearch = "";
			this.characterSearchIndex = 0;
			this.defaultTemplate = '<a href="#" class="js-current">{{defaultOption}}</a>' +
									'<div class="js-options"><div class="js-scrollable"><ul>' + 
									'{{#each options}}' + 
										'<li><a href="{{this.optionValue}}">{{this.optionLabel}}</a></li>' +
								    '{{/each}}' + 
								    '</ul>' +
				   					'</div>' +
				   					'<div class="js-scrollbar">' +
				   					'<div class="js-track"><a class="js-handle" href="#"></a></div>' +
				   					'</div>';
			if (options) {
				for (var optionName in options) {
					this.options[optionName] = options[optionName];
				}
			}
			// Depreciated option, renamed to mobileMode
			if (options.useMobileDropdown) {
				this.options.mobileMode = true;
			}
			// formElementSelector maintained for backwards compatibility
			if (this.options.formElementSelector) {
				this.options.selectElement = this.options.formElementSelector;
			}
			// Store a direct reference to the form element this dropdown will interact with
			if (this.options.selectElement) {
				this.__formElement = NATION.Utils.getDOMElement(this.options.selectElement);
			}
			if (this.options.label) {
				this.defaultLabel = this.options.label;
			}
			// Create a dropdown immitating (and interacting with) a real form element select field
			if (this.__formElement) {
				this.__formOptions = this.__formElement.querySelectorAll("option");
				this.createDropdown();
			} else {
				// Just take the existing dropdown code, and make it interactive:
				// Store references to all possible dropdown options
				// We only need to do this here if the dropdown isn't based off a form element
				// As otherwise this method is run inside the createDropdown method
				this.getDropdownElements();
				this.prepareExistingDropdown();
			}
			// Store a reference to the dropdown pane, and hide it's overflow
			this.__dropdownPane = this.__DOMElement.querySelector(".js-options, .options, .content");
			if (!this.__dropdownPane) {
				throw new Error(this.ERROR_MISSING_ELEMENT.replace("{{className}}", ".js-options"));
			}
			this.__dropdownPane.style.overflow = "hidden";
			// Generate array of first character matches
			if (!this.options.mobileMode) {
				this.calculateFirstCharMatches();
			}
			// Store the label of the currently selected value
			this.setActiveOptionByLabel(this.defaultLabel);
			this.checkForScrollbar();
			this.disableOptionFocusIn();
			this.createListeners();
			// Hide the pane if in mobile mode, as it's never used
			if (this.options.mobileMode) {
				this.__dropdownPane.style.display = "none";
			}
		}

		Dropdown.prototype = Object.create(NATION.EventDispatcher.prototype);
		Dropdown.prototype.constructor = Dropdown;

		/**
		* Event that fies when a new option is selected by the user
		*/
		Dropdown.prototype.SELECTED = "Selected";
		/**
		* Event that fires when an option is selected by the user that is already selected
		*/
		Dropdown.prototype.RESELECTED = "Reselected";
		/**
		* Event that fires when the dropdown opens
		*/
		Dropdown.prototype.OPENED = "Opened";
		/**
		* Event that fires when the dropdown closes
		*/
		Dropdown.prototype.CLOSED = "Closed";

		/**
		* Returns the currently selected option's value
		* @return {string}
		*/
		Dropdown.prototype.getSelectedOptionValue = function() {
			return this.selectedOptionValue;
		}

		/**
		* Returns the visible text for the currently selected option
		* @return {string}
		*/
		Dropdown.prototype.getSelectedOptionLabel = function() {
			return this.selectedOptionLabel;
		}

		/**
		* Returns the zero-indexed ID of the currently selected option
		* @return {number}
		*/
		Dropdown.prototype.getSelectedOptionID = function() {
			return this.selectedOptionID;
		}

		/**
		* Returns whether the dropdown is open or not
		* @return {boolean}
		*/
		Dropdown.prototype.isOpen = function() {
			return this.openState;
		}

		/**
		* Opens the dropdown pane
		*/
		Dropdown.prototype.open = function() {
			// Switch the 'current' element to it's active state
			this.__currentSelection.className += " active";
			// Reveal the dropdown by removing the height: 0 attribute
			this.__dropdownPane.style.height = "auto";
			// Change the open state to open
			this.openState = true;
			// Ignores the first return press, as this is usually the one that opens the dropdown
			this.returnIgnored = false;
			// Allow options to be tabbed through via the keyboard
			this.enableOptionFocusIn();
			// If the scrollbar exists, make sure the active option is in view
			this.scrollToOption(this.selectedOptionID);
			// Used to check if the active option changed via tabbing
			this.startingID = this.selectedOptionID;
			// Store handlers for events, so that they can be later removed
			this.handler_DocumentClicked = this.onDocumentClicked.bind(this);
			this.handler_DocumentKeyUp = this.onDocumentKeyUp.bind(this);
			this.handler_DocumentKeyDown = this.onDocumentKeyDown.bind(this);
			// Add listeners for the user interacting with the options
			document.documentElement.addEventListener("click", this.handler_DocumentClicked);
			document.documentElement.addEventListener("keyup", this.handler_DocumentKeyUp);
			document.documentElement.addEventListener("keydown", this.handler_DocumentKeyDown);
			// Signal that the dropdown has opened
			this.trigger(this.OPENED);
		}

		/**
		* Closes the dropdown pane
		*/
		Dropdown.prototype.close = function() {
			// Stop listening for option interaction
			document.documentElement.removeEventListener("click", this.handler_DocumentClicked);
			document.documentElement.removeEventListener("keyup", this.handler_DocumentKeyUp);
			document.documentElement.removeEventListener("keydown", this.handler_DocumentKeyDown);
			this.mouseDown = false;
			// Switch the 'current' element to it's inactive state
			this.__currentSelection.className = this.__currentSelection.className.replace(/ active|active/g, "");
			// Hide the options again by setting the pane height to 0 (overflow is hidden)
			this.__dropdownPane.style.height = 0;
			// Reset the scrollbar to the top
			if (this.scrollbar && this.selectedOptionID <= 0) {
				this.scrollbar.reset();
			}
			// Stop allowing the tab key to access the options
			this.disableOptionFocusIn();
			// Change the open state to closed
			this.openState = false;
			// Signal that the dropdown has closed
			this.trigger(this.CLOSED);
		}

		/**
		* Alias for setActive option (for backwards-compatibility with V1)
		* @ignore
		*/
		Dropdown.prototype.setActiveOptionID = function(index) {
			this.setActiveOption(index);
		}

		/**
		* Select the option specified by 'index' and show it as active
		* @param {number} index The zero-indexed ID for the option that should be marked as selected
		*/
		Dropdown.prototype.setActiveOption = function(index) {
			if (!this.options.mobileMode) {
				// If an option was previously selected, remove it's active state
				if (this.selectedOptionID >= 0) {
					this.__options[this.selectedOptionID].className = this.__options[this.selectedOptionID].className.replace(/ active|active/g, "");
				}
				// If the new option isn't already active, add the active state
				if (this.__options[index].className.search("active") < 0) {
					this.__options[index].className += " active";
				}
				// Store the new selected index
				this.selectedOptionID = index;
				// Store the new option's label text
				this.selectedOptionLabel = this.__options[index].textContent;
				// Store the new option's value
				this.selectedOptionValue = this.__options[index].getAttribute("href");
				// Update the copy shown in the 'active option' area at the top of the dropdown
				this.setCurrentText(this.selectedOptionLabel);
			} else if (this.__formElement) {
				// If in mobile mode, and a form element exists, we still need to update the active option
				this.selectedOptionID = index;
				this.selectedOptionLabel = this.__formOptions[index].textContent;
				this.selectedOptionValue = this.__formOptions[index].value;
			}
			// If this dropdown is duplicated a form select field, ensure the new option
			// is marked as selected in the form element version
			if (this.__formElement) {
				this.__formElement.selectedIndex = index;
			}
		}

		/**
		* Error strings
		* @ignore
		*/
		Dropdown.prototype.ERROR_INVALID_TEMPLATE_ID = "NATION.Dropdown: The template id '{{id}}' could not be found in the DOM.";
		Dropdown.prototype.ERROR_MISSING_ELEMENT = "NATION.Dropdown: Selector is missing a child with class name '{{className}}'.";

		/**
		* Store references to child elements of the created dropdown
		* @ignore
		*/
		Dropdown.prototype.getDropdownElements = function() {
			this.__currentSelection = this.__DOMElement.querySelector(".js-current, .current");
			if (!this.__currentSelection) {
				throw new Error(this.ERROR_MISSING_ELEMENT.replace("{{className}}", ".js-current"));
			}
			this.__scrollableContent = this.__DOMElement.querySelector(".js-scrollable, .scrollable");
			if (!this.__currentSelection) {
				throw new Error(this.ERROR_MISSING_ELEMENT.replace("{{className}}", ".js-scrollable"));
			}
			this.__scrollableContent.style.overflow = "hidden";
			this.__options = this.__scrollableContent.querySelectorAll("a");
			this.__scrollbarElement = this.__DOMElement.querySelector(".js-scrollbar, .scrollbar");
		}

		/**
		* Find the ID of the option with matching label text
		* @ignore
		*/
		Dropdown.prototype.setActiveOptionByLabel = function(label) {
			// Only relevant if the full dropdown is in use
			if (!this.options.mobileMode) {
				var i = 0, length = this.__options.length, value = "";
				for (; i < length; i++) {
					// Get the label for this option
					value = this.__options[i].textContent;
					// If this label is the same as the argument label
					if (value === label) {
						// i is the item index that should be active
						// Show it as active, then break out of the loop
						this.setActiveOption(i);
						break;
					}
				}
			} else if (this.__formElement) {
				var i = 0, length = this.__formOptions.length, optionLabel;
				for (; i < length; i++) {
					optionLabel = this.__formOptions[i].textContent;
					if (optionLabel === label) {
						this.selectedOptionID = i;
						this.selectedOptionLabel = label;
						this.selectedOptionValue = this.__formOptions[i].getAttribute("value");
					}
				}
			}
		}

		/**
		* Set the text shown as selected
		* @ignore
		*/
		Dropdown.prototype.setCurrentText = function(label) {
			// Empty out the existing current text
			while (this.__currentSelection.firstChild) this.__currentSelection.removeChild(this.__currentSelection.firstChild);
			// Create a new text node for the new copy
			var newTextNode = document.createTextNode(label);
			// Add the new text to the current element
			this.__currentSelection.appendChild(newTextNode);
			// Store the updated active label
			this.selectedOptionLabel = label;
		}

		/**
		* Enables the scrollbar if the content is too tall for it's container
		* @ignore
		*/
		Dropdown.prototype.checkForScrollbar = function() {
			if (!this.options.mobileMode && this.__scrollbarElement) {
				// Get the current max-height, as defined in CSS
				var maxHeight = NATION.Utils.getStyle(this.__scrollableContent, "maxHeight");
				// If no max-height is defined in the CSS, use the value in options
				if (!(maxHeight > 0) || maxHeight !== "none") {
					maxHeight = this.options.maxHeight;
					// Ensure the value is a valid CSS value (with unit of measurement)
					if (maxHeight.toString().search(/%|px/g) < 0) maxHeight = maxHeight + "px";
					// Set the style on the scrollable content
					this.__scrollableContent.style.maxHeight = maxHeight;
				}
				// Get the max height as an integer
				maxHeight = parseInt(maxHeight, 10);
				// Clear the height of the dropdown pane
				this.__dropdownPane.style.height = "auto";
				// If the content of scrollableContent is taller than the max height, a scrollbar is needed
				if (this.__scrollableContent.children[0].offsetHeight > maxHeight) {
					this.createScrollbar();
				} else {
					// Otherwise if no scrollbar is needed, hide it
					if (this.__scrollbarElement) {
						this.__scrollbarElement.style.display = "none";
					}
				}
				// Set the height of the dropdown pane to zero, since the dropdown should start closed
				this.__dropdownPane.style.height = 0;
			} else if (this.__scrollbarElement) {
				// If in mobile mode, and the scrollbar element exists, hide it
				this.__scrollbarElement.style.display = "none";
			}
		}

		/**
		* If the scrollbar exists, make sure the active option is in view
		* @ignore
		*/
		Dropdown.prototype.scrollToOption = function(optionID) {
			if (this.scrollbar && optionID >= 0) {
				var percentage = 0;
				if (this.__formElement) {
					percentage = optionID / (this.__formOptions.length-1);
				} else {
					percentage = optionID / (this.__options.length-1);
				}
				this.scrollbar.setPosition(percentage);
			}
		}

		/**
		* Ignore focus attempts on options while closed
		* @ignore
		*/
		Dropdown.prototype.disableOptionFocusIn = function() {
			if (!this.options.mobileMode) {
				var i = 0, length = this.__options.length;
				for (; i < length; i++) {
					this.__options[i].tabIndex = -1;
				}
			}
		}

		/**
		* Re-enable focussing on options (while dropdown open)
		* @ignore
		*/
		Dropdown.prototype.enableOptionFocusIn = function() {
			if (!this.options.mobileMode) {
				var i = 0, length = this.__options.length;
				for (; i < length; i++) {
					this.__options[i].tabIndex = 0;
				}
			}
		}

		/**
		* Use existing HTML as a dropdown without a form element
		* @ignore
		*/
		Dropdown.prototype.prepareExistingDropdown = function() {
			// Work out what to initially show in the 'current' area of the dropdown
			var startingLabel = "";
			if (this.options.label) {
				// If an initial label was specified in the options, use that
				startingLabel = this.options.label;
			} else {
				// Otherwise just use the first option available
				startingLabel = this.__options[0].textContent;
			}
			this.__currentSelection.innerHTML = startingLabel;
		}

		/**
		* Create the HTML required for the customised dropdown
		* @ignore
		*/
		Dropdown.prototype.createDropdown = function() {
			var templateCode = this.defaultTemplate;
			if (this.options.templateID) {
				// If the user specified a template in the DOM, use that if it exists
				var templateTag = document.getElementById(this.options.templateID);
				if (templateTag) {
					templateCode = templateTag.innerHTML;
				} else {
					// Alert the author that the template doesn't exist in the DOM
					throw new Error(this.ERROR_INVALID_TEMPLATE_ID.replace("{{id}}", this.options.templateID));
				}
			}
			// Work out what to initially show in the 'current' area of the dropdown
			var startingLabel = "";
			var firstLabelRequired = false;
			if (this.options.label) {
				// If an initial label was specified in the options, use that
				startingLabel = this.options.label;
			} else if (this.__formElement && this.__formElement.selectedIndex > -1) {
				// If an option is already marked as selected in the form element, use that
				startingLabel = this.__formElement[this.__formElement.selectedIndex].textContent;
			} else {
				// Otherwise just use the first option available
				if (this.__formElement) {
					startingLabel = this.__formOptions[0].textContent;
				} else {
					firstLabelRequired = true;
				}
			}
			if (!firstLabelRequired) {
				this.defaultLabel = startingLabel;
				templateCode = templateCode.replace(/\{\{defaultOption\}\}/gi, startingLabel);
			}
			var templateIndex = templateCode.search("{{#each options}}");
			if (templateIndex > -1) {
				var startIndex = templateIndex + 17;
				var endIndex = templateCode.search("{{/each}}");
				var topTemplate = templateCode.substring(0, templateIndex);
				var bottomTemplate = templateCode.substring(endIndex + 9);
				var optionTemplate = templateCode.substring(startIndex, endIndex);
				var optionLabel, optionValue, optionCode;
				templateCode = topTemplate;
				var i = 0, length = this.__formOptions.length;
				for (; i < length; i++) {
					optionValue = this.__formOptions[i].getAttribute("value");
					optionLabel = this.__formOptions[i].textContent;
					if (!optionValue) optionValue = optionLabel;
					optionCode = optionTemplate.replace("{{this.optionValue}}", optionValue);
					optionCode = optionCode.replace("{{this.optionLabel}}", optionLabel);
					templateCode += optionCode;
				}
				templateCode += bottomTemplate;
				this.__DOMElement.innerHTML = templateCode;
				if (!this.options.mobileMode) {
					if (this.__formElement) {
						this.__formElement.tabIndex = -1;
						this.__formElement.style.display = "none";
					}
					this.getDropdownElements();

					if (firstLabelRequired) {
						startingLabel = this.__options[0].textContent;
						this.__currentSelection.innerHTML = startingLabel;
					}
				} else {
					NATION.Utils.setStyle(this.__formElement, {
						position: "absolute",
						display: "block",
						top: 0,
						left: 0,
						zIndex: 100,
						width: "100%",
						height: "100%",
						opacity: 0
					});
					var containerPosition = NATION.Utils.getStyle(this.__DOMElement, "position");
					if (!containerPosition || containerPosition === "static") this.__DOMElement.style.position = "relative";
					this.__DOMElement.insertBefore(this.__formElement, this.__DOMElement.firstChild);
				}
			}
		}

		/**
		* Work out totals per character, and store references to each
		* @ignore
		*/
		Dropdown.prototype.calculateFirstCharMatches = function() {
			this.firstCharMatches = {};
			this.totalFirstCharMatches = {};
			var i = 65, length = 90, firstCharacter = "";
			// Generate object of the alphabet
			for (; i <= length; i++) {
				firstCharacter = String.fromCharCode(i).toLowerCase();
				this.totalFirstCharMatches[firstCharacter] = 0;
				this.firstCharMatches[firstCharacter] = [];
			}
			// Add numbers 0-9 to the array
			i = 0; length = 10;
			for (; i < length; i++) {
				this.totalFirstCharMatches[i.toString()] = 0;
				this.firstCharMatches[i.toString()] = [];
			}

			// Count how many instance of words starting with each character exist in the options
			i = 0, length = this.__options.length;
			for (; i < length; i++) {
				firstCharacter = this.__options[i].textContent.charAt(0).toLowerCase();
				// Ensure that the character can be looked up (ie. is alpha-numeric)
				if (this.firstCharMatches[firstCharacter]) {
					this.firstCharMatches[firstCharacter].push(i);
					this.totalFirstCharMatches[firstCharacter]++;
				}
			}
		}

		/**
		* Create a scrollbar if one doesn't yet exist
		* @ignore
		*/
		Dropdown.prototype.createScrollbar = function() {
			if (NATION.VerticalScrollbar) {
				if (!this.scrollbar) {
					var selector = this.__scrollableContent;
					var scrollbarSelector = this.__scrollbarElement;
					this.scrollbar = new NATION.VerticalScrollbar(selector, scrollbarSelector, {
						enableMouseLock: true
					});
				}
				this.__scrollbarElement.style.display = "block";
			}
		}

		/**
		* Listen for user interaction with the dropdown elements
		* @ignore
		*/
		Dropdown.prototype.createListeners = function() {
			if (!this.options.mobileMode) {
				this.__currentSelection.addEventListener("click", this.onCurrentOptionClicked.bind(this));
				var i = 0, length = this.__options.length;
				for (; i < length; i++) {
					this.__options[i].addEventListener("click", this.onOptionClicked.bind(this));
					this.__options[i].addEventListener("focusin", this.onOptionFocusIn.bind(this));
					this.__options[i].addEventListener("focus", this.onOptionFocusIn.bind(this));
					this.__options[i].addEventListener("focusout", this.onOptionFocusOut.bind(this));
					this.__options[i].addEventListener("blur", this.onOptionFocusOut.bind(this));
					this.__options[i].addEventListener("mousedown", this.onOptionMouseDown.bind(this));
				}
			} else {
				this.__DOMElement.addEventListener("touchend", this.onMobileDropdownTouchEnd.bind(this));
				this.__DOMElement.addEventListener("focusout", this.onMobileDropdownFocusOut.bind(this));
				// Here we listen for the blur event, because 'change' doesn't fire if the user selects the first option
				this.__formElement.addEventListener("blur", this.onMobileDropdownSelectionChanged.bind(this));
				this.__formElement.addEventListener("change", this.onMobileDropdownSelectionChanged.bind(this));
				this.__formElement.addEventListener("focusout", this.onMobileDropdownSelectionChanged.bind(this));
			}
		}

		/**
		* Reset the character search status, since we're not longer tracking a character
		* @ignore
		*/
		Dropdown.prototype.resetCharacterSearch = function() {
			this.characterSearchIndex = 0;
			this.characterSearch = "";
		}

		/**
		* Toggle the dropdown pane open or closed
		* @ignore
		*/
		Dropdown.prototype.onCurrentOptionClicked = function(e) {
			if (this.openState) {
				this.close();
			} else {
				this.open();
			}
			e.stopPropagation();
			e.preventDefault();
		}

		/**
		* Change the selected option and close the dropdown pane
		* @ignore
		*/
		Dropdown.prototype.onOptionClicked = function(e) {
			this.mouseDown = false;
			// Clear character search if it was in use
			this.resetCharacterSearch();
			// Find the index of the clicked option
			var i = 0, length = this.__options.length, optionID;
			for (; i < length; i++) {
				if (this.__options[i] === e.target) {
					optionID = i;
					break;
				}
			}
			// Remove the active class from the currently selected option
			if (this.selectedOptionID >= 0) {
				this.__options[this.selectedOptionID].className = this.__options[this.selectedOptionID].className.replace(/ active|active/g, "");
			}
			this.selectedOptionLabel = e.target.textContent;
			// Store whether the selected option changed for later use
			var optionChanged = (this.selectedOptionID !== optionID);
			// Set the new option as active
			this.setActiveOptionByLabel(this.selectedOptionLabel);
			// Update the text shown in the open/close trigger
			this.setCurrentText(this.selectedOptionLabel);
			if (this.__formElement) {
				// Change the selected option in the real select element, if one exists
				this.__formElement.value = e.target.getAttribute("href");
			}
			// The dropdown always closes after an option has been selected
			this.close();
			if (optionChanged) {
				this.selectedOptionID = optionID;
				this.selectedOptionValue = e.target.getAttribute("href");
				this.trigger(this.SELECTED);
			} else {
				this.trigger(this.RESELECTED);
			}
			e.stopPropagation();
			e.preventDefault();
		}

		/**
		* Show the highlighted option as active
		* @ignore
		*/
		Dropdown.prototype.onOptionFocusIn = function(e) {
			if (this.openState && !this.mouseDown) {
				var i = 0, length = this.__options.length, index = 0;
				for (; i < length; i++) {
					if (this.__options[i] === e.target) {
						index = i;
						break;
					}
				}
				this.setActiveOption(index);
			}
		}

		/**
		* Show the blurred option as inactive
		* @ignore
		*/
		Dropdown.prototype.onOptionFocusOut = function(e) {
			var i = 0, length = this.__options.length, index = 0;;
			for (; i < length; i++) {
				if (this.__options[i] === e.target) {
					index = i;
					break;
				}
			}
			if (index === this.__options.length-1) {
				this.close();
			}
		}

		/**
		* Prevent a focus-in from firing
		* @ignore
		*/
		Dropdown.prototype.onOptionMouseDown = function(e) {
			this.mouseDown = true;
		}

		/**
		* Toggle the active class when dropdown is opened or closed on a touch device
		* @ignore
		*/
		Dropdown.prototype.onMobileDropdownTouchEnd = function(e) {
			if (!this.openState) {
				this.__currentSelection.className += " active";
				this.openState = true;
			} else {
				this.__currentSelection.className = this.__currentSelection.className.replace(/ active|active/g, "");
				this.openState = false;
			}
		}

		/**
		* Remove active class when the dropdown is unfocussed
		* @ignore
		*/
		Dropdown.prototype.onMobileDropdownFocusOut = function(e) {
			this.__currentSelection.className = this.__currentSelection.replace(/ active|active/g, "");
			this.openState = false;
		}

		/**
		* Update value shown in current link to match the new select value
		* @ignore
		*/
		Dropdown.prototype.onMobileDropdownSelectionChanged = function(e) {
			this.selectedOptionLabel = this.__formOptions[this.__formElement.selectedIndex].textContent;
			this.selectedOptionValue = this.__formElement.value;
			this.selectedOptionID = this.__formElement.selectedIndex;
			this.__currentSelection.className = this.__currentSelection.className.replace(/ active|active/g, "");
			while (this.__currentSelection.firstChild) this.__currentSelection.removeChild(this.__currentSelection.firstChild);
			var newLabel = document.createTextNode(this.selectedOptionLabel);
			this.__currentSelection.appendChild(newLabel);
			this.openState = false;
		}

		/**
		* Close the dropdown when a click is heard outside the dropdown itself
		* @ignore
		*/
		Dropdown.prototype.onDocumentClicked = function(e) {
			this.close();
			e.preventDefault();
		}

		/**
		* Cycle through options
		* This listener is only active when dropdown is open
		* @ignore
		*/
		Dropdown.prototype.onDocumentKeyUp = function(e) {
			var optionID = 0;
			if (e.keyCode === 38 && this.selectedOptionID > 0) {
				// Up arrow was pressed
				optionID = this.selectedOptionID - 1;
				this.setActiveOption(optionID);
				e.preventDefault();
			} else if (e.keyCode === 40 && this.selectedOptionID < this.__options.length-1) {
				// Down arrow was pressed
				optionID = this.selectedOptionID + 1;
				this.setActiveOption(optionID);
				e.preventDefault();
			} else if (e.keyCode === 13 && this.returnIgnored) {
				// Return was pressed
				this.close();
				// Signals a change if one occurred via the keyboard
				if (this.startingID !== this.selectedOptionID) {
					this.trigger(this.SELECTED);
				}
			} else if (e.keyCode === 13 && !this.returnIgnored) {
				// If return was pressed, but we haven't ignored one yet, mark it as having been ignored
				// This prevents reactions from a user pressing return when focussed on the closed dropdown
				this.returnIgnored = true;
			} else if (e.keyCode >= 65 && e.keyCode <= 90 || e.keyCode >= 48 && e.keyCode <= 57) {
				this.selectOptionByCharacter(e.keyCode);
			}
		}

		/**
		* Find the next matching option for the pressed key
		* @ignore
		*/
		Dropdown.prototype.selectOptionByCharacter = function(keyCode) {
			var pressedCharacter = String.fromCharCode(keyCode).toLowerCase();
			// Reset variables if character has changed since last keypress
			if (pressedCharacter !== this.characterSearch) {
				this.characterSearch = pressedCharacter;
				this.characterSearchIndex = 0;
			} else {
				this.characterSearchIndex++;
			}
			if (this.totalFirstCharMatches[pressedCharacter] > 0) {
				// Check if we're already on the last instance of this character
				if (this.characterSearchIndex >= this.totalFirstCharMatches[pressedCharacter]) {
					this.characterSearchIndex = 0;
				}
				// Select the next item that matches the pressed letter
				var newIndex = this.firstCharMatches[pressedCharacter][this.characterSearchIndex];
				this.setActiveOptionID(newIndex);
				this.scrollToOption(newIndex);
			}
		}

		/**
		* Prevent browser scroll when needed
		* This listener is only active when dropdown is open
		* @ignore
		*/
		Dropdown.prototype.onDocumentKeyDown = function(e) {
			if (e.keyCode === 38 || e.keyCode === 40) {
				e.preventDefault();
			}
		}

		window.NATION.Dropdown = Dropdown;
	}

}(window, document, undefined));