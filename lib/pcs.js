import sa from 'superagent';
import jsonParser from 'superagent/lib/node/parsers/json';
import logger from 'superagent-logger';
import proxify from 'superagent-proxy';
import Promise from 'bluebird';
import * as apiOauth from './api/oauth';
import * as apiPcs from './api/pcs';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
global.Promise = Promise;

const DEFAULT_OPTIONS = {
  accessToken: null,
  appName: null,
  maxUploadJobs: 5,
  maxRetryTimes: 5,
  proxy: null, // 'http://127.0.0.1:8888'
};

export default class PCS {
  constructor(options) {
    this.options = Object.assign({}, DEFAULT_OPTIONS, options);
    for (const key of ['accessToken', 'appName']) {
      if (!this.options[key]) {
        throw new Error(`Option '${key}' is required`);
      }
    }
    if (this.options.proxy) {
      proxify(sa);
    }
    this.bindAllAPIs();
  }
  bindAllAPIs() {
    this.api = {};
    for (const apiBundle of [apiOauth, apiPcs]) {
      for (const apiName in apiBundle) {
        if (typeof apiBundle[apiName] === 'function') {
          this.api[apiName] = apiBundle[apiName].bind(this);
        }
      }
    }
  }
  prefixPath(path) {
    path = path.replace(/^\/+/, '') || '';
    return /^\/apps\/[^\/]+?\/.+?$/i.test(path) ? path : `/apps/${this.options.appName}/${path}`;
  }
  listPath(paths) {
    if (paths instanceof Array) {
      return { param: JSON.stringify({ list: paths.map(p => ({ path: this.prefixPath(p) })) }) };
    } else if (typeof paths === 'string') {
      return { path: this.prefixPath(paths) };
    }
    return null;
  }
  listFromTo(paths) {
    if (paths instanceof Array) {
      return { param: JSON.stringify({ list: paths.map(item => ({ from: this.prefixPath(item.from), to: this.prefixPath(item.to) })) }) };
    } else if (typeof paths === 'object') {
      return { from: this.prefixPath(paths.from), to: this.prefixPath(paths.to) };
    }
    return null;
  }
  request = {
    get: async (uri, query = {}) => {
      let req = sa.get(uri)
        .use(logger);
      if (this.options.proxy) {
        req = req.proxy(this.options.proxy);
      }
      const { body } = await req.query(query)
        .query({ access_token: this.options.accessToken })
        .parse(jsonParser);
      return body;
    },
    post: async (uri, query = {}, send = {}, attach = []) => {
      let req = sa.post(uri)
        .use(logger);
      if (this.options.proxy) {
        req = req.proxy(this.options.proxy);
      }
      req = req.query(query)
        .query({ access_token: this.options.accessToken });
      if (Object.keys(send).length) {
        req = req.send(send);
      }
      if (attach.length) {
        req = req.attach(...attach);
      }
      const { body } = await req.parse(jsonParser);
      return body;
    },
    download: (uri, query = {}) => {
      let req = sa.get(uri)
        .use(logger);
      if (this.options.proxy) {
        req = req.proxy(this.options.proxy);
      }
      return req.query(query)
        .query({ access_token: this.options.accessToken });
    },
  };
}

// function _request(options, done) {
//   var pcs = this;
//   options = _.extend({httpMethod: 'POST', server: 'standard', api: 'file', getParams: {}, postParams: {}, noEncoding: false, fileWriteStream: null}, options);

