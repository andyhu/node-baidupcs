import { API_BASE_URL_OAUTH as API_O } from '../constants';

export const getLoggedInUser = async function() {
  const URI = 'passport/users/getLoggedInUser';
  return await this.request.post(API_O + URI);
};

export const getInfo = async function() {
  const URI = 'passport/users/getInfo';
  return await this.request.post(API_O + URI);
};

export const isAppUser = async function(options = { uid: undefined, appid: undefined }) {
  const URI = 'passport/users/isAppUser';
  return await this.request.post(API_O + URI, {}, options);
};
