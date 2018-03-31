{
	"entries": [
<?php

	$i = 0;
	$length = 5;
	$lastSlide = $_GET['lastid'];
	$totalEntries = 30;
	$looped = null;

	if ($lastSlide >= $totalEntries) $lastSlide = 0;

	for ($i = 0; $i < $length; $i++) {

		if (!$looped) {
			if ($_GET['direction'] === "next") {
				$id = $lastSlide + ($i+1);
			} else {
				$id = $lastSlide - ($i+1);
			}
		} else {
			if ($_GET['direction'] === "next") {
				$id = $id + 1;
			} else {
				$id = $id - 1;
			}
		}


		if ($id > $totalEntries) {
			$looped = true;
			$id = 1;
			$lastSlide = 1;
		} else if ($id < 1) {
			$looped = true;
			$id = $totalEntries;
			$lastSlide = $totalEntries;
		}

		?>
			{
				"entryID": <?php echo $id; ?>,
				"entryPosition": <?php echo $id + 3; ?>,
				"imageURL": "/sites/all/themes/bisdt/images/placeholders/entry-image.jpg",
				"firstname": "Someone <?php echo $id; ?>",
				"surname": "Whatever",
				"twitterURL": "",
				"facebookURL": "",
				"votes": 54,
				"ranking": "medium",
				"votingClosed": false,
				"shopLogo": "/sites/all/themes/bisdt/images/home/stores-logo-harrods.png",
				"shopName": "Harrods",
				"shopURL": "http://www.google.co.uk"
			}
		<?php
			if ($i < $length-1) {
				echo ",";
			}

	}
?>

	]
}