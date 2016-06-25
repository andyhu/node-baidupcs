const API_BASE_URL = 'https://openapi.baidu.com/rest/2.0/';

export const getLoggedInUser = async function() {
  const URI = 'passport/users/getLoggedInUser';
  return await this.request.post(API_BASE_URL + URI);
};

export const getInfo = async function() {
  const URI = 'passport/users/getInfo';
  return await this.request.post(API_BASE_URL + URI);
};

export const isAppUser = async function(options = { uid: undefined, appid: undefined }) {
  const URI = 'passport/users/isAppUser';
  return await this.request.post(API_BASE_URL + URI, {}, options);
};
