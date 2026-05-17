import axios from 'axios';
import {Platform} from 'react-native';
import {KeychainManager} from '../Store/KeyChainStorage';

// Refresh token endpoint candidates
const REFRESH_ENDPOINT_CANDIDATES = '/auth/refreshToken';

const tryRefresh = async (baseURL, refreshToken) => {
  return axios.post(`${baseURL}${REFRESH_ENDPOINT_CANDIDATES}`, {
    refreshToken,
  });
};

export const ensureSessionFromRefresh = async () => {
  const refreshToken = await KeychainManager.getRefreshToken();
  if (!refreshToken) {
    await KeychainManager.clearAllTokens();
    return false;
  }

  try {
    const res = await tryRefresh(apiClient.defaults.baseURL, refreshToken);
    const {refreshToken: newRefresh, accessToken} = res.data;
    await KeychainManager.saveTokens(accessToken, newRefresh);
    return true;
  } catch (err) {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      await KeychainManager.clearAllTokens();
    }
    return false;
  }
};

// HTTP client with auto-refresh
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

// Add access token to requests
apiClient.interceptors.request.use(
  async config => {
    const token = await KeychainManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    // Handle 401 with token refresh
    return Promise.reject(error);
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

        const res = await tryRefresh(apiClient.defaults.baseURL, refreshToken);
        //  refreshToken: newRefresh renaming yo newRefresh
        const {refreshToken: newRefresh, accessToken} = res.data;
        await KeychainManager.saveTokens(accessToken, newRefresh);

        // retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (err) {
        const status = err?.response?.status;
        // Only clear tokens if refresh is definitively rejected.
        if (status === 401 || status === 403) {
          await KeychainManager.clearAllTokens();
        }
        return Promise.reject(err);
      }
    }

    // Important: for all other errors, keep the promise rejected.
    // If we don't, callers may receive `undefined` and crash on `response.data`.
    return Promise.reject(error);
  },
);
export default apiClient;
