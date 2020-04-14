'use strict';

const MODULE_REQUIRE = 1
    /* built-in */
    , fs = require('fs')
    , os = require('os')
    , path = require('path')
    , spawnSync = require('child_process').spawnSync
    
    /* NPM */
    , noda = require('noda')
    
    /* in-package */

    /* in-file */
    , runExe = function(options) {
        if (typeof options == 'string') {
            options = { args: Array.from(arguments) };
        }

        let name = EXE[`${os.platform()}-${os.arch()}`];
        if (!name) {
            throw new Error(`@zeep, platform not supported: ${name}`);
        }
        let exeName = noda.inResolve('exe', name);

        let spawnOptions = {};
        if (options.cwd) spawnOptions.cwd = options.cwd;

        let ret = spawnSync(exeName, options.args, spawnOptions);
        if (ret.status) {
            throw new Error(ret.stderr.toString());
        }
        return ret.stdout.toString();
    }
    ;

const EXE = {
    'win32-x64': '7za-win.exe',
    'win32-ia32': '7za-win.exe',
};

const deltree = pathname => {
    if (!fs.existsSync(pathname)) {
        /* DO NOTHING. */
    }
    else if (fs.statSync(pathname).isDirectory(pathname)) {
        spawnSync('cmd.exe', [ '/C', 'rmdir', '/S/Q', targetPath ]);
    }
    else {
        fs.unlinkSync(pathname);
    }
};

function zip(archive_name, source_name, options) {
    let OPTIONS = Object.assign({
        // If archive already exists, whether to remove it before creating new archive.
        // By default, an exception will be thrown in such case.
        replace: false,

        // By default, the original file / directory name will be used as entry name in archive.
        // If the value is "." and source is a folder, the folder itself will not be reserved in archive.
        name: null,
    }, options);

    if (OPTIONS.name && /\\|\//.test(OPTIONS.name)) {
        throw new Error(`@zeep, path delimiter is not allowed in name: ${OPTIONS.name}`);
    }

    let archivePath = path.resolve(archive_name);
    let sourcePath = path.resolve(source_name);

    if (fs.existsSync(archivePath)) {
        if (OPTIONS.replace) deltree(archivePath);
        else throw new Error(`@zeep, archive pathname already occupied: ${archivePath}`);
    }

    if (!fs.existsSync(sourcePath)) {
        throw new Error(`@zeep, source not found: ${sourcePath}`);
    }

    // ---------------------------
    // Main Process.

    let cwd, sourceBasename;

    if (fs.statSync(sourcePath).isDirectory() && OPTIONS.name == '.') {
        // Unshell directory.
        cwd = sourcePath;
        sourceBasename = '.';
    }
    else {
        cwd = path.dirname(sourcePath);
        sourceBasename = path.basename(sourcePath);
    }

    runExe({ args: ['a', '-tzip', archivePath, sourceBasename], cwd });

    // Rename the entry(s) if necessary.
    if (OPTIONS.name && OPTIONS.name != sourceBasename) {
        runExe('rn', archivePath, sourceBasename, OPTIONS.name);
    }
}

zip.create = zip.bind(null);

zip.extract = function(archive_name, output_dirname, options) {
    let OPTIONS = Object.assign({
        // If target already exists, whether to remove it before extracting.
        // By default, an exception will be thrown in such case.
        replace: false,

        // If target already exists and is an folder, whether to overwrite into it.
        // By default, an exception will be thrown in such case.
        overwrite: false,
    }, options);

    let archivePath = path.resolve(archive_name);
    let outputPath = path.resolve(output_dirname);

    if (!fs.existsSync(archivePath)) {
        throw new Error(`@zeep, archive not found: ${archivePath}`);
    }

    if (fs.existsSync(outputPath)) {
        if (OPTIONS.replace) {
            deltree(outputPath);
        }
        else {
            let isDir = fs.statSync(outputPath).isDirectory();

            if (OPTIONS.overwrite && isDir) {
                /* DO NOTHING. */
            }
            else if (fs.readdirSync(outputPath).length == 0) {
                /* DO NOTHING. */
            }
            else {
                throw new Error(`@zeep, output pathname already occupied: ${outputPath}`);
            }
        }
    }

    // ---------------------------
    // Main Process.

    runExe('x', archivePath, `-o${outputPath}`);
}

zip.getEntryNames = function(archive_name) {
    let names = [];
     
    /**
     * Example of `7z l example.zip` output:
     * 
     *    Date      Time    Attr         Size   Compressed  Name
	 * ------------------- ----- ------------ ------------  ------------------------
	 * 2018-01-31 00:00:00 D....            0            0  foo
	 * 2018-01-31 00:00:00 ....A            8            8  foo\a.js
	 * 2018-01-31 00:00:00 ....A            8            8  foo\b.js
     * 
     */
    let reEntryLine = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\s+[^\s]{5}\s+\d+\s+\d+\s+(.+)\s*$/;
    runExe('l', archive_name).split(os.EOL).forEach(line => {
        if (reEntryLine.test(line)) {
            names.push(RegExp.$1);
        }
    });

    return names;
};

module.exports = {
    zip,
    unzip: zip.extract,
};
