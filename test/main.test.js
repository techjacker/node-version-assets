var test  = require('tap').test,
    _     = require('underscore'),
    async = require('async'),
    path  = require('path'),
    fs    = require('fs'),
  // my libs
    Main  = require('./../lib/main');

// my test vars
var cssFile     = "all-min.css",
    jsNewie     = "app.newie.js",
    jsOldie     = "app.oldie.js",
    fixturesDir = path.join(process.cwd(), 'test-utils/fixtures/'),
    cssDir      = fixturesDir + 'css/',
    jsDir       = fixturesDir + 'js/',
    opts        = {
      silence: true,
      cb: function (err, results) {},
      assets: [cssDir + cssFile, jsDir + jsNewie, jsDir + jsOldie],
      grepFiles: [fixturesDir + "index.html"],
      // requireJs: true,
      newVersion: 1111111111
  };

var cleaner = require('./../test-utils/test-cleanup');

  test('Main Contructor Fn: shd assign correct properties', function(t) {

   var mainInstance = new Main(opts),
     mainInstanceDefaultsChecking = new Main(_.extend({}, opts, {cb: null, newVersion: null, grepFiles: null}));

   // shd assign correctly
   t.equal(mainInstance.cb, opts.cb);
   t.equal(mainInstance.assets, opts.assets);
   t.equal(mainInstance.grepFiles, opts.grepFiles);

   // defaults
   t.equal(mainInstanceDefaultsChecking.requireJs, undefined);
   t.ok(_.isArray(mainInstanceDefaultsChecking.grepFiles), "this.grepFiles defaults to an empty array");
   t.equal(mainInstanceDefaultsChecking.cb, undefined);

   // validation
   t.throws( function () { new Main("silenceErrorJustForTests"); });
   t.throws( function () { new Main(_.extend({}, opts, {assets:"shd be an array", silenceError: true})); }, "opts.assets is the only required param");

   t.end();
  });

  test('Main.checkPaths() ', function(t) {

   var mainInstance = new Main(opts),
     mainInstanceFails = new Main(_.extend({}, opts, {assets:[fixturesDir + "css/missing.css"]})),
     cb = function (err, results) {
       t.equal(err, null, "if all files exist then err shd be null");
     },
     cbFail = function (err, results) {
       t.ok(err, "non existing file in array shd throw an error:" + err);
     };

   t.plan(2);

   // fire away!
   mainInstance.checkPaths(cb);
   mainInstanceFails.checkPaths(cbFail);
  });


  test('Main.grepFilesReplace()', function(t) {

   var mainInstance = new Main(opts),
     mainInstanceFails = new Main(_.extend({}, opts, {grepFiles:[]})),
     // results is undefined from createWriteStream callback
     cb = function (err, results) {
       t.equal(mainInstance.greppers.length, opts.grepFiles.length, "grepFiles instances shd be created");
       t.equal(err, null, "if all files exist then err shd be null");
     },
     cbFail = function (err, results) {
       t.equal(err, null, "no files to grep");
     };

   t.plan(3);

   // fire away!
   mainInstance.initReplacers(function() {
     mainInstance.grepFilesReplace(cb);
     mainInstanceFails.grepFilesReplace(cbFail);
   });
  });

  test('Main.renameAssetsInFilesystem(): shd write file', function(t) {

   var mainInstance = new Main(opts),
     versionedAssets = opts.assets.map(function (path) {
       return path.replace(/(\.css|\.js)/, '.' + opts.newVersion + "$1");
     }),
     testAssert = function (result) {

       // if result is true then every file exists
       t.ok(result, "every file exists")

       // delete newly generated files
       async.map(versionedAssets, fs.unlink, function () {
         t.end();
       });
     },
     testRun = function () {
       // check every file has been created
       async.every(versionedAssets, fs.exists, testAssert);
     };

   // fire away!
   mainInstance.initReplacers(function() {
     mainInstance.renameAssetsInFilesystem(testRun);
   });
  });



  // test('Main.run(): shd assign needed properties', function(t) {

  //  var mainInstance = new Main(opts),
  //    mainInstanceFails = new Main(_.extend({}, opts, {grepFiles:[]})),
  //    callMe = function (err, results) {
  //      t.equal(err, null, "if all operations run successfully then err shd be null");
  //      t.end();
  //    };

  //  // fire away!
  //  mainInstance.run(callMe);
  // });



test('Main.run(): md5 versioning', function(t) {

  var mainMd5 = new Main(_.extend({}, opts, {newVersion: null, keepOriginal: true})),
    runTestAssertions = function (err, results) {

      if (err) {
        t.fail(err);
        return t.end();
      }

      var cssDirContents = fs.readdirSync(cssDir),
        jsDirContents = fs.readdirSync(jsDir),
        regex = /(.*)(\.js|\.css)/,
        cssVersioned = cssFile.replace(regex, "$1." + mainMd5.replacers[0].newVersion + "$2"),
        jsNewieVersioned = jsNewie.replace(regex, "$1." + mainMd5.replacers[1].newVersion + "$2"),
        jsOldieVersioned = jsOldie.replace(regex, "$1." + mainMd5.replacers[2].newVersion + "$2");

      t.deepEqual(err, null, "no errors on filepath");
      t.ok(cssDirContents.indexOf(cssVersioned) !== -1, "css file md5 versioned copy generated");
      t.ok(jsDirContents.indexOf(jsNewieVersioned) !== -1, "jsNewie md5 versioned copy generated");
      t.ok(jsDirContents.indexOf(jsOldieVersioned) !== -1, "jsOldie md5 versioned copy generated");


      //////////////////////////////////////////////////////////////////////
      // run again with same file contents > shd generate same file names //
      //////////////////////////////////////////////////////////////////////
      mainMd5.run(function (err) {

        if (err) {
          t.fail(err);
          return t.end();
        }

        var cssDirContentsSecondTime = fs.readdirSync(cssDir),
          jsDirContentsSecondTime = fs.readdirSync(jsDir);

        t.ok(cssDirContentsSecondTime.indexOf(cssVersioned) !== -1, "2nd time: css file md5 versioned copy generated");
        t.ok(jsDirContentsSecondTime.indexOf(jsNewieVersioned) !== -1, "2nd time: jsNewie md5 versioned copy generated");
        t.ok(jsDirContentsSecondTime.indexOf(jsOldieVersioned) !== -1, "2nd time: jsOldie md5 versioned copy generated");
        t.end();
      });
    };


  cleaner(function (err) {

    if (err) {
      t.fail(err);
      return t.end();
    }


    mainMd5.run(runTestAssertions);
    // fixtures dir = dif when run from this script (rather than npm run-script pretest)
  });
});

test('Main.run(): matching file names', function(t) {
	var mainInstance = new Main({
		assets: [
      jsDir + 'login-bundle.js',
      jsDir + 'bundle.js'
    ],
    silence: true,
    grepFiles: []
	});

	mainInstance.run(function() {
		var jsDirContents = fs.readdirSync(jsDir);
		t.ok(jsDirContents.indexOf(mainInstance.replacers[0].outputFileName) !== -1, mainInstance.replacers[0].outputFileName + " exists");
		t.ok(jsDirContents.indexOf(mainInstance.replacers[1].outputFileName) !== -1, mainInstance.replacers[1].outputFileName + " exists");
		t.end();
	});
});
