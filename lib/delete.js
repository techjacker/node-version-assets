var util = require('util');
var fs = require('fs');
var _ = require('underscore');
var async = require('async');
// my lib
var Replacer = require('./replace-text');


var Deleter = function (opts) {

	var	validReplacer = opts.replacer instanceof Replacer;

	// minimal error checking
	if (!_.isObject(opts)) {
		throw new Error('an opts obj must be passed to Deleter contructor');
	}

	// streaming error evts
	if (_.isFunction(opts.cb)) {
		this.cb = opts.cb;
	}

	if (validReplacer && _.isString(opts.filePath)) {
		this.filePath = opts.filePath;
		this.replacer = opts.replacer;
	} else {
		throw new Error({
			message: "invalid replacers"
		});
	}

	return _(this).bindAll('run', 'dirList', 'markForDeletion', 'deleteFiles');
};

Deleter.prototype.dirList = function (callback) {

	this.directory = this.filePath.split('/').slice(0, -1).join('/');

	fs.readdir(this.directory, function (err, files) {

		this.directoryContents = _(files).map(function (fileName) {
			// return this.directory + '/' + fileName;
			return fileName;
		}.bind(this));

		_.isFunction(callback) && callback(null, this.directoryContents);

	}.bind(this))
};

Deleter.prototype.markForDeletion = function (callback) {

	this.toBeDeleted = [];

	this.directoryContents.length && this.directoryContents.forEach(function (fileName, index) {

		// var oldVersion = this.replacer.oldVersionRegex.test(fileName);
		var oldVersion = this.replacer.oldVersionFileNameRegex.test(fileName);
		var originalVersion = (fileName === this.replacer.fileName);

        // Only delete the original specified
		if (oldVersion || (this.replacer.deleteOriginal && originalVersion)) {
			// this.toBeDeleted.push(fileName);
			this.toBeDeleted.push(this.directory + '/' + fileName);
		}

	}.bind(this));

	_.isFunction(callback) && callback(null, this.toBeDeleted);
};

Deleter.prototype.deleteFiles = function (callback) {

	// fs.stat(path, callback(err, stats)) and stats.isDirectory()
	// currently this code will also delete directories
	// add above fn to check before deleting if this is an issue
	if (this.toBeDeleted.length) {
		async.map(this.toBeDeleted, fs.unlink, callback);
		// console.log('this.toBeDeleted', this.toBeDeleted);
	} else {
		_.isFunction(callback) && callback(null, this.toBeDeleted);
	}
};


Deleter.prototype.run = function (callback) {

	// call passed callback or do no-op
	var cb = (_.isFunction(callback)) ? callback : function() {};

	async.series([
		this.dirList,
		this.markForDeletion,
		this.deleteFiles
	], function (err, results) {
		cb(err, this.toBeDeleted);
	}.bind(this));
};

module.exports = Deleter;
