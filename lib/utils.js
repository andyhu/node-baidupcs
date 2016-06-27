import Promise from 'bluebird';
import { createReadStream, createWriteStream, existsAsync, statAsync } from 'fs-extra-promise';
import { readable as isReadableStream, writable as isWritableStream } from 'is-stream';
import bytes from 'bytes';

export const fileToStream = async (file, type = 'read') => {
  let check;
  let create;
  if (type === 'read') {
    check = isReadableStream;
    create = createReadStream;
  } else if (type === 'write') {
    check = isWritableStream;
    create = createWriteStream;
  } else {
    throw new Error('Parameter \'type\' must be either \'read\' or \'write\'');
  }
  if (check(file)) {
    return file;
  } else if (typeof file === 'string') {
    if (!await existsAsync(file)) {
      throw new Error(`File '${file}' does not exists`);
    }
    return create(file);
  }
  throw new Error(`Parameter 'file' must be either an accessible file or a ${type}able stream`);
};

export const splitFileToStreams = async (file, minTrunkSize = bytes('10MB'), maxTrunkNumber = Infinity) => {
  const fileSize = (await statAsync(file)).size;
  if (fileSize < minTrunkSize) {
    return await fileToStream(file, 'read');
  }
  let trunks = Math.ceil(fileSize / minTrunkSize);
  if (trunks > maxTrunkNumber) {
    minTrunkSize = Math.ceil(fileSize / maxTrunkNumber);
    trunks = maxTrunkNumber;
  }
  return Array.from(Array(trunks), (_, i) => {
    const start = i * minTrunkSize;
    const end = Math.min(fileSize, start + minTrunkSize) - 1;
    const stream = createReadStream(file, { start, end });
    stream.pause();
    return stream;
  });
};

export const asyncToPromise = func => {
  return (...args) => Promise.try(async () => await func.apply(this, args));
};
