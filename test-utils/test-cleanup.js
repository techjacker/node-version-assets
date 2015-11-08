var	async = require('async'),
	curry = require('curry'),
	util = require('util'),
	fs = require('fs'),
	path = require('path'),
// my libs
	Replacer = require('../lib/replace-text'),
	Deleter = require('../lib/delete');

// test vars

var postTest = function (callback, fix) {
	var versionNum = 123456,
		fixturesDir = fix || path.join(process.cwd(), 'test-utils/fixtures/'),
		assets = [fixturesDir + "css/all-min.css", fixturesDir + "js/app.newie.js", fixturesDir + "js/app.oldie.js", fixturesDir + "js/bundle.js", fixturesDir + "js/login-bundle.js"],
		versionedAssets = [fixturesDir + "css/all-min" + versionNum + ".css", fixturesDir + "js/app.newie.js", fixturesDir + "js/app.oldie.js", fixturesDir + "js/bundle" + versionNum + ".js", fixturesDir + "js/login-bundle" + versionNum + ".js"],
		grepFiles = [fixturesDir + "index.html"];

	var allFiles = assets.concat(grepFiles),
		versionedFiles = allFiles.map(function (fPath) {
			var file;
			fPath.replace(/(.*)(.js|.css)$/, function (match, p1, p2, p3, offset, string) {
				file = p1 + '.' + versionNum + p2;
			});
			return {
				file: file,
				original: file + '.original'
			};
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
		}
		restoreVersionedFile = function (versioned, cb) {
			var read = fs.createReadStream(versioned.original)
										.on('end', cb)
										.on('error', cb),
				write = fs.createWriteStream(versioned.file)
										.on('end', cb)
										.on('error', cb)

			read.pipe(write);
		};

	////////////////////////////////////////////////////////
	// Delete new versioned files produced by tests FIRST //
	////////////////////////////////////////////////////////


	async.map(allFiles, deleteFiles, function (err, deletedFiles) {

		///////////////////////////////////
		// restore dummy versioned files //
		///////////////////////////////////

		async.map(versionedFiles, restoreVersionedFile, function (err) {

			if (err) {
				return callback(err);
			}

			///////////////////////////////////////////////
			// Copy original contents of files to assets //
			///////////////////////////////////////////////
			async.map(allFiles, restoreFileContents, function (err, originalFiles) {

				if (err) {
					return callback(err);
				}

				// fs.readFile()
				originalFiles.forEach(function (original, index) {

					var origFile = originalFiles[index];

					if (origFile) {
						writeFilesArrayFns.push(function(cb) {
							fs.writeFile(allFiles[index], originalFiles[index].toString(), cb);
						});
					}
				});

				// >>> fs.writeFile()
				async.parallel(writeFilesArrayFns, callback);
			});

		});
	});
};

module.exports = postTest;
