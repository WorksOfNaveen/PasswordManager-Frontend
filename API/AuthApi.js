import axios from 'axios';
import { Platform } from 'react-native';
import { KeychainManager } from '../Store/KeyChainStorage';

const apiClient = axios.create({
  baseURL:
    Platform.OS === 'android'
      ? 'http://10.0.2.2:3000' // ✅ Android emulator
      : 'http://localhost:3000', // ✅ iOS / web
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
apiClient.interceptors.request.use(
  async config => {
    const token = await KeychainManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    Promise.reject(error);
  },
);
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await KeychainManager.getRefreshToken();
        if (!refreshToken) {
          await KeychainManager.clearAllTokens(); //even if we have access tkn we cant use it so we clear all
          return Promise.reject(error);
        }
        const res = await axios.post(`${apiClient.defaults.baseURL}/refresh`, {
          refreshToken,
        });
        //  refreshToken: newRefresh renaming yo newRefresh
        const { refreshToken: newRefresh, accessToken } = res.data;
        await KeychainManager.saveTokens(accessToken, newRefresh);

        // retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (err) {
        await KeychainManager.clearAllTokens();
        return Promise.reject(err);
      }
    }
  },
);
export default apiClient;
