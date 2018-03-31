// Individual speedometer, one per entry

NATION.Utils.createNamespace("BISDT.modules.EntrySlideshow.views");

BISDT.modules.EntrySlideshow.views.SpeedometerView = function(DOMElement, template, totalVotes, voteRanking) {
	
	"use strict";

	//------------------------------------------------
	// Variables
	//------------------------------------------------
	var ARROW_TARGETS = {
		"none": -22,
		"low": 24,
		"medium": 113,
		"high": 180
	};
	var arrowSelector = null;
	var progressSelector = null;
	var progressCoverSelector = null;
	var digits = [];
	var digitHeight = 0;

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	function init() {
		createUI();
		getElementReferences();
		digitHeight = digits[0].querySelectorAll("span")[0].clientHeight;
		resetArrow();
		resetDigits();
	}

	//------------------------------------------------
	// Add the template HTML
	//------------------------------------------------
	function createUI() {
		DOMElement.innerHTML += template;
		DOMElement.setAttribute("data-whatever", totalVotes);
	}

	//------------------------------------------------
	// Store references to certain assets
	//------------------------------------------------
	function getElementReferences() {
		arrowSelector = DOMElement.querySelector(".dial-arrow");
		progressSelector = DOMElement.querySelector(".dial-progress");
		progressCoverSelector = DOMElement.querySelector(".dial-progress-cover");
		digits = DOMElement.querySelectorAll(".digit");
	}

	//------------------------------------------------
	// Stop digits from animating
	//------------------------------------------------
	function resetDigits() {
		var i = 0, length = digits.length;
		for (; i < length; i++) {
			NATION.Animation.stop(digits[i]);
			digits[i].style.top = 0;
		}
	}

	//------------------------------------------------
	// Move everything back to starting positions
	//------------------------------------------------
	function resetArrow() {
		NATION.Animation.stop(arrowSelector);
		NATION.Animation.stop(progressSelector);
		NATION.Animation.stop(progressCoverSelector);
		NATION.Utils.setStyle(arrowSelector, {transform: "rotate(-22deg)"});
		NATION.Utils.setStyle(progressSelector, {transform: "rotate(-225deg)"});
		NATION.Utils.setStyle(progressCoverSelector, {transform: "rotate(-100deg)"});
	}

	//------------------------------------------------
	// Play the animation if votes > 0
	//------------------------------------------------
	function play() {
		if (totalVotes > 0) {
			animateArrow();
			animateDigits();
		}
	}

	//------------------------------------------------
	// Immediately show the vote count, instead of
	// animating towards it
	//------------------------------------------------
	function showVotes() {
		if (totalVotes > 0) {
			// Set arrow to correct position
			NATION.Animation.stop(arrowSelector);
			NATION.Animation.stop(progressSelector);
			NATION.Animation.stop(progressCoverSelector);
			NATION.Utils.setStyle(arrowSelector, {transform: "rotate(" + ARROW_TARGETS[voteRanking] + "deg)"});
			var rotation = ARROW_TARGETS[voteRanking] - 200;
			NATION.Utils.setStyle(progressSelector, {transform: "rotate(" + rotation + "deg)"});
			rotation = ARROW_TARGETS[voteRanking] - 130;
			if (rotation > 0) rotation = 0;
			NATION.Utils.setStyle(progressCoverSelector, {transform: "rotate(" + rotation + "deg)"});
			// Set numbers to correct positions
			animateDigits(false, true);
		}
		
	}

	//------------------------------------------------
	// Scroll numbers up to correct number
	//------------------------------------------------
	function animateDigits(quick, immediate) {
		var totalString = totalVotes.toString();
		var length = totalString.length, i = length-1, k = digits.length-1, yPos;
		for (; i >= 0; i--) {
			yPos = -(digitHeight * parseInt(totalString[i], 10));
			if (!immediate) {
				var duration = (quick) ? 1000 : 2500;
				NATION.Animation.start(digits[k], {top: yPos}, {duration: duration, easing: "easeInOutQuad"});
			} else {
				digits[k].style.top = yPos + "px";
			}
			k--;
		}
	}

	//------------------------------------------------
	// Animate arrow to target position
	//------------------------------------------------
	function animateArrow() {
		var arrowTarget = ARROW_TARGETS[voteRanking] + 10;
		NATION.Animation.start(progressSelector, {transform: "rotate(" + (arrowTarget - 200) + "deg)"}, {duration: 1500, easing: "easeInOutQuad"});
		// Animate the right hand cover out of the way as much as needed
		var coverTarget = (arrowTarget-130);
		if (coverTarget > 0) coverTarget = 0;
		NATION.Animation.start(progressCoverSelector, {transform: "rotate(" + coverTarget + "deg)"}, {duration: 1500, easing: "easeInOutQuad"});
		// Start animating arrow
		NATION.Animation.start(arrowSelector, {transform: "rotate(" + arrowTarget + "deg)"}, {duration: 1500, easing: "easeInOutQuad"}, function(e) {
			arrowTarget = ARROW_TARGETS[voteRanking] - 10;
			NATION.Animation.start(progressSelector, {transform: "rotate(" + (arrowTarget - 200) + "deg)"}, {duration: 1500, easing: "easeInOutQuad"});

			NATION.Animation.start(arrowSelector, {transform: "rotate(" + arrowTarget + "deg)"}, {duration: 1500, easing: "easeInOutQuad"}, function(e) {
				arrowTarget = ARROW_TARGETS[voteRanking];
				NATION.Animation.start(progressSelector, {transform: "rotate(" + (arrowTarget - 200) + "deg)"}, {duration: 2000, easing: "easeInOutQuad"});
				NATION.Animation.start(arrowSelector, {transform: "rotate(" + arrowTarget + "deg)"}, {duration: 2000, easing: "easeInOutQuad"});
			});
		});
	}

	//------------------------------------------------
	// Someone voted on this entry, so bump the count
	//------------------------------------------------
	function incrementVoteCount() {
		totalVotes++;
		animateDigits(true);
		if (totalVotes === 1) {
			voteRanking = "low";
			animateArrow();
		}
	}

	init();

	return {
		play: play,
		showVotes: showVotes,
		incrementVoteCount: incrementVoteCount,
		reset: function(element) {
			DOMElement = element;
			getElementReferences();
			resetDigits();
			resetArrow();
		}
	}
};