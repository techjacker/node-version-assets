var	async = require('async'),
	curry = require('curry'),
	util = require('util'),
	fs = require('fs'),
	// my libs
	cleaner = require('./test-cleanup');

// clean!
cleaner();
