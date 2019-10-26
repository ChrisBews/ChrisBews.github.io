////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
// 
////////////////////////////////////////////////////////////////////////////////

class SiteSettings {

	//------------------------------------------------
	// Constructor
	//------------------------------------------------
	constructor() {
		this._isTouchDevice = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
		this._isIPhone = (/iPhone/i.test(navigator.userAgent));
		if (this._isTouchDevice) {
			document.body.className += " touch";
		}
		this._isIE9 = (document.body.className.search(/ie9/i) > -1);
		if (this._isIE9) {
			document.body.className += " ie9";
		}
		this._iDevice = (/iPhone|iPad|iPod/i.test(navigator.userAgent));
		this._isFirefox = (/firefox/i.test(navigator.userAgent));
		this.maxShapeSpeed = 0.7;
		this.maxRotation = 0.2;
	}

	//------------------------------------------------
	// Getters
	//------------------------------------------------
	get isTouchDevice() {
		return this._isTouchDevice;
	}

	get isFirefox() {
		return this._isFirefox;
	}

	get isIDevice() {
		return this._iDevice;
	}

	get isIPhone() {
		return this._isIPhone;
	}

	get IS_IE9() {
		return this._isIE9;
	}

	get WORK_NAV_DURATION() {
		return 400;
	}

	get WORK_ZOOM_DURATION() {
		return 600;
	}

	get MAX_SHAPE_SPEED() {
		return this.maxShapeSpeed;
	}

	get MAX_ROTATION() {
		return this.maxRotation;
	}

	get MIN_TRANSITION_DURATION() {
		return 1000;
	}

	get TRANSITION_MULTIPLIER() {
		return 800;
	}

	get ZOOMED_OUT_SCALE() {
		return 0.8;
	}

	get NAV_ZOOMED_OUT_SCALE() {
		return 1.7;
	}

	set MAX_SHAPE_SPEED(value) {
		this.maxShapeSpeed = value;
	}

	set MAX_ROTATION(value) {
		this.maxRotation = value;
	}
}