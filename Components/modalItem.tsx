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

type Props = NativeStackScreenProps<RootStackParamList, 'modalItem'>;

export default function ModalItem({route, navigation}: Props) {
  const pwd = route.params?.data;

  const [domain, setDomain] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const {addPassword, updatePassword} = usePasswordStore();

  // Populate data if editing
  useEffect(() => {
    if (pwd) {
      setDomain(pwd.domain);
      setUsername(pwd.username);
      setEmail(pwd.email);
      setPassword(pwd.password);
    }
  }, [pwd]);

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

    const data = {domain, username, email, password};

    if (pwd) {
      await updatePassword(pwd._id, data);
    } else {
      await addPassword(data);
    }

    navigation.goBack();
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
