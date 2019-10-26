////////////////////////////////////////////////////////////////////////////////
// Syrup Sounds Website
// Website Events
////////////////////////////////////////////////////////////////////////////////

class Events {

	//------------------------------------------------
	// Constructor 
	//------------------------------------------------
	constructor() {

	}

	//------------------------------------------------
	// Event names 
	//------------------------------------------------
	static get ENABLE_DEBUG_MODE() {
		return "EnableDebugMode";
	}

	static get DISABLE_DEBUG_MODE() {
		return "DisableDebugMode";
	}

	static get ENABLE_FLIGHT_CONTROL() {
		return "EnableFlightControl";
	}

	static get DISABLE_FLIGHT_CONTROL() {
		return "DisableFlightControl";
	}

	static get RANDOMISE_SHAPES() {
		return "RandomiseShapes";
	}

	static get RANDOMISE_BACKGROUND_LINES() {
		return "RandomiseBackgroundLines";
	}

	static get RANDOMISE_ALL() {
		return "RandomiseAll";
	}

	static get SHOW_ONLY_ARCS() {
		return "ShowOnlyArcs";
	}
	static get SHOW_ONLY_CORNERS() {
		return "ShowOnlyCorners";
	}
	static get SHOW_ONLY_TRIANGLES() {
		return "ShowOnlyTriangles";
	}
	static get SHOW_ONLY_LINES() {
		return "ShowOnlyLines";
	}
	static get SHOW_ONLY_CIRCLES() {
		return "ShowOnlyCircles";
	}
	static get SHOW_ALL_SHAPES() {
		return "ShowAllShapes";
	}

	static get UPDATE_SHAPE_SPEEDS() {
		return "UpdateShapeSpeeds";
	}

	static get SCALE_CHANGE_REQUESTED() {
		return "ScaleChangeRequested";
	}
}