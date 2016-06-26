import { createHash as md5CreateHash } from 'crypto';
import { createHash as crc32CreateHash } from 'crc-hash';
import { fileToStream } from './utils';

const hash = (funcs, file) => new Promise(async (resolve, reject) => {
  const stream = await fileToStream(file, 'read');
  stream.on('data', data => funcs.forEach(func => func.update(data)));
  stream.on('end', () => resolve(funcs.map(func => func.digest('hex'))));
  stream.on('error', reject);
});

export const md5Hash = file => hash([md5CreateHash('md5')], file)
  .then(hashes => hashes[0]);
export const crc32Hash = file => hash([crc32CreateHash('crc32')], file)
  .then(hashes => hashes[0]);
export const md5AndCrc32Hash = file => hash([md5CreateHash('md5'), crc32CreateHash('crc32')], file)
  .then(([md5, crc32]) => ({ md5, crc32 }));
