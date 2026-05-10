import {create} from 'zustand';
import apiClient from '../API/AuthApi.js';
import {KeychainManager} from './KeyChainStorage';

interface AuthDataType {
  salt: string;
  verifyHash: string;
}

interface globalState {
  isLogged: boolean;
  authData: AuthDataType | null;
  key: string | null;
  setLogged: (value: boolean) => void;
  setAuthData: (data: AuthDataType | null) => void;
  setKey: (key: string | null) => void;
  logout: () => Promise<void>;
}
type Password = {
  _id: string;
  domain: string;
  username: string;
  email: string;
  password: string;
};
type passwordStore = {
  passwords: Password[];
  loading: boolean;
  // omit is to ignore while storing in the passwords[]
  fetchPasswords: () => Promise<void>;
  addPassword: (data: Omit<Password, '_id'>) => Promise<void>;
  updatePassword: (id: string, data: Omit<Password, '_id'>) => Promise<void>;
  deletePassword: (id: string) => Promise<void>;
  clearPasswords: () => void;
};

// Authentication state store
const AuthStore = create<globalState>(set => ({
  isLogged: false,
  authData: null,
  key: null,

  // Set login status
  setLogged: value => set({isLogged: value}),
  // Set auth verification data
  setAuthData: data => set({authData: data}),
  // Set derived vault key
  setKey: value => set({key: value}),
  // Clear all auth data
  logout: async () => {
    try {
      // 🔐 Clear Keychain tokens
      // console.log('[AuthStore.logout] Clearing Keychain tokens...');
      await KeychainManager.clearAllTokens();

      // 🧹 Clear Zustand store state
      // console.log('[AuthStore.logout] Clearing store state...');
      set({isLogged: false, key: null, authData: null});

      // console.log(
      //   '[AuthStore.logout] Logout complete - all sensitive data cleared',
      // );
    } catch (error) {
      // console.error('[AuthStore.logout] Error during logout:', error);
      // Still clear store state even if Keychain fails
      set({isLogged: false, key: null, authData: null});
    }
  },
}));

// Password vault state store
const usePasswordStore = create<passwordStore>(set => ({
  passwords: [],
  loading: false,
  // Fetch all passwords from backend
  fetchPasswords: async () => {
    try {
      set({loading: true});
      const res = await apiClient.get('/pwd/getPwd');
      // console.log(
      //   '[fetchPasswords] First password:',
      //   res.data[0]?.password?.substring(0, 50),
      // );
      set({passwords: res.data, loading: false});
    } catch (e) {
      // console.log('error fetching passwords', e);
      set({loading: false});
      // Create new password entry
    }
  },
  addPassword: async data => {
    try {
      const res = await apiClient.post('/pwd/addPwd', data);
      set(state => ({
        passwords: [...state.passwords, res.data.data],
      }));
    } catch (error) {
      // console.log(error);
    }
    // Update existing password entry
  },
  updatePassword: async (id, data) => {
    try {
      const res = await apiClient.put(`/passwords/${id}`, data);

      set(state => ({
        passwords: state.passwords.map(item =>
          item._id === id ? res.data : item,
        ),
      }));
    } catch (err) {
      // console.log(err);
    }
    // Delete password entry
  },
  deletePassword: async id => {
    try {
      await apiClient.delete(`/pwd/deletePwd/${id}`);
      set(state => ({
        passwords: state.passwords.filter(pwd => pwd._id !== id),
      }));
    } catch (error) {}
    // Clear cached passwords
  },
  clearPasswords: () => {
    // console.log(
    //   '[usePasswordStore.clearPasswords] Clearing all cached passwords',
    // );
    set({passwords: []});
  },
}));
export {AuthStore, usePasswordStore};
