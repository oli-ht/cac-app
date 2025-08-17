import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TextInput, TouchableOpacity } from 'react-native';
import { auth } from '../config/firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';


const AuthScreen = ({ navigation }: { navigation: any }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async () => {
    try {
      setIsLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (user) {
        const token = await user.getIdToken();
        console.log('Got token:', token);
        try {
          await AsyncStorage.setItem('@user_token', token);
          console.log('Token stored successfully');
          navigation.replace('Onboarding');
        } catch (storageError: any) {
          console.error('Storage Error:', storageError);
          Alert.alert('Error', 'Failed to save authentication token');
        }
      }
    } catch (error: any) {
      console.log('Auth Error:', error);
      Alert.alert('Sign in failed', error.message);
    } finally {
      setIsLoading(false);
    }
  }

  const signUp = async () => {
    try {
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (user) {
        const token = await user.getIdToken();
        console.log('Got token:', token);
        try {
          await AsyncStorage.setItem('@user_token', token);
          console.log('Token stored successfully');
          navigation.replace('Onboarding');
        } catch (storageError: any) {
          console.error('Storage Error:', storageError);
          Alert.alert('Error', 'Failed to save authentication token');
        }
      }
    } catch (error: any) {
      console.log('Auth Error:', error);
      Alert.alert('Sign up failed', error.message);
    } finally {
      setIsLoading(false);
    }
  }
 
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Login</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <TouchableOpacity style={styles.button} onPress={signIn}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={signUp}>
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  input: {
    marginTop: 15,
    padding: 10,
    width: '80%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
  },
  button: {
    width: '80%',
    height: 40,
    backgroundColor: 'blue',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: 'white',
  },
});

export default AuthScreen;
