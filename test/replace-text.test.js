/*jslint nomen: true, plusplus: false, sloppy: true, white:true*/
/*jshint nomen: false, curly: true, plusplus: false, expr:true, undef:true, newcap:true, latedef:true, camelcase:true  */
/*global module: false, iScroll:false, setTimeout: false, document:false, WebKitCSSMatrix:false, _: false, Backbone: false, backbone: false, $: false, define: false, require: false, console: false, window:false */
var test        = require('tap').test,
    _           = require('underscore'),
    ReplaceText = require('../lib/replace-text');

var opts = {
	newVersion: 1234,
	requireJs: false,
	filePath: "js/app.newie.js"
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
		cssHaystackStem     = '<link rel="stylesheet" type="text/css" href="/random/public/',
		jsHaystackStem      = '<script type="text/html" src="/random/public/',
		jsHaystackStemVers  = jsHaystackStem + jsAsset + '.35435435.js"> ' + "\n" + 'main: "'+ jsAsset,
		cssHaystack1        = cssHaystackStem + cssAssetSuffixed + '">',
		cssHaystack2        = cssHaystackStem + cssAsset + '.6546787.css">',
		cssHaystackExpected = cssHaystackStem + cssAsset + '.' + opts.newVersion + '.css">',
		jsHaystack1         = jsHaystackStem + jsAssetSuffixed + '"> ' + "\n" + 'main: "'+ jsAsset + '"',
		jsHaystack2         = jsHaystackStemVers + '"',
		jsHaystackExpected  = jsHaystackStem + jsAsset + '.' + opts.newVersion +  '.js"> ' + "\n" + 'main: "'+ jsAsset + '"',
		// requireJS
		jsHaystackRequireJs             = jsHaystackStemVers + '.35434354"',
		jsHaystackExpectedRequireJs     = jsHaystackStem + jsAsset + '.' + opts.newVersion + '.js"> ' + "\n" + 'main: "' + jsAsset + '.' + opts.newVersion + '"',
		// jsHaystackDataRJs				= '<script data-main="' + jsAsset + '.1354354345' + '" src="/js/vendor/require.js"/>',
		jsHaystackDataRJs				= '<script data-main="' + jsAsset + '" src="/js/vendor/require.js"/>',
		jsHaystackExpectedDataRJs       = '<script data-main="' + jsAsset + '.' + opts.newVersion + '" src="/js/vendor/require.js"/>',
		replacerCSS         = new ReplaceText(_.extend({}, opts, {requireJs:true, filePath: cssAssetSuffixed})),
		replacerJs          = new ReplaceText(_.extend({}, opts, {filePath: jsAssetSuffixed})),
		replacerRequireJs   = new ReplaceText(_.extend({}, opts, {requireJs:true, filePath: jsAssetSuffixed})),
		// bug fix 0.0.8
		jsAssetTwo						= '/js/modules/main',
		jsHaystackDataRJsTwo			= '<script data-main="' + jsAssetTwo + '" src="/js/vendor/require.js"/>',
		jsHaystackExpectedDataRJsTwo    = '<script data-main="' + jsAssetTwo + '.' + opts.newVersion + '" src="/js/vendor/require.js"/>',
		replacerRequireJsTwo= new ReplaceText(_.extend({}, opts, {requireJs:true, filePath: jsAssetTwo}));

	// nothing shd be replaced
	t.equal(replacerCSS.run(cssHaystackFail + jsHaystackFail), cssHaystackFail + jsHaystackFail);
	t.equal(replacerJs.run(jsHaystackFail + cssHaystack1), jsHaystackFail + cssHaystack1);
	t.equal(replacerRequireJs.run(jsHaystackFail + cssHaystack2), jsHaystackFail + cssHaystack2);

	// SHOULD BE replaced
	t.equal(replacerCSS.run(cssHaystack1 + jsHaystack1), cssHaystackExpected + jsHaystack1);
	t.equal(replacerCSS.run(cssHaystack2  + jsHaystack2), cssHaystackExpected  + jsHaystack2);
	t.equal(replacerJs.run(jsHaystack1 + cssHaystack1), jsHaystackExpected + cssHaystack1);
	t.equal(replacerJs.run(jsHaystack2 + cssHaystack1), jsHaystackExpected + cssHaystack1);
	t.equal(replacerRequireJs.run(jsHaystack1), jsHaystackExpectedRequireJs);
	t.equal(replacerRequireJs.run(jsHaystackRequireJs), jsHaystackExpectedRequireJs);
	t.equal(replacerRequireJs.run(jsHaystackDataRJs), jsHaystackExpectedDataRJs);
	// t.equal(replacerRequireJsTwo.run(jsHaystackDataRJsTwo), jsHaystackExpectedDataRJsTwo);
	t.end();
});

test('.proto.run(haystack): shd version img assets in CSS files', function(t) {

	var img = 'test.png',
		imgVersioned = 'test.' + opts.newVersion + '.png',
		imgNested = 'assets/img/test.png',
		imgNestedVersioned = 'assets/img/test.' + opts.newVersion + '.png',
		haystackGenSingle = function (asset) {
			var cssBlock = '.hello {\
				width: 300px;\
				height: 199px;\
				background-image: url(\'' + asset + '\');\
			}';
			return cssBlock;
		},
		haystackGenDouble = function (asset) {
			return (haystackGenSingle(asset)).replace('\'', '"');
		},
		replacerImg = new ReplaceText(_.extend({}, opts, {filePath: img})),
		replacerImgNested = new ReplaceText(_.extend({}, opts, {filePath: imgNested}));

	t.equal(replacerImg.run(haystackGenSingle(img)), haystackGenSingle(imgVersioned), 'versions single quoted img files');
	t.equal(replacerImg.run(haystackGenDouble(img)), haystackGenDouble(imgVersioned), 'versions double quoted img files');
	t.equal(replacerImg.run(haystackGenSingle(imgNested)), haystackGenSingle(imgNestedVersioned), 'versions single quoted imgNested files');
	t.equal(replacerImg.run(haystackGenDouble(imgNested)), haystackGenDouble(imgNestedVersioned), 'versions double quoted imgNested files');

	t.end();
});

test('.proto.run(haystack): should correctly version files when one file name contains another file name', function(t) {

	var jsAsset1 = 'bundle.js',
    jsAsset2 = 'login-bundle.js',
		jsAsset1Versioned = 'bundle.' + opts.newVersion + '.js',
		jsAsset2Versioned = 'login-bundle.' + opts.newVersion + '.js',
    jsHaystack1 = '<script type="text/html" src="/random/public/' + jsAsset1 + '"</script>',
    jsHaystack1Expected = '<script type="text/html" src="/random/public/' + jsAsset1Versioned + '"</script>',
    jsHaystack2 = '<script type="text/html" src="/random/public/' + jsAsset2 + '"</script>',
    jsHaystack2Expected = '<script type="text/html" src="/random/public/' + jsAsset2Versioned + '"</script>',
		replacerJs1 = new ReplaceText(_.extend({}, opts, {filePath: jsAsset1}));
		replacerJs2 = new ReplaceText(_.extend({}, opts, {filePath: jsAsset2}));

  // should be replaced
  t.equal(replacerJs1.run(jsHaystack1), jsHaystack1Expected);
  t.equal(replacerJs2.run(jsHaystack2), jsHaystack2Expected);

  // should not be replaced
  t.equal(replacerJs1.run(jsHaystack2), jsHaystack2);
  t.equal(replacerJs2.run(jsHaystack1), jsHaystack1);

	t.end();
});
