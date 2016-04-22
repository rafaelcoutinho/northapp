module.exports = function (ctx) {
    // make sure android platform is part of build
    if (ctx.opts.platforms.indexOf('android') < 0) {
        return;
    }
    var fs = ctx.requireCordovaModule('fs'),
        path = ctx.requireCordovaModule('path'),
        deferral = ctx.requireCordovaModule('q').defer();

    var resourcesPath = path.join(ctx.opts.projectRoot, 'resources/noti.png');
    var drawableRoot = path.join(ctx.opts.projectRoot, 'platforms/android/res/drawable/');
    if (!fs.existsSync(drawableRoot)) {
        fs.mkdirSync(drawableRoot);
    }
    var drawableIcon = path.join(drawableRoot, 'noti.png');


    
    var rd = fs.createReadStream(resourcesPath);
    rd.on('error', deferral.reject);
    var wr = fs.createWriteStream(drawableIcon);
    wr.on('error', deferral.reject);
    wr.on('finish', deferral.resolve);
    rd.pipe(wr);


    return deferral.promise;
};
