var	async = require('async'),
	curry = require('curry'),
	util = require('util'),
	fs = require('fs'),
// my libs
	Replacer = require('../lib/replace-text'),
	Deleter = require('../lib/delete');

// test vars

var postTest = function (callback, fix) {
	var versionNum = 123456,
		fixturesDir = fix || './test-utils/fixtures/',
		assets = [fixturesDir + "css/all-min.css", fixturesDir + "js/app.newie.js", fixturesDir + "js/app.oldie.js", fixturesDir + "js/bundle.js", fixturesDir + "js/login-bundle.js"],
		versionedAssets = [fixturesDir + "css/all-min" + versionNum + ".css", fixturesDir + "js/app.newie.js", fixturesDir + "js/app.oldie.js", fixturesDir + "js/bundle" + versionNum + ".js", fixturesDir + "js/login-bundle" + versionNum + ".js"],
		grepFiles = [fixturesDir + "index.html"];

	var allFiles = assets.concat(grepFiles),
		versionedFiles = [],
		versionedFilesOriginals = allFiles.map(function (path) {

			return path.replace(/(.*)(.js|.css)$/, function (match, p1, p2, p3, offset, string) {

				var file = p1 + '.' + versionNum + p2;
				versionedFiles.push(file);
				return file + '.original';
			});
		}).slice(0, -1), // get rid of index.html
		deleteFilesArrayFns = [],
		writeFilesArrayFns = [],
		deleteFiles = function (assetPath, cb) {

			var	replacer = new Replacer({filePath: assetPath, newVersion: 123456}),
				deleter = new Deleter({filePath: assetPath, replacer: replacer});

			deleter.run(cb);
		},
		restoreFileContents = function (assetPath, cb) {
			fs.readFile(assetPath + '.original', cb);
		};

	////////////////////////////////////////////////////////
	// Delete new versioned files produced by tests FIRST //
	////////////////////////////////////////////////////////

	async.map(allFiles, deleteFiles, function (err, deletedFiles) {

		///////////////////////////////////
		// restore dummy versioned files //
		///////////////////////////////////
		async.map(versionedFiles, fs.writeFile, function (err, versionedFilesOriginals) {

			///////////////////////////////////////////////
			// Copy original contents of files to assets //
			///////////////////////////////////////////////
			async.map(allFiles, restoreFileContents, function (err, originalFiles) {

				// fs.readFile()
				originalFiles.forEach(function (original, index) {

					var origFile = originalFiles[index];

					if (origFile) {
						// equivalent to: fs.writeFile(allFiles[index], originalFiles[index].toString(), callback);
						var curriedWriteFile = curry([allFiles[index], originalFiles[index].toString()], fs.writeFile);
						writeFilesArrayFns.push(curriedWriteFile);
					}
				});

				// >>> fs.writeFile()
				async.parallel(writeFilesArrayFns, callback);
			});

		});
	});
};

module.exports = postTest;
