// app/(tabs)/list.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
    GroceryItem,
    saveGroceryList,
    subscribeToGroceryList,
} from '../src/services/groceryList';

type ListParams = {
  listId?: string;
  title?: string;
  mode?: string; // "new" for fresh list
};

export default function ListScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<ListParams>();

  const [currentListId, setCurrentListId] = useState<string | null>(null);
  const [listName, setListName] = useState('My grocery list');
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [nameInput, setNameInput] = useState('');
  const [qtyInput, setQtyInput] = useState('1');
  const [priceInput, setPriceInput] = useState('');
  const [saving, setSaving] = useState(false);

  // React to navigation parameters
  useEffect(() => {
    const listIdParam =
      typeof params.listId === 'string' ? params.listId : null;
    const titleParam =
      typeof params.title === 'string'
        ? params.title
        : 'My grocery list';

    if (listIdParam) {
      // Open existing list
      setCurrentListId(listIdParam);
      setListName(titleParam);
      // Items will be loaded via subscription below
    } else if (params.mode === 'new') {
      // Force brand-new list
      setCurrentListId(null);
      setItems([]);
      setListName(titleParam || 'New list');
    }
  }, [params]);

  // Subscribe to current list when editing an existing one
  useEffect(() => {
    if (!user || !currentListId) return;
    const unsub = subscribeToGroceryList(currentListId, (list) => {
      if (list) {
        setListName(list.title);
        setItems(list.items);
      }
    });
    return unsub;
  }, [user, currentListId]);

  const addItem = () => {
    if (!nameInput.trim()) return;
    const qty = parseInt(qtyInput, 10);
    const quantity = Number.isNaN(qty) || qty <= 0 ? 1 : qty;

    const price = parseFloat(priceInput.replace(',', '.'));
    const cleanPrice =
      Number.isNaN(price) || price < 0 ? undefined : price;

    const newItem: GroceryItem = {
      id: Date.now().toString(),
      name: nameInput.trim(),
      quantity,
      price: cleanPrice,
      done: false,
    };
    setItems((prev) => [newItem, ...prev]);
    setNameInput('');
    setQtyInput('1');
    setPriceInput('');
  };

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  };

  const clearChecked = () => {
    setItems((prev) => prev.filter((item) => !item.done));
  };

  const saveList = async () => {
    if (!user) {
      Alert.alert('Not logged in', 'Please log in to save your list.');
      return;
    }
    try {
      setSaving(true);
      const id = await saveGroceryList(
        user.uid,
        currentListId, // null => create, value => update
        listName || 'My grocery list',
        items
      );
      if (!currentListId) {
        setCurrentListId(id); // remember new id after first save
      }
      Alert.alert('Saved', 'Your grocery list has been saved.');
    } catch (err: any) {
      console.error('Save error', err);
      Alert.alert('Error', err.message || 'Failed to save list.');
    } finally {
      setSaving(false);
    }
  };

  const totalCost = useMemo(
    () =>
      items.reduce((sum, item) => {
        const price = item.price ?? 0;
        return sum + price * item.quantity;
      }, 0),
    [items]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{listName}</Text>
      <Text style={styles.subtitle}>
        Add items, set quantity and price, tap to mark as done. Every save
        creates a list you can open again from the home screen.
      </Text>

      <TextInput
        style={styles.listNameInput}
        placeholder="List name (e.g. Payday groceries)"
        placeholderTextColor="#9ca3af"
        value={listName}
        onChangeText={setListName}
      />

      <View style={styles.inputRow}>
        <Ionicons name="add-circle-outline" size={22} color="#f97316" />
        <TextInput
          style={styles.inputName}
          placeholder="Item (e.g. Chicken breast)"
          placeholderTextColor="#9ca3af"
          value={nameInput}
          onChangeText={setNameInput}
          onSubmitEditing={addItem}
        />
        <TextInput
          style={styles.inputQty}
          placeholder="Qty"
          placeholderTextColor="#9ca3af"
          value={qtyInput}
          onChangeText={setQtyInput}
          keyboardType="number-pad"
        />
        <TextInput
          style={styles.inputPrice}
          placeholder="₱"
          placeholderTextColor="#9ca3af"
          value={priceInput}
          onChangeText={setPriceInput}
          keyboardType="decimal-pad"
        />
        <TouchableOpacity style={styles.addButton} onPress={addItem}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        style={{ marginTop: 16 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No items yet. Start by adding something above.
          </Text>
        }
        renderItem={({ item }) => {
          const lineTotal = (item.price ?? 0) * item.quantity;
          return (
            <TouchableOpacity
              style={[
                styles.itemRow,
                item.done && styles.itemRowDone,
              ]}
              onPress={() => toggleItem(item.id)}
            >
              <Ionicons
                name={item.done ? 'checkbox-outline' : 'square-outline'}
                size={20}
                color={item.done ? '#22c55e' : '#9ca3af'}
              />
              <View style={{ marginLeft: 8, flex: 1 }}>
                <Text
                  style={[
                    styles.itemLabel,
                    item.done && styles.itemLabelDone,
                  ]}
                >
                  {item.name}
                </Text>
                <Text style={styles.itemSub}>
                  Qty: {item.quantity}
                  {item.price != null
                    ? ` · ₱${item.price.toFixed(2)} each`
                    : ''}
                  {item.price != null && (
                    <Text>{` · Total ₱${lineTotal.toFixed(2)}`}</Text>
                  )}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.bottomRow}>
        <Text style={styles.totalText}>
          Estimated total: ₱{totalCost.toFixed(2)}
        </Text>

        <View style={{ flexDirection: 'row' }}>
          {items.some((i) => i.done) && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearChecked}
            >
              <Text style={styles.clearButtonText}>Clear checked</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveList}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save list'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
  subtitle: { fontSize: 13, color: '#9ca3af', marginTop: 2, marginBottom: 6 },
  listNameInput: {
    marginTop: 8,
    backgroundColor: '#020617',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#f9fafb',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
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
    width: 48,
    textAlign: 'center',
    color: '#f9fafb',
    fontSize: 14,
    borderLeftWidth: 1,
    borderLeftColor: '#1f2937',
    marginRight: 8,
    paddingLeft: 6,
  },
  inputPrice: {
    width: 60,
    textAlign: 'center',
    color: '#f9fafb',
    fontSize: 14,
    borderLeftWidth: 1,
    borderLeftColor: '#1f2937',
    marginRight: 8,
    paddingLeft: 6,
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
  itemRowDone: { backgroundColor: '#022c22', borderColor: '#16a34a' },
  itemLabel: { color: '#e5e7eb', fontSize: 14 },
  itemLabelDone: {
    textDecorationLine: 'line-through',
    color: '#a7f3d0',
  },
  itemSub: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  totalText: { color: '#f9fafb', fontWeight: '600', fontSize: 14 },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#f97316',
    marginRight: 8,
  },
  clearButtonText: { color: '#f97316', fontWeight: '600', fontSize: 13 },
  saveButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#f97316',
  },
  saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
