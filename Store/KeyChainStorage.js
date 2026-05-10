import * as Keychain from 'react-native-keychain';

const ACCESS_TOKEN_SERVICE = 'access_token';
const REFRESH_TOKEN_SERVICE = 'refresh_token';
const AUTH_DATA_SERVICE = 'auth_data';

export const KeychainManager = {
  // 🔐 Save both tokens
  saveTokens: async (accessToken, refreshToken) => {
    try {
      await Promise.all([
        Keychain.setGenericPassword('access', accessToken, {
          service: ACCESS_TOKEN_SERVICE,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
        }),
        Keychain.setGenericPassword('refresh', refreshToken, {
          service: REFRESH_TOKEN_SERVICE,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
        }),
      ]);
      return true;
    } catch (error) {
      // console.error('Error saving tokens:', error);
      return false;
    }
  },

  // Persist master password salt + hash
  saveAuthData: async authData => {
    try {
      if (!authData?.salt || !authData?.verifyHash) {
        return false;
      }

      await Keychain.setGenericPassword('auth', JSON.stringify(authData), {
        service: AUTH_DATA_SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
      });
      return true;
    } catch (error) {
      // console.error('Error saving auth data:', error);
      return false;
    }
  },

  // Retrieve master password salt + hash
  getAuthData: async () => {
    try {
      const creds = await Keychain.getGenericPassword({
        service: AUTH_DATA_SERVICE,
      });

      const raw = creds?.password;
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      if (!parsed?.salt || !parsed?.verifyHash) {
        return null;
      }

      return {salt: parsed.salt, verifyHash: parsed.verifyHash};
    } catch (error) {
      // console.error('Error getting auth data:', error);
      return null;
    }
  },

  // Retrieve access token
  getAccessToken: async () => {
    try {
      const creds = await Keychain.getGenericPassword({
        service: ACCESS_TOKEN_SERVICE,
      });
      return creds?.password || null;
    } catch (error) {
      // console.error('Error getting access token:', error);
      return null;
    }
  },

  // Retrieve refresh token
  getRefreshToken: async () => {
    try {
      const creds = await Keychain.getGenericPassword({
        service: REFRESH_TOKEN_SERVICE,
      });
      return creds?.password || null;
    } catch (error) {
      // console.error('Error getting refresh token:', error);
      return null;
    }
  },

  // Retrieve both tokens
  getTokens: async () => {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        KeychainManager.getAccessToken(),
        KeychainManager.getRefreshToken(),
      ]);

      return {accessToken, refreshToken};
    } catch (error) {
      // console.error('Error getting tokens:', error);
      return {accessToken: null, refreshToken: null};
    }
  },

  // Clear all stored tokens
  clearAllTokens: async () => {
    try {
      await Promise.all([
        Keychain.resetGenericPassword({service: ACCESS_TOKEN_SERVICE}),
        Keychain.resetGenericPassword({service: REFRESH_TOKEN_SERVICE}),
        Keychain.resetGenericPassword({service: AUTH_DATA_SERVICE}),
      ]);
    } catch (error) {
      // console.error('Error clearing tokens:', error);
    }
  },
};
