// app/index.tsx  (Auth screen)
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const { login, signup } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password || (mode === 'signup' && !confirmPassword)) {
      return Alert.alert('Missing fields', 'Please fill all fields.');
    }
    if (mode === 'signup' && password !== confirmPassword) {
      return Alert.alert('Password mismatch', 'Passwords do not match.');
    }

    try {
      setBusy(true);
      if (mode === 'login') {
        await login(email, password);
        Alert.alert('Welcome', 'Login successful!');
      } else {
        await signup(email, password);
        Alert.alert('Success', 'Account created!');
      }
    } catch (err: any) {
      console.error('Auth error', err);
      Alert.alert('Error', err.message || 'Unexpected error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Grocery Mate</Text>
      <Text style={styles.subtitle}>
        {mode === 'login'
          ? 'Log in to manage your grocery list.'
          : 'Create an account to start tracking groceries.'}
      </Text>

      {/* Mode toggle */}
      <View style={styles.switchRow}>
        <TouchableOpacity
          style={[
            styles.switchButton,
            mode === 'login' && styles.switchButtonActive,
          ]}
          onPress={() => setMode('login')}
        >
          <Text
            style={[
              styles.switchText,
              mode === 'login' && styles.switchTextActive,
            ]}
          >
            Login
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.switchButton,
            mode === 'signup' && styles.switchButtonActive,
          ]}
          onPress={() => setMode('signup')}
        >
          <Text
            style={[
              styles.switchText,
              mode === 'signup' && styles.switchTextActive,
            ]}
          >
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#9CA3AF"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#9CA3AF"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {mode === 'signup' && (
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      )}

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleSubmit}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>
            {mode === 'login' ? 'Login' : 'Create Account'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', padding: 24 },
  title: { fontSize: 32, color: '#fff', fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#e5e7eb', marginBottom: 24 },
  switchRow: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 999,
    backgroundColor: '#020617',
    padding: 4,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
  },
  switchButtonActive: {
    backgroundColor: '#f97316',
  },
  switchText: {
    color: '#9ca3af',
    fontWeight: '600',
  },
  switchTextActive: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#020617',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#f97316',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
