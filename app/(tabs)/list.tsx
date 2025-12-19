import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useAuth } from '../src/context/AuthContext'
import {
  GroceryItem,
  deleteGroceryListAndImages,
  saveGroceryList,
  subscribeToGroceryList,
  uploadGroceryItemImage,
} from '../src/services/groceryList'

type ListParams = {
  listId?: string
  title?: string
  mode?: string
  nonce?: string
}

export default function ListScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useLocalSearchParams<ListParams>()

  const [currentListId, setCurrentListId] = useState<string | null>(null)
  const [listName, setListName] = useState('My grocery list')
  const [items, setItems] = useState<GroceryItem[]>([])
  const [nameInput, setNameInput] = useState('')
  const [qtyInput, setQtyInput] = useState('1')
  const [priceInput, setPriceInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editItemId, setEditItemId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editQty, setEditQty] = useState('1')
  const [editPrice, setEditPrice] = useState('')

  const listIdParam = typeof params.listId === 'string' ? params.listId : null
  const titleParam =
    typeof params.title === 'string' ? params.title : 'My grocery list'
  const modeParam = typeof params.mode === 'string' ? params.mode : undefined
  const nonceParam = typeof params.nonce === 'string' ? params.nonce : null

  useEffect(() => {
    if (modeParam === 'new') {
      setCurrentListId(null)
      setItems([])
      setListName(titleParam || 'New list')
      return
    }

    if (listIdParam) {
      setCurrentListId(listIdParam)
      setListName(titleParam)
    }
  }, [modeParam, listIdParam, titleParam, nonceParam])

  useEffect(() => {
    if (!user?.uid || !currentListId) return
    const unsub = subscribeToGroceryList(currentListId, (list) => {
      if (list) {
        setListName(list.title)
        setItems(list.items || [])
      }
    })
    return unsub
  }, [user?.uid, currentListId])

  const addItem = () => {
    if (!nameInput.trim()) return
    const qty = parseInt(qtyInput, 10)
    const quantity = Number.isNaN(qty) || qty <= 0 ? 1 : qty

    const price = parseFloat(priceInput.replace(',', '.'))
    const cleanPrice = Number.isNaN(price) || price < 0 ? undefined : price

    const newItem: GroceryItem = {
      id: Date.now().toString(),
      name: nameInput.trim(),
      quantity,
      price: cleanPrice,
      done: false,
      imageUrl: null,
      imagePath: null,
    }

    setItems((prev) => [newItem, ...prev])
    setNameInput('')
    setQtyInput('1')
    setPriceInput('')
  }

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, done: !it.done } : it))
    )
  }

  const clearChecked = () => setItems((prev) => prev.filter((it) => !it.done))

  const saveList = async () => {
    if (!user?.uid) {
      Alert.alert('Not logged in', 'Please log in to save your list.')
      return
    }
    try {
      setSaving(true)
      const id = await saveGroceryList(
        user.uid,
        currentListId,
        listName || 'My grocery list',
        items
      )
      if (!currentListId) setCurrentListId(id)
      Alert.alert('Saved', 'Your grocery list has been saved.')
    } catch (e: any) {
      console.error('Save error', e)
      Alert.alert('Error', e?.message || 'Failed to save list.')
    } finally {
      setSaving(false)
    }
  }

  const confirmDeleteThisList = () => {
    if (!currentListId) {
      Alert.alert('Nothing to delete', 'Save the list first.')
      return
    }
    Alert.alert('Delete list', `Delete "${listName}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGroceryListAndImages(currentListId)
            router.replace('/(tabs)/home')
          } catch (e: any) {
            console.error('Delete list error', e)
            Alert.alert('Error', e?.message || 'Failed to delete list.')
          }
        },
      },
    ])
  }

  const openEdit = (it: GroceryItem) => {
    setEditItemId(it.id)
    setEditName(it.name ?? '')
    setEditQty(String(it.quantity ?? 1))
    setEditPrice(it.price != null ? String(it.price) : '')
    setEditOpen(true)
  }

  const closeEdit = () => {
    setEditOpen(false)
    setEditItemId(null)
    setEditName('')
    setEditQty('1')
    setEditPrice('')
  }

  const applyEdit = async () => {
    if (!editItemId) return

    const name = editName.trim()
    if (!name) {
      Alert.alert('Invalid', 'Item name cannot be empty.')
      return
    }

    const qtyNum = parseInt(editQty, 10)
    const quantity = Number.isNaN(qtyNum) || qtyNum <= 0 ? 1 : qtyNum

    const priceNum = editPrice.trim() === '' ? undefined : parseFloat(editPrice.replace(',', '.'))
    const price =
      priceNum == null || Number.isNaN(priceNum) || priceNum < 0 ? undefined : priceNum

    const updated = items.map((it) =>
      it.id === editItemId ? { ...it, name, quantity, price } : it
    )

    setItems(updated)
    closeEdit()

    if (user?.uid && currentListId) {
      try {
        await saveGroceryList(user.uid, currentListId, listName || 'My grocery list', updated)
      } catch (e: any) {
        console.error('Edit save error', e)
        Alert.alert('Error', e?.message || 'Failed to save changes.')
      }
    }
  }

  const addPhotoToItem = async (itemId: string) => {
    if (!user?.uid) {
      Alert.alert('Not logged in', 'Please log in first.')
      return
    }
    if (!currentListId) {
      Alert.alert('Save first', 'Please save the list first so we can add photos.')
      return
    }

    let ImagePicker: any
    try {
      ImagePicker = await import('expo-image-picker')
    } catch {
      Alert.alert(
        'Image Picker missing',
        'Install expo-image-picker and rebuild your development build.'
      )
      return
    }

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to add an image.')
      return
    }

    const mediaTypes =
      (ImagePicker as any).MediaType?.Images ?? (ImagePicker as any).MediaTypeOptions?.Images

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      quality: 0.35,
      base64: true,
    })

    if (result.canceled) return

    const asset = result.assets?.[0]
    const localUri = asset?.uri
    const base64 = asset?.base64
    const mimeType = asset?.mimeType ?? null

    if (!localUri || !base64) {
      Alert.alert('Error', 'Failed to read image. Please pick a different image.')
      return
    }

    try {
      setUploadingItemId(itemId)

      const { downloadURL } = await uploadGroceryItemImage({
        userId: user.uid,
        listId: currentListId,
        itemId,
        localUri,
        base64,
        mimeType,
      })

      const updated = items.map((it) =>
        it.id === itemId ? { ...it, imageUrl: downloadURL, imagePath: null } : it
      )

      setItems(updated)
      await saveGroceryList(user.uid, currentListId, listName || 'My grocery list', updated)
    } catch (e: any) {
      console.error('Upload image error', e)
      Alert.alert('Error', e?.message || 'Failed to add image.')
    } finally {
      setUploadingItemId(null)
    }
  }

  const totalCost = useMemo(
    () =>
      items.reduce((sum, it) => {
        const p = it.price ?? 0
        return sum + p * it.quantity
      }, 0),
    [items]
  )

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{listName}</Text>
          <Text style={styles.subtitle}>
            Add items, set quantity and price, tap to mark as done.
          </Text>
        </View>

        {currentListId && (
          <TouchableOpacity style={styles.deleteBtn} onPress={confirmDeleteThisList}>
            <Ionicons name="trash-outline" size={18} color="#fb7185" />
          </TouchableOpacity>
        )}
      </View>

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
        keyExtractor={(it) => it.id}
        style={{ marginTop: 16 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No items yet. Start by adding something above.</Text>
        }
        renderItem={({ item }) => {
          const lineTotal = (item.price ?? 0) * item.quantity
          const isUploading = uploadingItemId === item.id

          return (
            <TouchableOpacity
              style={[styles.itemRow, item.done && styles.itemRowDone]}
              onPress={() => toggleItem(item.id)}
              activeOpacity={0.85}
            >
              <Ionicons
                name={item.done ? 'checkbox-outline' : 'square-outline'}
                size={20}
                color={item.done ? '#22c55e' : '#9ca3af'}
              />

              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <Ionicons name="image-outline" size={16} color="#9ca3af" />
                </View>
              )}

              <View style={{ marginLeft: 8, flex: 1 }}>
                <Text style={[styles.itemLabel, item.done && styles.itemLabelDone]}>
                  {item.name}
                </Text>
                <Text style={styles.itemSub}>
                  Qty: {item.quantity}
                  {item.price != null ? ` · ₱${item.price.toFixed(2)} each` : ''}
                  {item.price != null ? ` · Total ₱${lineTotal.toFixed(2)}` : ''}
                </Text>

                <TouchableOpacity
                  style={styles.photoBtn}
                  onPress={() => addPhotoToItem(item.id)}
                  disabled={isUploading}
                >
                  <Ionicons name="camera-outline" size={16} color="#f97316" />
                  <Text style={styles.photoBtnText}>
                    {isUploading ? 'Saving...' : 'Add photo'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.editBtn}
                onPress={(e) => {
                  e.stopPropagation()
                  openEdit(item)
                }}
              >
                <Ionicons name="create-outline" size={18} color="#93c5fd" />
              </TouchableOpacity>
            </TouchableOpacity>
          )
        }}
      />

      <View style={styles.bottomRow}>
        <Text style={styles.totalText}>Estimated total: ₱{totalCost.toFixed(2)}</Text>

        <View style={{ flexDirection: 'row' }}>
          {items.some((i) => i.done) && (
            <TouchableOpacity style={styles.clearButton} onPress={clearChecked}>
              <Text style={styles.clearButtonText}>Clear checked</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.saveButton} onPress={saveList} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save list'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={closeEdit}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit item</Text>
              <TouchableOpacity style={styles.modalClose} onPress={closeEdit}>
                <Ionicons name="close" size={18} color="#e5e7eb" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Item name"
              placeholderTextColor="#9ca3af"
              value={editName}
              onChangeText={setEditName}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Qty</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="1"
                  placeholderTextColor="#9ca3af"
                  value={editQty}
                  onChangeText={setEditQty}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Price</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Optional"
                  placeholderTextColor="#9ca3af"
                  value={editPrice}
                  onChangeText={setEditPrice}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={closeEdit}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={applyEdit}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', paddingHorizontal: 16, paddingTop: 16 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#0b1220',
    alignItems: 'center',
    justifyContent: 'center',
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
  inputName: { flex: 1, marginLeft: 6, marginRight: 8, color: '#f9fafb', fontSize: 14 },
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
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  emptyText: { marginTop: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  itemLabelDone: { textDecorationLine: 'line-through', color: '#a7f3d0' },
  itemSub: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  thumb: { width: 44, height: 44, borderRadius: 10, marginLeft: 10 },
  thumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#0b1220',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#0b1220',
  },
  photoBtnText: { color: '#f97316', fontWeight: '600', fontSize: 12 },
  editBtn: {
    marginLeft: 10,
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#0b1220',
    alignItems: 'center',
    justifyContent: 'center',
  },
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 14,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 14,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { color: '#f9fafb', fontSize: 16, fontWeight: '700' },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLabel: { color: '#9ca3af', fontSize: 12, marginTop: 12, marginBottom: 6 },
  modalInput: {
    backgroundColor: '#020617',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f9fafb',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  modalCancel: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#020617',
  },
  modalCancelText: { color: '#e5e7eb', fontWeight: '600' },
  modalSave: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#f97316',
  },
  modalSaveText: { color: '#fff', fontWeight: '700' },
})
