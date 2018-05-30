#	zeep
__zip/unzip API based on 7-Zip__

>	If links in this document not avaiable, please access [README on GitHub](https://github.com/YounGoat/nodejs.zeep/README.md) directly.

##  Description

It is really difficult to find a module which is written in pure Node.js and offers zip/unzip perfectly.

##	Table of Contents

* [Description](#description)
* [Get Started](#get-started)
* [Links](#links)

##	Get Started

```javascript
const zeep = require('zeep');

// Create an archive (.zip) containing only one file.
zeep.zip(archive_path, file_path);

// Create an archive (.zip) containing the whole folder.
zeep.zip(archive_path, folder_path);
 
// Create an archive (.zip) containing children of the folder.
// The folder itself is ignored.
zeep.zip(archive_path, folder_path, { name: '.' });

// Extract from an archive (.zip) and put files / directories under specified output_path.
zeep.unzip(archive_path, output_path);

// Get all entry names stored in an archive.
let names = zeep.getEntryNames(archive_path);
```

##	Links

*	[CHANGE LOG](./CHANGELOG.md)
*	[Homepage](https://github.com/YounGoat/nodejs.zeep)

##  References

*   [7-Zip](https://www.7-zip.org)
*   7z.exe, [Command Line Version User's Guide](https://sevenzip.osdn.jp/chm/cmdline/)