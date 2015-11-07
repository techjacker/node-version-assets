var test 	= require('tap').test,
	fs 			= require('fs'),
  path    = require('path'),
	_ 			= require('underscore'),
	Stream 	= require('stream'),
	
	// internal modules
	Replacer 	= require('../lib/replace-text'),
	Grepper 	= require('../lib/grep');

var	opts = {
	// newVersion: 123456,
	newVersion: (new Date()).getTime(),
	requireJs: true,
	cb: function (err, results) {},
	filePath: path.join(process.cwd(), "test-utils/fixtures/index.html"),
	assets: ["css/all-min.css", "js/app.newie.js", "js/app.oldie.js"]
};


test('Grep Contructor Fn: shd assign needed properties', function(t) {

	var grep = new Grepper(opts);

	// shd assign generate needed regexes
	t.equal(grep.replacers.length, opts.assets.length);
	t.equal(grep.cb, opts.cb);
	t.equal(grep.inputFilePath, opts.filePath);
	t.equal(grep.outputFilePath, opts.filePath + '.tmp');
	t.ok(_.every(grep.replacers, function (replacer) {
		return replacer instanceof Replacer;
	}));
	t.ok(_.every([grep.inputFile, grep.outputFile, grep.tranformStream], function (stream) {
		return stream instanceof Stream;
	}));

	t.throws( function () { new Grepper("not an object"); });

	t.end();
});

test('Grep.run(): pipes streams', function(t) {

	var	regexNewVersion = new RegExp(opts.newVersion),
		cb = function (err, results) {
			t.ok(fs.existsSync(grep.inputFilePath), "input file shd exist");
			t.notOk(fs.existsSync(grep.outputFilePath), "tmp output file shd NOT exist");

			fs.readFile(grep.inputFilePath, function (err, data) {
				t.ok(regexNewVersion.test(data), "file has new version number in it, that shd suffice with other tests going on in replace-text.js + grep.js");
			});
		},
		grep = new Grepper(_.extend({}, opts, {cb: cb}));

  	t.plan(3);

  	// fire away!
  	grep.run();
});
