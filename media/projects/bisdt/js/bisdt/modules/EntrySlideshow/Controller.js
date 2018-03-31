// Slideshow that cycles through entries

NATION.Utils.createNamespace("BISDT.modules.EntrySlideshow");

BISDT.modules.EntrySlideshow.Controller = function(DOMElement) {
	
	"use strict";

	//------------------------------------------------
	// Variables
	//------------------------------------------------
	var SWIPE_TOLERANCE = 100;
	var SECTION_NAME = "entry";
	var slideshowModel = null;
	var slideshowView = null;
	var resizeTimer = null;
	var touchMovesTriggered = 0;
	var touchStartX = 0;
	var touchStartY = 0;
	var verticalSwipeInProgress = 0;
	var startScroll = 0;
	var offsetTop = 0;
	var IS_IOS = (/iPhone|iPad|iPod/i.test(navigator.userAgent));

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	function init() {
		createModels();
		createViews();
		createListeners();
	}

	//------------------------------------------------
	// Listen for user interaction
	//------------------------------------------------
	function createListeners() {
		DOMElement.querySelector(".previous").addEventListener("click", function(e) {onPreviousClicked(e);});
		DOMElement.querySelector(".next").addEventListener("click", function(e) {onNextClicked(e);});
		DOMElement.querySelector(".sticker-promo").addEventListener("click", function(e) {onStickerPromoClicked(e);});
		slideshowView.addListener(slideshowView.events.VOTE_CLICKED, function(e) {onVoteClicked(e);});
		DOMElement.addEventListener("touchstart", function(e) {onTouchStart(e);});
		DOMElement.addEventListener("MSPointerDown", function(e) {onTouchStart(e);});
		DOMElement.addEventListener("PointerDown", function(e) {onTouchStart(e);});
		window.addEventListener("resize", function(e) {onWindowResized(e);});
		BISDT.Mediator.subscribe(BISDT.Events.URL_CHANGED, function(data) {onURLChanged(data);});
	}

	//------------------------------------------------
	// Pass relevant info from DOM to model
	//------------------------------------------------
	function createModels() {
		var dataURL = DOMElement.querySelector(".gallery-slideshow").getAttribute("data-url");
		var totalEntries = parseInt(DOMElement.querySelector(".gallery-slideshow").getAttribute("data-total"), 10);
		var voteURL = DOMElement.querySelector(".gallery-slideshow").getAttribute("data-vote-url");
		slideshowModel = new BISDT.modules.EntrySlideshow.models.SlideshowModel(dataURL, totalEntries, voteURL);
	}

	//------------------------------------------------
	// Main slideshow view
	//------------------------------------------------
	function createViews() {
		slideshowView = new BISDT.modules.EntrySlideshow.views.SlideshowView(DOMElement, slideshowModel);
	}

	//------------------------------------------------
	// Request a URL change
	//------------------------------------------------
	function updateURL(entryID) {
		var data = {
			state: {
				section: SECTION_NAME,
				entryID: entryID
			},
			title: null,
			path: "/entry/" + entryID
		};
		BISDT.Mediator.publish(BISDT.Events.CHANGE_URL, data);
	}

	//------------------------------------------------
	// Show previous entry if not loading
	//------------------------------------------------
	function onPreviousClicked(e) {
		if (!slideshowModel.getLoading()) {
			slideshowView.showPrevious();
			updateURL(slideshowModel.getCurrentEntryID());
			BISDT.Tracking.trackEvent("entry slideshow", "click", "previous slide");
		}
		e.stopPropagation();
		e.preventDefault();
	}

	//------------------------------------------------
	// Show next entry if not loading 
	//------------------------------------------------
	function onNextClicked(e) {
		if (!slideshowModel.getLoading()) {
			slideshowView.showNext();
			updateURL(slideshowModel.getCurrentEntryID());
			BISDT.Tracking.trackEvent("entry slideshow", "click", "next slide");
		}
		e.stopPropagation();
		e.preventDefault();
	}

	//------------------------------------------------
	// Tell the view to resize accordingly
	//------------------------------------------------
	function resize() {
		if (resizeTimer) {
			clearTimeout(resizeTimer);
			resizeTimer = null;
		}
		slideshowView.resize();
	}

	//------------------------------------------------
	// Get model to send off vote
	//------------------------------------------------
	function onVoteClicked(e) {
		var clickedVoteID = slideshowView.getClickedPostID();
		slideshowModel.submitVote(clickedVoteID);
	}

	//------------------------------------------------
	// Pace resize method executions
	//------------------------------------------------
	function onWindowResized(e) {
		resizeTimer = setTimeout(function() {resize();}, 20);
	}

	//------------------------------------------------
	// React to external URL changes
	//------------------------------------------------
	function onURLChanged(data) {
		if (data && data.section === SECTION_NAME) {
			if (data.entryID !== slideshowModel.getCurrentEntryID()) {
				// Show the new entry
				slideshowView.showSlide(data.entryID);
			}
		}
	}

	//------------------------------------------------
	// Start checking for a horizontal swipe
	//------------------------------------------------
	function onTouchStart(e) {

		if (!slideshowModel.getLoading()) {
			var touches = (typeof e.changedTouches != 'undefined') ? e.changedTouches : [e];
			var bounds = NATION.Utils.getOffset(DOMElement);
			touchStartY = touches[0].pageY;
			touchStartX = touches[0].pageX;
			// Stuff used to handle vertical swipes over the slideshow
			verticalSwipeInProgress = false;
			var page = NATION.Utils.getPageElement();
			startScroll = page.scrollTop;
			// Track where the touch started, so we know where to base new positions on
			var touchOffset = touchStartY - NATION.Utils.getOffset(DOMElement).top;
			offsetTop = (DOMElement.getBoundingClientRect().top + touchOffset);

			if (touchStartX > bounds.left && touchStartX < (bounds.left + DOMElement.clientWidth) && touchStartY > bounds.top && touchStartY < (bounds.top+DOMElement.clientHeight)) {
				document.documentElement.addEventListener("touchmove", onTouchMove);
				document.documentElement.addEventListener("touchend", onTouchEnd);
				document.documentElement.addEventListener("MSPointerMove", onTouchMove);
				// Could not get the MSPointerUp event to fire, have compromised with
				// using arrows on IEMobile
				document.documentElement.addEventListener("MSPointerUp", onTouchEnd);
				document.documentElement.addEventListener("PointerMove", onTouchMove);
				document.documentElement.addEventListener("PointerUp", onTouchEnd);
			}
		}
	}

	//------------------------------------------------
	// Manually scroll the page if needed
	// This prevents the user getting stuck on their phone
	//------------------------------------------------
	function onTouchMove(e) {
		// Hacky stuff to get iPad 2 working
		if (touchMovesTriggered > 10 || !IS_IOS) {
			var touches = (typeof e.changedTouches != 'undefined') ? e.changedTouches : [e];
			// Swipe tolerance is halved to be more sensitive to attempts to scroll away from the slideshow
			if (touches.length === 1) {
				if (touches[0].pageY < touchStartY - (SWIPE_TOLERANCE/2) || touches[0].pageY > touchStartY +  (SWIPE_TOLERANCE/2) || verticalSwipeInProgress) {
					// This has become a swipe, but it's vertical, so the user is
					// probably trying to scroll away. We should therefore stop annexing the touch
					// We have to pretend to do this by manually scrolling the page until touchend
					var page = NATION.Utils.getPageElement();
					page.scrollTop = (startScroll + (page.scrollTop - touches[0].pageY)) + offsetTop;
					verticalSwipeInProgress = true;
				} else {
					e.preventDefault();
				}
			}
		}
		touchMovesTriggered++;
	}

	//------------------------------------------------
	// Check if it was a valid swipe
	//------------------------------------------------
	function onTouchEnd(e) {
		var touches = (typeof e.changedTouches != 'undefined') ? e.changedTouches : [e];
		var endPos = touches[0].pageX;

		var swipe = false, reverse = false;
		if (!verticalSwipeInProgress) {
			if (endPos > touchStartX + SWIPE_TOLERANCE) {
				// Swipe was to the right, show previous slide
				swipe = reverse = true;
				onPreviousClicked(e);
			} else if (endPos < touchStartX - SWIPE_TOLERANCE) {
				// Swipe was to the left, show next slide
				swipe = true; 
				onNextClicked(e);
			}
		}
		document.documentElement.removeEventListener("touchmove", onTouchMove);
		document.documentElement.removeEventListener("touchend", onTouchEnd);
		document.documentElement.removeEventListener("MSPointerMove", onTouchMove);
		document.documentElement.removeEventListener("MSPointerUp", onTouchEnd);
		document.documentElement.removeEventListener("PointerMove", onTouchMove);
		document.documentElement.removeEventListener("PointerUp", onTouchEnd);
		verticalSwipeInProgress = false;
		touchMovesTriggered = 0;
		if (swipe) {
			e.stopPropagation();
			e.preventDefault();
		}
	}

	//------------------------------------------------
	// Scroll user to next section
	//------------------------------------------------
	function onStickerPromoClicked(e) {
		BISDT.Tracking.trackEvent("entry slideshow", "click", "promo button");
		BISDT.Mediator.publish(BISDT.Events.SCROLL_REQUEST, {selector: ".newsletter"});
		e.stopPropagation();
		e.preventDefault();
	}

	init();
};