import { createWriteStream, access } from 'fs';
import Promise from 'bluebird';
import { basename, dirname } from 'path';
import isStream from 'is-stream';

const accessAsync = file => new Promise(rsv => access(file, err => rsv(!err)));

const API_BASE_URL = {
  STANDARD: 'https://pcs.baidu.com/rest/2.0/pcs/',
  UPLOAD: 'https://c.pcs.baidu.com/rest/2.0/pcs/',
  DOWNLOAD: 'https://d.pcs.baidu.com/rest/2.0/pcs/',
};

export const quota = async function() {
  const URI = 'quota';
  return await this.request.get(API_BASE_URL.STANDARD + URI, { method: 'info' });
};

export const fileUpload = async function (file, uploadPath = null, ondup = null) {
  const URI = 'file';
  if (typeof file === 'string') {
    if (!await accessAsync(file)) {
      throw new Error(`File '${file}' does not exists`);
    }
    if (!uploadPath) {
      uploadPath = basename(file);
    }
  } else if (!isStream.readable(file)) {
    throw new Error('Parameter \'file\' should be either a file or a readable stream');
  }
  if (!uploadPath) {
    throw new Error('Parameter \'uploadPath\' required');
  }
  const options = { method: 'upload', path: this.prefixPath(uploadPath) };
  if (ondup) options.ondup = ondup;
  return await this.request.post(API_BASE_URL.UPLOAD + URI, options, {}, ['file', file]);
};

export const fileUploadTemp = async function (file) {
  const URI = 'file';
  if (typeof file === 'string') {
    if (!await accessAsync(file)) {
      throw new Error(`File '${file}' does not exists`);
    }
  } else if (!isStream.readable(file)) {
    throw new Error('Parameter \'stream\' should be either a file or a readable stream');
  }
  return await this.request.post(API_BASE_URL.UPLOAD + URI, { method: 'upload', type: 'tmpfile' }, {}, ['file', file]);
};

export const fileDownload = async function(serverPath, localPath = null) {
  const URI = 'file';
  let writeStream;
  if (!isStream.writable(localPath)) {
    writeStream = localPath;
  } else if (typeof localPath === 'string' && await accessAsync(dirname(localPath))) {
    writeStream = createWriteStream(localPath);
  }
  return new Promise((resolve, reject) => {
    this.request.download(API_BASE_URL.DOWNLOAD + URI, { path: this.prefixPath(serverPath), method: 'download' })
      .on('error', reject)
      .pipe(writeStream)
      .on('error', reject)
      .on('finish', resolve);
  });
};

export const mkdir = async function(dirPath) {
  const URI = 'file';
  return await this.request.post(API_BASE_URL.STANDARD + URI, { method: 'mkdir', path: this.prefixPath(dirPath) });
};

export const del = async function(paths) {
  const URI = 'file';
  return await this.request.post(API_BASE_URL.STANDARD + URI, Object.assign({ method: 'delete' }, this.listPath(paths)));
};

export const meta = async function(paths) {
  const URI = 'file';
  return await this.request.get(API_BASE_URL.STANDARD + URI, Object.assign({ method: 'meta' }, this.listPath(paths)));
};

export const list = async function(dirPath, by = null, order = null, limit = null) {
  const URI = 'file';
  const options = { method: 'list', path: this.prefixPath(dirPath) };
  if (by !== null) options.by = by;
  if (order !== null) options.order = order;
  if (limit !== null) options.limit = limit;
  return await this.request.get(API_BASE_URL.STANDARD + URI, options);
};

export const move = async function(fromTo) {
  const URI = 'file';
  return await this.request.post(API_BASE_URL.STANDARD + URI, Object.assign({ method: 'move' }, this.listFromTo(fromTo)));
};

export const copy = async function(fromTo) {
  const URI = 'file';
  return await this.request.post(API_BASE_URL.STANDARD + URI, Object.assign({ method: 'copy' }, this.listFromTo(fromTo)));
};

export const search = async function(sPath, wd = null, re = null) {
  const URI = 'file';
  const options = { method: 'search', path: this.prefixPath(sPath) };
  if (wd !== null) options.wd = wd;
  if (re !== null) options.re = re;
  return await this.request.get(API_BASE_URL.STANDARD + URI, options);
};