//   var params = {
//     uri: pcs.base_uri[options.server] + options.api,
//     method: options.httpMethod,
//     qs: _.extend({method: options.method, access_token: pcs.access_token}, options.getParams)
//   };
//   if(_.size(options.postParams)) {
//     params.form = options.postParams;
//   }
//   if(options.noEncoding || options.fileWriteStream) {
//     params.encoding = null;
//   }
//   if(pcs.proxy) {
//     params.proxy = pcs.proxy; //'http://127.0.0.1:8888';
//   }
//   var r;
//   if(options.fileWriteStream) {
//     r = request(params);
//     r.pipe(options.fileWriteStream)
//       .on('close', function() {
//         done();
//       })
//       .on('error', function(e) {
//         done(e);
//       });
//   }
//   else {
//     r = request(params, function(err, res, body) {
//       try {
//         if(body && !options.noEncoding) body = JSON.parse(body);
//         if(err) throw(err);
//         else if(res.statusCode != '200') {
//           var error = new Error(body.error_msg);
//           error.errno = body.error_code;
//           done(error);
//         }
//         else done(null, body);
//       } catch(e) {
//         var error = new Error('Unknow error: ' + e.message);
//         error.errno = 0;
//         return done(error);
//       }
//     });
//   }
//   if(options.uploadFiles) {
//     var file, form = r.form();
//     for(file in options.uploadFiles) {
//       form.append(file, options.uploadFiles[file].stream, {knownLength: options.uploadFiles[file].size});
//     }
//   }
// }

// function makeListParam(params, paramName, addprefixPath) {
//   if(_.isString(params[0]) && paramName) {
//     _.each(params, function(item, i) {
//       params[i] = {};
//       params[i][paramName] = item;
//     });
//   }
//   if(typeof(addprefixPath) != 'undefined' && _.isObject(addprefixPath)) {
//     _.each(params, function(items, i) {
//       _.each(items, function(item, name) {
//         if(_.isString(addprefixPath[name])) {
//           params[i][name] = addprefixPath[name] + item;
//         }
//       });
//     });
//   }
//   return {param: JSON.stringify({list: params})};
// }

// PCS.prototype.getQuota = function(done) {
//   _request.call(this, {httpMethod: 'GET', api: 'quota', method: 'info'}, done);
// };

// PCS.prototype.createDir = function(path, done) {
//   // errno: 31061 message: Error: file already exists
//   _request.call(this, {api: 'file', method: 'mkdir', getParams: {path: this._prefixPath(path)}}, done);
// };

// PCS.prototype.getMeta = function(path, done, method) {
//   if(typeof(method) == 'undefined') method = 'meta';
//   // errno: 31066 message: Error: file does not exist
//   if(typeof(path) == 'string') {
//     _request.call(this, {api: 'file', method: method, getParams: {path: this._prefixPath(path)}}, done);
//   }
//   else if(_.isArray(path)) {
//     _.each(path, function(p, i) {path[i] = {path: p};});
//     _request.call(this, {api: 'file', method: method, postParams: makeListParam(path, 'path', {path: this._prefixPath()})}, done);
//   }
// };

// PCS.prototype.deleteDir = PCS.prototype.deleteFile = function(path, done) {
//   PCS.prototype.getMeta.call(this, path, done, 'delete');
// };

// PCS.prototype.copyFile = PCS.prototype.copyDir = function(from, to, done, method) {
//   if(typeof(method) == 'undefined') method = 'copy';
//   // errno: 31066 message: Error: file does not exist
//   if(typeof(from) == 'string' && typeof(to) == 'string' && _.isFunction(done)) {
//     _request.call(this, {api: 'file', method: method, getParams: {from: this._prefixPath(from), to: this._prefixPath(to)}}, done);
//   }
//   else if(_.isArray(from) && typeof(from[0].from) == 'string' && typeof(from[0].to) == 'string' && _.isFunction(to) && !done) {
//     done = to;
//     _request.call(this, {api: 'file', method: method, postParams: makeListParam(from, null, {from: this._prefixPath(), to: this._prefixPath()})}, done);
//   }
// };

// PCS.prototype.moveFile = PCS.prototype.moveDir = function(from, to, done) {
//   PCS.prototype.copyFile.call(this, from, to, done, 'move');
// };

// PCS.prototype.listDir = function(path, options, done) {
//   // options can be by(name, time, size), order(asc, desc), limit(N0-Nx|N >= 0)
//   if(_.isFunction(options) && _.isEmpty(done)) {
//     done = options;
//     options = {};
//   }
//   _request.call(this, {httpMethod: 'GET', api: 'file', method: 'list', getParams: _.extend(options, {path: this._prefixPath(path)})}, done);
// };

