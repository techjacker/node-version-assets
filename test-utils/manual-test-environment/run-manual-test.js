// node-inspector& nodemon --debug-brk --debug grep.js -w grep.js

	var Version = require("../../");
	var versionInstance = new Version({
		assets: ['test.png', 'test.js', 'assets/img/test.png'],
		grepFiles: ['assets/css/test.css'],
		keepOriginalAndOldVersions: true,
		requireJs: false
	});

	versionInstance.run();