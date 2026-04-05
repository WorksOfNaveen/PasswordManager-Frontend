import React, {useEffect} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../Types/types';
import {usePasswordStore} from '../Store/store';
// import Ionicons from '@react-native-vector-icons/Ionicons';
import {Ionicons} from '@react-native-vector-icons/ionicons';

type Props = NativeStackScreenProps<RootStackParamList, 'ListScreen'>;

export default function ListScreen({navigation}: Props) {
  const {passwords, fetchPasswords, deletePassword} = usePasswordStore();

  useEffect(() => {
    fetchPasswords();
  }, [fetchPasswords]);

  return (
    <View style={styles.container}>
      {/* 🔥 Grid List */}
      <FlatList
        data={passwords}
        keyExtractor={item => item._id}
        numColumns={2}
        columnWrapperStyle={{justifyContent: 'space-between'}}
        contentContainerStyle={{paddingBottom: 100}}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('modalItem', {data: item})}>
            {/* 🔹 Domain */}
            <Text style={styles.domain}>{item.domain}</Text>

            {/* 🔹 Username */}
            <Text style={styles.username}>{item.username}</Text>

            {/* 🔹 Hidden Password */}
            <Text style={styles.password}>••••••••</Text>

            {/* 🔹 Delete Icon */}
            <TouchableOpacity
              style={styles.deleteIcon}
              onPress={() => deletePassword(item._id)}>
              <Ionicons name="trash" size={18} color="red" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      {/* 🔥 Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('modalItem')}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },

  card: {
    flex: 1,
    margin: 8,
    padding: 15,

    backgroundColor: '#fff',
    borderRadius: 12,

    elevation: 3,
    position: 'relative',
  },

  domain: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  username: {
    marginTop: 5,
    color: 'gray',
  },

  password: {
    marginTop: 5,
    letterSpacing: 2,
    color: '#555',
  },

  deleteIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },

  fab: {
    position: 'absolute',
    bottom: 25,
    right: 20,

    width: 60,
    height: 60,
    borderRadius: 30,

    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',

    elevation: 8,
  },
});
