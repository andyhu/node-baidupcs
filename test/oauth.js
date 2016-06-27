import test from 'ava';
import BaiduPCS from '../lib/baidupcs';
import config from './config.json';

const UID = 1107596645;
const APP_ID = 1569193;

const pcs = new BaiduPCS(config);
test('getLoggedInUser', async t => {
  const result = await pcs.api.getLoggedInUser();
  t.is(typeof result, 'object', 'result is object');
  t.is(typeof result.error_code, 'undefined', 'there\'s no errors');
  t.deepEqual(Object.keys(result), ['uid', 'uname', 'portrait']);
});

test('getInfo', async t => {
  const result = await pcs.api.getInfo();
  t.is(typeof result, 'object', 'result is object');
  t.is(typeof result.error_code, 'undefined', 'there\'s no errors');
  t.not(typeof result.userid, 'undefined');
});

test('isAppUser', async t => {
  let result = await pcs.api.isAppUser();
  t.is(typeof result, 'object', 'result is object');
  t.is(typeof result.error_code, 'undefined', 'there\'s no errors');
  t.is(result.result, '1', 'result == 1');
  result = await pcs.api.isAppUser({ uid: UID, appid: APP_ID });
  t.is(typeof result, 'object', 'result is object');
  t.is(typeof result.error_code, 'undefined', 'there\'s no errors');
  t.is(result.result, '1', 'result == 1');
});
