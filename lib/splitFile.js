import { stat, createReadStream } from 'fs';
import Promise from 'bluebird';

const statAsync = Promise.promisify(stat);

export const split = (file) => {
  // if ()
};
