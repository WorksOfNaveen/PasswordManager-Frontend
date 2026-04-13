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

const AuthStore = create<globalState>(set => ({
  isLogged: false,
  authData: null,
  key: null,

  setLogged: value => set({isLogged: value}),
  setAuthData: data => set({authData: data}),
  setKey: value => set({key: value}),
  logout: async () => {
    try {
      // 🔐 Clear Keychain tokens
      console.log('[AuthStore.logout] Clearing Keychain tokens...');
      await KeychainManager.clearAllTokens();

      // 🧹 Clear Zustand store state
      console.log('[AuthStore.logout] Clearing store state...');
      set({isLogged: false, key: null, authData: null});

      console.log(
        '[AuthStore.logout] Logout complete - all sensitive data cleared',
      );
    } catch (error) {
      console.error('[AuthStore.logout] Error during logout:', error);
      // Still clear store state even if Keychain fails
      set({isLogged: false, key: null, authData: null});
    }
  },
}));

const usePasswordStore = create<passwordStore>(set => ({
  passwords: [],
  loading: false,
  fetchPasswords: async () => {
    try {
      set({loading: true});
      const res = await apiClient.get('/pwd/getPwd');
      console.log(
        '[fetchPasswords] First password:',
        res.data[0]?.password?.substring(0, 50),
      );
      set({passwords: res.data, loading: false});
    } catch (e) {
      console.log('error fetching passwords', e);
      set({loading: false});
    }
  },
  addPassword: async data => {
    try {
      const res = await apiClient.post('/pwd/addPwd', data);
      set(state => ({
        passwords: [...state.passwords, res.data],
      }));
    } catch (error) {
      console.log(error);
    }
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
      console.log(err);
    }
  },
  deletePassword: async id => {
    try {
      await apiClient.delete(`/pwd/deletePwd/${id}`);
      set(state => ({
        passwords: state.passwords.filter(pwd => pwd._id !== id),
      }));
    } catch (error) {}
  },
  clearPasswords: () => {
    console.log(
      '[usePasswordStore.clearPasswords] Clearing all cached passwords',
    );
    set({passwords: []});
  },
}));
export {AuthStore, usePasswordStore};
