// app/(tabs)/home.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import {
  GroceryListDoc,
  subscribeToUserGroceryLists,
} from '../src/services/groceryList';

const CATEGORIES = [
  { label: 'Dairy', icon: 'milk-outline' as const },
  { label: 'Meat', icon: 'food-steak' as const },
  { label: 'Fruits', icon: 'fruit-cherries' as const },
  { label: 'Vegetables', icon: 'food-apple-outline' as const },
  { label: 'Drinks', icon: 'cup-outline' as const },
  { label: 'Snacks', icon: 'food-outline' as const },
];

const FEATURE_CARDS = [
  {
    title: 'One-tap checklist',
    description:
      'Add, check, and clear items in a single tap so your list stays up to date.',
  },
  {
    title: 'Manual stock with “Low” tag',
    description:
      'Track how many you have at home; items auto-tag as “Low” when they hit your limit.',
  },
  {
    title: 'Photo + note per item',
    description:
      'Attach a quick photo and note for brand/size so you always grab the exact item.',
  },
];

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [savedLists, setSavedLists] = useState<GroceryListDoc[]>([]);

  // Subscribe to all saved lists of the current user
  useEffect(() => {
    if (!user) {
      setSavedLists([]);
      return;
    }
    const unsub = subscribeToUserGroceryLists(user.uid, setSavedLists);
    return unsub;
  }, [user]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Do you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  // Always start a truly NEW list
  const goToNewList = () => {
    router.push({
      pathname: '/(tabs)/list',
      params: {
        mode: 'new',
        title: 'New list',
      },
    });
  };

  const openSavedList = (list: GroceryListDoc) => {
    router.push({
      pathname: '/(tabs)/list',
      params: {
        listId: list.id,
        title: list.title,
      },
    });
  };

  const goToInventory = () => {
    router.push('/(tabs)/inventory');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ---------- HEADER ---------- */}
        <View style={styles.headerRow}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIconCircle}>
              <MaterialCommunityIcons
                name="basket-outline"
                size={22}
                color="#f97316"
              />
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
              <Text style={styles.userChipText}>
                {user?.email?.split('@')[0] ?? 'User'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={18} color="#f97316" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.tagline}>
          Plan, shop, and track your groceries in one clean dashboard.
        </Text>

        {/* ---------- SEARCH BAR ---------- */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            placeholder="Search items or lists"
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
          />
        </View>

        {/* ---------- QUICK ACTIONS ---------- */}
        <View style={styles.quickRow}>
          <QuickPill
            label="Checklist"
            description="Tap to tick off items"
            icon="checkmark-done-outline"
          />
          <QuickPill
            label="Inventory"
            description="Watch low-stock tags"
            icon="analytics-outline"
            onPress={goToInventory}
          />
          <QuickPill
            label="Photo notes"
            description="See brand & size"
            icon="image-outline"
          />
        </View>

        {/* ---------- MAIN LIST BUTTON ---------- */}
        <View style={styles.section}>
          <ListButton
            label="Add new grocery list"
            icon="plus-circle-outline"
            onPress={goToNewList}
          />
        </View>

        {/* ---------- SAVED LISTS ---------- */}
        {savedLists.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your saved lists</Text>
            {savedLists.map((list) => (
              <TouchableOpacity
                key={list.id}
                style={styles.savedListRow}
                onPress={() => openSavedList(list)}
              >
                <View>
                  <Text style={styles.savedListTitle}>{list.title}</Text>
                  <Text style={styles.savedListMeta}>
                    {list.items.length} item
                    {list.items.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ---------- CATEGORIES GRID ---------- */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => (
              <View key={cat.label} style={styles.categoryCard}>
                <View style={styles.categoryIconBubble}>
                  <MaterialCommunityIcons
                    name={cat.icon}
                    size={22}
                    color="#f97316"
                  />
                </View>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ---------- FEATURES ---------- */}
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

        {/* ---------- PLACEHOLDER BANNER ---------- */}
        <View style={styles.section}>
          <View style={styles.placeholderBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Coming next</Text>
              <Text style={styles.bannerText}>
                We will soon connect photo notes and stock alerts to every list
                so you never miss an item.
              </Text>
            </View>
            <Image
              source={require('../../assets/images/adaptive-icon.png')}
              style={styles.bannerImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- SMALL COMPONENTS ---------- */

type QuickPillProps = {
  label: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress?: () => void;
};

function QuickPill({ label, description, icon, onPress }: QuickPillProps) {
  const Wrapper: any = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={styles.quickPill} onPress={onPress}>
      <Ionicons name={icon} size={18} color="#f97316" />
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={styles.quickDesc}>{description}</Text>
    </Wrapper>
  );
}

type ListButtonProps = {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress: () => void;
};

function ListButton({ label, icon, onPress }: ListButtonProps) {
  return (
    <TouchableOpacity style={styles.listButton} onPress={onPress}>
      <MaterialCommunityIcons
        name={icon}
        size={20}
        color="#ffffff"
        style={{ marginRight: 8 }}
      />
      <Text style={styles.listButtonText}>{label}</Text>
      <Ionicons
        name="chevron-forward"
        size={18}
        color="#ffffff"
        style={{ marginLeft: 'auto' }}
      />
    </TouchableOpacity>
  );
}

/* ---------- STYLES ---------- */

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
  logoTop: {
    fontSize: 14,
    letterSpacing: 2,
    color: '#f97316',
    fontWeight: '700',
  },
  logoBottom: {
    fontSize: 18,
    letterSpacing: 3,
    color: '#f9fafb',
    fontWeight: '800',
  },
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
  quickLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#f9fafb',
    fontWeight: '600',
  },
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
  sectionTitle: {
    fontSize: 16,
    color: '#e5e7eb',
    fontWeight: '700',
  },
  seeAllText: { fontSize: 12, color: '#f97316', fontWeight: '600' },
  savedListRow: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedListTitle: {
    color: '#f9fafb',
    fontSize: 14,
    fontWeight: '600',
  },
  savedListMeta: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 1,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  featuresGrid: { marginTop: 8, gap: 10 },
  featureCard: {
    backgroundColor: '#020617',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  featureTitle: {
    fontSize: 13,
    color: '#f97316',
    fontWeight: '700',
    marginBottom: 4,
  },
  featureDesc: { fontSize: 12, color: '#d1d5db' },
  placeholderBanner: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#f97316' + '1A',
    borderWidth: 1,
    borderColor: '#f97316' + '40',
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f97316',
    marginBottom: 4,
  },
  bannerText: { fontSize: 12, color: '#e5e7eb' },
  bannerImage: { width: 70, height: 70, marginLeft: 8 },
});