// PCS.prototype.searchDir = function(path, keyword, recursive, done) {
//   // options can be by(name, time, size), order(asc, desc), limit(N0-Nx|N >= 0)
//   if(_.isFunction(recursive) && _.isEmpty(done)) {
//     done = recursive;
//     recursive = 0;
//   }
//   _request.call(this, {httpMethod: 'GET', api: 'file', method: 'search', getParams: {path: this._prefixPath(path), wd: keyword, re: recursive}}, done);
// };

// PCS.prototype.downloadFile = function(path, writeStream, done) {
//   if(_.isFunction(writeStream) && !done) {
//     done = writeStream;
//     writeStream = null;
//   }
//   _request.call(this, {server: 'download', httpMethod: 'GET', api: 'file', method: 'download', getParams: {path: this._prefixPath(path)}, noEncoding: true, fileWriteStream: writeStream}, done);
// };

// /**
//  * Clowd Download files
//  * @param options
//  *   (int) expires:    Expiration time, in seconds
//  *   (int) rate_limit: Rate limit, defult no
//  *   (int) timeout:    Timeout in second
//  *
//  */
// PCS.prototype.cloudDownload = function(sourceUrl, savePath, options, done) {
//   if(_.isFunction(options) && _.isEmpty(done)) {
//     done = options;
//     options = {};
//   }
//   _request.call(this, {api: 'services/cloud_dl', method: 'add_task', getParams: _.extend(options, {save_path: this._prefixPath(savePath), source_url: sourceUrl})}, done);
// };

// PCS.prototype._uploadFileSingle = function(uploadPath, file, fileSize, ondup, done) {
//   var self = this;
//   if(fileSize > this.upload_trunk_size) { // upload in trunks
//     var uploadTrunkSize = this.upload_trunk_size;
//     uploadTrunkSize = (fileSize / 1024 > uploadTrunkSize) ? Math.ceil(fileSize / 1024) : uploadTrunkSize;
//     var trunkNum = Math.ceil(fileSize / uploadTrunkSize);

//     var blockList = {};
//     var q = async.queue(function (task, callback) {
//       async.retry(self.max_retry_times, function(cb, results) {
//         _request.call(self, {server: 'upload', api: 'file', method: 'upload', getParams: {path: self._prefixPath(task.uploadPath), type: 'tmpfile'}, uploadFiles: {file: {stream: fs.createReadStream(file, task.streamRange), size: task.streamRangeSize}}}, function(err, res) {
//             if(err) return cb(err);
//             if(typeof res.md5 != 'string') {
//               return cb(new Error('Unknow error, server returns: ' + JSON.stringify(res)));
//             }
//             cb(null, {index:task.index, md5: res.md5});
//           });
//       }, callback);
//     }, self.max_upload_jobs);
//     _.each(_.range(trunkNum), function(index) {
//       var task = {index: index};
//       var end = (index + 1) * uploadTrunkSize - 1;
//       task.streamRange = {
//         start: index * uploadTrunkSize,
//         end: end > fileSize - 1 ? fileSize - 1 : end
//       };
//       task.streamRangeSize = task.streamRange.end - task.streamRange.start + 1;
//       q.push(task, function(err, result) {
//         if(err) {
//           q.kill();
//           return done(err);
//         }
//         blockList[result.index] = result.md5;
//       });
//     });
//     q.drain = function() {
//       _request.call(self, {api: 'file', method: 'createsuperfile', getParams:{path: self._prefixPath(uploadPath), ondup: ondup}, postParams: {param: JSON.stringify({block_list: _.toArray(blockList)})}}, done);
//     };
//   }
//   else {
//     _request.call(self, {server: 'upload', api: 'file', method: 'upload', getParams:{path: self._prefixPath(uploadPath), ondup: ondup}, uploadFiles: {file: {stream: fs.createReadStream(file), size: fileSize}}}, done);
//   }
// };

