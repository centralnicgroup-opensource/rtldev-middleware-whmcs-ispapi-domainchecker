const {series, src, dest, watch} = require('gulp');
const concat = require('gulp-concat');
const clean = require('gulp-clean');
const zip = require('gulp-zip');
const exec = require('util').promisify(require('child_process').exec);
const rename = require('gulp-rename');
const esbuild = require('gulp-esbuild');
const xo = require('gulp-xo');
const prettier = require('gulp-prettier');
const prettiercfg = require('./.prettierrc');
const cfg = require('./gulpfile.json');
// const debug = require("gulp-debug");
// const sourcemaps = require("gulp-sourcemaps");

/**
 * format code using prettier
 */
exports.prettierCheck = function () {
	return (
		src(cfg.filesForPrettier)
			//.pipe(debug())
			.pipe(prettier.check(prettiercfg))
			.pipe(dest(file => file.base))
	);
};

/**
 * format code using prettier
 */
exports.prettier = function () {
	return (
		src(cfg.filesForPrettier)
			//.pipe(debug())
			.pipe(prettier(prettiercfg))
			.pipe(dest(file => file.base))
	);
};

/**
 * lint javascript with XO/eslint
 */

exports.xo = function () {
	return src(cfg.filesForXO)
		.pipe(xo())
		.pipe(xo.format())
		.pipe(xo.failAfterError());
};

/**
 * Perform PHP Linting
 */
async function phpLint() {
	// these may fail, it's fine
	try {
		await exec(`${cfg.phpcsfixcmd} ${cfg.phpcsparams}`);
	} catch (e) {}

	// these shouldn't fail
	try {
		await exec(`${cfg.phpcschkcmd} ${cfg.phpcsparams}`);
		await exec(`${cfg.phpcomptcmd} ${cfg.phpcsparams}`);
		// await exec(`${cfg.phpstancmd}`);
	} catch (e) {
		await Promise.reject(e.message);
	}
	await Promise.resolve();
}

/**
 * cleanup old build folder / archive
 * @return stream
 */
function doDistClean() {
	return src([cfg.archiveBuildPath, `${cfg.archiveFileName}-latest.zip`], {
		read: false,
		base: '.',
		allowEmpty: true,
	}).pipe(clean({force: true}));
}

/**
 * Copy all files/folders to build folder
 * @return stream
 */
function doCopyFiles() {
	return src(cfg.filesForArchive, {base: '.'}).pipe(dest(cfg.archiveBuildPath));
}

/**
 * Clean up files
 * @return stream
 */
function doFullClean() {
	return src(cfg.filesForCleanup, {
		read: false,
		base: '.',
		allowEmpty: true,
	}).pipe(clean({force: true}));
}

/**
 * build latest zip archive
 * @return stream
 */
function doGitZip() {
	return src(`./${cfg.archiveBuildPath}/**`)
		.pipe(zip(`${cfg.archiveFileName}-latest.zip`))
		.pipe(dest('.'));
}

/**
 * build zip archive
 * @return stream
 */
function doZip() {
	return src(`./${cfg.archiveBuildPath}/**`)
		.pipe(zip(`${cfg.archiveFileName}.zip`))
		.pipe(dest('./pkg'));
}

/**
 * Esbuild minify + bundle css and js files
 * @param {*} cb
 */
function esbuildMinify(cb) {
	cfg.minificationConfig.map(function (folder) {
		return src(folder.dir + '@(*.all.js|*.all.css)')
			.pipe(
				esbuild({
					minify: true,
				}),
			)
			.pipe(
				rename({
					suffix: '.min',
				}),
			)
			.pipe(dest(folder.dir));
	});
	cb();
}

/**
 * Concatinate css files
 * @param {*} cb
 */
function cssConcatenation(cb) {
	cfg.minificationConfig.map(function (folder) {
		return (
			src(
				folder.cssfilesorder.map(function (file) {
					// concat the path to the files names, the result is an array: [f1,f2, f3, ...]
					return folder.dir + file;
				}),
			)
				//.pipe(sourcemaps.init())
				.pipe(
					concat(folder.name + '.all.css').on('error', error =>
						console.log(error),
					),
				)
				// .pipe(sourcemaps.write("."))
				.pipe(dest(folder.dir))
		);
	});
	cb(); // see https://gulpjs.com/docs/en/getting-started/async-completion/#using-an-error-first-callback
}

/**
 * Concatinate js files
 * @param {*} cb
 */
function jsConcatenation(cb) {
	cfg.minificationConfig.map(function (folder) {
		return (
			src(
				folder.jsfilesorder.map(function (file) {
					return folder.dir + file;
				}),
			)
				// .pipe(sourcemaps.init())
				.pipe(
					concat(folder.name + '.all.js').on('error', error =>
						console.log(error),
					),
				)
				// .pipe(sourcemaps.write("."))
				.pipe(dest(folder.dir))
		);
	});
	cb(); // see https://gulpjs.com/docs/en/getting-started/async-completion/#using-an-error-first-callback
}

/**
 * watch for any changes, minify + concatenate
 */
exports.watcher = function () {
	watch(
		[
			'**/assets/*.js',
			'!**/assets/*@(.all|.min).js',
			'**/assets/*.css',
			'!**/assets/*@(.all|.min).css',
		],
		{interval: 1000},
		series(cssConcatenation, jsConcatenation, esbuildMinify),
	);
};

exports.minify = esbuildMinify;

exports.concat = series(cssConcatenation, jsConcatenation);

exports.bundle = series(cssConcatenation, jsConcatenation, esbuildMinify);

exports.lint = series(phpLint);

exports.copy = series(doDistClean, doCopyFiles);

exports.prepare = series(exports.lint, exports.copy);

exports.archives = series(doGitZip, doZip);

exports.default = series(exports.prepare, exports.archives, doFullClean);

exports.release = series(exports.copy, exports.archives, doFullClean);
