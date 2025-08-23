import { ThemedText } from "@/components/ThemedText";
import { initializeApp } from 'firebase/app';
import { Auth, createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";


const firebaseConfig = {
  apiKey: "AIzaSyDEBLCyaq1sGJEcQP9fN-sCHyB3k6eoz1s",
  authDomain: "its411-getida.firebaseapp.com",
  projectId: "its411-getida",
  storageBucket: "its411-getida.appspot.com", 
  messagingSenderId: "1077910377593",
  appId: "1:1077910377593:android:0944e9110f16ebb30970a8"
};


const app = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [loading, setLoading] = useState(false);

  const signUp = async () => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert("Success", "Account created successfully!");
      console.log('User created:', userCredential.user);
    } catch (error: any) {
      Alert.alert("Error", "Registration failed: " + error.message);
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  }

  const signIn = () => {

  }

  return (
    <View style={styles.container}>
      <ThemedText type="title">Project 2 Sign Up</ThemedText>
      <View>
        <Text style={styles.userh1}>Email:</Text>
        <TextInput
          onChangeText={setEmail}
          value={email} 
          style={styles.input}
          placeholder="Enter Email"
          placeholderTextColor="#ccc"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.userh1}>Password:</Text>
        <TextInput
          onChangeText={setPassword}
          value={password} 
          style={styles.input}
          secureTextEntry={true}
          placeholder="Enter Password"
          placeholderTextColor="#ccc"
        />
      </View>
      <TouchableOpacity 
        style={styles.btn} 
        onPress={signUp}
        disabled={loading}
      >
        <Text style={styles.btnText}>
          {loading ? "Signing Up..." : "Sign Up"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  input: {
    height: 40,
    width: 220,
    padding: 5,
    backgroundColor: "#FFFFFF",
    color: "#89898F",
    marginTop: 20,
    borderRadius: 10,
  },
  btnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  btn: {
    backgroundColor: "#000AFF",
    width: 130,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  userh1: {
    color: "#FFFFFF",
    fontSize: 28,
  }
});