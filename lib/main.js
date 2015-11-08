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
		opts.silenceError || opts === 'silenceErrorJustForTests' || console.error('an opts obj must be passed to main constructor', opts);
		throw new Error({message: 'an opts obj must be passed to main constructor: ' + opts});
	}

	if (!_.isArray(opts.assets)) {
		opts.silenceError || console.error('files array is missing', opts);
		throw new Error({message: 'files array is missing: ' + opts.assets});

	} else {

		if (_.isFunction(opts.cb)) this.cb = opts.cb;

		this.silence = opts.silence;
		this.assets = opts.assets;
		this.requireJs = opts.requireJs; // remove js suffix when replacing text in these files
        this.keepOriginalAndOldVersions = opts.keepOriginalAndOldVersions;
        this.keepOriginal = opts.keepOriginal;
        this.keepOldVersions = opts.keepOldVersions;

		// Find and replace references to assets in the list of files in the grep array //
		this.grepFiles = (opts.grepFiles && _.isArray(opts.grepFiles)) ? opts.grepFiles : [];

		this.baseOpts = {
			newVersion: opts.newVersion,
			assets: this.assets,
			keepOriginalAndOldVersions: this.keepOriginalAndOldVersions,
            keepOriginal: this.keepOriginal,
            keepOldVersions: this.keepOldVersions,
			requireJs: this.requireJs
		};

		return _(this).bindAll('run', 'initReplacers', 'checkPaths', 'grepFilesReplace', 'renameAssetsInFilesystem', 'deleteOldAssetsInFilesystem');
	}
};


Version.prototype.checkPaths = function (cb) {

	var allFiles = (this.grepFiles.length) ? this.assets.concat(this.grepFiles) : this.assets;

	allFiles.length && async.every(allFiles, function(f, cb) {
		fs.stat(f, function (err, s) {
			if (err) { return cb (false); }
			cb(s.isFile());
		});
	}, function (allFilesExist) {

		var err = null;

		// allFilesExist now equals an array of the existing files
		if (!allFilesExist) {
			err = new Error()
			err = '\nWe cannot find all these files, are you sure the paths are correct for every one?\n';
			err += allFiles.toString().replace(/,/gi, '\n');
			err += '\n\nRemember paths are relative to where you are running the script.\n\n';
		}

		if (_.isFunction(cb)) {
			cb(err, allFiles);
		} else {
			throw new Error('must pass callback');
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

var initGrepClasses = function (assetsArr, Klass, self) {

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

	var dontDelete = (this.keepOriginalAndOldVersions === true || this.keepOldVersions === true || !this.assets.length);

	if (dontDelete) {
		cb(null, null);
	} else {
		this.deleters = initAssetClasses(this.assets, Deleter, this);
		async.parallel(_.pluck(this.deleters, 'run'), cb);
	}

};


Version.prototype.run = function (cb) {

	_.isFunction(cb) || this.cb && (cb = this.cb) || (cb = function () {});

	var silence = this.silence;

	async.series([
		this.checkPaths,
		this.initReplacers
	], function (err, deleteResults) {

		var msg = '';

		if (err) {

			msg += '\nError!\n' + err;
			console.error(msg);
			console.error('err', err);
			cb(err);

		} else {

			async.parallel([this.grepFilesReplace, this.renameAssetsInFilesystem, this.deleteOldAssetsInFilesystem], function (err, renameResults) {

				var indent = '\n   ', deletedVersionedFiles, deletedOriginalFiles, deletedDeduped, newVersions;

				if (err) {
					msg += '\nError!\n' + err;
				} else if (_.isArray(renameResults) && renameResults.length) {

					deletedVersionedFiles = _.flatten(renameResults[2]);

					if (renameResults[1].length) {

						newVersions = _(renameResults[1]).pluck('newFile').map(function (res) {
							return (deletedVersionedFiles.indexOf(res) !== -1) ? res + ": file unchanged > version number re-used" : res + "";
						});

						deletedOriginalFiles = _.chain(renameResults[1]).filter(function (resObj) {
							return _(resObj).has('deletedOriginalFile');
						}).pluck('deletedOriginalFile').value();

						deletedDeduped = deletedVersionedFiles.filter(function (res) {
							return renameResults[1].indexOf(res) === -1;
						});

						if (deletedOriginalFiles.length) {
							deletedDeduped = deletedDeduped.concat(deletedOriginalFiles).sort();
						}

					} else {
						deletedDeduped = deletedVersionedFiles;
					}

					/////////////
					// Deleted //
					/////////////
					if (deletedDeduped.length) {
						msg += '\nDeleted Assets:' + indent;
						msg += deletedDeduped.toString().replace(/,/gi, indent) + '\n';
					}

					/////////////
					// Created //
					/////////////
					if (newVersions.length) {
						msg += '\nVersioned Assets Created:' + indent;
						msg += newVersions.sort().toString().replace(/,/gi, indent) + '\n';
					}

					/////////////
					// Grepped //
					/////////////
					if (_.isArray(renameResults[0])) {
						msg += '\nFiles whose contents were updated with refs to renamed asset files:' + indent;
						msg += renameResults[0].sort().toString().replace(/,/gi, indent) + '\n';
					}
				}

				// output results
				silence || console.log(msg);
				cb(err, renameResults);
			});
		}
	}.bind(this));
};

////////////////////
// manual testing //
////////////////////
// var	testRunner = require('./../test-utils/test-helpers').testRunner;
// testRunner();

module.exports = Version;
