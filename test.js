var PCS = require('./lib/pcs'),
    fs = require('fs'),
    async = require('async'),
    path = require('path'),
    chai = require('chai');

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
pcs = new PCS({
  access_token: '21.803e0b204ac5a17bf97831159f306e5d.2592000.1402464899.2772639706-1569193',
  app_name: 'netdsk',
  upload_trunk_size: 2 * 1024
  //,proxy: 'http://127.0.0.1:8888'
});


//pcs.getQuota(function(err, res) {console.log(err, res);});
//pcs.createDir('fff', function(err, res) {console.log(err, res);});
//pcs.getMeta(['test/1', 'test'], function(err, res) {console.log(err, res)});
//pcs.deleteFile('ttt', function(err, res) {console.log(err, res)});
//pcs.moveFile('fff', 'fff1', function(err, res) {console.log(err, res)});
//pcs.downloadFile('albert.jpg', function(err, res) {fs.writeFileSync('albert.jpg', res);});
//pcs.downloadFile('albert.jpg', fs.createWriteStream('albert.jpg'), function(err) {console.error(arguments);});
//pcs.listDir('test', {by: 'name', order: 'asc', limit: '0-1'}, function(err, res) {console.log(err, res)});
//pcs.searchDir('.', 'test.js', 1, function(err, res) {console.log(err, res)});
//pcs.cloudDownload('http://releases.ubuntu.com/14.04/ubuntu-14.04-desktop-amd64.iso', 'ubuntu.iso', function(err, res) {console.log(err, res)});
//pcs.uploadFile('2003.iso', 'K:\\2003_r2.iso', function(err, res) {console.log(err, res)});
//pcs.uploadFile('autosend.7z', 'K:\\autosend.7z', function(err, res) {console.log(err, res)});
//pcs.uploadFile('abc.txt', 'K:\\abc.txt', function(err, res) {console.log(err, res)});
//pcs.deleteFile(['test/test/test.js', ['test/test']], function(err, res) {console.log(err, res)});
//pcs.getThumbnail('albert.jpg', {width: 100, height: 100}, fs.createWriteStream('albert1.jpg'));
//pcs.getDiff(function(err, result){console.log(result)});
//pcs.rapidUpload('SERVER2003PE.ISO', {file: 'K:\\SERVER2003PE.ISO', ondup: 'overwrite'}, function(){console.log(arguments);});
