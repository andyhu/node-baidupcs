import Promise from 'bluebird';
import { basename } from 'path';
import { statAsync, createReadStream } from 'fs-extra-promise';
import bytes from 'bytes';
import { md5Hash, md5AndCrc32Hash } from '../hash';
import { fileToStream, splitToTrunks, asyncToPromise } from '../utils';
import { API_BASE_URL_PCS_STANDARD as API_S, API_BASE_URL_PCS_UPLOAD as API_U, API_BASE_URL_PCS_DOWNLOAD as API_D } from './index';

export const quota = function () {
  const URI = 'quota';
  return this.request.get(API_S + URI, { method: 'info' });
};

export const upload = async function(file, uploadPath = null, ondup = null) {
  const URI = 'file';
  file = await fileToStream(file, 'read');
  if (uploadPath === null) uploadPath = basename(file.path);
  if (!uploadPath) throw new Error('Parameter \'uploadPath\' required');
  const options = { method: 'upload', path: this.prefixPath(uploadPath) };
  if (ondup) options.ondup = ondup;
  return await this.request.post(API_U + URI, options, {}, ['file', file]);
};

export const uploadTemp = async function(file) {
  const URI = 'file';
  file = await fileToStream(file, 'read');
  return await this.request.post(API_U + URI, { method: 'upload', type: 'tmpfile' }, {}, ['file', file]);
};

export const uploadConcatTemp = function (path, md5Array, ondup = null) {
  const URI = 'file';
  const options = { method: 'createsuperfile', path: this.prefixPath(path) };
  if (ondup !== null) options.ondup = ondup;
  options.param = JSON.stringify({ block_list: md5Array });
  return this.request.post(API_S + URI, options);
};

export const uploadRapid = async function(file, remotePath, ondup = null) {
  const URI = 'file';
  const { size: contentLength } = await statAsync(file);
  if (contentLength <= bytes('256KB')) {
    throw new Error('File must be larger than 256KB.');
  }
  file = await fileToStream(file, 'read');
  const { md5: contentMd5, crc32: contentCrc32 } = await md5AndCrc32Hash(file.path);
  const sliceMd5 = await md5Hash(createReadStream(file.path, { start: 0, end: bytes('256KB') - 1 }));
  const options = { method: 'rapidupload', path: this.prefixPath(remotePath), 'content-length': contentLength, 'content-md5': contentMd5, 'content-crc32': contentCrc32, 'slice-md5': sliceMd5 };
  if (ondup !== null) options.ondup = ondup;
  return await this.request.post(API_S + URI, options);
};

export const uploadSmart = async function(file, uploadPath, ondup = null) {
  const trunks = (await splitToTrunks(file, this.options.minTrunkSize, this.options.maxTrunkNumber));
  if (Array.isArray(trunks)) {
    return Promise.map(trunks, stream => asyncToPromise.call(this, uploadTemp)(stream), { concurrency: this.options.maxConcurrentJobs })
      .map(res => res.md5)
      .then(md5Array => asyncToPromise.call(this, uploadConcatTemp)(uploadPath, md5Array, ondup));
  }
  return await upload.call(this, file, uploadPath, ondup);
};

export const download = async function(remotePath, localPath = null) {
  const URI = 'file';
  const writeStream = await fileToStream(localPath, 'write');
  return new Promise((resolve, reject) => {
    this.request.download(API_D + URI, { method: 'download', path: this.prefixPath(remotePath) })
      .on('error', reject)
      .pipe(writeStream)
      .on('error', reject)
      .on('finish', resolve);
  });
};

export const mkdir = function (path) {
  const URI = 'file';
  return this.request.post(API_S + URI, { method: 'mkdir', path: this.prefixPath(path) });
};

export const remove = function (path) {
  const URI = 'file';
  return this.request.post(API_S + URI, { method: 'delete', ...this.listPath(path) });
};

export const meta = function (path) {
  const URI = 'file';
  return this.request.get(API_S + URI, { method: 'meta', ...this.listPath(path) });
};

export const list = function (path, by = null, order = null, limit = null) {
  const URI = 'file';
  const options = { method: 'list', path: this.prefixPath(path) };
  if (by !== null) options.by = by;
  if (order !== null) options.order = order;
  if (limit !== null) options.limit = limit;
  return this.request.get(API_S + URI, options);
};

export const move = function (fromTo) {
  const URI = 'file';
  return this.request.post(API_S + URI, { method: 'move', ...this.listFromTo(fromTo) });
};

export const copy = function (fromTo) {
  const URI = 'file';
  return this.request.post(API_S + URI, { method: 'copy', ...this.listFromTo(fromTo) });
};

export const search = function (sPath, wd = null, re = null) {
  const URI = 'file';
  const options = { method: 'search', path: this.prefixPath(sPath) };
  if (wd !== null) options.wd = wd;
  if (re !== null) options.re = re;
  return this.request.get(API_S + URI, options);
};

export const sync = async function(cursor = 'null') {
  const URI = 'file';
  let hasMore = true;
  let result;
  const entries = {};
  while (hasMore) {
    result = await this.request.get(API_S + URI, { method: 'diff', cursor });
    hasMore = result.has_more;
    cursor = result.cursor;
    Object.assign(entries, result.entries);
  }
  result.entries = entries;
  return result;
};
