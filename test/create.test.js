var test     = require('tap').test,
    async    = require('async'),
    fs       = require('fs'),
    _        = require('underscore'),
    Stream   = require('stream'),
	// my libs
    Replacer = require('../lib/replace-text'),
    Creator  = require('../lib/create');


// common test class vars
var fixturesDir = '../test-utils/fixtures/',
	cssDir = fixturesDir + 'css/',
	cssFile = "all-min.css",
	opts = {
		cb: function (err, results) {},
		assets: [cssDir + cssFile, fixturesDir + "js/app.newie.js", fixturesDir +"js/app.oldie.js"],
		grepFiles: [fixturesDir + "index.html"],
		// requireJs: true,
		newVersion: 11111111
}, creatorCSSOpts, creatorCSS;


	var replacers = [];

	opts.assets.forEach(function (path) {
		var replacerOpts = {
			newVersion: opts.newVersion,
			requireJs: opts.requireJs,
			filePath: path
		};
		replacers.push(new Replacer(replacerOpts));
	});

	creatorCSSOpts = _.extend({}, opts, {filePath: opts.assets[0], replacer: replacers[0]});
	creatorCSS = new Creator(creatorCSSOpts);

test('Creator Contructor Fn: shd assign needed properties', function(t) {

	var cssVersionedPath = opts.assets[0].replace(/(\.css)/, '.' + opts.newVersion + "$1");

	t.ok(creatorCSS.replacer instanceof Replacer, "this.replacer assigned correctly");
	t.equal(creatorCSS.replacer.newVersion, opts.newVersion, "this.replacer's newVersion attr is correct");
	t.equal(creatorCSS.filePath, opts.assets[0], "the INPUT filePath is correct");
	t.equal(creatorCSS.outputFilePath, cssVersionedPath, "the OUTPUT filePath is correct");

	t.end();
});


test('Creator.run(): shd write file', function(t) {

	var	cssOldVersion = cssFile.replace('.css', '.123456.css'),
		cssOldVersionOriginal = cssOldVersion.replace('.css', '.css.original'),
		cssOriginal = cssFile.replace('.css', '.css.original'),
		cssVersioned = cssFile.replace(/(\.css)/, '.' + opts.newVersion + "$1"),
		expectedDirContents = [cssOldVersionOriginal, cssFile, cssOriginal, cssVersioned, cssOldVersion],
		testRun = function (cb) {
			// sort so don't have to worry about order
			t.deepEqual(fs.readdirSync(cssDir).sort(), expectedDirContents.sort(), "the new versioned file has been written to the directory");
			cb(null);
		};

	// run test
	async.series([
		creatorCSS.run,
		testRun
	], function () {
		// clean up after test
		fs.unlink(cssDir + cssVersioned, function () {
			t.end();
		});
	});
});