// PCS.prototype.uploadFile = function(uploadPath, file, options, done) {
//   var self = this;
//   if(typeof(done) == 'undefined' && _.isFunction(options)) {
//     done = options;
//     options = {};
//   }
//   options.ondup = options.ondup || 'overwrite'; // can also have newcopy
//   if(typeof(file) == 'string') {
//     fs.stat(file, function(err, stat) {
//       if(err) throw(err);
//       if(stat.isDirectory()) {
//       }
//       else if(stat.isFile()) {
//         self._uploadFileSingle(uploadPath, file, stat.size, options.ondup, done);
//       }
//     });
//   }
// };

// /**
//  * Upload a file by the md5 hash of the file
//  *
//  * @param options
//  *  (string)  file  Local file to upload
//  *  (string)  ondup [overite|newcopy]
//  *
//  * @param options
//  *  (int)     content-length The length of the file         required
//  *  (string)  content-md5    The md5 has of the file        required
//  *  (string)  slice-md5      Md5 has of first 256K of data  required
//  */
// PCS.prototype.rapidUpload = function(path, options, done) {
//   var self = this;

//   if(options.file) {
//     var file = options.file;
//     delete options.file;
//   }

//   async.waterfall([
//     function normalizeOption(cb) {
//       if(_.isString(file)) {
//         // it's a file
//         var sliceLen = 256 * 1024;
//         try {
//           var fileStat = fs.statSync(file);
//           if(fileStat.size <= sliceLen) throw new Error('File is to small. Try use files larger than 256k');
//         }
//         catch(e) {
//           return cb(e);
//         }
//         async.auto({
//           'slice-md5': function(next) {
//              md5sum(fs.createReadStream(file, {start: 0, end: sliceLen - 1}), next);
//           },
//           'content-md5': function(next, results) {
//              md5sum(fs.createReadStream(file), next);
//           }
//         }, function(err, results) {
//           if(err) return cb(err);
//           results['content-length'] = fileStat.size;
//           if(options.ondup) results.ondup = options.ondup;
//           cb(null, results);
//         });
//       }
//       else if(_.isObject(options) && options['slice-md5'] && options['content-md5'] && options['content-length']) cb(null, options);
//       else cb(new Error('Parameter error, file should be a valid obect contails content-length, slice-md5 and content-md5'));
//     },
//     function doIt(result, cb) {
//       result.path = self._prefixPath(path);
//       _request.call(self, {api: 'file', method: 'rapidupload', postParams: result}, cb);
//     }
//   ], function(err, result) {
//     if(err) return done(err);
//     done(null, result);
//   });
// };

// /**
//  * Get thumbernail of a specific image on the cloud
//  * @param options
//  *   (int) height   0-1600  required
//  *   (int) width    0-1600  required
//  *   (int) quality  0-100
//  */
// PCS.prototype.getThumbnail = function(path, options, writeStream, done) {
//   if(_.isFunction(writeStream) && !done) {
//     done = writeStream;
//     writeStream = null;
//   }

//   _request.call(this, {httpMethod: 'GET', api: 'thumbnail', method: 'generate', getParams: _.extend({path: this._prefixPath(path)}, options), noEncoding: true, fileWriteStream: writeStream}, done);
// };

// PCS.prototype.getDiff = function(cursor, done, lastResult) {
//   if(!done && _.isFunction(cursor)) {
//     done = cursor;
//     cursor = 'null';
//   }
//   var self = this;
//   function getMore(err, result) {
//     var last = lastResult;
//     if(_.isEmpty(last)) {
//       last = {entries: {}};
//     }
//     result.entries = _.extend(last.entries, result.entries);
//     if(last.reset) {
//       result.reset = true;
//     }

//     if(err) return done(err);
//     if(result.has_more) {
//       self.getDiff(result.cursor, done, result);
//     }
//     else {
//       var prefix = self._prefixPath();
//       _.each(result.entries, function(item, key) {
//         keyNew = key.replace(prefix, '');
//         result.entries[keyNew] = item;
//         delete result.entries[key];
//       });
//       done(null, result);
//     }
//   }
//   _request.call(this, {httpMethod: 'GET', api: 'file', method: 'diff', getParams: {cursor: cursor}}, getMore);
// };


module.exports = PCS;
