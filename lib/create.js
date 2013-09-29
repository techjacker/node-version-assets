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
		this.replacer = opts.replacer;
		this.filePath = opts.filePath;
		// this.outputFilePath = opts.replacer.outputFilePath;
		this.keepOriginalAndOldVersions = opts.keepOriginalAndOldVersions;
		this.keepOriginal = opts.keepOriginal;
	} else {
		throw new Error({
			message: "invalid replacers"
		});
	}

	// this.outputFilePath = this.replacer.outputFilePath;
	// this.outputFilePath = this.replacer.filePathBeg + '.' + this.replacer.newVersion + this.replacer.filePathSuffix;

	return _(this).bindAll('run');
};


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Doesn't work because we've already deleted the original file by the time we run this                                        //
// Solution: cache the filecontents result when calculating md5hash = first task to be run after checking that files exist //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
Creator.prototype.run = function (callback) {

	var cb = (_.isFunction(callback)) ? callback : function() {};

	// file streams
	this.inputFile = fs.createReadStream(this.filePath);
	this.outputFile = fs.createWriteStream(this.replacer.outputFilePath);

	// attach error handlers
	this.inputFile.on('error', cb);
	this.outputFile.on('error', cb);

	// attach callback
	this.outputFile.end = function () {
		var resObj = {
			newFile: this.replacer.outputFilePath
		};
		// delete input file at the end unless told not to
		if (this.keepOriginalAndOldVersions !== true && this.keepOriginal !== true) {
			fs.unlink(this.filePath, function (err, result) {
				if (!err) resObj.deletedOriginalFile = this.filePath;
				cb(err, resObj);
			}.bind(this));
		} else {
			cb(null, resObj);
		}
	}.bind(this);

	// bombs away!!!
	this.inputFile.pipe(this.outputFile);
};

module.exports = Creator;


// Creator.prototype.run = function (callback) {

// 	var cb = (_.isFunction(callback)) ? callback : function() {};

// 	var output = fs.createWriteStream(this.outputFilePath);

// 	// attach events
// 	output.on('error', cb);
// 	output.end = function () {
// 		cb(null, this.outputFilePath);
// 	}.bind(this);

// 	// bombs away!
// 	output.write(this.replacer.fileContents);
// 	output.end();
// };
