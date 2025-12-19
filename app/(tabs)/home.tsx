// app/(tabs)/home.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../src/context/AuthContext'
import {
  GroceryListDoc,
  deleteGroceryListAndImages,
  subscribeToUserGroceryLists,
} from '../src/services/groceryList'
import { InventoryItem, subscribeToUserInventory } from '../src/services/inventory'

const CATEGORIES = [
  { label: 'Dairy', icon: 'cow' as const },
  { label: 'Meat', icon: 'food-steak' as const },
  { label: 'Fruits', icon: 'fruit-cherries' as const },
  { label: 'Vegetables', icon: 'food-apple-outline' as const },
  { label: 'Drinks', icon: 'cup-outline' as const },
  { label: 'Snacks', icon: 'food-outline' as const },
]

const FEATURE_CARDS = [
  {
    title: 'Fast grocery checklist',
    description:
      'Create multiple lists, add items with quantity and price, tap to mark done, then clear checked items.',
  },
  {
    title: 'Home inventory by category',
    description:
      'Save home stock with categories, filter by category, and search by name so you avoid duplicates.',
  },
  {
    title: 'Photos for items',
    description:
      'Attach a photo to items so you remember the exact brand, size, or packaging while shopping.',
  },
]

function normalizeCategory(v: any): string {
  return String(v || '').trim().toLowerCase()
}

function isValidList(v: any): v is GroceryListDoc {
  return (
    v &&
    typeof v === 'object' &&
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    Array.isArray(v.items)
  )
}

