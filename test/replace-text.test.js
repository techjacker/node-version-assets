var test = require('tap').test,
	_ = require('underscore'),
	ReplaceText = require('../lib/replace-text');

var opts = {
	newVersion: 1234,
	requireJs: false,
	filePath: "js/app.newie.js",
};

test('Replace Text Contructor Fn: shd create needed regexes', function(t) {

	var expected = {
		newVersion: 1234,
		requireJs: false,
		filePath: 'js/app.newie.js',
		filePathBeg: 'js/app.newie',
		filePathSuffix: '.js',
		regedFilePathSuffix: '\\.js',
		regedFilePathBeg: 'js\\/app\\.newie',
		fullRegex: /(?!js\/app\.newie)\.\d+\.js|(?!js\/app\.newie)\.js/
	};

	// shd assign generate needed regexes
	// t.deepEqual(new ReplaceText(opts), expected);
	// t.throws( function () { new ReplaceText(_.extend({}, opts, {newVersion:'string'})); });
	t.throws( function () { new ReplaceText(_.extend({}, opts, {filePath:1354654})); });

	t.end();
});


test('RequireJs settings: if path target not a .js file then set to false', function(t) {

	var replacerCSS = new ReplaceText(_.extend({}, opts, {requireJs:true, filePath:"css/all-min.css"})),
		replacerJs = new ReplaceText(_.extend({}, opts, {requireJs:true, filePath:"scripts/alljs.js"}));

	// even though requireJs set to true in options > only takes effect on .js files
	t.strictEqual(replacerCSS.requireJs, false);
	t.strictEqual(replacerJs.requireJs, true);
	t.end();
});


test('.proto.run(haystack): shd replace text', function(t) {

    var notAJsAsset         = 'vernder/path/notanasset',
        notACssAsset        = 'somethingdifferent.css',
        cssHaystackFail     = '<link rel="stylesheet" type="text/css" href="' + notACssAsset + '">',
        jsHaystackFail      = '<script type="text/html" src="'+ notAJsAsset + '.js">     main: "'+ notAJsAsset + '"',
        cssAsset            = 'css/all-min',
        cssAssetSuffixed    = cssAsset + '.css',
        jsAsset             = 'scripts/js/all-js',
        jsAssetSuffixed     = jsAsset + '.js',
        cssHaystack1        = '<link rel="stylesheet" type="text/css" href="/random/public/' + cssAssetSuffixed + '">',
        cssHaystack2        = '<link rel="stylesheet" type="text/css" href="/random/public/' + cssAsset + '.6546787.css">',
        cssHaystackExpected = '<link rel="stylesheet" type="text/css" href="/random/public/' + cssAsset + '.' + opts.newVersion + '.css">',
        jsHaystack1         = '<script type="text/html" src="/random/public/'+ jsAssetSuffixed + '"> ' + "\n" + 'main: "'+ jsAsset + '"',
        jsHaystack2         = '<script type="text/html" src="/random/public/'+ jsAsset + '.35435435.js"> ' + "\n" + 'main: "'+ jsAsset + '"',
        jsHaystackRequireJs = '<script type="text/html" src="/random/public/'+ jsAsset + '.35435435.js"> ' + "\n" + 'main: "'+ jsAsset + '.35434354"',
        jsHaystackExpected  = '<script type="text/html" src="/random/public/'+ jsAsset + '.' + opts.newVersion +  '.js"> ' + "\n" + 'main: "'+ jsAsset + '"',
        jsHaystackExpectedRequireJs  = '<script type="text/html" src="/random/public/'+ jsAsset + '.' + opts.newVersion + '.js"> ' + "\n" + 'main: "'+ jsAsset + '.' + opts.newVersion + '"',
        replacerCSS         = new ReplaceText(_.extend({}, opts, {requireJs:true, filePath: cssAssetSuffixed})),
        replacerJs          = new ReplaceText(_.extend({}, opts, {filePath: jsAssetSuffixed})),
        replacerRequireJs   = new ReplaceText(_.extend({}, opts, {requireJs:true, filePath: jsAssetSuffixed}));

	// nothing shd be replaced
	t.equal(replacerCSS.run(cssHaystackFail + jsHaystackFail), cssHaystackFail + jsHaystackFail);
	t.equal(replacerJs.run(jsHaystackFail + cssHaystack1), jsHaystackFail + cssHaystack1);
	t.equal(replacerRequireJs.run(jsHaystackFail + cssHaystack2), jsHaystackFail + cssHaystack2);

	// // stuff SHOULD BE replaced
	t.equal(replacerCSS.run(cssHaystack1 + jsHaystack1), cssHaystackExpected + jsHaystack1);
	t.equal(replacerCSS.run(cssHaystack2  + jsHaystack2), cssHaystackExpected  + jsHaystack2);
	t.equal(replacerJs.run(jsHaystack1 + cssHaystack1), jsHaystackExpected + cssHaystack1);
	t.equal(replacerJs.run(jsHaystack2 + cssHaystack1), jsHaystackExpected + cssHaystack1);
	t.equal(replacerRequireJs.run(jsHaystack1), jsHaystackExpectedRequireJs);
	t.equal(replacerRequireJs.run(jsHaystackRequireJs), jsHaystackExpectedRequireJs);
	t.end();
});

