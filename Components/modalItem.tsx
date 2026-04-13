import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../Types/types';
import {usePasswordStore} from '../Store/store';
import {Ionicons} from '@react-native-vector-icons/ionicons';
import {decryptVaultItem, encryptVaultItem} from '../Encryption/vault';
import {AuthStore} from '../Store/store';

type Props = NativeStackScreenProps<RootStackParamList, 'modalItem'>;

export default function ModalItem({route, navigation}: Props) {
  const pwd = route.params?.data;
  const key = AuthStore(state => state.key);

  const [domain, setDomain] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const {addPassword, updatePassword} = usePasswordStore();

  // Populate data if editing
  useEffect(() => {
    if (!key) {
      Alert.alert(
        'Error',
        'Master password key not found. Please login again.',
      );
      navigation.goBack();
      return;
    }

    if (pwd && pwd.password) {
      // Only password field is encrypted - domain, username, email are plain text
      const vaultItem = {
        id: pwd._id,
        domain: pwd.domain,
        username: pwd.username,
        email: pwd.email,
        password: pwd.password, // This is the encrypted password
      };

      console.log('[ModalItem] Attempting to decrypt password:', {
        id: pwd._id,
        domain: pwd.domain,
        username: pwd.username,
        email: pwd.email,
        passwordLength: pwd.password?.length,
        keyLength: key?.length,
      });

      const decryptedPwd = decryptVaultItem(vaultItem, key);
      if (!decryptedPwd) {
        console.error(
          '[ModalItem] Decryption failed - password might be corrupted or key mismatch',
        );
        Alert.alert('Error', 'Failed to decrypt password. Please try again.');
        navigation.goBack();
        return;
      }

      // Set all fields - domain, username, email are already plain text
      setDomain(decryptedPwd.domain);
      setUsername(decryptedPwd.username);
      setEmail(decryptedPwd.email || '');
      // Password is decrypted from the vault item
      setPassword(decryptedPwd.password);
    }
  }, [pwd, key, navigation]);

  // Keyboard listeners
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSubmit = async () => {
    if (!domain || !username || !password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (!key) {
      Alert.alert('Error', 'Encryption key not found. Please login again.');
      return;
    }

    try {
      // Encrypt the password before sending to backend
      const decryptedItem = {
        id: pwd?._id || '',
        domain,
        username,
        email,
        password,
      };

      console.log('[ModalItem] Starting encryption...');

      let encryptedItem;
      try {
        encryptedItem = encryptVaultItem(decryptedItem, key);
      } catch (encryptError) {
        console.error('[ModalItem] Encryption failed:', encryptError);
        Alert.alert(
          'Error',
          `Encryption failed: ${
            encryptError instanceof Error
              ? encryptError.message
              : 'Unknown error'
          }`,
        );
        return;
      }

      console.log('[ModalItem] Submitting encrypted password:', {
        id: encryptedItem.id,
        domain: encryptedItem.domain,
        username: encryptedItem.username,
        encryptedPasswordLength: encryptedItem.password?.length,
        encryptedPasswordPreview: encryptedItem.password?.substring(0, 80),
        encryptedPasswordFull: encryptedItem.password,
        hasColon: encryptedItem.password?.includes(':'),
      });

      const data = {
        domain: encryptedItem.domain,
        username: encryptedItem.username,
        email,
        password: encryptedItem.password,
      };

      if (pwd) {
        await updatePassword(pwd._id, data);
      } else {
        await addPassword(data);
      }
      console.log('[ModalItem] Password submitted successfully');
      navigation.goBack();
    } catch (error) {
      console.error('[ModalItem] Error during submission:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to save password: ${errorMsg}`);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={{flex: 1}}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={40}>
          <View
            style={[
              styles.centered,
              {
                justifyContent: isKeyboardVisible ? 'flex-end' : 'center',
              },
            ]}>
            <View style={styles.card}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>
                  {pwd ? 'Update Password' : 'Add Password'}
                </Text>

                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Ionicons name="close" size={24} />
                </TouchableOpacity>
              </View>

              {/* Inputs */}
              <TextInput
                placeholder="Domain"
                style={styles.input}
                value={domain}
                onChangeText={setDomain}
              />

              <TextInput
                placeholder="Username"
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />

              <TextInput
                placeholder="Email (optional)"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Password */}
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  value={password}
                  secureTextEntry={!showPassword}
                  onChangeText={setPassword}
                />

                <TouchableOpacity
                  onPress={() => setShowPassword(prev => !prev)}>
                  <Ionicons
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={20}
                    color="#555"
                  />
                </TouchableOpacity>
              </View>

              {/* Button */}
              <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>{pwd ? 'Update' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  centered: {
    flex: 1,
    padding: 20,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 6,

    // 🔥 helps when keyboard opens
    marginBottom: 10,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  input: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
    backgroundColor: '#fafafa',
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 12,
  },

  button: {
    backgroundColor: '#000',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
