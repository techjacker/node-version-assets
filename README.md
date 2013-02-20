# node-version-assets

- Versions your static assets using the power of streams!
- Version number produced from md5hash of each file -> so unchanged assets will keep the same file name and not blow the browser cache.
- Add to your build scripts/favourite build tool.
- See below for grunt integration example.


## What it does:
1. Renames assets on filesystem

		## BEFORE
		/www/project-x/public/css$ ls -l
		> all-min.css

		## AFTER
		/www/project-x/public/css$ ls -l
		> all-min.44d0440440442524c6d667900275e.css

2.  Find and replaces references to them in files:

		<!-- index.html: BEFORE -->
		<link rel="stylesheet" type="text/css" href="css/all-min.css">

		<!-- index.html: AFTER -->
		<link rel="stylesheet" type="text/css" href="css/all-min.44d0440440442524c6d667900275e.css">


## How this module fits into your build process:
1. you:		generate fresh asset and output to the location specified in options.assets (> /public/css/all.min.css)
2. module: 	renames fresh asset file to versioned name (> all.min.__newversion__.css)
3. module: 	deletes original fresh asset file (all.min.css > deleted)
4. module: 	deletes old versioned asset files in the same dir (all.min.__oldversion__.css > deleted)


## Example

#### Input options in script:
	/* ~/www/project-x/version.js */
	var Version = require("node-version-assets");
	var versionInstance = new Version({
		assets: ['public/css/all-min.css', 'public/js/app.js'],
		grepFiles: ['views/prod/index.html']
	});
	versionInstance.run();

#### Run the script:
	andy@bada55:~/www/project-x$ node version.js

	Deleted Assets:
	   public/css/all-min.css
	   public/js/app.js

	Versioned Assets Created:
	   public/css/all-min.44d0440440442524c6d667900275e.css: file unchanged > version number re-used
	   public/js/app.12d070550742574e8d87900er34.js: file unchanged > version number re-used

	Files whose contents were updated with refs to renamed asset files:
	   views/prod/index.html


## Grunt Example

	grunt.registerTask('version-assets', 'version the static assets just created', function() {

		var Version = require("node-version-assets");
		var versionInstance = new Version({
			assets: ['public/css/all-min.css', 'public/js/app.js'],
			grepFiles: ['views/prod/index.html']
		});

		var cb = this.async(); // grunt async callback
		versionInstance.run(cb);
	});

	// make sure versioning is final task
	grunt.registerTask('default', 'lint rjs jpgmin gifmin pngmin concat cssmin version-assets');


## Options

#### @param {options}
- accepts: object

#### @param {options.assets}
- accepts: array of strings
- required: each item of the array is the relative file path to the static asset
- each static asset listed will have the new version number inserted before the file type prefix, eg:
	- all-min.js > all.min.01135498.js
- if there is a previous version number in the same position then it will be replaced, eg:
	- all-min.oldversion234.js > all.min.01135498.js


## Optional, ahem, Options

#### @param {options.grepFiles}
- accepts: array of strings
- list of files (relative filepaths) containing references to the {options.assets} which need to be renamed


#### @param {options.newVersion}
- accepts: string (only numbers or letters)
- not required: defaults to generating an md5 hash of the file (recommended to leave as default as md5 hashing means that assets will not blow browser cache if they're unchanged)


#### @param {options.requireJs}
- accepts: boolean
- not required: defaults to false

If set to true then unsuffixed js assets (listed in the assets array) will be updated to the new version, eg:

	<script type="text/javascript">
		require.config({
			paths: {

				<!-- BEFORE: -->
				main: "js/app.newie"

				<!-- AFTER: -->
				main: "js/app.newie.001"
			}
		});
	</script>



## Potential Gotchas
- Assets that you want versioned must be listed in the assets array
- Check all asset paths are correct: they must be relative to the dir where you are executing the command.
- The new assets must exist in an unversioned form on the filesystem to be renamed and be listed in the {options.assets} array
- If you specify a version number it can only contain letters or numbers (ie no special characters)