'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

/*!
 * History API JavaScript Library v4.2.1
 *
 * Support: IE8+, FF3+, Opera 9+, Safari, Chrome and other
 *
 * Copyright 2011-2015, Dmitrii Pakhtinov ( spb.piksel@gmail.com )
 *
 * http://spb-piksel.ru/
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Update: 2015-05-22 13:02
 */
(function (factory) {
    if (typeof define === 'function' && define['amd']) {
        // https://github.com/devote/HTML5-History-API/issues/73
        var rndKey = '[history' + new Date().getTime() + ']';
        var onError = requirejs['onError'];
        factory.toString = function () {
            return rndKey;
        };
        requirejs['onError'] = function (err) {
            if (err.message.indexOf(rndKey) === -1) {
                onError.call(requirejs, err);
            }
        };
        define([], factory);
    }
    // execute anyway
    factory();
})(function () {
    // Define global variable
    var global = ((typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' ? window : this) || {};
    // Prevent the code from running if there is no window.history object or library already loaded
    if (!global.history || "emulate" in global.history) return global.history;
    // symlink to document
    var document = global.document;
    // HTML element
    var documentElement = document.documentElement;
    // symlink to constructor of Object
    var Object = global['Object'];
    // symlink to JSON Object
    var JSON = global['JSON'];
    // symlink to instance object of 'Location'
    var windowLocation = global.location;
    // symlink to instance object of 'History'
    var windowHistory = global.history;
    // new instance of 'History'. The default is a reference to the original object instance
    var historyObject = windowHistory;
    // symlink to method 'history.pushState'
    var historyPushState = windowHistory.pushState;
    // symlink to method 'history.replaceState'
    var historyReplaceState = windowHistory.replaceState;
    // if the browser supports HTML5-History-API
    var isSupportHistoryAPI = !!historyPushState;
    // verifies the presence of an object 'state' in interface 'History'
    var isSupportStateObjectInHistory = 'state' in windowHistory;
    // symlink to method 'Object.defineProperty'
    var defineProperty = Object.defineProperty;
    // new instance of 'Location', for IE8 will use the element HTMLAnchorElement, instead of pure object
    var locationObject = redefineProperty({}, 't') ? {} : document.createElement('a');
    // prefix for the names of events
    var eventNamePrefix = '';
    // String that will contain the name of the method
    var addEventListenerName = global.addEventListener ? 'addEventListener' : (eventNamePrefix = 'on') && 'attachEvent';
    // String that will contain the name of the method
    var removeEventListenerName = global.removeEventListener ? 'removeEventListener' : 'detachEvent';
    // String that will contain the name of the method
    var dispatchEventName = global.dispatchEvent ? 'dispatchEvent' : 'fireEvent';
    // reference native methods for the events
    var addEvent = global[addEventListenerName];
    var removeEvent = global[removeEventListenerName];
    var dispatch = global[dispatchEventName];
    // default settings
    var settings = { "basepath": '/', "redirect": 0, "type": '/', "init": 0 };
    // key for the sessionStorage
    var sessionStorageKey = '__historyAPI__';
    // Anchor Element for parseURL function
    var anchorElement = document.createElement('a');
    // last URL before change to new URL
    var lastURL = windowLocation.href;
    // Control URL, need to fix the bug in Opera
    var checkUrlForPopState = '';
    // for fix on Safari 8
    var triggerEventsInWindowAttributes = 1;
    // trigger event 'onpopstate' on page load
    var isFireInitialState = false;
    // if used history.location of other code
    var isUsedHistoryLocationFlag = 0;
    // store a list of 'state' objects in the current session
    var stateStorage = {};
    // in this object will be stored custom handlers
    var eventsList = {};
    // stored last title
    var lastTitle = document.title;

    /**
     * Properties that will be replaced in the global
     * object 'window', to prevent conflicts
     *
     * @type {Object}
     */
    var eventsDescriptors = {
        "onhashchange": null,
        "onpopstate": null
    };

    /**
     * Fix for Chrome in iOS
     * See https://github.com/devote/HTML5-History-API/issues/29
     */
    var fastFixChrome = function fastFixChrome(method, args) {
        var isNeedFix = global.history !== windowHistory;
        if (isNeedFix) {
            global.history = windowHistory;
        }
        method.apply(windowHistory, args);
        if (isNeedFix) {
            global.history = historyObject;
        }
    };

    /**
     * Properties that will be replaced/added to object
     * 'window.history', includes the object 'history.location',
     * for a complete the work with the URL address
     *
     * @type {Object}
     */
    var historyDescriptors = {
        /**
         * Setting library initialization
         *
         * @param {null|String} [basepath] The base path to the site; defaults to the root "/".
         * @param {null|String} [type] Substitute the string after the anchor; by default "/".
         * @param {null|Boolean} [redirect] Enable link translation.
         */
        "setup": function setup(basepath, type, redirect) {
            settings["basepath"] = ('' + (basepath == null ? settings["basepath"] : basepath)).replace(/(?:^|\/)[^\/]*$/, '/');
            settings["type"] = type == null ? settings["type"] : type;
            settings["redirect"] = redirect == null ? settings["redirect"] : !!redirect;
        },
        /**
         * @namespace history
         * @param {String} [type]
         * @param {String} [basepath]
         */
        "redirect": function redirect(type, basepath) {
            historyObject['setup'](basepath, type);
            basepath = settings["basepath"];
            if (global.top == global.self) {
                var relative = parseURL(null, false, true)._relative;
                var path = windowLocation.pathname + windowLocation.search;
                if (isSupportHistoryAPI) {
                    path = path.replace(/([^\/])$/, '$1/');
                    if (relative != basepath && new RegExp("^" + basepath + "$", "i").test(path)) {
                        windowLocation.replace(relative);
                    }
                } else if (path != basepath) {
                    path = path.replace(/([^\/])\?/, '$1/?');
                    if (new RegExp("^" + basepath, "i").test(path)) {
                        windowLocation.replace(basepath + '#' + path.replace(new RegExp("^" + basepath, "i"), settings["type"]) + windowLocation.hash);
                    }
                }
            }
        },
        /**
         * The method adds a state object entry
         * to the history.
         *
         * @namespace history
         * @param {Object} state
         * @param {string} title
         * @param {string} [url]
         */
        pushState: function pushState(state, title, url) {
            var t = document.title;
            if (lastTitle != null) {
                document.title = lastTitle;
            }
            historyPushState && fastFixChrome(historyPushState, arguments);
            changeState(state, url);
            document.title = t;
            lastTitle = title;
        },
        /**
         * The method updates the state object,
         * title, and optionally the URL of the
         * current entry in the history.
         *
         * @namespace history
         * @param {Object} state
         * @param {string} title
         * @param {string} [url]
         */
        replaceState: function replaceState(state, title, url) {
            var t = document.title;
            if (lastTitle != null) {
                document.title = lastTitle;
            }
            delete stateStorage[windowLocation.href];
            historyReplaceState && fastFixChrome(historyReplaceState, arguments);
            changeState(state, url, true);
            document.title = t;
            lastTitle = title;
        },
        /**
         * Object 'history.location' is similar to the
         * object 'window.location', except that in
         * HTML4 browsers it will behave a bit differently
         *
         * @namespace history
         */
        "location": {
            set: function set(value) {
                if (isUsedHistoryLocationFlag === 0) isUsedHistoryLocationFlag = 1;
                global.location = value;
            },
            get: function get() {
                if (isUsedHistoryLocationFlag === 0) isUsedHistoryLocationFlag = 1;
                return isSupportHistoryAPI ? windowLocation : locationObject;
            }
        },
        /**
         * A state object is an object representing
         * a user interface state.
         *
         * @namespace history
         */
        "state": {
            get: function get() {
                return stateStorage[windowLocation.href] || null;
            }
        }
    };

    /**
     * Properties for object 'history.location'.
     * Object 'history.location' is similar to the
     * object 'window.location', except that in
     * HTML4 browsers it will behave a bit differently
     *
     * @type {Object}
     */
    var locationDescriptors = {
        /**
         * Navigates to the given page.
         *
         * @namespace history.location
         */
        assign: function assign(url) {
            if (('' + url).indexOf('#') === 0) {
                changeState(null, url);
            } else {
                windowLocation.assign(url);
            }
        },
        /**
         * Reloads the current page.
         *
         * @namespace history.location
         */
        reload: function reload() {
            windowLocation.reload();
        },
        /**
         * Removes the current page from
         * the session history and navigates
         * to the given page.
         *
         * @namespace history.location
         */
        replace: function replace(url) {
            if (('' + url).indexOf('#') === 0) {
                changeState(null, url, true);
            } else {
                windowLocation.replace(url);
            }
        },
        /**
         * Returns the current page's location.
         *
         * @namespace history.location
         */
        toString: function toString() {
            return this.href;
        },
        /**
         * Returns the current page's location.
         * Can be set, to navigate to another page.
         *
         * @namespace history.location
         */
        "href": {
            get: function get() {
                return parseURL()._href;
            }
        },
        /**
         * Returns the current page's protocol.
         *
         * @namespace history.location
         */
        "protocol": null,
        /**
         * Returns the current page's host and port number.
         *
         * @namespace history.location
         */
        "host": null,
        /**
         * Returns the current page's host.
         *
         * @namespace history.location
         */
        "hostname": null,
        /**
         * Returns the current page's port number.
         *
         * @namespace history.location
         */
        "port": null,
        /**
         * Returns the current page's path only.
         *
         * @namespace history.location
         */
        "pathname": {
            get: function get() {
                return parseURL()._pathname;
            }
        },
        /**
         * Returns the current page's search
         * string, beginning with the character
         * '?' and to the symbol '#'
         *
         * @namespace history.location
         */
        "search": {
            get: function get() {
                return parseURL()._search;
            }
        },
        /**
         * Returns the current page's hash
         * string, beginning with the character
         * '#' and to the end line
         *
         * @namespace history.location
         */
        "hash": {
            set: function set(value) {
                changeState(null, ('' + value).replace(/^(#|)/, '#'), false, lastURL);
            },
            get: function get() {
                return parseURL()._hash;
            }
        }
    };

    /**
     * Just empty function
     *
     * @return void
     */
    function emptyFunction() {}
    // dummy


    /**
     * Prepares a parts of the current or specified reference for later use in the library
     *
     * @param {string} [href]
     * @param {boolean} [isWindowLocation]
     * @param {boolean} [isNotAPI]
     * @return {Object}
     */
    function parseURL(href, isWindowLocation, isNotAPI) {
        var re = /(?:(\w+\:))?(?:\/\/(?:[^@]*@)?([^\/:\?#]+)(?::([0-9]+))?)?([^\?#]*)(?:(\?[^#]+)|\?)?(?:(#.*))?/;
        if (href != null && href !== '' && !isWindowLocation) {
            var current = parseURL(),
                base = document.getElementsByTagName('base')[0];
            if (!isNotAPI && base && base.getAttribute('href')) {
                // Fix for IE ignoring relative base tags.
                // See http://stackoverflow.com/questions/3926197/html-base-tag-and-local-folder-path-with-internet-explorer
                base.href = base.href;
                current = parseURL(base.href, null, true);
            }
            var _pathname = current._pathname,
                _protocol = current._protocol;
            // convert to type of string
            href = '' + href;
            // convert relative link to the absolute
            href = /^(?:\w+\:)?\/\//.test(href) ? href.indexOf("/") === 0 ? _protocol + href : href : _protocol + "//" + current._host + (href.indexOf("/") === 0 ? href : href.indexOf("?") === 0 ? _pathname + href : href.indexOf("#") === 0 ? _pathname + current._search + href : _pathname.replace(/[^\/]+$/g, '') + href);
        } else {
            href = isWindowLocation ? href : windowLocation.href;
            // if current browser not support History-API
            if (!isSupportHistoryAPI || isNotAPI) {
                // get hash fragment
                href = href.replace(/^[^#]*/, '') || "#";
                // form the absolute link from the hash
                // https://github.com/devote/HTML5-History-API/issues/50
                href = windowLocation.protocol.replace(/:.*$|$/, ':') + '//' + windowLocation.host + settings['basepath'] + href.replace(new RegExp("^#[\/]?(?:" + settings["type"] + ")?"), "");
            }
        }
        // that would get rid of the links of the form: /../../
        anchorElement.href = href;
        // decompose the link in parts
        var result = re.exec(anchorElement.href);
        // host name with the port number
        var host = result[2] + (result[3] ? ':' + result[3] : '');
        // folder
        var pathname = result[4] || '/';
        // the query string
        var search = result[5] || '';
        // hash
        var hash = result[6] === '#' ? '' : result[6] || '';
        // relative link, no protocol, no host
        var relative = pathname + search + hash;
        // special links for set to hash-link, if browser not support History API
        var nohash = pathname.replace(new RegExp("^" + settings["basepath"], "i"), settings["type"]) + search;
        // result
        return {
            _href: result[1] + '//' + host + relative,
            _protocol: result[1],
            _host: host,
            _hostname: result[2],
            _port: result[3] || '',
            _pathname: pathname,
            _search: search,
            _hash: hash,
            _relative: relative,
            _nohash: nohash,
            _special: nohash + hash
        };
    }

    /**
     * Initializing storage for the custom state's object
     */
    function storageInitialize() {
        var sessionStorage;
        /**
         * sessionStorage throws error when cookies are disabled
         * Chrome content settings when running the site in a Facebook IFrame.
         * see: https://github.com/devote/HTML5-History-API/issues/34
         * and: http://stackoverflow.com/a/12976988/669360
         */
        try {
            sessionStorage = global['sessionStorage'];
            sessionStorage.setItem(sessionStorageKey + 't', '1');
            sessionStorage.removeItem(sessionStorageKey + 't');
        } catch (_e_) {
            sessionStorage = {
                getItem: function getItem(key) {
                    var cookie = document.cookie.split(key + "=");
                    return cookie.length > 1 && cookie.pop().split(";").shift() || 'null';
                },
                setItem: function setItem(key, value) {
                    var state = {};
                    // insert one current element to cookie
                    if (state[windowLocation.href] = historyObject.state) {
                        document.cookie = key + '=' + JSON.stringify(state);
                    }
                }
            };
        }

        try {
            // get cache from the storage in browser
            stateStorage = JSON.parse(sessionStorage.getItem(sessionStorageKey)) || {};
        } catch (_e_) {
            stateStorage = {};
        }

        // hang up the event handler to event unload page
        addEvent(eventNamePrefix + 'unload', function () {
            // save current state's object
            sessionStorage.setItem(sessionStorageKey, JSON.stringify(stateStorage));
        }, false);
    }

    /**
     * This method is implemented to override the built-in(native)
     * properties in the browser, unfortunately some browsers are
     * not allowed to override all the properties and even add.
     * For this reason, this was written by a method that tries to
     * do everything necessary to get the desired result.
     *
     * @param {Object} object The object in which will be overridden/added property
     * @param {String} prop The property name to be overridden/added
     * @param {Object} [descriptor] An object containing properties set/get
     * @param {Function} [onWrapped] The function to be called when the wrapper is created
     * @return {Object|Boolean} Returns an object on success, otherwise returns false
     */
    function redefineProperty(object, prop, _descriptor, onWrapped) {
        var testOnly = 0;
        // test only if descriptor is undefined
        if (!_descriptor) {
            _descriptor = { set: emptyFunction };
            testOnly = 1;
        }
        // variable will have a value of true the success of attempts to set descriptors
        var isDefinedSetter = !_descriptor.set;
        var isDefinedGetter = !_descriptor.get;
        // for tests of attempts to set descriptors
        var test = { configurable: true, set: function set() {
                isDefinedSetter = 1;
            }, get: function get() {
                isDefinedGetter = 1;
            } };

        try {
            // testing for the possibility of overriding/adding properties
            defineProperty(object, prop, test);
            // running the test
            object[prop] = object[prop];
            // attempt to override property using the standard method
            defineProperty(object, prop, _descriptor);
        } catch (_e_) {}

        // If the variable 'isDefined' has a false value, it means that need to try other methods
        if (!isDefinedSetter || !isDefinedGetter) {
            // try to override/add the property, using deprecated functions
            if (object.__defineGetter__) {
                // testing for the possibility of overriding/adding properties
                object.__defineGetter__(prop, test.get);
                object.__defineSetter__(prop, test.set);
                // running the test
                object[prop] = object[prop];
                // attempt to override property using the deprecated functions
                _descriptor.get && object.__defineGetter__(prop, _descriptor.get);
                _descriptor.set && object.__defineSetter__(prop, _descriptor.set);
            }

            // Browser refused to override the property, using the standard and deprecated methods
            if (!isDefinedSetter || !isDefinedGetter) {
                if (testOnly) {
                    return false;
                } else if (object === global) {
                    // try override global properties
                    try {
                        // save original value from this property
                        var originalValue = object[prop];
                        // set null to built-in(native) property
                        object[prop] = null;
                    } catch (_e_) {}
                    // This rule for Internet Explorer 8
                    if ('execScript' in global) {
                        /**
                         * to IE8 override the global properties using
                         * VBScript, declaring it in global scope with
                         * the same names.
                         */
                        global['execScript']('Public ' + prop, 'VBScript');
                        global['execScript']('var ' + prop + ';', 'JavaScript');
                    } else {
                        try {
                            /**
                             * This hack allows to override a property
                             * with the set 'configurable: false', working
                             * in the hack 'Safari' to 'Mac'
                             */
                            defineProperty(object, prop, { value: emptyFunction });
                        } catch (_e_) {
                            if (prop === 'onpopstate') {
                                /**
                                 * window.onpopstate fires twice in Safari 8.0.
                                 * Block initial event on window.onpopstate
                                 * See: https://github.com/devote/HTML5-History-API/issues/69
                                 */
                                addEvent('popstate', _descriptor = function descriptor() {
                                    removeEvent('popstate', _descriptor, false);
                                    var onpopstate = object.onpopstate;
                                    // cancel initial event on attribute handler
                                    object.onpopstate = null;
                                    setTimeout(function () {
                                        // restore attribute value after short time
                                        object.onpopstate = onpopstate;
                                    }, 1);
                                }, false);
                                // cancel trigger events on attributes in object the window
                                triggerEventsInWindowAttributes = 0;
                            }
                        }
                    }
                    // set old value to new variable
                    object[prop] = originalValue;
                } else {
                    // the last stage of trying to override the property
                    try {
                        try {
                            // wrap the object in a new empty object
                            var temp = Object.create(object);
                            defineProperty(Object.getPrototypeOf(temp) === object ? temp : object, prop, _descriptor);
                            for (var key in object) {
                                // need to bind a function to the original object
                                if (typeof object[key] === 'function') {
                                    temp[key] = object[key].bind(object);
                                }
                            }
                            try {
                                // to run a function that will inform about what the object was to wrapped
                                onWrapped.call(temp, temp, object);
                            } catch (_e_) {}
                            object = temp;
                        } catch (_e_) {
                            // sometimes works override simply by assigning the prototype property of the constructor
                            defineProperty(object.constructor.prototype, prop, _descriptor);
                        }
                    } catch (_e_) {
                        // all methods have failed
                        return false;
                    }
                }
            }
        }

        return object;
    }

    /**
     * Adds the missing property in descriptor
     *
     * @param {Object} object An object that stores values
     * @param {String} prop Name of the property in the object
     * @param {Object|null} descriptor Descriptor
     * @return {Object} Returns the generated descriptor
     */
    function prepareDescriptorsForObject(object, prop, descriptor) {
        descriptor = descriptor || {};
        // the default for the object 'location' is the standard object 'window.location'
        object = object === locationDescriptors ? windowLocation : object;
        // setter for object properties
        descriptor.set = descriptor.set || function (value) {
            object[prop] = value;
        };
        // getter for object properties
        descriptor.get = descriptor.get || function () {
            return object[prop];
        };
        return descriptor;
    }

    /**
     * Wrapper for the methods 'addEventListener/attachEvent' in the context of the 'window'
     *
     * @param {String} event The event type for which the user is registering
     * @param {Function} listener The method to be called when the event occurs.
     * @param {Boolean} capture If true, capture indicates that the user wishes to initiate capture.
     * @return void
     */
    function addEventListener(event, listener, capture) {
        if (event in eventsList) {
            // here stored the event listeners 'popstate/hashchange'
            eventsList[event].push(listener);
        } else {
            // FireFox support non-standart four argument aWantsUntrusted
            // https://github.com/devote/HTML5-History-API/issues/13
            if (arguments.length > 3) {
                addEvent(event, listener, capture, arguments[3]);
            } else {
                addEvent(event, listener, capture);
            }
        }
    }

    /**
     * Wrapper for the methods 'removeEventListener/detachEvent' in the context of the 'window'
     *
     * @param {String} event The event type for which the user is registered
     * @param {Function} listener The parameter indicates the Listener to be removed.
     * @param {Boolean} capture Was registered as a capturing listener or not.
     * @return void
     */
    function removeEventListener(event, listener, capture) {
        var list = eventsList[event];
        if (list) {
            for (var i = list.length; i--;) {
                if (list[i] === listener) {
                    list.splice(i, 1);
                    break;
                }
            }
        } else {
            removeEvent(event, listener, capture);
        }
    }

    /**
     * Wrapper for the methods 'dispatchEvent/fireEvent' in the context of the 'window'
     *
     * @param {Event|String} event Instance of Event or event type string if 'eventObject' used
     * @param {*} [eventObject] For Internet Explorer 8 required event object on this argument
     * @return {Boolean} If 'preventDefault' was called the value is false, else the value is true.
     */
    function dispatchEvent(event, eventObject) {
        var eventType = ('' + (typeof event === "string" ? event : event.type)).replace(/^on/, '');
        var list = eventsList[eventType];
        if (list) {
            // need to understand that there is one object of Event
            eventObject = typeof event === "string" ? eventObject : event;
            if (eventObject.target == null) {
                // need to override some of the properties of the Event object
                for (var props = ['target', 'currentTarget', 'srcElement', 'type']; event = props.pop();) {
                    // use 'redefineProperty' to override the properties
                    eventObject = redefineProperty(eventObject, event, {
                        get: event === 'type' ? function () {
                            return eventType;
                        } : function () {
                            return global;
                        }
                    });
                }
            }
            if (triggerEventsInWindowAttributes) {
                // run function defined in the attributes 'onpopstate/onhashchange' in the 'window' context
                ((eventType === 'popstate' ? global.onpopstate : global.onhashchange) || emptyFunction).call(global, eventObject);
            }
            // run other functions that are in the list of handlers
            for (var i = 0, len = list.length; i < len; i++) {
                list[i].call(global, eventObject);
            }
            return true;
        } else {
            return dispatch(event, eventObject);
        }
    }

    /**
     * dispatch current state event
     */
    function firePopState() {
        var o = document.createEvent ? document.createEvent('Event') : document.createEventObject();
        if (o.initEvent) {
            o.initEvent('popstate', false, false);
        } else {
            o.type = 'popstate';
        }
        o.state = historyObject.state;
        // send a newly created events to be processed
        dispatchEvent(o);
    }

    /**
     * fire initial state for non-HTML5 browsers
     */
    function fireInitialState() {
        if (isFireInitialState) {
            isFireInitialState = false;
            firePopState();
        }
    }

    /**
     * Change the data of the current history for HTML4 browsers
     *
     * @param {Object} state
     * @param {string} [url]
     * @param {Boolean} [replace]
     * @param {string} [lastURLValue]
     * @return void
     */
    function changeState(state, url, replace, lastURLValue) {
        if (!isSupportHistoryAPI) {
            // if not used implementation history.location
            if (isUsedHistoryLocationFlag === 0) isUsedHistoryLocationFlag = 2;
            // normalization url
            var urlObject = parseURL(url, isUsedHistoryLocationFlag === 2 && ('' + url).indexOf("#") !== -1);
            // if current url not equal new url
            if (urlObject._relative !== parseURL()._relative) {
                // if empty lastURLValue to skip hash change event
                lastURL = lastURLValue;
                if (replace) {
                    // only replace hash, not store to history
                    windowLocation.replace("#" + urlObject._special);
                } else {
                    // change hash and add new record to history
                    windowLocation.hash = urlObject._special;
                }
            }
        } else {
            lastURL = windowLocation.href;
        }
        if (!isSupportStateObjectInHistory && state) {
            stateStorage[windowLocation.href] = state;
        }
        isFireInitialState = false;
    }

    /**
     * Event handler function changes the hash in the address bar
     *
     * @param {Event} event
     * @return void
     */
    function onHashChange(event) {
        // https://github.com/devote/HTML5-History-API/issues/46
        var fireNow = lastURL;
        // new value to lastURL
        lastURL = windowLocation.href;
        // if not empty fireNow, otherwise skipped the current handler event
        if (fireNow) {
            // if checkUrlForPopState equal current url, this means that the event was raised popstate browser
            if (checkUrlForPopState !== windowLocation.href) {
                // otherwise,
                // the browser does not support popstate event or just does not run the event by changing the hash.
                firePopState();
            }
            // current event object
            event = event || global.event;

            var oldURLObject = parseURL(fireNow, true);
            var newURLObject = parseURL();
            // HTML4 browser not support properties oldURL/newURL
            if (!event.oldURL) {
                event.oldURL = oldURLObject._href;
                event.newURL = newURLObject._href;
            }
            if (oldURLObject._hash !== newURLObject._hash) {
                // if current hash not equal previous hash
                dispatchEvent(event);
            }
        }
    }

    /**
     * The event handler is fully loaded document
     *
     * @param {*} [noScroll]
     * @return void
     */
    function onLoad(noScroll) {
        // Get rid of the events popstate when the first loading a document in the webkit browsers
        setTimeout(function () {
            // hang up the event handler for the built-in popstate event in the browser
            addEvent('popstate', function (e) {
                // set the current url, that suppress the creation of the popstate event by changing the hash
                checkUrlForPopState = windowLocation.href;
                // for Safari browser in OS Windows not implemented 'state' object in 'History' interface
                // and not implemented in old HTML4 browsers
                if (!isSupportStateObjectInHistory) {
                    e = redefineProperty(e, 'state', { get: function get() {
                            return historyObject.state;
                        } });
                }
                // send events to be processed
                dispatchEvent(e);
            }, false);
        }, 0);
        // for non-HTML5 browsers
        if (!isSupportHistoryAPI && noScroll !== true && "location" in historyObject) {
            // scroll window to anchor element
            scrollToAnchorId(locationObject.hash);
            // fire initial state for non-HTML5 browser after load page
            fireInitialState();
        }
    }

    /**
     * Finds the closest ancestor anchor element (including the target itself).
     *
     * @param {HTMLElement} target The element to start scanning from.
     * @return {HTMLElement} An element which is the closest ancestor anchor.
     */
    function anchorTarget(target) {
        while (target) {
            if (target.nodeName === 'A') return target;
            target = target.parentNode;
        }
    }

    /**
     * Handles anchor elements with a hash fragment for non-HTML5 browsers
     *
     * @param {Event} e
     */
    function onAnchorClick(e) {
        var event = e || global.event;
        var target = anchorTarget(event.target || event.srcElement);
        var defaultPrevented = "defaultPrevented" in event ? event['defaultPrevented'] : event.returnValue === false;
        if (target && target.nodeName === "A" && !defaultPrevented) {
            var current = parseURL();
            var expect = parseURL(target.getAttribute("href", 2));
            var isEqualBaseURL = current._href.split('#').shift() === expect._href.split('#').shift();
            if (isEqualBaseURL && expect._hash) {
                if (current._hash !== expect._hash) {
                    locationObject.hash = expect._hash;
                }
                scrollToAnchorId(expect._hash);
                if (event.preventDefault) {
                    event.preventDefault();
                } else {
                    event.returnValue = false;
                }
            }
        }
    }

    /**
     * Scroll page to current anchor in url-hash
     *
     * @param hash
     */
    function scrollToAnchorId(hash) {
        var target = document.getElementById(hash = (hash || '').replace(/^#/, ''));
        if (target && target.id === hash && target.nodeName === "A") {
            var rect = target.getBoundingClientRect();
            global.scrollTo(documentElement.scrollLeft || 0, rect.top + (documentElement.scrollTop || 0) - (documentElement.clientTop || 0));
        }
    }

    /**
     * Library initialization
     *
     * @return {Boolean} return true if all is well, otherwise return false value
     */
    function initialize() {
        /**
         * Get custom settings from the query string
         */
        var scripts = document.getElementsByTagName('script');
        var src = (scripts[scripts.length - 1] || {}).src || '';
        var arg = src.indexOf('?') !== -1 ? src.split('?').pop() : '';
        arg.replace(/(\w+)(?:=([^&]*))?/g, function (a, key, value) {
            settings[key] = (value || '').replace(/^(0|false)$/, '');
        });

        /**
         * hang up the event handler to listen to the events hashchange
         */
        addEvent(eventNamePrefix + 'hashchange', onHashChange, false);

        // a list of objects with pairs of descriptors/object
        var data = [locationDescriptors, locationObject, eventsDescriptors, global, historyDescriptors, historyObject];

        // if browser support object 'state' in interface 'History'
        if (isSupportStateObjectInHistory) {
            // remove state property from descriptor
            delete historyDescriptors['state'];
        }

        // initializing descriptors
        for (var i = 0; i < data.length; i += 2) {
            for (var prop in data[i]) {
                if (data[i].hasOwnProperty(prop)) {
                    if (typeof data[i][prop] === 'function') {
                        // If the descriptor is a simple function, simply just assign it an object
                        data[i + 1][prop] = data[i][prop];
                    } else {
                        // prepare the descriptor the required format
                        var descriptor = prepareDescriptorsForObject(data[i], prop, data[i][prop]);
                        // try to set the descriptor object
                        if (!redefineProperty(data[i + 1], prop, descriptor, function (n, o) {
                            // is satisfied if the failed override property
                            if (o === historyObject) {
                                // the problem occurs in Safari on the Mac
                                global.history = historyObject = data[i + 1] = n;
                            }
                        })) {
                            // if there is no possibility override.
                            // This browser does not support descriptors, such as IE7

                            // remove previously hung event handlers
                            removeEvent(eventNamePrefix + 'hashchange', onHashChange, false);

                            // fail to initialize :(
                            return false;
                        }

                        // create a repository for custom handlers onpopstate/onhashchange
                        if (data[i + 1] === global) {
                            eventsList[prop] = eventsList[prop.substr(2)] = [];
                        }
                    }
                }
            }
        }

        // check settings
        historyObject['setup']();

        // redirect if necessary
        if (settings['redirect']) {
            historyObject['redirect']();
        }

        // initialize
        if (settings["init"]) {
            // You agree that you will use window.history.location instead window.location
            isUsedHistoryLocationFlag = 1;
        }

        // If browser does not support object 'state' in interface 'History'
        if (!isSupportStateObjectInHistory && JSON) {
            storageInitialize();
        }

        // track clicks on anchors
        if (!isSupportHistoryAPI) {
            document[addEventListenerName](eventNamePrefix + "click", onAnchorClick, false);
        }

        if (document.readyState === 'complete') {
            onLoad(true);
        } else {
            if (!isSupportHistoryAPI && parseURL()._relative !== settings["basepath"]) {
                isFireInitialState = true;
            }
            /**
             * Need to avoid triggering events popstate the initial page load.
             * Hang handler popstate as will be fully loaded document that
             * would prevent triggering event onpopstate
             */
            addEvent(eventNamePrefix + 'load', onLoad, false);
        }

        // everything went well
        return true;
    }

    /**
     * Starting the library
     */
    if (!initialize()) {
        // if unable to initialize descriptors
        // therefore quite old browser and there
        // is no sense to continue to perform
        return;
    }

    /**
     * If the property history.emulate will be true,
     * this will be talking about what's going on
     * emulation capabilities HTML5-History-API.
     * Otherwise there is no emulation, ie the
     * built-in browser capabilities.
     *
     * @type {boolean}
     * @const
     */
    historyObject['emulate'] = !isSupportHistoryAPI;

    /**
     * Replace the original methods on the wrapper
     */
    global[addEventListenerName] = addEventListener;
    global[removeEventListenerName] = removeEventListener;
    global[dispatchEventName] = dispatchEvent;

    return historyObject;
});
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

/*! Picturefill - v3.0.0-beta1 - 2015-07-24
* http://scottjehl.github.io/picturefill
* Copyright (c) 2015 https://github.com/scottjehl/picturefill/blob/master/Authors.txt; Licensed MIT */
(function (window) {
	/*jshint eqnull:true */
	var ua = navigator.userAgent;

	if (window.HTMLPictureElement && /ecko/.test(ua) && ua.match(/rv\:(\d+)/) && RegExp.$1 < 41) {
		addEventListener("resize", function () {
			var timer;

			var dummySrc = document.createElement("source");

			var fixRespimg = function fixRespimg(img) {
				var source, sizes;
				var picture = img.parentNode;

				if (picture.nodeName.toUpperCase() === "PICTURE") {
					source = dummySrc.cloneNode();

					picture.insertBefore(source, picture.firstElementChild);
					setTimeout(function () {
						picture.removeChild(source);
					});
				} else if (!img._pfLastSize || img.offsetWidth > img._pfLastSize) {
					img._pfLastSize = img.offsetWidth;
					sizes = img.sizes;
					img.sizes += ",100vw";
					setTimeout(function () {
						img.sizes = sizes;
					});
				}
			};

			var findPictureImgs = function findPictureImgs() {
				var i;
				var imgs = document.querySelectorAll("picture > img, img[srcset][sizes]");
				for (i = 0; i < imgs.length; i++) {
					fixRespimg(imgs[i]);
				}
			};
			var onResize = function onResize() {
				clearTimeout(timer);
				timer = setTimeout(findPictureImgs, 99);
			};
			var mq = window.matchMedia && matchMedia("(orientation: landscape)");
			var init = function init() {
				onResize();

				if (mq && mq.addListener) {
					mq.addListener(onResize);
				}
			};

			dummySrc.srcset = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

			if (/^[c|i]|d$/.test(document.readyState || "")) {
				init();
			} else {
				document.addEventListener("DOMContentLoaded", init);
			}

			return onResize;
		}());
	}
})(window);

/*! Picturefill - Responsive Images that work today.
 *  Author: Scott Jehl, Filament Group, 2012 ( new proposal implemented by Shawn Jansepar )
 *  License: MIT
 *  Spec: http://picture.responsiveimages.org/
 */
(function (window, document, undefined) {
	/* global parseSizes */
	// Enable strict mode
	"use strict";

	// HTML shim|v it for old IE (IE9 will still need the HTML video tag workaround)

	document.createElement("picture");

	var warn, eminpx, alwaysCheckWDescriptor, evalId;
	// local object for method references and testing exposure
	var pf = {};
	var noop = function noop() {};
	var image = document.createElement("img");
	var getImgAttr = image.getAttribute;
	var setImgAttr = image.setAttribute;
	var removeImgAttr = image.removeAttribute;
	var docElem = document.documentElement;
	var types = {};
	var cfg = {
		//resource selection:
		algorithm: ""
	};
	var srcAttr = "data-pfsrc";
	var srcsetAttr = srcAttr + "set";
	// ua sniffing is done for undetectable img loading features,
	// to do some non crucial perf optimizations
	var ua = navigator.userAgent;
	var supportAbort = /rident/.test(ua) || /ecko/.test(ua) && ua.match(/rv\:(\d+)/) && RegExp.$1 > 35;
	var curSrcProp = "currentSrc";
	var regWDesc = /\s+\+?\d+(e\d+)?w/;
	var regSize = /(\([^)]+\))?\s*(.+)/;
	var setOptions = window.picturefillCFG;
	/**
  * Shortcut property for https://w3c.github.io/webappsec/specs/mixedcontent/#restricts-mixed-content ( for easy overriding in tests )
  */
	// baseStyle also used by getEmValue (i.e.: width: 1em is important)
	var baseStyle = "position:absolute;left:0;visibility:hidden;display:block;padding:0;border:none;font-size:1em;width:1em;overflow:hidden;clip:rect(0px, 0px, 0px, 0px)";
	var fsCss = "font-size:100%!important;";
	var isVwDirty = true;

	var cssCache = {};
	var sizeLengthCache = {};
	var DPR = window.devicePixelRatio;
	var units = {
		px: 1,
		"in": 96
	};
	var anchor = document.createElement("a");
	/**
  * alreadyRun flag used for setOptions. is it true setOptions will reevaluate
  * @type {boolean}
  */
	var alreadyRun = false;

	// Reusable, non-"g" Regexes

	// (Don't use \s, to avoid matching non-breaking space.)
	var regexLeadingSpaces = /^[ \t\n\r\u000c]+/,
	    regexLeadingCommasOrSpaces = /^[, \t\n\r\u000c]+/,
	    regexLeadingNotSpaces = /^[^ \t\n\r\u000c]+/,
	    regexTrailingCommas = /[,]+$/,
	    regexNonNegativeInteger = /^\d+$/,


	// ( Positive or negative or unsigned integers or decimals, without or without exponents.
	// Must include at least one digit.
	// According to spec tests any decimal point must be followed by a digit.
	// No leading plus sign is allowed.)
	// https://html.spec.whatwg.org/multipage/infrastructure.html#valid-floating-point-number
	regexFloatingPoint = /^-?(?:[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/;

	var on = function on(obj, evt, fn, capture) {
		if (obj.addEventListener) {
			obj.addEventListener(evt, fn, capture || false);
		} else if (obj.attachEvent) {
			obj.attachEvent("on" + evt, fn);
		}
	};

	/**
  * simple memoize function:
  */

	var memoize = function memoize(fn) {
		var cache = {};
		return function (input) {
			if (!(input in cache)) {
				cache[input] = fn(input);
			}
			return cache[input];
		};
	};

	// UTILITY FUNCTIONS

	// Manual is faster than RegEx
	// http://jsperf.com/whitespace-character/5
	function isSpace(c) {
		return c === " " || // space
		c === "\t" || // horizontal tab
		c === "\n" || // new line
		c === "\f" || // form feed
		c === "\r"; // carriage return
	}

	/**
  * gets a mediaquery and returns a boolean or gets a css length and returns a number
  * @param css mediaqueries or css length
  * @returns {boolean|number}
  *
  * based on: https://gist.github.com/jonathantneal/db4f77009b155f083738
  */
	var evalCSS = function () {

		var regLength = /^([\d\.]+)(em|vw|px)$/;
		var replace = function replace() {
			var args = arguments,
			    index = 0,
			    string = args[0];
			while (++index in args) {
				string = string.replace(args[index], args[++index]);
			}
			return string;
		};

		var buidlStr = memoize(function (css) {

			return "return " + replace((css || "").toLowerCase(),
			// interpret `and`
			/\band\b/g, "&&",

			// interpret `,`
			/,/g, "||",

			// interpret `min-` as >=
			/min-([a-z-\s]+):/g, "e.$1>=",

			// interpret `max-` as <=
			/max-([a-z-\s]+):/g, "e.$1<=",

			//calc value
			/calc([^)]+)/g, "($1)",

			// interpret css values
			/(\d+[\.]*[\d]*)([a-z]+)/g, "($1 * e.$2)",
			//make eval less evil
			/^(?!(e.[a-z]|[0-9\.&=|><\+\-\*\(\)\/])).*/ig, "") + ";";
		});

		return function (css, length) {
			var parsedLength;
			if (!(css in cssCache)) {
				cssCache[css] = false;
				if (length && (parsedLength = css.match(regLength))) {
					cssCache[css] = parsedLength[1] * units[parsedLength[2]];
				} else {
					/*jshint evil:true */
					try {
						cssCache[css] = new Function("e", buidlStr(css))(units);
					} catch (e) {}
					/*jshint evil:false */
				}
			}
			return cssCache[css];
		};
	}();

	var setResolution = function setResolution(candidate, sizesattr) {
		if (candidate.w) {
			// h = means height: || descriptor.type === 'h' do not handle yet...
			candidate.cWidth = pf.calcListLength(sizesattr || "100vw");
			candidate.res = candidate.w / candidate.cWidth;
		} else {
			candidate.res = candidate.d;
		}
		return candidate;
	};

	/**
  *
  * @param opt
  */
	var picturefill = function picturefill(opt) {
		var elements, i, plen;

		var options = opt || {};

		if (options.elements && options.elements.nodeType === 1) {
			if (options.elements.nodeName.toUpperCase() === "IMG") {
				options.elements = [options.elements];
			} else {
				options.context = options.elements;
				options.elements = null;
			}
		}

		elements = options.elements || pf.qsa(options.context || document, options.reevaluate || options.reselect ? pf.sel : pf.selShort);

		if (plen = elements.length) {

			pf.setupRun(options);
			alreadyRun = true;

			// Loop through all elements
			for (i = 0; i < plen; i++) {
				pf.fillImg(elements[i], options);
			}

			pf.teardownRun(options);
		}
	};

	/**
  * outputs a warning for the developer
  * @param {message}
  * @type {Function}
  */
	warn = window.console && console.warn ? function (message) {
		console.warn(message);
	} : noop;

	if (!(curSrcProp in image)) {
		curSrcProp = "src";
	}

	// Add support for standard mime types.
	types["image/jpeg"] = true;
	types["image/gif"] = true;
	types["image/png"] = true;

	function detectTypeSupport(type, typeUri) {
		// based on Modernizr's lossless img-webp test
		// note: asynchronous
		var image = new window.Image();
		image.onerror = function () {
			types[type] = false;
			picturefill();
		};
		image.onload = function () {
			types[type] = image.width === 1;
			picturefill();
		};
		image.src = typeUri;
		return "pending";
	}

	// test svg support
	types["image/svg+xml"] = document.implementation.hasFeature("http://wwwindow.w3.org/TR/SVG11/feature#Image", "1.1");

	/**
  * updates the internal vW property with the current viewport width in px
  */
	function updateMetrics() {

		isVwDirty = false;
		DPR = window.devicePixelRatio;
		cssCache = {};
		sizeLengthCache = {};

		pf.DPR = DPR || 1;

		units.width = Math.max(window.innerWidth || 0, docElem.clientWidth);
		units.height = Math.max(window.innerHeight || 0, docElem.clientHeight);

		units.vw = units.width / 100;
		units.vh = units.height / 100;

		evalId = [units.height, units.width, DPR].join("-");

		units.em = pf.getEmValue();
		units.rem = units.em;
	}

	function chooseLowRes(lowerValue, higherValue, dprValue, isCached) {
		var bonusFactor, tooMuch, bonus, meanDensity;

		//experimental
		if (cfg.algorithm === "saveData") {
			if (lowerValue > 2.7) {
				meanDensity = dprValue + 1;
			} else {
				tooMuch = higherValue - dprValue;
				bonusFactor = Math.pow(lowerValue - 0.6, 1.5);

				bonus = tooMuch * bonusFactor;

				if (isCached) {
					bonus += 0.1 * bonusFactor;
				}

				meanDensity = lowerValue + bonus;
			}
		} else {
			meanDensity = dprValue > 1 ? Math.sqrt(lowerValue * higherValue) : lowerValue;
		}

		return meanDensity > dprValue;
	}

	function applyBestCandidate(img) {
		var srcSetCandidates;
		var matchingSet = pf.getSet(img);
		var evaluated = false;
		if (matchingSet !== "pending") {
			evaluated = evalId;
			if (matchingSet) {
				srcSetCandidates = pf.setRes(matchingSet);
				pf.applySetCandidate(srcSetCandidates, img);
			}
		}
		img[pf.ns].evaled = evaluated;
	}

	function ascendingSort(a, b) {
		return a.res - b.res;
	}

	function setSrcToCur(img, src, set) {
		var candidate;
		if (!set && src) {
			set = img[pf.ns].sets;
			set = set && set[set.length - 1];
		}

		candidate = getCandidateForSrc(src, set);

		if (candidate) {
			src = pf.makeUrl(src);
			img[pf.ns].curSrc = src;
			img[pf.ns].curCan = candidate;

			if (!candidate.res) {
				setResolution(candidate, candidate.set.sizes);
			}
		}
		return candidate;
	}

	function getCandidateForSrc(src, set) {
		var i, candidate, candidates;
		if (src && set) {
			candidates = pf.parseSet(set);
			src = pf.makeUrl(src);
			for (i = 0; i < candidates.length; i++) {
				if (src === pf.makeUrl(candidates[i].url)) {
					candidate = candidates[i];
					break;
				}
			}
		}
		return candidate;
	}

	function getAllSourceElements(picture, candidates) {
		var i, len, source, srcset;

		// SPEC mismatch intended for size and perf:
		// actually only source elements preceding the img should be used
		// also note: don't use qsa here, because IE8 sometimes doesn't like source as the key part in a selector
		var sources = picture.getElementsByTagName("source");

		for (i = 0, len = sources.length; i < len; i++) {
			source = sources[i];
			source[pf.ns] = true;
			srcset = source.getAttribute("srcset");

			// if source does not have a srcset attribute, skip
			if (srcset) {
				candidates.push({
					srcset: srcset,
					media: source.getAttribute("media"),
					type: source.getAttribute("type"),
					sizes: source.getAttribute("sizes")
				});
			}
		}
	}

	/**
  * Srcset Parser
  * By Alex Bell |  MIT License
  *
  * @returns Array [{url: _, d: _, w: _, h:_, set:_(????)}, ...]
  *
  * Based super duper closely on the reference algorithm at:
  * https://html.spec.whatwg.org/multipage/embedded-content.html#parse-a-srcset-attribute
  */

	// 1. Let input be the value passed to this algorithm.
	// (TO-DO : Explain what "set" argument is here. Maybe choose a more
	// descriptive & more searchable name.  Since passing the "set" in really has
	// nothing to do with parsing proper, I would prefer this assignment eventually
	// go in an external fn.)
	function parseSrcset(input, set) {

		function collectCharacters(regEx) {
			var chars,
			    match = regEx.exec(input.substring(pos));
			if (match) {
				chars = match[0];
				pos += chars.length;
				return chars;
			}
		}

		var inputLength = input.length,
		    url,
		    descriptors,
		    currentDescriptor,
		    state,
		    c,


		// 2. Let position be a pointer into input, initially pointing at the start
		//    of the string.
		pos = 0,


		// 3. Let candidates be an initially empty source set.
		candidates = [];

		/**
  * Adds descriptor properties to a candidate, pushes to the candidates array
  * @return undefined
  */
		// (Declared outside of the while loop so that it's only created once.
		// (This fn is defined before it is used, in order to pass JSHINT.
		// Unfortunately this breaks the sequencing of the spec comments. :/ )
		function parseDescriptors() {

			// 9. Descriptor parser: Let error be no.
			var pError = false,


			// 10. Let width be absent.
			// 11. Let density be absent.
			// 12. Let future-compat-h be absent. (We're implementing it now as h)
			w,
			    d,
			    h,
			    i,
			    candidate = {},
			    desc,
			    lastChar,
			    value,
			    intVal,
			    floatVal;

			// 13. For each descriptor in descriptors, run the appropriate set of steps
			// from the following list:
			for (i = 0; i < descriptors.length; i++) {
				desc = descriptors[i];

				lastChar = desc[desc.length - 1];
				value = desc.substring(0, desc.length - 1);
				intVal = parseInt(value, 10);
				floatVal = parseFloat(value);

				// If the descriptor consists of a valid non-negative integer followed by
				// a U+0077 LATIN SMALL LETTER W character
				if (regexNonNegativeInteger.test(value) && lastChar === "w") {

					// If width and density are not both absent, then let error be yes.
					if (w || d) {
						pError = true;
					}

					// Apply the rules for parsing non-negative integers to the descriptor.
					// If the result is zero, let error be yes.
					// Otherwise, let width be the result.
					if (intVal === 0) {
						pError = true;
					} else {
						w = intVal;
					}

					// If the descriptor consists of a valid floating-point number followed by
					// a U+0078 LATIN SMALL LETTER X character
				} else if (regexFloatingPoint.test(value) && lastChar === "x") {

						// If width, density and future-compat-h are not all absent, then let error
						// be yes.
						if (w || d || h) {
							pError = true;
						}

						// Apply the rules for parsing floating-point number values to the descriptor.
						// If the result is less than zero, let error be yes. Otherwise, let density
						// be the result.
						if (floatVal < 0) {
							pError = true;
						} else {
							d = floatVal;
						}

						// If the descriptor consists of a valid non-negative integer followed by
						// a U+0068 LATIN SMALL LETTER H character
					} else if (regexNonNegativeInteger.test(value) && lastChar === "h") {

							// If height and density are not both absent, then let error be yes.
							if (h || d) {
								pError = true;
							}

							// Apply the rules for parsing non-negative integers to the descriptor.
							// If the result is zero, let error be yes. Otherwise, let future-compat-h
							// be the result.
							if (intVal === 0) {
								pError = true;
							} else {
								h = intVal;
							}

							// Anything else, Let error be yes.
						} else {
								pError = true;
							}
			} // (close step 13 for loop)

			// 15. If error is still no, then append a new image source to candidates whose
			// URL is url, associated with a width width if not absent and a pixel
			// density density if not absent. Otherwise, there is a parse error.
			if (!pError) {
				candidate.url = url;

				if (w) {
					candidate.w = w;
				}
				if (d) {
					candidate.d = d;
				}
				if (h) {
					candidate.h = h;
				}
				if (!h && !d && !w) {
					candidate.d = 1;
				}
				if (candidate.d === 1) {
					set.has1x = true;
				}
				candidate.set = set;

				candidates.push(candidate);
			}
		} // (close parseDescriptors fn)

		/**
  * Tokenizes descriptor properties prior to parsing
  * Returns undefined.
  * (Again, this fn is defined before it is used, in order to pass JSHINT.
  * Unfortunately this breaks the logical sequencing of the spec comments. :/ )
  */
		function tokenize() {

			// 8.1. Descriptor tokeniser: Skip whitespace
			collectCharacters(regexLeadingSpaces);

			// 8.2. Let current descriptor be the empty string.
			currentDescriptor = "";

			// 8.3. Let state be in descriptor.
			state = "in descriptor";

			while (true) {

				// 8.4. Let c be the character at position.
				c = input.charAt(pos);

				//  Do the following depending on the value of state.
				//  For the purpose of this step, "EOF" is a special character representing
				//  that position is past the end of input.

				// In descriptor
				if (state === "in descriptor") {
					// Do the following, depending on the value of c:

					// Space character
					// If current descriptor is not empty, append current descriptor to
					// descriptors and let current descriptor be the empty string.
					// Set state to after descriptor.
					if (isSpace(c)) {
						if (currentDescriptor) {
							descriptors.push(currentDescriptor);
							currentDescriptor = "";
							state = "after descriptor";
						}

						// U+002C COMMA (,)
						// Advance position to the next character in input. If current descriptor
						// is not empty, append current descriptor to descriptors. Jump to the step
						// labeled descriptor parser.
					} else if (c === ",") {
							pos += 1;
							if (currentDescriptor) {
								descriptors.push(currentDescriptor);
							}
							parseDescriptors();
							return;

							// U+0028 LEFT PARENTHESIS (()
							// Append c to current descriptor. Set state to in parens.
						} else if (c === "(") {
								currentDescriptor = currentDescriptor + c;
								state = "in parens";

								// EOF
								// If current descriptor is not empty, append current descriptor to
								// descriptors. Jump to the step labeled descriptor parser.
							} else if (c === "") {
									if (currentDescriptor) {
										descriptors.push(currentDescriptor);
									}
									parseDescriptors();
									return;

									// Anything else
									// Append c to current descriptor.
								} else {
										currentDescriptor = currentDescriptor + c;
									}
					// (end "in descriptor"

					// In parens
				} else if (state === "in parens") {

						// U+0029 RIGHT PARENTHESIS ())
						// Append c to current descriptor. Set state to in descriptor.
						if (c === ")") {
							currentDescriptor = currentDescriptor + c;
							state = "in descriptor";

							// EOF
							// Append current descriptor to descriptors. Jump to the step labeled
							// descriptor parser.
						} else if (c === "") {
								descriptors.push(currentDescriptor);
								parseDescriptors();
								return;

								// Anything else
								// Append c to current descriptor.
							} else {
									currentDescriptor = currentDescriptor + c;
								}

						// After descriptor
					} else if (state === "after descriptor") {

							// Do the following, depending on the value of c:
							// Space character: Stay in this state.
							if (isSpace(c)) {

								// EOF: Jump to the step labeled descriptor parser.
							} else if (c === "") {
									parseDescriptors();
									return;

									// Anything else
									// Set state to in descriptor. Set position to the previous character in input.
								} else {
										state = "in descriptor";
										pos -= 1;
									}
						}

				// Advance position to the next character in input.
				pos += 1;

				// Repeat this step.
			} // (close while true loop)
		}

		// 4. Splitting loop: Collect a sequence of characters that are space
		//    characters or U+002C COMMA characters. If any U+002C COMMA characters
		//    were collected, that is a parse error.
		while (true) {
			collectCharacters(regexLeadingCommasOrSpaces);

			// 5. If position is past the end of input, return candidates and abort these steps.
			if (pos >= inputLength) {
				return candidates; // (we're done, this is the sole return path)
			}

			// 6. Collect a sequence of characters that are not space characters,
			//    and let that be url.
			url = collectCharacters(regexLeadingNotSpaces);

			// 7. Let descriptors be a new empty list.
			descriptors = [];

			// 8. If url ends with a U+002C COMMA character (,), follow these substeps:
			//		(1). Remove all trailing U+002C COMMA characters from url. If this removed
			//         more than one character, that is a parse error.
			if (url.slice(-1) === ",") {
				url = url.replace(regexTrailingCommas, "");
				// (Jump ahead to step 9 to skip tokenization and just push the candidate).
				parseDescriptors();

				//	Otherwise, follow these substeps:
			} else {
					tokenize();
				} // (close else of step 8)

			// 16. Return to the step labeled splitting loop.
		} // (Close of big while loop.)
	}

	/* jshint ignore:start */
	// jscs:disable

	/*
  * Sizes Parser
  *
  * By Alex Bell |  MIT License
  *
  * Non-strict but accurate and lightweight JS Parser for the string value <img sizes="here">
  *
  * Reference algorithm at:
  * https://html.spec.whatwg.org/multipage/embedded-content.html#parse-a-sizes-attribute
  *
  * Most comments are copied in directly from the spec
  * (except for comments in parens).
  *
  * Grammar is:
  * <source-size-list> = <source-size># [ , <source-size-value> ]? | <source-size-value>
  * <source-size> = <media-condition> <source-size-value>
  * <source-size-value> = <length>
  * http://www.w3.org/html/wg/drafts/html/master/embedded-content.html#attr-img-sizes
  *
  * E.g. "(max-width: 30em) 100vw, (max-width: 50em) 70vw, 100vw"
  * or "(min-width: 30em), calc(30vw - 15px)" or just "30vw"
  *
  * Returns the first valid <css-length> with a media condition that evaluates to true,
  * or "100vw" if all valid media conditions evaluate to false.
  *
  */

	function parseSizes(strValue) {

		// (Percentage CSS lengths are not allowed in this case, to avoid confusion:
		// https://html.spec.whatwg.org/multipage/embedded-content.html#valid-source-size-list
		// CSS allows a single optional plus or minus sign:
		// http://www.w3.org/TR/CSS2/syndata.html#numbers
		// CSS is ASCII case-insensitive:
		// http://www.w3.org/TR/CSS2/syndata.html#characters )
		// Spec allows exponential notation for <number> type:
		// http://dev.w3.org/csswg/css-values/#numbers
		var regexCssLengthWithUnits = /^(?:[+-]?[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?(?:ch|cm|em|ex|in|mm|pc|pt|px|rem|vh|vmin|vmax|vw)$/i;

		// (This is a quick and lenient test. Because of optional unlimited-depth internal
		// grouping parens and strict spacing rules, this could get very complicated.)
		var regexCssCalc = /^calc\((?:[0-9a-z \.\+\-\*\/\(\)]+)\)$/i;

		var i;
		var unparsedSizesList;
		var unparsedSizesListLength;
		var unparsedSize;
		var lastComponentValue;
		var size;

		// UTILITY FUNCTIONS

		//  (Toy CSS parser. The goals here are:
		//  1) expansive test coverage without the weight of a full CSS parser.
		//  2) Avoiding regex wherever convenient.
		//  Quick tests: http://jsfiddle.net/gtntL4gr/3/
		//  Returns an array of arrays.)
		function parseComponentValues(str) {
			var chrctr;
			var component = "";
			var componentArray = [];
			var listArray = [];
			var parenDepth = 0;
			var pos = 0;
			var inComment = false;

			function pushComponent() {
				if (component) {
					componentArray.push(component);
					component = "";
				}
			}

			function pushComponentArray() {
				if (componentArray[0]) {
					listArray.push(componentArray);
					componentArray = [];
				}
			}

			// (Loop forwards from the beginning of the string.)
			while (true) {
				chrctr = str[pos];

				if (chrctr === undefined) {
					// ( End of string reached.)
					pushComponent();
					pushComponentArray();
					return listArray;
				} else if (inComment) {
					if (chrctr === "*" && str[pos + 1] === "/") {
						// (At end of a comment.)
						inComment = false;
						pos += 2;
						pushComponent();
						continue;
					} else {
						pos += 1; // (Skip all characters inside comments.)
						continue;
					}
				} else if (isSpace(chrctr)) {
					// (If previous character in loop was also a space, or if
					// at the beginning of the string, do not add space char to
					// component.)
					if (str[pos - 1] && isSpace(str[pos - 1]) || !component) {
						pos += 1;
						continue;
					} else if (parenDepth === 0) {
						pushComponent();
						pos += 1;
						continue;
					} else {
						// (Replace any space character with a plain space for legibility.)
						chrctr = " ";
					}
				} else if (chrctr === "(") {
					parenDepth += 1;
				} else if (chrctr === ")") {
					parenDepth -= 1;
				} else if (chrctr === ",") {
					pushComponent();
					pushComponentArray();
					pos += 1;
					continue;
				} else if (chrctr === "/" && str[pos + 1] === "*") {
					inComment = true;
					pos += 2;
					continue;
				}

				component = component + chrctr;
				pos += 1;
			}
		}

		function isValidNonNegativeSourceSizeValue(s) {
			if (regexCssLengthWithUnits.test(s) && parseFloat(s) >= 0) {
				return true;
			}
			if (regexCssCalc.test(s)) {
				return true;
			}
			// ( http://www.w3.org/TR/CSS2/syndata.html#numbers says:
			// "-0 is equivalent to 0 and is not a negative number." which means that
			// unitless zero and unitless negative zero must be accepted as special cases.)
			if (s === "0" || s === "-0" || s === "+0") {
				return true;
			}
			return false;
		}

		// When asked to parse a sizes attribute from an element, parse a
		// comma-separated list of component values from the value of the element's
		// sizes attribute (or the empty string, if the attribute is absent), and let
		// unparsed sizes list be the result.
		// http://dev.w3.org/csswg/css-syntax/#parse-comma-separated-list-of-component-values

		unparsedSizesList = parseComponentValues(strValue);
		unparsedSizesListLength = unparsedSizesList.length;

		// For each unparsed size in unparsed sizes list:
		for (i = 0; i < unparsedSizesListLength; i++) {
			unparsedSize = unparsedSizesList[i];

			// 1. Remove all consecutive <whitespace-token>s from the end of unparsed size.
			// ( parseComponentValues() already omits spaces outside of parens. )

			// If unparsed size is now empty, that is a parse error; continue to the next
			// iteration of this algorithm.
			// ( parseComponentValues() won't push an empty array. )

			// 2. If the last component value in unparsed size is a valid non-negative
			// <source-size-value>, let size be its value and remove the component value
			// from unparsed size. Any CSS function other than the calc() function is
			// invalid. Otherwise, there is a parse error; continue to the next iteration
			// of this algorithm.
			// http://dev.w3.org/csswg/css-syntax/#parse-component-value
			lastComponentValue = unparsedSize[unparsedSize.length - 1];

			if (isValidNonNegativeSourceSizeValue(lastComponentValue)) {
				size = lastComponentValue;
				unparsedSize.pop();
			} else {
				continue;
			}

			// 3. Remove all consecutive <whitespace-token>s from the end of unparsed
			// size. If unparsed size is now empty, return size and exit this algorithm.
			// If this was not the last item in unparsed sizes list, that is a parse error.
			if (unparsedSize.length === 0) {
				return size;
			}

			// 4. Parse the remaining component values in unparsed size as a
			// <media-condition>. If it does not parse correctly, or it does parse
			// correctly but the <media-condition> evaluates to false, continue to the
			// next iteration of this algorithm.
			// (Parsing all possible compound media conditions in JS is heavy, complicated,
			// and the payoff is unclear. Is there ever an situation where the
			// media condition parses incorrectly but still somehow evaluates to true?
			// Can we just rely on the browser/polyfill to do it?)
			unparsedSize = unparsedSize.join(" ");
			if (!pf.matchesMedia(unparsedSize)) {
				continue;
			}

			// 5. Return size and exit this algorithm.
			return size;
		}

		// If the above algorithm exhausts unparsed sizes list without returning a
		// size value, return 100vw.
		return "100vw";
	}
	// jscs: enable
	/* jshint ignore:end */

	// namespace
	pf.ns = ("pf" + new Date().getTime()).substr(0, 9);

	// srcset support test
	pf.supSrcset = "srcset" in image;
	pf.supSizes = "sizes" in image;

	// using pf.qsa instead of dom traversing does scale much better,
	// especially on sites mixing responsive and non-responsive images
	pf.selShort = "picture>img,img[srcset]";
	pf.sel = pf.selShort;
	pf.cfg = cfg;

	if (pf.supSrcset) {
		pf.sel += ",img[" + srcsetAttr + "]";
	}

	/**
  * Shortcut property for `devicePixelRatio` ( for easy overriding in tests )
  */
	pf.DPR = DPR || 1;
	pf.u = units;

	// container of supported mime types that one might need to qualify before using
	pf.types = types;

	alwaysCheckWDescriptor = pf.supSrcset && !pf.supSizes;

	pf.setSize = noop;

	/**
  * Gets a string and returns the absolute URL
  * @param src
  * @returns {String} absolute URL
  */

	pf.makeUrl = memoize(function (src) {
		anchor.href = src;
		return anchor.href;
	});

	/**
  * Gets a DOM element or document and a selctor and returns the found matches
  * Can be extended with jQuery/Sizzle for IE7 support
  * @param context
  * @param sel
  * @returns {NodeList}
  */
	pf.qsa = function (context, sel) {
		return context.querySelectorAll(sel);
	};

	/**
  * Shortcut method for matchMedia ( for easy overriding in tests )
  * wether native or pf.mMQ is used will be decided lazy on first call
  * @returns {boolean}
  */
	pf.matchesMedia = function () {
		if (window.matchMedia && (matchMedia("(min-width: 0.1em)") || {}).matches) {
			pf.matchesMedia = function (media) {
				return !media || matchMedia(media).matches;
			};
		} else {
			pf.matchesMedia = pf.mMQ;
		}

		return pf.matchesMedia.apply(this, arguments);
	};

	/**
  * A simplified matchMedia implementation for IE8 and IE9
  * handles only min-width/max-width with px or em values
  * @param media
  * @returns {boolean}
  */
	pf.mMQ = function (media) {
		return media ? evalCSS(media) : true;
	};

	/**
  * Returns the calculated length in css pixel from the given sourceSizeValue
  * http://dev.w3.org/csswg/css-values-3/#length-value
  * intended Spec mismatches:
  * * Does not check for invalid use of CSS functions
  * * Does handle a computed length of 0 the same as a negative and therefore invalid value
  * @param sourceSizeValue
  * @returns {Number}
  */
	pf.calcLength = function (sourceSizeValue) {

		var value = evalCSS(sourceSizeValue, true) || false;
		if (value < 0) {
			value = false;
		}

		return value;
	};

	/**
  * Takes a type string and checks if its supported
  */

	pf.supportsType = function (type) {
		return type ? types[type] : true;
	};

	/**
  * Parses a sourceSize into mediaCondition (media) and sourceSizeValue (length)
  * @param sourceSizeStr
  * @returns {*}
  */
	pf.parseSize = memoize(function (sourceSizeStr) {
		var match = (sourceSizeStr || "").match(regSize);
		return {
			media: match && match[1],
			length: match && match[2]
		};
	});

	pf.parseSet = function (set) {
		if (!set.cands) {
			set.cands = parseSrcset(set.srcset, set);
		}
		return set.cands;
	};

	/**
  * returns 1em in css px for html/body default size
  * function taken from respondjs
  * @returns {*|number}
  */
	pf.getEmValue = function () {
		var body;
		if (!eminpx && (body = document.body)) {
			var div = document.createElement("div"),
			    originalHTMLCSS = docElem.style.cssText,
			    originalBodyCSS = body.style.cssText;

			div.style.cssText = baseStyle;

			// 1em in a media query is the value of the default font size of the browser
			// reset docElem and body to ensure the correct value is returned
			docElem.style.cssText = fsCss;
			body.style.cssText = fsCss;

			body.appendChild(div);
			eminpx = div.offsetWidth;
			body.removeChild(div);

			//also update eminpx before returning
			eminpx = parseFloat(eminpx, 10);

			// restore the original values
			docElem.style.cssText = originalHTMLCSS;
			body.style.cssText = originalBodyCSS;
		}
		return eminpx || 16;
	};

	/**
  * Takes a string of sizes and returns the width in pixels as a number
  */
	pf.calcListLength = function (sourceSizeListStr) {
		// Split up source size list, ie ( max-width: 30em ) 100%, ( max-width: 50em ) 50%, 33%
		//
		//                           or (min-width:30em) calc(30% - 15px)
		if (!(sourceSizeListStr in sizeLengthCache) || cfg.uT) {
			var winningLength = pf.calcLength(parseSizes(sourceSizeListStr));

			sizeLengthCache[sourceSizeListStr] = !winningLength ? units.width : winningLength;
		}

		return sizeLengthCache[sourceSizeListStr];
	};

	/**
  * Takes a candidate object with a srcset property in the form of url/
  * ex. "images/pic-medium.png 1x, images/pic-medium-2x.png 2x" or
  *     "images/pic-medium.png 400w, images/pic-medium-2x.png 800w" or
  *     "images/pic-small.png"
  * Get an array of image candidates in the form of
  *      {url: "/foo/bar.png", resolution: 1}
  * where resolution is http://dev.w3.org/csswg/css-values-3/#resolution-value
  * If sizes is specified, res is calculated
  */
	pf.setRes = function (set) {
		var candidates;
		if (set) {

			candidates = pf.parseSet(set);

			for (var i = 0, len = candidates.length; i < len; i++) {
				setResolution(candidates[i], set.sizes);
			}
		}
		return candidates;
	};

	pf.setRes.res = setResolution;

	pf.applySetCandidate = function (candidates, img) {
		if (!candidates.length) {
			return;
		}
		var candidate, i, j, length, bestCandidate, curSrc, curCan, isSameSet, candidateSrc, abortCurSrc;

		var imageData = img[pf.ns];
		var dpr = pf.DPR;

		curSrc = imageData.curSrc || img[curSrcProp];

		curCan = imageData.curCan || setSrcToCur(img, curSrc, candidates[0].set);

		// if we have a current source, we might either become lazy or give this source some advantage
		if (curCan && curCan.set === candidates[0].set) {

			// if browser can abort image request and the image has a higher pixel density than needed
			// and this image isn't downloaded yet, we skip next part and try to save bandwidth
			abortCurSrc = supportAbort && !img.complete && curCan.res - 0.1 > dpr;

			if (!abortCurSrc) {
				curCan.cached = true;

				// if current candidate is "best", "better" or "okay",
				// set it to bestCandidate
				if (curCan && isSameSet && curCan.res >= dpr) {
					bestCandidate = curCan;
				}
			}
		}

		if (!bestCandidate) {

			candidates.sort(ascendingSort);

			length = candidates.length;
			bestCandidate = candidates[length - 1];

			for (i = 0; i < length; i++) {
				candidate = candidates[i];
				if (candidate.res >= dpr) {
					j = i - 1;

					// we have found the perfect candidate,
					// but let's improve this a little bit with some assumptions ;-)
					if (candidates[j] && (abortCurSrc || curSrc !== pf.makeUrl(candidate.url)) && chooseLowRes(candidates[j].res, candidate.res, dpr, candidates[j].cached)) {

						bestCandidate = candidates[j];
					} else {
						bestCandidate = candidate;
					}
					break;
				}
			}
		}

		if (bestCandidate) {

			candidateSrc = pf.makeUrl(bestCandidate.url);

			imageData.curSrc = candidateSrc;
			imageData.curCan = bestCandidate;

			if (candidateSrc !== curSrc) {
				pf.setSrc(img, bestCandidate);
			}
			pf.setSize(img);
		}
	};

	pf.setSrc = function (img, bestCandidate) {
		var origWidth;
		img.src = bestCandidate.url;

		// although this is a specific Safari issue, we don't want to take too much different code paths
		if (bestCandidate.set.type === "image/svg+xml") {
			origWidth = img.style.width;
			img.style.width = img.offsetWidth + 1 + "px";

			// next line only should trigger a repaint
			// if... is only done to trick dead code removal
			if (img.offsetWidth + 1) {
				img.style.width = origWidth;
			}
		}
	};

	pf.getSet = function (img) {
		var i, set, supportsType;
		var match = false;
		var sets = img[pf.ns].sets;

		for (i = 0; i < sets.length && !match; i++) {
			set = sets[i];

			if (!set.srcset || !pf.matchesMedia(set.media) || !(supportsType = pf.supportsType(set.type))) {
				continue;
			}

			if (supportsType === "pending") {
				set = supportsType;
			}

			match = set;
			break;
		}

		return match;
	};

	pf.parseSets = function (element, parent, options) {
		var srcsetAttribute, imageSet, isWDescripor, srcsetParsed;

		var hasPicture = parent && parent.nodeName.toUpperCase() === "PICTURE";
		var imageData = element[pf.ns];

		if (imageData.src === undefined || options.src) {
			imageData.src = getImgAttr.call(element, "src");
			if (imageData.src) {
				setImgAttr.call(element, srcAttr, imageData.src);
			} else {
				removeImgAttr.call(element, srcAttr);
			}
		}

		if (imageData.srcset === undefined || options.srcset || !pf.supSrcset || element.srcset) {
			srcsetAttribute = getImgAttr.call(element, "srcset");
			imageData.srcset = srcsetAttribute;
			srcsetParsed = true;
		}

		imageData.sets = [];

		if (hasPicture) {
			imageData.pic = true;
			getAllSourceElements(parent, imageData.sets);
		}

		if (imageData.srcset) {
			imageSet = {
				srcset: imageData.srcset,
				sizes: getImgAttr.call(element, "sizes")
			};

			imageData.sets.push(imageSet);

			isWDescripor = (alwaysCheckWDescriptor || imageData.src) && regWDesc.test(imageData.srcset || "");

			// add normal src as candidate, if source has no w descriptor
			if (!isWDescripor && imageData.src && !getCandidateForSrc(imageData.src, imageSet) && !imageSet.has1x) {
				imageSet.srcset += ", " + imageData.src;
				imageSet.cands.push({
					url: imageData.src,
					d: 1,
					set: imageSet
				});
			}
		} else if (imageData.src) {
			imageData.sets.push({
				srcset: imageData.src,
				sizes: null
			});
		}

		imageData.curCan = null;
		imageData.curSrc = undefined;

		// if img has picture or the srcset was removed or has a srcset and does not support srcset at all
		// or has a w descriptor (and does not support sizes) set support to false to evaluate
		imageData.supported = !(hasPicture || imageSet && !pf.supSrcset || isWDescripor);

		if (srcsetParsed && pf.supSrcset && !imageData.supported) {
			if (srcsetAttribute) {
				setImgAttr.call(element, srcsetAttr, srcsetAttribute);
				element.srcset = "";
			} else {
				removeImgAttr.call(element, srcsetAttr);
			}
		}

		if (imageData.supported && !imageData.srcset && (!imageData.src && element.src || element.src !== pf.makeUrl(imageData.src))) {
			if (imageData.src === null) {
				element.removeAttribute("src");
			} else {
				element.src = imageData.src;
			}
		}

		imageData.parsed = true;
	};

	pf.fillImg = function (element, options) {
		var imageData;
		var extreme = options.reselect || options.reevaluate;

		// expando for caching data on the img
		if (!element[pf.ns]) {
			element[pf.ns] = {};
		}

		imageData = element[pf.ns];

		// if the element has already been evaluated, skip it
		// unless `options.reevaluate` is set to true ( this, for example,
		// is set to true when running `picturefill` on `resize` ).
		if (!extreme && imageData.evaled === evalId) {
			return;
		}

		if (!imageData.parsed || options.reevaluate) {
			pf.parseSets(element, element.parentNode, options);
		}

		if (!imageData.supported) {
			applyBestCandidate(element);
		} else {
			imageData.evaled = evalId;
		}
	};

	pf.setupRun = function () {
		if (!alreadyRun || isVwDirty || DPR !== window.devicePixelRatio) {
			updateMetrics();
		}
	};

	// If picture is supported, well, that's awesome.
	if (window.HTMLPictureElement) {
		picturefill = noop;
		pf.fillImg = noop;
	} else {

		// Set up picture polyfill by polling the document
		(function () {
			var isDomReady;
			var regReady = window.attachEvent ? /d$|^c/ : /d$|^c|^i/;

			var run = function run() {
				var readyState = document.readyState || "";

				timerId = setTimeout(run, readyState === "loading" ? 200 : 999);
				if (document.body) {
					pf.fillImgs();
					isDomReady = isDomReady || regReady.test(readyState);
					if (isDomReady) {
						clearTimeout(timerId);
					}
				}
			};

			var timerId = setTimeout(run, document.body ? 9 : 99);

			// Also attach picturefill on resize and readystatechange
			// http://modernjavascript.blogspot.com/2013/08/building-better-debounce.html
			var debounce = function debounce(func, wait) {
				var timeout, timestamp;
				var later = function later() {
					var last = new Date() - timestamp;

					if (last < wait) {
						timeout = setTimeout(later, wait - last);
					} else {
						timeout = null;
						func();
					}
				};

				return function () {
					timestamp = new Date();

					if (!timeout) {
						timeout = setTimeout(later, wait);
					}
				};
			};
			var lastClientWidth = docElem.clientHeight;
			var onResize = function onResize() {
				isVwDirty = Math.max(window.innerWidth || 0, docElem.clientWidth) !== units.width || docElem.clientHeight !== lastClientWidth;
				lastClientWidth = docElem.clientHeight;
				if (isVwDirty) {
					pf.fillImgs();
				}
			};

			on(window, "resize", debounce(onResize, 99));
			on(document, "readystatechange", run);

			types["image/webp"] = detectTypeSupport("image/webp", "data:image/webp;base64,UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAABBxAR/Q9ERP8DAABWUDggGAAAADABAJ0BKgEAAQADADQlpAADcAD++/1QAA==");
		})();
	}

	pf.picturefill = picturefill;
	//use this internally for easy monkey patching/performance testing
	pf.fillImgs = picturefill;
	pf.teardownRun = noop;

	/* expose methods for testing */
	picturefill._ = pf;

	window.picturefillCFG = {
		pf: pf,
		push: function push(args) {
			var name = args.shift();
			if (typeof pf[name] === "function") {
				pf[name].apply(pf, args);
			} else {
				cfg[name] = args[0];
				if (alreadyRun) {
					pf.fillImgs({ reselect: true });
				}
			}
		}
	};

	while (setOptions && setOptions.length) {
		window.picturefillCFG.push(setOptions.shift());
	}

	/* expose picturefill */
	window.picturefill = picturefill;

	/* expose picturefill */
	if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && _typeof(module.exports) === "object") {
		// CommonJS, just export
		module.exports = picturefill;
	} else if (typeof define === "function" && define.amd) {
		// AMD support
		define("picturefill", function () {
			return picturefill;
		});
	}
})(window, document);
"use strict";

////////////////////////////////////////////////////////////////////////////////
// Nation Library
// Barebones animation for when a full library is not already in the project
// Uses CSS3 animation where available
// Animates values in pixels, percentages, colours, and unitless values (eg. opacity)
////////////////////////////////////////////////////////////////////////////////
var NATION = NATION || {};

/**
 * ### Dependencies:
 * [NATION.Utils](Utils.js.html)
 *
 * ### About:
 * Creates animations on elements. This class does not need instantiating.
 * 
 * Animates values in pixels, percentages, colours, and unitless values (eg. opacity). Now also animates CSS transforms. See below for details
 * 
 * CSS3 animation is prioritised, but if the browser lacks support for them, JavaScript animation is used instead.
 * 
 * If the passed DOM element does not have a starting value for a property (eg. width is not set), you're going to have a bad time.
 * 
 * ### Auto-prefixing
 * You can now specify a CSS property, and it will be automatically prefixed for you. This will also work in reverse, meaning you can pass in '-webkit-transition' and this will still work in Firefox etc.
 * 
 * ### Animating CSS Transforms:
 * This class can animate complex CSS transforms, but there is a restriction to it's use. If you want to animate a transform from a starting position other than 'no transform' or a matrix, you must set the style in your JavaScript before animating. Due to the nature of CSS, JavaScript cannot dynamically get the original transform setting from your CSS file (it is only ever recognised as a matrix in the browser, rather than separate values for rotate, translate etc). So in these cases, before starting an animation, always set the style first, eg. NATION.Utils.setStyle(element, {transform: "rotate(90deg)"}) or $(element).css({transform: "rotate(90deg)"}), or element.style.transform = "rotate(90deg)";
 *
 * With that in mind, you can now use this class to animate transforms, such as the following:
 * <ul>
 * <li>transform: "translateY(50px)"</li>
 * <li>transform: "rotate(99deg) translateY(50px)"</li>
 * <li>transform: "translate3d(50px, 400%, 200px) rotate(90deg)"</li>
 * <li>transform: "rotate(90deg) matrix(1, -0.2, 0, 1, 0, 0)"</li>
 * </ul>
 * @class Animation
 * @requires NATION.Utils
 */
NATION.Animation = function () {
	"use strict";

	var _public = {};

	/**
 * Start a new animation on an element.
 * 
 * Note that this will automatically stop all current animation on the passed element, you don't need to call stop() beforehand.
 * 
 * **Example:**
 *
 	// Element that will be animated
 	var myElement = document.querySelector(".my-element");
 	// Set up a function to call on completion
 	var myCallback = function(e) {
 		// e.target contains the DOM element that was animated
 	}
 	// Properties that will be animated
 	var properties = {
  		left: 100,
  		width: "50%"
  	}
 
  	var options = {
  		duration: 400,
  		easing: "easeInOutQuad"
  	};
  	// Start the animation
  	NATION.Animation.start(myElement, properties, options, myCallback);
 * 
 * @function Animation.start
 * @param {domelement} element The DOM element to start performing an animation on
 * @param {object} properties The style properties to animate, and their target values
 * @param {object} options Customisable settings for this animation
 * @param {int} options.duration (default:1000) The length of the animation, in milliseconds
 * @param {string} options.easing (default:"linear") The easing method to use.
 * @param {boolean} options.forcejs (default: false) Force the animation to be performed by JS, instead of CSS3
 * @param {function} callback Callback function to run after the animation has completed
 */
	_public.start = function (element, properties, options, callback) {
		options = options || {};
		element = NATION.Utils.getDOMElement(element);
		_private.startAnimation(element, properties, options, callback);
	};

	/**
 	* Stops all animations currently active on the passed element
 	* 
 	* **Example:**
 	*
 		// Element that will be animated
 		var myElement = document.querySelector(".my-element");
 		// Stop all animation on selected element
 		NATION.Animation.stop(myElement);
 	*
 	* @function Animation.stop
 	* @param {domelement} element - The DOM element on which to stop all animations
 */
	_public.stop = function (element) {
		_private.stopAnimation(element);
	};

	/** Find a colour at a point between two colours
 */
	_public.tweenColour = function (percentage, startColour, endColour) {
		return _private.tweenColour(percentage, startColour, endColour);
	};

	/**
 * Private methods
 * @ignore
 */
	var _private = {
		//------------------------------------------------
		// Variables
		//------------------------------------------------
		activeAnimations: [],
		animationTimer: null,
		CSS3Available: false,
		testingElement: null,
		transitionEndString: "",
		cssPrefix: "",
		types: {
			PIXELS: "pixels",
			PERCENT: "percent",
			COLOUR: "colour",
			TRANSFORM: "transform",
			NONE: "none"
		},
		easing: {
			linear: function linear(percent, elapsed, start, end, duration) {
				return start + (end - start) * percent;
			},
			easeInSine: function easeInSine(percent, elapsed, start, end, duration) {
				return -(end - start) * Math.cos(elapsed / duration * (Math.PI / 2)) + (end - start) + start;
			},
			easeOutSine: function easeOutSine(percent, elapsed, start, end, duration) {
				return (end - start) * Math.sin(elapsed / duration * (Math.PI / 2)) + start;
			},
			easeInOutSine: function easeInOutSine(percent, elapsed, start, end, duration) {
				return -(end - start) / 2 * (Math.cos(Math.PI * elapsed / duration) - 1) + start;
			},
			easeInQuad: function easeInQuad(percent, elapsed, start, end, duration) {
				return (end - start) * (elapsed /= duration) * elapsed + start;
			},
			easeOutQuad: function easeOutQuad(percent, elapsed, start, end, duration) {
				return -(end - start) * (elapsed /= duration) * (elapsed - 2) + start;
			},
			easeInOutQuad: function easeInOutQuad(percent, elapsed, start, end, duration) {
				if ((elapsed /= duration / 2) < 1) return (end - start) / 2 * elapsed * elapsed + start;
				return -(end - start) / 2 * (--elapsed * (elapsed - 2) - 1) + start;
			}
		},
		cssEasing: {
			linear: "linear",
			easeInSine: "cubic-bezier(0.47, 0, 0.745, 0.715)",
			easeOutSine: "cubic-bezier(0.39, 0.575, 0.565, 1)",
			easeInOutSine: "cubic-bezier(0.445, 0.05, 0.55, 0.95)",
			easeInQuad: "cubic-bezier(0.55, 0.085, 0.68, 0.53)",
			easeOutQuad: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
			easeInOutQuad: "cubic-bezier(0.455, 0.03, 0.515, 0.955)"
		},
		startTimers: [],

		//------------------------------------------------
		// Init
		//------------------------------------------------
		init: function init() {
			this.testingElement = document.createElement("div");
			this.checkForCSS3();
			this.getTransitionEndString();
		},

		//------------------------------------------------
		// Check if we can use CSS3 transitions
		//------------------------------------------------
		checkForCSS3: function checkForCSS3() {
			this.CSS3Available = false;
			var availableStyles = this.testingElement.style;
			var prefixes = ["ms", "o", "moz", "webkit"],
			    transitionString = "";
			if (availableStyles["transition"] === "") {
				this.transitionString = "transition";
				this.CSS3Available = true;
				return;
			}
			while (prefixes.length) {
				transitionString = prefixes.pop() + "Transition";
				if (transitionString in availableStyles) {
					this.transitionString = transitionString;
					this.CSS3Available = true;
					break;
				}
			}
		},

		//------------------------------------------------
		// Can't animate scrollTop or scrollLeft with CSS3
		//------------------------------------------------
		checkForScrollPosChange: function checkForScrollPosChange(properties) {
			var scrollPosFound = false;
			var i = 0,
			    length = properties.length;
			for (var prop in properties) {
				if (prop === "scrollLeft" || prop === "scrollTop") {
					scrollPosFound = true;
				}
			}
			return scrollPosFound;
		},

		//------------------------------------------------
		// Create a new animation on an element
		//------------------------------------------------
		startAnimation: function startAnimation(element, properties, options, callback) {
			// Allows options argument to be missed by user
			if (callback && options) {
				options.complete = callback;
			}
			if (typeof options === "function") {
				var completeMethod = options;
				options = {};
				options.complete = completeMethod;
			}
			// Set defaults
			options.easing = options.easing || "linear";
			options.duration = options.duration || 1000;
			if (this.CSS3Available && !options.forcejs) {
				if (!this.checkForScrollPosChange(properties)) {
					this.animateWithCSS3(element, properties, options, callback);
				} else {
					this.animateWithJavaScript(element, properties, options, callback);
				}
			} else {
				this.animateWithJavaScript(element, properties, options, callback);
			}
		},

		//------------------------------------------------
		// Ideally let the browser do the work
		//------------------------------------------------
		animateWithCSS3: function animateWithCSS3(element, properties, options) {
			// Set start styles on element, if any are currently blank
			var startStyles = window.getComputedStyle ? getComputedStyle(element) : element.currentStyle;
			var newStyles = {};
			for (var prop in properties) {
				if (!startStyles[prop]) {
					if (prop.search(/transform/i) < 0) {
						newStyles[prop] = 0;
						if (prop.search(/opacity/i) > -1) {
							newStyles[prop] = 1;
						} else if (prop.search(/color/i) > -1) {
							if (prop === "color") {
								newStyles[prop] = "#000000";
							} else {
								newStyles[prop] = "transparent";
							}
						}
					}
				}
			}
			NATION.Utils.setStyle(element, newStyles);
			// Apply a transition after a small delay, to allow immediately prior
			// css changes to display in a draw cycle first
			requestAnimationFrame(function () {
				_private.startCSSAnim(element, properties, options);
			});
		},

		//------------------------------------------------
		// Start the CSS transition
		//------------------------------------------------
		startCSSAnim: function startCSSAnim(element, properties, options) {
			this.stopAnimation(element);
			properties = this.checkForPrefixes(properties);
			var durationInSeconds = options.duration / 1000 + "s",
			    styleString = "",
			    pixels = false,
			    percentage = false,
			    color = false,
			    value = "";
			var organisedProperties = [],
			    startValue;
			var startStyles = window.getComputedStyle ? getComputedStyle(element) : element.currentStyle;
			element.style[this.transitionString] = "all " + durationInSeconds + " " + this.cssEasing[options.easing];
			var attributeChanging = false;
			for (var prop in properties) {
				value = properties[prop].toString();
				var valueType = this.types.NONE;
				if (value.search(/px|%|#/gi) < 0 && value !== 0) {
					if (prop.search(/transform/i) < 0 && prop.search(/opacity/i) < 0) {
						value += "px";
					}
				}
				if (value.search(/transform/i) >= 0) {
					valueType = this.types.TRANSFORM;
				} else {
					if (value.search(/px/i) >= 0) valueType = this.types.PIXELS;
					if (value.search("%") >= 0) valueType = this.types.PERCENT;
					if (value.search(/#|rgb/i) >= 0) valueType = this.types.COLOUR;
				}
				startValue = element.style[prop] ? element.style[prop] : startStyles[prop];
				if (startValue === "0px") startValue = 0;
				element.style[prop] = value;
				organisedProperties.push({
					name: prop,
					startValue: startValue,
					targetValue: value,
					type: valueType
				});
				if (startValue !== value) {
					attributeChanging = true;
				}
			}
			this.activeAnimations.push({
				element: element,
				properties: organisedProperties,
				options: options
			});
			if (attributeChanging) {
				setTimeout(function () {
					element.addEventListener(_private.transitionEndString, _private.onTransitionEnd, false);
				}, 10);
			} else {
				// Fire complete immediately, as nothing changed
				this.onTransitionEnd({ target: element });
			}
		},

		//------------------------------------------------
		// Adds prefixes where needed to all property names
		//------------------------------------------------
		checkForPrefixes: function checkForPrefixes(properties) {
			// Check properties for any styles that might require prefixes
			// Copy the object temporarily
			var props = {},
			    newPropName,
			    value;
			for (var propName in properties) {
				newPropName = propName;
				value = properties[propName];
				delete props[propName];
				newPropName = NATION.Utils.getPrefixedName(newPropName);
				props[newPropName] = value;
			}
			return props;
		},

		//------------------------------------------------
		// Returns supported transition end event string
		//------------------------------------------------
		getTransitionEndString: function getTransitionEndString() {
			var transitionNames = {
				'WebkitTransition': 'webkitTransitionEnd',
				'MozTransition': 'transitionend',
				'OTransition': 'oTransitionEnd otransitionend',
				'transition': 'transitionend'
			};
			this.cssPrefix = "";
			for (var i in transitionNames) {
				if (this.testingElement.style[i] !== undefined) {
					this.cssPrefix = "-" + i.toLowerCase() + "-";
					this.cssPrefix = this.cssPrefix.replace("transition", "");
					this.transitionEndString = transitionNames[i];
					return;
				}
			}
		},

		//------------------------------------------------
		// Get percentage from -ms-filter string (0-1 format)
		//------------------------------------------------
		getPercentageFromFilter: function getPercentageFromFilter(filterString) {
			var percentage = filterString.replace("progid:DXImageTransform.Microsoft.Alpha(Opacity=", "");
			percentage = percentage.replace(")", "");
			return parseInt(percentage, 10) / 100;
		},

		//------------------------------------------------
		// Get percentage from filter string (0-1 format)
		//------------------------------------------------
		convertOpacityToFilterString: function convertOpacityToFilterString(percentage) {
			percentage = Math.floor(percentage * 100);
			return "progid:DXImageTransform.Microsoft.Alpha(Opacity=" + percentage + ")";
		},

		//------------------------------------------------
		// Parse a transform string into an array of values
		//------------------------------------------------
		convertTransformString: function convertTransformString(transformString) {
			// Wipe out spaces around commas, so that we can split array on spaces safely
			transformString = transformString.replace(/, | ,/g, ",");
			var valueArray = transformString.split(" ");
			var i = 0,
			    length = valueArray.length,
			    values = {},
			    attribute,
			    value,
			    startIndex,
			    endIndex;
			for (; i < length; i++) {
				startIndex = valueArray[i].indexOf("(") + 1;
				endIndex = valueArray[i].indexOf(")") - startIndex;
				attribute = valueArray[i].substr(0, startIndex - 1);
				value = valueArray[i].substr(startIndex, endIndex);
				if (value.indexOf(",") > -1) {
					// This is a coma separated value, eg. translate(23px, 56px)
					value = value.split(",");
				}
				values[attribute] = value;
			}
			return values;
		},

		//------------------------------------------------
		// Animate using JavaScript
		//------------------------------------------------
		animateWithJavaScript: function animateWithJavaScript(element, properties, options) {
			this.stopAnimation(element);
			properties = this.checkForPrefixes(properties);
			var currentTime = Date.now();
			var organisedProperties = [],
			    computedStyle;
			for (var prop in properties) {
				var targetValue = properties[prop].toString();
				var valueType = this.types.NONE;
				if (targetValue.search(/px|%|#|rgb/gi) < 0) {
					// Don't add 'px' if this is a transform, or we're just animating opacity
					if (prop.search("transform") < 0 && prop.search(/opacity/i) < 0) {
						targetValue += "px";
					}
				}
				// Store the start position
				var startValue = "";
				if (prop.search(/transform/i) >= 0) {
					valueType = this.types.TRANSFORM;
					targetValue = this.convertTransformString(targetValue);
				}
				if (element.style && element.style[prop]) {
					startValue = element.style[prop];
				} else {
					// Will only work for transforms if the target value is a matrix
					computedStyle = typeof window.getComputedStyle !== "undefined" ? window.getComputedStyle(element, null)[prop] : element.currentStyle[prop];
					if (computedStyle && valueType !== this.types.TRANSFORM) {
						startValue = computedStyle;
					} else {
						startValue = 0;
					}
				}
				if (valueType !== this.types.TRANSFORM && (!startValue || startValue === "none")) {
					// Nothing in style tag, compute the style if not animating scroll
					if (valueType === this.types.TRANSFORM) {
						startValue = {};
						for (name in targetValue) {
							throw new Error("NATION.Animation: A transform must be set before one can be animated. Failed to animate element with class names '" + element.className + "'");
						}
					} else if (prop !== "scrollLeft" && prop !== "scrollTop") {
						startValue = window.getComputedStyle ? getComputedStyle(element)[prop] : element.currentStyle[prop];
					} else {
						// Since we're trying to animate scrollTop or scrollLeft, if user wants to animate the whole page
						// we need to check whether to animate html or body
						if (element === document.documentElement) {
							element = NATION.Utils.getPageElement();
						}
						startValue = element[prop];
					}
				} else if (valueType === this.types.TRANSFORM) {
					startValue = this.convertTransformString(startValue);
					var i = 0,
					    length = targetValue.length;
					for (var propName in targetValue) {
						if (!startValue[propName]) {
							//if (window.console && console.warn) console.warn("NATION.Animation: Existing transform function does not match target function. Setting transform to 0 on the following element: ", element);
							startValue[propName] = targetValue[propName];
						}
					}
				}

				if (valueType !== this.types.TRANSFORM) {
					if (targetValue.search(/px/i) >= 0) {
						// IE sometimes adds px to zero values, so check if that's really what we want
						if (targetValue === "0px") {
							if (startValue.toString().search("%") >= 0) {
								valueType = this.types.PERCENT;
							} else {
								valueType = this.types.PIXELS;
							}
						} else {
							valueType = this.types.PIXELS;
						}
					} else {
						if (targetValue.toString().search("%") >= 0) valueType = this.types.PERCENT;
						if (targetValue.toString().search(/#|rgb/i) >= 0) valueType = this.types.COLOUR;
					}
					targetValue = targetValue.toString().replace(/px|%/gi, "");
				}

				if (startValue === "auto") startValue = 0;
				if (prop === "opacity" && !("opacity" in document.documentElement.style)) {
					prop = "filter";
					startValue = element.currentStyle.filter;
					startValue = startValue || "progid:DXImageTransform.Microsoft.Alpha(Opacity=100)";
					startValue = this.getPercentageFromFilter(startValue);
					targetValue = parseInt(targetValue, 10);
				}
				organisedProperties.push({
					name: prop,
					startValue: startValue,
					targetValue: targetValue,
					type: valueType
				});
			}
			this.activeAnimations.push({
				element: element,
				properties: organisedProperties,
				options: options,
				startTime: currentTime,
				currentTime: currentTime,
				endTime: currentTime + options.duration
			});
			this.startAnimationInterval();
		},

		//------------------------------------------------
		// Stop an existing animation
		//------------------------------------------------
		stopAnimation: function stopAnimation(element) {
			// Switch to the page element relevant to the current browser if needed
			if (element === document.documentElement) {
				element = NATION.Utils.getPageElement();
				this.stopJSAnimation(element);
			}
			if (this.CSS3Available) {
				// Stop CSS transition in progress
				var currentStyles = window.getComputedStyle ? getComputedStyle(element) : element.currentStyle;
				var i = 0,
				    length = this.activeAnimations.length,
				    propName = "";
				for (; i < length; i++) {
					if (this.activeAnimations[i] && this.activeAnimations[i].element === element) {
						var k = 0,
						    propLength = this.activeAnimations[i].properties.length;
						for (; k < propLength; k++) {
							propName = this.activeAnimations[i].properties[k].name;
							element.style[propName] = currentStyles[propName];
							if (propName.search("scroll") > -1) {
								this.stopJSAnimation(element);
							}
						}
					}
				}
				// Remove transition and listeners
				element.removeEventListener(this.transitionEndString, _private.onTransitionEnd, false);
				element.style[this.transitionString] = "none";
				this.removeAnimation(element);
			} else {
				// Stop JS animation in progress
				this.stopJSAnimation(element);
			}
		},

		//------------------------------------------------
		// Stops a JavaScript animation in progress
		//------------------------------------------------
		stopJSAnimation: function stopJSAnimation(element) {
			this.removeAnimation(element);
			if (this.activeAnimations.length <= 0) {
				cancelAnimationFrame(this.animRequest);
				clearInterval(this.animationTimer);
				this.animationTimer = null;
			}
		},

		//------------------------------------------------
		// Creates timer to loop through all active animations
		//------------------------------------------------
		startAnimationInterval: function startAnimationInterval() {
			if (this.animationTimer) {
				clearTimeout(this.animationTimer);
			}
			this.animationTimer = setTimeout(function () {
				_private.animRequest = requestAnimationFrame(_private.updateAnimation);
			}, 1000 / 60);
		},

		//------------------------------------------------
		// Tween from one colour to another based on progress
		//------------------------------------------------
		tweenColour: function tweenColour(progress, startValue, targetValue) {
			if (startValue.search("#") >= 0) {
				startValue = this.hexToRGB(startValue);
			}
			if (targetValue.search("#") >= 0) {
				targetValue = this.hexToRGB(targetValue);
			}
			startValue = this.RGBToArray(startValue);
			targetValue = this.RGBToArray(targetValue);

			var red = targetValue[0] * progress + startValue[0] * (1 - progress);
			var green = targetValue[1] * progress + startValue[1] * (1 - progress);
			var blue = targetValue[2] * progress + startValue[2] * (1 - progress);
			return this.RGBToHex("(" + red + "," + green + "," + blue + ")");
		},

		//------------------------------------------------
		// Go through each transform property and move
		// them along slightly
		//------------------------------------------------
		tweenTransform: function tweenTransform(easing, progress, elapsed, startValues, targetValues, duration) {
			var newValues = {},
			    startValue,
			    targetValue,
			    unit,
			    newValue,
			    newNumber;
			for (var propName in targetValues) {
				if (typeof targetValues[propName] !== "string") {
					// Value was comma separated (eg. translate(10px, 20px))
					newValue = "";
					var i = 0,
					    length = targetValues[propName].length;
					for (; i < length; i++) {
						if (typeof startValues[propName] !== "string" && startValues[propName][i]) {
							startValue = parseFloat(startValues[propName][i].replace(unit, ""));
						} else {
							startValue = 0;
						}
						if (targetValues[propName][i]) {
							targetValue = parseFloat(targetValues[propName][i].replace(unit, ""));
						} else {
							targetValue = startValue;
						}

						newNumber = this.easing[easing](progress, elapsed, startValue, targetValue, duration);
						unit = targetValues[propName][i].replace(/[0-9|\-|\.]/g, "");
						if (unit === "") {
							unit = startValues[propName][i].replace(/[0-9|\-|\.]/g, "");
						}
						//if (unit === "") {
						//	unit = "px";
						//}
						newValue += newNumber + unit;
						if (i < length - 1) newValue += ",";
					}
					newValues[propName] = newValue;
				} else {
					// Standard single value string
					unit = targetValues[propName].replace(/[0-9|\-|\.]/g, "");
					if (unit === "") {
						unit = startValues[propName].replace(/[0-9|\-|\.]/g, "");
					}
					//if (unit === "") {
					//unit = "px";
					//}
					startValue = startValues[propName] === 0 ? 0 : parseFloat(startValues[propName].replace(unit, ""));
					targetValue = parseFloat(targetValues[propName].replace(unit, ""));
					newValues[propName] = this.easing[easing](progress, elapsed, startValue, targetValue, duration);
					newValues[propName] += unit;
				}
			}
			return newValues;
		},

		//------------------------------------------------
		// Build up transform string from passed values
		//------------------------------------------------
		applyNewTransform: function applyNewTransform(element, propertyName, values) {
			var transformString = "";
			for (var attribute in values) {
				transformString += attribute + "(" + values[attribute] + ") ";
			}
			element.style[propertyName] = transformString;
		},

		//------------------------------------------------
		// The main animation loop for javascript mode
		//------------------------------------------------
		updateAnimation: function updateAnimation() {
			var anims = _private.activeAnimations,
			    allAnimsComplete = true;
			var i = 0,
			    length = anims.length,
			    currentValue,
			    newValue,
			    propertyData,
			    optionData,
			    completeAnims;
			var pixels, percentage;
			for (; i < length; i++) {
				anims[i].currentTime = Date.now();
				completeAnims = 0;
				for (var k = 0; k < anims[i].properties.length; k++) {
					propertyData = anims[i].properties[k];
					// If this property is fully animated, ignore it this time around
					if (!propertyData.complete) {
						optionData = anims[i].options;
						var progress = (anims[i].currentTime - anims[i].startTime) / (anims[i].endTime - anims[i].startTime);
						if (progress > 1) progress = 1;
						var newValue = 0;
						if (propertyData.type === _private.types.TRANSFORM) {
							newValue = _private.tweenTransform(optionData.easing, progress, anims[i].currentTime - anims[i].startTime, propertyData.startValue, propertyData.targetValue, anims[i].options.duration);
						} else if (propertyData.type === _private.types.COLOUR) {
							newValue = _private.tweenColour(progress, propertyData.startValue, propertyData.targetValue);
						} else {
							newValue = _private.easing[optionData.easing](progress, anims[i].currentTime - anims[i].startTime, parseInt(propertyData.startValue, 10), propertyData.targetValue, anims[i].options.duration);
						}
						var easedProgress = _private.easing[optionData.easing](progress, anims[i].currentTime - anims[i].startTime, 0, 1, anims[i].options.duration);
						// This property has reached it's target value
						if (progress === 1) {
							// Handle JavaScript's "issues" with floating points
							newValue = propertyData.targetValue;
							anims[i].properties[k].complete = true;
							completeAnims++;
						}
						if (propertyData.name === "scrollLeft" || propertyData.name === "scrollTop") {
							// Animate scroll differently
							anims[i].element[propertyData.name] = newValue;
						} else if (propertyData.type === _private.types.TRANSFORM) {
							// Create the new transform string and apply it to the element
							_private.applyNewTransform(anims[i].element, propertyData.name, newValue);
						} else if (propertyData.type === _private.types.PERCENT) {
							anims[i].element.style[propertyData.name] = newValue + "%";
						} else if (propertyData.type === _private.types.PIXELS) {
							anims[i].element.style[propertyData.name] = newValue + "px";
						} else {
							if (propertyData.name === "filter") {
								// Change to filters for IE8
								newValue = _private.convertOpacityToFilterString(newValue);
							}
							anims[i].element.style[propertyData.name] = newValue;
						}
						if (progress < 1) {
							allAnimsComplete = false;
						}
						if (anims[i].options.update) {
							anims[i].options.update(easedProgress);
						}
					}
					if (completeAnims === anims[i].properties.length) {
						anims[i].allComplete = true;
					}
				}
			}
			if (!allAnimsComplete) {
				_private.startAnimationInterval();
			} else {
				cancelAnimationFrame(_private.animRequest);
				clearInterval(_private.animationTimer);
				_private.animationTimer = null;
			}

			i = 0;
			var clonedAnimArray = _private.activeAnimations.slice(0);
			for (; i < length; i++) {
				if (clonedAnimArray[i].allComplete) {
					_private.removeAnimation(clonedAnimArray[i].element);
					if (clonedAnimArray[i].options.complete) {
						var e = {};
						e.target = e.currentTarget = clonedAnimArray[i].element;
						clonedAnimArray[i].options.complete(e);
					}
				}
			}
		},

		//------------------------------------------------
		// Clear animation data
		//------------------------------------------------
		removeAnimation: function removeAnimation(element) {
			var i = 0,
			    length = this.activeAnimations.length;
			for (; i < length; i++) {
				if (this.activeAnimations[i].element === element) {
					this.activeAnimations.splice(i, 1);
					break;
				}
			}
		},

		//------------------------------------------------
		// Check if element has a callback, then call it
		//------------------------------------------------
		handleCallback: function handleCallback(element) {
			var i = 0,
			    length = this.activeAnimations.length;
			for (; i < length; i++) {
				if (this.activeAnimations[i].options.complete) {
					this.activeAnimations[i].options.complete(element);
				}
			}
		},

		//------------------------------------------------
		// Convert a hex colour to RGB format
		//------------------------------------------------
		hexToRGB: function hexToRGB(hex) {
			// Expand shorthand hexes first
			var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
			hex = hex.replace(shorthandRegex, function (m, r, g, b) {
				return r + r + g + g + b + b;
			});
			// Convert to RGB values for each colour
			var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
			return "(" + parseInt(result[1], 16) + "," + parseInt(result[2], 16) + "," + parseInt(result[3], 16) + ")";
		},

		//------------------------------------------------
		// Convert an individual colour to hex (eg. red=FF)
		//------------------------------------------------
		colourSectionToHex: function colourSectionToHex(colour) {
			colour = parseInt(colour, 10);
			var hex = colour.toString(16);
			return hex.length === 1 ? "0" + hex : hex;
		},

		//------------------------------------------------
		// Convert an RGB colour to hex format
		//------------------------------------------------
		RGBToHex: function RGBToHex(rgb) {
			var colours = this.RGBToArray(rgb);
			return "#" + this.colourSectionToHex(colours[0]) + this.colourSectionToHex(colours[1]) + this.colourSectionToHex(colours[2]);
		},

		//------------------------------------------------
		// Convert an RGB value into an array with separate colours
		//------------------------------------------------
		RGBToArray: function RGBToArray(rgb) {
			rgb = rgb.replace(/ /g, "");
			var colours = rgb.split("(");
			colours = colours[1].split(")");
			colours = colours[0].split(",");
			return colours;
		},

		//------------------------------------------------
		// Fire callback and forget about this animation
		//------------------------------------------------
		onTransitionEnd: function onTransitionEnd(e) {
			var i = 0,
			    length = _private.activeAnimations.length;
			var clonedAnimArray = _private.activeAnimations.slice(0);
			for (; i < length; i++) {
				if (clonedAnimArray[i].element === e.target) {
					//_private.stopAnimation(e.target);
					clonedAnimArray[i].element.removeEventListener("transitionend", _private.onTransitionEnd, false);
					if (clonedAnimArray[i].element.style.removeProperty) {
						clonedAnimArray[i].element.style.removeProperty(_private.transitionString);
						//clonedAnimArray[i].element.style[_private.transitionString] = "none";
					} else {
							clonedAnimArray[i].element.style.removeAttribute(_private.transitionString);
						}
					_private.removeAnimation(clonedAnimArray[i].element);
					if (clonedAnimArray[i].options.complete) {
						var e = {};
						e.target = e.currentTarget = clonedAnimArray[i].element;
						clonedAnimArray[i].options.complete(e);
					}
				}
			}
		}
	};

	_private.init();
	return _public;
}();

(function () {
	var lastTime = 0;
	var vendors = ['webkit', 'moz'];
	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame) window.requestAnimationFrame = function (callback, element) {
		var currTime = new Date().getTime();
		var timeToCall = Math.max(0, 16 - (currTime - lastTime));
		var id = window.setTimeout(function () {
			callback(currTime + timeToCall);
		}, timeToCall);
		lastTime = currTime + timeToCall;
		return id;
	};

	if (!window.cancelAnimationFrame) window.cancelAnimationFrame = function (id) {
		clearTimeout(id);
	};
})();
"use strict";

//////////////////////////////////////////////////////////////////////////////
// Nation Library
// Event Dispatcher
// Version 2.1.2
//////////////////////////////////////////////////////////////////////////////

(function (window, document, undefined) {

	"use strict";

	if (typeof window.NATION === "undefined") window.NATION = {};

	//////////////////////////
	// Depenency Management
	//////////////////////////
	_initClass();
	var packageName = "NATION.EventDispatcher";
	window.waitingDependencies = window.waitingDependencies || {};
	// Check for any classes waiting on this one
	for (var className in window.waitingDependencies) {
		for (var propName in window.waitingDependencies[className].dependencies) {
			if (propName === packageName) {
				// Re-run the waiting class' dependency check
				window.waitingDependencies[className].callback();
			}
		}
	}

	//////////////////////////
	// Create Class
	//////////////////////////
	function _initClass() {
		/**
  * ### Dependencies:
  * None
  *
  * ### About:
  * Enables any class to dispatch custom events, and adds addListener and removeListener methods to enable any parent class to listen for those custom events
  *
  * @class EventDispatcher
  */
		var EventDispatcher = function EventDispatcher() {
			this.wheelEventName = "";
			this.eventHandlers = {};
		};

		/**
  * Add a listener for a custom event, and run a callback when the event fires
  * @param {string} eventNames One or more event names, separated by spaces
  * @param {function} callback The callback method to run when the event fires
  */
		EventDispatcher.prototype.addListener = function (eventNames, callback) {
			// Throw an error for a missing event name
			if (!eventNames) throw new Error(this.ERROR_MISSING_EVENT_NAME);
			eventNames = eventNames.split(" ");
			var i = 0,
			    length = eventNames.length;
			for (; i < length; i++) {
				// Throw an error for a missing callback (else nothing would happen when the event fires)
				if (!callback) throw new Error(this.ERROR_MISSING_CALLBACK.replace("{{eventName}}", eventNames[i]));
				// Ensure the wheel event is named correctly for the current browser
				eventNames[i] = this.normalizeMouseWheelEvent(eventNames[i]);
				// If an array hasn't yet been created for this event type, create a blank one
				if (typeof this.eventHandlers[eventNames[i]] === "undefined") this.eventHandlers[eventNames[i]] = [];
				// Add the new handler to the array
				this.eventHandlers[eventNames[i]].push(callback);
			}
		};

		/**
  * Remove a listener for a custom event
  * @param {string} eventNames One or more event names, separated by spaces, to stop listening for
  * @param {function} callback The callback method that was due to run. If this argument is blank, all listeners for the event name will be removed
  */
		EventDispatcher.prototype.removeListener = function (eventNames, callback) {
			// Throw an error for a missing event name
			if (!eventNames) throw new Error(this.ERROR_MISSING_EVENT_NAME);
			eventNames = eventNames.split(" ");
			var i = 0,
			    length = eventNames.length;
			for (; i < length; i++) {
				// Ensure the wheel event is named correctly for the current browser
				eventNames[i] = this.normalizeMouseWheelEvent(eventNames[i]);
				if (this.eventHandlers[eventNames[i]] instanceof Array) {
					// Remove all callbacks for this event if no callback was specified
					if (!callback) {
						this.eventHandlers[eventNames[i]] = [];
						return;
					}
					// If a callback was specified, remove the matching handler
					var i = 0,
					    length = this.eventHandlers[eventNames[i]].length;
					for (; i < length; i++) {
						// If the callback argument matches the callback in the registered handler
						if (String(this.eventHandlers[eventNames[i]]) === String(callback)) {
							// Remove it from the handler array
							this.eventHandlers[eventNames[i]].splice(i, 1);
						}
					}
				}
			}
		};

		/**
  * Fire one or more custom events
  * @param {string} eventName The name of the event to fire. Can be multiple event names separated by spaces
  */
		EventDispatcher.prototype.trigger = function (eventNames) {
			// Throw an error for a missing event name
			if (!eventNames) throw new Error(this.ERROR_MISSING_EVENT_NAME);
			// Multiple events can be fired at once, so convert arguments to an array
			if (arguments.length > 1) {
				// If the event names were passed as separate arguments, pull them into an array
				eventNames = Array.prototype.slice.call(arguments, 0);
			} else {
				// Event names were separated by spaces, so convert them to an array by splitting on spaces
				eventNames = eventNames.split(" ");
			}
			// Initialise variables used to loop through handlers
			var i = 0,
			    length = eventNames.length;
			var handlers = [],
			    totalHandlers,
			    k = 0,
			    eventObject;
			// Cycle through each event name
			for (; i < length; i++) {
				// Ensure the wheel event is named correctly for the current browser
				eventNames[i] = this.normalizeMouseWheelEvent(eventNames[i]);
				// Find existing handlers for this event name
				handlers = this.eventHandlers[eventNames[i]];
				// If there is one or more handlers for this event, call them
				if (typeof handlers !== "undefined") {
					totalHandlers = handlers.length;
					// Loop through each registered handler
					for (k = 0; k < totalHandlers; k++) {
						// Make sure the handler's value is non-null
						if (handlers[k]) {
							// Build an object similar to a standard event object
							eventObject = {
								target: this,
								currentTarget: this,
								type: eventNames[i],
								bubbles: false,
								cancelable: false,
								defaultPrevented: false,
								timestamp: Date.now(),
								isTrusted: false
							};
							// Call the target function in the current scope, while also passing the event object
							handlers[k].apply(this, [eventObject]);
						}
					}
				}
			}
		};

		EventDispatcher.prototype.ERROR_MISSING_EVENT_NAME = "NATION.EventDispatcher: The argument 'eventName' is required";
		EventDispatcher.prototype.ERROR_MISSING_CALLBACK = "NATION.EventDispatcher: The 'callback' argument is required to listen for event '{{eventName}}'";

		/**
  * Check which mousewheel event name is supported in the current browser
  * @ignore
  */
		EventDispatcher.prototype.normalizeMouseWheelEvent = function (eventName) {
			if (eventName.search(/mousewheel|wheel|DOMMouseScroll/g) >= 0) {
				// It is only required to run this once
				if (!this.wheelEventName) {
					// "wheel" is the standards-compliant event name
					if ("onwheel" in document.createElement("div")) {
						this.wheelEventName = "wheel";
					} else if (document.onmousewheel !== undefined) {
						this.wheelEventName = "mousewheel";
					} else {
						this.wheelEventName = "DOMMouseScroll";
					}
				}
				return this.wheelEventName;
			} else {
				// Remove any spaces from the event name
				return eventName.replace(/ /g, "");
			}
		};

		window.NATION.EventDispatcher = EventDispatcher;
	}
})(window, document, undefined);
"use strict";

//////////////////////////////////////////////////////////////////////////////
// Nation Library
// Progress Bar
// Version 2.2.3
// Dependencies: NATION.Utils, NATION.EventDispatcher
//////////////////////////////////////////////////////////////////////////////

(function (window, document, undefined) {

	"use strict";

	if (typeof window.NATION === "undefined") window.NATION = {};

	//////////////////////////
	// Depenency Management
	//////////////////////////
	function checkDependencies() {
		var packageName = "NATION.ProgressBar";
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
					callback: function callback() {
						checkDependencies();
					}
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

	//////////////////////////
	// Create Class
	//////////////////////////
	function _initClass() {
		/**
  * ### Dependencies:
  * [NATION.Utils](Utils.js.html)
  * [NATION.EventDispatcher](EventDispatcher.js.html)
  *
  * ### About:
  * Progress bar displaying a percentage from 0 to 100
  *
  * Selector is expected to contain an element with class 'js-progress' or 'progress', which is the actual progress bar itself. The width of this element is changed as a percentage to represent the desired percentage to display
  *
  * Selector can contain a clickable hit area. This should be an element with the class 'js-hitarea' or 'hitarea'
  * Selector can also contain a handle, by using class 'js-handle' or 'handle'
  * Selector can also contain a separate load progress bar, marked with class 'js-loaded' or 'loaded'. This can be set to different percentages than the progress bar, via the 'setLoaded' method. This will also resize the hit area element to match
  *
  * @class ProgressBar
  * @param {domelement_or_jqueryobject} selector The element that will behave as a scrollbar
  * @param {object} options Object containing settings for this progress bar<br />
  * <b>handlePositioning</b> <i>{string: "outside"}</i> Either "outside" (default) or "inside". Defines how the handle should be positioned within the bar. "outside" sees the cenre of the handle move between 0 and 100% of the bar, thus leading to it poking outside. "inside" keeps the handle fully within the bar
  * <b>snapSegments</b> <i>{number: 1}</i> Enable snapping by dividing the bar into segments. More than one segment will trigger snapping
  * @jsFiddle //jsfiddle.net/NationStudio/7thLue5y/embedded/
  */
		var ProgressBar = function ProgressBar(selector, handlePositioning, options) {
			NATION.EventDispatcher.call(this);
			this.options = {
				handlePositioning: "outside",
				snapSegments: 1
			};
			// Keeps older projects working
			if (handlePositioning && typeof handlePositioning === "string") {
				this.options.handlePositioning = handlePositioning;
			} else if (handlePositioning && !options) {
				options = handlePositioning;
			}
			if (options) {
				for (var optionName in options) {
					this.options[optionName] = options[optionName];
				}
			}
			// Store reference to the main selector
			this.__DOMElement = NATION.Utils.getDOMElement(selector);
			// Store references to the child elements
			this.__hitArea = this.__DOMElement.querySelector(".js-hitarea, .hitarea");
			this.__handle = this.__DOMElement.querySelector(".js-handle, .handle");
			this.__progressElement = this.__DOMElement.querySelector(".js-progress, .progress");
			this.__loadedElement = this.__DOMElement.querySelector(".js-loaded, .loaded");
			if (this.__handle) {
				this.__handle.setAttribute("draggable", "false");
			}
			// Variable definitions
			this.requestedPercentage = 0;
			this.displayedPercentage = 0;
			this.displayedLoadedPercentage = 0;
			this.handleDragging = false;
			// Setup
			this.createListeners();
		};

		/**
  * Inherits from NATION.EventDispatcher
  * @ignore
  */
		ProgressBar.prototype = Object.create(NATION.EventDispatcher.prototype);
		ProgressBar.prototype.constructor = ProgressBar;

		/**
  * Event that fires when the progress bar has been clicked
  */
		ProgressBar.prototype.CLICKED = "clicked";
		/**
  * Event that fires when a handle drag has started
  */
		ProgressBar.prototype.HANDLE_MOUSE_DOWN = "HandleMouseDown";
		/**
  * Event that fires each time the user moves the handle during a drag
  */
		ProgressBar.prototype.HANDLE_DRAGGED = "HandleDragged";
		/**
  * Event that fires when the user releases the handle
  */
		ProgressBar.prototype.HANDLE_RELEASED = "HandleReleased";
		/**
  * Event that fires when the value of the progress bar changes
  */
		ProgressBar.prototype.VALUE_CHANGED = "ValueChanged";

		/**
  * Returns true if the user is currently dragging the handle
  * @return {boolean} Whether the user is currently dragging the handle or not
  */
		ProgressBar.prototype.getHandleDragInProgress = function () {
			return this.handleDragging;
		};

		/**
  * Returns the currently displayed percentage
  * @return {number} Percentage between 0 and 1
  */
		ProgressBar.prototype.getPercentage = function () {
			return this.displayedPercentage;
		};

		/**
  * Returns the percentage corresponding to where the user last clicked
  * @return {number} Percentage between 0 and 1
  */
		ProgressBar.prototype.getRequestedPercentage = function () {
			return this.requestedPercentage;
		};

		/**
  * Display a passed percentage
  * @param {number} percentage The percentage to show, between 0 and 1
  */
		ProgressBar.prototype.setProgress = function (percentage) {
			// Ensure percentage isn't out of bounds
			if (percentage > 1) {
				percentage = 1;
			} else if (percentage < 0) {
				percentage = 0;
			}
			if (percentage !== this.displayedPercentage) {
				valueChanged = true;
			}
			this.displayedPercentage = percentage;
			if (valueChanged) {
				this.trigger(this.VALUE_CHANGED);
			}
			if (this.options.handlePositioning === "inside") {
				percentage = (this.__DOMElement.offsetWidth - this.__handle.offsetWidth) * percentage / this.__DOMElement.offsetWidth;
			}
			// Convert percentage to correct value for CSS
			var newWidth = percentage * 100;
			if (newWidth > 0) {
				newWidth += "%";
			}
			// Apply new width to the progress element
			if (this.__progressElement) {
				this.__progressElement.style.width = newWidth;
			}
			var valueChanged = false;
			// Update the currently displayed percentage

			this.setNewHandlePosition(percentage);
		};

		/**
  * Set the load bar position via a percentage
  * @param {number} percentage Percentage between 0 and 1
  * @param {boolean} adjustHitArea Whether to match hitarea width to progress bar width
  */
		ProgressBar.prototype.setLoaded = function (percentage, adjustHitArea) {
			// Ensure percentage isn't out of bounds
			if (percentage > 1) {
				percentage = 1;
			} else if (percentage < 0) {
				percentage = 0;
			}
			// Convert percentage to correct value for CSS
			var newWidth = percentage * 100 + "%";
			// Apply new width to the loaded element, if one exists
			if (this.__loadedElement) {
				this.__loadedElement.style.width = newWidth;
			}
			// Apply new width to the hit area element, if one exists
			if (adjustHitArea && this.__hitArea) {
				this.__hitArea.style.width = newWidth;
			}
			// Store this percentage as the currently displayed one
			this.displayedLoadedPercentage = percentage;
		};

		/**
  * Set the handle to a percentage along the bar
  * @param {number} percentage Percentage to position the handle at, between 0 and 1
  */
		ProgressBar.prototype.setNewHandlePosition = function (percentage) {
			if (this.__handle) {
				var progressBarWidth = this.__progressElement.offsetWidth;
				var newPosition = percentage;
				if (newPosition < 0) newPosition = 0;
				var hitAreaWidthPercent = 0;
				if (this.__hitArea) {
					hitAreaWidthPercent = this.__hitArea.offsetWidth / progressBarWidth;
				} else {
					hitAreaWidthPercent = this.__DOMElement.offsetWidth / progressBarWidth;
				}
				if (newPosition > hitAreaWidthPercent) newPosition = hitAreaWidthPercent;
				this.__handle.style.left = 100 * newPosition + "%";
			}
		};

		/**
  * Listen for clicks on the hit area, if one exists
  * @ignore
  */
		ProgressBar.prototype.createListeners = function () {
			if (this.__hitArea) {
				this.__hitArea.addEventListener("click", this.onHitAreaClicked.bind(this));
			}
			if (this.__handle) {
				this.__handle.addEventListener("mousedown", this.onHandleMouseDown.bind(this));
				this.__handle.addEventListener("click", this.onHandleClicked.bind(this));
				this.__handle.addEventListener("touchstart", this.onHandleTouchStart.bind(this));
			}
		};

		/**
  * Store the last clicked percentage, and signal that the hit area was clicked
  * @ignore
  */
		ProgressBar.prototype.onHitAreaClicked = function (e) {
			// Get the click position, relative to the progress bar, rather than the browser window
			var clickedX = e.pageX - NATION.Utils.getOffset(e.currentTarget).left;
			// Convert it to a percentage and store it for later outside access
			this.requestedPercentage = clickedX / this.__DOMElement.offsetWidth;
			// Signal that the progress bar was clicked
			this.trigger(this.CLICKED);
			e.stopPropagation();
			e.preventDefault();
		};

		/**
  * Start dragging handle
  * @ignore
  */
		ProgressBar.prototype.onHandleMouseDown = function (e) {
			this.handleDragging = true;
			this.handler_MouseMove = this.onHandleDragged.bind(this);
			this.handler_MouseUp = this.onHandleReleased.bind(this);
			document.addEventListener("mousemove", this.handler_MouseMove);
			document.addEventListener("mouseup", this.handler_MouseUp);
			this.trigger(this.HANDLE_MOUSE_DOWN);
			e.stopPropagation();
			e.preventDefault();
		};

		/**
  * Move handle to match touch movement
  * @ignore
  */
		ProgressBar.prototype.onHandleDragged = function (e) {
			var xPos = e.pageX - NATION.Utils.getOffset(this.__DOMElement).left;
			this.updateHandleOnDrag(xPos);
			this.trigger(this.HANDLE_DRAGGED);
			e.stopPropagation();
			e.preventDefault();
		};

		/**
  * Position the handle correctly in response to a drag
  * @ignore
  */
		ProgressBar.prototype.updateHandleOnDrag = function (xPos) {
			var progressBarWidth = this.__DOMElement.offsetWidth;
			// Don't allow handlePositioning to break the requested percentage
			if (this.__hitArea && xPos > this.__hitArea.offsetWidth) {
				xPos = this.__hitArea.offsetWidth;
			}

			this.requestedPercentage = xPos / progressBarWidth;
			if (this.options.snapSegments > 1) {
				var newPercentage = 0;
				var visibleSegments = this.options.snapSegments;
				var segmentPercentage = 100 / visibleSegments / 100;
				for (var i = 0, length = visibleSegments; i < length; i++) {
					if (this.requestedPercentage >= segmentPercentage / 2 + i * segmentPercentage) {
						newPercentage = segmentPercentage * (i + 1);
					}
				}
				this.requestedPercentage = newPercentage;
			}
			// Make sure the percentage stays within bounds
			if (this.requestedPercentage > 1) this.requestedPercentage = 1;
			if (this.requestedPercentage < 0) this.requestedPercentage = 0;
			this.setProgress(this.requestedPercentage);
		};

		/**
  * Stop tracking mouse move events
  * @ignore
  */
		ProgressBar.prototype.onHandleReleased = function (e) {
			this.handleDragging = false;
			document.removeEventListener("mousemove", this.handler_MouseMove);
			document.removeEventListener("mouseup", this.handler_MouseUp);

			this.trigger(this.HANDLE_RELEASED);
			e.stopPropagation();
			e.preventDefault();
		};

		/**
  * Start tracking touch move events
  * @ignore
  */
		ProgressBar.prototype.onHandleTouchStart = function (e) {
			this.handleDragging = true;
			this.handler_TouchMove = this.onHandleTouchMove.bind(this);
			this.handler_TouchEnd = this.onHandleTouchEnd.bind(this);
			document.addEventListener("touchmove", this.handler_TouchMove);
			document.addEventListener("touchend", this.handler_TouchEnd);
			document.addEventListener("pointermove", this.handler_TouchMove);
			document.addEventListener("pointerup", this.handler_TouchEnd);
			this.trigger(this.HANDLE_MOUSE_DOWN);
			e.stopPropagation();
			e.preventDefault();
		};

		/**
  * Move handle to match touch movement
  * @ignore
  */
		ProgressBar.prototype.onHandleTouchMove = function (e) {
			var touches = typeof e.changedTouches != 'undefined' ? e.changedTouches : [e];
			var xPos = touches[0].pageX - NATION.Utils.getOffset(this.__DOMElement).left;
			this.updateHandleOnDrag(xPos);
			e.stopPropagation();
			e.preventDefault();
		};

		/**
  * Stop tracking touch move events
  * @ignore
  */
		ProgressBar.prototype.onHandleTouchEnd = function (e) {
			this.handleDragging = false;
			document.removeEventListener("touchmove", this.handler_TouchMove);
			document.removeEventListener("touchend", this.handler_TouchEnd);
			document.removeEventListener("pointermove", this.handler_TouchMove);
			document.removeEventListener("pointerup", this.handler_TouchEnd);
			this.trigger(this.HANDLE_RELEASED);
			e.stopPropagation();
			e.preventDefault();
		};

		/**
  * Prevent default action
  * @ignore
  */
		ProgressBar.prototype.onHandleClicked = function (e) {
			e.preventDefault();
		};

		window.NATION.ProgressBar = ProgressBar;
	}
})(window, document, undefined);
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

//////////////////////////////////////////////////////////////////////////////
// Nation Library
// Core utilities
// Version 2.1.2
//////////////////////////////////////////////////////////////////////////////

(function (window, document, undefined) {

	"use strict";

	if (typeof window.NATION === "undefined") window.NATION = {};

	//////////////////////////
	// Depenency Management
	//////////////////////////
	_initClass();
	var packageName = "NATION.Utils";
	window.waitingDependencies = window.waitingDependencies || {};
	// Check for any classes waiting on this one
	for (var className in window.waitingDependencies) {
		for (var propName in window.waitingDependencies[className].dependencies) {
			if (propName === packageName) {
				// Re-run the waiting class' dependency check
				window.waitingDependencies[className].callback();
			}
		}
	}

	//////////////////////////
	// Create Class
	//////////////////////////
	function _initClass() {
		/**
  * ### Dependencies:
  * None
  *
  * ### About:
  * This class features a number of useful utility methods for use around your site
  *
  * @class Utils
  */
		var Utils = function Utils() {
			/**
   * Instance variables
   * @ignore
   */
			this.requestID = 0;
			this.testElement = document.createElement("div");
			this.pageElement = null;
		};

		/**
  * Load a URL
  * Note: If loading binary data, a handy reference: http://www.html5rocks.com/en/tutorials/file/xhr2/
  * @param {object} options Object containing required settings. The only required option is 'url' <br />
  * <b>url</b> <i>{string}</i> (Required) The URL to load
  * <b>method</b> <i>{string: "get"}</i> Load the URL via either get or post
  * <b>success</b> <i>{function}</i> A method to call when the URL has been successfully loaded
  * <b>error</b> <i>{function}</i>  A method to call when an error occurs after attempting to load the URL
  * <b>dataType</b> <i>{string}</i> The type of data that will be loaded: "text", json", "jsonp", "script", "arraybuffer", "blob", or "document"
  * <b>data</b> <i>{string/object}</i> Data to send to the server as part of the request. Either a query string or an object of key/value pairs
  * <b>id</b> <i>{string}</i> A unique ID to attach to script loads. Allows author to check document if a script has already loaded before loading it.
  * <b>contentType</b> <i>{string} Override the content type sent to the server in the request's header
  * <b>progress</b> <i>{function}</i> A method to call when load progress occurs. The method will receive a percentage between 0 and 1 representing progress. Only called in IE10+ and modren browsers
  */
		Utils.prototype.ajax = function (options) {
			// First make sure the options argument is a valid object.
			if (!options || options !== Object(options)) {
				throw new Error(this.ERROR_INVALID_OPTIONS);
			}
			// The URL option is mandatory, so throw an error if this is missing
			if (!options.url) {
				throw new Error(this.ERROR_UNDEFINED_URL);
			}
			// Set default values if options are passed in
			options.method = options.method || "GET";
			options.dataType = options.dataType || "text";
			// Decide which load method is required based on the type of data expected back
			if (options.dataType === "jsonp" || options.dataType === "script") {
				// Load via the script tag
				this.loadScript(options);
			} else {
				// Load via XMLHttpRequest
				this.createRequest(options);
			}
		};

		/**
  * Dynamically generate a namespace from a string
  * @param {string} namespace A namespace string separated by periods
  */
		Utils.prototype.createNamespace = function (namespace) {
			// Split the passed string into an array separated by periods
			var parts = namespace.split("."),
			    currentPart = "",
			    i = 0,
			    length = parts.length;
			// Created objects are nested, starting with the window object
			var parentObject = window;
			for (; i < length; i++) {
				// Reference to the current string in the array
				currentPart = parts[i];
				// Create a new object for this part if one didn't already exist
				parentObject[currentPart] = parentObject[currentPart] || {};
				// The next object will be a decendant of this one
				parentObject = parentObject[currentPart];
			}
		};

		/**
  * Returns the position of an element relative to the top left of the whole page
  * @param {domelement} element The element to find the position of, relative to the document root
  */
		Utils.prototype.getOffset = function (element) {
			var bounds = element.getBoundingClientRect();
			return {
				top: bounds.top + window.pageYOffset - (document.documentElement.clientTop || 0),
				left: bounds.left + window.pageXOffset - (document.documentElement.clientLeft || 0)
			};
		};

		/**
  * Returns the position of an element relative to it's nearest positioned parent
  * @param {domelement} element The element to find the position of, relative to it's nearest positioned parent
  */
		Utils.prototype.getPosition = function (element) {
			return {
				top: element.offsetTop,
				left: element.offsetLeft
			};
		};

		/**
  * Get the value of a style currently on an element
  * @param {domelement} element The element that has the style in question
  * @param {string} property The name of the property style who's value is returned
  * @param {boolean} preventCompute Set to true to return the style as originally defined in the stylesheet. Note that as this temporarily hides the element, it is more than a little abusive, so leave false if you can manage with the computed value
  */
		Utils.prototype.getStyle = function (element, property, preventCompute) {
			var value = 0;
			if (property === "float") property = "cssFloat";
			property = this.getPrefixedName(property);
			if (!preventCompute) {
				value = window.getComputedStyle(element, null)[property];
				if (value.search(/px|%|em|rem|vh|vw|vmin|vmax|ex|ch/g) > -1) {
					value = parseInt(value, 10);
				}
			} else {
				var originalDisplay = window.getComputedStyle(element, null)["display"];
				var hadStyleApplied = element.style.display != false;
				element.style.display = "none";
				value = window.getComputedStyle(element, null)[property];
				if (hadStyleApplied) {
					element.style.display = originalDisplay;
				} else {
					element.style.removeProperty("display");
				}
			}
			return value || "";
		};

		/**
  * Set one or more styles on an element
  * @param {domelement} element The DOM element to apply the new styles to
  * @param {object} styles An object of key-value pairs stating each new style's name and it's new value
  */
		Utils.prototype.setStyle = function (element, styles) {
			var parsedProp = "";
			for (var prop in styles) {
				parsedProp = this.getPrefixedName(prop);
				// If the value after being converted to an int matches the passed value, and this isn't a unitless CSS attribute
				if (parseInt(styles[prop], 10) == styles[prop] && prop.search(/opacity|margin|z-index|zIndex|font-weight|fontWeight|line-height|lineHeight|counter-reset|counterReset|counter-increment|counterIncrement|volume|stress|pitch-range|pitchRange|richness/g) < 0) {
					// This was a pure number, and should be converted to pixels
					styles[prop] += "px";
				}
				if (element.length) {
					for (var i = 0, length = element.length; i < length; i++) {
						element[i].style[parsedProp] = styles[prop];
					}
				} else {
					element.style[parsedProp] = styles[prop];
				}
			}
		};

		/**
  * Get a cookie value by name
  * @param {string} cookieName The name of the cookie to find a value for
  */
		Utils.prototype.getCookie = function (cookieName) {
			var cookieArray = document.cookie.split("; ");
			var cookies = {},
			    i = cookieArray.length - 1,
			    cookieValue = "";
			for (; i >= 0; i--) {
				cookieValue = cookieArray[i].split("=");
				cookies[cookieValue[0]] = cookieValue[1];
			}
			return cookies[cookieName];
		};

		/**
  * Set a new cookie for the current domain
  * @param {string} cookieName The name of the new cookie
  * @param {string} cookieValue The value the new cookie should contain
  * @param {string} days Optional cookie duration, in days. If left blank, the cookie will act as a session cookie
  */
		Utils.prototype.setCookie = function (cookieName, cookieValue, days) {
			var expires = "";
			if (days) {
				// Create a new date object
				var date = new Date();
				// Set the time to X days ahead of the current time
				date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
				// Store the new expirey string for later
				expires = "; expires=" + date.toGMTString();
			}
			// Create the new cookie string and set it as a cookie
			document.cookie = cookieName + "=" + cookieValue + expires + ";path=/";
		};

		/**
  * Get the main element that can scroll the whole page
  * @return {domelement} The element that can control the scroll position of the whole page
  */
		Utils.prototype.getPageElement = function () {
			if (!this.pageElement) {
				// Get the current scroll position
				var startY = window.pageYOffset || document.body.scrollTop;
				// Calculate a test scroll (1px lower than current)
				var testY = startY + 1;
				// Scroll the page to that test value
				window.scrollTo(0, testY);
				// Work out which element changed position - that's the scrollable element
				this.pageElement = document.documentElement.scrollTop === testY ? document.documentElement : document.body;
				// Reset the scroll position back to where it was
				window.scrollTo(0, startY);
				// Return the scrollable element
			}
			return this.pageElement;
		};

		/**
  * Check if an element supports a particular event
  * Via Modernizer and http://perfectionkills.com/detecting-event-support-without-browser-sniffing/
  * @param {string} eventName The name of the event to check exists
  * @param {domelement_or_string} element The element that may contain the event. If set as a string, eg. "span", the element matching the string will be created. Leave out to just test a standard div
  */
		Utils.prototype.isEventSupported = function (eventName, element) {
			var supported = false;
			var fallbackRequired = !("onblur" in document.documentElement);
			// If no event name was passed in, the result will always be false
			if (!eventName) return false;
			if (eventName === "hover") eventName = "mouseover";
			// Ensure there is a valid element to test
			if (!element) {
				element = this.testElement;
			} else if (typeof element === "string") {
				element = document.createElement(element);
			}
			// Append "on" as the method on the element will be named in this style
			eventName = "on" + eventName.toLowerCase();
			supported = eventName in element;
			// If user is using an old version of Firefox, we need a different approach
			if (!supported && fallbackRequired) {
				// Ensure the element in play actually has the setAttribute method
				if (!element.setAttribute) element = document.createElement("div");
				// Set the event name on the element. This will coax old FF into creating a function for a known event
				element.setAttribute(eventName, "");
				// Check if the funciton was created. If it was, the event is known and supported
				supported = typeof element[eventName] === "function";
				// Cleanup the dummy function
				if (element[eventName] !== undefined) element[eventName] = undefined;
				element.removeAttribute(eventName);
			}
			return supported;
		};

		/**
  * Serialise form data
  * @param {domelement} formElement The form element containing fields to serialise
  */
		Utils.prototype.serializeForm = function (formElement) {
			var field,
			    values = [];
			// Ensure passed element is actually a form
			if ((typeof formElement === "undefined" ? "undefined" : _typeof(formElement)) === "object" && formElement.nodeName === "FORM") {
				// Loop through child elements for the form element
				var length = formElement.elements.length,
				    i = 0,
				    j = 0;
				for (; i < length; i++) {
					// Store reference to this field
					field = formElement.elements[i];
					// Only process the field if it is a parsable type, and isn't disabled
					if (field.name && !field.disabled && field.type.toString().indexOf(/file|reset|submit|button/i) < 0) {
						// If the field can have multiple values, we need to step through them
						if (field.type === "select-multiple") {
							// For each value in the field
							for (j = field.length - 1; j >= 0; j--) {
								// If this value has been selected
								if (fieldElement.options[j].selected) {
									// Add the new value to the array
									values[values.length] = encodeURIComponent(field.name) + "=" + encodeURIComponentfield.options[j].value;
								}
							}
						} else if (field.type.toString().indexOf(/checkbox|radio/i) < 0 || field.checked) {
							// If this isn't a checkbox/radio button, or if it is and it has been checked, add this value to the array
							values[values.length] = encodeURIComponent(field.name) + "=" + encodeURIComponent(field.value);
						}
					}
				}
			}
			// Convert the array to a string separated by ampersands
			return values.join("&").replace(/%20/g, "+");
		};

		/**
  * Get actual DOM element from a selector
  * @param {domelement_or_string_or_jQuery object} selector A selector string, DOM element, or jQuery object from which to return a matching DOM element
  */
		Utils.prototype.getDOMElement = function (selector) {
			// If a selector string was passed in, find it in the DOM and return the result
			if (typeof selector === "string") return document.querySelector(selector);
			// If jQuery is present and the selector was a jQuery object, return the native DOM element from that
			if (typeof jQuery !== "undefined" && selector instanceof jQuery) {
				return jQuery(selector)[0];
			} else {
				// Otherwise, just return the selector directly as the DOM element
				return selector;
			}
		};

		/**
  * Return a version of the passed property name that is supported by the current browser
  * This will either be the one passed in, or a prefixed version of it
  * @param {string} propertyName The name of the style that may require a prefix before it works
  */
		Utils.prototype.getPrefixedName = function (propertyName) {
			var prefixes = ["webkit", "Moz", "ms", "moz"];
			var i = 0,
			    length = prefixes.length,
			    jsName = propertyName;
			// First, get rid of any pre-existing prefix on the passed property name
			for (; i < length; i++) {
				if (jsName.search("-" + prefixes[i] + "-") > -1) {
					// If there was a match for this prefix, remove it so we can generate the right prefix for the current browser
					jsName = jsName.replace("-" + prefixes[i] + "-", "");
					// Now it is known there's no prefix in the passed propertyName, so no need to continue here
					break;
				}
			}
			// Check if the existing property name works in this browser
			if (this.testElement.style[jsName] !== undefined || jsName === "scrollLeft" || jsName === "scrollTop") {
				// If so, return it straight back
				return jsName;
			}
			// propertyName isn't natively supported raw, so try adding prefixes
			// First convert the first character to uppercase, as this will come after a prefix
			jsName = jsName.charAt(0).toUpperCase() + jsName.slice(1);
			// Also replace any dashes followed by a letter with just the uppercased letter
			jsName = this.camelcaseString(jsName, true, true);
			for (i = 0; i < length; i++) {
				// If this prefixed name was found on the style object, it's supported
				if (this.testElement.style[prefixes[i] + jsName] !== undefined) {
					// Return the prefixed property name as it appears on the style object
					return prefixes[i] + jsName;
				}
			}
			// Throw an error here, as otherwise the author will get all sorts of mysterious errors otherwise
			if (propertyName != "transition") throw new Error(this.ERROR_UNSUPPORTED_STYLE.replace("{{property}}", propertyName));
		};

		/**
  * Convert a passed string to camelcase format
  * @param {string} value The string to camelcase
  * @param {boolean} jsProperty True if value should be treated as a code property (remove dashes and uppercase the letter that follows one)
  * @param {boolean} upperFirstChat True if the first character should always be uppercase (overrides jsProperty, when true, so that the first character is uppercase)
  */
		Utils.prototype.camelcaseString = function (value, jsProperty, upperFirstChar) {
			if (!jsProperty) {
				// Standard camelcasing
				return value.replace(/(?:^\w|[A-Z]|\b\w|)/g, function (match, index) {
					if (+match === 0) return "";
					return match.toUpperCase();
				});
			} else {
				// Replace a dash followed by a letter with just an uppercase letter
				value = value.replace(/\-[a-zA-Z]|\s[a-zA-Z]|\s+/g, function (match, index) {
					return match.replace(/-|\s/g, "").toUpperCase();
				});
				if (!upperFirstChar) {
					value = value.charAt(0).toLowerCase() + value.substring(1);
				}
				return value;
			}
		};

		/**
  * Error strings
  * @ignore
  */
		Utils.prototype.ERROR_INVALID_OPTIONS = "NATION.Utils: ajax argument 'options' is not a valid object";
		Utils.prototype.ERROR_UNDEFINED_URL = "NATION.Utils: ajax argument 'options.url' is undefined";
		Utils.prototype.ERROR_INVALID_DATA = "Nation.Utils: ajax argument 'options.data' must be either a querystring or an object consisting of key/value pairs";
		Utils.prototype.ERROR_REQUEST_FAILED = "NATION.Utils: ajax load failed wth error code '{{status}}' and response '{{response}}'";
		Utils.prototype.ERROR_UNSUPPORTED_STYLE = "NATION.Utils: This browser does not support the CSS property '{{property}}'";

		/**
  * Ensures data is in query string format
  * @ignore
  */
		Utils.prototype.prepareRequestData = function (data) {
			if (typeof data !== "string") {
				// If options.data wasn't a string, and isn't an object, throw an error
				if (data !== Object(data)) {
					throw new Error(this.ERROR_INVALID_DATA);
				}
				// Convert the object to a valid query string
				data = this.objectToQueryString(data);
			}
			return data;
		};

		/**
  * Load data via the script tag
  * @ignore
  */
		Utils.prototype.loadScript = function (options) {
			// Create script element used to load this URL
			var scriptTag = document.createElement("script");
			// If the id option was populated, apply it to the script tag
			if (options.id) {
				scriptTag.setAttribute("id", options.id);
			}
			// Create a new request ID for this script
			if (options.dataType === "jsonp") options.id = this.requestID = this.requestID + 1;
			// If a query string doesn't already exist, start one
			if (options.url.indexOf("?") < 0) options.url += "?";
			// If the ? isn't right at the end of the string, that means there is already a query string there
			// So an ampersand is needed to continue the chain
			if (options.url.indexOf("?") !== options.url.length - 1) options.url += "&";
			if (options.data) {
				// Make sure the passed data is a query string
				options.data = this.prepareRequestData(options.data);
				// Add the data to the url in query string format
				options.url += options.data;
				// Add an extra ampersand to prepare for the callback argument
				if (options.dataType === "jsonp") options.url += "&";
			}
			if (options.success && options.dataType !== "jsonp") {
				scriptTag.addEventListener("load", options.success);
			}
			// Add the callback name to the query string
			if (options.dataType === "jsonp") options.url += "callback=NATION.jsonpCallback" + options.id;

			// Create a callback if request is a JSONP request
			if (options.dataType === "jsonp") {
				// Create a dynamically named method to keep the callback reference unique
				NATION["jsonpCallback" + options.id] = function (response) {
					// Make sure the response was actually a JSON object, then parse it
					if (response[0] === "{") response = JSON.parse(response);
					// Call the success method, assuming one exists
					if (options.success) options.success(response);
					// Remove the original script tag from the DOM, since it's no longer required
					// This is only done as this is a JSONP load - normal script tags remain in place
					document.getElementsByTagName("body")[0].removeChild(scriptTag);
					// Delete the callback method, as it's no longer needed
					delete NATION["jsonpCallback" + options.id];
				};
			}
			// Set the script tag source with the final url
			scriptTag.setAttribute("src", options.url);
			// Add the completed tag to the page
			document.getElementsByTagName("body")[0].appendChild(scriptTag);
		};

		/**
  * Handle potential errors in XMLHttpRequest calls
  * @ignore
  */
		Utils.prototype.handleRequestError = function (request, options) {
			if (!request.status || request.status !== 200 && request.status !== 304) {
				if (options.error) {
					options.error(request.status, request.statusText);
				} else if (console && console.warn) {
					// Otherwise if console.warn is available, show the error information there
					console.warn(this.ERROR_REQUEST_FAILED.replace("{{status}}", request.status).replace("{{response}}", request.response));
				}
				return true;
			} else {
				return false;
			}
		};

		/**
  * Load data using XMLHttpRequest
  * @ignore
  */
		Utils.prototype.createRequest = function (options) {
			// Instantiate XMLHttpRequest object
			var request = new XMLHttpRequest();
			request.open(options.method, options.url, true);
			// Convert the passed data to a query string if required
			if (options.data) {
				options.data = this.prepareRequestData(options.data);
				// Set the content type header, since this request is sending data
				if (!options.contentType) options.contentType = "application/x-www-form-urlencoded; charset=UTF-8";
				request.setRequestHeader("Content-type", options.contentType);
			}
			var binaryRequested = options.dataType.indexOf(/text|arraybuffer|blob|document/i) > -1;
			var scope = this;
			// Handle request state changes
			if (request.upload) {
				// XMLHttpRequest level 2 supported
				if (binaryRequested) {
					// Set the response type of the request to a binary format if required
					request.responseType = options.dataType;
				}
				request.addEventListener("load", function (e) {
					// If the result was something other than a success, handle the error
					if (scope.handleRequestError(request, options)) {
						// Stop executing this method
						return;
					}
					var response = request.responseText;
					// Check the loaded data and handle it appropriately
					if (binaryRequested) {
						// Don't touch the response, since some form of binary data was requested
						response = request.response;
					} else if (options.dataType === "json" && response[0] === "{") {
						// Parse the response as json if required
						response = JSON.parse(response);
					}
					// Call the success method with the response
					if (options.success) options.success(response);
				});
				request.addEventListener("error", function (e) {
					// If the URL couldn't be loaded, handle the error
					scope.handleRequestError(request, options);
				});
				if (options.progress) {
					// If a progress callback was in options, listen for progress events
					request.addEventListener("progress", function (e) {
						// If a percentage can be calculated
						if (e.lengthComputable) {
							// call the progress callback with the updated load percentage
							options.progress(e.loaded / e.total);
						}
					});
				}
			} else {
				// XMLHttpRequest level 1 supported. This will be depreciated when IE9 support drops out.
				if (binaryRequested) {
					// Hack to pass byte data through unprocessed
					request.overrideMimeType('text/plain; charset=x-user-defined');
				}
				request.onreadystatechange = function () {
					// Do nothing if the request has not yet completed
					if (request.readyState !== 4) return;
					// If the result was something other than a success, handle the error
					if (scope.handleRequestError(request, options)) {
						// Stop executing this method
						return;
					}
					// Parse the response as json if required
					var response = request.responseText;
					if (options.dataType === "json" && response[0] === "{") response = JSON.parse(response);
					// Call the success method with the response
					if (options.success) options.success(response);
				};
			}
			// Send the request to the server
			request.send(options.data);
		};

		/**
  * Converts an object to a valid query string
  * @ignore
  */
		Utils.prototype.objectToQueryString = function (data) {
			// Loop through each value in the data object
			return Object.keys(data).map(function (key) {
				// This value was an array, so join those values together
				if (typeof data[key] === "Array") {
					data[key] = data[key].join("&");
				}
				// Return the new key/value as part of the string
				return encodeURIComponent(key) + "=" + encodeURIComponent(data[key]);
			}).join("&");
		};

		window.NATION.Utils = new Utils();
	}

	// requestAnimationFrame polyfill
	// Will be removed when IE9 support is dropped
	if (!window.requestAnimationFrame) {
		var lastTime = 0;
		window.requestAnimationFrame = function (callback, element) {
			var currentTime = Date.now();
			var timeToCall = Math.max(0, 16 - Math.abs(currentTime - lastTime));
			var id = window.setTimeout(function () {
				callback(currentTime + timeToCall);
			}, timeToCall);
			lastTime = currentTime + timeToCall;
			return id;
		};
	}
	if (!window.cancelAnimationFrame) {
		window.cancelAnimationFrame = function (id) {
			clearTimeout(id);
		};
	}
})(window, document, undefined);
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
////////////////////////////////////////////////////////////////////////////////

var Application = function () {

	//------------------------------------------------
	// Constructor
	//------------------------------------------------

	function Application() {
		_classCallCheck(this, Application);

		// Variables
		this.DOMElement = document.documentElement;
		this.siteBackground = null;
		// Initialisation
		this.prepareDOM();
		this.createSiteOptions();
		this.createBackground();
		this.createListeners();
	}

	//------------------------------------------------
	//
	//------------------------------------------------


	_createClass(Application, [{
		key: "createSiteOptions",
		value: function createSiteOptions() {
			this.siteOptions = new SiteOptions(this.DOMElement.querySelector(".options"));
		}

		//------------------------------------------------
		// Add a class to the main DOM element if the user
		// is using Firefox
		//------------------------------------------------

	}, {
		key: "prepareDOM",
		value: function prepareDOM() {
			if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
				this.DOMElement.className += " firefox";
			}
		}

		//------------------------------------------------
		// Create the background that contains the main horizontal
		// lines, and all of the shape systems (1 per section)
		//------------------------------------------------

	}, {
		key: "createBackground",
		value: function createBackground() {
			this.siteBackground = new SiteBackground(this.DOMElement.querySelector(".site-background"));
		}

		//------------------------------------------------
		// Listen for state changes in the application
		//------------------------------------------------

	}, {
		key: "createListeners",
		value: function createListeners() {
			var _this = this;

			// Debug modes
			this.siteOptions.addListener(Events.ENABLE_DEBUG_MODE, function (e) {
				return _this.enableDebugMode(e);
			});
			this.siteOptions.addListener(Events.DISABLE_DEBUG_MODE, function (e) {
				return _this.disableDebugMode(e);
			});
			this.siteOptions.addListener(Events.RANDOMISE_BACKGROUND_LINES, function (e) {
				return _this.randomiseBackgroundLines(e);
			});
			this.siteOptions.addListener(Events.RANDOMISE_SHAPES, function (e) {
				return _this.randomiseShapes(e);
			});
			this.siteOptions.addListener(Events.RANDOMISE_ALL, function (e) {
				return _this.randomiseAllShapes(e);
			});
			this.siteOptions.addListener(Events.SHOW_ONLY_CORNERS, function (e) {
				return _this.showOnlyCorners(e);
			});
			this.siteOptions.addListener(Events.SHOW_ONLY_ARCS, function (e) {
				return _this.showOnlyArcs(e);
			});
			this.siteOptions.addListener(Events.SHOW_ONLY_TRIANGLES, function (e) {
				return _this.showOnlyTriangles(e);
			});
			this.siteOptions.addListener(Events.SHOW_ONLY_LINES, function (e) {
				return _this.showOnlyLines(e);
			});
			this.siteOptions.addListener(Events.SHOW_ONLY_CIRCLES, function (e) {
				return _this.showOnlyCircles(e);
			});
			this.siteOptions.addListener(Events.SHOW_ALL_SHAPES, function (e) {
				return _this.showAllShapes(e);
			});
			this.siteOptions.addListener(Events.UPDATE_SHAPE_SPEEDS, function (e) {
				return _this.updateShapeSpeeds(e);
			});
			this.siteOptions.addListener(Events.SCALE_CHANGE_REQUESTED, function (e) {
				return _this.changeScale(e);
			});
		}
	}, {
		key: "changeScale",
		value: function changeScale(e) {
			this.siteBackground.overrideScale(this.siteOptions.requestedScale);
		}
	}, {
		key: "updateShapeSpeeds",
		value: function updateShapeSpeeds(e) {
			this.siteBackground.updateShapeSpeeds();
		}
	}, {
		key: "showOnlyCorners",
		value: function showOnlyCorners(e) {
			this.siteBackground.showOnlyCorners();
		}
	}, {
		key: "showOnlyArcs",
		value: function showOnlyArcs(e) {
			this.siteBackground.showOnlyArcs();
		}
	}, {
		key: "showOnlyTriangles",
		value: function showOnlyTriangles(e) {
			this.siteBackground.showOnlyTriangles();
		}
	}, {
		key: "showOnlyLines",
		value: function showOnlyLines(e) {
			this.siteBackground.showOnlyLines();
		}
	}, {
		key: "showOnlyCircles",
		value: function showOnlyCircles(e) {
			this.siteBackground.showOnlyCircles();
		}
	}, {
		key: "showAllShapes",
		value: function showAllShapes(e) {
			this.siteBackground.showAllShapes();
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "enableDebugMode",
		value: function enableDebugMode(e) {
			if (!this.debugEnabled) {
				this.debugEnabled = true;
				Mediator.publish(Events.ENABLE_DEBUG_MODE);
			}
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "disableDebugMode",
		value: function disableDebugMode(e) {
			if (this.debugEnabled) {
				this.debugEnabled = false;
				Mediator.publish(Events.DISABLE_DEBUG_MODE);
			}
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "randomiseBackgroundLines",
		value: function randomiseBackgroundLines(e) {
			this.siteBackground.randomiseBackgroundLines();
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "randomiseShapes",
		value: function randomiseShapes(e) {
			this.siteBackground.randomiseShapes();
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "randomiseAllShapes",
		value: function randomiseAllShapes(e) {
			this.siteBackground.randomiseAll();
		}
	}]);

	return Application;
}();

window.onload = function () {
	// Yeah it's a global, come at me
	window.Settings = new SiteSettings();
	window.Mediator = new SiteMediator();
	var app = new Application();
};
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
//
////////////////////////////////////////////////////////////////////////////////

var SiteMediator = function () {

	//------------------------------------------------
	// Constructor
	//------------------------------------------------

	function SiteMediator() {
		_classCallCheck(this, SiteMediator);

		// Variables
		this.channels = {};
	}

	//------------------------------------------------
	// Add a new listener to a global event
	//------------------------------------------------


	_createClass(SiteMediator, [{
		key: "subscribe",
		value: function subscribe(eventName, callback) {
			if (!this.channels[eventName]) this.channels[eventName] = [];
			this.channels[eventName].push({ callback: callback });
			return this;
		}

		//------------------------------------------------
		// Notify all listeners of the new event
		//------------------------------------------------

	}, {
		key: "publish",
		value: function publish(eventName, data) {
			if (!this.channels[eventName]) return false;
			var i = 0,
			    length = this.channels[eventName].length,
			    subscription = void 0;
			for (; i < length; i++) {
				subscription = this.channels[eventName][i];
				subscription.callback(data);
			}
		}
	}]);

	return SiteMediator;
}();
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
// Main Site Background Lines
////////////////////////////////////////////////////////////////////////////////

var BackgroundLines = function () {

	//------------------------------------------------
	// Constructor
	//------------------------------------------------

	function BackgroundLines(DOMElement, totalSections, strokeWidth) {
		_classCallCheck(this, BackgroundLines);

		// Variables
		this.DOMElement = DOMElement;
		this.totalSections = totalSections;
		this.currentScale = 1;
		this.lineData = [];
		this.lineStyles = ["straight", "curve"];
		this.lineElements = [];
		this.strokeWidth = strokeWidth;
		this.totalLines = 5;
		this.pathStrings = [];
		this.collisionPoints = [];
		this.lineSegments = [];
		this.collisionGuide = null;
		this.COLOR = "#00eac4";
		this.MIN_LINE_WIDTH = 400;
		this.guideLines = [];
		this.guideCircles = [];
		this.fadedLines = 0;
		this.collisionLineVisible = false;
		this.createLineElement();
		this.decideLineTypes();
		this.createCollisionGuide();
		this.draw();
		this.createListeners();
	}

	//------------------------------------------------
	//
	//------------------------------------------------


	_createClass(BackgroundLines, [{
		key: "randomise",
		value: function randomise() {
			// First remove old elements
			if (this.collisionLineVisible) {
				//this.DOMElement.removeChild(this.collisionGuide);
				//this.hideCollisionModel();
			} else {}
			// Then create new elements
			this.decideLineTypes();
			//this.createCollisionGuide();
			this.draw();
		}

		//------------------------------------------------
		// Listen for requests for the debug menu
		//------------------------------------------------

	}, {
		key: "createListeners",
		value: function createListeners() {
			var _this = this;

			Mediator.subscribe(Events.ENABLE_DEBUG_MODE, function (data) {
				return _this.showCollisionModel(data);
			});
			Mediator.subscribe(Events.DISABLE_DEBUG_MODE, function (data) {
				return _this.hideCollisionModel(data);
			});
		}

		//------------------------------------------------
		// Start rendering the collision model
		//------------------------------------------------

	}, {
		key: "showCollisionModel",
		value: function showCollisionModel(data) {
			this.collisionLineVisible = true;
			this.DOMElement.appendChild(this.collisionGuide);
			for (var i = 0, length = this.lineElements.length; i < length; i++) {
				this.lineElements[i].setAttribute("stroke-opacity", 0);
			}
		}

		//------------------------------------------------
		// Stop rendering the collision model
		//------------------------------------------------

	}, {
		key: "hideCollisionModel",
		value: function hideCollisionModel(data) {
			this.collisionLineVisible = false;
			this.DOMElement.removeChild(this.collisionGuide);
			for (var i = 0, length = this.lineElements.length; i < length; i++) {
				this.lineElements[i].setAttribute("stroke-opacity", 1);
			}
		}

		//------------------------------------------------
		// Returns the collision data for the full background shape
		//------------------------------------------------

	}, {
		key: "getLineSegments",
		value: function getLineSegments() {
			return this.lineSegments;
		}

		//------------------------------------------------
		// Element that will show the collision data when required
		//------------------------------------------------

	}, {
		key: "createCollisionGuide",
		value: function createCollisionGuide() {
			this.collisionGuide = document.createElementNS("http://www.w3.org/2000/svg", "path");
			this.collisionGuide.setAttribute("fill", "transparent");
			this.collisionGuide.setAttribute("stroke", "#000");
			this.collisionGuide.setAttribute("stroke-width", 2);
		}

		//------------------------------------------------
		// This creates the element required for each of
		// the 5 lines, used in the draw() method
		//------------------------------------------------

	}, {
		key: "createLineElement",
		value: function createLineElement() {
			var lineElement = null;
			for (var i = 0; i < this.totalLines; i++) {
				lineElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
				lineElement.setAttribute("fill", "transparent");
				lineElement.setAttribute("stroke", this.COLOR);
				lineElement.setAttribute("stroke-width", this.strokeWidth);

				this.DOMElement.appendChild(lineElement);
				this.lineElements.push(lineElement);
			}
		}

		//------------------------------------------------
		// This decides the types of line sections across
		// the whole site, but doesn't actually draw them
		// Use the draw() method for that
		//------------------------------------------------

	}, {
		key: "decideLineTypes",
		value: function decideLineTypes() {
			this.calculateWidthOptions();
			this.calculateYPosOptions();
			var availableWidth = window.innerWidth;
			this.lineData = [];
			this.targetWidth = availableWidth * this.totalSections;
			var currentWidth = 0,
			    line = {};
			var consecutiveStraights = 0;
			while (currentWidth < this.targetWidth) {
				line = {};
				var previousLine = this.lineData[this.lineData.length - 1];
				// Decide on line properties
				line.type = this.lineStyles[Math.round(Math.random() * (this.lineStyles.length - 1))];
				if (line.type === "curve") {
					// Curves should only follow straight lines or other curves
					if (previousLine && previousLine.type !== "curve" && consecutiveStraights <= 0) {
						line.type = "straight";
					}
				}
				line.widthOption = Math.round(Math.random() * (this.widthOptions.length - 1));
				line.width = this.widthOptions[line.widthOption];
				if (line.type === "curve" && line.width === availableWidth / 3) {
					line.widthOption = 0;
					line.width = availableWidth / 2;
				}

				line.x1 = this.lineData.length === 0 ? 0 : this.lineData[this.lineData.length - 1].x2;
				line.x2 = this.lineData.length === 0 ? line.width : line.x1 + line.width;
				line.y1Option = this.lineData.length === 0 ? Math.round(Math.random() * (this.yPositions.length - 1)) : this.lineData[this.lineData.length - 1].y2Option;
				line.y1 = this.yPositions[line.y1Option];
				if (previousLine && previousLine.type === "curve" && line.type === "straight") {
					// A straight must follow a curve, not a line at an angle
					line.y2Option = line.y1Option;
					line.y2 = this.yPositions[line.y2Option];
				} else if (consecutiveStraights >= 2) {
					// We need to force a different Y position, to prevent a constant straight line
					// First, build an array with positions other than the last one
					var differentYPositions = [];
					for (var i = 0; i < this.yPositions.length; i++) {
						if (this.yPositions[i] !== line.y1) {
							differentYPositions.push(this.yPositions[i]);
						}
					}
					// Then choose one from that new array
					line.y2Option = Math.round(Math.random() * (differentYPositions.length - 1));
					line.y2 = differentYPositions[line.y2Option];
					// Reset the straight count
					consecutiveStraights = 0;
				} else {
					line.y2Option = Math.round(Math.random() * (this.yPositions.length - 1));
					line.y2 = this.yPositions[line.y2Option];
				}
				if (line.type === "straight" && line.y1 === line.y2) {
					consecutiveStraights++;
				} else {
					consecutiveStraights = 0;
				}

				if (line.type === "curve" && line.y1 === line.y2) {
					var _differentYPositions = [];
					for (var _i = 0; _i < this.yPositions.length; _i++) {
						if (this.yPositions[_i] !== line.y1) {
							_differentYPositions.push(this.yPositions[_i]);
						}
					}
					// Then choose one from that new array
					line.y2 = _differentYPositions[Math.round(Math.random() * (_differentYPositions.length - 1))];
					// Figure out which option ID that is
					for (var _i2 = 0; _i2 < this.yPositions.length; _i2++) {
						if (this.yPositions[_i2] === line.y2) {
							line.y2Option = _i2;
						}
					}
				}
				// Add this line to the array and update the currently used width
				this.lineData.push(line);
				currentWidth += line.width;
			}
		}

		//------------------------------------------------
		// Updates the possible y co-ordinates for line
		// points based on the current browser height
		//------------------------------------------------

	}, {
		key: "calculateYPosOptions",
		value: function calculateYPosOptions() {
			this.yPositions = [];
			// Work out y pos options based on current browser dimensions
			var windowHeight = window.innerHeight;
			this.yPositions.push(windowHeight);
			this.yPositions.push(windowHeight * 0.75);
			this.yPositions.push(windowHeight * 0.5);
		}

		//------------------------------------------------
		// Just creates an array of possible widths for lines
		// Note that it's expected that window.innerWidth/2
		// should be the first option, as curves default to
		// that one if the randomly chosen width was less than that
		//------------------------------------------------

	}, {
		key: "calculateWidthOptions",
		value: function calculateWidthOptions() {
			var availableWidth = window.innerWidth;
			this.widthOptions = [availableWidth / 2, availableWidth / 3, availableWidth / 1.5];
		}

		//------------------------------------------------
		// Updates the line widths and y positions respective
		// to the current browser dimensions. Should be run
		// whenever the browser is resized, and the lines
		// should be redrawn afterwards
		//------------------------------------------------

	}, {
		key: "calculateLineCoordinates",
		value: function calculateLineCoordinates() {
			this.calculateWidthOptions();
			this.calculateYPosOptions();
			for (var i = 0, length = this.lineData.length; i < length; i++) {
				var line = this.lineData[i];
				line.width = this.widthOptions[line.widthOption];
				var lineWidth = line.width < this.MIN_LINE_WIDTH ? window.innerWidth : line.width;
				line.x1 = i === 0 ? 0 : this.lineData[i - 1].x2;
				line.x2 = i === 0 ? lineWidth : line.x1 + lineWidth;

				line.y1 = this.yPositions[line.y1Option];
				line.y2 = this.yPositions[line.y2Option];
			}
		}

		//------------------------------------------------
		// Works out where two lines overlap, or returns
		// false if they don't (or are parallel)
		// Formula taken from here: https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection#Given_two_points_on_each_line
		//------------------------------------------------

	}, {
		key: "getLineOverlap",
		value: function getLineOverlap(line1, line2) {
			var denominator = (line1.x1 - line1.x2) * (line2.y1 - line2.y2) - (line1.y1 - line1.y2) * (line2.x1 - line2.x2);
			var slope1 = (line1.y2 - line1.y1) / (line1.x2 - line1.x1);
			var slope2 = (line2.y2 - line2.y1) / (line2.x2 - line2.x1);

			// If the deniminator is zero, of the slopes are the same, we've got parallel lines
			if (denominator === 0 || slope1.toFixed(5) === slope2.toFixed(5)) {
				return false;
			}

			var bezierY = line1.y1 - line2.y1;
			var bezierX = line1.x1 - line2.x1;

			// How to find the actual co-ordinates where the contact took place (screen-relative)
			var numeratorX = (line1.x1 * line1.y2 - line1.y1 * line1.x2) * (line2.x1 - line2.x2) - (line1.x1 - line1.x2) * (line2.x1 * line2.y2 - line2.y1 * line2.x2);
			var numeratorY = (line1.x1 * line1.y2 - line1.y1 * line1.x2) * (line2.y1 - line2.y2) - (line1.y1 - line1.y2) * (line2.x1 * line2.y2 - line2.y1 * line2.x2);
			var numeratorLine2 = (line2.x2 - line2.x1) * bezierY - (line2.y2 - line2.y1) * bezierX;
			var numeratorLine1 = (line1.x2 - line1.x1) * bezierY - (line1.y2 - line1.y1) * bezierX;
			var bezierLine2 = numeratorLine2 / denominator;
			var bezierLine1 = numeratorLine1 / denominator;

			var pointX = numeratorX / denominator;
			var pointY = numeratorY / denominator;

			if (bezierLine2 > 0 && bezierLine2 < 1 && bezierLine1 > 0 && bezierLine1 < 1) {
				return {
					x: pointX,
					y: pointY
				};
			} else {
				return false;
			}
		}

		//------------------------------------------------
		// Takes two points, and works out the y co-ordinate
		// on the line between them, given an x co-ordinate
		//------------------------------------------------

	}, {
		key: "getPointAtXpos",
		value: function getPointAtXpos(point1, point2, xPos) {
			var slope = (point2.y - point1.y) / (point2.x - point1.x);
			var yPos = point1.y + (xPos - point1.x) * slope;
			return {
				x: xPos,
				y: yPos
			};
		}

		//------------------------------------------------
		// Draws a line parallel to the passed lineData.
		// The new line will be a distance away from the
		// existing line by 'offset' pixels. The new line
		// can also be made longer by specifying an addedWidth.
		// This added width will be split into two and added
		// onto each end of the new line.
		// Example here: http://stackoverflow.com/questions/2825412/draw-a-parallel-line
		//------------------------------------------------

	}, {
		key: "getParallelLine",
		value: function getParallelLine(lineData, offset, addedWidth, color, thickness) {
			// Store start and end points in objects to pass to the getPointAtXPos function
			var point1 = {
				x: lineData.x1,
				y: lineData.y1
			};
			var point2 = {
				x: lineData.x2,
				y: lineData.y2
			};

			// Bump the desired x co-ordinates on the line
			var extendedX1 = !addedWidth || addedWidth === 0 ? lineData.x1 : lineData.x1 - addedWidth / 2;
			var extendedX2 = !addedWidth || addedWidth === 0 ? lineData.x2 : lineData.x2 + addedWidth / 2;
			// Get the y position required for the given X position
			var extendedPos1 = this.getPointAtXpos(point1, point2, extendedX1);
			var extendedPos2 = this.getPointAtXpos(point1, point2, extendedX2);

			var extendedPos = {
				x1: extendedPos1.x,
				y1: extendedPos1.y,
				x2: extendedPos2.x,
				y2: extendedPos2.y
			};

			var gap = offset ? offset : 0;

			var denominator = Math.sqrt((extendedPos.x1 - extendedPos.x2) * (extendedPos.x1 - extendedPos.x2) + (extendedPos.y1 - extendedPos.y2) * (extendedPos.y1 - extendedPos.y2));

			var line1X1 = extendedPos.x1 - gap * (extendedPos.y2 - extendedPos.y1) / denominator;
			var line1X2 = extendedPos.x2 - gap * (extendedPos.y2 - extendedPos.y1) / denominator;
			var line1Y1 = extendedPos.y1 - gap * (extendedPos.x1 - extendedPos.x2) / denominator;
			var line1Y2 = extendedPos.y2 - gap * (extendedPos.x1 - extendedPos.x2) / denominator;

			if (color) {
				this.createGuideLine(line1X1, line1Y1, line1X2, line1Y2, color, 2);
			}

			return {
				x1: line1X1,
				y1: line1Y1,
				x2: line1X2,
				y2: line1Y2
			};
		}

		//------------------------------------------------
		// This extends out a line beyond it's original
		// start and end points, but maintains the same angle
		// and position. We need to do this to ensure that
		// the two lines overlap, to work out where a line
		// should end
		//------------------------------------------------

	}, {
		key: "getExtendedLine",
		value: function getExtendedLine(lineData, lineNumber, addedWidth, color) {
			var offset = lineNumber * (this.strokeWidth * 2);
			return this.getParallelLine(lineData, offset, addedWidth, color);
		}

		//------------------------------------------------
		// Figures out the collision mode via the top line
		//------------------------------------------------

	}, {
		key: "getBoundingLine",
		value: function getBoundingLine(lineData, color, thickness) {
			// We just need to take the top line, and move it up by half of the stroke width
			// So the offet will just be minus that
			var offset = -this.strokeWidth / 2;
			return this.getParallelLine(lineData, offset, 100, color, thickness);
		}

		//------------------------------------------------
		// Uses the data established in decideLineTypes()
		// to draw the lines required
		//------------------------------------------------

	}, {
		key: "draw",
		value: function draw() {
			// Before doing anything, we need to re-calculate each line's co-ordinates
			this.calculateLineCoordinates();
			var lineData = null;
			var pathStrings = [];
			var lastXPos = [0, 0, 0, 0, 0];
			var lastYPos = [0, 0, 0, 0, 0];
			var lastExtendedLines = [];
			var firstExtendedLine = null;
			var parallel = false;
			this.collisionPoints = [];
			this.lineSegments = [];
			var previousPoint = {};
			var lastEndX = 0,
			    lastEndY = 0;
			var startX = 0,
			    startY = 0,
			    endX = 0,
			    endY = 0;

			for (var i = 0, length = this.lineData.length; i < length; i++) {
				parallel = false;
				// Calculate where the two lines meet
				// This result is the X2/Y2 for the current line
				lineData = this.lineData[i];
				var xPos = 0,
				    yPos = 0;
				var lineOffset = this.strokeWidth;
				var secondCP = 0;
				var firstCP = 0;
				var firstYPos = 0;
				var chosenPointX = 0,
				    chosenPointY = 0,
				    chosenPointX2 = 0,
				    chosenPointY2 = 0;

				for (var k = 0; k < this.totalLines; k++) {
					var line1 = this.getExtendedLine(lineData, k, 400);
					if (i === 0) {
						// Start the line by moving to the correct position
						lastXPos[k] = line1.x1;
						lastYPos[k] = line1.y1;
						if (!this.pathStrings[k]) {
							this.pathStrings.push("M " + line1.x1 + " " + line1.y1);
						} else {
							this.pathStrings[k] = "M " + line1.x1 + " " + line1.y1;
						}
					}
					var line2 = null;
					var secondLineData = this.lineData[i + 1];
					// Second line
					if (secondLineData) {
						line2 = this.getExtendedLine(secondLineData, k, 400);
					}

					// Find the overlap between the two lines if there is a next line
					if (secondLineData) {
						var overlap = this.getLineOverlap(line1, line2);
						if (!overlap) {
							// Lines were parallel
							parallel = true;
							xPos = line1.x2 - (line1.x2 - line2.x1) / 2;
							yPos = this.getPointAtXpos({ x: line2.x1, y: line2.y1 }, { x: line2.x2, y: line2.y2 }, xPos).y;
						} else {
							// Use the overlap point as the x2/y2
							xPos = overlap.x === 0 ? line2.x1 + (line2.x1 - line1.x2) / 2 : overlap.x;
							yPos = overlap.y === 0 ? line1.y2 : overlap.y;
						}
					} else {
						// We're on the last line, so just use the points defined by the line 1 guide
						xPos = line1.x2;
						yPos = line1.y2;
					}

					var extendedLine = this.getExtendedLine(lineData, k, 0);

					if (lineData.type === "straight") {
						this.pathStrings[k] += " L " + xPos + " " + yPos;
					} else if (lineData.type === "curve") {
						var firstLine = lastExtendedLines[k] ? lastExtendedLines[k] : extendedLine;
						var secondLine = secondLineData ? this.getExtendedLine(secondLineData, k, 0) : extendedLine;

						var tempPoint = this.getPointAtXpos({ x: firstLine.x1, y: firstLine.y1 }, { x: firstLine.x2, y: firstLine.y2 }, extendedLine.x1 + (extendedLine.x2 - extendedLine.x1) / 3);
						var tempPoint2 = this.getPointAtXpos({ x: secondLine.x1, y: secondLine.y1 }, { x: secondLine.x2, y: secondLine.y2 }, extendedLine.x2 - (extendedLine.x2 - extendedLine.x1) / 3);

						if (k === 0) {
							firstCP = tempPoint.y;
							secondCP = tempPoint2.y;
							firstYPos = yPos;
							if (secondLineData && lineData.type === "curve" && secondLineData.type === "curve") {
								secondCP = yPos;
							} else if (lineData.type === "curve" && !secondLineData) {
								secondCP = yPos;
							}
							if (this.lineData[i - 1] && lineData.type === "curve" && this.lineData[i - 1].type === "curve") {
								firstCP = lastYPos[0];
							}
						}

						chosenPointX = tempPoint.x;
						chosenPointX2 = tempPoint2.x;
						chosenPointY = 0;
						chosenPointY2 = 0;
						var newY = firstCP + this.strokeWidth * 2 * k;
						chosenPointY = newY;
						if (k === 0) this.pathStrings[k] += " C " + tempPoint.x + " " + chosenPointY;

						var newY2 = secondCP + this.strokeWidth * 2 * k;

						if (secondLineData && secondLineData.type === "curve" && lineData.type === "curve") {
							yPos = newY2;
						} else if (this.lineData[i].type === "curve") {
							newY2 = yPos;
						}

						chosenPointY2 = newY2;
						if (k === 0) this.pathStrings[k] += " " + tempPoint2.x + " " + chosenPointY2 + " " + xPos + " " + yPos;

						// It is mathematically impossible to create a bezier curve parallel to another,
						// so here we split the curves up into straight line segments, and then create
						// parallel lines of those. While this is a bit intense, it is only run once during
						// page load, and during resizes, so it should be ok.
						var point1 = {
							x: lastXPos[k],
							y: lastYPos[k]
						};
						var point2 = {
							x: xPos,
							y: yPos
						};
						var cp1 = {
							x: chosenPointX,
							y: chosenPointY
						};
						var cp2 = {
							x: chosenPointX2,
							y: chosenPointY2
						};

						var newPoint = 0;
						var totalPoints = 30; // Number of additional points along the curve (between start pos and end pos, not including them)
						for (var j = 1; j < totalPoints; j++) {
							var percentage = 1 / (totalPoints + 1) * j;
							newPoint = this.getPointOnBezierCurve(point1, cp1, cp2, point2, percentage);
							if (newPoint.x > xPos) {
								break;
							}
							if (k > 0) {
								this.pathStrings[k] += " L " + newPoint.x + " " + newPoint.y;
							}
							previousPoint = newPoint;
						}
						// End pos of the line
						if (k > 0) {
							this.pathStrings[k] += " L " + xPos + " " + yPos;
						}

						//this.createGuideCircle(chosenPointX, chosenPointY, "#0000FF");
						//this.createGuideCircle(chosenPointX2, chosenPointY2, "#0000FF");
					}
					//this.createGuideCircle(xPos, yPos, "#000");
					//this.createGuideCircle(lastXPos[k], lastYPos[k], "#000");

					// Add new points to the collision point array, but only for the top line (hence k=0)
					// We're doing this here because we need the control point positions for curves, which
					// are decided above
					if (k === 0) {

						var firstBoundingLine = this.getBoundingLine(lineData);
						if (i === 0) {
							startX = firstBoundingLine.x1;
							startY = firstBoundingLine.y1;
							this.collisionPoints.push({
								x: startX,
								y: startY
							});
							// Store 'previous point' as the first point here
							previousPoint = this.collisionPoints[0];
						} else {
							startX = lastEndX;
							startY = lastEndY;
						}

						if (secondLineData) {
							var secondBoundingLine = this.getBoundingLine(secondLineData);
							var _overlap = this.getLineOverlap(firstBoundingLine, secondBoundingLine);
							if (!_overlap) {
								// This means the lines were parallel
								var _newPoint = this.getPointAtXpos({ x: secondBoundingLine.x1, y: secondBoundingLine.y1 }, { x: secondBoundingLine.x2, y: secondBoundingLine.y2 }, firstBoundingLine.x2 - (firstBoundingLine.x2 - secondBoundingLine.x1) / 2);
								endX = _newPoint.x;
								endY = _newPoint.y;
							} else {
								endX = _overlap.x === 0 ? secondBoundingLine.x1 + (secondBoundingLine.x1 - firstBoundingLine.x2) / 2 : _overlap.x;
								endY = _overlap.y === 0 ? firstBoundingLine.y2 : _overlap.y;
							}
						} else {
							endX = firstBoundingLine.x2;
							endY = firstBoundingLine.y2;
						}
						lastEndX = endX;
						lastEndY = endY;

						if (lineData.type === "straight") {
							// Straights
							this.collisionPoints.push({
								x: endX,
								y: endY
							});
							this.lineSegments.push({
								x1: startX,
								y1: startY,
								x2: endX,
								y2: endY
							});
							previousPoint = {
								x: endX,
								y: endY
							};
						} else {
							// Curves
							// Work out some points along the line
							// We actually use the points that are in the center of the top line here
							// as these have already been calculated above. To nudge the bounding lines
							// to the top of the green line, we just subtract (this.strokeWidth/2) from
							// the resulting y co-ordinates
							var _point = {
								x: lastXPos[0],
								y: lastYPos[0]
							};
							var _point2 = {
								x: xPos,
								y: yPos
							};
							var _cp = {
								x: chosenPointX,
								y: chosenPointY
							};
							var _cp2 = {
								x: chosenPointX2,
								y: chosenPointY2
							};

							var _newPoint2 = 0;

							var _totalPoints = 9; // Number of additional points along the curve (between start pos and end pos, not including them)
							for (var _j = 1; _j < _totalPoints; _j++) {
								var _percentage = 1 / (_totalPoints + 1) * _j;
								_newPoint2 = this.getPointOnBezierCurve(_point, _cp, _cp2, _point2, _percentage);
								// Subtract half the stroke width here, to nudge the bounding line up to the top
								// of the green line, rather than in the middle
								_newPoint2.y -= this.strokeWidth / 2;
								this.collisionPoints.push(_newPoint2);
								this.lineSegments.push({
									x1: previousPoint.x,
									y1: previousPoint.y,
									x2: _newPoint2.x,
									y2: _newPoint2.y
								});
								previousPoint = _newPoint2;
							}
							// Add the last point
							this.collisionPoints.push({
								x: endX,
								y: endY
							});
							this.lineSegments.push({
								x1: previousPoint.x,
								y1: previousPoint.y,
								x2: endX,
								y2: endY
							});
						}
					}
					// End of collision point calculations
					lastXPos[k] = xPos;
					lastYPos[k] = yPos;
					lastExtendedLines[k] = extendedLine;
				}
			}
			for (var _i3 = 0, _length = this.totalLines; _i3 < _length; _i3++) {
				this.lineElements[_i3].setAttribute("d", this.pathStrings[_i3]);
			}

			this.drawCollisionBoundary();
		}

		//------------------------------------------------
		// Returns a point a percentage distance along a bezier curve
		// Helpfully explained further here:
		// http://stackoverflow.com/questions/14174252/how-to-find-out-y-coordinate-of-specific-point-in-bezier-curve-in-canvas
		//------------------------------------------------

	}, {
		key: "getPointOnBezierCurve",
		value: function getPointOnBezierCurve(point1, cp1, cp2, point2, percentage) {
			// Work out the points on the triangle sitting within all 4 points
			// This also factors in the percentage for P1 and P3, as these points
			// need to be a percentage along the lines connecting point1 and cp1,
			// and cp2 and point2
			var p1X = (1 - percentage) * point1.x + percentage * cp1.x;
			var p1Y = (1 - percentage) * point1.y + percentage * cp1.y;
			var p2X = (1 - percentage) * cp1.x + percentage * cp2.x;
			var p2Y = (1 - percentage) * cp1.y + percentage * cp2.y;
			var p3X = (1 - percentage) * cp2.x + percentage * point2.x;
			var p3Y = (1 - percentage) * cp2.y + percentage * point2.y;
			// Now we find the points a percentage along the newly found lines
			// This is to figure out the point on the curve we need, as the curve
			// will intersect this new line at some point
			var lineX1 = (1 - percentage) * p1X + percentage * p2X;
			var lineY1 = (1 - percentage) * p1Y + percentage * p2Y;
			var lineX2 = (1 - percentage) * p2X + percentage * p3X;
			var lineY2 = (1 - percentage) * p2Y + percentage * p3Y;
			// Now with that line figured out we can calculate where it hits the curve
			return {
				x: (1 - percentage) * lineX1 + percentage * lineX2,
				y: (1 - percentage) * lineY1 + percentage * lineY2
			};
		}

		//------------------------------------------------
		// Draws the collision model segments
		// This will only be rendered if debug mode is active
		//------------------------------------------------

	}, {
		key: "drawCollisionBoundary",
		value: function drawCollisionBoundary() {
			var path = "";
			for (var i = 0, length = this.collisionPoints.length; i < length; i++) {
				if (i === 0) {
					path = "M " + this.collisionPoints[i].x + " " + this.collisionPoints[i].y;
				} else {
					path += " L " + this.collisionPoints[i].x + " " + this.collisionPoints[i].y;
				}
			}
			this.collisionGuide.setAttribute("d", path);
		}

		//------------------------------------------------
		// Guides used for development to show curve control
		// points, among other things
		//------------------------------------------------

	}, {
		key: "createGuideCircle",
		value: function createGuideCircle(x, y, color) {
			var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
			circle.setAttribute("fill", color);
			circle.setAttribute("cx", x);
			circle.setAttribute("cy", y);
			circle.setAttribute("r", 10);
			this.guideCircles.push(circle);
			//this.DOMElement.appendChild(circle);
		}

		//------------------------------------------------
		// Shows where actual lines were drawn at 2px width
		//------------------------------------------------

	}, {
		key: "createGuideLine",
		value: function createGuideLine(x1, y1, x2, y2, color, thickness) {
			// Create a test line
			if (!thickness) thickness = 2;
			var testLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
			testLine.setAttribute("stroke-width", thickness);
			testLine.setAttribute("fill", "transparent");
			testLine.setAttribute("stroke", color);
			testLine.setAttribute("x1", x1);
			testLine.setAttribute("x2", x2);
			testLine.setAttribute("y1", y1);
			testLine.setAttribute("y2", y2);
			this.guideLines.push(testLine);
			//this.DOMElement.appendChild(testLine);
		}

		//------------------------------------------------
		// Resize with new dimensions and line thickness
		//------------------------------------------------

	}, {
		key: "resize",
		value: function resize(strokeWidth, scale) {
			this.strokeWidth = strokeWidth;
			for (var i = 0, length = this.totalLines; i < length; i++) {
				this.lineElements[i].setAttribute("stroke-width", this.strokeWidth);
			}
			this.draw();
		}
	}]);

	return BackgroundLines;
}();
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
// Standard EventDispatcher
////////////////////////////////////////////////////////////////////////////////

var EventDispatcher = function () {

	//------------------------------------------------
	// Constructor
	//------------------------------------------------

	function EventDispatcher() {
		_classCallCheck(this, EventDispatcher);

		this.eventHandlers = [];
	}

	//------------------------------------------------
	// Add a listener to this class (or, rather, it's
	// subclass), for a passed event, and run a passed
	// callback when it's heard
	//------------------------------------------------


	_createClass(EventDispatcher, [{
		key: "addListener",
		value: function addListener(type, handler) {
			if (typeof this.eventHandlers[type] === "undefined") {
				this.eventHandlers[type] = [];
			}
			this.eventHandlers[type].push(handler);
		}

		//------------------------------------------------
		// Remove an existing listener from this class
		//------------------------------------------------

	}, {
		key: "removeListener",
		value: function removeListener(type, handler) {
			if (this.eventHandlers[type] instanceof Array) {
				var handlers = this.eventHandlers[type];
				// Remove all handlers for this type
				if (!handler) {
					this.eventHandlers[type] = [];
					return;
				}
				// Remove a specific handler
				for (var i = 0, length = handlers.length; i < length; i++) {
					if (String(handlers[i]) === String(handler)) {
						handlers.splice(i, 1);
					}
				}
			}
		}

		//------------------------------------------------
		// Fire an event of the passed type, from this class
		//------------------------------------------------

	}, {
		key: "trigger",
		value: function trigger(type) {
			var i = 0,
			    length = void 0,
			    listeners = void 0,
			    listener = void 0,
			    event = void 0,
			    args = Array.prototype.slice.call(arguments).splice(2);
			if (typeof type === "string") {
				event = { type: type };
			} else {
				event = type;
			}
			if (!event) {
				throw new Error("Type is undefined");
			}
			if (!event.target) {
				event.target = this;
			}
			if (!event.type) {
				throw new Error("Object missing 'type' property");
			}
			if (this.eventHandlers[event.type] instanceof Array) {
				listeners = this.eventHandlers[event.type];
				length = listeners.length;
				args.unshift(event);
				for (; i < length; i++) {
					listener = listeners[i];
					if (listener) {
						listener.apply(this, args);
					}
				}
			}
		}
	}]);

	return EventDispatcher;
}();
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
// Website Events
////////////////////////////////////////////////////////////////////////////////

var Events = function () {

	//------------------------------------------------
	// Constructor
	//------------------------------------------------

	function Events() {
		_classCallCheck(this, Events);
	}

	//------------------------------------------------
	// Event names
	//------------------------------------------------


	_createClass(Events, null, [{
		key: "ENABLE_DEBUG_MODE",
		get: function get() {
			return "EnableDebugMode";
		}
	}, {
		key: "DISABLE_DEBUG_MODE",
		get: function get() {
			return "DisableDebugMode";
		}
	}, {
		key: "ENABLE_FLIGHT_CONTROL",
		get: function get() {
			return "EnableFlightControl";
		}
	}, {
		key: "DISABLE_FLIGHT_CONTROL",
		get: function get() {
			return "DisableFlightControl";
		}
	}, {
		key: "RANDOMISE_SHAPES",
		get: function get() {
			return "RandomiseShapes";
		}
	}, {
		key: "RANDOMISE_BACKGROUND_LINES",
		get: function get() {
			return "RandomiseBackgroundLines";
		}
	}, {
		key: "RANDOMISE_ALL",
		get: function get() {
			return "RandomiseAll";
		}
	}, {
		key: "SHOW_ONLY_ARCS",
		get: function get() {
			return "ShowOnlyArcs";
		}
	}, {
		key: "SHOW_ONLY_CORNERS",
		get: function get() {
			return "ShowOnlyCorners";
		}
	}, {
		key: "SHOW_ONLY_TRIANGLES",
		get: function get() {
			return "ShowOnlyTriangles";
		}
	}, {
		key: "SHOW_ONLY_LINES",
		get: function get() {
			return "ShowOnlyLines";
		}
	}, {
		key: "SHOW_ONLY_CIRCLES",
		get: function get() {
			return "ShowOnlyCircles";
		}
	}, {
		key: "SHOW_ALL_SHAPES",
		get: function get() {
			return "ShowAllShapes";
		}
	}, {
		key: "UPDATE_SHAPE_SPEEDS",
		get: function get() {
			return "UpdateShapeSpeeds";
		}
	}, {
		key: "SCALE_CHANGE_REQUESTED",
		get: function get() {
			return "ScaleChangeRequested";
		}
	}]);

	return Events;
}();
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
// Shape Physics
////////////////////////////////////////////////////////////////////////////////

var ShapeSystem = function (_EventDispatcher) {
	_inherits(ShapeSystem, _EventDispatcher);

	//------------------------------------------------
	// Constructor
	//------------------------------------------------

	function ShapeSystem(DOMElement, backgroundLines, stage, strokeWidth, scale) {
		_classCallCheck(this, ShapeSystem);

		// Variables

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ShapeSystem).call(this));

		_this.DOMElement = DOMElement;
		_this.backgroundLines = backgroundLines;
		_this.stage = stage;
		_this.totalShapes = 0;
		_this.maxShapes = 5;
		_this.paused = true;
		_this.debugMode = false;
		_this.flightControlEnabled = false;
		_this.strokeWidth = strokeWidth;
		_this.scale = scale;
		_this.shapes = [];
		_this.flightControlShapes = [];
		_this.flightControlCopy = [];
		_this.fadedShapes = 0;
		_this.shapeOptions = [ArcShape, CircleShape, LineShape, LShape, TriangleShape];
		//this.shapeOptions = [LineShape];
		_this.createStartingShapes();
		_this.createListeners();
		_this.requestFrameID = requestAnimationFrame(function () {
			return _this.updateSimulation();
		});
		return _this;
	}

	//------------------------------------------------
	//
	//------------------------------------------------


	_createClass(ShapeSystem, [{
		key: "randomise",
		value: function randomise() {
			// Remove old shapes
			while (this.shapes.length > 0) {
				this.shapes[0].destroy(true);
				this.shapes.shift();
			}
			// Recreate shapes
			this.createStartingShapes();
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "updateSpeeds",
		value: function updateSpeeds() {
			// Remove old shapes
			var i = 0,
			    length = this.shapes.length;
			for (; i < length; i++) {
				this.shapes[i].selectSpeed();
			}
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "showArcs",
		value: function showArcs() {
			this.shapeOptions = [ArcShape];
			this.randomise();
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "showCircles",
		value: function showCircles() {
			this.shapeOptions = [CircleShape];
			this.randomise();
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "showLines",
		value: function showLines() {
			this.shapeOptions = [LineShape];
			this.randomise();
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "showCorners",
		value: function showCorners() {
			this.shapeOptions = [LShape];
			this.randomise();
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "showTriangles",
		value: function showTriangles() {
			this.shapeOptions = [TriangleShape];
			this.randomise();
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "showAllShapes",
		value: function showAllShapes() {
			this.shapeOptions = [ArcShape, CircleShape, LineShape, LShape, TriangleShape];
			this.randomise();
		}

		//------------------------------------------------
		// Listen to debug mode requests
		//------------------------------------------------

	}, {
		key: "createListeners",
		value: function createListeners() {
			var _this2 = this;

			Mediator.subscribe(Events.ENABLE_DEBUG_MODE, function (data) {
				return _this2.enableDebugMode(data);
			});
			Mediator.subscribe(Events.DISABLE_DEBUG_MODE, function (data) {
				return _this2.disableDebugMode(data);
			});
			Mediator.subscribe(Events.ENABLE_FLIGHT_CONTROL, function (data) {
				return _this2.enableFlightControl(data);
			});
			Mediator.subscribe(Events.DISABLE_FLIGHT_CONTROL, function (data) {
				return _this2.disableFlightControl(data);
			});
		}

		//------------------------------------------------
		// Start rendering the collision models for all shapes
		//------------------------------------------------

	}, {
		key: "enableDebugMode",
		value: function enableDebugMode() {
			this.debugMode = true;
			for (var i = 0, length = this.shapes.length; i < length; i++) {
				this.shapes[i].showCollisionModel();
			}
		}

		//------------------------------------------------
		// Stop rendering the collision models for all shapes
		//------------------------------------------------

	}, {
		key: "disableDebugMode",
		value: function disableDebugMode() {
			this.debugMode = false;
			for (var i = 0, length = this.shapes.length; i < length; i++) {
				this.shapes[i].hideCollisionModel();
			}
		}

		//------------------------------------------------
		// Start rendering the collision lines and line angle
		//------------------------------------------------

	}, {
		key: "enableFlightControl",
		value: function enableFlightControl(data) {
			this.flightControlEnabled = true;
		}

		//------------------------------------------------
		// Remove any currently rendered collision line data
		//------------------------------------------------

	}, {
		key: "disableFlightControl",
		value: function disableFlightControl(data) {
			this.flightControlEnabled = false;
			if (this.flightControlShapes.length > 0) {
				for (var i = 0, length = this.flightControlShapes.length; i < length; i++) {
					this.DOMElement.removeChild(this.flightControlShapes[i]);
				}
				this.flightControlShapes = [];
			}
			if (this.flightControlCopy.length) {
				for (var _i = 0, _length = this.flightControlCopy.length; _i < _length; _i++) {
					document.body.removeChild(this.flightControlCopy[_i]);
				}
				this.flightControlCopy = [];
			}
		}

		//------------------------------------------------
		// Stop updating shape positions
		//------------------------------------------------

	}, {
		key: "pause",
		value: function pause() {
			this.paused = true;
		}

		//------------------------------------------------
		// Resume updating shape positions
		//------------------------------------------------

	}, {
		key: "resume",
		value: function resume() {
			this.paused = false;
		}

		//------------------------------------------------
		// Create a random selection of shapes
		//------------------------------------------------

	}, {
		key: "createStartingShapes",
		value: function createStartingShapes() {
			var color = "#00eac4";
			for (var i = 0, length = this.maxShapes; i < length; i++) {
				// Colour changing for testing purposes
				/*if (i === 0) {
    	color = "#000000";
    } else {
    	color = "#00eac4";
    }*/
				this.createNewShape(false, color);
			}
		}

		//------------------------------------------------
		// Create a new shape
		//------------------------------------------------

	}, {
		key: "createNewShape",
		value: function createNewShape(triggerSound) {
			var color = arguments.length <= 1 || arguments[1] === undefined ? "#00eac4" : arguments[1];

			var randomNumber = Math.floor(Math.random() * this.shapeOptions.length);
			var shape = new this.shapeOptions[randomNumber](this.DOMElement, color, this.strokeWidth, this.scale, triggerSound);
			this.setRandomPosition(shape);
			var segmentWidth = 50;
			var segmentHeight = 50;
			var xPos = this.stage.x,
			    yPos = this.stage.y;
			var shapeCreated = true;
			if (this.shapes.length >= this.maxShapes) {
				this.shapes[0].destroy();
				this.shapes.shift();
			}

			// Split the screen up into segments, and try placing the shape in each
			// until it isn't colliding with another shape
			while (this.checkBoundingBoxes(shape) || this.checkScreenEdges(shape) || this.checkBackgroundLine(shape)) {
				shape.setPosition(xPos, yPos);
				xPos += segmentWidth;
				if (xPos > this.stage.x + this.stage.width) {
					xPos = this.stage.x;
					yPos += segmentHeight;
				}
				if (yPos > this.stage.y + (this.stage.height / 2 - 150)) {
					shapeCreated = false;
					break;
				}
			}
			if (shapeCreated) {
				this.shapes.push(shape);
				shape.addToStage();
				if (triggerSound && !this.debugMode) {
					var stagePosition = (shape.getBoundingBox().x + shape.getBoundingBox().width / 2 - this.stage.x) / this.stage.width;
					//shape.collide(stagePosition);
					shape.playCollisionSound(stagePosition);
				}
				if (this.debugMode) {
					shape.showCollisionModel();
				}
			} else {
				shape.destroy();
			}
		}

		//------------------------------------------------
		// Check if a shape is colliding with the main background lines
		//------------------------------------------------

	}, {
		key: "checkBackgroundLine",
		value: function checkBackgroundLine(shape) {
			var result = this.checkLineCollisions(shape, this.backgroundLines);
			return result.collision;
		}

		//------------------------------------------------
		// Make sure a shape isn't outside it's target area
		//------------------------------------------------

	}, {
		key: "checkScreenEdges",
		value: function checkScreenEdges(shape) {
			var box = shape.getBoundingBox();
			if (box.x < this.stage.x || box.x + box.width > this.stage.x + this.stage.width || box.y < this.stage.y || box.y + box.height > this.stage.y + this.stage.height) {
				return true;
			} else {
				return false;
			}
		}

		//------------------------------------------------
		// Choose a random position on the screen
		//------------------------------------------------

	}, {
		key: "setRandomPosition",
		value: function setRandomPosition(shape) {
			var x = this.stage.x + (100 + Math.random() * (this.stage.width - 200));
			var y = 100 + Math.random() * (this.stage.height / 2 - 200);
			shape.setPosition(x, y);
		}

		//------------------------------------------------
		// Check a shape isn't overlapping another's box
		//------------------------------------------------

	}, {
		key: "checkBoundingBoxes",
		value: function checkBoundingBoxes(shape) {
			var collision = false;
			for (var i = 0, length = this.shapes.length; i < length; i++) {
				// Don't check for collisions with yourself
				if (this.shapes[i] !== shape) {
					if (this.checkBoundingBox(shape, this.shapes[i])) {
						collision = true;
						break;
					}
				}
			}
			return collision;
		}

		//------------------------------------------------
		// Compare the bounding boxes of two shapes
		//------------------------------------------------

	}, {
		key: "checkBoundingBox",
		value: function checkBoundingBox(shape1, shape2) {
			var collision = false;
			var shape1Box = shape1.getBoundingBox();
			var shape2Box = shape2.getBoundingBox();

			if (shape1Box.x < shape2Box.x + shape2Box.width && shape1Box.x + shape1Box.width > shape2Box.x && shape1Box.y < shape2Box.y + shape2Box.height && shape1Box.height + shape1Box.y > shape2Box.y) {
				collision = true;
			}

			return collision;
		}

		//------------------------------------------------
		// A shape should flip it's xSpeed if it hits a
		// steep enough slope, and should always be moving
		// upwards, since the lines are always at the bottom
		// of the screen
		//------------------------------------------------

	}, {
		key: "createBackgroundCollision",
		value: function createBackgroundCollision(shape, result) {
			// Get away from the lines
			var shapePos = shape.getPosition();
			// Work out new speed and direction
			// We know line2 is the background's line because it's always the second argument to that method
			var bgLine = result.line2;
			// Get the slope of the background line the shape hit
			var slope = 0;
			if (bgLine.x2 === bgLine.x1) {
				slope = 1;
			} else if (bgLine.y2 !== bgLine.y1) {
				slope = (bgLine.y2 - bgLine.y1) / (bgLine.x2 - bgLine.x1);
			}
			if (slope > 0.4 && shape.xSpeed < 0) {
				shape.xSpeed *= -1;
			}
			if (slope < -0.4 && shape.xSpeed > 0) {
				shape.xSpeed *= -1;
			}

			// Shape should always move up as lines are below them at all times in impacts
			shape.ySpeed = -Math.abs(shape.ySpeed);
			if (Math.abs(shape.ySpeed) < 1) {
				var position = shape.getPosition();
				shape.setPosition(position.x, position.y - 2);
			}

			// Work out rotation
			shape.rotationSpeed *= -1;
			var stagePosition = (shape.getBoundingBox().x + shape.getBoundingBox().width / 2 - this.stage.x) / this.stage.width;
			shape.collide(stagePosition, true);
		}

		//------------------------------------------------
		// Move shapes, then check for collisions
		//------------------------------------------------

	}, {
		key: "updateSimulation",
		value: function updateSimulation() {
			var _this3 = this;

			if (!this.paused) {
				for (var i = 0, length = this.shapes.length; i < length; i++) {
					this.shapes[i].update();
				}

				var result = false;

				// Compare each shape to the sweeping background lines, and see if they hit it
				var bgCollisionModel = this.backgroundLines.getLineSegments();
				for (var _i2 = 0, _length2 = this.shapes.length; _i2 < _length2; _i2++) {
					var shape = this.shapes[_i2];
					// BackgroundLines also has a getLineSegments method, so can also be fed in here directly
					result = this.checkLineCollisions(shape, this.backgroundLines);
					if (result.collision) {
						this.createBackgroundCollision(shape, result);
					}
				}

				// Compare each shape to the stage bounds
				for (var _i3 = 0, _length3 = this.shapes.length; _i3 < _length3; _i3++) {
					var _shape = this.shapes[_i3];
					var boundingBox = this.shapes[_i3].getBoundingBox();
					if (boundingBox.x < this.stage.x) {
						_shape.xSpeed = Math.abs(_shape.xSpeed);
						_shape.rotationSpeed *= -1;
					} else if (boundingBox.x + boundingBox.width > this.stage.x + this.stage.width) {
						_shape.xSpeed = -Math.abs(_shape.xSpeed);
						_shape.rotationSpeed *= -1;
					} else if (boundingBox.y < this.stage.y) {
						_shape.ySpeed = Math.abs(_shape.ySpeed);
						_shape.rotationSpeed *= -1;
					} else if (boundingBox.y + boundingBox.height > this.stage.y + this.stage.height) {
						_shape.ySpeed = -Math.abs(_shape.ySpeed);
						_shape.rotationSpeed *= -1;
					}
				}

				// Compare each shape to every other shape, and see if they collide
				for (var _i4 = 0, _length4 = this.shapes.length; _i4 < _length4; _i4++) {
					for (var k = _i4 + 1, kLength = this.shapes.length; k < _length4; k++) {
						if (this.checkBoundingBox(this.shapes[_i4], this.shapes[k])) {
							// If bounding box is overlapping, do more complicated stuff
							result = this.checkLineCollisions(this.shapes[_i4], this.shapes[k], true);
							if (result.length > 0) {
								//if (this.shapes[i].colliders.indexOf(this.shapes[k]) < 0 || this.shapes[k].colliders.indexOf(this.shapes[i]) < 0) {
								result.shape1 = this.shapes[_i4];
								result.shape2 = this.shapes[k];

								this.createCollision(this.shapes[_i4], this.shapes[k], result);
								this.shapes[_i4].addCollider(this.shapes[k]);
								this.shapes[k].addCollider(this.shapes[_i4]);
								//}
							} else {
									this.shapes[_i4].removeCollider(this.shapes[k]);
									this.shapes[k].removeCollider(this.shapes[_i4]);
								}
						} else {
							this.shapes[_i4].removeCollider(this.shapes[k]);
							this.shapes[k].removeCollider(this.shapes[_i4]);
						}
					}
				}
			}

			this.requestFrameID = requestAnimationFrame(function () {
				return _this3.updateSimulation();
			});
		}

		//------------------------------------------------
		// Check line segemnts between two shapes
		// @allMatches: Return an array of matching collisions
		// This is since a line on shape1 can cross more than one
		// line on shape2 at once (ie. a corner hit will match
		// two lines at once)
		//------------------------------------------------

	}, {
		key: "checkLineCollisions",
		value: function checkLineCollisions(shape1, shape2, allMatches) {
			var shape1Segments = shape1.getLineSegments();
			var shape2Segments = shape2.getLineSegments();
			var result = {
				line1Impact: 0,
				line2Impact: 0,
				collision: false
			};
			var collisions = [];
			for (var i = 0, length = shape1Segments.length; i < length; i++) {
				for (var k = 0, kLength = shape2Segments.length; k < kLength; k++) {
					result = this.testLines(shape1Segments[i], shape2Segments[k]);
					if (result.collision) {
						result.line1ID = i;
						result.line2ID = k;
						if (allMatches) {
							collisions.push(result);
						} else {
							return result;
						}
					}
				}
			}
			if (allMatches) {
				return collisions;
			} else {
				return result;
			}
		}

		//------------------------------------------------
		// Check if two lines overlap
		//------------------------------------------------

	}, {
		key: "testLines",
		value: function testLines(line1, line2) {
			// This link helped a lot: https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection#Intersection_of_two_lines
			var denominator = (line1.x1 - line1.x2) * (line2.y1 - line2.y2) - (line1.y1 - line1.y2) * (line2.x1 - line2.x2);
			var slope1 = (line1.y2 - line1.y1) / (line1.x2 - line1.x1);
			var slope2 = (line2.y2 - line2.y1) / (line2.x2 - line2.x1);

			// How to find the actual co-ordinates where the contact took place (screen-relative)
			var numeratorX = (line1.x1 * line1.y2 - line1.y1 * line1.x2) * (line2.x1 - line2.x2) - (line1.x1 - line1.x2) * (line2.x1 * line2.y2 - line2.y1 * line2.x2);
			var numeratorY = (line1.x1 * line1.y2 - line1.y1 * line1.x2) * (line2.y1 - line2.y2) - (line1.y1 - line1.y2) * (line2.x1 * line2.y2 - line2.y1 * line2.x2);

			var pointX = numeratorX / denominator;
			var pointY = numeratorY / denominator;
			// If the denominator is 0, that means both lines are parallel
			// Return true, since we already know the bounding boxes are overlapping
			if (denominator === 0 || slope1.toFixed(5) === slope2.toFixed(5)) {
				return {
					line1: line1,
					line2: line2,
					line1Impact: 0.5,
					line2Impact: 0.5,
					x: pointX,
					y: pointY,
					collision: false
				};
			}

			// First see how far along the connecting point is between the two lines
			// Between 0 and 1 means it's somewhere on the lines, otherwise it's further off the actual lines
			// https://en.wikipedia.org/wiki/B%C3%A9zier_curve#Linear_curves
			var bezierY = line1.y1 - line2.y1;
			var bezierX = line1.x1 - line2.x1;
			var numeratorLine2 = (line2.x2 - line2.x1) * bezierY - (line2.y2 - line2.y1) * bezierX;
			var numeratorLine1 = (line1.x2 - line1.x1) * bezierY - (line1.y2 - line1.y1) * bezierX;

			// This is how far along the lines the overlapping point is, from 0 to 1
			var bezierLine2 = numeratorLine2 / denominator;
			var bezierLine1 = numeratorLine1 / denominator;

			// If line1 is a segment, and line2 is infinite, they intersect if bezierLine2 is between 0 and 1
			if (bezierLine2 > 0 && bezierLine2 < 1 && bezierLine1 > 0 && bezierLine1 < 1) {
				return {
					line1: line1,
					line2: line2,
					line1Angle: Math.atan2(line1.y2 - line1.y1, line1.x1 - line1.x2) * (180 / Math.PI),
					line2Angle: Math.atan2(line2.y2 - line2.y1, line2.x1 - line2.x2) * (180 / Math.PI),
					line1Impact: bezierLine2,
					line2Impact: bezierLine1,
					x: pointX,
					y: pointY,
					collision: true
				};
			}
			return {
				line1: line1,
				line2: line2,
				line1Impact: 0.5,
				line2Impact: 0.5,
				x: pointX,
				y: pointY,
				collision: false
			};
		}

		//------------------------------------------------
		// incomingShape = Shape with more than one collision
		// impactedShape = Shape with one collision
		// collisions = Array of collisions for the incomingShape
		//------------------------------------------------

	}, {
		key: "selectCollidingLine",
		value: function selectCollidingLine(incomingShape, impactedShape, collisions, angleName) {
			var collisionData = {};
			if (Math.abs(impactedShape.xSpeed) > Math.abs(impactedShape.ySpeed)) {
				if (impactedShape.xSpeed > 0 || impactedShape.xSpeed < 0 && incomingShape.xSpeed < 0 && incomingShape.xSpeed < impactedShape.xSpeed) {
					if (collisions[0].y > incomingShape.center.y) {
						collisionData = collisions[0][angleName] > collisions[1][angleName] ? collisions[0] : collisions[1];
					} else {
						collisionData = collisions[0][angleName] < collisions[1][angleName] ? collisions[0] : collisions[1];
					}
				} else {
					if (collisions[0].y > incomingShape.center.y) {
						collisionData = collisions[0][angleName] < collisions[1][angleName] ? collisions[0] : collisions[1];
					} else {
						collisionData = collisions[0][angleName] > collisions[1][angleName] ? collisions[0] : collisions[1];
					}
				}
			} else {
				if (impactedShape.ySpeed > 0 || impactedShape.ySpeed < 0 && incomingShape.ySpeed < 0 && incomingShape.ySpeed < impactedShape.ySpeed) {
					if (impactedShape.xSpeed > 0) {
						collisionData = collisions[0][angleName] > collisions[1][angleName] ? collisions[0] : collisions[1];
					} else {
						collisionData = collisions[0][angleName] < collisions[1][angleName] ? collisions[0] : collisions[1];
					}
				} else {
					if (impactedShape.xSpeed > 0) {
						collisionData = collisions[0][angleName] < collisions[1][angleName] ? collisions[0] : collisions[1];
					} else {
						collisionData = collisions[0][angleName] > collisions[1][angleName] ? collisions[0] : collisions[1];
					}
				}
			}
			return collisionData;
		}

		//------------------------------------------------
		// Get the point of collision on an impacted line,
		// and get where it was in the previous frame,
		// then work out the overall speed. This approach
		// factors in rotation when calculating overall speed
		//------------------------------------------------

	}, {
		key: "getCollisionSpeeds",
		value: function getCollisionSpeeds(shape, lineID, lineImpact) {
			var segmentData = shape.getLineSegments()[lineID];
			var previousSegmentData = shape.getPreviousLineSegments()[lineID];
			var prevPoint = {
				x: previousSegmentData.x1 + (previousSegmentData.x2 - previousSegmentData.x1) * lineImpact,
				y: previousSegmentData.y1 + (previousSegmentData.y2 - previousSegmentData.y1) * lineImpact
			};
			var thisPoint = {
				x: segmentData.x1 + (segmentData.x2 - segmentData.x1) * lineImpact,
				y: segmentData.y1 + (segmentData.y2 - segmentData.y1) * lineImpact
			};
			// Shape's point's position difference (AKA speed)
			var shapeXSpeed = thisPoint.x - prevPoint.x;
			var shapeYSpeed = thisPoint.y - prevPoint.y;
			return {
				x: shapeXSpeed,
				y: shapeYSpeed
			};
		}

		//------------------------------------------------
		// Move a shape back in the direction it came. This
		// is required immediately after a collision to make
		// sure the two shapes stop colliding
		//------------------------------------------------

	}, {
		key: "reverseShape",
		value: function reverseShape(shape, collisionSpeeds) {
			var reverseX = 0;
			if (Math.abs(shape.xSpeed) > Math.abs(collisionSpeeds.x)) {
				reverseX = shape.xSpeed;
			} else {
				if (shape.xSpeed > 0) {
					reverseX = Math.abs(collisionSpeeds.x);
				} else {
					reverseX = -Math.abs(collisionSpeeds.x);
				}
			}
			var reverseY = 0;
			if (Math.abs(shape.ySpeed) > Math.abs(collisionSpeeds.y)) {
				reverseY = shape.ySpeed;
			} else {
				if (shape.ySpeed > 0) {
					reverseY = Math.abs(collisionSpeeds.y);
				} else {
					reverseY = -Math.abs(collisionSpeeds.y);
				}
			}
			var shapePosition = shape.getPosition();
			shape.setPosition(shapePosition.x + reverseX * -3, shapePosition.y + reverseY * -3);
		}

		//------------------------------------------------
		// Work out how the shape should turn after a collision
		// The further away the impact is from the center
		// of mass, the stronger the resulting rotation
		//------------------------------------------------

	}, {
		key: "calculateNewRotation",
		value: function calculateNewRotation(shape, collisionData, collisionSpeeds, incomingSpeeds) {
			// Keep the angle between 0 - 180 degrees, as that's all we really need
			var lineAngle = collisionData.line2Angle;
			if (lineAngle < 0) {
				lineAngle = Math.abs(lineAngle);
			} else {
				lineAngle = 360 - lineAngle - 180;
			}
			// Get distance between impact point and object's center of mass (origin)
			var distance = Math.sqrt((collisionData.x - shape.origin.x) * (collisionData.x - shape.origin.x) + (collisionData.y - shape.origin.y) * (collisionData.y - shape.origin.y));
			var rotationStrength = distance / shape.width * Settings.MAX_ROTATION;

			if (lineAngle < 60 || lineAngle > 145) {
				// Line is more horizontal
				if (incomingSpeeds.y < 0 || incomingSpeeds.y > 0 && collisionSpeeds.y > 0) {
					// Other shape was moving up
					if (collisionData.x > shape.center.x) {
						// Impact point is on the right of the shape
						shape.rotationSpeed = -rotationStrength;
					} else {
						// Impact point is on the left of the shape
						shape.rotationSpeed = rotationStrength;
					}
				} else {
					// Other shape was moving down
					if (collisionData.x > shape.center.x) {
						// Impact point is on the right of the shape
						shape.rotationSpeed = rotationStrength;
					} else {
						// Impact point is on the left of the shape
						shape.rotationSpeed = -rotationStrength;
					}
				}
			} else {
				// Line is more vertical
				if (incomingSpeeds.x < 0 || collisionSpeeds.x > 0 && incomingSpeeds.x > 0) {
					// Other shape was moving left
					if (collisionData.y > shape.center.y) {
						// Impact point is below center of shape
						shape.rotationSpeed = rotationStrength;
					} else {
						// Impact point is above center of shape
						shape.rotationSpeed = -rotationStrength;
					}
				} else {
					// Other shape was moving right
					if (collisionData.y > shape.center.y) {
						// Impact point is below center of shape
						shape.rotationSpeed = -rotationStrength;
					} else {
						// Impact point is above center of shape
						shape.rotationSpeed = rotationStrength;
					}
				}
			}
		}

		//------------------------------------------------
		// Work out how each shape should respond to the collision
		//------------------------------------------------

	}, {
		key: "createCollision",
		value: function createCollision(shape1, shape2, collisionData) {
			var shape1LineIDs = [];
			var shape2LineIDs = [];
			var shape1Collisions = [];
			var shape2Collisions = [];
			// Loop through collisions and find number of collisions per shape
			for (var i = 0, length = collisionData.length; i < length; i++) {
				if (shape1LineIDs.indexOf(collisionData[i].line1ID) < 0) {
					shape1LineIDs.push(collisionData[i].line1ID);
					shape1Collisions.push(collisionData[i]);
				}
				if (shape2LineIDs.indexOf(collisionData[i].line2ID) < 0) {
					shape2LineIDs.push(collisionData[i].line2ID);
					shape2Collisions.push(collisionData[i]);
				}
			}

			if (shape1LineIDs.length === 1 && shape2LineIDs.length === 1) {
				// Only one line crossed, so use that directly
				collisionData = collisionData[0];
			} else {
				// Choose which line collision we care about
				if (shape1LineIDs.length > 1) {
					// 2 points of impact on shape 1
					collisionData = this.selectCollidingLine(shape1, shape2, shape1Collisions, "line1Angle");
				} else {
					// 2 points of impact on shape 2
					collisionData = this.selectCollidingLine(shape2, shape1, shape2Collisions, "line2Angle");
				}
			}

			var previousShape1XSpeed = shape1.xSpeed;
			var previousShape1YSpeed = shape1.ySpeed;
			var previousShape2XSpeed = shape2.xSpeed;
			var previousShape2YSpeed = shape2.ySpeed;

			// We need to work out the exact point of impact on each shape
			// and how far that point travelled in the previous frame
			// So first we calculate the point of impact in the current frame,
			// and that same point as it was in the previous frame
			// Shape 1's point:
			var shape1CollisionSpeeds = this.getCollisionSpeeds(shape1, collisionData.line1ID, collisionData.line1Impact);
			var shape2CollisionSpeeds = this.getCollisionSpeeds(shape2, collisionData.line2ID, collisionData.line2Impact);

			// Store the previous rotation value for each shape
			var previousShape1Rotation = shape1.rotationSpeed;
			var previousShape2Rotation = shape2.rotationSpeed;

			// Conservation of momentum, learned from the book Apress Foundation HTML5 Animation
			var speedTotal = shape1.xSpeed - shape2.xSpeed;
			var newXSpeed1 = ((shape1.mass - shape2.mass) * shape1.xSpeed + 2 * shape2.mass * shape2.xSpeed) / (shape1.mass + shape2.mass);
			var newXSpeed2 = speedTotal + newXSpeed1;

			speedTotal = shape1.ySpeed - shape2.ySpeed;
			var newYSpeed1 = ((shape1.mass - shape2.mass) * shape1.ySpeed + 2 * shape2.mass * shape2.ySpeed) / (shape1.mass + shape2.mass);
			var newYSpeed2 = speedTotal + newYSpeed1;

			// TODO: We need to add a portion of randomness to the resulting speeds
			// This is to avoid shapes repeatedly bouncing off each other back and forth

			// Make sure shapes don't continue moving into each other
			var shape1Position = shape1.getPosition();
			var shape2Position = shape2.getPosition();

			if (newYSpeed1 > 0 && newYSpeed2 > 0) {
				if (newYSpeed1 >= newYSpeed2 && shape1Position.y < shape2Position.y) {
					newYSpeed1 *= -1;
				} else if (newYSpeed2 >= newYSpeed1 && shape1Position.y > shape2Position.y) {
					newYSpeed2 *= -1;
				}
			} else if (newYSpeed1 < 0 && newYSpeed2 < 0) {
				if (newYSpeed1 <= newYSpeed2 && shape1Position.y > shape2Position.y) {
					newYSpeed1 *= -1;
				} else if (newYSpeed2 <= newYSpeed1 && shape2Position.y > shape1Position.y) {
					newYSpeed2 *= -1;
				}
			}
			if (newXSpeed1 > 0 && newXSpeed2 > 0) {
				if (newXSpeed1 >= newXSpeed2 && shape1Position.x < shape2Position.x) {
					newXSpeed1 *= -1;
				} else if (newXSpeed2 >= newXSpeed1 && shape2Position.x > shape1Position.x) {
					newXSpeed2 *= -1;
				}
			} else if (newXSpeed1 < 0 && newXSpeed2 < 0) {
				if (newXSpeed1 <= newXSpeed2 && shape1Position.x > shape2Position.x) {
					newXSpeed1 *= -1;
				} else if (newXSpeed2 <= newXSpeed1 && shape2Position.x > shape1Position.x) {
					newXSpeed2 *= -1;
				}
			}

			// Draw collision data (debug mode)
			if (this.flightControlEnabled) {
				var segmentData = shape1.getLineSegments()[collisionData.line1ID];
				var thisPoint = {
					x: segmentData.x1 + (segmentData.x2 - segmentData.x1) * collisionData.line1Impact,
					y: segmentData.y1 + (segmentData.y2 - segmentData.y1) * collisionData.line1Impact
				};

				var tempShape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
				tempShape.setAttribute("fill", "#FF0066");
				tempShape.setAttribute("cx", thisPoint.x);
				tempShape.setAttribute("cy", thisPoint.y);
				tempShape.setAttribute("r", 5);
				this.DOMElement.appendChild(tempShape);
				this.flightControlShapes.push(tempShape);

				var lineAngle = collisionData.line1Angle;
				var color = "#0000ff";
				if (lineAngle < 0) {
					lineAngle = Math.abs(lineAngle);
				} else {
					color = "#ff0066";
					lineAngle = 360 - lineAngle - 180;
				}

				var line = collisionData.line1;
				tempShape = document.createElementNS("http://www.w3.org/2000/svg", "line");
				tempShape.setAttribute("stroke-width", 2);
				tempShape.setAttribute("stroke", color);
				tempShape.setAttribute("fill", "transparent");
				tempShape.setAttribute("x1", line.x1);
				tempShape.setAttribute("x2", line.x2);
				tempShape.setAttribute("y1", line.y1);
				tempShape.setAttribute("y2", line.y2);
				this.DOMElement.appendChild(tempShape);
				this.flightControlShapes.push(tempShape);

				tempShape = document.createElement("p");
				tempShape.setAttribute("style", "position: absolute; color: " + color + "; top: " + (line.y1 - 20) + "px; left: " + (line.x1 + 20) + "px");
				tempShape.innerHTML = lineAngle;
				document.body.appendChild(tempShape);
				this.flightControlCopy.push(tempShape);
			}

			this.calculateNewRotation(shape1, collisionData, shape1CollisionSpeeds, shape2CollisionSpeeds);
			this.calculateNewRotation(shape2, collisionData, shape2CollisionSpeeds, shape1CollisionSpeeds);

			var angleIncrement1 = 0;
			var angleIncrement2 = 0;

			// Un-rotate by the biggest quantity
			if (Math.abs(previousShape1Rotation) > Math.abs(shape1.rotationSpeed)) {
				angleIncrement1 = previousShape1Rotation * -3;
			} else {
				if (previousShape1Rotation > 0) {
					angleIncrement1 = Math.abs(shape1.rotationSpeed) * -3;
				} else {
					angleIncrement1 = Math.abs(shape1.rotationSpeed) * 3;
				}
			}
			shape1.angle = shape1.angle + angleIncrement1;

			if (Math.abs(previousShape2Rotation) > Math.abs(shape2.rotationSpeed)) {
				angleIncrement2 = previousShape2Rotation * -3;
			} else {
				if (previousShape2Rotation > 0) {
					angleIncrement2 = Math.abs(shape2.rotationSpeed) * -3;
				} else {
					angleIncrement2 = Math.abs(shape2.rotationSpeed) * 3;
				}
			}
			shape2.angle = shape2.angle + angleIncrement2;

			// Reverse the shapes away from each other
			this.reverseShape(shape1, shape1CollisionSpeeds);
			this.reverseShape(shape2, shape2CollisionSpeeds);

			// Now switch to the new direction speeds
			shape1.xSpeed = newXSpeed1;
			shape1.ySpeed = newYSpeed1;
			shape2.xSpeed = newXSpeed2;
			shape2.ySpeed = newYSpeed2;

			var stagePosition = 0;
			if (Math.random() > 0.5) {
				stagePosition = (shape1.getBoundingBox().x + shape1.getBoundingBox().width / 2 - this.stage.x) / this.stage.width;
				shape1.collide(stagePosition);
			} else {
				stagePosition = (shape2.getBoundingBox().x + shape2.getBoundingBox().width / 2 - this.stage.x) / this.stage.width;
				shape2.collide(stagePosition);
			}

			var collisions = this.checkLineCollisions(shape1, shape2, true);
			if (collisions.length) {
				// Fail-safe: If the shapes are stuck together, just re-position one of them
				// somewhere on the screen
				// Should never get here, but better to be safe than sorry.
				// First try getting further away
				var attempts = 0;
				var startPos1 = shape1.getPosition();
				var startPos2 = shape2.getPosition();
				var attemptX = 0;
				var attemptY = 0;
				while (collisions.length && attempts < 50) {
					if (window.console) console.log("Shape adjusted 1");
					//shape1.angle = shape1.angle - (angleIncrement1*3);
					//shape2.angle = shape2.angle - (angleIncrement2*3);

					// Make sure the shapes are moving in different directions
					if (previousShape1XSpeed > 0 && previousShape2XSpeed > 0 || previousShape1XSpeed < 0 && previousShape2XSpeed < 0) {
						attemptX = -previousShape1XSpeed;
					} else {
						attemptX = previousShape1XSpeed;
					}
					if (previousShape1YSpeed > 0 && previousShape2YSpeed > 0 || previousShape1YSpeed < 0 && previousShape2YSpeed < 0) {
						attemptY = -previousShape1YSpeed;
					} else {
						attemptY = previousShape1YSpeed;
					}

					shape1.setPosition(shape1.getPosition().x - attemptX, shape1.getPosition().y - attemptY);
					shape2.setPosition(shape2.getPosition().x - previousShape2XSpeed, shape2.getPosition().y - previousShape2YSpeed);

					collisions = this.checkLineCollisions(shape1, shape2, true);
					attempts++;
				}

				// If that didn't work, reset and try the opposite direction
				if (collisions.length) {
					attempts = 0;
					shape1.setPosition(startPos1.x, startPos1.y);
					shape2.setPosition(startPos2.x, startPos2.y);
					while (collisions.length && attempts < 50) {
						if (window.console) console.log("Shape adjusted 2");

						shape1.setPosition(shape1.getPosition().x + attemptX, shape1.getPosition().y + attemptY);
						shape2.setPosition(shape2.getPosition().x + previousShape2XSpeed, shape2.getPosition().y + previousShape2YSpeed);

						collisions = this.checkLineCollisions(shape1, shape2, true);
						attempts++;
					}
				}
				// Still have a problem? Seriously? Fine, reposition the shape altogether
				if (collisions.length) {
					if (window.console) console.log("Shape adjusted 3");
					this.findNewPosition(shape1);
				}
			}
		}

		//------------------------------------------------
		// Change the size of all shapes in the system to
		// suit the size of the browser window
		//------------------------------------------------

	}, {
		key: "resize",
		value: function resize(stage, strokeWidth, scale) {
			var previousStage = this.stage;

			var scaleChangeX = stage.width / this.stage.width;
			var scaleChangeY = stage.height / this.stage.height;

			this.stage = stage;
			for (var i = 0, length = this.shapes.length; i < length; i++) {
				var currentPos = this.shapes[i].getPosition();
				this.shapes[i].resize(strokeWidth, scale);

				var boundingBox = this.shapes[i].getBoundingBox();
				// Calculate the new X position based on the shape's current position, while factoring in the scale change
				var newX = stage.x + (currentPos.x - previousStage.x) * scaleChangeX;
				if (newX > stage.x + stage.width - boundingBox.width) {
					newX = stage.x + stage.width - (boundingBox.width + 40);
				}
				// Do the same for the Y position
				var newY = currentPos.y * scaleChangeY;
				if (currentPos.y + boundingBox.height + 40 > stage.y + stage.height / 2) {
					newY = stage.height / 2 - (boundingBox.height / 2 + 40);
				} else if (currentPos.y < stage.y) {
					newY = stage.y + boundingBox.height * scaleChangeY / 2;
				}
				// Gets the shape to update it's current position
				this.shapes[i].setPosition(newX, newY);
			}
			// Loop through the newly positioned shapes, and if this new position
			// results in this shape overlapping another, find a new position for it
			for (var _i5 = 0, _length5 = this.shapes.length; _i5 < _length5; _i5++) {
				var shape = this.shapes[_i5];
				this.findNewPosition(shape);
			}
			this.scale = scale;
			this.strokeWidth = strokeWidth;
		}

		//------------------------------------------------
		// Find an empty area to place the passed shape
		//------------------------------------------------

	}, {
		key: "findNewPosition",
		value: function findNewPosition(shape) {
			var newX = this.stage.x,
			    newY = this.stage.y;
			while (this.checkBoundingBoxes(shape) || this.checkScreenEdges(shape) || this.checkBackgroundLine(shape)) {
				shape.setPosition(newX, newY);
				newX += 50;
				if (newX > this.stage.x + this.stage.width) {
					newX = this.stage.x;
					newY += 50;
				}
				if (newY > this.stage.y + (this.stage.height / 2 - 150)) {
					break;
				}
			}
		}
	}]);

	return ShapeSystem;
}(EventDispatcher);
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
// Main Site Background
////////////////////////////////////////////////////////////////////////////////

var SiteBackground = function (_EventDispatcher) {
	_inherits(SiteBackground, _EventDispatcher);

	//------------------------------------------------
	// Constructor
	//------------------------------------------------

	function SiteBackground(DOMElement) {
		_classCallCheck(this, SiteBackground);

		// Variables

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(SiteBackground).call(this));

		_this.DOMElement = DOMElement;
		_this.shapesElement = _this.DOMElement.querySelector(".js-background-shapes");
		_this.backgroundElement = _this.DOMElement.querySelector(".js-background-lines");
		_this.currentScale = 1;
		_this.naturalScale = 1;
		_this.previousSection = 0;
		_this.currentSection = 0;
		_this.siteSections = 1;
		_this.originalStrokeWidth = 53;
		_this.previousScale = 1;
		_this.previousX = 0;
		_this.animating = false;
		_this.shapeSystems = [];
		_this.calculateScale();
		_this.frameRequest = null;
		_this.backgroundLines = null;
		_this.strokeWidth = _this.currentScale * _this.originalStrokeWidth;
		var halfWidth = window.innerWidth / 2;
		NATION.Utils.setStyle(_this.DOMElement, { transformOrigin: halfWidth + "px 50%" });
		NATION.Utils.setStyle(_this.DOMElement, { transform: "translateX(0) scale(1)" });
		_this.createBackgroundLines();
		_this.createShapeSystems();
		_this.createListeners();
		return _this;
	}

	//------------------------------------------------
	//
	//------------------------------------------------


	_createClass(SiteBackground, [{
		key: "overrideScale",
		value: function overrideScale(newScale) {
			newScale = this.naturalScale * newScale;
			this.currentScale = newScale;
			this.strokeWidth = this.currentScale * this.originalStrokeWidth;
			this.resizeShapes();
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "randomiseBackgroundLines",
		value: function randomiseBackgroundLines() {
			this.backgroundLines.randomise();
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "updateShapeSpeeds",
		value: function updateShapeSpeeds() {
			for (var i = 0, length = this.shapeSystems.length; i < length; i++) {
				this.shapeSystems[i].updateSpeeds();
			}
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "randomiseShapes",
		value: function randomiseShapes() {
			for (var i = 0, length = this.shapeSystems.length; i < length; i++) {
				this.shapeSystems[i].randomise();
			}
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "showOnlyArcs",
		value: function showOnlyArcs() {
			for (var i = 0, length = this.shapeSystems.length; i < length; i++) {
				this.shapeSystems[i].showArcs();
			}
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "showOnlyCorners",
		value: function showOnlyCorners() {
			for (var i = 0, length = this.shapeSystems.length; i < length; i++) {
				this.shapeSystems[i].showCorners();
			}
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "showOnlyTriangles",
		value: function showOnlyTriangles() {
			for (var i = 0, length = this.shapeSystems.length; i < length; i++) {
				this.shapeSystems[i].showTriangles();
			}
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "showOnlyLines",
		value: function showOnlyLines() {
			for (var i = 0, length = this.shapeSystems.length; i < length; i++) {
				this.shapeSystems[i].showLines();
			}
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "showOnlyCircles",
		value: function showOnlyCircles() {
			for (var i = 0, length = this.shapeSystems.length; i < length; i++) {
				this.shapeSystems[i].showCircles();
			}
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "showAllShapes",
		value: function showAllShapes() {
			for (var i = 0, length = this.shapeSystems.length; i < length; i++) {
				this.shapeSystems[i].showAllShapes();
			}
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "randomiseAll",
		value: function randomiseAll() {
			this.randomiseShapes();
			this.randomiseBackgroundLines();
		}

		//------------------------------------------------
		// Listen for requests to add a new shape
		//------------------------------------------------

	}, {
		key: "createListeners",
		value: function createListeners() {
			var _this2 = this;

			window.addEventListener("resize", function (e) {
				return _this2.onWindowResized(e);
			});
			Mediator.subscribe(Events.SHAPE_REQUESTED, function (e) {
				return _this2.onShapeRequested(e);
			});
		}

		//------------------------------------------------
		// Fade in the wole background at once
		//------------------------------------------------

	}, {
		key: "fadeIn",
		value: function fadeIn(immediate) {
			if (!immediate) {
				this.DOMElement.style.opacity = 0;
				NATION.Animation.start(this.DOMElement, { opacity: 1 }, { duration: Settings.BG_FADE_DURTION });
			} else {
				this.DOMElement.style.opacity = 1;
			}
		}

		//------------------------------------------------
		// Resize the background lines and shapes to suit
		// the new browser dimensions
		//------------------------------------------------

	}, {
		key: "resize",
		value: function resize() {
			if (this.frameRequest) {
				if (cancelAnimationFrame) cancelAnimationFrame(this.frameRequest);
			}
			this.calculateScale();
			this.strokeWidth = this.originalStrokeWidth * this.currentScale;
			this.backgroundLines.resize(this.strokeWidth, this.currentScale);

			this.resizeShapes();
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "resizeShapes",
		value: function resizeShapes() {
			var windowWidth = window.innerWidth;
			var windowHeight = window.innerHeight;

			for (var i = 0, length = this.shapeSystems.length; i < length; i++) {
				var stage = {
					x: i * windowWidth,
					y: 0,
					width: windowWidth,
					height: windowHeight
				};
				this.shapeSystems[i].resize(stage, this.strokeWidth, this.currentScale);
			}
		}

		//------------------------------------------------
		// Work out the general scale for width and height
		// of browser - this is applied to shapes when
		// resizing them
		//------------------------------------------------

	}, {
		key: "calculateScale",
		value: function calculateScale() {
			var widthScale = 0;
			if (window.innerWidth >= 1400) {
				widthScale = 1;
			} else {
				widthScale = window.innerWidth / 1400;
			}
			var heightScale = 0;
			if (window.innerHeight >= 800) {
				heightScale = 1;
			} else {
				heightScale = window.innerHeight / 800;
			}
			this.currentScale = widthScale < heightScale ? widthScale : heightScale;
			this.naturalScale = this.currentScale;
		}

		//------------------------------------------------
		// Class that handles the creation and resizing of
		// the background lines
		//------------------------------------------------

	}, {
		key: "createBackgroundLines",
		value: function createBackgroundLines() {
			this.backgroundLines = new BackgroundLines(this.backgroundElement, this.siteSections, this.strokeWidth);
		}

		//------------------------------------------------
		// Create each of the shape systems, one per section
		//------------------------------------------------

	}, {
		key: "createShapeSystems",
		value: function createShapeSystems() {
			var windowWidth = window.innerWidth;
			var windowHeight = window.innerHeight;
			for (var i = 0; i < this.siteSections; i++) {
				var stage = {
					x: i * windowWidth,
					y: 0,
					width: windowWidth,
					height: windowHeight
				};
				this.shapeSystems.push(new ShapeSystem(this.shapesElement, this.backgroundLines, stage, this.strokeWidth, this.currentScale));
			}
			this.shapeSystems[0].resume();
		}

		//------------------------------------------------
		// Scroll the background to an x position based on
		// the index of the section required
		//------------------------------------------------

	}, {
		key: "scrollToSection",
		value: function scrollToSection(index, duration, immediate) {
			var _this3 = this;

			if (this.animating) {
				// If we were already scrolling, that means deep linking is interupting the scroll
				// So here we make sure that he previous shape system has been paused, as it wont get to
				// it's 'complete' event.
				this.shapeSystems[this.previousSection].pause();
				this.shapeSystems[this.currentSection].pause();
			}
			this.previousSection = this.currentSection;
			this.currentSection = index;
			var targetX = -(window.innerWidth / this.DOMElement.clientWidth) * 100 * index;
			this.shapeSystems[index].resume();

			if (!immediate) {
				this.aniamting = true;
				NATION.Animation.start(this.DOMElement, { transform: "translateX(" + targetX + "%) scale(1)" }, { duration: duration, easing: "easeInOutQuad" }, function (e) {
					return _this3.onSectionScrollComplete(e);
				});
			} else {
				NATION.Utils.setStyle(this.DOMElement, { transform: "translateX(" + targetX + "%) scale(1)" });
				this.onSectionScrollComplete();
			}
			this.previousScale = 1;
			this.previousX = targetX;
		}

		//------------------------------------------------
		// Scale up while keeping a particular section centered
		//------------------------------------------------

	}, {
		key: "scaleSection",
		value: function scaleSection(sectionID, newScale) {
			var _this4 = this;

			var duration = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

			var targetX = -(window.innerWidth / this.DOMElement.clientWidth) * 100 * sectionID;
			var originX = sectionID * window.innerWidth + window.innerWidth / 2;
			NATION.Utils.setStyle(this.DOMElement, { transformOrigin: originX + "px 50%" });
			if (duration) {
				NATION.Animation.start(this.DOMElement, { transform: "translateX(" + targetX + "%) scale(" + newScale + ")" }, { duration: duration, easing: "easeInOutQuad" }, function (e) {
					return _this4.onScaleComplete(e, sectionID);
				});
			} else {
				NATION.Utils.setStyle(this.DOMElement, { transform: "translateX(" + targetX + "%) scale(" + newScale + ")" });
				this.onScaleComplete(null, sectionID);
			}
			this.previousScale = newScale;
			this.previousX = targetX;
		}

		//------------------------------------------------
		// Pause the previous shape section, since it's
		// off-screen now
		//------------------------------------------------

	}, {
		key: "onSectionScrollComplete",
		value: function onSectionScrollComplete(e) {
			this.animating = false;
			this.shapeSystems[this.previousSection].pause();
		}

		//------------------------------------------------
		// Inform the app that scaling has finished
		//------------------------------------------------

	}, {
		key: "onScaleComplete",
		value: function onScaleComplete(e, index) {
			if (index === 0) {
				this.trigger(Events.INTRO_SCALE_COMPLETE);
			} else {
				this.trigger(Events.SCALE_COMPLETE);
			}
		}

		//------------------------------------------------
		// Delay resizes to prevent killing the browser
		//------------------------------------------------

	}, {
		key: "onWindowResized",
		value: function onWindowResized(e) {
			var _this5 = this;

			this.frameRequest = requestAnimationFrame(function () {
				return _this5.resize();
			});
		}

		//------------------------------------------------
		// Only create new shapes if not on a touch device
		// as otherwise this causes a user to have to double
		// click stuff to get anywhere
		//------------------------------------------------

	}, {
		key: "onShapeRequested",
		value: function onShapeRequested(e) {
			if (!Settings.isTouchDevice) {
				this.shapeSystems[this.currentSection].createNewShape(true);
			}
		}
	}]);

	return SiteBackground;
}(EventDispatcher);
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
// Options to control app output
////////////////////////////////////////////////////////////////////////////////

var SiteOptions = function (_EventDispatcher) {
	_inherits(SiteOptions, _EventDispatcher);

	//------------------------------------------------
	// Constructor
	//------------------------------------------------

	function SiteOptions(DOMElement) {
		_classCallCheck(this, SiteOptions);

		// Variables

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(SiteOptions).call(this));

		_this.DOMElement = DOMElement;
		_this.SNAP_SEGMENTS = 9;
		_this.showCollisions = null;
		_this.hideCollisions = null;
		_this.randomiseShapes = null;
		_this.randomiseBackground = null;
		_this.randomiseAll = null;
		_this.originalShapeSpeed = Settings.MAX_SHAPE_SPEED;
		_this.originalRotationSpeed = Settings.MAX_ROTATION;
		_this.requestedScale = 1;
		_this.speedProgressBar = null;
		_this.scaleProgressBar = null;
		_this.speedDisplay = null;
		_this.scaleDisplay = null;
		_this.reset = null;
		_this.getReferences();
		_this.createProgressBars();
		_this.createListeners();
		return _this;
	}

	//------------------------------------------------
	//
	//------------------------------------------------


	_createClass(SiteOptions, [{
		key: "createProgressBars",
		value: function createProgressBars() {
			var options = {
				snapSegments: this.SNAP_SEGMENTS,
				handlePositioning: "inside"
			};
			this.speedProgressBar = new NATION.ProgressBar(this.DOMElement.querySelector(".speed-progress-bar"), options);
			this.scaleProgressBar = new NATION.ProgressBar(this.DOMElement.querySelector(".scale-progress-bar"), options);
			this.scaleProgressBar.setProgress(1);
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "getReferences",
		value: function getReferences() {
			this.showCollisions = this.DOMElement.querySelector(".show-collisions");
			this.hideCollisions = this.DOMElement.querySelector(".hide-collisions");
			this.randomiseShapes = this.DOMElement.querySelector(".randomise-shapes");
			this.randomiseBackground = this.DOMElement.querySelector(".randomise-background");
			this.randomiseAll = this.DOMElement.querySelector(".randomise-all");
			this.shapesArcs = this.DOMElement.querySelector(".shapes-arcs");
			this.shapesCorners = this.DOMElement.querySelector(".shapes-corners");
			this.shapesTriangles = this.DOMElement.querySelector(".shapes-triangles");
			this.shapesLines = this.DOMElement.querySelector(".shapes-lines");
			this.shapesCircles = this.DOMElement.querySelector(".shapes-circles");
			this.shapesAll = this.DOMElement.querySelector(".shapes-all");
			this.speedDisplay = this.DOMElement.querySelector(".speed .js-number-display");
			this.scaleDisplay = this.DOMElement.querySelector(".scale .js-number-display");
			this.reset = this.DOMElement.querySelector(".reset");
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "createListeners",
		value: function createListeners() {
			var _this2 = this;

			this.showCollisions.addEventListener("click", function (e) {
				return _this2.onShowCollisionsClicked(e);
			});
			this.hideCollisions.addEventListener("click", function (e) {
				return _this2.onHideCollisionsClicked(e);
			});
			this.randomiseShapes.addEventListener("click", function (e) {
				return _this2.onRandomiseShapesClicked(e);
			});
			this.randomiseBackground.addEventListener("click", function (e) {
				return _this2.onRandomiseBackgroundClicked(e);
			});
			this.randomiseAll.addEventListener("click", function (e) {
				return _this2.onRandomiseAllClicked(e);
			});
			// Shape selection
			this.shapesArcs.addEventListener("click", function (e) {
				return _this2.onArcsClicked(e);
			});
			this.shapesCorners.addEventListener("click", function (e) {
				return _this2.onCornersClicked(e);
			});
			this.shapesTriangles.addEventListener("click", function (e) {
				return _this2.onTrianglesClicked(e);
			});
			this.shapesLines.addEventListener("click", function (e) {
				return _this2.onLinesClicked(e);
			});
			this.shapesCircles.addEventListener("click", function (e) {
				return _this2.onCirclesClicked(e);
			});
			this.shapesAll.addEventListener("click", function (e) {
				return _this2.onAllShapesClicked(e);
			});
			this.reset.addEventListener("click", function (e) {
				return _this2.onResetClicked(e);
			});
			this.speedProgressBar.addListener(this.speedProgressBar.VALUE_CHANGED, function (e) {
				return _this2.onSpeedChanged(e);
			});
			this.scaleProgressBar.addListener(this.scaleProgressBar.VALUE_CHANGED, function (e) {
				return _this2.onScaleChanged(e);
			});
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "showActive",
		value: function showActive(element) {
			if (element.className.search("active") < 0) {
				element.className += " active";
			}
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "showInactive",
		value: function showInactive(element) {
			element.className = element.className.replace(/ active|active/gi, "");
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "onRandomiseShapesClicked",
		value: function onRandomiseShapesClicked(e) {
			this.trigger(Events.RANDOMISE_SHAPES);
			e.stopPropagation();
			e.preventDefault();
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "onRandomiseBackgroundClicked",
		value: function onRandomiseBackgroundClicked(e) {
			this.trigger(Events.RANDOMISE_BACKGROUND_LINES);
			e.stopPropagation();
			e.preventDefault();
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "onRandomiseAllClicked",
		value: function onRandomiseAllClicked(e) {
			this.trigger(Events.RANDOMISE_ALL);
			e.stopPropagation();
			e.preventDefault();
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "onShowCollisionsClicked",
		value: function onShowCollisionsClicked(e) {
			this.showActive(this.showCollisions);
			this.showInactive(this.hideCollisions);
			this.trigger(Events.ENABLE_DEBUG_MODE);
			e.stopPropagation();
			e.preventDefault();
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "onHideCollisionsClicked",
		value: function onHideCollisionsClicked(e) {
			this.showActive(this.hideCollisions);
			this.showInactive(this.showCollisions);
			this.trigger(Events.DISABLE_DEBUG_MODE);
			e.stopPropagation();
			e.preventDefault();
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "onArcsClicked",
		value: function onArcsClicked(e) {
			this.showActive(this.shapesArcs);
			this.showInactive(this.shapesCorners);
			this.showInactive(this.shapesTriangles);
			this.showInactive(this.shapesLines);
			this.showInactive(this.shapesCircles);
			this.showInactive(this.shapesAll);
			this.trigger(Events.SHOW_ONLY_ARCS);
			e.stopPropagation();
			e.preventDefault();
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "onCornersClicked",
		value: function onCornersClicked(e) {
			this.showInactive(this.shapesArcs);
			this.showActive(this.shapesCorners);
			this.showInactive(this.shapesTriangles);
			this.showInactive(this.shapesLines);
			this.showInactive(this.shapesCircles);
			this.showInactive(this.shapesAll);
			this.trigger(Events.SHOW_ONLY_CORNERS);
			e.stopPropagation();
			e.preventDefault();
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "onTrianglesClicked",
		value: function onTrianglesClicked(e) {
			this.showInactive(this.shapesArcs);
			this.showInactive(this.shapesCorners);
			this.showActive(this.shapesTriangles);
			this.showInactive(this.shapesLines);
			this.showInactive(this.shapesCircles);
			this.showInactive(this.shapesAll);
			this.trigger(Events.SHOW_ONLY_TRIANGLES);
			e.stopPropagation();
			e.preventDefault();
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "onLinesClicked",
		value: function onLinesClicked(e) {
			this.showInactive(this.shapesArcs);
			this.showInactive(this.shapesCorners);
			this.showInactive(this.shapesTriangles);
			this.showActive(this.shapesLines);
			this.showInactive(this.shapesCircles);
			this.showInactive(this.shapesAll);
			this.trigger(Events.SHOW_ONLY_LINES);
			e.stopPropagation();
			e.preventDefault();
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "onCirclesClicked",
		value: function onCirclesClicked(e) {
			this.showInactive(this.shapesArcs);
			this.showInactive(this.shapesCorners);
			this.showInactive(this.shapesTriangles);
			this.showInactive(this.shapesLines);
			this.showActive(this.shapesCircles);
			this.showInactive(this.shapesAll);
			this.trigger(Events.SHOW_ONLY_CIRCLES);
			e.stopPropagation();
			e.preventDefault();
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "onAllShapesClicked",
		value: function onAllShapesClicked(e) {
			this.showInactive(this.shapesArcs);
			this.showInactive(this.shapesCorners);
			this.showInactive(this.shapesTriangles);
			this.showInactive(this.shapesLines);
			this.showInactive(this.shapesCircles);
			this.showActive(this.shapesAll);
			this.trigger(Events.SHOW_ALL_SHAPES);
			e.stopPropagation();
			e.preventDefault();
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "onSpeedChanged",
		value: function onSpeedChanged(e) {
			Settings.MAX_SHAPE_SPEED = this.originalShapeSpeed + this.originalShapeSpeed * (15 * this.speedProgressBar.getPercentage());
			Settings.MAX_ROTATION = this.originalRotationSpeed + this.originalRotationSpeed * (15 * this.speedProgressBar.getPercentage());
			this.speedDisplay.innerHTML = Settings.MAX_SHAPE_SPEED.toFixed(2);
			this.trigger(Events.UPDATE_SHAPE_SPEEDS);
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "onScaleChanged",
		value: function onScaleChanged(e) {
			this.requestedScale = 0.1 + 0.9 * this.scaleProgressBar.getPercentage();
			this.scaleDisplay.innerHTML = this.requestedScale.toFixed(2);
			this.trigger(Events.SCALE_CHANGE_REQUESTED);
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "onResetClicked",
		value: function onResetClicked(e) {
			// Reset progress bars
			if (this.scaleProgressBar.getPercentage() !== 1) {
				this.scaleProgressBar.setProgress(1);
				this.onScaleChanged(e);
			}
			if (this.speedProgressBar.getPercentage() !== 0) {
				this.speedProgressBar.setProgress(0);
				this.onSpeedChanged(e);
			}

			// Reset other settings
			this.onHideCollisionsClicked(e);
			if (this.shapesAll.className.search("active") < 0) {
				this.onAllShapesClicked(e);
			}
			e.stopPropagation();
			e.preventDefault();
		}
	}]);

	return SiteOptions;
}(EventDispatcher);
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
//
////////////////////////////////////////////////////////////////////////////////

var SiteSettings = function () {

	//------------------------------------------------
	// Constructor
	//------------------------------------------------

	function SiteSettings() {
		_classCallCheck(this, SiteSettings);

		this._isTouchDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
		this._isIPhone = /iPhone/i.test(navigator.userAgent);
		if (this._isTouchDevice) {
			document.body.className += " touch";
		}
		this._isIE9 = document.body.className.search(/ie9/i) > -1;
		if (this._isIE9) {
			document.body.className += " ie9";
		}
		this._iDevice = /iPhone|iPad|iPod/i.test(navigator.userAgent);
		this._isFirefox = /firefox/i.test(navigator.userAgent);
		this.maxShapeSpeed = 0.7;
		this.maxRotation = 0.2;
	}

	//------------------------------------------------
	// Getters
	//------------------------------------------------


	_createClass(SiteSettings, [{
		key: "isTouchDevice",
		get: function get() {
			return this._isTouchDevice;
		}
	}, {
		key: "isFirefox",
		get: function get() {
			return this._isFirefox;
		}
	}, {
		key: "isIDevice",
		get: function get() {
			return this._iDevice;
		}
	}, {
		key: "isIPhone",
		get: function get() {
			return this._isIPhone;
		}
	}, {
		key: "IS_IE9",
		get: function get() {
			return this._isIE9;
		}
	}, {
		key: "WORK_NAV_DURATION",
		get: function get() {
			return 400;
		}
	}, {
		key: "WORK_ZOOM_DURATION",
		get: function get() {
			return 600;
		}
	}, {
		key: "MAX_SHAPE_SPEED",
		get: function get() {
			return this.maxShapeSpeed;
		},
		set: function set(value) {
			this.maxShapeSpeed = value;
		}
	}, {
		key: "MAX_ROTATION",
		get: function get() {
			return this.maxRotation;
		},
		set: function set(value) {
			this.maxRotation = value;
		}
	}, {
		key: "MIN_TRANSITION_DURATION",
		get: function get() {
			return 1000;
		}
	}, {
		key: "TRANSITION_MULTIPLIER",
		get: function get() {
			return 800;
		}
	}, {
		key: "ZOOMED_OUT_SCALE",
		get: function get() {
			return 0.8;
		}
	}, {
		key: "NAV_ZOOMED_OUT_SCALE",
		get: function get() {
			return 1.7;
		}
	}]);

	return SiteSettings;
}();
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
//
////////////////////////////////////////////////////////////////////////////////

var BasicShape = function (_EventDispatcher) {
	_inherits(BasicShape, _EventDispatcher);

	//------------------------------------------------
	// Constructor
	//------------------------------------------------

	function BasicShape(DOMElement, color, strokeWidth, scale) {
		_classCallCheck(this, BasicShape);

		// Variables

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(BasicShape).call(this));

		_this.DOMElement = DOMElement;

		_this.frameTimer = null;
		_this.endTime = 0;
		_this.currentTime = 0;
		_this.startTime = 0;
		_this.previousSegments = [];

		_this.shape = null;
		_this._mass = 1;
		_this.selectSpeed();
		_this._angle = Math.random() * 180;
		_this._colliders = [];
		_this.segments = [];
		_this.boundingBox = {};
		_this.segmentPath = "";
		_this.minX = 0;
		_this.minY = 0;
		_this.maxX = 0;
		_this.maxY = 0;
		_this.originX = 0;
		_this.originY = 0;
		_this.effectsShape = null;
		_this.boundingBoxGuide = null;
		_this.segmentGuide = null;
		_this.centerGuide = null;
		return _this;
	}

	//------------------------------------------------
	// Decide how fast this shape should move
	//------------------------------------------------


	_createClass(BasicShape, [{
		key: "selectSpeed",
		value: function selectSpeed() {
			this._xSpeed = Math.random() * (Settings.MAX_SHAPE_SPEED * 2) - Settings.MAX_SHAPE_SPEED;
			this._ySpeed = Math.random() * (Settings.MAX_SHAPE_SPEED * 2) - Settings.MAX_SHAPE_SPEED;

			if (this._xSpeed === 0) this._xSpeed = Math.random() > 0.5 ? -Settings.MAX_SHAPE_SPEED : Settings.MAX_SHAPE_SPEED;
			if (this._ySpeed === 0) this._ySpeed = Math.random() > 0.5 ? -Settings.MAX_SHAPE_SPEED : Settings.MAX_SHAPE_SPEED;
			this._rotationSpeed = Math.random() * (Settings.MAX_ROTATION * 2) - Settings.MAX_ROTATION;
		}

		//------------------------------------------------
		// Start rendering the collision model for this shape
		//------------------------------------------------

	}, {
		key: "showCollisionModel",
		value: function showCollisionModel() {
			this.shape.setAttribute("stroke-opacity", 0);

			this.DOMElement.appendChild(this.boundingBoxGuide);
			this.DOMElement.appendChild(this.centerGuide);
			this.DOMElement.appendChild(this.segmentGuide);
		}

		//------------------------------------------------
		// Hide the collision model for this shape
		//------------------------------------------------

	}, {
		key: "hideCollisionModel",
		value: function hideCollisionModel() {
			this.shape.setAttribute("stroke-opacity", 1);

			if (this.contains(this.boundingBoxGuide)) {
				this.DOMElement.removeChild(this.boundingBoxGuide);
				this.DOMElement.removeChild(this.centerGuide);
				this.DOMElement.removeChild(this.segmentGuide);
			}
		}

		//------------------------------------------------
		// Getters
		//------------------------------------------------

	}, {
		key: "draw",


		//------------------------------------------------
		// Draw the guides if required
		//------------------------------------------------
		value: function draw() {
			this.boundingBoxGuide = document.createElementNS("http://www.w3.org/2000/svg", "rect");
			this.boundingBoxGuide.setAttribute("stroke-width", 2);
			this.boundingBoxGuide.setAttribute("fill", "transparent");
			this.boundingBoxGuide.setAttribute("stroke", "#ff0066");

			this.centerGuide = document.createElementNS("http://www.w3.org/2000/svg", "circle");
			this.centerGuide.setAttribute("r", 10);
			this.centerGuide.setAttribute("fill", "#ff0066");

			this.segmentGuide = document.createElementNS("http://www.w3.org/2000/svg", "path");
			this.segmentGuide.setAttribute("fill", "transparent");
			this.segmentGuide.setAttribute("stroke", "#000000");
			this.segmentGuide.setAttribute("stroke-width", 2);
		}

		//------------------------------------------------
		// Return the x/y co-ordinates of this shape
		//------------------------------------------------

	}, {
		key: "getPosition",
		value: function getPosition() {
			return {
				x: this.x,
				y: this.y
			};
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "hide",
		value: function hide() {
			this.shape.style.strokeOpacity = 0;
		}

		//------------------------------------------------
		//
		//------------------------------------------------

	}, {
		key: "fadeIn",
		value: function fadeIn() {
			NATION.Animation.start(this.shape, { strokeOpacity: 1 }, { forcejs: true, duration: Settings.SHAPE_FADE_DURATION });
		}

		//------------------------------------------------
		// IE-friendly version of Node.contains
		//------------------------------------------------

	}, {
		key: "contains",
		value: function contains(target) {
			if (!this.DOMElement.contains) {
				return this.DOMElement === target || Boolean(this.DOMElement.compareDocumentPosition(target) & 16);
			} else {
				return this.DOMElement.contains(target);
			}
		}

		//------------------------------------------------
		// Increment the current rotation
		//------------------------------------------------

	}, {
		key: "updateRotation",
		value: function updateRotation() {
			this._angle += this._rotationSpeed;
			if (this._angle > 360) this._angle = 0;
			if (this._angle < 0) this._angle = 360;
		}

		//------------------------------------------------
		// Currently colliding with passed shape
		//------------------------------------------------

	}, {
		key: "addCollider",
		value: function addCollider(shape) {
			if (this._colliders.indexOf(shape) < 0) {
				this._colliders.push(shape);
			}
		}

		//------------------------------------------------
		// No longer colliding with passed shape
		//------------------------------------------------

	}, {
		key: "removeCollider",
		value: function removeCollider(shape) {
			for (var i = 0, length = this._colliders.length; i < length; i++) {
				if (this._colliders[i] === shape) {
					this._colliders.splice(i, 1);
				}
			}
		}

		//------------------------------------------------
		// Set new x/y co-ordinate
		//------------------------------------------------

	}, {
		key: "setPosition",
		value: function setPosition(x, y) {
			this.x = x;
			this.y = y;
		}

		//------------------------------------------------
		// Returns x/y/width/height in an object
		//------------------------------------------------

	}, {
		key: "getBoundingBox",
		value: function getBoundingBox() {
			return this.boundingBox;
		}

		//------------------------------------------------
		// Returns an array of line segments
		// Each is an object of x1,y1,x2,y2
		//------------------------------------------------

	}, {
		key: "getLineSegments",
		value: function getLineSegments() {
			return this.segments;
		}

		//------------------------------------------------
		// Return an array of the line segments for the shape
		// as it was in the previous frame
		//------------------------------------------------

	}, {
		key: "getPreviousLineSegments",
		value: function getPreviousLineSegments() {
			return this.previousSegments;
		}

		//------------------------------------------------
		// Check the stage bounds for collisions
		//------------------------------------------------

	}, {
		key: "update",
		value: function update() {
			this.x += this._xSpeed;
			this.y += this._ySpeed;
			this.updateRotation();
			this.setPosition(this.x, this.y);
		}

		//------------------------------------------------
		// Remove this shape from the DOM
		//------------------------------------------------

	}, {
		key: "destroy",
		value: function destroy() {
			var _this2 = this;

			var immediate = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

			this.hideCollisionModel();
			if (this.contains(this.shape)) {
				if (!immediate) {
					NATION.Animation.start(this.shape, { opacity: 1 }, { duration: 100, easing: "easeInOutQuad" }, function (e) {
						return _this2.onShapeHidden(e);
					});
				} else {
					this.onShapeHidden();
				}
			}
			if (this.contains(this.effectsShape)) {
				this.DOMElement.removeChild(this.effectsShape);
			}
		}

		//------------------------------------------------
		// Remove this shape from the DOM
		//------------------------------------------------

	}, {
		key: "onShapeHidden",
		value: function onShapeHidden() {
			NATION.Animation.stop(this.shape);
			this.DOMElement.removeChild(this.shape);
		}

		//------------------------------------------------
		// Add the shape to the DOM
		//------------------------------------------------

	}, {
		key: "addToStage",
		value: function addToStage() {
			this.DOMElement.appendChild(this.shape);
			this.shape.style.strokeWidth = this.strokeWidth / 2;
			this.shape.style.opacity = 0;
			NATION.Animation.start(this.shape, { opacity: 1, strokeWidth: this.strokeWidth }, { duration: 1000, easing: "easeInOutQuad" });
			//this.DOMElement.appendChild(this.boundingBoxGuide);
			//this.DOMElement.appendChild(this.centerGuide);
			//this.DOMElement.appendChild(this.segmentGuide);
		}

		//------------------------------------------------
		// Show a visual effect after a collision, and request
		// for a sound to be played by the audio manager
		//------------------------------------------------

	}, {
		key: "collide",
		value: function collide(stagePercentage, bgImpact) {
			var _this3 = this;

			// Play the visual impact effect if we're not rendering the bounding box
			if (this.effectsShape && !this.contains(this.boundingBoxGuide)) {
				if (this.frameTimer) {
					cancelAnimationFrame(this.frameTimer);
				}
				this.endTime = Date.now() + 300;
				this.currentTime = this.startTime = Date.now();
				this.DOMElement.insertBefore(this.effectsShape, this.shape);
				this.frameTimer = requestAnimationFrame(function () {
					return _this3.animateCollision();
				});
			}
			// Play this shape's sound effect via the central audio manager
			this.playCollisionSound(stagePercentage, bgImpact);
		}

		//------------------------------------------------
		// Get the audio manager to play this shape's collision sound
		//------------------------------------------------

	}, {
		key: "playCollisionSound",
		value: function playCollisionSound(percentage, bgImpact) {}
		//AudioManager.playSound(this.audioID, percentage, bgImpact);


		//------------------------------------------------
		// Progress the collision animation until complete
		//------------------------------------------------

	}, {
		key: "animateCollision",
		value: function animateCollision() {
			var _this4 = this;

			this.currentTime = Date.now();
			var progress = (this.currentTime - this.startTime) / (this.endTime - this.startTime);
			if (progress > 1) progress = 1;

			var newWidth = this.strokeWidth + this.strokeWidth * 0.6 * progress;

			this.effectsShape.setAttribute("stroke-width", newWidth);
			this.effectsShape.setAttribute("stroke-opacity", 0.9 * (1 - progress));

			if (progress < 1) {
				this.frameTimer = requestAnimationFrame(function () {
					return _this4.animateCollision();
				});
			} else {
				if (this.contains(this.effectsShape)) {
					this.DOMElement.removeChild(this.effectsShape);
				}
				cancelAnimationFrame(this.frameTimer);
			}
		}
	}, {
		key: "color",
		get: function get() {
			return this._color;
		}
	}, {
		key: "xSpeed",
		get: function get() {
			return this._xSpeed;
		},


		//------------------------------------------------
		// Setters
		//------------------------------------------------
		set: function set(value) {
			this._xSpeed = value;
		}
	}, {
		key: "ySpeed",
		get: function get() {
			return this._ySpeed;
		},
		set: function set(value) {
			this._ySpeed = value;
		}
	}, {
		key: "mass",
		get: function get() {
			return this._mass;
		},
		set: function set(value) {
			this.mass = value;
		}
	}, {
		key: "rotationSpeed",
		get: function get() {
			return this._rotationSpeed;
		},
		set: function set(value) {
			this._rotationSpeed = value;
		}
	}, {
		key: "angle",
		get: function get() {
			return this._angle;
		},
		set: function set(value) {
			this._angle = value;
		}
	}, {
		key: "colliders",
		get: function get() {
			return this._colliders;
		}
	}, {
		key: "origin",
		get: function get() {
			return {
				x: this.originX,
				y: this.originY
			};
		}
	}, {
		key: "width",
		get: function get() {
			return this.halfWidth * 2;
		}
	}, {
		key: "center",
		get: function get() {
			return {
				x: this.boundingBox.x + this.boundingBox.width / 2,
				y: this.boundingBox.y + this.boundingBox.height / 2
			};
		}
	}]);

	return BasicShape;
}(EventDispatcher);
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
//
////////////////////////////////////////////////////////////////////////////////

var ArcShape = function (_BasicShape) {
	_inherits(ArcShape, _BasicShape);

	//------------------------------------------------
	// Constructor
	//------------------------------------------------

	function ArcShape(DOMElement, color, strokeWidth, scale) {
		_classCallCheck(this, ArcShape);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ArcShape).call(this));

		_this.DOMElement = DOMElement;
		_this._color = color;

		_this.originalHalfWidth = 140;
		_this.halfWidth = scale * _this.originalHalfWidth;

		_this.strokeWidth = strokeWidth;
		_this.shape = null;
		_this.x = 0;
		_this.y = 0;
		_this.scale = scale;
		_this.boundingBoxGuide = null;
		_this.segmentGuide = null;
		_this.centerGuide = null;

		_this.arcStart = {};
		_this.arcEnd = {};

		_this.radius = Math.random() > 0.7 ? 140 : 140 + Math.random() * 140;

		_this.draw();

		return _this;
	}

	//------------------------------------------------
	// Create the required SVG elements
	//------------------------------------------------


	_createClass(ArcShape, [{
		key: "draw",
		value: function draw() {
			this.shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
			var path = "M " + this.x + " " + (this.y + this.halfWidth) + " A " + this.radius * this.scale + " " + this.radius * this.scale + " 0 0 1 ";
			path += this.x + this.halfWidth * 2 + " " + (this.y + this.halfWidth);
			this.shape.setAttribute("d", path);
			this.shape.setAttribute("fill", "transparent");
			this.shape.setAttribute("stroke", this.color);
			this.shape.setAttribute("stroke-width", this.strokeWidth);

			this.effectsShape = document.createElementNS("http://www.w3.org/2000/svg", "path");
			this.effectsShape.setAttribute("stroke-width", this.strokeWidth);
			this.effectsShape.setAttribute("stroke-linecap", "butt");
			this.effectsShape.setAttribute("stroke", this.color);
			this.effectsShape.setAttribute("fill", "transparent");

			_get(Object.getPrototypeOf(ArcShape.prototype), "draw", this).call(this);
		}

		//------------------------------------------------
		// Change the x/y co-ordinates of the shape as a whole
		//------------------------------------------------

	}, {
		key: "setPosition",
		value: function setPosition(x, y) {
			_get(Object.getPrototypeOf(ArcShape.prototype), "setPosition", this).call(this, x, y);

			this.originX = x + this.halfWidth;
			this.originY = y + this.halfWidth / 2;

			// We need to build the collision model first, because where that line starts and ends
			// is where the visible arc has to start and end. The buildCollisionModel method stores
			// the Y pos of the first point as this.arcStart.y, and the Y pos of the last point as this.arcEndY
			this.buildCollisionModel();

			var tempX1 = 0;
			var tempY1 = 0;
			var tempX2 = 0;
			var tempY2 = 0;

			var path = "M ";
			var effectsPath = "M ";

			var angle = Math.abs(this._angle * Math.PI / 180.0);

			var testX = this.x;
			// Here we use the startY worked out by buildCollisionModel
			var testY = this.arcStart.y;
			tempX1 = Math.cos(angle) * (testX - this.originX) - Math.sin(angle) * (testY - this.originY) + this.originX;
			tempY1 = Math.sin(angle) * (testX - this.originX) + Math.cos(angle) * (testY - this.originY) + this.originY;
			path += tempX1 + " " + tempY1 + " A " + this.radius * this.scale + " " + this.radius * this.scale + " 0 0 1 ";
			testX = this.x + this.halfWidth * 2;
			// Here we use the endY worked out by buildCollisionModel
			testY = this.arcEnd.y;
			tempX2 = Math.cos(angle) * (testX - this.originX) - Math.sin(angle) * (testY - this.originY) + this.originX;
			tempY2 = Math.sin(angle) * (testX - this.originX) + Math.cos(angle) * (testY - this.originY) + this.originY;

			path += tempX2 + " " + tempY2;
			this.shape.setAttribute("d", path);

			this.effectsShape.setAttribute("d", path);
		}

		//------------------------------------------------
		// Recalculate the collision model, which is a series
		// of straight line segments running around the outside
		// of the arc
		//------------------------------------------------

	}, {
		key: "buildCollisionModel",
		value: function buildCollisionModel() {
			var minX = 0;
			var minY = 0;
			var maxX = 0;
			var maxY = 0;
			var point1 = {};
			var point2 = {};

			// We need to find the angle of the circle that the resulting arc represents
			// This involves basic trig, eg. https://www.mathsisfun.com/algebra/trig-solving-sss-triangles.html
			// First we find the length of the line between the start and end points (horizontal)
			var thisAngle = this.halfWidth * 2;
			// Then we use trig to find the angle of the pie section at the circle's centre
			// The angle of the circle that the arc represents will always be the same as this.
			var scaledRadius = this.radius * this.scale;
			thisAngle = (Math.pow(scaledRadius, 2) + Math.pow(scaledRadius, 2) - Math.pow(thisAngle, 2)) / (2 * scaledRadius * scaledRadius);
			thisAngle = Math.acos(thisAngle) * 180 / Math.PI;
			// Now we can use this angle to work out where the arc's collision segments should be positioned
			// The maths is easy when we've got half a circle (180 degrees angle), but otherwise we need to offset the start and end positions
			// This keeps the arc centred, we just have to work out how far off -180 the start needs to be

			var requiredSegments = 8;
			// Make sure the guide arc starts in the right place
			var start = -(thisAngle / 2) - 90;
			var end = -(thisAngle / 2) - 90;
			var line = {};
			// Store the previous frame's segment data
			this.previousSegments = this.segments;
			this.segments = [];
			var guidePath = "";
			// Convert angle to radians, since cos/sin take radians as their arg
			var angle = this._angle * Math.PI / 180.0;

			var arcCenterX = this.x + this.halfWidth;
			var arcCenterY = this.originY + scaledRadius;

			var radius = scaledRadius + this.strokeWidth / 2;
			var rotatedArcStart = {};

			for (var i = 0; i < requiredSegments; i++) {
				start = end;
				end = start + thisAngle / requiredSegments;
				// Work out positions needed for the actual green arc drawing
				// These remain un-rotated for now
				if (i === 0) {
					this.arcStart = {
						x: parseInt(arcCenterX + scaledRadius * Math.cos(Math.PI * start / 180)),
						y: parseInt(arcCenterY + scaledRadius * Math.sin(Math.PI * start / 180))
					};
				} else if (i === requiredSegments - 1) {
					this.arcEnd = {
						x: parseInt(arcCenterX + scaledRadius * Math.cos(Math.PI * end / 180)),
						y: parseInt(arcCenterY + scaledRadius * Math.sin(Math.PI * end / 180))
					};
				}
				line = {};
				// Centre of circle + radius + cos or sin of angle in radians (Math.PI * angle in degrees / 180)
				var testX1 = parseInt(arcCenterX + radius * Math.cos(Math.PI * start / 180));
				var testY1 = parseInt(arcCenterY + radius * Math.sin(Math.PI * start / 180));
				var testX2 = parseInt(arcCenterX + radius * Math.cos(Math.PI * end / 180));
				var testY2 = parseInt(arcCenterY + radius * Math.sin(Math.PI * end / 180));
				point1 = this.rotateCoords(testX1, testY1, angle);
				point2 = this.rotateCoords(testX2, testY2, angle);

				// Store the rotated start position of the outer arc
				if (i === 0) {
					rotatedArcStart = point1;
				}

				// Store the new line values
				line.x1 = point1.x;
				line.x2 = point2.x;
				line.y1 = point1.y;
				line.y2 = point2.y;

				// Build the guide path
				if (i === 0) {
					guidePath = "M " + line.x1 + " " + line.y1 + " L " + line.x2 + " " + line.y2;
				} else {
					guidePath += " L " + line.x2 + " " + line.y2;
				}

				// Update min/max values for the bounding box
				if (i === 0) {
					minX = maxX = line.x1;
					minY = maxY = line.y1;
				}
				if (line.x1 < minX) minX = line.x1;
				if (line.x2 < minX) minX = line.x2;
				if (line.x1 > maxX) maxX = line.x1;
				if (line.x2 > maxX) maxX = line.x2;

				if (line.y1 < minY) minY = line.y1;
				if (line.y2 < minY) minY = line.y2;
				if (line.y1 > maxY) maxY = line.y1;
				if (line.y2 > maxY) maxY = line.y2;

				// Add to the segments array
				this.segments.push(line);
			}

			// Create a line joining the two arcs on the right side (the bottom of the arc)
			var x1 = parseInt(arcCenterX + radius * Math.cos(Math.PI * end / 180));
			var y1 = parseInt(arcCenterY + radius * Math.sin(Math.PI * end / 180));
			var joinPoint1 = this.rotateCoords(x1, y1, angle);
			var joinPoint2 = {};

			// Now draw the inner arc
			radius = scaledRadius - this.strokeWidth / 2;
			for (var _i = requiredSegments; _i > 0; _i--) {
				start = end;
				end = start - thisAngle / requiredSegments;
				// Work out positions needed for the actual green arc drawing
				// These remain un-rotated for now
				line = {};
				// Centre of circle + radius + cos or sin of angle in radians (Math.PI * angle in degrees / 180)
				var _testX = parseInt(arcCenterX + radius * Math.cos(Math.PI * start / 180));
				var _testY = parseInt(arcCenterY + radius * Math.sin(Math.PI * start / 180));
				var _testX2 = parseInt(arcCenterX + radius * Math.cos(Math.PI * end / 180));
				var _testY2 = parseInt(arcCenterY + radius * Math.sin(Math.PI * end / 180));
				point1 = this.rotateCoords(_testX, _testY, angle);
				point2 = this.rotateCoords(_testX2, _testY2, angle);

				// Create the joining line between the two arcs
				if (_i === requiredSegments) {
					joinPoint2 = point1;
					var joinLine = {
						x1: joinPoint1.x,
						y1: joinPoint1.y,
						x2: joinPoint2.x,
						y2: joinPoint2.y
					};
					guidePath += " L " + joinLine.x2 + " " + joinLine.y2;
					this.segments.push(joinLine);
				}
				// Store the new line values
				line.x1 = point1.x;
				line.x2 = point2.x;
				line.y1 = point1.y;
				line.y2 = point2.y;

				// Build the guide path
				if (_i === 0) {
					guidePath = "M " + line.x1 + " " + line.y1 + " L " + line.x2 + " " + line.y2;
				} else {
					guidePath += " L " + line.x2 + " " + line.y2;
				}

				// Update min/max values for the bounding box
				if (_i === 0) {
					minX = maxX = line.x1;
					minY = maxY = line.y1;
				}
				if (line.x1 < minX) minX = line.x1;
				if (line.x2 < minX) minX = line.x2;
				if (line.x1 > maxX) maxX = line.x1;
				if (line.x2 > maxX) maxX = line.x2;

				if (line.y1 < minY) minY = line.y1;
				if (line.y2 < minY) minY = line.y2;
				if (line.y1 > maxY) maxY = line.y1;
				if (line.y2 > maxY) maxY = line.y2;

				// Add to the segments array
				this.segments.push(line);

				// If this is the end of the second arc, join back up to the first one
				if (_i === 1) {
					joinPoint2 = point2;
					var _joinLine = {
						x1: joinPoint2.x,
						y1: joinPoint2.y,
						x2: rotatedArcStart.x,
						y2: rotatedArcStart.y
					};
					guidePath += " L " + _joinLine.x2 + " " + _joinLine.y2;
					this.segments.push(_joinLine);
				}
			}

			this.segmentGuide.setAttribute("d", guidePath);

			// Generate the bounding box
			this.boundingBox.x = minX;
			this.boundingBox.y = minY;

			this.boundingBox.width = maxX - minX;
			this.boundingBox.height = maxY - minY;

			this.boundingBoxGuide.setAttribute("x", this.boundingBox.x);
			this.boundingBoxGuide.setAttribute("y", this.boundingBox.y);
			this.boundingBoxGuide.setAttribute("width", this.boundingBox.width);
			this.boundingBoxGuide.setAttribute("height", this.boundingBox.height);

			this.centerGuide.setAttribute("cx", this.originX);
			this.centerGuide.setAttribute("cy", this.originY);
		}

		//------------------------------------------------
		// Work out the co-ordinates of a point after being
		// rotated by a given angle around the shape's origin
		//------------------------------------------------

	}, {
		key: "rotateCoords",
		value: function rotateCoords(x, y, angle) {
			var rotatedX = Math.cos(angle) * (x - this.originX) - Math.sin(angle) * (y - this.originY) + this.originX;
			var rotatedY = Math.sin(angle) * (x - this.originX) + Math.cos(angle) * (y - this.originY) + this.originY;
			return {
				x: rotatedX,
				y: rotatedY
			};
		}

		//------------------------------------------------
		// Change the radius of the arc to suit the current
		// browser dimensions, and change the stroke width
		//------------------------------------------------

	}, {
		key: "resize",
		value: function resize(strokeWidth, scale) {
			this.strokeWidth = strokeWidth;
			this.halfWidth = this.originalHalfWidth * scale;
			this.scale = scale;
			this.shape.setAttribute("stroke-width", this.strokeWidth);
			this.shape.style.strokeWidth = this.strokeWidth;
		}
	}]);

	return ArcShape;
}(BasicShape);
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
//
////////////////////////////////////////////////////////////////////////////////

var CircleShape = function (_BasicShape) {
	_inherits(CircleShape, _BasicShape);

	//------------------------------------------------
	// Constructor
	//------------------------------------------------

	function CircleShape(DOMElement, color, strokeWidth, scale) {
		_classCallCheck(this, CircleShape);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(CircleShape).call(this));

		_this.DOMElement = DOMElement;
		_this._color = color;
		_this.x = 0;
		_this.y = 0;

		_this.originalHalfWidth = 80;
		_this.halfWidth = scale * _this.originalHalfWidth;
		_this.strokeWidth = strokeWidth;

		_this.draw();
		return _this;
	}

	//------------------------------------------------
	// Create the required SVG elements
	//------------------------------------------------


	_createClass(CircleShape, [{
		key: "draw",
		value: function draw() {
			this.shape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
			this.shape.setAttribute("fill", "transparent");
			this.shape.setAttribute("stroke", this.color);
			this.shape.setAttribute("stroke-width", this.strokeWidth);
			this.shape.setAttribute("r", this.halfWidth);

			this.effectsShape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
			this.effectsShape.setAttribute("stroke-width", this.strokeWidth);
			this.effectsShape.setAttribute("stroke-linecap", "butt");
			this.effectsShape.setAttribute("stroke", this.color);
			this.effectsShape.setAttribute("fill", "transparent");
			this.effectsShape.setAttribute("r", this.halfWidth);

			_get(Object.getPrototypeOf(CircleShape.prototype), "draw", this).call(this);
		}

		//------------------------------------------------
		// Change the x/y position of the circle's center
		//------------------------------------------------

	}, {
		key: "setPosition",
		value: function setPosition(x, y) {
			_get(Object.getPrototypeOf(CircleShape.prototype), "setPosition", this).call(this, x, y);
			this.shape.setAttribute("cx", x);
			this.shape.setAttribute("cy", y);
			this.effectsShape.setAttribute("cx", x);
			this.effectsShape.setAttribute("cy", y);
			this.buildCollisionModel();
		}

		//------------------------------------------------
		// Calculate the straight line segments that should
		// run around the outside of the circle, that will
		// form the collision model for this shape
		//------------------------------------------------

	}, {
		key: "buildCollisionModel",
		value: function buildCollisionModel() {
			var tempX1 = 0;
			var tempX2 = 0;
			var tempY1 = 0;
			var tempY2 = 0;
			// Increase this number to increase accuracy (less is better for performance)
			var requiredSegments = 12;
			// Make sure the guide arc starts in the right place
			var start = -180;
			var end = -180;
			var line = {};
			// Store the previous frame's segment data
			this.previousSegments = this.segments;
			this.segments = [];
			var guidePath = "";
			// Convert angle to radians, since cos/sin take radians as their arg
			var angle = this._angle * Math.PI / 180.0;
			for (var i = 0; i < requiredSegments; i++) {
				start = end;
				end = start + 360 / requiredSegments;
				line = {};
				line.x1 = parseInt(this.x + (this.halfWidth + this.strokeWidth / 2) * Math.cos(Math.PI * start / 180));
				line.y1 = parseInt(this.y + (this.halfWidth + this.strokeWidth / 2) * Math.sin(Math.PI * start / 180));
				line.x2 = parseInt(this.x + (this.halfWidth + this.strokeWidth / 2) * Math.cos(Math.PI * end / 180));
				line.y2 = parseInt(this.y + (this.halfWidth + this.strokeWidth / 2) * Math.sin(Math.PI * end / 180));
				// Build the guide path
				if (i === 0) {
					guidePath = "M " + line.x1 + " " + line.y1 + " L " + line.x2 + " " + line.y2;
				} else {
					guidePath += " L " + line.x2 + " " + line.y2;
				}
				// Add to the segments array
				this.segments.push(line);
			}
			this.segmentGuide.setAttribute("d", guidePath);

			// Update bounding box
			this.boundingBox.x = this.x - (this.halfWidth + this.strokeWidth / 2);
			this.boundingBox.y = this.y - (this.halfWidth + this.strokeWidth / 2);
			this.boundingBox.width = this.halfWidth * 2 + this.strokeWidth;
			this.boundingBox.height = this.boundingBox.width;
			// Update bounding box guide
			this.boundingBoxGuide.setAttribute("x", this.boundingBox.x);
			this.boundingBoxGuide.setAttribute("y", this.boundingBox.y);
			this.boundingBoxGuide.setAttribute("width", this.boundingBox.width);
			this.boundingBoxGuide.setAttribute("height", this.boundingBox.height);
			// Update the center point guide
			this.centerGuide.setAttribute("cx", this.x);
			this.centerGuide.setAttribute("cy", this.y);
		}

		//------------------------------------------------
		// Change the circle radius to match the current browser
		// dimensions, and change the stroke width
		//------------------------------------------------

	}, {
		key: "resize",
		value: function resize(strokeWidth, scale) {
			this.strokeWidth = strokeWidth;
			this.halfWidth = this.originalHalfWidth * scale;
			this.shape.setAttribute("r", this.halfWidth);
			this.shape.setAttribute("stroke-width", this.strokeWidth);
			this.shape.style.strokeWidth = this.strokeWidth;

			this.effectsShape.setAttribute("r", this.halfWidth);
			this.effectsShape.setAttribute("stroke-width", this.strokeWidth);
		}
	}]);

	return CircleShape;
}(BasicShape);
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
//
////////////////////////////////////////////////////////////////////////////////

var LineShape = function (_BasicShape) {
		_inherits(LineShape, _BasicShape);

		//------------------------------------------------
		// Constructor
		//------------------------------------------------

		function LineShape(DOMElement, color, strokeWidth, scale) {
				_classCallCheck(this, LineShape);

				var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(LineShape).call(this));

				_this.DOMElement = DOMElement;
				_this._color = color;

				_this.originalHalfWidth = 150;
				_this.halfWidth = scale * _this.originalHalfWidth;
				_this.strokeWidth = strokeWidth;

				_this.draw();
				return _this;
		}

		//------------------------------------------------
		// Create the required SVG elements
		//------------------------------------------------


		_createClass(LineShape, [{
				key: "draw",
				value: function draw() {
						this.shape = document.createElementNS("http://www.w3.org/2000/svg", "line");
						this.shape.setAttribute("fill", "transparent");
						this.shape.setAttribute("stroke", this.color);
						this.shape.setAttribute("stroke-width", this.strokeWidth);

						this.effectsShape = document.createElementNS("http://www.w3.org/2000/svg", "line");
						this.effectsShape.setAttribute("fill", "transparent");
						this.effectsShape.setAttribute("stroke-linecap", "butt");
						this.effectsShape.setAttribute("stroke", this.color);
						this.effectsShape.setAttribute("stroke-width", this.strokeWidth);

						_get(Object.getPrototypeOf(LineShape.prototype), "draw", this).call(this);
				}

				//------------------------------------------------
				// Change the x/y position of the shape
				//------------------------------------------------

		}, {
				key: "setPosition",
				value: function setPosition(x, y) {
						_get(Object.getPrototypeOf(LineShape.prototype), "setPosition", this).call(this, x, y);

						// Perform rotation
						var angle = this._angle * Math.PI / 180.0;

						var x1 = x;
						var x2 = x + this.halfWidth * 2;
						var y1 = y;
						var y2 = y;

						this.originX = x + this.halfWidth;
						this.originY = y;

						var tempx1 = Math.cos(angle) * (x1 - this.originX) - Math.sin(angle) * (y1 - this.originY) + this.originX;
						var tempy1 = Math.sin(angle) * (x1 - this.originX) + Math.cos(angle) * (y1 - this.originY) + this.originY;

						var tempx2 = Math.cos(angle) * (x2 - this.originX) - Math.sin(angle) * (y2 - this.originY) + this.originX;
						var tempy2 = Math.sin(angle) * (x2 - this.originX) + Math.cos(angle) * (y2 - this.originY) + this.originY;

						this.shape.setAttribute("x1", tempx1);
						this.shape.setAttribute("x2", tempx2);
						this.shape.setAttribute("y1", tempy1);
						this.shape.setAttribute("y2", tempy2);
						this.effectsShape.setAttribute("x1", tempx1);
						this.effectsShape.setAttribute("x2", tempx2);
						this.effectsShape.setAttribute("y1", tempy1);
						this.effectsShape.setAttribute("y2", tempy2);

						// Work out the bounding box
						var boxX = tempx1 < tempx2 ? tempx1 : tempx2;
						var boxY = tempy1 < tempy2 ? tempy1 : tempy2;
						var width = tempx1 < tempx2 ? tempx2 - tempx1 : tempx1 - tempx2;
						var height = tempy1 < tempy2 ? tempy2 - tempy1 : tempy1 - tempy2;
						angle = this._angle > 180 ? this._angle - 180 : this._angle;
						angle = Math.abs(angle * Math.PI / 180.0);

						this.createLineSegments(angle, this.originX, this.originY);
						this.updateBoundingBox();

						this.centerGuide.setAttribute("cx", this.originX);
						this.centerGuide.setAttribute("cy", this.originY);
				}

				//------------------------------------------------
				// Update the bounding box rect
				//------------------------------------------------

		}, {
				key: "updateBoundingBox",
				value: function updateBoundingBox() {
						this.boundingBox = {
								x: this.minX,
								y: this.minY,
								width: this.maxX - this.minX,
								height: this.maxY - this.minY
						};
						this.boundingBoxGuide.setAttribute("x", this.boundingBox.x);
						this.boundingBoxGuide.setAttribute("y", this.boundingBox.y);
						this.boundingBoxGuide.setAttribute("width", this.boundingBox.width);
						this.boundingBoxGuide.setAttribute("height", this.boundingBox.height);
				}

				//------------------------------------------------
				// Recalculate the x/y of all points based on current
				// shape x/y, and angle of rotation
				//------------------------------------------------

		}, {
				key: "createLineSegments",
				value: function createLineSegments(angle, originX, originY) {
						// Store the previous frame's segment data
						this.previousSegments = this.segments;
						this.segments = [];
						this.segmentPath = "";
						var x1 = 0,
						    y1 = 0,
						    x2 = 0,
						    y2 = 0;
						this.minX = 0;this.minY = 0;this.maxX = 0;this.maxY = 0;

						x1 = this.x;
						y1 = this.y - this.strokeWidth / 2;
						x2 = this.x + this.halfWidth * 2;
						y2 = y1;
						this.addSegment(x1, y1, x2, y2, angle, originX, originY);

						x1 = x2;
						y1 = y2;
						x2 = x2;
						y2 = this.y + this.strokeWidth / 2;
						this.addSegment(x1, y1, x2, y2, angle, originX, originY);

						x1 = x2;
						y1 = y2;
						x2 = this.x;
						y2 = y2;
						this.addSegment(x1, y1, x2, y2, angle, originX, originY);

						x1 = x2;
						y1 = y2;
						x2 = x2;
						y2 = this.y - this.strokeWidth / 2;
						this.addSegment(x1, y1, x2, y2, angle, originX, originY);

						this.segmentGuide.setAttribute("d", this.segmentPath);
				}

				//------------------------------------------------
				// Calculate the position of a point after being rotated
				// by a given angle around the shape's origin
				//------------------------------------------------

		}, {
				key: "addSegment",
				value: function addSegment(x1, y1, x2, y2, angle, originX, originY) {
						var tempx1 = Math.cos(angle) * (x1 - originX) - Math.sin(angle) * (y1 - originY) + originX;
						var tempy1 = Math.sin(angle) * (x1 - originX) + Math.cos(angle) * (y1 - originY) + originY;
						var tempx2 = Math.cos(angle) * (x2 - originX) - Math.sin(angle) * (y2 - originY) + originX;
						var tempy2 = Math.sin(angle) * (x2 - originX) + Math.cos(angle) * (y2 - originY) + originY;
						// Set the min/max values to that of the first point, if they have yet to be set
						if (this.minX === 0 && this.minY === 0 && this.maxX === 0 && this.maxY === 0) {
								this.minX = this.maxX = tempx1;
								this.minY = this.maxY = tempy1;
						}
						// Add this new line to the collision segments
						this.segments.push({ x1: tempx1, y1: tempy1, x2: tempx2, y2: tempy2 });
						if (this.segmentPath === "") {
								this.segmentPath = "M " + tempx1 + " " + tempy1;
						}
						this.segmentPath += " L " + tempx2 + " " + tempy2;

						// Update min/max values
						if (tempx1 < this.minX) this.minX = tempx1;
						if (tempx2 < this.minX) this.minX = tempx2;
						if (tempy1 < this.minY) this.minY = tempy1;
						if (tempy2 < this.minY) this.minY = tempy2;

						if (tempx1 > this.maxX) this.maxX = tempx1;
						if (tempx2 > this.maxX) this.maxX = tempx2;
						if (tempy1 > this.maxY) this.maxY = tempy1;
						if (tempy2 > this.maxY) this.maxY = tempy2;
				}

				//------------------------------------------------
				// Change the width of the shape and it's stroke width
				//------------------------------------------------

		}, {
				key: "resize",
				value: function resize(strokeWidth, scale) {
						this.strokeWidth = strokeWidth;
						this.halfWidth = this.originalHalfWidth * scale;
						this.shape.setAttribute("stroke-width", this.strokeWidth);
						this.shape.style.strokeWidth = this.strokeWidth;
						// We don't update the width of the effects shape stroke here,
						// since it could be currently animating
				}
		}]);

		return LineShape;
}(BasicShape);
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
//
////////////////////////////////////////////////////////////////////////////////

var LShape = function (_BasicShape) {
		_inherits(LShape, _BasicShape);

		//------------------------------------------------
		// Constructor
		//------------------------------------------------

		function LShape(DOMElement, color, strokeWidth, scale) {
				_classCallCheck(this, LShape);

				// Variables

				var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(LShape).call(this));

				_this.DOMElement = DOMElement;
				_this._color = color;

				_this.originalHalfWidth = 100;
				_this.halfWidth = scale * _this.originalHalfWidth;
				_this.strokeWidth = strokeWidth;

				_this.draw();
				return _this;
		}

		//------------------------------------------------
		// Draw the required svg elements
		//------------------------------------------------


		_createClass(LShape, [{
				key: "draw",
				value: function draw() {
						this.shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
						this.shape.setAttribute("fill", "transparent");
						this.shape.setAttribute("stroke-width", this.strokeWidth);
						this.shape.setAttribute("stroke", this.color);

						this.effectsShape = document.createElementNS("http://www.w3.org/2000/svg", "path");
						this.effectsShape.setAttribute("fill", "transparent");
						this.effectsShape.setAttribute("stroke-linecap", "butt");
						this.effectsShape.setAttribute("stroke-width", this.strokeWidth);
						this.effectsShape.setAttribute("stroke", this.color);
						_get(Object.getPrototypeOf(LShape.prototype), "draw", this).call(this);
				}

				//------------------------------------------------
				// Calculate the rotated x/y co-ordinates, and
				// store in the segment array
				//------------------------------------------------

		}, {
				key: "addSegment",
				value: function addSegment(x1, y1, x2, y2, angle, originX, originY) {
						var tempx1 = Math.cos(angle) * (x1 - originX) - Math.sin(angle) * (y1 - originY) + originX;
						var tempy1 = Math.sin(angle) * (x1 - originX) + Math.cos(angle) * (y1 - originY) + originY;
						var tempx2 = Math.cos(angle) * (x2 - originX) - Math.sin(angle) * (y2 - originY) + originX;
						var tempy2 = Math.sin(angle) * (x2 - originX) + Math.cos(angle) * (y2 - originY) + originY;
						this.segments.push({ x1: tempx1, y1: tempy1, x2: tempx2, y2: tempy2 });

						// Set the min/max values to that of the first point, if they have yet to be set
						if (this.minX === 0 && this.minY === 0 && this.maxX === 0 && this.maxY === 0) {
								this.minX = this.maxX = tempx1;
								this.minY = this.maxY = tempy1;
						}

						if (this.segmentPath === "") {
								this.segmentPath = "M " + tempx1 + " " + tempy1;
						}
						this.segmentPath += " L " + tempx2 + " " + tempy2;

						// Update min/max values
						if (tempx1 < this.minX) this.minX = tempx1;
						if (tempx2 < this.minX) this.minX = tempx2;
						if (tempy1 < this.minY) this.minY = tempy1;
						if (tempy2 < this.minY) this.minY = tempy2;

						if (tempx1 > this.maxX) this.maxX = tempx1;
						if (tempx2 > this.maxX) this.maxX = tempx2;
						if (tempy1 > this.maxY) this.maxY = tempy1;
						if (tempy2 > this.maxY) this.maxY = tempy2;
				}

				//------------------------------------------------
				// Generate new segment data based on current x and y position
				//------------------------------------------------

		}, {
				key: "createSegments",
				value: function createSegments(x, y, angle) {
						this.minX = 0;
						this.minY = 0;
						this.maxX = 0;
						this.maxY = 0;
						// Store the previous frame's segment data
						this.previousSegments = this.segments;

						this.segments = [];
						this.segmentPath = "";
						var x1 = x;
						var y1 = y - this.strokeWidth / 2;
						var x2 = x + this.halfWidth * 2 + this.strokeWidth / 2;
						var y2 = y - this.strokeWidth / 2;

						this.addSegment(x1, y1, x2, y2, angle, this.originX, this.originY);

						x1 = x2;
						y1 = y2;
						x2 = x2;
						y2 = y + this.halfWidth * 2;
						this.addSegment(x1, y1, x2, y2, angle, this.originX, this.originY);

						x1 = x2;
						y1 = y2;
						x2 = x2 - this.strokeWidth;
						y2 = y2;
						this.addSegment(x1, y1, x2, y2, angle, this.originX, this.originY);

						x1 = x2;
						y1 = y2;
						x2 = x2;
						y2 = y + this.strokeWidth / 2;
						this.addSegment(x1, y1, x2, y2, angle, this.originX, this.originY);

						x1 = x2;
						y1 = y2;
						x2 = x;
						y2 = y + this.strokeWidth / 2;
						this.addSegment(x1, y1, x2, y2, angle, this.originX, this.originY);

						x1 = x2;
						y1 = y2;
						x2 = x2;
						y2 = y - this.strokeWidth / 2;
						this.addSegment(x1, y1, x2, y2, angle, this.originX, this.originY);

						this.segmentGuide.setAttribute("d", this.segmentPath);
				}

				//------------------------------------------------
				// Calculate the co-ordinates of a point after
				// being rotated around the shape's origin
				//------------------------------------------------

		}, {
				key: "rotateCoords",
				value: function rotateCoords(x, y, angle) {
						var rotatedX = Math.cos(angle) * (x - this.originX) - Math.sin(angle) * (y - this.originY) + this.originX;
						var rotatedY = Math.sin(angle) * (x - this.originX) + Math.cos(angle) * (y - this.originY) + this.originY;
						return {
								x: rotatedX,
								y: rotatedY
						};
				}

				//------------------------------------------------
				// Update the x/y co-ordinates of the shape
				//------------------------------------------------

		}, {
				key: "setPosition",
				value: function setPosition(x, y) {
						_get(Object.getPrototypeOf(LShape.prototype), "setPosition", this).call(this, x, y);

						var angle = this._angle * Math.PI / 180.0;

						this.originX = x + this.halfWidth * 2;
						this.originY = y;

						this.createSegments(x, y, angle);

						this.centerGuide.setAttribute("cx", this.originX);
						this.centerGuide.setAttribute("cy", this.originY);

						var path = "";

						var point = this.rotateCoords(x, y, angle);
						path = "M " + point.x + " " + point.y;

						point = this.rotateCoords(x + this.halfWidth * 2, y, angle);
						path += " L " + point.x + " " + point.y;

						point = this.rotateCoords(x + this.halfWidth * 2, y + this.halfWidth * 2, angle);
						path += " " + point.x + " " + point.y;

						this.shape.setAttribute("d", path);
						this.effectsShape.setAttribute("d", path);

						// Figure out the new bounding box
						this.boundingBox.x = this.minX;
						this.boundingBox.y = this.minY;
						this.boundingBox.width = this.maxX - this.minX;
						this.boundingBox.height = this.maxY - this.minY;

						this.x = x;
						this.y = y;

						this.boundingBoxGuide.setAttribute("x", this.boundingBox.x);
						this.boundingBoxGuide.setAttribute("y", this.boundingBox.y);
						this.boundingBoxGuide.setAttribute("width", this.boundingBox.width);
						this.boundingBoxGuide.setAttribute("height", this.boundingBox.height);
				}

				//------------------------------------------------
				// Change the width/height of the shape and stroke width
				//------------------------------------------------

		}, {
				key: "resize",
				value: function resize(strokeWidth, scale) {
						this.strokeWidth = strokeWidth;
						this.halfWidth = this.originalHalfWidth * scale;
						this.shape.setAttribute("stroke-width", this.strokeWidth);
						this.shape.style.strokeWidth = this.strokeWidth;
				}
		}]);

		return LShape;
}(BasicShape);
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
//
////////////////////////////////////////////////////////////////////////////////

var TriangleShape = function (_BasicShape) {
	_inherits(TriangleShape, _BasicShape);

	//------------------------------------------------
	// Constructor
	//------------------------------------------------

	function TriangleShape(DOMElement, color, strokeWidth, scale) {
		_classCallCheck(this, TriangleShape);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(TriangleShape).call(this));

		_this.DOMElement = DOMElement;
		_this._color = color;
		_this.x = 0;
		_this.y = 0;

		_this.originalHalfWidth = 90;
		_this.halfWidth = scale * _this.originalHalfWidth;
		_this.strokeWidth = strokeWidth;

		_this.points = null;
		_this.pointArray = [];

		_this.draw();
		return _this;
	}

	//------------------------------------------------
	// Create the svg elements to be rendered later
	//------------------------------------------------


	_createClass(TriangleShape, [{
		key: "draw",
		value: function draw() {
			this.shape = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
			this.shape.setAttribute("fill", "transparent");
			this.shape.setAttribute("stroke", this.color);
			this.shape.setAttribute("stroke-width", this.strokeWidth);

			this.effectsShape = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
			this.effectsShape.setAttribute("fill", "transparent");
			this.effectsShape.setAttribute("stroke", this.color);
			this.effectsShape.setAttribute("stroke-linecap", "butt");
			this.effectsShape.setAttribute("stroke-width", this.strokeWidth);

			this.generatePoints();
			_get(Object.getPrototypeOf(TriangleShape.prototype), "draw", this).call(this);
		}

		//------------------------------------------------
		// Figure out the 3 points for the triangle, while
		// also factoring in the current rotation
		//------------------------------------------------

	}, {
		key: "generatePoints",
		value: function generatePoints() {
			this.pointArray = [];
			this.originX = this.x;
			this.originY = this.y + this.strokeWidth / 2;
			var angle = this._angle * Math.PI / 180.0;
			var collisionX = 0,
			    collisionY = 0;

			var collisionWidth = this.halfWidth + this.strokeWidth / 4 * 3;
			var collisionHeight = this.halfWidth + this.strokeWidth / 2;

			var xPos = 0,
			    yPos = 0;
			xPos = Math.cos(angle) * (this.x - this.originX) - Math.sin(angle) * (this.y - this.halfWidth - this.originY) + this.originX;
			yPos = Math.sin(angle) * (this.x - this.originX) + Math.cos(angle) * (this.y - this.halfWidth - this.originY) + this.originY;
			collisionX = Math.cos(angle) * (this.x - this.originX) - Math.sin(angle) * (this.y - (collisionWidth + this.strokeWidth / 4) - this.originY) + this.originX;
			collisionY = Math.sin(angle) * (this.x - this.originX) + Math.cos(angle) * (this.y - (collisionWidth + this.strokeWidth / 4) - this.originY) + this.originY;
			this.points = xPos + " " + yPos + " ";
			this.pointArray.push({ x: xPos, y: yPos, collisionX: collisionX, collisionY: collisionY });

			xPos = Math.cos(angle) * (this.x + this.halfWidth - this.originX) - Math.sin(angle) * (this.y + this.halfWidth - this.originY) + this.originX;
			yPos = Math.sin(angle) * (this.x + this.halfWidth - this.originX) + Math.cos(angle) * (this.y + this.halfWidth - this.originY) + this.originY;
			collisionX = Math.cos(angle) * (this.x + collisionWidth - this.originX) - Math.sin(angle) * (this.y + collisionHeight - this.originY) + this.originX;
			collisionY = Math.sin(angle) * (this.x + collisionWidth - this.originX) + Math.cos(angle) * (this.y + collisionHeight - this.originY) + this.originY;
			this.points += xPos + " " + yPos + " ";
			this.pointArray.push({ x: xPos, y: yPos, collisionX: collisionX, collisionY: collisionY });

			xPos = Math.cos(angle) * (this.x - this.halfWidth - this.originX) - Math.sin(angle) * (this.y + this.halfWidth - this.originY) + this.originX;
			yPos = Math.sin(angle) * (this.x - this.halfWidth - this.originX) + Math.cos(angle) * (this.y + this.halfWidth - this.originY) + this.originY;
			collisionX = Math.cos(angle) * (this.x - collisionWidth - this.originX) - Math.sin(angle) * (this.y + collisionHeight - this.originY) + this.originX;
			collisionY = Math.sin(angle) * (this.x - collisionWidth - this.originX) + Math.cos(angle) * (this.y + collisionHeight - this.originY) + this.originY;

			this.points += xPos + " " + yPos + " ";
			this.pointArray.push({ x: xPos, y: yPos, collisionX: collisionX, collisionY: collisionY });

			this.shape.setAttribute("points", this.points);
			this.effectsShape.setAttribute("points", this.points);
		}

		//------------------------------------------------
		// Update the x/y position of the shape
		//------------------------------------------------

	}, {
		key: "setPosition",
		value: function setPosition(x, y) {
			_get(Object.getPrototypeOf(TriangleShape.prototype), "setPosition", this).call(this, x, y);
			this.generatePoints();

			this.buildCollisionModel();
		}

		//------------------------------------------------
		// Figure out where the collision lines should be
		// Here they should be on the outside of the triangle
		//------------------------------------------------

	}, {
		key: "buildCollisionModel",
		value: function buildCollisionModel() {
			// Store the previous frame's segment data
			this.previousSegments = this.segments;

			this.segments = [];
			var line = {},
			    path = "";
			var minX = this.pointArray[0].collisionX,
			    minY = this.pointArray[0].collisionY,
			    maxX = this.pointArray[0].collisionX,
			    maxY = this.pointArray[0].collisionY;

			for (var i = 0, length = this.pointArray.length; i < length; i++) {
				line = {};
				line.x1 = this.pointArray[i].collisionX;
				line.y1 = this.pointArray[i].collisionY;
				if (i < this.pointArray.length - 1) {
					line.x2 = this.pointArray[i + 1].collisionX;
					line.y2 = this.pointArray[i + 1].collisionY;
				} else {
					line.x2 = this.pointArray[0].collisionX;
					line.y2 = this.pointArray[0].collisionY;
				}
				if (i === 0) {
					path = "M" + line.x1 + " " + line.y1;
				}
				path += " L" + line.x2 + " " + line.y2;
				this.segments.push(line);

				if (line.x1 < minX) minX = line.x1;
				if (line.x2 < minX) minX = line.x2;
				if (line.y1 < minY) minY = line.y1;
				if (line.y2 < minY) minY = line.y2;

				if (line.x1 > maxX) maxX = line.x1;
				if (line.x2 > maxX) maxX = line.x2;
				if (line.y1 > maxY) maxY = line.y1;
				if (line.y2 > maxY) maxY = line.y2;
			}
			this.segmentGuide.setAttribute("d", path);

			// Update the center point guide
			this.centerGuide.setAttribute("cx", this.originX);
			this.centerGuide.setAttribute("cy", this.originY);
			// Update the actual bounding box
			this.boundingBox.x = minX;
			this.boundingBox.y = minY;
			this.boundingBox.width = maxX - minX;
			this.boundingBox.height = maxY - minY;
			// Update the bounding box guide line
			this.boundingBoxGuide.setAttribute("x", this.boundingBox.x);
			this.boundingBoxGuide.setAttribute("y", this.boundingBox.y);
			this.boundingBoxGuide.setAttribute("width", this.boundingBox.width);
			this.boundingBoxGuide.setAttribute("height", this.boundingBox.height);
		}

		//------------------------------------------------
		// Update the size of the shape and change the width
		// of stroke used
		//------------------------------------------------

	}, {
		key: "resize",
		value: function resize(strokeWidth, scale) {
			this.strokeWidth = strokeWidth;
			this.halfWidth = this.originalHalfWidth * scale;
			this.shape.setAttribute("stroke-width", this.strokeWidth);
			this.shape.style.strokeWidth = this.strokeWidth;
		}
	}]);

	return TriangleShape;
}(BasicShape);
//# sourceMappingURL=syrup.js.map
