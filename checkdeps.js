const depcheck = require('depcheck');

const options = {
};

depcheck('.', options).then((unused) => {
    console.log(unused.dependencies); // an array containing the unused dependencies
    console.log(unused.devDependencies); // an array containing the unused devDependencies
    console.log(unused.missing); // a lookup containing the dependencies missing in `package.json` and where they are used
    console.log(unused.using); // a lookup indicating each dependency is used by which files
    console.log(unused.invalidFiles); // files that cannot access or parse
    console.log(unused.invalidDirs); // directories that cannot access
});