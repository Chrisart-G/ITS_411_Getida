
import { ThemedText } from "@/components/ThemedText";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
import { useUser } from "../../providers/UserProvider";

import { logoutUser } from "../../firebase/auth";
import {
  addTodoItem,
  deleteTodoItem,
  subscribeUserItems,
  TodoItem,
} from "../../firebase/todo";

export default function TodoScreen() {
  const router = useRouter();
  const { user, loading } = useUser();

  const [items, setItems] = useState<TodoItem[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemTags, setItemTags] = useState("");

  const uid = useMemo(() => user?.uid ?? undefined, [user?.uid]);

  useEffect(() => {
    if (loading) return; 
    if (!uid) { router.replace("/login"); return;
    }
    const unsub = subscribeUserItems(uid, setItems);
    return () => unsub();
  }, [uid, loading, router]);

  const handleAddItem = async () => {
    if (!uid) return Alert.alert("Error", "You must be logged in.");
    if (!itemName.trim()) return Alert.alert("Error", "Enter item name.");

    const tags = itemTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await addTodoItem(uid, itemName.trim(), tags);
      setItemName("");
      setItemTags("");
      setShowAddItem(false);
    } catch {}
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.replace("/login");
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <ThemedText type="title">My Todos</ThemedText>
          {/* email from Context */}
          {!!user?.email && <Text style={styles.userEmail}>{user.email}</Text>}
        </View>

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
        <Text style={styles.sectionTitle}>Items ({items.length})</Text>

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
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20, justifyContent: "space-between" },
  userEmail: { color: "#ccc", fontSize: 14, marginTop: 4 },
  logoutBtn: {
    backgroundColor: "#ff4444",
    paddingHorizontal: 16,
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
    color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 15, textAlign: "center",
  },
  label: { color: "#fff", fontSize: 16, marginBottom: 5 },
  itemsSection: { marginTop: 20 },
  sectionTitle: { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  noItemsText: { color: "#ccc", fontSize: 16, textAlign: "center", fontStyle: "italic" },
  itemContainer: { backgroundColor: "#2a2a2a", padding: 15, borderRadius: 10, marginBottom: 10 },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  itemName: { color: "#fff", fontSize: 18, fontWeight: "bold", flex: 1 },
  removeBtn: { backgroundColor: "#ff4444", width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  removeBtnText: { color: "white", fontSize: 18, fontWeight: "bold" },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  tag: { backgroundColor: "#007bff", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, marginRight: 8, marginBottom: 5 },
  tagText: { color: "white", fontSize: 12, fontWeight: "bold" },
  dateText: { color: "#999", fontSize: 12, fontStyle: "italic" },
  input: {
    height: 44, width: "100%", paddingHorizontal: 12, backgroundColor: "#fff", color: "#222",
    marginTop: 10, marginBottom: 15, borderRadius: 10,
  },
  btn: {
    backgroundColor: "#000AFF", paddingHorizontal: 20, height: 44, borderRadius: 10,
    alignItems: "center", justifyContent: "center", marginTop: 10,
  },
  btnText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
