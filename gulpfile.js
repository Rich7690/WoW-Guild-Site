'use strict';
const { series } = require('gulp');
const rimraf = require('rimraf');
const { src, dest } = require('gulp');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const sourcemaps  = require('gulp-sourcemaps');
const gulp = require('gulp');
const rev = require('gulp-rev');
const minify = require('gulp-minify');
var inject = require('gulp-inject');
var connect = require('gulp-connect');
var proxy = require('http-proxy-middleware');
var concat = require('gulp-concat');

// The `clean` function is not exported so it can be considered a private task.
// It can still be used within the `series()` composition.
function clean(cb) {
    rimraf("./dist", cb);
}

function images(cb){
    return src('src/img/*')
        .pipe(dest('./dist/img'));
}


// The `build` function is exported so it is public and can be run with the `gulp` command.
// It can also be used within the `series()` composition.
function build(cb) {
    return src(['src/vendor/js/*.js','src/js/**/*.js'])
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(minify({
            noSource: true,
            mangle: false
        }))
        .pipe(concat('lib.js'))
        .pipe(src('src/**/*.css'))
        .pipe(rev())
        .pipe(sourcemaps.write('.'))
        .pipe(src('src/**/*.html'))
        .pipe(dest('./dist/'));
}

function buildBase(cb) {
    return src(['src/grayscale.js'])
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(minify({
            noSource: true,
            mangle: false
        }))
        .pipe(rev())
        .pipe(sourcemaps.write('.'))
        .pipe(dest('./dist/'));
}

function injectJs(cb) {
    src('./dist/home.html')
        .pipe(inject(src(["./dist/lib*.js"], {read: false}), {relative: true}))
        .pipe(dest('./dist'));

    src('./dist/apply.html')
        .pipe(inject(src([ "./dist/lib*.js"], {read: false}), {relative: true}))
        .pipe(dest('./dist'));

    return src('./dist/index.html')
        .pipe(inject(src(["./dist/gray*.js", './dist/style*.css'], {read: false}), {relative: true}))
        .pipe(dest('./dist'));
}

function injectDevJs(cb) {
    src('./dev/home.html')
        .pipe(inject(src(["./dev/vendor/js/*.js",'./dev/js/*.js'], {read: false}), {relative: true}))
        .pipe(dest('./dev'));
    src('./dev/apply.html')
        .pipe(inject(src(["./dev/vendor/js/*.js",'./dev/js/*.js'], {read: false}), {relative: true}))
        .pipe(dest('./dev'));
    return src('./dev/index.html')
        .pipe(inject(src(['./dev/grayscale*.js', './dev/style*.css'], {read: false}), {relative: true}))
        .pipe(dest('./dev'))
        .pipe(connect.reload());
}

function imageDev() {
    return src('src/img/*')
        .pipe(dest('./dev/img'));
}

function connectServ(cb) {
    connect.server({
        root: 'dev',
        livereload: true,
        middleware: function(connect, opt) {
            return [
                proxy('/api', {
                    target: 'http://localhost:3000',
                    changeOrigin:true
                })
            ]
        }
    });
    cb();
}

function prodServ(cb) {
    connect.server({
        root: 'dist',
        livereload: false,
        middleware: function(connect, opt) {
            return [
                proxy('/api', {
                    target: 'http://localhost:3000',
                    changeOrigin:true
                })
            ]
        }
    });
    cb();
}

function cleanDev(cb) {
    rimraf("./dev", cb);
}

function buildDev(cb) {
    return src('src/**/*.js')
        .pipe(src('src/**/*.css'))
        .pipe(src('src/**/*.html'))
        .pipe(src('src/favicon.ico'))
        .pipe(dest('./dev/'));
}

function watch(cb) {
    gulp.watch(['./src/**/*'], series(buildDev, injectDevJs));
    cb();
}

exports.prodServ = prodServ;
exports.cleanDev = cleanDev;
exports.dev = series(cleanDev, imageDev, buildDev, injectDevJs, connectServ, watch);
exports.clean = clean;
exports.build = build;
exports.default = series(clean, images, buildBase, build, injectJs);

