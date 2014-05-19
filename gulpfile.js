
var gulp = require('gulp'),
    g = require('gulp-load-plugins')({lazy: false}),
    noop = g.util.noop,
    dirname = require('path').dirname,
    es = require('event-stream'),
    queue = require('streamqueue'),
    lazypipe = require('lazypipe'),
    stylish = require('jshint-stylish'),
    bower = require('./bower'),
    isWatching = false;

var htmlminOpts = {
  removeComments: true,
  collapseWhitespace: true,
  removeEmptyAttributes: false,
  collapseBooleanAttributes: true,
  removeRedundantAttributes: true
};


/**
 * JS Hint
 */
gulp.task('jshint-backend', function () {
  return gulp.src([
    './gulpfile.js'
  ])
    .pipe(g.cached('jshint'))
    .pipe(jshint('./src/.jshintrc'));
});

gulp.task('jshint-app', function () {
  return gulp.src('./src/app/**/*.js')
    .pipe(g.cached('jshint-app'))
    .pipe(jshint('./src/app/.jshintrc'))
    .pipe(livereload());
});

gulp.task('jshint', ['jshint-backend', 'jshint-app']);


/**
 * CSS
 */
gulp.task('clean-css', function () {
  return gulp.src('./.tmp/css').pipe(g.clean());
});

gulp.task('styles', ['clean-css'], function () {
  return gulp.src([
    './src/app/**/*.styl',
    '!./src/app/**/_*.styl'
  ])
    .pipe(g.stylus({use: ['nib']}))
    .pipe(gulp.dest('./.tmp/css/'))
    .pipe(g.cached('built-css'))
    .pipe(livereload());
});

gulp.task('styles-dist', ['styles'], function () {
  return cssFiles()
    .pipe(g.replace('../assets/', 'assets/'))
    .pipe(dist('css', bower.name));
});

gulp.task('csslint', ['styles'], function () {
  return cssFiles()
    .pipe(g.cached('csslint'))
    .pipe(g.csslint('./src/.csslintrc'))
    .pipe(g.csslint.reporter());
});


/**
 * Scripts
 */
gulp.task('scripts-dist', ['templates-dist'], function () {
  return appFiles().pipe(dist('js', bower.name, {ngmin: true}));
});

/**
 * Templates
 */
gulp.task('templates', templates());
gulp.task('templates-dist', templates({min: true}));

function templates (opt) {
  return function () {
    return templateFiles(opt).pipe(buildTemplates());
  };
}


/**
 * Vendors
 */
gulp.task('vendors', function () {
  var bowerStream = g.bowerFiles();
  var cssQueue = new queue({objectMode: true})
    .queue(bowerStream.pipe(g.filter('**/*.css')))
    .queue(
      gulp.src('./bower_components/flat-ui-official/less/flat-ui.less')
        .pipe(g.replace('@import "modules/local-fonts";', '// @import "modules/local-fonts";'))
        .pipe(g.less())
    )
    .done();
  return es.merge(
    cssQueue.pipe(g.replace('../fonts/', 'fonts/')).pipe(dist('css', 'vendors')),
    bowerStream.pipe(g.filter('**/*.js')).pipe(dist('js', 'vendors'))
  );
});

/**
 * Fonts
 */
gulp.task('fonts', function () {
  return gulp.src('./bower_components/flat-ui-official/fonts/flat-ui*')
    .pipe(gulp.dest('./dist/fonts'));
});

/**
 * Assets
 */
gulp.task('assets', function () {
  return gulp.src('./src/app/assets/**')
    .pipe(gulp.dest('./dist/assets'));
});

/**
 * Index
 */
gulp.task('index', index);
gulp.task('build-all', ['fonts', 'vendors', 'styles', 'templates'], index);

function index () {
  var opt = {read: false};
  return gulp.src('./src/app/index.html')
    .pipe(g.inject(gulp.src('./dist/vendors.{js,css}'), {ignorePath: 'dist', starttag: '<!-- inject:vendor:{{ext}} -->', addRootSlash: false}))
    .pipe(g.inject(es.merge(appFiles(opt), cssFiles(opt)), {ignorePath: ['.tmp', 'src/app'], addRootSlash: false}))
    .pipe(gulp.dest('./src/app/'))
    .pipe(g.embedlr())
    .pipe(gulp.dest('./.tmp/'))
    .pipe(livereload());
}

