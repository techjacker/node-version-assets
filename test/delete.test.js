var test = require('tap').test,
	async = require('async'),
	path = require('path'),
	fs = require('fs'),
	_ = require('underscore'),
	Stream = require('stream'),
	// my libs
	Replacer = require('../lib/replace-text'),
	Deleter = require('../lib/delete');

var fixturesDir = path.join(process.cwd(), 'test-utils/fixtures/'),
	opts = {
		cb: function (err, results) {},
		assets: [fixturesDir + "css/all-min.css", fixturesDir + "js/app.newie.js", fixturesDir +"js/app.oldie.js"],
		grepFiles: [fixturesDir + "index.html"],
		// requireJs: true,
		newVersion: 1111111111
};


var replacers = [];

opts.assets.forEach(function (filePath) {
	var replacerOpts = {
		newVersion: opts.newVersion,
		requireJs: opts.requireJs,
		filePath: filePath
	};
	replacers.push(new Replacer(replacerOpts));
});

test('Deleter Contructor Fn: shd assign needed properties', function(t) {

	var deleteCSSOpts = _.extend({}, opts, {filePath: opts.assets[0], replacer: replacers[0]}),
		deleterCSS = new Deleter(deleteCSSOpts);

	t.ok(deleterCSS.replacer instanceof Replacer, "this.replacer assigned correctly");
	t.equal(deleterCSS.filePath, opts.assets[0], "this.filePath assigned correctly");

	t.end();
});

test('Deleter.dirList() + .markForDeletion() + .deleteFiles: List Directory Contents + mark files for deletion', function(t) {

	var deleteCSSOpts = _.extend({}, opts, {filePath: opts.assets[0], replacer: replacers[0]}),
		deleterCSS = new Deleter(deleteCSSOpts),
		cssFile = 'all-min.css',
		cssDir = fixturesDir + 'css/',
		versionNum = 123456,
		cssFilePreviousVersion = cssFile.replace('.', '.' + versionNum + '.'),
		cssFilePreviousVersionOriginal = cssFile.replace('.css', '.' + versionNum + '.css.original'),
		dirContents = [cssFilePreviousVersionOriginal, cssFile, cssFile + '.original', cssFilePreviousVersion],
		cssFilesForDeletion = [cssDir + cssFilePreviousVersion];


		// TESTS:::::: .dirList()
		cbDirListTests = function (files, callback) {
			t.equal(deleterCSS.directory, opts.assets[0].replace('/' + cssFile, ''), "this.directory calculated correctly");
			t.ok(_.isArray(files), "returns array of files");
			// t.deepEqual(files, dirContents, "list of files in directory is correct");
			callback(null);
		},

		// TESTS:::::: .markForDeletion()
		cbMarkForDeletionTests = function (filesForDeletion, callback) {
			t.deepEqual(filesForDeletion, cssFilesForDeletion, "returns correct list of files marked for deletion > should NOT include original file");
			callback(null);
		},

		// TESTS:::::: .deleteFiles()
		cbDeleteFilesTests = function (deletedFiles, callback) {
			t.deepEqual(fs.readdirSync(cssDir), dirContents.slice(0, -1), "dir contents no longer contain old versioned file");
			callback(null);
		};

	return t.end();
	// run tests
	async.waterfall([
		deleterCSS.dirList,
		cbDirListTests,
		deleterCSS.markForDeletion,
		cbMarkForDeletionTests,
		deleterCSS.deleteFiles,
		cbDeleteFilesTests
	], function (filesForDeletion) {
		var cleaner = require('./../test-utils/test-cleanup');
		cleaner(t.end);
	});
});
