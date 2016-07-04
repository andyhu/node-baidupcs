import { API_BASE_URL_OAUTH as API_O } from './index';

export const getLoggedInUser = function () {
  const URI = 'passport/users/getLoggedInUser';
  return this.request.post(API_O + URI);
};

export const getInfo = function () {
  const URI = 'passport/users/getInfo';
  return this.request.post(API_O + URI);
};

export const isAppUser = function (options = { uid: undefined, appid: undefined }) {
  const URI = 'passport/users/isAppUser';
  return this.request.post(API_O + URI, {}, options);
};
