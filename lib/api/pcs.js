import Promise from 'bluebird';
import { basename } from 'path';
import { fileToStream } from '../utils';
import { API_BASE_URL_PCS_STANDARD as API_S, API_BASE_URL_PCS_UPLOAD as API_U, API_BASE_URL_PCS_DOWNLOAD as API_D } from '../constants';

export const quota = async function() {
  const URI = 'quota';
  return await this.request.get(API_S + URI, { method: 'info' });
};

export const upload = async function (file, uploadPath = null, ondup = null) {
  const URI = 'file';
  file = await fileToStream(file, 'read');
  if (uploadPath === null) uploadPath = basename(file.path);
  if (!uploadPath) throw new Error('Parameter \'uploadPath\' required');
  const options = { method: 'upload', path: this.prefixPath(uploadPath) };
  if (ondup) options.ondup = ondup;
  return await this.request.post(API_U + URI, options, {}, ['file', file]);
};

export const uploadTemp = async function (file) {
  const URI = 'file';
  file = await fileToStream(file, 'read');
  return await this.request.post(API_U + URI, { method: 'upload', type: 'tmpfile' }, {}, ['file', file]);
};

export const download = async function(serverPath, localPath = null) {
  const URI = 'file';
  const writeStream = await fileToStream(localPath, 'write');
  return new Promise((resolve, reject) => {
    this.request.download(API_D + URI, { path: this.prefixPath(serverPath), method: 'download' })
      .on('error', reject)
      .pipe(writeStream)
      .on('error', reject)
      .on('finish', resolve);
  });
};

export const mkdir = async function(path) {
  const URI = 'file';
  return await this.request.post(API_S + URI, { method: 'mkdir', path: this.prefixPath(path) });
};

export const del = async function(path) {
  const URI = 'file';
  return await this.request.post(API_S + URI, Object.assign({ method: 'delete' }, this.listPath(path)));
};

export const meta = async function(path) {
  const URI = 'file';
  return await this.request.get(API_S + URI, Object.assign({ method: 'meta' }, this.listPath(path)));
};

export const list = async function(path, by = null, order = null, limit = null) {
  const URI = 'file';
  const options = { method: 'list', path: this.prefixPath(path) };
  if (by !== null) options.by = by;
  if (order !== null) options.order = order;
  if (limit !== null) options.limit = limit;
  return await this.request.get(API_S + URI, options);
};

export const move = async function(fromTo) {
  const URI = 'file';
  return await this.request.post(API_S + URI, Object.assign({ method: 'move' }, this.listFromTo(fromTo)));
};

export const copy = async function(fromTo) {
  const URI = 'file';
  return await this.request.post(API_S + URI, Object.assign({ method: 'copy' }, this.listFromTo(fromTo)));
};

export const search = async function(sPath, wd = null, re = null) {
  const URI = 'file';
  const options = { method: 'search', path: this.prefixPath(sPath) };
  if (wd !== null) options.wd = wd;
  if (re !== null) options.re = re;
  return await this.request.get(API_S + URI, options);
};
