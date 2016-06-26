import { createReadStream, createWriteStream, existsAsync } from 'fs-extra-promise';
import { readable as isReadableStream, writable as isWritableStream } from 'is-stream';

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

export const split = (file) => {
  // if ()
};
