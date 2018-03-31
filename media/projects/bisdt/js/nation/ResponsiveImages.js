////////////////////////////////////////////////////////////////////////////////
// Nation Library
// Controls responsive images
// To use this, have custom image tags on the page, with the following attributes:
// - data-responsive-image (no value)
// - data-path: path to all images
// - data-src: all image filenames, with min-widths at which to show, in similar
//   format to the srcset spec (currently only supporting w)
// Example image tag:
// <img alt="My alt text" data-responsive-image data-path="/sites/all/themes/grolsch/images/" data-src="large.jpg w640, small.jpg w0" />
////////////////////////////////////////////////////////////////////////////////
var NATION = NATION || {};

/**
* ### ! A WORD OF WARNING !
* This class has been changed to match the image srcset spec as it now stands. Keep this in mind when copying this class into your project. Previous versions are incompatible.
* This does not replicate the picture tag, for that, use Picturefill. This is a small lightweight class to be used when you only need to use image srcset.
*
* ### Dependencies:
* None

* ### About:
* Enables responsive images on any website. As this class is self-instantiating, you need only include the script. To run the update function, call NATION.ResponsiveImages.update()

* ### Notes:
* To create a responsive image, the following tag structure must be used:

	'<img alt="[ALT TEXT]" data-responsive-image data-path="[PATH TO IMAGES]" data-src="[FULL IMAGE NAME]" data-srcset="[IMAGE NAME] [MAX WIDTH]w, [IMAGE NAME] [MAX WIDTH]w />'

* - [ALT TEXT]: Standard image alt text
* - [PATH TO IMAGES]: This is a shared path between all images. It can be left blank if you want to put the full URL to each image in the data-src argument
* - [FULL IMAGE NAME]: This is the largest version of the image, to be used when window width is larger than the largest size in data-srcset
* - [IMAGE NAME]: Filename of the image, eg. my-image.jpg
* - [MAX WIDTH]: The maximum width at which this image should show. Note that this precedes 'w', standing for width. For example, '825w' would mean to show this image when the browser is at, or below, 825px width

* @class ResponsiveImages
*/
NATION.ResponsiveImages = (function() {

	"use strict";
	
	var _public = {};

	/**
	* Update responsive images. Useful if new images have been added to the DOM since initialisation, as this will check for any new ones
	*/
	_public.update = function() {
		_private.createImages();
	};

	var _private = {

		//------------------------------------------------
		// Variables
		//------------------------------------------------
		responsiveImages: [],
		resizeTimer: null,

		//------------------------------------------------
		// Init
		//------------------------------------------------
		init: function() {
			this.createImages();
			this.createListeners();
		},

		//------------------------------------------------
		// Setup responsive images
		//------------------------------------------------
		createImages: function() {
			this.responsiveImages = [];
			var existingImages = document.querySelectorAll("[data-responsive-image]");
			var i = 0, length = existingImages.length;
			var windowWidth = window.innerWidth || document.documentElement.clientWidth || document.getElementsByTagName("body")[0].clientWidth;
			var k = 0, image, data, sizes, imageData, size, filename, lastWidth, sizeLength, maxWidthReached;
			for (; i < length; i++) {
				maxWidthReached = false;
				data = {};
				image = existingImages[i];
				data.selector = image;
				data.path = image.getAttribute("data-path") || "";
				data.fullImage = image.getAttribute("data-src");
				sizes = image.getAttribute("data-srcset").split(",");
				k = 0, sizeLength = sizes.length;
				data.sizes = [];
				lastWidth = 0;
				for (; k < sizeLength; k++) {
					imageData = sizes[k].trim();
					imageData = imageData.split(" ");
					size = {
						filename: imageData[0],
						trigger: (imageData[1]) ? parseInt(imageData[1].replace("w", ""), 10) : false
					};
					data.sizes.push(size);

					// If this size is bigger than last size and windowWidth is bigger than this size
					if ((size.trigger >= lastWidth && windowWidth < size.trigger) || !size.trigger) {
						filename = size.filename;
						lastWidth = size.trigger;
						data.currentImage = filename;
						maxWidthReached = true;
					} else {
						
						break;
					}
				}
				// If we didn't find an image beyond the current viewport's width, we can use the full width image
				if (!maxWidthReached) {
					filename = data.fullImage
					data.currentImage = filename;
				}
				//alert(data.path + filename);
				existingImages[i].src = data.path + filename;
				this.responsiveImages.push(data);
			}
		},

		//------------------------------------------------
		// Listen for resizes
		//------------------------------------------------
		createListeners: function() {
			window.addEventListener("resize", function(e) {_private.onWindowResized(e);});
		},

		//------------------------------------------------
		// Swap images where needed
		//------------------------------------------------
		update: function() {
			var i = 0, length = this.responsiveImages.length, k = 0, sizeLength, filename, lastTrigger, trigger, maxWidthReached;
			var windowWidth = window.innerWidth || document.documentElement.clientWidth || document.getElementsByTagName("body")[0].clientWidth;
			for (; i < length; i++) {
				k = 0;
				maxWidthReached = false;
				sizeLength = this.responsiveImages[i].sizes.length;
				trigger = lastTrigger = 0;
				for (; k < sizeLength; k++) {
					trigger = this.responsiveImages[i].sizes[k].trigger;
					if ((windowWidth < trigger && trigger >= lastTrigger) || !trigger) {
						filename = this.responsiveImages[i].sizes[k].filename;
						lastTrigger = trigger;
						maxWidthReached = true;
					}
				}
				if (!maxWidthReached) {
					filename = this.responsiveImages[i].fullImage;
				}
				if (this.responsiveImages[i].currentImage !== filename) {
					this.responsiveImages[i].selector.src = this.responsiveImages[i].path + filename;
					this.responsiveImages[i].currentImage = filename;
				}
			}

		},

		//------------------------------------------------
		// Update all responsive images where needed
		//------------------------------------------------
		resize: function() {
			clearTimeout(this.resizeTimer);
			this.resizeTimer = null;
			if (this.responsiveImages.length) {
				this.update();
			}
		},

		//------------------------------------------------
		// Pace resize events
		//------------------------------------------------
		onWindowResized: function(e) {
			if (!this.resizeTimer) {
				this.resizeTimer = setTimeout(function() {_private.resize();}, 20);
			}
		}
	};
	_private.init();
	return _public;
}());