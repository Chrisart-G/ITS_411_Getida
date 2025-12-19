import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams } from 'expo-router'
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../src/context/AuthContext'
import {
  InventoryCategory,
  InventoryItem,
  saveUserInventory,
  subscribeToUserInventory,
  uploadInventoryItemImage,
} from '../src/services/inventory'
const CATEGORIES: InventoryCategory[] = [
  'Dairy',
  'Meat',
  'Fruits',
  'Vegetables',
  'Drinks',
  'Snacks',
]

type CategoryFilter = 'All' | InventoryCategory

export default function InventoryScreen() {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ category?: string }>()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [nameInput, setNameInput] = useState('')
  const [qtyInput, setQtyInput] = useState('1')
  const [categoryInput, setCategoryInput] = useState<InventoryCategory>('Snacks')
  const [imageInput, setImageInput] = useState<string | null>(null)

  const [filterCategory, setFilterCategory] = useState<CategoryFilter>('All')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editQty, setEditQty] = useState('1')
  const [editCategory, setEditCategory] = useState<InventoryCategory>('Snacks')
  const [editImage, setEditImage] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeToUserInventory(user.uid, setItems)
    return unsub
  }, [user])
useEffect(() => {
  const c = typeof params.category === 'string' ? params.category : null
  if (!c) return
  if (c === 'All') {
    setFilterCategory('All')
    return
  }
  if ((CATEGORIES as any).includes(c)) {
    setFilterCategory(c as any)
    setCategoryInput(c as any)
  }
}, [params.category])

  const resetAddForm = () => {
    setNameInput('')
    setQtyInput('1')
    setCategoryInput(filterCategory === 'All' ? 'Snacks' : filterCategory)
    setImageInput(null)
  }

  const pickImage = async (): Promise<{
    localUri: string
    base64: string
    mimeType?: string | null
  } | null> => {
    let ImagePicker: any
    try {
      ImagePicker = await import('expo-image-picker')
    } catch {
      Alert.alert(
        'Image Picker missing',
        'Install expo-image-picker and rebuild your development build.'
      )
      return null
    }

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to add an image.')
      return null
    }

    const mediaTypes =
      (ImagePicker as any).MediaType?.Images ??
      (ImagePicker as any).MediaTypeOptions?.Images

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      quality: 0.35,
      base64: true,
    })

    if (result.canceled) return null

    const asset = result.assets?.[0]
    const localUri = asset?.uri
    const base64 = asset?.base64
    const mimeType = asset?.mimeType ?? null

    if (!localUri || !base64) {
      Alert.alert('Error', 'Failed to read image. Please pick a different image.')
      return null
    }

    return { localUri, base64, mimeType }
  }

  const addPhotoToAddForm = async () => {
    if (!user?.uid) {
      Alert.alert('Not logged in', 'Please log in first.')
      return
    }

    const picked = await pickImage()
    if (!picked) return

    try {
      setUploading(true)
      const { downloadURL } = await uploadInventoryItemImage({
        userId: user.uid,
        localUri: picked.localUri,
        base64: picked.base64,
        mimeType: picked.mimeType,
      })
      setImageInput(downloadURL)
    } catch (e: any) {
      console.error('Inventory image upload error', e)
      Alert.alert('Error', e?.message || 'Failed to add image.')
    } finally {
      setUploading(false)
    }
  }

  const addItem = () => {
    if (!nameInput.trim()) return
    const q = parseInt(qtyInput, 10)
    const quantity = Number.isNaN(q) || q < 0 ? 0 : q

    const newItem: InventoryItem = {
      id: Date.now().toString(),
      name: nameInput.trim(),
      quantity,
      category: categoryInput,
      imageUrl: imageInput ?? null,
      imagePath: null,
    }

    setItems((prev) => [newItem, ...prev])
    resetAddForm()
  }

  const onDeleteItem = (id: string) => {
    Alert.alert('Remove item', 'Remove this from inventory?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setItems((prev) => prev.filter((it) => it.id !== id))
          if (editId === id) closeEdit()
        },
      },
    ])
  }

  const openEdit = (it: InventoryItem) => {
    setEditId(it.id)
    setEditName(it.name ?? '')
    setEditQty(String(it.quantity ?? 0))
    setEditCategory(it.category ?? 'Snacks')
    setEditImage(it.imageUrl ?? null)
    setEditOpen(true)
  }

  const closeEdit = () => {
    setEditOpen(false)
    setEditId(null)
    setEditName('')
    setEditQty('1')
    setEditCategory('Snacks')
    setEditImage(null)
  }

  const changeEditPhoto = async () => {
    if (!user?.uid) {
      Alert.alert('Not logged in', 'Please log in first.')
      return
    }
    const picked = await pickImage()
    if (!picked) return

    try {
      setUploading(true)
      const { downloadURL } = await uploadInventoryItemImage({
        userId: user.uid,
        localUri: picked.localUri,
        base64: picked.base64,
        mimeType: picked.mimeType,
      })
      setEditImage(downloadURL)
    } catch (e: any) {
      console.error('Inventory edit image error', e)
      Alert.alert('Error', e?.message || 'Failed to change image.')
    } finally {
      setUploading(false)
    }
  }

  const applyEdit = () => {
    if (!editId) return
    const name = editName.trim()
    if (!name) {
      Alert.alert('Invalid', 'Item name cannot be empty.')
      return
    }
    const q = parseInt(editQty, 10)
    const quantity = Number.isNaN(q) || q < 0 ? 0 : q

    const updated = items.map((it) =>
      it.id === editId
        ? {
            ...it,
            name,
            quantity,
            category: editCategory,
            imageUrl: editImage ?? null,
            imagePath: null,
          }
        : it
    )

    setItems(updated)
    closeEdit()
  }

  const onSelectFilter = (c: CategoryFilter) => {
    setFilterCategory(c)
    if (c !== 'All') setCategoryInput(c)
  }

  const saveInventory = async () => {
    if (!user) {
      Alert.alert('Not logged in', 'Please log in to save inventory.')
      return
    }
    try {
      setSaving(true)
      await saveUserInventory(user.uid, items)
      Alert.alert('Saved', 'Your inventory has been saved.')
    } catch (err: any) {
      console.error('Inventory save error', err)
      Alert.alert('Error', err.message || 'Failed to save inventory.')
    } finally {
      setSaving(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    let base = items
    if (filterCategory !== 'All') {
      base = base.filter((it) => it.category === filterCategory)
    }

    if (!q) return base
    return base.filter((it) => {
      const n = (it.name || '').toLowerCase()
      const c = (it.category || '').toLowerCase()
      return n.includes(q) || c.includes(q)
    })
  }, [items, search, filterCategory])

  const saveBottom = insets.bottom + 10

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.container}>
        <Text style={styles.title}>Home inventory</Text>
        <Text style={styles.subtitle}>
          Keep a simple record of what you already have at home so you don’t buy duplicates.
        </Text>

        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or category..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.searchClear}>
              <Ionicons name="close" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.categoriesRow}>
          <TouchableOpacity
            style={[styles.chip, filterCategory === 'All' && styles.chipActive]}
            onPress={() => onSelectFilter('All')}
          >
            <Text style={[styles.chipText, filterCategory === 'All' && styles.chipTextActive]}>
              All
            </Text>
          </TouchableOpacity>

          {CATEGORIES.map((c) => {
            const active = filterCategory === c
            return (
              <TouchableOpacity
                key={c}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => onSelectFilter(c)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

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
          <TouchableOpacity
            style={[styles.photoSmallBtn, uploading && { opacity: 0.7 }]}
            onPress={addPhotoToAddForm}
            disabled={uploading}
          >
            <Ionicons name="image-outline" size={16} color="#f97316" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={addItem}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {imageInput ? (
          <View style={styles.previewRow}>
            <Image source={{ uri: imageInput }} style={styles.previewImg} />
            <TouchableOpacity onPress={() => setImageInput(null)} style={styles.previewRemove}>
              <Ionicons name="close" size={16} color="#e5e7eb" />
            </TouchableOpacity>
            <Text style={styles.previewText}>Image added</Text>
          </View>
        ) : null}

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          style={{ marginTop: 16 }}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No inventory found. Try “All” or clear search.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
                ) : (
                  <View style={styles.thumbPlaceholder}>
                    <Ionicons name="image-outline" size={16} color="#9ca3af" />
                  </View>
                )}

                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSub}>
                    {item.category} · Qty: {item.quantity}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(item)}>
                <Ionicons name="create-outline" size={18} color="#93c5fd" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconBtnDanger}
                onPress={() => onDeleteItem(item.id)}
              >
                <Ionicons name="trash-outline" size={18} color="#fb7185" />
              </TouchableOpacity>
            </View>
          )}
        />

        <View style={[styles.saveWrap, { paddingBottom: saveBottom }]}>
          <TouchableOpacity style={styles.saveButton} onPress={saveInventory} disabled={saving}>
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save inventory'}
            </Text>
          </TouchableOpacity>
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

              <View style={styles.modalImageRow}>
                {editImage ? (
                  <Image source={{ uri: editImage }} style={styles.modalImg} />
                ) : (
                  <View style={styles.modalImgPlaceholder}>
                    <Ionicons name="image-outline" size={18} color="#9ca3af" />
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <TouchableOpacity
                    style={[styles.modalImageBtn, uploading && { opacity: 0.7 }]}
                    onPress={changeEditPhoto}
                    disabled={uploading}
                  >
                    <Ionicons name="camera-outline" size={16} color="#f97316" />
                    <Text style={styles.modalImageBtnText}>
                      {uploading ? 'Working...' : 'Change photo'}
                    </Text>
                  </TouchableOpacity>

                  {!!editImage && (
                    <TouchableOpacity
                      style={styles.modalRemovePhoto}
                      onPress={() => setEditImage(null)}
                    >
                      <Text style={styles.modalRemovePhotoText}>Remove photo</Text>
                    </TouchableOpacity>
                  )}
                </View>
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
                    placeholder="0"
                    placeholderTextColor="#9ca3af"
                    value={editQty}
                    onChangeText={setEditQty}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.modalLabel}>Category</Text>
                  <View style={styles.modalCategoryWrap}>
                    {CATEGORIES.map((c) => {
                      const active = editCategory === c
                      return (
                        <TouchableOpacity
                          key={c}
                          style={[styles.modalChip, active && styles.modalChipActive]}
                          onPress={() => setEditCategory(c)}
                        >
                          <Text
                            style={[
                              styles.modalChipText,
                              active && styles.modalChipTextActive,
                            ]}
                          >
                            {c}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  title: { fontSize: 22, fontWeight: '700', color: '#f9fafb' },
  subtitle: { fontSize: 13, color: '#9ca3af', marginTop: 2 },

  searchRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  searchInput: { flex: 1, marginLeft: 8, color: '#f9fafb', fontSize: 14 },
  searchClear: { padding: 6, borderRadius: 999 },

  categoriesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#020617',
  },
  chipActive: { borderColor: '#f97316' },
  chipText: { color: '#9ca3af', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#f97316' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#020617',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  inputName: { flex: 1, marginLeft: 6, marginRight: 8, color: '#f9fafb', fontSize: 14 },
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
  photoSmallBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#0b1220',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  addButton: { backgroundColor: '#f97316', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  previewRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewImg: { width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#1f2937' },
  previewRemove: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b1220',
  },
  previewText: { color: '#9ca3af', fontSize: 12 },

  emptyText: { marginTop: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 },

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
  thumb: { width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#1f2937' },
  thumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#0b1220',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: { color: '#e5e7eb', fontSize: 14, fontWeight: '700' },
  itemSub: { fontSize: 11, color: '#9ca3af', marginTop: 2 },

  iconBtn: {
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
  iconBtnDanger: {
    marginLeft: 10,
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#7f1d1d',
    backgroundColor: '#0b1220',
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingTop: 10,
  },
  saveButton: {
    paddingHorizontal: 20,
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
    backgroundColor: '#020617',
  },

  modalImageRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  modalImg: { width: 54, height: 54, borderRadius: 12, borderWidth: 1, borderColor: '#1f2937' },
  modalImgPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImageBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#020617',
  },
  modalImageBtnText: { color: '#f97316', fontWeight: '700', fontSize: 12 },
  modalRemovePhoto: { marginTop: 8, alignSelf: 'flex-start' },
  modalRemovePhotoText: { color: '#9ca3af', fontSize: 12, textDecorationLine: 'underline' },

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

  modalCategoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modalChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#020617',
  },
  modalChipActive: { borderColor: '#f97316' },
  modalChipText: { color: '#9ca3af', fontSize: 12, fontWeight: '700' },
  modalChipTextActive: { color: '#f97316' },

  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 },
  modalCancel: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#020617',
  },
  modalCancelText: { color: '#e5e7eb', fontWeight: '700' },
  modalSave: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: '#f97316' },
  modalSaveText: { color: '#fff', fontWeight: '800' },
})
