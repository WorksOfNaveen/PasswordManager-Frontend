import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './Types/types.ts';
import LogIn from './AuthScreens/LogIn.tsx';
import {AuthStore} from './Store/store';
import {KeychainManager} from './Store/KeyChainStorage.js';
import apiClient from './API/AuthApi.js';
import {ActivityIndicator, Alert, StyleSheet, View} from 'react-native';
import ListScreen from './Screens/ListScreen.tsx';
import ModalItem from './Components/modalItem.tsx';
// 1. Move this outside the component to prevent unnecessary re-renders
const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  const isLogged = AuthStore(state => state.isLogged);
  const setLogged = AuthStore(state => state.setLogged);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {accessToken, refreshToken} = await KeychainManager.getTokens();
        // console.log(accessToken + '     ' + refreshToken);
        if (!accessToken || !refreshToken) {
          setLogged(false);
          return;
        }

        await apiClient('/auth/me');
        console.log('checkAuth running');
        Alert.alert('me api', 'Me api ran');
        setLogged(true);
      } catch (error) {
        setLogged(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return (
    // 2. NavigationContainer must wrap your entire navigation tree
    <NavigationContainer>
      <Stack.Navigator>
        {isLogged ? (
          <>
            <Stack.Screen name="ListScreen" component={ListScreen} />
            <Stack.Screen name="modalItem" component={ModalItem} />
          </>
        ) : (
          <Stack.Screen name="LogIn" component={LogIn} />
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
  },
});
