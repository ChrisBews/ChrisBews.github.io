			<footer class="site-footer">
				<div class="content">
					<h1 class="extra">Legal Information</h1>
					<ul class="">
						<li><a href="#">Terms &amp; Conditions</a></li>
						<li><a href="#">Privacy Policy</a></li>
						<li><a href="#">Cookie Policy</a></li>
						<li>Barbour &copy;</li>
					</ul>
					<a href="#" target="_blank" class="external">Visit Barbour.com</a>
				</div>
			</footer>
		</div>

		<?php
			// Google Analytics tracking code
		?>
		<script>
			(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
			(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
			m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
			})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

			ga('create', 'UA-45749518-12', 'auto');
			ga('send', 'pageview');

		</script>

		<?php
			// Leave this conditional one in for IE, it's not in the compiled JS
		?>
		<!--[if lte IE 9]>
			<script src="/sites/all/themes/bisdt/js/libs/history.iegte8.min.js"></script>
		<![endif]-->

		<!--<script src="/sites/all/themes/bisdt/js/nation/Utils.js"></script>
		<script src="/sites/all/themes/bisdt/js/nation/Animation.js"></script>
		<script src="/sites/all/themes/bisdt/js/nation/InfiniteScroll.js"></script>
		<script src="/sites/all/themes/bisdt/js/nation/ResponsiveImages.js"></script>
		<script src="/sites/all/themes/bisdt/js/nation/VerticalScrollbar.js"></script>
		<script src="/sites/all/themes/bisdt/js/nation/EventDispatcher.js"></script>
		<script src="/sites/all/themes/bisdt/js/nation/Slideshow.js"></script>

		<script src="/sites/all/themes/bisdt/js/bisdt/modules/PageManager/Controller.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/modules/PageManager/models/Settings.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/modules/PageManager/models/Events.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/modules/PageManager/models/Tracking.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/modules/PageManager/models/History.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/modules/Header/Controller.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/modules/Header/views/SlidingMenuView.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/modules/Countdown/Controller.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/modules/Countdown/models/TimeModel.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/modules/Countdown/views/TimeRemainingView.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/modules/Slideshow/Controller.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/modules/EntrySlideshow/Controller.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/modules/EntrySlideshow/models/SlideshowModel.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/modules/EntrySlideshow/views/SlideshowView.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/modules/EntrySlideshow/views/SpeedometerView.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/modules/NewsletterForm/Controller.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/modules/NewsletterForm/models/SubscriptionModel.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/modules/NewsletterForm/views/FormView.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/modules/GallerySearch/Controller.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/modules/GallerySearch/views/SearchFormView.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/modules/GalleryListing/Controller.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/modules/VerticalSections/Controller.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/modules/VerticalSections/views/SectionsView.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/modules/TopEntries/Controller.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/modules/StoreList/Controller.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/modules/EnterGuide/Controller.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/Mediator.js"></script>
		<script src="/sites/all/themes/bisdt/js/bisdt/Router.js"></script>-->

		<?php
			// Ignore the JS files above (other than the IE one) and just include this compiled one
		?>
		<script src="compiled/bisdt.js"></script>
	</body>
</html>