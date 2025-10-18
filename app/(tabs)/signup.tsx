
import { ThemedText } from "@/components/ThemedText";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { signUpUser } from "../../firebase/auth";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill out all fields.");
      return;
    }
    setLoading(true);
    try {
      await signUpUser(email.trim(), password);
      setEmail("");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText type="title">Project 2 Sign Up</ThemedText>

      <View style={{ marginTop: 16 }}>
        <Text style={styles.userh1}>Email:</Text>
        <TextInput
          onChangeText={setEmail}
          value={email}
          style={styles.input}
          placeholder="Enter Email"
          placeholderTextColor="#9aa0a6"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.userh1}>Password:</Text>
        <TextInput
          onChangeText={setPassword}
          value={password}
          style={styles.input}
          secureTextEntry
          placeholder="Enter Password"
          placeholderTextColor="#9aa0a6"
        />
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleSignup} disabled={loading}>
        <Text style={styles.btnText}>{loading ? "Signing Up..." : "Sign Up"}</Text>
      </TouchableOpacity>

      <Text style={{ color: "#ccc", marginTop: 16 }}>
        Already have an account? Go to the Login screen.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#1a1a1a", justifyContent: "center" },
  input: {
    height: 44,
    width: "100%",
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    color: "#222",
    marginTop: 10,
    marginBottom: 15,
    borderRadius: 10,
  },
  btnText: { color: "white", fontWeight: "bold", fontSize: 16 },
  btn: {
    backgroundColor: "#000AFF",
    width: 150,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  userh1: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
});
