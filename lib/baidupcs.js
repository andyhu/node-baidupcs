import Promise from 'bluebird';
import sa from 'superagent';
import jsonParser from 'superagent/lib/node/parsers/json';
import logger from 'superagent-logger';
import proxify from 'superagent-proxy';
import bytes from 'bytes';
import chalk from 'chalk';
import * as api from './api';
import { parseError } from './errors';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
global.Promise = Promise;

const DEFAULT_OPTIONS = {
  accessToken: null,
  appName: null,
  maxConcurrentJobs: 10,
  maxRetryTimes: 5,
  retryInterval: 500, // 500ms
  minTrunkSize: bytes('10MB'),
  maxTrunkNumber: 1024,
  proxy: null, // 'http://127.0.0.1:8888'
  debug: false,
};

export default class BaiduPCS {
  constructor(options) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    if (!this.options.accessToken || !this.options.appName) {
      throw new Error('Options \'accessToken\' and \'appName\' are required');
    }
    if (this.options.proxy) proxify(sa);
    this.bindAllAPIs();
    this.throttle = this.options.maxConcurrentJobs;
  }
  bindAllAPIs() {
    this.api = {};
    for (const key in api) {
      if (typeof api[key] === 'function') {
        this.api[key] = this.wrapApi(api[key]);
      } else {
        this.api[key] = api[key];
      }
    }
  }
  wrapApi(func) {
    return async (...params) => {
      let retries = this.options.maxRetryTimes;
      let result;
      while (retries-- > 0) {
        try {
          while (this.throttle < 1) await Promise.delay(this.options.retryInterval);
          --this.throttle;
          result = await func.apply(this, params);
          ++this.throttle;
          break;
        } catch (err) {
          ++this.throttle;
          const { retriable, reason } = parseError(err);
          if (this.options.debug) {
            console.log(chalk.red.bold.dim('ERROR:'), chalk.yellow('Calling'), chalk.green(`'${func.name}(${params.map(JSON.stringify).join(', ')})'`, chalk.yellow('with error:')));
            console.log('      ', chalk.dim(JSON.stringify(reason, null, 0)).replace(/\r?\n/g, ''));
          }
          if (!retriable) {
            break;
          }
        }
        await Promise.delay(this.options.retryInterval);
      }
      return result;
    };
  }
  prefixPath(path) {
    path = path.replace(/^\/+/, '') || '';
    return /^\/apps\/[^\/]+?\/.+?$/i.test(path) ? path : `/apps/${this.options.appName}/${path}`;
  }
  listPath(paths) {
    if (Array.isArray(paths)) {
      return { param: JSON.stringify({ list: paths.map(p => ({ path: this.prefixPath(p) })) }) };
    } else if (typeof paths === 'string') {
      return { path: this.prefixPath(paths) };
    }
    return null;
  }
  listFromTo(paths) {
    if (Array.isArray(paths)) {
      return { param: JSON.stringify({ list: paths.map(item => ({ from: this.prefixPath(item.from), to: this.prefixPath(item.to) })) }) };
    } else if (typeof paths === 'object') {
      return { from: this.prefixPath(paths.from), to: this.prefixPath(paths.to) };
    }
    return null;
  }
  request = {
    get: async (uri, query = {}) => {
      const req = sa.get(uri);
      if (this.options.debug) req.use(logger);
      if (this.options.proxy) req.proxy(this.options.proxy);
      const { body } = await req.query({ ...query, access_token: this.options.accessToken })
        .parse(jsonParser);
      return body;
    },
    post: async (uri, query = {}, send = {}, attach = []) => {
      const req = sa.post(uri);
      if (this.options.debug) req.use(logger);
      if (this.options.proxy) req.proxy(this.options.proxy);
      req.query({ ...query, access_token: this.options.accessToken });
      if (Object.keys(send).length) req.send(send);
      if (attach.length) req.attach(...attach);
      const { body } = await req.parse(jsonParser);
      return body;
    },
    download: (uri, query = {}) => {
      const req = sa.get(uri);
      if (this.options.debug) req.use(logger);
      if (this.options.proxy) req.proxy(this.options.proxy);
      return req.query({ ...query, access_token: this.options.accessToken });
    },
  };
}

module.exports = BaiduPCS;
