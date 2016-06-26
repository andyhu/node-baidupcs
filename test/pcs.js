import test from 'ava';
import PCS from '../lib/pcs';
import { fileSync as createTmpFile } from 'tmp';
import { readFileSync } from 'fs';
import config from './config.json';

const pcs = new PCS(config);

test.before(async () => {
  try {
    await pcs.api.del(['testD', 'testD2']);
  } catch (err) {}
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

test.serial('fileUpload', async t => {
  const result = await pcs.api.fileUpload('../package.json', 'testD/u.js', 'overwrite');
  t.is(typeof result, 'object', 'result is object');
  t.is(typeof result.error_code, 'undefined', 'there\'s no errors');
  t.not(result.path, undefined);
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

test.serial('fileDownload', async t => {
  const tmpFile = createTmpFile();
  await pcs.api.fileDownload('testD/d.js', tmpFile.name);
  t.is(readFileSync(tmpFile.name, 'utf8'), readFileSync('../package.json', 'utf8'));
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

test.serial('del', async t => {
  let result = await pcs.api.del(['testD/u.js', 'testD/d.js', 'testD']);
  t.is(typeof result, 'object', 'result is object');
  t.is(typeof result.error_code, 'undefined', 'there\'s no errors');
  result = await pcs.api.del('testD1');
  t.is(typeof result, 'object', 'result is object');
  t.is(typeof result.error_code, 'undefined', 'there\'s no errors');
});
