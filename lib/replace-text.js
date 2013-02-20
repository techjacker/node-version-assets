var _ = require('underscore');
var util = require('util');
var Hash = require('./hash');

/*--------------------------------------
UTILS
---------------------------------------*/
var escapeRegExp = function (str) {
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};

var removeSuffix = function (filePath) {
	return filePath.substr(0, filePath.lastIndexOf('.')) || filePath;
};

var returnSuffix = function (filePath) {
	return filePath.substr(filePath.lastIndexOf('.')) || filePath;
};

/*--------------------------------------
CLASS
---------------------------------------*/

var ReplaceText = function (opts) {

	// minimal error checking
	if (!_.isObject(opts)) {
		throw new Error('an opts obj must be passed to ReplaceText contructor');
	}
	if (!_.isString(opts.filePath)) {
		throw new Error('filePath must be a string:' + this.filePath.toString && this.filePath.toString());
	}

	this.newVersion = opts.newVersion;

	/////////////////////////////////////////////////
	// file PATH > for creating/deleting old files //
	/////////////////////////////////////////////////
	this.filePath = opts.filePath;
	this.filePathBeg = removeSuffix(this.filePath);
	this.filePathSuffix = returnSuffix(this.filePath);
	this.requireJs = (opts.requireJs === true) && (this.filePathSuffix === '.js');

	///////////////////////////////////////////////
	// file NAME > for grepping > find + replace //
	///////////////////////////////////////////////
	this.fileName = opts.filePath.split('/').pop();
	this.fileNameBeg = removeSuffix(this.fileName);
	this.fileNameSuffix = returnSuffix(this.fileName);
	this.regedFileNameSuffix = escapeRegExp(this.fileNameSuffix);
	this.regedFileNameBeg = escapeRegExp(this.fileNameBeg);
	// regexes
	this.oldVersionFileNameRegex = new RegExp(this.regedFileNameBeg + '\\.[a-z0-9]+' + this.regedFileNameSuffix + '$', "ig");
	this.fileNameRegex = new RegExp(this.regedFileNameBeg + '(\\.[a-z0-9]+' + this.regedFileNameSuffix + ')|' + this.regedFileNameBeg + '(' + this.regedFileNameSuffix + ')', "ig");
	this.fileNameRegexRequireJs = new RegExp(this.regedFileNameBeg + '\\.[a-z0-9]+(?!' + this.regedFileNameSuffix + ')|' + this.regedFileNameBeg + '(?!' + this.regedFileNameSuffix + ')', "ig");

	return _(this).bindAll('assignNewVersion', 'run');
};

ReplaceText.prototype.assignNewVersion = function (callback) {

	if (!this.newVersion) {

		this.hash = new Hash({filePath: this.filePath});

		this.hash.run(function(err, md5sum, fileContents) {
		// this.hash.run(function(err, md5sum) {

			if (err) {
				callback(err);
			} else {
				this.newVersion = md5sum;
				this.fileContents = fileContents;
				callback(null);
			}

		}.bind(this));

	} else {
		callback(null);
	}
};


ReplaceText.prototype.run = function (haystack, overrideRequireJs) {

	var	newfileNameStem = this.fileNameBeg + '.' + this.newVersion;

	haystack = haystack.replace(this.fileNameRegex, newfileNameStem + this.fileNameSuffix);

	if (this.requireJs && overrideRequireJs !== true) {
		haystack = haystack.replace(this.fileNameRegexRequireJs, newfileNameStem);
		haystack = haystack.replace(this.fileNameRegex, newfileNameStem + this.fileNameSuffix);
	}

	return haystack;
};

module.exports = ReplaceText;