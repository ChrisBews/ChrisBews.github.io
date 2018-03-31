var gulp = require('gulp');
var gutil = require('gulp-util');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifycss = require('gulp-clean-css');

gulp.task('default', ['js', 'css'], function(){
	
});

function handleError(error) {
	console.log(error.toString());
	this.emit("end");
}

gulp.task("js", function() {
	gulp.src(["assets/js/libs/**/(!history).js", "assets/js/nation/**/*.js", "assets/js/snowbeat/**/!(Application).js", "assets/js/snowbeat/Application.js"])
	.pipe(concat("snowbeat.js"))
	.on("error", handleError)
	.pipe(uglify())
	.pipe(gulp.dest("assets/compiled/"));
});

gulp.task("css", function() {
	gulp.src(["assets/css/**/*.css"])
	.pipe(concat("snowbeat.css"))
	.pipe(minifycss())
	.pipe(gulp.dest("assets/compiled/"))
});