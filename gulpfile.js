const { series, src, dest, parallel, watch } = require("gulp");
const concat = require("gulp-concat");
const sourcemaps = require("gulp-sourcemaps");
const clean = require("gulp-clean");
const zip = require("gulp-zip");
const tar = require("gulp-tar");
const gzip = require("gulp-gzip");
const exec = require("util").promisify(require("child_process").exec);
const cfg = require("./gulpfile.json");
const path = require("path");
const rename = require("gulp-rename");
const fs = require("fs");
const esbuild = require("gulp-esbuild");

/**
 * Perform PHP Linting
 */
async function doLint() {
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
    base: ".",
    allowEmpty: true,
  }).pipe(clean({ force: true }));
}

/**
 * Copy all files/folders to build folder
 * @return stream
 */
function doCopyFiles() {
  return src(cfg.filesForArchive, { base: "." }).pipe(
    dest(cfg.archiveBuildPath)
  );
}

/**
 * Clean up files
 * @return stream
 */
function doFullClean() {
  return src(cfg.filesForCleanup, {
    read: false,
    base: ".",
    allowEmpty: true,
  }).pipe(clean({ force: true }));
}

/**
 * build latest zip archive
 * @return stream
 */
function doGitZip() {
  return src(`./${cfg.archiveBuildPath}/**`)
    .pipe(zip(`${cfg.archiveFileName}-latest.zip`))
    .pipe(dest("."));
}

/**
 * build zip archive
 * @return stream
 */
function doZip() {
  return src(`./${cfg.archiveBuildPath}/**`)
    .pipe(zip(`${cfg.archiveFileName}.zip`))
    .pipe(dest("./pkg"));
}

/**
 * build tar archive
 * @return stream
 */
function doTar() {
  return src(`./${cfg.archiveBuildPath}/**`)
    .pipe(tar(`${cfg.archiveFileName}.tar`))
    .pipe(gzip())
    .pipe(dest("./pkg"));
}

/**
 * Esbuild minify + bundle css and js files
 * @param {*} cb
 */
function esbuildMinify(cb) {
  cfg.minificationConfig.map(function (folder) {
    return src(folder.dir + "@(*.all.js|*.all.css)")
      .pipe(
        esbuild({
          minify: true,
          outdir: ".",
        })
      )
      .pipe(
        rename({
          suffix: ".min",
        })
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
        })
      )
        //.pipe(sourcemaps.init())
        .pipe(
          concat(folder.name + ".all.css").on("error", (error) =>
            console.log(error)
          )
        )
        //.pipe(sourcemaps.write("."))
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
        })
      )
        //.pipe(sourcemaps.init())
        .pipe(
          concat(folder.name + ".all.js").on("error", (error) =>
            console.log(error)
          )
        )
        //.pipe(sourcemaps.write("."))
        .pipe(dest(folder.dir))
    );
  });
  cb(); // see https://gulpjs.com/docs/en/getting-started/async-completion/#using-an-error-first-callback
}

/**
 * watch for any changes, minify + bundle + concatinate
 */
function watcher() {
  watch(
    ["**/*.js", "!**/*.min.js", "**/*.css", "!**/*.min.css"],
    { interval: 1000 },
    series(cssConcatenation, jsConcatenation, esbuildMinify)
  );
}

exports.watcher = series(watcher);

exports.minify = series(esbuildMinify);

exports.concat = series(cssConcatenation, jsConcatenation);

exports.bundle = series(cssConcatenation, jsConcatenation, esbuildMinify);

exports.lint = series(doLint);

exports.copy = series(doDistClean, doCopyFiles);

exports.prepare = series(exports.lint, exports.copy);

exports.archives = series(doGitZip, doZip, doTar);

exports.default = series(exports.prepare, exports.archives, doFullClean);
exports.release = series(exports.copy, exports.archives, doFullClean);
