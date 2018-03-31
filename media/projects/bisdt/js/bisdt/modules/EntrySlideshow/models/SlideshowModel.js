// Moves individual slides around as per user request

NATION.Utils.createNamespace("BISDT.modules.EntrySlideshow.models");

BISDT.modules.EntrySlideshow.models.SlideshowModel = function(dataURL, totalEntries, voteURL) {
	
	"use strict";

	//------------------------------------------------
	// Variables
	//------------------------------------------------
	var COOKIE_NAME = "voted";
	var loading = false;
	var visibleSlides = 0;
	var entryData = {};
	var indexes = [];
	var currentIndex = 0;
	var currentEntryID = 0;
	var votedPostIDs = [];
	var allEntriesLoaded = false;

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	function init() {
		checkForVotedPostsCookie();
	};

	//------------------------------------------------
	// Checks if the cookie exists, if it does, updates
	// votedPostIDs array with the contents
	//------------------------------------------------
	function checkForVotedPostsCookie() {
		var cookiedPostIDs = readCookie(COOKIE_NAME);
		if (cookiedPostIDs) {
			votedPostIDs = cookiedPostIDs.split(",");
			var i = 0, length = votedPostIDs.length;
			for (; i < length; i++) {
				votedPostIDs[i] = parseInt(votedPostIDs[i], 10);
			}
		}
	}

	//------------------------------------------------
	// Returns value of a cookie by name
	//------------------------------------------------
	function readCookie(cookieName) {
		var nameHalf = cookieName + "=";
		var valueArray = document.cookie.split(';');
		var output = null, i = 0, length = valueArray.length, value;
		for (; i < length; i++) {
			value = valueArray[i];
			while (value.charAt(0) === ' ') value = value.substring(1, value.length);
			if (value.indexOf(nameHalf) === 0) output = value.substring(nameHalf.length, value.length);
		}
		return output;
	}

	//------------------------------------------------
	// Load data for more competition entries
	// @lastEntryID - ID of the last entry that was
	// successfully loaded
	// @count - Number of entries to return
	// @previous - true if we're cycling backwards
	// through the entries and want earlier ones
	//------------------------------------------------
	function loadEntries(lastEntryID, count, previous) {
		loading = true;
		var url = dataURL.replace("{lastid}", lastEntryID.toString());
		url = url.replace("{count}", count);
		var direction = (previous) ? "previous" : "next";
		url = url.replace("{direction}", direction);
		if (typeof window.console !== "undefined") console.log("calling " + url);
		NATION.Utils.ajax({
			url: url,
			method: "get",
			responseType: "json",
			success: function(data) {
				onEntriesLoaded(data, previous);
			},
			error: function(status, statusText) {
				throw new Error("SlideshowModel: " + statusText);
			}
		});
	}

	//------------------------------------------------
	// Store newly voted postID in the cookie
	//------------------------------------------------
	function updateVotedIDsCookie() {
		document.cookie = COOKIE_NAME + "=" + votedPostIDs.join(",");
	}

	//------------------------------------------------
	// Submits the vote to the server
	//------------------------------------------------
	function submitVote(postID) {
		if (votedPostIDs.indexOf(postID) <= -1) {
			votedPostIDs.push(postID);
			var url = voteURL.replace("{id}", postID);
			NATION.Utils.ajax({
				url: url,
				method: "post",
				success: function() {
					entryData[postID].votes = parseInt(entryData[postID].votes, 10) + 1;
					if (entryData[postID].votes === 1) entryData[postID].ranking = "low";
					updateVotedIDsCookie();
					if (typeof window.console !== "undefined") console.log("Vote cast for post " + postID);
				},
				error: function(status, statusText) {
					if (typeof window.console !== "undefined") console.log("Error: Vote for post " + postID + " was not successfully sent.");
				}
			});
		}
	}

	//------------------------------------------------
	// Returns data for an entry not currently visible (when rotating forwards)
	//------------------------------------------------
	function getLaterSlideData() {
		var targetIndex = currentIndex + Math.floor(visibleSlides/2);
		if (!indexes[targetIndex]) {
			targetIndex = targetIndex - indexes.length;
		}
		var entryID = indexes[targetIndex];
		return entryData[entryID];
	}

	//------------------------------------------------
	// Returns data for an entry not currently visible (when rotating backwards)
	//------------------------------------------------
	function getEarlierSlideData() {
		var targetIndex = currentIndex - Math.floor(visibleSlides/2);
		if (targetIndex < 0) {
			targetIndex = (indexes.length-1) + (targetIndex+1);
		}
		var entryID = indexes[targetIndex];
		return entryData[entryID];
	}

	//------------------------------------------------
	// Return slide data for requested index
	//------------------------------------------------
	function getSlideDataByIndex(index) {
		var entryID = indexes[index];
		return entryData[entryID]
	}

	//------------------------------------------------
	// Returns the ID of the current slide
	//------------------------------------------------
	function getCurrentEntryID() {
		return indexes[currentIndex];
	}

	//------------------------------------------------
	// Returns current slide index (NOT ID)
	//------------------------------------------------
	function getCurrentIndex() {
		return currentIndex;
	}

	//------------------------------------------------
	// Returns true if entryID matches next slide
	//------------------------------------------------
	function isNextSlide(entryID) {
		var slideExists = (indexes[currentIndex+1]);
		if (slideExists) {
			return (entryID === indexes[currentIndex+1]);
		} else {
			return false;
		}
	}

	//------------------------------------------------
	// Returns true if entryID matches previous slide
	//------------------------------------------------
	function isPreviousSlide(entryID) {
		var slideExists = (indexes[currentIndex-1]);
		if (slideExists) {
			return (entryID === indexes[currentIndex-1]);
		} else {
			return false;
		}
	}

	//------------------------------------------------
	// Checks for entryID, and also +-2 entries around it
	//------------------------------------------------
	function isSlideLoaded(entryID) {
		var entryIndex = indexes.indexOf(entryID);
		if (!entryIndex) return false;
		var i = entryIndex-Math.round(visibleSlides/2), length = visibleSlides;
		for (; i < length; i++) {
			if (!indexes[i]) {
				return false;
			}
		}
		return true;
	}

	//------------------------------------------------
	// Increase the current ID and check if we need to
	// load more entries
	//------------------------------------------------
	function increaseCurrentEntryID() {
		currentIndex++;
		if (currentIndex > indexes.length-1) {
			currentIndex = 0;
		}
		currentEntryID = indexes[currentIndex];
		if (!indexes[currentIndex + Math.floor(visibleSlides/2)] && currentIndex < (indexes.length-1)) {
			if (!allEntriesLoaded) {
				var index = currentIndex + Math.floor(visibleSlides/2)-1;
				loadEntries(indexes[indexes.length-1], visibleSlides, false);
			}
		}
	}

	//------------------------------------------------
	// Decrease the current ID and check if we need to
	// load more entries
	//------------------------------------------------
	function decreaseCurrentEntryID() {
		currentIndex--;
		currentEntryID = indexes[currentIndex];
		if (currentIndex < 0) currentIndex = indexes.length-1;
		if (currentIndex < Math.floor(visibleSlides/2) && !allEntriesLoaded) {
			var index = currentIndex - Math.floor(visibleSlides/2) - 1;
			loadEntries(indexes[0], visibleSlides, true);
		}
	}

	//------------------------------------------------
	// Entries have already loaded in the initial HTML
	//------------------------------------------------
	function setStartingData(data) {
		// Start off the indexes object for these initial entries
		var i = 0, length = visibleSlides, id = 0;
		for (; i < length; i++) {
			id = data[i].entryID;
			entryData[data[i].entryID] = data[i];
			indexes.push(data[i].entryID);
			if (data[i].votingClosed) votedPostIDs.push(data[i].entryID);
		}
		currentIndex = Math.floor(visibleSlides/2);
		//indexes.sort(sortArrayNumerically);
		currentEntryID = indexes[currentIndex];
	}

	//------------------------------------------------
	// Sort array numerically
	//------------------------------------------------
	function sortArrayNumerically(a, b) {
		return (a-b);
	}

	//------------------------------------------------
	// Sets number of slides on the page at once
	//------------------------------------------------
	function setVisibleSlides(value) {
		visibleSlides = value;
	}

	//------------------------------------------------
	// Returns true if this post has already been voted on
	//------------------------------------------------
	function hasBeenVoted(postID) {
		return (votedPostIDs.indexOf(postID) > -1);
	}

	//------------------------------------------------
	// Parse new entries
	//------------------------------------------------
	function onEntriesLoaded(data, previous) {
		var entries = data.entries;
		var i = 0, length = entries.length, id = 0, looped = false, lastID;
		for (; i < length; i++) {
			id = entries[i].entryID;
			if (indexes.indexOf(id) <= -1) {
				entryData[entries[i].entryID] = entries[i];
				if (previous) {
					indexes.unshift(id);
				} else {
					indexes.push(id);
				}
			}

			lastID = id;
			if (indexes.length === totalEntries) {
				allEntriesLoaded = true;
				break;
			}
		}
		// Update the current index in case things moved around
		i = 0; length = indexes.length;
		for (; i < length; i++) {
			if (indexes[i] === currentEntryID) {
				currentIndex = i;
			}
		}
		loading = false;
	}

	init();

	//----------------------------------------------------------------------
	// Public API
	//----------------------------------------------------------------------
	return {
		getLoading: function() {return loading;},
		getCurrentEntryID: getCurrentEntryID,
		getCurrentIndex: getCurrentIndex,
		increaseCurrentEntryID: increaseCurrentEntryID,
		decreaseCurrentEntryID: decreaseCurrentEntryID,
		setStartingData: setStartingData,
		setVisibleSlides: setVisibleSlides,
		loadEntries: loadEntries,
		getSlideDataByIndex: getSlideDataByIndex,
		getLaterSlideData: getLaterSlideData,
		getEarlierSlideData: getEarlierSlideData,
		submitVote: submitVote,
		hasBeenVoted: hasBeenVoted,
		isNextSlide: isNextSlide,
		isPreviousSlide: isPreviousSlide,
		isSlideLoaded: isSlideLoaded
	}
};