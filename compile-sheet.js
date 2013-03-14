var fs = require('fs');

var filePath = './media/common.json';

fs.readFile(filePath, 'utf8', function(err, res) {
    if (err) {
        throw new Error(err);
    }
    var parsed = 'module.exports = ' + res.replace('common.png', '/media/common.png') + ';';
    fs.writeFile('./js/client/frames/common.js', parsed, function(err) {
        if (!err) {
            console.log('saved!');
        } else {
            console.log('error', err);
        }
    });
});
