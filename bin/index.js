#!/usr/bin/env node

var package = require('../package.json');
var program = require('commander');
 
program
  .version(package.version)
  .option('-a, --assets <assets>', 'REQUIRED: list of files separated by comma, each static asset listed will have the new version number inserted before the file type prefix')
  .option('-g, --grepFiles <grepFiles>', 'list of a globbed filepath separated by comma, specifies all files that matches a certain pattern (i.e. /x/y/*.html will match all files in that directory with .html suffix)')
  .option('-s, --silence', 'if set to true, it will silence all output to STDOUT')
  .option('-n, --new-version <newVersion>', 'defaults to generating an md5 hash of the file (recommended to leave as default as md5 hashing means that assets will not blow browser cache if they\'re unchanged)')
  .option('-kall, --keep-original-and-old-versions', 'set this to true if you want to disable auto-deletion of BOTH the original and old versions')
  .option('-k, --keep-original', 'set this to true if you want to delete just the ORIGINAL')
  .option('-ko, --keep-old-versions', 'set this to true if you want to delete just the OLD VERSIONS')
  .option('-r, --require-js', 'If set to true then unsuffixed js assets (listed in the assets array) will be updated to the new version. defaults to false')
  .option('-c, --cdn-path <cdn>', 'if set, will prepend the cdnPath to all assets that are specified with an absolute path (ie, a leading /)')
  .parse(process.argv);
 
var assets = program.assets && program.assets.split(',');
var grepFiles = program.grepFiles && program.grepFiles.split(',');

if (!assets || !assets.length) {
  throw new Error('--assets parameter is required, example: `--assets app.js,app.css`');
}

var Version = require('../lib/main');
var version = new Version({
  assets: assets,
  grepFiles: grepFiles,
  silence: program.silence,
  newVersion: program.newVersion,
  keepOriginalAndOldVersions: program.keepOriginalAndOldVersions,
  keepOriginal: program.keepOriginal,
  keepOldVersions: program.keepOldVersions,
  requireJs: program.requireJs,
  cdn: program.cdn,
});
version.run();
