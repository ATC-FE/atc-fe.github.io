var gulp = require('gulp')
var vue = require('vue-loader')
var named = require('vinyl-named')
var webpack = require('gulp-webpack')
var htmlone = require('gulp-htmlone')
var autoprefixer = require('autoprefixer')
var adaptive = require('postcss-adaptive')
var precss = require('precss')
var cssnano = require('cssnano')
var calc = require('postcss-calc')
var browserSync = require('browser-sync')
var reload = browserSync.reload
var swPrecache = require('sw-precache')
var exec = require('child_process').exec

var appList = ['index']
var BASE_DPR = 2 // NEED CONFIG IN EACH PROJECT
var REM_UNIT = 75 // NEED CONFIG IN EACH PROJECT

gulp.task('default', ['bundle', 'move-html', 'generate-service-worker'], function () {
  console.log('done')
})

gulp.task('bundle', function () {
  process.env.NODE_ENV = 'production'
  return gulp.src(mapFiles(appList, 'js'))
    .pipe(named())
    .pipe(webpack(getConfig()))
    .pipe(gulp.dest('js/'))
})

gulp.task('watch', function () {
  return gulp.src(mapFiles(appList, 'js'))
    .pipe(named())
    .pipe(webpack(getConfig({
      watch: true,
      devtool: 'source-map'
    })))
    .pipe(gulp.dest('js/'))
})

gulp.task('move-html', function () {
  return gulp.src(mapFiles(appList, 'html'))
    .pipe(gulp.dest('_layouts/'))
})

// browser-sync
gulp.task('browser-sync', function () {
  browserSync({
    port: 3000,
    server: {
      baseDir: "./",
      index: "./_site/index.html"
    },
    https: false
  })
  gulp.watch(['js/**/*', 'vueApp/src/index.html', '_posts/*', '_layouts/*', 'index.md', '404.html']).on('change', function (file) {
    exec('jekyll build', function(err, stdout, stderr) {
      if (err) {
        console.error(err)
      } else {
        console.log(stdout);
        console.log(stderr);
        reload(file.path)
      }
    })
  })
})

gulp.task('generate-service-worker', function (callback) {
  var rootDir = 'js'

  swPrecache.write(`${rootDir}/service-worker.js`, {
    staticFileGlobs: [`/${rootDir}/**/*.{js,html,css,png,jpg,gif,svg,eot,ttf,woff}`],
  }, callback)
})

gulp.task('dev', ['watch', 'move-html', 'generate-service-worker', 'browser-sync'])


/**
 * @private
 */
function getConfig(opt) {
  var config = {
    output: {
      publicPath: './js/'
    },
    module: {
      loaders: [{
          test: /\.vue$/,
          loader: 'vue'
        },
        {
          test: /\.json$/,
          loader: 'json'
        },
        {
          test: /\.js$/,
          loader: 'babel',
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          loader: 'style-loader!css-loader!postcss-loader',
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          loader: 'style-loader!css-loader'
        },
        {
          test: /\.(?:jpg|jpeg|gif|png)$/,
          loader: '@ali/img4dpr-loader?highq=q90&lowq=q75&sharpen=s150'
        }
      ]
    },
    vue: {
      postcss: [
        precss(),
        calc(),
        adaptive({
          remUnit: REM_UNIT,
          baseDpr: BASE_DPR,
          autoRem: true
        }),
        autoprefixer({
          browsers: ['ios_saf >= 7', 'android >= 4']
        }),
        cssnano({
          autoprefixer: false,
          discardUnused: false,
          reduceIdents: false,
          reduceInitial: false,
          reducePositions: false,
          zindex: false
        })
      ],
      autoprefixer: false
    },
    babel: {
      presets: ['es2015', 'stage-2'],
      plugins: ['transform-runtime']
    }
  }
  if (!opt) {
    return config
  }
  for (var i in opt) {
    config[i] = opt[i]
  }
  return config
}

/**
 * @private
 */
function mapFiles(list, extname) {
  return list.map(function (app) {
    return 'vueApp/src/' + app + '.' + extname
  })
}