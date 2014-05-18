var crypto = require('crypto');

module.exports = function(readStream, callback) {
  var md5sum = crypto.createHash('md5');

  readStream.on('data', function(d) {
    md5sum.update(d);
  });

  readStream.on('end', function() {
    callback(null, md5sum.digest('hex'));
  });

  readStream.on('error', function(err) {
    callback(err);
  });
};
