// app/login.tsx
import { ThemedText } from "@/components/ThemedText";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { FBUser, loginUser, onAuthChanged } from "../../firebase/auth";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<FBUser | null>(null);

  useEffect(() => {
    const unsub = onAuthChanged((u) => setUser(u));
    return unsub;
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      await loginUser(email.trim(), password);
      setEmail("");
      setPassword("");
      router.push("/todo"); // go to the todo screen after login
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { justifyContent: "center" }]}>
      <ThemedText type="title">Project 2 Login</ThemedText>

      <View style={{ marginTop: 16, width: "100%" }}>
        <Text style={styles.userh1}>Email:</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholder="Enter Email"
          placeholderTextColor="#9aa0a6"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.userh1}>Password:</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
          placeholder="Enter Password"
          placeholderTextColor="#9aa0a6"
        />
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
        <Text style={styles.btnText}>{loading ? "Logging in..." : "Login"}</Text>
      </TouchableOpacity>

      {user ? (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: "#28a745" }]}
          onPress={() => router.push("/todo")}
        >
          <Text style={styles.btnText}>Go to Todos</Text>
        </TouchableOpacity>
      ) : (
        <Text style={{ color: "#ccc", marginTop: 16 }}>
          Don’t have an account? Go to the Sign Up screen.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#1a1a1a" },
  input: {
    height: 44,
    width: "100%",
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    color: "#222",
    marginTop: 10,
    marginBottom: 15,
    borderRadius: 10,
  },
  btn: {
    backgroundColor: "#000AFF",
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  btnText: { color: "white", fontWeight: "bold", fontSize: 16 },
  userh1: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
});
