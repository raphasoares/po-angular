const { dest, parallel, series, src, task } = require('gulp');
const { replaceVersionPlaceholders } = require('./tools/version-replace');
const argv = require('yargs').argv;
const path = require('path');
const run = require('gulp-run');
const sonarqubeScanner = require('sonarqube-scanner');

/** Folders definitions */
const rootFolder = path.join(__dirname, './');
const distFolder = path.resolve(rootFolder, './dist');
const uiFolder = path.resolve(rootFolder, './projects/ui');

const schematicsFolder = path.resolve(uiFolder, './schematics');
const distSchematicsFolder = path.resolve(rootFolder, './dist/ng-components/schematics');

/** REPLACE VERSION: replace version of dist package.json to repo version */
const replaceVersion = () =>
  src([`${rootFolder}/package.json`]).on('end', () => replaceVersionPlaceholders(distFolder));

/** SCHEMATICS */
const buildSchematics = () => run('npm run build:schematics').exec();

const copySchemas = () => src([`${schematicsFolder}/**/*/schema.json`]).pipe(dest(distSchematicsFolder));

const copyFiles = () =>
  src([`${schematicsFolder}/ng-generate/*/files/**`]).pipe(dest(`${distSchematicsFolder}/ng-generate`));

const copyCollection = () => src([`${schematicsFolder}/collection.json`]).pipe(dest(distSchematicsFolder));

const copyMigrations = () => src([`${schematicsFolder}/migrations.json`]).pipe(dest(distSchematicsFolder));

/** SONAR */
const sonarqube = task('sonarqube', function (callback) {
  const token = argv.token || '';

  sonarqubeScanner(
    {
      serverUrl: 'http://sonarqube.po-ui.com.br',
      token: token,
      options: {
        // Documentation: https://docs.sonarqube.org/display/SONAR/Analysis+Parameters
        'sonar.projectKey': 'po-ui',
        'sonar.projectName': 'po-ui',
        'sonar.projectVersion': '1.0',
        'sonar.exclusions': `index.ts,.*`
      }
    },
    callback
  );
});

/** Exported Functions */
exports.sonarqube = sonarqube;
exports.replaceVersion = replaceVersion;
exports.schematics = series(buildSchematics, parallel(copyCollection, copyMigrations, copySchemas, copyFiles));
