var fs = require('fs');

function convert(filename) {
    var filePath = './media/' + filename + '.json';
    fs.readFile(filePath, 'utf8', function(err, res) {
        if (err) {
            throw new Error(err);
        }
        var parsed = 'module.exports = ' + res.replace(/(\w+)\.png/, function(a, b) { return '/media/' + a; }) + ';';
        fs.writeFile('./js/client/frames/' + filename + '.js', parsed, function(err) {
            if (!err) {
                console.log('saved!');
            } else {
                console.log('error', err);
            }
        });
    });
}

convert('common');
convert('foreground');
