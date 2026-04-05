import { create } from 'zustand';
import apiClient from '../API/AuthApi.js';

interface globalState {
  isLogged: boolean;
  setLogged: (value: boolean) => void;
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
};

const AuthStore = create<globalState>(set => ({
  isLogged: false,

  setLogged: value => set({ isLogged: value }),
}));

const usePasswordStore = create<passwordStore>(set => ({
  passwords: [],
  loading: false,
  fetchPasswords: async () => {
    try {
      set({ loading: true });
      const res = await apiClient.get('/pwd/getPwd');
      set({
        passwords: res.data,
        loading: false,
      });
    } catch (e) {
      console.log('error fetching passwords', e);
      set({ loading: false });
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
}));
export { AuthStore, usePasswordStore };
