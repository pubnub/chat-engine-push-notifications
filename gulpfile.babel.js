import gulp from 'gulp';
import eslint from 'gulp-eslint';
import runSequence from 'run-sequence';
import shell from 'gulp-shell';

gulp.task('integration_test', shell.task('npm run integration_test'));
gulp.task('unit_tests', shell.task('npm run unit_test'));
gulp.task('full_test', shell.task('npm run test'));

gulp.task('lint_code', () => gulp.src(['src/**/*.js']).pipe(eslint()).pipe(eslint.format()).pipe(eslint.failAfterError()));
gulp.task('lint_tests', () => gulp.src(['test/**/*.js']).pipe(eslint()).pipe(eslint.format()).pipe(eslint.failAfterError()));
gulp.task('validate', ['lint_code', 'lint_tests']);

gulp.task('test', ['validate', 'full_test']);
// gulp.task('test', done => runSequence('full_test', 'validate', done));
