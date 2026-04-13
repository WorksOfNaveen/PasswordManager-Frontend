import {Alert, Button, StyleSheet, Text, TextInput, View} from 'react-native';
import React, {useState, useEffect} from 'react';
import {AuthStore} from '../Store/store';
import {verifyMasterPassword} from '../Encryption/vault';
// import {KeychainManager} from '../Store/KeyChainStorage';
import apiClient from '../API/AuthApi';
import {useNavigation} from '@react-navigation/native';
// import {NativeStackScreenProps} from '@react-navigation/native-stack';
// import {RootStackParamList} from '../Types/types';

// type Props = NativeStackScreenProps<RootStackParamList, 'MasterPassword'>;

const MasterPassword = () => {
  const [showMpassword, setShowMpassword] = useState(false);
  const [mpassword, setmpassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation<any>();

  // Get auth data from store
  const auth = AuthStore(state => state.authData);

  // to stay logged in
  const setLog = AuthStore(state => state.setLogged);

  // to set the key
  const setKey = AuthStore(state => state.setKey);

  // to set auth data if missing
  const setAuthData = AuthStore(state => state.setAuthData);

  // Log auth state for debugging
  useEffect(() => {
    console.log('[MasterPassword] Auth data from store:', {
      auth: auth
        ? {
            salt: auth.salt?.substring(0, 10) + '...',
            verifyHash: auth.verifyHash?.substring(0, 10) + '...',
          }
        : null,
    });

    // If auth data is missing, try to fetch it from the backend
    if (!auth || !auth.salt || !auth.verifyHash) {
      console.log(
        '[MasterPassword] Auth data missing, attempting to fetch from backend...',
      );
      fetchAuthData();
    } else {
      setIsLoading(false);
    }
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
        console.log('[MasterPassword] Auth data fetched successfully');
        setAuthData(authData);
      } else {
        throw new Error('Invalid auth data response');
      }
    } catch (error) {
      console.error('[MasterPassword] Failed to fetch auth data:', error);
      Alert.alert('Error', 'Failed to load auth data. Please login again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceed = () => {
    if (!auth || !auth.salt || !auth.verifyHash) {
      console.error('[MasterPassword] Auth data missing:', auth);
      Alert.alert('Error', 'Auth data missing. Please login again.');
      return;
    }

    console.log('[MasterPassword] Attempting verification with auth data:', {
      salt: auth.salt?.substring(0, 10) + '...',
      verifyHash: auth.verifyHash?.substring(0, 10) + '...',
    });

    const key = verifyMasterPassword(mpassword, auth);
    if (!key) {
      console.log('[MasterPassword] Verification FAILED - Incorrect password');
      Alert.alert('Error', 'Master password is incorrect. Please try again.');
      return;
    }

    console.log(
      '[MasterPassword] Verification SUCCESSFUL - Key derived and saved',
    );

    // First, store the key and set logged status
    setKey(key);
    setLog(true);

    // Then navigate to ListScreen using navigation.reset to clear the navigation stack
    console.log('[MasterPassword] Navigating to ListScreen');
    setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{name: 'ListScreen'}],
      });
    }, 200);
  };

  if (isLoading) {
    return (
      <View style={styles.wholeContainer}>
        <Text style={styles.header}>🔐 Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wholeContainer}>
      <Text style={styles.header}>🔐 Master Password</Text>
      <Text style={styles.subtitle}>
        Enter your master password to access your passwords
      </Text>
      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Master Password"
          style={styles.passwordInput}
          value={mpassword}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setmpassword}
          secureTextEntry={!showMpassword}
          editable={!isLoading}
        />
        <Text
          style={styles.visibilityToggle}
          onPress={() => setShowMpassword(!showMpassword)}>
          {showMpassword ? '👁️' : '🙈'}
        </Text>
      </View>
      <Button title="Decrypt" onPress={handleProceed} disabled={isLoading} />
    </View>
  );
};

export default MasterPassword;

const styles = StyleSheet.create({
  wholeContainer: {
    flex: 1,
    justifyContent: 'center', // vertical center
    alignItems: 'center', // horizontal center
    backgroundColor: '#f2f2f2', //helps visually confirm centering
  },

  container: {
    width: '85%',
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 18,
    letterSpacing: 2,
    color: '#000000',
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ccc', // 👈 avoids harsh black lines
    marginBottom: 20,
    paddingVertical: 8, // 👈 VERY IMPORTANT (fixes “line at top” look)
  },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 20,
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 8, // 👈 fixes alignment inside row
  },

  visibilityToggle: {
    fontSize: 20,
    marginLeft: 10,
    paddingVertical: 8,
  },
});
