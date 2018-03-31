var gulp = require("gulp");
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var babel = require("gulp-babel");

gulp.watch("assets/js/**/*.js", ["default"]);

function handleError(error) {
	console.log(error.toString());
	this.emit("end");
}

gulp.task("default", function() {
	return gulp.src("assets/js/**/*.js")
		.pipe(sourcemaps.init())
		.pipe(babel({
			presets: ["es2015"]
		}))
		.on("error", handleError)
		.pipe(concat("syrup.js"))
		.on("error", handleError)
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest("assets/compiled/"));
});