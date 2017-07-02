'use strict';

// gulpプラグインの読み込み
// ------------------------------------------
var gulp = require('gulp'),
    browserSync = require('browser-sync'),
    ssi = require('browsersync-ssi'),//ssi利用
    del = require('del'),//deleteができる

    jade = require('gulp-jade'),
    cached = require('gulp-cached'),
    plumber = require('gulp-plumber'),
    notify = require('gulp-notify'),

    sass = require('gulp-sass'),
    postcss = require('gulp-postcss'),
    autoprefixer = require('autoprefixer'),
    sourcemaps = require('gulp-sourcemaps'),

    concat =  require('gulp-concat'),

    csso = require('gulp-csso'),
    uglify = require('gulp-uglify'),

    runSequence = require('run-sequence');

/***************************************************************************
 * ローカルサーバー起動
 ***************************************************************************/
gulp.task('server', function () {
    browserSync({
        server: {
            baseDir: ['./'],
        },
        ghostMode: {
            clicks: false,
            location: true
        },
        open: true
    });
});

/***************************************************************************
 * jade コンパイル
 ***************************************************************************/
gulp.task('jade', function () {
    return gulp.src(['resources/view/**/*.jade', '!resources/view/**/_*.jade'])
        .pipe(cached('jade')) // 対象ファイルをキャッシュし、変更ファイルのみ処理
        .pipe(plumber({ // エラーをデスクトップ通知
            errorHandler: notify.onError('Error: <%= error.message %>')
        }))
        .pipe(jade({
            doctype: 'html',
            pretty: true
        }))
        .pipe(gulp.dest('./'));
});

/***************************************************************************
 * scss コンパイル
 ***************************************************************************/
gulp.task('sass', function () {
    var processors = [  // ベンダープレフィックスの対象ブラウザを指定
        autoprefixer({
            browsers: ['last 2 versions', 'ie 9']
        })
    ];
    return gulp.src('resources/assets/scss/**/*.scss')
        .pipe(plumber({
            errorHandler: notify.onError('Error: <%= error.message %>')
        }))
        .pipe(sourcemaps.init())
        .pipe(sass({
            outputStyle: 'expanded'
        }))
        .pipe(postcss(processors))  // ベンダープレフィックスを自動付与
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./css'));
});

/***************************************************************************
 * JS
 ***************************************************************************/
gulp.task('scripts', function () {
    return gulp.src(
        [
            './resources/assets/js/lib/jquery-3.1.1.min.js',
            './resources/assets/js/lib/jquery-matchHeight-min.js',
            './resources/assets/js/lib/TweenMax.min.js',
            './resources/assets/js/lib/ScrollMagic.min.js',
            './resources/assets/js/lib/animation.gsap.js',
            './resources/assets/js/lib/CustomEase.js',
            './resources/assets/js/app.js',
        ]
    )
        .pipe(concat('bundle.js'))
        .pipe(gulp.dest('./js/'));
});


/***************************************************************************
 * html/CSS/JSを結合・minify
 // ***************************************************************************/
//$gulp productionで走らせる
gulp.task('minify-jade', function () {
    return gulp.src(['resources/view/**/*.jade', '!resources/view/**/_*.jade'])
        .pipe(plumber({ // エラーをデスクトップ通知
            errorHandler: notify.onError('Error: <%= error.message %>')
        }))
        .pipe(jade({
            doctype: 'html',
            pretty: false //htmlを圧縮
        }))
        .pipe(gulp.dest('./'));
});

gulp.task('minify-js', ['scripts'], function () {
    gulp.src('./public/js/bundle.js')
        .pipe(uglify())//jsを圧縮 option:ライセンス表記は圧縮しない
        .pipe(gulp.dest('./js/'))
});

gulp.task('minify-css', ['sass'], function () {
    return gulp.src('./public/css/style.css')
        .pipe(csso())//cssを圧縮
        .pipe(gulp.dest('./css/'))
});

/***************************************************************************
 * public ディレクトリを削除して再構築
 ***************************************************************************/
gulp.task('rebuild', function () {
    return gulp.src([
            'public/**/*.html',
            'public/**/*.css',
            'public/**/*.js',
            'public/**/*.jpg',
            'public/**/*.gif',
            'public/**/*.png',
            'public/**/*.pdf',
            'public/**/*.eot',
            'public/**/*.svg',
            'public/**/*.ttf',
            'public/**/*.woff',
        ], {
            dos: true
        })
        .pipe(gulp.dest('./'));
});

/***************************************************************************
 * ファイルの監視
 ***************************************************************************/
gulp.task('watch', ['server'], function () {
    gulp.watch('resources/view/**/*.jade', ['jade']);
    gulp.watch('resources/assets/scss/**/*.*', ['sass']);
    gulp.watch('resources/assets/js/**/*.*', ['scripts']);
    gulp.watch('resources/assets/images/**/*.*', ['images']);
});

/***************************************************************************
 * 公開セットを生成
 ***************************************************************************/
// public 初期化
gulp.task('clean',
    del.bind(null, ['public'])
);

gulp.task('copy', function () {
    gulp.src(['resources/.htaccess'])
       .pipe(gulp.dest('./'))
});

gulp.task('p', ['clean'], function (cb) {
    // タスクを直列に処理する（配列内は並列）
    runSequence(
        'jade',
        'sass',
        'scripts',
        // 'minify-jade',
        'minify-css',
        'minify-js',
        'rebuild',
        cb
    );
});


/***************************************************************************
 * 起動
 ***************************************************************************/
gulp.task('default', ['watch']);