export default function HomeScreen() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [savedLists, setSavedLists] = useState<GroceryListDoc[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])

  const uid = user?.uid ?? null

  useEffect(() => {
    if (!uid) {
      setSavedLists([])
      return
    }
    const unsub = subscribeToUserGroceryLists(uid, (lists) => {
      const safe = (Array.isArray(lists) ? lists : []).filter(isValidList)
      setSavedLists(safe)
    })
    return unsub
  }, [uid])

  useEffect(() => {
    if (!uid) {
      setInventoryItems([])
      return
    }
    const unsub = subscribeToUserInventory(uid, setInventoryItems)
    return unsub
  }, [uid])

  const safeSavedLists = useMemo(() => {
    return (Array.isArray(savedLists) ? savedLists : []).filter(isValidList)
  }, [savedLists])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of CATEGORIES) counts[c.label] = 0

    for (const it of inventoryItems) {
      const cat = normalizeCategory((it as any).category)
      const match = CATEGORIES.find((c) => normalizeCategory(c.label) === cat)
      if (match) counts[match.label] = (counts[match.label] || 0) + 1
    }
    return counts
  }, [inventoryItems])

  const handleLogout = () => {
    Alert.alert('Logout', 'Do you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout()
        },
      },
    ])
  }

  const goToNewList = () => {
    router.push({
      pathname: '/(tabs)/list',
      params: { mode: 'new', title: 'New list', nonce: Date.now().toString() },
    })
  }

  const openSavedList = (list: GroceryListDoc) => {
    router.push({
      pathname: '/(tabs)/list',
      params: { listId: list.id, title: list.title },
    })
  }

  const goToInventory = () => {
    router.push('/(tabs)/inventory')
  }

  const goToInventoryCategory = (category: string) => {
    router.push({
      pathname: '/(tabs)/inventory',
      params: { category },
    })
  }

  const confirmDeleteList = (list: GroceryListDoc) => {
    Alert.alert('Delete list', `Delete "${list.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGroceryListAndImages(list.id)
          } catch (e: any) {
            console.error('Delete list error', e)
            Alert.alert('Error', e?.message || 'Failed to delete list.')
          }
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.headerRow}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIconCircle}>
              <MaterialCommunityIcons name="basket-outline" size={22} color="#f97316" />
            </View>
            <View>
              <Text style={styles.logoTop}>QUICK</Text>
              <Text style={styles.logoBottom}>GROCERY</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.userChip}>
              <Ionicons
                name="person-circle-outline"
                size={20}
                color="#f97316"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.userChipText}>{user?.email?.split('@')[0] ?? 'User'}</Text>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#f97316" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.tagline}>
          Plan, shop, and track your groceries in one clean dashboard.
        </Text>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            placeholder="Search items or lists"
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
          />
        </View>

        <View style={styles.quickRow}>
          <QuickPill
            label="Checklist"
            description="Tap to tick off items"
            icon="checkmark-done-outline"
          />
          <QuickPill
            label="Inventory"
            description="Categories + search"
            icon="analytics-outline"
            onPress={goToInventory}
          />
          <QuickPill label="Photos" description="Attach item images" icon="image-outline" />
        </View>

        <View style={styles.section}>
          <ListButton label="Add new grocery list" icon="plus-circle-outline" onPress={goToNewList} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your saved lists ({safeSavedLists.length})</Text>

          {safeSavedLists.length === 0 ? (
            <Text style={styles.emptyText}>No saved lists yet. Create one above.</Text>
          ) : (
            safeSavedLists.map((list) => (
              <TouchableOpacity
                key={list.id}
                style={styles.savedListRow}
                onPress={() => openSavedList(list)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.savedListTitle}>{list.title}</Text>
                  <Text style={styles.savedListMeta}>
                    {list.items.length} item{list.items.length === 1 ? '' : 's'}
                  </Text>
                </View>

                <TouchableOpacity style={styles.iconBtn} onPress={() => confirmDeleteList(list)}>
                  <Ionicons name="trash-outline" size={18} color="#fb7185" />
                </TouchableOpacity>

                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <TouchableOpacity onPress={goToInventory}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => {
              const count = categoryCounts[cat.label] ?? 0
              return (
                <TouchableOpacity
                  key={cat.label}
                  style={styles.categoryCard}
                  activeOpacity={0.85}
                  onPress={() => goToInventoryCategory(cat.label)}
                >
                  {count > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{count}</Text>
                    </View>
                  )}

                  <View style={styles.categoryIconBubble}>
                    <MaterialCommunityIcons name={cat.icon} size={22} color="#f97316" />
                  </View>
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                  <Text style={styles.categoryMini}>
                    {count === 1 ? '1 item' : `${count} items`}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Smart grocery tools</Text>
          <View style={styles.featuresGrid}>
            {FEATURE_CARDS.map((f) => (
              <View key={f.title} style={styles.featureCard}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.description}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

type QuickPillProps = {
  label: string
  description: string
  icon: React.ComponentProps<typeof Ionicons>['name']
  onPress?: () => void
}

function QuickPill({ label, description, icon, onPress }: QuickPillProps) {
  const Wrapper: any = onPress ? TouchableOpacity : View
  return (
    <Wrapper style={styles.quickPill} onPress={onPress}>
      <Ionicons name={icon} size={18} color="#f97316" />
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={styles.quickDesc}>{description}</Text>
    </Wrapper>
  )
}

type ListButtonProps = {
  label: string
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']
  onPress: () => void
}

function ListButton({ label, icon, onPress }: ListButtonProps) {
  return (
    <TouchableOpacity style={styles.listButton} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={20} color="#ffffff" style={{ marginRight: 8 }} />
      <Text style={styles.listButtonText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#ffffff" style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f97316' + '26',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoTop: { fontSize: 14, letterSpacing: 2, color: '#f97316', fontWeight: '700' },
  logoBottom: { fontSize: 18, letterSpacing: 3, color: '#f9fafb', fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginRight: 8,
  },
  userChipText: { color: '#e5e7eb', fontSize: 12, fontWeight: '500' },
  logoutButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020617',
  },
  tagline: { marginTop: 8, fontSize: 13, color: '#9ca3af' },
  searchBar: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  searchInput: { flex: 1, marginLeft: 8, color: '#f9fafb', fontSize: 14 },
  quickRow: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  quickPill: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 10,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  quickLabel: { marginTop: 4, fontSize: 12, color: '#f9fafb', fontWeight: '600' },
  quickDesc: { marginTop: 2, fontSize: 10, color: '#9ca3af' },
  section: { marginTop: 16 },
  listButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  listButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, color: '#e5e7eb', fontWeight: '700' },
  seeAllText: { fontSize: 12, color: '#f97316', fontWeight: '600' },
  emptyText: { marginTop: 10, color: '#9ca3af', fontSize: 13 },
  savedListRow: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b1220',
  },
  savedListTitle: { color: '#f9fafb', fontSize: 14, fontWeight: '600' },
  savedListMeta: { color: '#9ca3af', fontSize: 11, marginTop: 1 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 6,
  },
  countBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316',
  },
  countBadgeText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  categoryIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryLabel: { fontSize: 12, color: '#e5e7eb', fontWeight: '500' },
  categoryMini: { marginTop: 2, fontSize: 10, color: '#9ca3af' },
  featuresGrid: { marginTop: 8, gap: 10 },
  featureCard: {
    backgroundColor: '#020617',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  featureTitle: { fontSize: 13, color: '#f97316', fontWeight: '700', marginBottom: 4 },
  featureDesc: { fontSize: 12, color: '#d1d5db' },
})
