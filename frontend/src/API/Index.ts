import axios from 'axios';
import { url } from '../utils/Utils';
import { UserCredentials } from '../types';

const api = axios.create({
  baseURL: url(),
  data: {},
});

export const createDefaultFormData = (userCredentials: UserCredentials) => {
  const formData = new FormData();
  if (userCredentials?.uri) {
    formData.append('uri', userCredentials?.uri);
  }
  if (userCredentials?.database) {
    formData.append('database', userCredentials?.database);
  }
  if (userCredentials?.userName) {
    formData.append('userName', userCredentials?.userName);
  }
  if (userCredentials?.password) {
    formData.append('password', userCredentials?.password);
  }
  if (userCredentials?.email) {
    formData.append('email', userCredentials?.email);
  }
  api.interceptors.request.use(
    (config) => {
      config.data = {
        ...userCredentials,
        ...config.data,
      };
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  return formData;
};

export default api;
