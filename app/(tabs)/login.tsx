
import { ThemedText } from "@/components/ThemedText";
import auth from "@react-native-firebase/auth";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  addTodoItem,
  deleteTodoItem,
  loginUser,
  logoutUser,
  subscribeUserItems,
} from "../../firebase/auth";

interface TodoItem {
  id: string;
  name: string;
  tags: string[];
  userId: string;
  createdAt?: Date;
}

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [user, setUser] = useState<null | { uid: string; email: string | null }>(
    null
  );
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState<TodoItem[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemTags, setItemTags] = useState("");

  useEffect(() => {
    let unsubItems: undefined | (() => void);

    const unsubAuth = auth().onAuthStateChanged((u) => {
      if (u) {
        setUser({ uid: u.uid, email: u.email });
        unsubItems = subscribeUserItems(u.uid, setItems);
      } else {
        setUser(null);
        setItems([]);
        if (unsubItems) {
          unsubItems();
          unsubItems = undefined;
        }
      }
    });

    return () => {
      unsubAuth();
      if (unsubItems) unsubItems();
    };
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
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setShowAddItem(false);
      setItems([]);
    } catch {}
  };

  const handleAddItem = async () => {
    if (!user) return Alert.alert("Error", "You must be logged in.");
    if (!itemName.trim()) return Alert.alert("Error", "Enter item name.");

    const tags = itemTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await addTodoItem(user.uid, itemName.trim(), tags);
      setItemName("");
      setItemTags("");
      setShowAddItem(false);
    } catch {}
  };

  const removeItem = (id: string) => {
    Alert.alert("Remove Item", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTodoItem(id);
          } catch {}
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: TodoItem }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{item.name}</Text>
        <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(item.id)}>
          <Text style={styles.removeBtnText}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tagsContainer}>
        {item.tags.map((tag, idx) => (
          <View key={`${item.id}-tag-${idx}`} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.dateText}>
        {item.createdAt
          ? `Added: ${item.createdAt.toLocaleDateString()}`
          : "Added: just now"}
      </Text>
    </View>
  );

  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ThemedText type="title">Project 2 Login</ThemedText>

        <View style={{ marginTop: 16 }}>
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

        <Text style={{ color: "#ccc", marginTop: 16 }}>
          Don’t have an account? Go to the Sign Up screen.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Welcome!</ThemedText>
        <Text style={styles.userEmail}>{user.email}</Text>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.btn, styles.addBtn]}
          onPress={() => setShowAddItem((s) => !s)}
        >
          <Text style={styles.btnText}>{showAddItem ? "Cancel" : "Add Item"}</Text>
        </TouchableOpacity>
      </View>

      {showAddItem && (
        <View style={styles.addItemForm}>
          <Text style={styles.formTitle}>Add New Item</Text>

          <Text style={styles.label}>Item Name:</Text>
          <TextInput
            value={itemName}
            onChangeText={setItemName}
            style={styles.input}
            placeholder="Enter item name"
            placeholderTextColor="#9aa0a6"
          />

          <Text style={styles.label}>Tags (comma separated):</Text>
          <TextInput
            value={itemTags}
            onChangeText={setItemTags}
            style={styles.input}
            placeholder="e.g., food, urgent, shopping"
            placeholderTextColor="#9aa0a6"
          />

          <TouchableOpacity style={styles.btn} onPress={handleAddItem}>
            <Text style={styles.btnText}>Add Item</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.itemsSection}>
        <Text style={styles.sectionTitle}>My Items ({items.length})</Text>

        {items.length === 0 ? (
          <Text style={styles.noItemsText}>No items yet. Add your first item!</Text>
        ) : (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(it) => it.id}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#1a1a1a" },
  header: { alignItems: "center", marginBottom: 20 },
  userEmail: { color: "#ccc", fontSize: 16, marginVertical: 10 },
  logoutBtn: {
    backgroundColor: "#ff4444",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  logoutBtnText: { color: "white", fontWeight: "bold" },
  actionButtons: { flexDirection: "row", justifyContent: "center", marginBottom: 20 },
  addBtn: { backgroundColor: "#28a745" },
  addItemForm: {
    backgroundColor: "#2a2a2a",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  formTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  label: { color: "#fff", fontSize: 16, marginBottom: 5 },
  itemsSection: { marginTop: 20 },
  sectionTitle: { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  noItemsText: { color: "#ccc", fontSize: 16, textAlign: "center", fontStyle: "italic" },
  itemContainer: { backgroundColor: "#2a2a2a", padding: 15, borderRadius: 10, marginBottom: 10 },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  itemName: { color: "#fff", fontSize: 18, fontWeight: "bold", flex: 1 },
  removeBtn: {
    backgroundColor: "#ff4444",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  removeBtnText: { color: "white", fontSize: 18, fontWeight: "bold" },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  tag: {
    backgroundColor: "#007bff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 5,
  },
  tagText: { color: "white", fontSize: 12, fontWeight: "bold" },
  dateText: { color: "#999", fontSize: 12, fontStyle: "italic" },
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
