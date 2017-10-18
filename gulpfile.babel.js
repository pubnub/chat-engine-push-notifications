import gulp from 'gulp';
import eslint from 'gulp-eslint';
import runSequence from 'run-sequence';
import shell from 'gulp-shell';

// Replace hardcoded keys with environment based values 'process.env[KEY_NAME]'.
const serverWorkingDir = `${process.cwd()}/node_modules/chat-engine`;
const serverJSFilePath = `${serverWorkingDir}/server.js`;
gulp.task('patch_server', shell.task([
    `cp ${serverJSFilePath} ${serverJSFilePath}.bak`,
    'node test/pre-flight/patch-server.js'
]));
gulp.task('start_server', shell.task([
    `cd ${serverWorkingDir} && npm install && cd ${process.cwd()}`,
    `node ${serverJSFilePath} & echo $! >> ${serverWorkingDir}/server.pid`
]));
gulp.task('stop_server', shell.task([
    `kill -9 \`cat ${serverWorkingDir}/server.pid\``,
    `rm ${serverWorkingDir}/server.pid`
]));
gulp.task('restore_server', shell.task(`mv ${serverJSFilePath}.bak ${serverJSFilePath}`));


gulp.task('npm_integration_test', shell.task('npm run integration_test', { verbose: true }));
gulp.task('npm_unit_tests', shell.task('npm run unit_test'));
gulp.task('npm_full_test', shell.task('npm run full_test', { verbose: true }));
gulp.task('integration_tests', done => runSequence('patch_server', 'start_server', 'npm_integration_test', 'stop_server', 'restore_server', done));
gulp.task('test', done => runSequence('patch_server', 'start_server', 'npm_full_test', 'stop_server', 'restore_server', 'validate', done));
// gulp.task('test', done => runSequence('unit_tests', 'integration_tests', 'validate', done));

gulp.task('lint_code', () => gulp.src(['src/**/*.js']).pipe(eslint()).pipe(eslint.format()).pipe(eslint.failAfterError()));
gulp.task('lint_tests', () => gulp.src(['test/**/*.js']).pipe(eslint()).pipe(eslint.format()).pipe(eslint.failAfterError()));
gulp.task('validate', ['lint_code', 'lint_tests']);

