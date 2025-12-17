// app/(tabs)/inventory.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import {
    InventoryItem,
    saveUserInventory,
    subscribeToUserInventory,
} from '../src/services/inventory';

export default function InventoryScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [nameInput, setNameInput] = useState('');
  const [qtyInput, setQtyInput] = useState('1');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUserInventory(user.uid, setItems);
    return unsub;
  }, [user]);

  const resetForm = () => {
    setNameInput('');
    setQtyInput('1');
    setEditingId(null);
  };

  const addOrUpdateItem = () => {
    if (!nameInput.trim()) return;
    const q = parseInt(qtyInput, 10);
    const quantity = Number.isNaN(q) || q < 0 ? 0 : q;

    if (editingId) {
      // update existing
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? { ...item, name: nameInput.trim(), quantity }
            : item
        )
      );
    } else {
      // add new
      const newItem: InventoryItem = {
        id: Date.now().toString(),
        name: nameInput.trim(),
        quantity,
      };
      setItems((prev) => [newItem, ...prev]);
    }

    resetForm();
  };

  const onEditItem = (item: InventoryItem) => {
    setEditingId(item.id);
    setNameInput(item.name);
    setQtyInput(String(item.quantity));
  };

  const onDeleteItem = (id: string) => {
    Alert.alert('Remove item', 'Remove this from inventory?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setItems((prev) => prev.filter((it) => it.id !== id));
          if (editingId === id) resetForm();
        },
      },
    ]);
  };

  const saveInventory = async () => {
    if (!user) {
      Alert.alert('Not logged in', 'Please log in to save inventory.');
      return;
    }
    try {
      setSaving(true);
      await saveUserInventory(user.uid, items);
      Alert.alert('Saved', 'Your inventory has been saved.');
    } catch (err: any) {
      console.error('Inventory save error', err);
      Alert.alert('Error', err.message || 'Failed to save inventory.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home inventory</Text>
      <Text style={styles.subtitle}>
        Keep a simple record of what you already have at home so you don’t buy
        duplicates at the store.
      </Text>

      <View style={styles.inputRow}>
        <Ionicons name="cube-outline" size={20} color="#f97316" />
        <TextInput
          style={styles.inputName}
          placeholder="Item (e.g. Rice)"
          placeholderTextColor="#9ca3af"
          value={nameInput}
          onChangeText={setNameInput}
        />
        <TextInput
          style={styles.inputQty}
          placeholder="Qty"
          placeholderTextColor="#9ca3af"
          value={qtyInput}
          onChangeText={setQtyInput}
          keyboardType="number-pad"
        />
        <TouchableOpacity style={styles.addButton} onPress={addOrUpdateItem}>
          <Text style={styles.addButtonText}>
            {editingId ? 'Update' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>

      {editingId && (
        <TouchableOpacity style={styles.cancelEdit} onPress={resetForm}>
          <Text style={styles.cancelEditText}>Cancel edit</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        style={{ marginTop: 16 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No inventory yet. Add items above to get started.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
              onPress={() => onEditItem(item)}
            >
              <Ionicons name="create-outline" size={18} color="#f97316" />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSub}>
                  Quantity: {item.quantity}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDeleteItem(item.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#f97316" />
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.saveButton}
        onPress={saveInventory}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Saving...' : 'Save inventory'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#f9fafb' },
  subtitle: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: '#020617',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  inputName: {
    flex: 1,
    marginLeft: 6,
    marginRight: 8,
    color: '#f9fafb',
    fontSize: 14,
  },
  inputQty: {
    width: 60,
    marginRight: 8,
    color: '#f9fafb',
    fontSize: 14,
    borderLeftWidth: 1,
    borderLeftColor: '#1f2937',
    paddingLeft: 6,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#f97316',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  cancelEdit: {
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  cancelEditText: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'underline',
  },
  emptyText: {
    marginTop: 24,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 13,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 8,
  },
  itemName: { color: '#e5e7eb', fontSize: 14, fontWeight: '600' },
  itemSub: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  deleteButton: {
    padding: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#f97316',
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 8,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#f97316',
  },
  saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
