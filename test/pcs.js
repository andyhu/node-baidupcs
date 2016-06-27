import Promise from 'bluebird';
import test from 'ava';
import BaiduPCS from '../lib/baidupcs';
import { fileSync as createTmpFile } from 'tmp';
import { readFileAsync, writeFileAsync } from 'fs-extra-promise';
import bytes from 'bytes';
import config from './config.json';

const pcs = new BaiduPCS(config);

test.before(async () => {
  try {
    await [pcs.api.remove('testD1'), pcs.api.remove('testD2'), pcs.api.remove('testD')];
  } catch (err) { }
});

test('sync', async t => {
  let result = await pcs.api.sync();
  t.is(typeof result, 'object', 'result is object');
  t.is(typeof result.error_code, 'undefined', 'there\'s no errors');
  t.is(typeof result.entries, 'object');
  await Promise.delay(3000);
  result = await pcs.api.sync(result.cursor);
  t.is(typeof result.error_code, 'undefined', 'there\'s no errors');
  t.is(typeof result.entries, 'object');
});

test('quota', async t => {
  const result = await pcs.api.quota();
  t.is(typeof result, 'object', 'result is object');
  t.is(typeof result.error_code, 'undefined', 'there\'s no errors');
  t.deepEqual(Object.keys(result), ['quota', 'used', 'request_id']);
});

test.serial('mkdir', async t => {
  const result = await pcs.api.mkdir('testD');
  t.is(typeof result, 'object', 'result is object');
  t.is(typeof result.error_code, 'undefined', 'there\'s no errors');
});

test.serial('upload', async t => {
  const result = await pcs.api.upload('../package.json', 'testD/u.js', 'overwrite');
  t.is(typeof result, 'object', 'result is object');
  t.is(typeof result.error_code, 'undefined', 'there\'s no errors');
  t.not(result.path, undefined);
});

test('uploadRapid', async t => {
  const tmpFile = createTmpFile();
  await writeFileAsync(tmpFile.name, Array.from(Array(1024 * 257), (_, k) => k + 1).join(''));
  try {
    await pcs.api.upload(tmpFile.name, 'tempFile2.txt', 'overwrite');
  } catch (err) { }
  const result = await pcs.api.uploadRapid(tmpFile.name, 'tempFile1.txt', 'overwrite');
  t.is(typeof result, 'object', 'result is object');
  t.is(typeof result.error_code, 'undefined', 'there\'s no errors');
  t.is(result.md5, '91862f16fccd576dc537642883c6c97b');
  try {
    await pcs.api.remove(['tempFile1.txt', 'tempFile2.txt']);
  } catch (err) { }
});

test('uploadSmart', async t => {
  const tmpFile = createTmpFile();
  const minTrunkSize = pcs.options.minTrunkSize;
  await writeFileAsync(tmpFile.name, Array.from(Array(1024 * 10), (_, k) => k + 1).join(''));
  pcs.options.minTrunkSize = bytes('20KB');
  const result = await pcs.api.uploadSmart(tmpFile.name, 'tempFile.txt', 'overwrite');
  pcs.options.minTrunkSize = minTrunkSize;
  t.is(typeof result, 'object', 'result is object');
  t.is(typeof result.error_code, 'undefined', 'there\'s no errors');
  t.is(result.size, 40094);
  tmpFile.removeCallback();
  try {
    await pcs.api.remove('tempFile.txt');
  } catch (err) { }
});

test.serial('copy', async t => {
  let result = await pcs.api.copy({ from: 'testD', to: 'testD2' });
  t.is(typeof result, 'object', 'result is object');
  t.is(typeof result.error_code, 'undefined', 'there\'s no errors');
  t.not(result.extra, undefined);
  result = await pcs.api.copy([{ from: 'testD/u.js', to: 'testD/d.js' }, { from: 'testD/u.js', to: 'testD/dup.js' }]);
  t.is(typeof result, 'object', 'result is object');
  t.is(typeof result.error_code, 'undefined', 'there\'s no errors');
  t.not(result.extra, undefined);
});

test.serial('move', async t => {
  let result = await pcs.api.move({ from: 'testD2', to: 'testD1' });
  t.is(typeof result, 'object', 'result is object');
  t.is(typeof result.error_code, 'undefined', 'there\'s no errors');
  t.not(result.extra, undefined);
  result = await pcs.api.move([{ from: 'testD1/u.js', to: 'testD1/1.json' }, { from: 'testD/dup.js', to: 'testD1/2.json' }]);
  t.is(typeof result, 'object', 'result is object');
  t.is(typeof result.error_code, 'undefined', 'there\'s no errors');
  t.not(result.extra, undefined);
});

test.serial('download', async t => {
  const tmpFile = createTmpFile();
  await pcs.api.download('testD/d.js', tmpFile.name);
  t.is(await readFileAsync(tmpFile.name, 'utf8'), await readFileAsync('../package.json', 'utf8'));
  tmpFile.removeCallback();
});

test.serial('meta', async t => {
  let result = await pcs.api.meta('testD');
  t.is(typeof result, 'object', 'result is object');
  t.is(typeof result.error_code, 'undefined', 'there\'s no errors');
  t.true(result.list instanceof Array);
  result = await pcs.api.meta(['testD', 'testD/d.js']);
  t.is(typeof result, 'object', 'result is object');
  t.is(typeof result.error_code, 'undefined', 'there\'s no errors');
  t.true(result.list instanceof Array && result.list.length === 2);
});

test.serial('list', async t => {
  const result = await pcs.api.list('testD', 'name', 'asc', '0-10');
  t.is(typeof result, 'object', 'result is object');
  t.is(typeof result.error_code, 'undefined', 'there\'s no errors');
  t.true(result.list instanceof Array);
});

test.serial('remove', async t => {
  let result = await pcs.api.remove(['testD/u.js', 'testD/d.js', 'testD']);
  t.is(typeof result, 'object', 'result is object');
  t.is(typeof result.error_code, 'undefined', 'there\'s no errors');
  result = await pcs.api.remove('testD1');
  t.is(typeof result, 'object', 'result is object');
  t.is(typeof result.error_code, 'undefined', 'there\'s no errors');
});
