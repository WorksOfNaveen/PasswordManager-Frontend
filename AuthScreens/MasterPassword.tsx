import React, {useState, useEffect} from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {AuthStore} from '../Store/store';
import {verifyMasterPassword} from '../Encryption/vault';
import {KeychainManager} from '../Store/KeyChainStorage';
import apiClient from '../API/AuthApi';
import {useNavigation} from '@react-navigation/native';
import { Ionicons } from '@react-native-vector-icons/ionicons';


const THEME = {
  bg: '#111113',
  surface: '#1c1c1f',
  border: '#2a2a2f',
  text: '#f5f5f7',
  textMuted: '#a1a1aa',
  accent: '#0a84ff',
};

const MasterPassword = () => {
  const [showMpassword, setShowMpassword] = useState(false);
  const [mpassword, setmpassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation<any>();

  const auth = AuthStore(state => state.authData);
  const setLog = AuthStore(state => state.setLogged);
  const setKey = AuthStore(state => state.setKey);
  const setAuthData = AuthStore(state => state.setAuthData);

  useEffect(() => {
    if (!auth || !auth.salt || !auth.verifyHash) {
      (async () => {
        try {
          const cached = await KeychainManager.getAuthData();
          if (cached?.salt && cached?.verifyHash) {
            setAuthData(cached);
            setIsLoading(false);
            return;
          }
          await fetchAuthData();
        } catch (e) {
          await fetchAuthData();
        }
      })();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAuthData = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/auth/me/authData');

      if (response.data && response.data.salt && response.data.verifyHash) {
        const authData = {
          salt: response.data.salt,
          verifyHash: response.data.verifyHash,
        };
        setAuthData(authData);
        await KeychainManager.saveAuthData(authData);
      } else {
        throw new Error('Invalid auth data response');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load auth data. Please login again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceed = () => {
    if (!auth || !auth.salt || !auth.verifyHash) {
      Alert.alert('Error', 'Auth data missing. Please login again.');
      return;
    }

    const key = verifyMasterPassword(mpassword, auth);
    if (!key) {
      Alert.alert('Error', 'Master password is incorrect. Please try again.');
      return;
    }

    setKey(key);
    setLog(true);

    setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{name: 'ListScreen'}],
      });
    }, 200);
  };

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={THEME.bg}
          translucent={false}
        />
        <View style={styles.card}>
          <Text style={styles.header}>Loading...</Text>
          <Text style={styles.subtitle}>Preparing secure vault access</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={THEME.bg}
        translucent={false}
      />
      <View style={styles.card}>
        <Text style={styles.header}>Master Password</Text>
        <Text style={styles.subtitle}>
          Enter your master password to access your passwords
        </Text>

        <View style={styles.inputWrap}>
          <Ionicons name="key-outline" size={18} color={THEME.textMuted} />
          <TextInput
            placeholder="Master Password"
            placeholderTextColor={THEME.textMuted}
            style={styles.input}
            value={mpassword}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setmpassword}
            secureTextEntry={!showMpassword}
            editable={!isLoading}
          />
          <TouchableOpacity onPress={() => setShowMpassword(!showMpassword)}>
            <Ionicons
              name={showMpassword ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={THEME.textMuted}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitDisabled]}
          onPress={handleProceed}
          disabled={isLoading}>
          <Text style={styles.submitText}>Decrypt</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MasterPassword;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: THEME.bg,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.surface,
    padding: 18,
  },
  header: {
    color: THEME.text,
    fontSize: 30,
    fontWeight: '700',
  },
  subtitle: {
    color: THEME.textMuted,
    marginTop: 4,
    marginBottom: 18,
  },
  label: {
    color: THEME.text,
    marginBottom: 6,
    fontWeight: '600',
  },
  inputWrap: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: '#17171a',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  input: {
    flex: 1,
    color: THEME.text,
  },
  submitButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.accent,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
