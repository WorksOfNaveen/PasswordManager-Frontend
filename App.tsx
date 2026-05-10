import React, {useEffect, useState} from 'react';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './Types/types.ts';
import LogIn from './AuthScreens/LogIn.tsx';
import {AuthStore} from './Store/store';
import {KeychainManager} from './Store/KeyChainStorage.js';
import apiClient from './API/AuthApi.js';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import ListScreen from './Screens/ListScreen.tsx';
import ModalItem from './Components/modalItem.tsx';
import Registeration from './AuthScreens/Registeration.tsx';
import MasterPassword from './AuthScreens/MasterPassword.tsx';
// import BlurPlaygroundScreen from './Screens/BlurPlaygroundScreen.tsx';
// 1. Move this outside the component to prevent unnecessary re-renders
const Stack = createNativeStackNavigator<RootStackParamList>();
const BASE_BG = '#030B1A';
const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: BASE_BG,
  },
};

// Root app component
const App = () => {
  // Get auth state
  const isLogged = AuthStore(state => state.isLogged);
  const setLogged = AuthStore(state => state.setLogged);
  const setAuthData = AuthStore(state => state.setAuthData);
  const [loading, setLoading] = useState(true);
  const [showMasterPassword, setShowMasterPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Load stored tokens on startup
    const checkAuth = async () => {
      try {
        // console.log('[App] Checking authentication status...');
        const {accessToken, refreshToken} = await KeychainManager.getTokens();

        // If we have neither token, user is logged out.
        // Don't require *both* here: a missing access token can be refreshed using the refresh token.
        if (!accessToken && !refreshToken) {
          // console.log('[App] No tokens found - showing login screen');
          if (!cancelled) {
            setLogged(false);
            setShowMasterPassword(false);
          }
          return;
        }

        // Prefer cached auth data from Keychain (avoids depending on a backend endpoint on cold start)
        const cachedAuthData = await KeychainManager.getAuthData();
        if (!cancelled) {
          if (cachedAuthData?.salt && cachedAuthData?.verifyHash) {
            setAuthData(cachedAuthData);
          }

          // Auto-login UX: if tokens exist, route to Master Password screen.
          // Token validity + authData hydration happens in the background.
          setShowMasterPassword(true);
          setLogged(false); // Keep isLogged false until Master Password is verified
        }

        // Background validation/hydration (don’t block routing)
        (async () => {
          try {
            const meResponse = await apiClient.get('/auth/me');

            let authData = cachedAuthData;

            if (!authData) {
              try {
                const authDataResponse = await apiClient.get(
                  '/auth/me/authData',
                );
                if (
                  authDataResponse?.data &&
                  authDataResponse.data.salt &&
                  authDataResponse.data.verifyHash
                ) {
                  authData = {
                    salt: authDataResponse.data.salt,
                    verifyHash: authDataResponse.data.verifyHash,
                  };
                }
              } catch (authError: any) {
                // console.warn(
                //   '[App] Auth data endpoint failed:',
                //   authError?.response?.status,
                //   authError?.message,
                // );
              }
            }

            if (
              !authData &&
              meResponse?.data?.salt &&
              meResponse?.data?.verifyHash
            ) {
              authData = {
                salt: meResponse.data.salt,
                verifyHash: meResponse.data.verifyHash,
              };
            }

            if (authData?.salt && authData?.verifyHash) {
              await KeychainManager.saveAuthData(authData);
              if (!cancelled) {
                setAuthData(authData);
              }
            }
          } catch (e: any) {
            const status = e?.response?.status;
            // If backend definitively says unauthorized, clear tokens and show Login.
            if (status === 401 || status === 403) {
              await KeychainManager.clearAllTokens();
              if (!cancelled) {
                setLogged(false);
                setShowMasterPassword(false);
              }
            }
          }
        })();
      } catch (error) {
        // console.log('[App] Auth check failed:', error);
        if (!cancelled) {
          setLogged(false);
          setShowMasterPassword(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show loading indicator during startup
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#e8f3ff" />
      </View>
    );
  }

  // Render navigation stack
  return (
    <NavigationContainer theme={AppTheme}>
      <Stack.Navigator screenOptions={{contentStyle: {backgroundColor: BASE_BG}}}>
        {isLogged ? (
          // User is fully logged in with Master Password verified
          <>
            <Stack.Screen name="ListScreen" component={ListScreen} />
            <Stack.Screen name="modalItem" component={ModalItem} />
          </>
        ) : showMasterPassword ? (
          // Tokens are valid but Master Password not verified yet
          <Stack.Screen
            name="MasterPassword"
            component={MasterPassword}
            options={{headerShown: false}}
          />
        ) : (
          // No tokens - show auth screens
          <>
            <Stack.Screen
              name="LogIn"
              component={LogIn}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="Registeration"
              component={Registeration}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="MasterPassword"
              component={MasterPassword}
              options={{headerShown: false}}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BASE_BG,
  },
});
