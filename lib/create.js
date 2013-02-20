var util   = require('util');
var fs     = require('fs');
var _      = require('underscore');
var crypto = require('crypto');

// my libs
var Replacer = require('./replace-text');


var Creator = function (opts) {

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

	this.outputFilePath = this.replacer.filePathBeg + '.' + this.replacer.newVersion + this.replacer.filePathSuffix;

	return _(this).bindAll('run');
};




Creator.prototype.run = function (callback) {

	var cb = (_.isFunction(callback)) ? callback : function() {};

	var output = fs.createWriteStream(this.outputFilePath);

	// attach events
	output.on('error', cb);
	output.end = function () {
		cb(null, this.outputFilePath);
	}.bind(this);

	// bombs away!
	output.write(this.replacer.fileContents);
	output.end();
};

module.exports = Creator;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Doesn't work because we've already deleted original file by the time we run this                                        //
// Solution: cache the filecontents result when calculating md5hash = first task to be run after checking that files exist //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Creator.prototype.run = function (callback) {
// 	var cb = (_.isFunction(callback)) ? callback : function() {};
// 	// file streams
// 	this.inputFile = fs.createReadStream(this.filePath);
// 	this.outputFile = fs.createWriteStream(this.outputFilePath);
// 	// attach error handlers
// 	this.inputFile.on('error', cb);
// 	this.outputFile.on('error', cb);
	// attach callback
	// this.outputFile.end = function () {
	// 	cb(null);
	// };
// 	// bombs away!!!
// 	this.inputFile.pipe(this.outputFile);
// };