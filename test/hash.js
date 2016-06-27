import { md5Hash, crc32Hash, md5AndCrc32Hash } from '../lib/hash';
import { fileSync as createTmpFile } from 'tmp';
import { writeFileAsync } from 'fs-extra-promise';
import test from 'ava';

const tmpFile = createTmpFile();

test.before(async () => {
  await writeFileAsync(tmpFile.name, Array.from(Array(1024 * 10), (_, k) => k + 1).join(''));
});

test('hash', async t => {
  const MD5 = '48150f94a2c4ff377c6ed71904ddf8e7';
  const CRC32 = '77c35457';
  const md5 = await md5Hash(tmpFile.name);
  t.is(md5, MD5, 'md5');
  const crc32 = await crc32Hash(tmpFile.name);
  t.is(crc32, CRC32, 'crc32');
  t.deepEqual(await md5AndCrc32Hash(tmpFile.name), { md5: MD5, crc32: CRC32 }, 'md5AndCrc32');
});

test.after(() => {
  tmpFile.removeCallback();
});
