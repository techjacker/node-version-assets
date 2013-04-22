// node-inspector& nodemon --debug-brk --debug grep.js -w grep.js

	var Version = require("/home/andy/Desktop/00--projects/00_github-projects/000-deployed/node-version-assets");
	var versionInstance = new Version({
		assets: ['test.png', 'test.js', 'assets/img/test.png'],
		grepFiles: ['assets/css/test.css'],
		keepOriginalAndOldVersions: true,
		requireJs: false
	});

	versionInstance.run();