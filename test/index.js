'use strict';

const MODULE_REQUIRE = 1
    /* built-in */
    , assert = require('assert')
    , fs = require('fs')
    , spawnSync = require('child_process').spawnSync
    , path = require('path')

    /* NPM */
    , noda = require('noda')
    
    /* in-package */
    , zeep = noda.inRequire('.')

    , deltree = pathname => {
        if (!fs.existsSync(pathname)) {
            /* DO NOTHING. */
        }
        else if (fs.statSync(pathname).isDirectory(pathname)) {
            spawnSync('cmd.exe', [ '/C', 'rmdir', '/S/Q', pathname ]);
        }
        else {
            fs.unlinkSync(pathname);
        }
    }

    , occupied = (pathname, type) => {
        deltree(pathname);
        if (type == 'f') {
            fs.writeFileSync(pathname, '');
        }
        else if (type == 'd') {
            fs.mkdirSync(pathname);
        }
        else if (type == 'df') {
            fs.mkdirSync(pathname);
            fs.writeFileSync(path.join(pathname, 'foo.txt'), '');
        }
    }
    ;

const RESPATH = path.join(__dirname, 'resource');
const TEMPATH = path.join(__dirname, 'temp');

describe('zip', () => {

    before(function() {
        spawnSync('cmd.exe', [ '/C', 'rmdir', '/S/Q', TEMPATH ]);
    });

    const ENTRY_NAMES = [
        'foo', 
        'foo\\bar', 
        'foo\\bar\\quz.txt', 
        'foo\\name with spaces.txt', 
    ];

    const verifyOutput = (pathname, names) => {
        assert(fs.existsSync(pathname));
        names.forEach(name => {
            assert(fs.existsSync(path.join(pathname, name)));
        });
    }

    it('getEntryNames', () => {
        let archive_name = path.join(RESPATH, 'foo.zip');
        let names = zeep.zip.getEntryNames(archive_name);
        assert.deepEqual(names, ENTRY_NAMES);
    });

    it('create archive (directory)', () => {
        let source_name = path.join(RESPATH, 'foo');
        let archive_name = path.join(TEMPATH, 'foo.zip');
        
        // Create an archive.
        zeep.zip(archive_name, source_name);
        assert(fs.existsSync(archive_name));

        // Verify the archive.
        let names = zeep.zip.getEntryNames(archive_name);
        assert.deepEqual(names, ENTRY_NAMES);
    });

    it('create archive (file)', () => {
        let source_name = path.join(RESPATH, 'foo/bar/quz.txt');
        let archive_name = path.join(TEMPATH, 'foo-bar-quz.zip');
        
        // Create an archive.
        zeep.zip(archive_name, source_name);
        assert(fs.existsSync(archive_name));

        // Verify the archive.
        let names = zeep.zip.getEntryNames(archive_name);
        assert.deepEqual(names, [ 'quz.txt' ]);
    });

    it('create archive (directory renamed)', () => {
        let source_name = path.join(RESPATH, 'foo');
        let archive_name = path.join(TEMPATH, 'foo-renamed.zip');
        
        // Create an archive.
        zeep.zip(archive_name, source_name, { name: '400' });
        assert(fs.existsSync(archive_name));

        // Verify the archive.
        let names = zeep.zip.getEntryNames(archive_name);
        assert.deepEqual(names, ENTRY_NAMES.map(name => name.replace(/^foo/, '400')));
    }); 

    it('create archive (file renamed)', () => {
        let source_name = path.join(RESPATH, 'foo/bar/quz.txt');
        let archive_name = path.join(TEMPATH, 'foo-bar-quz-renamed.zip');
        
        // Create an archive.
        zeep.zip(archive_name, source_name, { name: 'foobar.txt' });
        assert(fs.existsSync(archive_name));

        // Verify the archive.
        let names = zeep.zip.getEntryNames(archive_name);
        assert.deepEqual(names, [ 'foobar.txt' ]);
    }); 

    it('create archive (THROWS if source doesnot exist)', () => {
        let source_name = path.join(RESPATH, 'something-not-found');
        let archive_name = path.join(TEMPATH, 'foo.zip');
        
        assert.throws(() => {
            zeep.zip(archive_name, source_name);
            assert(fs.existsSync(archive_name));
        });
    });

    it('create archive (THROWS if archive exists)', () => {        
        let source_name = path.join(RESPATH, 'foo');
        let archive_name = path.join(TEMPATH, 'pathname-occupied.zip');

        // Create an empty file to occupy the position where the archive to be put.
        fs.writeFileSync(archive_name, '');
                
        assert.throws(() => {
            zeep.zip(archive_name, source_name);
            assert(fs.existsSync(archive_name));
        });
    });

    it('create archive (replace existing archive)', () => {
        let source_name = path.join(RESPATH, 'foo');
        let archive_name = path.join(TEMPATH, 'foo.zip');
        
        zeep.zip(archive_name, source_name, { replace: true });
        assert(fs.existsSync(archive_name));
    });

    it('extract', () => {
        // Create an archive at first.
        let source_name = path.join(RESPATH, 'foo');
        let archive_name = path.join(TEMPATH, 'foo.zip');
        zeep.zip(archive_name, source_name, { replace: true, name: '.' });

        // Extract from the archive.
        let output_path = path.join(TEMPATH, 'out');        
        zeep.unzip(archive_name, output_path);

        // Verify what extracted.
        verifyOutput(output_path, [ 'bar', 'bar/quz.txt', 'name with spaces.txt' ]);
    });

    it('extract (THROWS if archive not found)', () => {
        let archive_name = path.join(RESPATH, 'something-not-found.zip');
        let output_path = path.join(TEMPATH, 'out-occupied');
        
        // Occupy the position where extracted files to be put.
        occupied(output_path, 'f');

        assert.throws(() => {
            zeep.unzip(archive_name, output_path);
        });        
    });

    it('extract (THROWS if output pathname occupied)', () => {
        let archive_name = path.join(RESPATH, 'foo.zip');
        let output_path = path.join(TEMPATH, 'pathname-occupied');
        
        // Occupy the position where extracted files to be put.
        occupied(output_path, 'f');        

        assert.throws(() => {
            zeep.unzip(archive_name, output_path);
        });
    });

    it('extract (replace existing file / directory)', () => {
        let archive_name = path.join(RESPATH, 'foo.zip');
        let output_path = path.join(TEMPATH, 'pathname-occupied');
        
        // Occupy the position where extracted files to be put.
        occupied(output_path, 'f');

        zeep.unzip(archive_name, output_path, { replace: true });
        verifyOutput(output_path, ENTRY_NAMES);
    });


    it('extract (to empty directory)', () => {
        let archive_name = path.join(RESPATH, 'foo.zip');
        let output_path = path.join(TEMPATH, 'pathname-occupied');
        
        // Occupy the position where extracted files to be put.
        occupied(output_path, 'd');
        
        zeep.unzip(archive_name, output_path, { replace: false, overwrite: false });
        verifyOutput(output_path, ENTRY_NAMES);
    });


    it('extract (overwrite existing directory)', () => {
        let archive_name = path.join(RESPATH, 'foo.zip');
        let output_path = path.join(TEMPATH, 'pathname-occupied');
        
        // Occupy the position where extracted files to be put.
        occupied(output_path, 'd');
        occupied(path.join(output_path, 'README.txt'), 'f');
        
        zeep.unzip(archive_name, output_path, { replace: false, overwrite: true });
        verifyOutput(output_path, ENTRY_NAMES.concat('README.txt'));
    });



    after(function() {
        spawnSync('cmd.exe', [ '/C', 'rmdir', '/S/Q', TEMPATH ]);
    });    
});