import React, {useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Ionicons} from '@react-native-vector-icons/ionicons';
import {RootStackParamList} from '../Types/types';
import {usePasswordStore, AuthStore} from '../Store/store';

type Props = NativeStackScreenProps<RootStackParamList, 'ListScreen'>;

const THEME = {
  bg: '#111113',
  surface: '#1c1c1f',
  surfaceMuted: '#17171a',
  border: '#2a2a2f',
  text: '#f5f5f7',
  textMuted: '#a1a1aa',
  accent: '#0a84ff',
  danger: '#ff453a',
};

const LogoutHeaderButton = ({onPress}: {onPress: () => void}) => (
  <TouchableOpacity style={styles.logoutButton} onPress={onPress}>
    <Ionicons name="log-out-outline" size={16} color={THEME.text} />
    <Text style={styles.logoutText}>Logout</Text>
  </TouchableOpacity>
);

export default function ListScreen({navigation}: Props) {
  const {passwords, fetchPasswords, deletePassword, clearPasswords} =
    usePasswordStore();
  const logout = AuthStore(state => state.logout);

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', onPress: () => {}, style: 'cancel'},
      {
        text: 'Logout',
        onPress: async () => {
          try {
            clearPasswords();
            await logout();
            navigation.reset({
              index: 0,
              routes: [{name: 'LogIn'}],
            });
          } catch (error) {
            Alert.alert('Error', 'Failed to logout properly');
          }
        },
      },
    ]);
  }, [logout, clearPasswords, navigation]);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
      contentStyle: {backgroundColor: THEME.bg},
    });
    fetchPasswords();
  }, [navigation, fetchPasswords]);

  const renderCard = ({item}: {item: (typeof passwords)[number]}) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('modalItem', {data: item})}>
      <View style={styles.cardTop}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>
            {(item.domain?.[0] || '?').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.domain} numberOfLines={1}>
          {item.domain}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="person-outline" size={14} color={THEME.textMuted} />
        <Text style={styles.username} numberOfLines={1}>
          {item.username}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Ionicons
          name="lock-closed-outline"
          size={14}
          color={THEME.textMuted}
        />
        <Text style={styles.password}>••••••••••••</Text>
      </View>

      <TouchableOpacity
        style={styles.deleteIcon}
        onPress={() => deletePassword(item._id)}>
        <Ionicons name="trash-outline" size={15} color={THEME.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={THEME.bg}
        translucent={false}
      />
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.title}>My Passwords</Text>
          <LogoutHeaderButton onPress={handleLogout} />
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={THEME.textMuted} />
          <Text style={styles.searchText}>Search passwords...</Text>
          <Ionicons name="options-outline" size={18} color={THEME.textMuted} />
        </View>

        <FlatList
          data={passwords}
          keyExtractor={item => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No passwords saved yet</Text>
              <Text style={styles.emptySub}>
                Tap the plus button to create your first entry.
              </Text>
            </View>
          }
          renderItem={renderCard}
          showsVerticalScrollIndicator={false}
        />

        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('modalItem')}>
          <Ionicons name="add" size={28} color={THEME.text} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    color: THEME.text,
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  logoutButton: {
    height: 40,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoutText: {
    color: THEME.text,
    fontSize: 13,
    fontWeight: '600',
  },
  searchWrap: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.surfaceMuted,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  searchText: {
    flex: 1,
    color: THEME.textMuted,
    marginLeft: 8,
    fontSize: 15,
  },
  listContent: {
    paddingBottom: 96,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    width: '48.5%',
    minHeight: 176,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.surface,
    padding: 12,
    position: 'relative',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingRight: 24,
  },
  logoPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2f',
    marginRight: 8,
  },
  logoText: {
    color: THEME.text,
    fontSize: 13,
    fontWeight: '700',
  },
  domain: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  username: {
    color: THEME.textMuted,
    marginLeft: 7,
    fontSize: 14,
    flex: 1,
  },
  password: {
    color: THEME.text,
    marginLeft: 7,
    fontSize: 14,
    letterSpacing: 2.1,
  },
  deleteIcon: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#232328',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  emptyCard: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.surface,
    padding: 18,
  },
  emptyTitle: {
    color: THEME.text,
    fontWeight: '700',
    fontSize: 16,
  },
  emptySub: {
    color: THEME.textMuted,
    marginTop: 5,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 22,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.accent,
  },
});