/**
 * Dist
 */
gulp.task('dist', ['assets', 'fonts', 'vendors', 'styles-dist', 'scripts-dist'], function () {
  return gulp.src('./src/app/index.html')
    .pipe(g.inject(gulp.src('./dist/vendors.min.{js,css}'), {ignorePath: 'dist', starttag: '<!-- inject:vendor:{{ext}} -->', addRootSlash: false}))
    .pipe(g.inject(gulp.src('./dist/' + bower.name + '.min.{js,css}'), {ignorePath: 'dist', addRootSlash: false}))
    .pipe(g.htmlmin(htmlminOpts))
    .pipe(gulp.dest('./dist/'));
});
gulp.task('statics-dist', g.serve({root: ['./dist']}));

/**
 * Watch / Dev server
 */
gulp.task('statics', g.serve({root: ['./src/app', './.tmp', './dist']}));

gulp.task('serve', ['statics', 'default'], function () {
  isWatching = true;
  // Initiate livereload server:
  g.livereload();
  gulp.watch(['./gulpfile.js'], ['jshint-backend']);
  gulp.watch('./src/app/**/*.js', ['jshint-app']).on('change', function (evt) {
    if (evt.type !== 'changed') {
      gulp.start('index');
    }
  });
  gulp.watch('./src/app/index.html', ['index']);
  gulp.watch(['./src/app/**/*.html', '!./src/app/index.html'], ['templates']);
  gulp.watch(['./src/app/**/*.styl'], ['csslint']).on('change', function (evt) {
    if (evt.type !== 'changed') {
      gulp.start('index');
    }
  });
});

/**
 * Default task
 */
gulp.task('default', ['lint', 'build-all']);

/**
 * Lint everything
 */
gulp.task('lint', ['jshint', 'csslint']);

/**
 * All CSS files as a stream
 */
function cssFiles (opt) {
  return gulp.src('./.tmp/css/**/*.css', opt);
}

/**
 * All AngularJS application files as a stream
 */
function appFiles () {
  return gulp.src([
    './.tmp/' + bower.name + '-templates.js',
    './src/app/**/*.js'
  ])
    .pipe(g.angularFilesort());
}

/**
 * All AngularJS templates/partials as a stream
 */
function templateFiles (opt) {
  return gulp.src(['./src/app/**/*.html', '!./src/app/index.html'], opt)
    .pipe(opt && opt.min ? g.htmlmin(htmlminOpts) : noop());
}

/**
 * Build AngularJS templates/partials
 */
function buildTemplates () {
  return lazypipe()
    .pipe(g.ngHtml2js, {
      moduleName: bower.name + '-templates',
      prefix: '/' + bower.name + '/',
      stripPrefix: '/src/app'
    })
    .pipe(g.concat, bower.name + '-templates.js')
    .pipe(gulp.dest, './.tmp')
    .pipe(livereload)();
}

/**
 * Concat, rename, minify
 *
 * @param {String} ext
 * @param {String} name
 * @param {Object} opt
 */
function dist (ext, name, opt) {
  opt = opt || {};
  return lazypipe()
    .pipe(g.concat, name + '.' + ext)
    .pipe(gulp.dest, './dist')
    .pipe(opt.ngmin ? g.ngmin : noop)
    .pipe(opt.ngmin ? g.rename : noop, name + '.annotated.' + ext)
    .pipe(opt.ngmin ? gulp.dest : noop, './dist')
    .pipe(ext === 'js' ? g.uglify : g.minifyCss)
    .pipe(g.rename, name + '.min.' + ext)
    .pipe(gulp.dest, './dist')();
}

/**
 * Livereload (or noop if not run by watch)
 */
function livereload () {
  return lazypipe()
    .pipe(isWatching ? g.livereload : noop)();
}

/**
 * Jshint with stylish reporter
 */
function jshint (jshintfile) {
  return lazypipe()
    .pipe(g.jshint, jshintfile)
    .pipe(g.jshint.reporter, stylish)();
}
