import * as Keychain from 'react-native-keychain';

const ACCESS_TOKEN_SERVICE = 'access_token';
const REFRESH_TOKEN_SERVICE = 'refresh_token';

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
      console.error('Error saving tokens:', error);
      return false;
    }
  },

  // 🔑 Get access token
  getAccessToken: async () => {
    try {
      const creds = await Keychain.getGenericPassword({
        service: ACCESS_TOKEN_SERVICE,
      });
      return creds?.password || null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  // 🔄 Get refresh token
  getRefreshToken: async () => {
    try {
      const creds = await Keychain.getGenericPassword({
        service: REFRESH_TOKEN_SERVICE,
      });
      return creds?.password || null;
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  // 📦 Get both tokens
  getTokens: async () => {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        KeychainManager.getAccessToken(),
        KeychainManager.getRefreshToken(),
      ]);

      return { accessToken, refreshToken };
    } catch (error) {
      console.error('Error getting tokens:', error);
      return { accessToken: null, refreshToken: null };
    }
  },

  // 🧹 Clear tokens (logout)
  clearAllTokens: async () => {
    try {
      await Promise.all([
        Keychain.resetGenericPassword({ service: ACCESS_TOKEN_SERVICE }),
        Keychain.resetGenericPassword({ service: REFRESH_TOKEN_SERVICE }),
      ]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  },
};
