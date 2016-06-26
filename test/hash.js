import { md5Hash, crc32Hash, md5AndCrc32Hash } from '../lib/hash';
import { fileSync as createTmpFile } from 'tmp';
import { writeFileAsync } from 'fs-extra-promise';
import test from 'ava';

const tmpFile = createTmpFile();
const MD5 = '3c649b378588943684da8ae470cf0b7f';
const CRC32 = '2724bf51';

test.before(async () => {
  await writeFileAsync(tmpFile.name, Array.from(Array(1024), (v, k) => k + 1).join(''));
});

test('hash', async t => {
  t.is(await md5Hash(tmpFile.name), MD5, 'md5');
  t.is(await crc32Hash(tmpFile.name), CRC32, 'crc32');
  t.deepEqual(await md5AndCrc32Hash(tmpFile.name), { md5: MD5, crc32: CRC32 }, 'md5AndCrc32');
});

test.after(() => {
  tmpFile.removeCallback();
});
