---
layout: blog
title:  "A Simple Single Page Application"
date:   2016-05-2 16:53:06 +0100
categories: blog
footer_class: dark minified
---
When starting to build the 2016 version of Nation’s website, we decided to create an SPA, primarily to achieve the transitions between pages. Given the simple nature of the site - a page change sees the entire page change, not just part of it - I decided to build the most simple SPA structure I could think of.

The site HTML is built like any other site - separate pages with a shared header and footer. The only exception to this is the links between site sections, which are all marked with the data attribute “data-view”, which each contain a path like “/work” or “/contact”. This is the path that is used by JS to figure out which page to load. I could have used the href of anchors, but I preferred to leave them as ‘real’ links to their destinations, as at the time the real link could have been different from the application path. Keeping them separate also meant that if the JS doesn’t load for some reason, the links, and therefore the site, will continue to work regardless. So a link looks like this:

{% highlight html %}
<a href="static/work" data-view="/work">Work</a>
{% endhighlight %}

There is a listener in JS checking for clicks in the DOM, and if the target has a data-view attribute, the click will be hijacked, and JS takes over the loading of the page. The code for that looks roughly like this:

<!-- more -->

{% highlight javascript %}
// Creating the listener
document.documentElement.addEventListener("click", this.onElementClicked.bind(this));

// Elsewhere
Router.prototype.onElementClicked = function(e) {
	var url = "";
	if (e.target !== e.currentTarget && ((url = e.target.getAttribute("data-view")) || (url = this.findParentWithView(e.target)))) {
		// Don't set the URL to the same thing over and over
		if (url !== this.activePath) {
			// If the URL should change, do it here and fire the response
			history.pushState({}, "Nation", this.urlPrefix + url);
			// Provoke the page change in the same way as a pop state event
			this.onPopState();
		}
		e.stopPropagation();
		e.preventDefault();
	}
}
{% endhighlight %}

As any of the clicked element’s parents could have the data-view attribute, we also need to cycle up the parents and check those too:

{% highlight javascript %}
Router.prototype.findParentWithView = function(element) {
	var url = "";
	// While element has a parentNode, check it for the data-view attribute
	while (element.parentNode && element.parentNode.getAttribute) {
		if (url = element.parentNode.getAttribute("data-view")) {
			return url;
		}
		// Assign the parent as the element, so we can keep checking parentNode in a loop
		element = element.parentNode;
	}
	return false;
}
{% endhighlight %}

The onPopState method just gets the path from the window’s location property, and loads it via an asynchronous request. Just as it’s starting to do this, it fires an event to elsewhere in the site’s code to make the transition animate in, which covers the current page completely.

Once a page load has completed, the newly loaded page HTML is thrown inside a div element created by JS (which is not inserted into the DOM), and then the page content (not including the header and footer, which were also loaded in the same request) is pulled out, and inserted into the live DOM. The relevant JavaScript view, figured out again by the window’s location property, is instantiated on the newly inserted HTML. The transition is then told to start hiding, revealing the newly inserted page.

Obviously this post is very top-level, and the approach has a limited use case in it’s current form. Here it only makes sense for sites that change the whole page on each load (header/footer aside), but it would be possible to expand it to load sections of pages instead, with some extra logic. The advantage is that the CMS can be built just like any other site - as far as it’s concerned the site is a traditional one. Let me know if you use a similar approach.