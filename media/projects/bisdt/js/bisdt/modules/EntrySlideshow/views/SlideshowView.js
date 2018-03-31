// Moves individual slides around as per user request

NATION.Utils.createNamespace("BISDT.modules.EntrySlideshow.views");

BISDT.modules.EntrySlideshow.views.SlideshowView = function(DOMElement, model) {
	
	"use strict";

	//------------------------------------------------
	// Events
	//------------------------------------------------
	var events = {
		VOTE_CLICKED: "VoteClicked"
	};

	//------------------------------------------------
	// Variables
	//------------------------------------------------
	var SLIDE_EASING = "easeInOutQuad";
	var SLIDE_DURATION = 600;
	var visibleSlides = 0;
	var slides = [];
	var positions = [];
	var animating = false;
	var currentIndex = 0;
	var completeSlides = 0;
	var slideTemplate = "";
	var reverseDirection = false;
	var singleSlideLayout = false;
	var defaultSlideTop = 0;
	var clickedVoteID = 0;
	var voteCompleteCopy = "";
	var votingClosedCopy = "";
	var speedometers = [];
	var speedometerTemplate = "";

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	function init() {
		currentIndex = model.getCurrentIndex();
		slideTemplate = DOMElement.querySelector("#entry-template").textContent;
		updateSlidesArray();
		initialiseSlides();
		prepareSlideData();
		initialiseSpeedometers();
		createLogoListeners();
		createVoteListeners();
		resize();
		waitForImageLoad();
	}

	//------------------------------------------------
	// Listen for store logo clicks for tracking
	//------------------------------------------------
	function createLogoListeners() {
		var logos = DOMElement.querySelectorAll(".store-logo"), i = 0, length = logos.length;
		for (; i < length; i++) {
			logos[i].removeEventListener("click", onStoreLogoClicked);
			logos[i].addEventListener("click", onStoreLogoClicked);
		}
	}

	//------------------------------------------------
	// Add listeners to all vote buttons
	//------------------------------------------------
	function createVoteListeners() {
		var i = 0, length = slides.length;
		for (; i<length; i++) {
			slides[i].querySelector(".vote-button a").removeEventListener("click", onVoteButtonClicked);
			slides[i].querySelector(".vote-button a").addEventListener("click", onVoteButtonClicked);
		}
	}

	//------------------------------------------------
	// Can't position arrows until the image has
	// finished loading
	//------------------------------------------------
	function waitForImageLoad() {
		slides[Math.floor(visibleSlides/2)].querySelector(".media img").addEventListener("load", function(e) {onFirstImageLoaded(e);});
	}

	//------------------------------------------------
	// Safe to position arrows for the first time now
	//------------------------------------------------
	function onFirstImageLoaded(e) {
		updateArrowPositions();
	}

	//------------------------------------------------
	// Saves the starting positions for each of the
	// 5 slides to a positions array. Also ensures
	// the starting state of each slide is correct
	//------------------------------------------------
	function initialiseSlides() {
		var i = 0, length = slides.length, left, top, entryID;
		visibleSlides = length;
		positions = [];
		voteCompleteCopy = slides[0].querySelector(".vote-button a").getAttribute("data-success");
		votingClosedCopy = slides[0].querySelector(".vote-button a").getAttribute("data-closed");
		for (; i < length; i++) {
			slides[i].removeAttribute("style");
			slides[i].style.display = "none";
			left = NATION.Utils.getStyle(slides[i], "left") + "%";
			
			top = NATION.Utils.getStyle(slides[i], "top") + "px";
			positions.push({
				left: left,
				top: top
			});
			slides[i].removeAttribute("style");
			slides[i].style.left = left;
			slides[i].style.top = top;
			if (i === 2) {
				slides[i].style.position = "relative";
				slides[i].querySelector(".overlay").style.opacity = 0;
				slides[i].querySelector("figcaption").style.opacity = 1;
				slides[i].querySelector(".image-details").style.opacity = 1;
			} else {
				slides[i].style.position = "absolute";
				slides[i].querySelector(".overlay").style.opacity = 1;
				slides[i].querySelector("figcaption").style.opacity = 0;
				slides[i].querySelector(".image-details").style.opacity = 0;
			}
			entryID = parseInt(slides[i].getAttribute("data-entry-id"), 10);
			var voteButton = slides[i].querySelector(".vote-button a");
			if (model.hasBeenVoted(entryID)) {
				voteButton.innerHTML = voteCompleteCopy;
				voteButton.className += " vote-cast";
			} else if (slides[i].getAttribute("data-voting-closed") == "true") {
				// Show voting closed message and disable buttonx
				voteButton.innerHTML = votingClosedCopy;
				voteButton.className += " vote-cast";
			}
		}
	}

	//------------------------------------------------
	// Normal 'top' for absolutely positioned slides
	// when in single column layout
	//------------------------------------------------
	function updateDefaultSlideTop() {
		defaultSlideTop = DOMElement.querySelector(".list-button").clientHeight + "px";
	}

	//------------------------------------------------
	// Update the model with data from the view
	//------------------------------------------------
	function prepareSlideData() {
		var i = 0, length = visibleSlides, data, slideData = [];
		for (; i < length; i++) {
			data = {};
			data.entryID = parseInt(slides[i].getAttribute("data-entry-id"), 10);
			//data.entryPosition = parseInt(slides[i].querySelector(".current").textContent, 10);
			data.imageURL = slides[i].querySelector(".media img").getAttribute("src");
			data.firstname = slides[i].querySelector(".author").textContent;
			data.twitterURL = slides[i].querySelector(".twitter").getAttribute("href");
			data.facebookURL = slides[i].querySelector(".facebook").getAttribute("href");
			data.votes = parseInt(slides[i].getAttribute("data-vote-count"), 10);
			data.ranking = slides[i].getAttribute("data-vote-ranking");
			data.votingClosed = (slides[i].getAttribute("data-voting-closed") == "true");
			data.shopLogo = slides[i].querySelector(".location img").getAttribute("src");
			data.shopURL = slides[i].querySelector(".location a").getAttribute("href");
			data.shopName = slides[i].querySelector(".location img").getAttribute("alt");
			data.shopURL = slides[i].querySelector(".location a").getAttribute("href");
			slideData.push(data);
		}
		model.setVisibleSlides(visibleSlides);
		model.setStartingData(slideData);
	}

	//------------------------------------------------
	// Build the first 5 speedometers
	//------------------------------------------------
	function initialiseSpeedometers() {
		speedometerTemplate = document.getElementById("dial-template").innerHTML;
		var i = 0, length = slides.length, selector, speedometer, voteCount, voteRanking;
		for (; i < length; i++) {
			selector = slides[i].querySelector(".count");
			voteCount = model.getSlideDataByIndex(i).votes;
			voteRanking = model.getSlideDataByIndex(i).ranking;
			speedometer = new BISDT.modules.EntrySlideshow.views.SpeedometerView(selector, speedometerTemplate, voteCount, voteRanking);
			speedometers.push(speedometer);
			if (i === Math.floor(visibleSlides/2)) speedometers[i].play();
		}
	}

	//------------------------------------------------
	// Update references to entry divs
	//------------------------------------------------
	function updateSlidesArray() {
		slides = DOMElement.querySelectorAll(".entry");
		slides = Array.prototype.slice.call(slides);
	}

	//------------------------------------------------
	// Force will cause the change to be immediate
	// if animation is already in progress
	//------------------------------------------------
	function showPrevious(force) {
		if (!animating || force) {
			var immediate = (animating && force);
			rotateSlides(true, immediate);
			if (!immediate) model.decreaseCurrentEntryID();
		}
	}

	//------------------------------------------------
	// Force will cause the change to be immediate
	// if animation is already in progress 
	//------------------------------------------------
	function showNext(force) {
		if (!animating || force) {
			var immediate = (animating && force);
			rotateSlides(false, immediate);
			if (!immediate) model.increaseCurrentEntryID();
		}
	}

	//------------------------------------------------
	// Rotate or slide between slides
	//------------------------------------------------
	function moveSlide(slideID, reverse, showDetails, immediate) {
		var targetTop = defaultSlideTop;
		var targetLeft = 0;
		if (singleSlideLayout) {
			// if showDetails is true, this slide is about to become the centered one
			if (showDetails) {
				targetLeft = 0;
				// Set starting position
				if (reverse) {
					slides[slideID].style.left = "-100%";
				} else {
					slides[slideID].style.left = "100%";
				}
				slides[slideID].style.top = defaultSlideTop;
			} else {
				if (slideID !== Math.floor(visibleSlides/2)) {
					if (reverse) {
						slides[slideID].style.left =  "100%";
					} else if (slideID < Math.floor(visibleSlides/2)) {
						slides[slideID].style.left = "-100%";
					}
				}
				targetLeft = (slideID <= Math.floor(visibleSlides/2) && !reverse) ? "-100%" : "100%";
				targetTop = (slideID === Math.floor(visibleSlides/2)) ? 0 : defaultSlideTop;
			}
		} else {
			targetTop = (reverse) ? positions[slideID+1].top : positions[slideID-1].top;
			targetLeft = (reverse) ? positions[slideID+1].left : positions[slideID-1].left;
		}

		var overlay = slides[slideID].querySelector(".overlay");
		var caption = slides[slideID].querySelector("figcaption");
		var imageDetails = slides[slideID].querySelector(".image-details");
		var detailsHidden = (parseInt(imageDetails.style.opacity, 10) === 0);
		var overlayOpacity, captionOpacity, toggleCaptions = false;

		if (!showDetails && !detailsHidden) {
			// If captions are showing but we want to hide them
			overlayOpacity = 1;
			captionOpacity = 0;
			toggleCaptions = true;
		} else if (showDetails && detailsHidden) {
			// If captions are hidden but we want to show them
			overlayOpacity = 0;
			captionOpacity = 1;
			toggleCaptions = true;
		}
		if (toggleCaptions && !singleSlideLayout) {
			// Fade the captions in or out
			if (!immediate) {
				NATION.Animation.start(overlay, {opacity: overlayOpacity}, {easing: SLIDE_EASING, duration: SLIDE_DURATION});
				NATION.Animation.start(caption, {opacity: captionOpacity}, {easing: SLIDE_EASING, duration: SLIDE_DURATION});
				NATION.Animation.start(imageDetails, {opacity: captionOpacity}, {easing: SLIDE_EASING, duration: SLIDE_DURATION});
			} else {
				if (animating) {
					NATION.Animation.stop(overlay);
					NATION.Animation.stop(caption);
					NATION.Animation.stop(imageDetails);
				}
				overlay.style.opacity = overlayOpacity;
				caption.style.opacity = captionOpacity;
				imageDetails.style.opacity = captionOpacity;
			}
		}

		// Animate slide position
		if (!immediate) {
			NATION.Animation.start(slides[slideID], {left: targetLeft, top: targetTop}, {easing: SLIDE_EASING, duration: SLIDE_DURATION}, function(e) {onSlideMoveComplete();});
		} else {
			if (animating) {
				NATION.Animation.stop(slides[slideID]);
			}
			slides[slideID].style.left = targetLeft;
			slides[slideID].style.top = targetTop;
		}
	}

	//------------------------------------------------
	// Start moving to next/previous slide
	//------------------------------------------------
	function rotateSlides(reverse, immediate) {
		animating = true;
		completeSlides = 0;
		if (immediate) {
			finaliseSlidePositions();
		}
		var i = 0, length = slides.length, showDetails;
		for (; i < length; i++) {
			if ((i === 0 && !reverse) || (i === length-1 && reverse)) {
				// Remove slide on far left or far right depending on direction
				slides[i].parentNode.removeChild(slides[i]);
			} else {
				// If this slide is about to become the central slide, fade in it's captions
				if ((i === 3 && !reverse) || (i === 1 && reverse)) {
					showDetails = true;
					// Reset the upcoming speedometer
					speedometers[i].reset(slides[i].querySelector(".count"));
				} else {
					showDetails = false;
				}
				moveSlide(i, reverse, showDetails, immediate);
			}
		}
		reverseDirection = reverse;
		// If we're having to change slides immediately, we run the 'all slides complete'
		// stuff after all slides have been safely processed.
		if (immediate) {
			if (reverseDirection) {
				model.decreaseCurrentEntryID();
			} else {
				model.increaseCurrentEntryID();
			}
			finaliseSlidePositions();
			// Skip the current speedometer to the end position
			updateSpeedometers();
			speedometers[Math.floor(visibleSlides/2)].showVotes();
		}
		// Update slides array as normal
		updateSlidesArray();
	}

	//------------------------------------------------
	// Generate a new slide from data from the model
	//------------------------------------------------
	function createNewSlide(reverse) {
		var targetX = 0, targetY = 0, data;
		if (singleSlideLayout) {
			targetX = (reverse) ? "-100%" : "100%";
			targetY = defaultSlideTop;
		} else {
			if (reverse) {
				targetX = positions[0].left;
				targetY = positions[0].top;
			} else {
				targetX = positions[positions.length-1].left;
				targetY = positions[positions.length-1].top;
			}
		}
		data = (reverse) ? model.getEarlierSlideData() : model.getLaterSlideData();
		var template = slideTemplate, regex = "";
		for (var property in data) {
			regex = new RegExp("\{\{" + property + "\}\}", "g");
			template = template.replace(regex, data[property]);
		}
		// innerHTML is used to do this because IE9's DOMParser can't parse HTML
		// This means references go out of whack and must be updated
		// This includes slides[] and speedometers[]'s DOMElement
		if (reverse) {
			DOMElement.querySelector(".slides").innerHTML = template + DOMElement.querySelector(".slides").innerHTML;
		} else {
			DOMElement.querySelector(".slides").innerHTML += template;
		}
		updateSlidesArray();
		var newElement = (reverse) ? slides[0] : slides[slides.length-1];
		newElement.style.left = targetX;
		newElement.style.top = targetY;
		if (singleSlideLayout) {
			newElement.querySelector(".overlay").style.opacity = 0;
			newElement.querySelector("figcaption").style.opacity = 1;
			newElement.querySelector(".image-details").style.opacity = 1;
		} else {
			newElement.querySelector(".overlay").style.opacity = 1;
			newElement.querySelector("figcaption").style.opacity = 0;
			newElement.querySelector(".image-details").style.opacity = 0;
		}
		// Ensure state of vote buton is correct
		var voteButton = newElement.querySelector(".vote-button a");
		if (model.hasBeenVoted(data.entryID)) {
			voteButton.innerHTML = voteCompleteCopy;
			voteButton.className += " vote-cast";
		} else if (newElement.getAttribute("data-voting-closed") == "true") {
			// Show voting closed message and disable button
			voteButton.innerHTML = votingClosedCopy;
			voteButton.className += " vote-cast";
		}
		var speedometer = new BISDT.modules.EntrySlideshow.views.SpeedometerView(newElement.querySelector(".count"), speedometerTemplate, data.votes, data.ranking);
		if (reverse) {
			speedometers.pop();
			speedometers.unshift(speedometer);
		} else {
			speedometers.shift();
			speedometers.push(speedometer);
		}
		// Update vote listeners where needed
		createVoteListeners();
		// Update store logo listeners
		createLogoListeners();
	}

	//------------------------------------------------
	// Clear all styles on each entry
	//------------------------------------------------
	function resetSlides() {
		var i = 0, length = slides.length;
		for (; i < length; i++) {
			NATION.Animation.stop(slides[i]);
			slides[i].removeAttribute("style");
		}
	}

	//------------------------------------------------
	// Switch to large layout with darkened slides
	//------------------------------------------------
	function showLargeLayout() {
		resetSlides();
		initialiseSlides();
		singleSlideLayout = false;
	}

	//------------------------------------------------
	// Switch to single column layout
	//------------------------------------------------
	function showSmallLayout() {
		resetSlides();
		var i = 0, length = slides.length, targetX, targetY = positions[i], position;
		for (; i < length; i++) {
			if (i === Math.floor(visibleSlides/2)) {
				// Currently active slide, so it should be visible
				targetX = 0;
				targetY = 0;
				position = "relative";
			} else {
				targetX = (i < Math.floor(visibleSlides/2)) ? "-100%" : "100%";
				targetY = defaultSlideTop;
				position = "absolute";
			}
			slides[i].style.left = targetX;
			slides[i].style.top = targetY;
			slides[i].style.position = position;
			slides[i].querySelector(".overlay").style.opacity = 0;
			slides[i].querySelector("figcaption").style.opacity = 1;
			slides[i].querySelector(".image-details").style.opacity = 1;
		}
		singleSlideLayout = true;
	}

	//------------------------------------------------
	// Center arrows vertically
	//------------------------------------------------
	function updateArrowPositions() {
		var navElementDisplay = NATION.Utils.getStyle(DOMElement.querySelector(".navigation"), "display");
		var slidePadding = 0, topPadding = 0, figcaptionHeight = 0, mediaHeight = 0, yPos = 0, arrowHeight, backButtonHeight = 0, slideContainerPadding = 0;
		if (navElementDisplay !== "none") {
			// Nav is showing, so center the arrows
			topPadding = parseInt(NATION.Utils.getStyle(DOMElement, "paddingTop"), 10);
			figcaptionHeight = slides[Math.floor(visibleSlides/2)].querySelector("figcaption").clientHeight;
			mediaHeight = slides[Math.floor(visibleSlides/2)].querySelector(".media").clientHeight;
			//
			arrowHeight = DOMElement.querySelector(".navigation .previous .arrow").clientHeight;
			if (singleSlideLayout) {
				//backButtonHeight = DOMElement.querySelector(".list-button").clientHeight;
				slidePadding = parseInt(NATION.Utils.getStyle(slides[Math.floor(visibleSlides/2)], "paddingTop"), 10);
				slideContainerPadding = parseInt(NATION.Utils.getStyle(DOMElement.querySelector(".slides"), "paddingTop"), 10);
			}
			yPos = (topPadding + slidePadding + figcaptionHeight + backButtonHeight + slideContainerPadding + (mediaHeight / 2)) - (arrowHeight/2);
			DOMElement.querySelector(".navigation .previous .arrow").style.top = yPos + "px";
			DOMElement.querySelector(".navigation .next .arrow").style.top = yPos + "px";
		}
	}

	//------------------------------------------------
	// Layout is based on whether the '1 of 24' caption
	// is showing, since this triggers earlier than
	// the small header does
	//------------------------------------------------
	function resize() {
		updateDefaultSlideTop();
		var entryNumber = DOMElement.querySelectorAll(".entry")[Math.floor(visibleSlides/2)];
		entryNumber.style.display = "none";
		var singleColumnShowing = (NATION.Utils.getStyle(entryNumber, "width") == "100");
		entryNumber.style.display = "block";
		if (!singleColumnShowing && !animating) {
			var centerSlide = slides[Math.floor(visibleSlides/2)];
			//centerSlide.style.removeProperty("left");
			// Set display to none to get the original CSS value, rather than computed
			var previousLeft;
			if (centerSlide.style.left) {
				previousLeft = centerSlide.style.left;
			}
			centerSlide.style.removeProperty("left");
			centerSlide.style.display = "none";
			// We round these due to JavaScript's laugh a minute floating point maths
			var centerSlidePos = Math.floor(NATION.Utils.getStyle(centerSlide, "left"));
			var previousPos = Math.floor(parseInt(positions[Math.floor(visibleSlides/2)].left.replace(/%|px/g, "")));
			if (previousLeft) {
				centerSlide.style.left = previousLeft;
			}
			centerSlide.style.display = "block";
			if (centerSlidePos !== previousPos) {
				// In full layout, but the expected positions are now different, meaning
				// CSS has hit a breakpoint and spacing has changed, so we need to update
				// our stored positions
				initialiseSlides();
			}
		}
		if (!singleColumnShowing && singleSlideLayout) {
			// Large layout should be showing but isn't
			showLargeLayout();
		} else if (singleColumnShowing && !singleSlideLayout) {
			// Small layout should be showing but isn't
			showSmallLayout();
		}
		updateArrowPositions();
	}

	//------------------------------------------------
	// Returns ID of clicked post
	//------------------------------------------------
	function getClickedPostID() {
		return clickedVoteID;
	}

	//------------------------------------------------
	// Check when animation has fully completed
	//------------------------------------------------
	function onSlideMoveComplete(immediate) {
		completeSlides++;
		if (completeSlides === visibleSlides-1) {
			finaliseSlidePositions();
			// Play the speedometer animation
			speedometers[Math.floor(visibleSlides/2)].play();
		}
	}

	//------------------------------------------------
	// Keeps DOM references up to date after
	// innerHTML has been messed with (ta IE9)
	//------------------------------------------------
	function updateSpeedometers() {
		var i = 0, length = speedometers.length;
		for (; i < length; i++) {
			speedometers[i].reset(slides[i].querySelector(".count"));
		}
	}

	//------------------------------------------------
	// Adjust positioning of slides after animation
	//------------------------------------------------
	function finaliseSlidePositions() {
		// All slides have finished animating
		animating = false;
		// Generate new slide
		createNewSlide(reverseDirection);
		updateSpeedometers();
		// Central slide should be the only one 'relative', to ensure the parent container
		// retains a natural height as per document flow
		var i =0 , length = slides.length;
		for (; i < length; i++) {
			if (i === Math.floor(visibleSlides/2)) {
				slides[i].style.position = "relative";
				slides[i].style.top = 0;
			} else {
				slides[i].style.position = "absolute";
			}
		}
	}

	//------------------------------------------------
	// Signal to controller
	//------------------------------------------------
	function onVoteButtonClicked(e) {
		var voteButton = slides[Math.floor(visibleSlides/2)].querySelector(".vote-button a");
		var speedometer = speedometers[Math.floor(visibleSlides/2)];
		if (voteButton.className.search("vote-cast") <= -1) {
			voteButton.innerHTML = voteCompleteCopy;
			voteButton.className += (" vote-cast");
			speedometer.incrementVoteCount();
			clickedVoteID = model.getCurrentEntryID();
			api.trigger(events.VOTE_CLICKED);
		}
		e.stopPropagation();
		e.preventDefault();
	}

	//------------------------------------------------
	// Show a specific slide
	//------------------------------------------------
	function showSlide(entryID) {
		// Is this entry the next or previous slide?
		if (model.isNextSlide(entryID)) {
			// It's the next slide, move to it normally if it's loaded
			if (model.isSlideLoaded(entryID)) {
				showNext(true);
			} else {
				unloadedEntryWarning(entryID);
			}
		} else if (model.isPreviousSlide(entryID)) {
			// It's the previous slide, move to it normally if it's loaded
			if (model.isSlideLoaded(entryID)) {
				showPrevious(true);
			} else {
				unloadedEntryWarning(entryID);
			}
		} else {
			// Need to jump to this slide. Check if it's loaded or not
			unloadedEntryWarning(entryID);
		}
	}

	//------------------------------------------------
	// Debug info in case this somehow happens
	//------------------------------------------------
	function unloadedEntryWarning(entryID) {
		if (window.console && console.warn) console.warn("EntrySlideshow trying to go to a slide that hasn't been loaded. SlideID = " + entryID);
	}

	//------------------------------------------------
	// Track the store click
	//------------------------------------------------
	function onStoreLogoClicked(e) {
		var storeName = e.target.parentNode.querySelector("img").getAttribute("alt") + " logo";
		BISDT.Tracking.trackEvent("entry slideshow", "click", storeName);
	}

	init();

	//----------------------------------------------------------------------
	// Public API
	//----------------------------------------------------------------------
	var api = Object.create(NATION.EventDispatcher());

	api.events = events;
	api.showPrevious = showPrevious;
	api.showNext = showNext;
	api.resize = resize;
	api.getClickedPostID = getClickedPostID;
	api.showSlide = showSlide;

	return api;
};