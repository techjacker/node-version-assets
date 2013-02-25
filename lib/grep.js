var util = require('util');
var fs = require('fs');
var _ = require('underscore');
var Stream = require('stream');
// my lib
var Replacer = require('./replace-text');


var GrepReplaceTextInFile = function (opts) {

	var	validReplacers = _.isArray(opts.replacers) && _.every(opts.replacers, function (replacer) {
			return (replacer instanceof Replacer);
		});

	// minimal error checking
	if (!_.isObject(opts)) {
		throw new Error('an opts obj must be passed to GrepReplaceTextInFile contructor');
	}

	// streaming error evts
	if (_.isFunction(opts.cb)) {
		this.cb = opts.cb;
	}

	////////////////////////////////////////////
	// initialise regex classes		          //
	////////////////////////////////////////////
	if (validReplacers) {
		this.replacers = opts.replacers;
		// console.log('this.replacers', this.replacers);
	} else {

		// throw new Error({
		// 	message: "invalid replacers"
		// });
		// TO DO: change tests so can delete below
		this.replacers = [];
		opts.assets.forEach(function (path) {
			var replacerOpts = {
				newVersion: opts.newVersion,
				requireJs: opts.requireJs,
				filePath: path
			};
			this.replacers.push(new Replacer(replacerOpts));
		}.bind(this));
	}

	/////////////////////////////////////
	// file to be grepped              //
	// opts.filePath: @{string}        //
	// can only grep on file at a time //
	/////////////////////////////////////
	this.inputFilePath = opts.filePath;
	this.outputFilePath = opts.filePath + '.tmp';

	// file streams
	this.inputFile = fs.createReadStream(this.inputFilePath);
	this.outputFile = fs.createWriteStream(this.outputFilePath);
	// this.outputFile = fs.createWriteStream(this.replacer.run(opts.filePath, true));

	// tranforming stream > performs replaces on text before piping thru to write stream
	this.tranformStream = new Stream();
	this.tranformStream.readable = true;
	this.tranformStream.writable = true;

	_(this).bindAll('run');
};

GrepReplaceTextInFile.prototype.runSync = function (callback) {

	var input = fs.readFileSync(this.inputFilePath, 'utf8');

	this.replacers.forEach(function (replacer) {
		input = replacer.run(input);
	});

	fs.writeFileSync(this.inputFilePath, input, 'utf8');

	fs.unlink(self.inputFilePath, callback);
};


GrepReplaceTextInFile.prototype.run = function (callback) {

	var	self = this,
		cb = (_.isFunction(callback)) ? callback : self.cb;

	this.tranformStream.write = function (buf) {
		var str = buf.toString();
		self.replacers.forEach(function (replacer) {
			str = replacer.run(str);
		});
		self.tranformStream.emit('data', str);
	};

	this.tranformStream.end = function (buf) {

		// flush buffer + close stream
		if (arguments.length) { self.tranformStream.write(buf); }

		// delete input file
		fs.unlink(self.inputFilePath, function (err) {
			if (err) {
				cb(err);
			} else {
				// rename output file back to original input file's name that we've just deleted
				fs.rename(self.outputFilePath, self.inputFilePath, function (err, results) {
					if (err) cb(err);
					// return original file path for logging success to terminal
					cb(null, self.inputFilePath);
				});
			}
		});
		self.tranformStream.writable = false;
	};

	this.tranformStream.destroy = function () {
		self.tranformStream.writable = false;
	};

	////////////////////
	// Error Handling //
	////////////////////
	this.inputFile.on('error', cb);
	this.outputFile.on('error', cb);
	this.tranformStream.on('error', cb);


	/////////////////
	// Bombs Away! //
	/////////////////
	this.inputFile.pipe(this.tranformStream).pipe(this.outputFile);
};

module.exports = GrepReplaceTextInFile;