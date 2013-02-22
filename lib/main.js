/*jslint nomen: true, plusplus: false, sloppy: true, white:true*/
/*jshint nomen: false, curly: true, plusplus: false, expr:true, undef:true, newcap:true, latedef:true, camelcase:true  */
/*global iScroll:false, setTimeout: false, document:false, WebKitCSSMatrix:false, Backbone: false, backbone: false, $: false, define: false, require: false, console: false, window:false */

var fs = require('fs');
var async = require('async');
var _ = require('underscore');
var util = require('util');
// var cryto = require('cryto');

// my libs
var Replacer = require('./replace-text');
var Deleter = require('./delete');
var Creator = require('./create');
var GrepFile = require('./grep');



// Class
var Version = function (opts) {

	// minimal error checking
	if (!_.isObject(opts)) {
		console.log('an opts obj must be passed to main contructor');
		throw new Error({message: 'an opts obj must be passed to main contructor'});
	}

	if (!_.isArray(opts.assets)) {
		console.log('files array is missing');
		throw new Error({message: 'files array is missing'});

	} else {

		if (_.isFunction(opts.cb)) this.cb = opts.cb;

		// Find and replace references to assets in the list of files in the grep array //
		if (opts.grepFiles && _.isArray(opts.grepFiles)) this.grepFiles = opts.grepFiles;

		// remove js suffix when replacing text in these files
		if (opts.requireJs && opts.requireJs === true) this.requireJs = true;

		this.assets = opts.assets;

		this.baseOpts = {
			newVersion: opts.newVersion,
			assets: this.assets,
			requireJs: this.requireJs,
            deleteOriginal: opts.deleteOriginal || true
		};

		return _(this).bindAll('run', 'initReplacers', 'checkPaths', 'grepFilesReplace', 'renameAssetsInFilesystem', 'deleteOldAssetsInFilesystem');
	}
};


Version.prototype.checkPaths = function (cb) {

	var allFiles = this.assets.concat(this.grepFiles);

	allFiles.length && async.every(allFiles, fs.exists, function (results) {

		var err = null;

		// results now equals an array of the existing files
		if (!results) {
			err = '\nWe cannot find all these files, are you sure the paths are correct for every one?\n'
			err += allFiles.toString().replace(/,/gi, '\n');
			err += '\n\nRemember paths are relative to where you are running the script.\n\n';
		}

		if (_.isFunction(cb)) {
			cb(err, results);
		} else {
			throw err;
		}
	});

	return this;
};

Version.prototype.initReplacers = function (cb) {

	this.replacers = [];

	this.assets.forEach(function (path) {
		var replacerOpts = _.extend({}, this.baseOpts, {filePath: path});
		this.replacers.push(new Replacer(replacerOpts));
	}.bind(this));

	async.parallel(_.pluck(this.replacers, 'assignNewVersion'), cb);
};

// helper
var initAssetClasses = function (assetsArr, Klass, self) {

	var valid = _.isArray(assetsArr);

	return valid && assetsArr.map(function (path, index) {
		var opts = _.extend({}, this.baseOpts, {
			filePath: path,
			replacer: this.replacers[index],
			newVersion: this.replacers[index].newVersion
		});
		return new Klass(opts);
	}.bind(self));
};

var initGrepClasses =function (assetsArr, Klass, self) {

	var valid = _.isArray(assetsArr);

	return valid && assetsArr.map(function (path, index) {
		var opts = _.extend({}, this.baseOpts, {
			filePath: path,
			replacers: this.replacers
		});
		return new Klass(opts);
	}.bind(self));
};

Version.prototype.grepFilesReplace = function (cb) {

	if (this.grepFiles.length) {

		this.greppers = initGrepClasses(this.grepFiles, GrepFile, this);

		async.parallel(_.pluck(this.greppers, 'run'), cb);

	} else {
		cb(null, null);
	}
};

Version.prototype.renameAssetsInFilesystem = function (cb) {

	this.creators = initAssetClasses(this.assets, Creator, this);

	if (this.creators.length) {
		async.parallel(_.pluck(this.creators, 'run'), cb);
	} else {
		cb(null, null);
	}
};

Version.prototype.deleteOldAssetsInFilesystem = function (cb) {

	this.deleters = initAssetClasses(this.assets, Deleter, this);

	if (this.deleters.length) {
		async.parallel(_.pluck(this.deleters, 'run'), cb);
	} else {
		cb(null, null);
	}
};


Version.prototype.run = function (cb) {

	_.isFunction(cb) || this.cb && (cb = this.cb) || (cb = function() {});

	async.series([
		this.checkPaths,
		this.initReplacers,
		this.deleteOldAssetsInFilesystem,
	], function (err, deleteResults) {

		var msg = '';
		var deletedFiles = _.flatten(deleteResults[2]);

		if (err) {

			msg += '\nError!\n' + err;
			console.log(msg);
			cb(err);

		} else {

			async.parallel([this.grepFilesReplace, this.renameAssetsInFilesystem], function (err, renameResults) {

				var indent = '\n   ',
					deletedDeduped = deletedFiles.filter(function (res) {
						if (renameResults[1].indexOf(res) === -1) return res;
					}).sort(),
					renamedExtraInfo = renameResults[1].map(function (res) {
						if (deletedFiles.indexOf(res) !== -1) return res + ": file unchanged > version number re-used";
					}).sort();

				if (err) {
					msg += '\nError!\n' + err;
				} else {
					msg += '\nDeleted Assets:' + indent;
					msg += deletedDeduped.toString().replace(/,/gi, indent);
					msg += '\n\nVersioned Assets Created:' + indent;
					msg += renamedExtraInfo.toString().replace(/,/gi, indent);
					msg += '\n\nFiles whose contents were updated with refs to renamed asset files:' + indent;
					msg += renameResults[0].sort().toString().replace(/,/gi, indent) + '\n';
				}

				// output results
				console.log(msg);
				cb(err, renameResults);
			});
		}
	}.bind(this));
};

/////////////////
// testing     //
/////////////////
// var	testRunner = require('./../test-utils/test-helpers').testRunner;
// testRunner();

module.exports = Version;
