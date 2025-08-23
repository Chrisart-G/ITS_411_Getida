import { ThemedText } from "@/components/ThemedText";
import { initializeApp } from 'firebase/app';
import { Auth, getAuth, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getFirestore, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from "react";
import { Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";


const firebaseConfig = {
  apiKey: "AIzaSyDEBLCyaq1sGJEcQP9fN-sCHyB3k6eoz1s",
  authDomain: "its411-getida.firebaseapp.com",
  projectId: "its411-getida",
  storageBucket: "its411-getida.appspot.com", 
  messagingSenderId: "1077910377593",
  appId: "1:1077910377593:android:0944e9110f16ebb30970a8"
};


const app = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db = getFirestore(app);

interface Item {
  id: string;
  name: string;
  tags: string[];
  userId: string;
  createdAt: Date;
}

export default function Touchscreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemTags, setItemTags] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (!user) {
        setItems([]);
      }
    });
    return () => unsubscribe();
  }, []);


  useEffect(() => {
    if (user) {
      loadItems();
    }
  }, [user]);


  const loadItems = async () => {
    if (!user) return;
    
    setLoadingItems(true);
    try {
      const itemsQuery = query(
        collection(db, 'items'),
        where('userId', '==', user.uid)
      );

      const unsubscribe = onSnapshot(itemsQuery, (snapshot) => {
        const itemsData: Item[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          itemsData.push({
            id: doc.id,
            name: data.name,
            tags: data.tags,
            userId: data.userId,
            createdAt: data.createdAt?.toDate() || new Date()
          });
        });

        itemsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setItems(itemsData);
      });

      return unsubscribe;
    } catch (error: any) {
      Alert.alert("Error", "Failed to load items: " + error.message);
    } finally {
      setLoadingItems(false);
    }
  };

  const signIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("Success", "Logged in successfully!");
      setEmail('');
      setPassword('');
    } catch (error: any) {
      Alert.alert("Error", "Login failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setItems([]);
      setShowAddItem(false);
      Alert.alert("Success", "Logged out successfully!");
    } catch (error: any) {
      Alert.alert("Error", "Logout failed: " + error.message);
    }
  };


  const addItem = async () => {
    if (!itemName.trim()) {
      Alert.alert("Error", "Please enter an item name");
      return;
    }

    if (!user) {
      Alert.alert("Error", "You must be logged in to add items");
      return;
    }

    setLoading(true);
    try {
      const tags = itemTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const newItem = {
        name: itemName.trim(),
        tags: tags,
        userId: user.uid,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'items'), newItem);
      
      setItemName('');
      setItemTags('');
      setShowAddItem(false);
      Alert.alert("Success", "Item added successfully!");
    } catch (error: any) {
      Alert.alert("Error", "Failed to add item: " + error.message);
    } finally {
      setLoading(false);
    }
  };


  const removeItem = (id: string) => {
    Alert.alert(
      "Remove Item",
      "Are you sure you want to remove this item?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'items', id));
              Alert.alert("Success", "Item removed successfully!");
            } catch (error: any) {
              Alert.alert("Error", "Failed to remove item: " + error.message);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{item.name}</Text>
        <TouchableOpacity 
          style={styles.removeBtn}
          onPress={() => removeItem(item.id)}
        >
          <Text style={styles.removeBtnText}>×</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tagsContainer}>
        {item.tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.dateText}>
        Added: {item.createdAt.toLocaleDateString()}
      </Text>
    </View>
  );


  if (!user) {
    return (
      <View style={styles.container}>
        <ThemedText type="title">Project 2 Login</ThemedText>
        <View>
          <Text style={styles.userh1}>Email:</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholder="Enter Email"
            placeholderTextColor="#ccc"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.userh1}>Password:</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry={true}
            placeholder="Enter Password"
            placeholderTextColor="#ccc"
          />
        </View>
        <TouchableOpacity 
          style={styles.btn}
          onPress={signIn}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? "Logging in..." : "Login"}
          </Text>
        </TouchableOpacity>
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
          onPress={() => setShowAddItem(!showAddItem)}
        >
          <Text style={styles.btnText}>
            {showAddItem ? "Cancel" : "Add Item"}
          </Text>
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
            placeholderTextColor="#ccc"
          />
          <Text style={styles.label}>Tags (comma separated):</Text>
          <TextInput
            value={itemTags}
            onChangeText={setItemTags}
            style={styles.input}
            placeholder="e.g., food, urgent, shopping"
            placeholderTextColor="#ccc"
          />
          <TouchableOpacity 
            style={styles.btn} 
            onPress={addItem}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? "Adding..." : "Add Item"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.itemsSection}>
        <Text style={styles.sectionTitle}>
          My Items ({items.length})
        </Text>
        {loadingItems ? (
          <Text style={styles.loadingText}>Loading items...</Text>
        ) : items.length === 0 ? (
          <Text style={styles.noItemsText}>
            No items yet. Add your first item!
          </Text>
        ) : (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  userEmail: {
    color: '#ccc',
    fontSize: 16,
    marginVertical: 10,
  },
  logoutBtn: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  logoutBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  addBtn: {
    backgroundColor: '#28a745',
  },
  addItemForm: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  formTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5,
  },
  itemsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  noItemsText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  itemContainer: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  removeBtn: {
    backgroundColor: '#ff4444',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#007bff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 5,
  },
  tagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateText: {
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
  },
  input: {
    height: 40,
    width: '100%',
    padding: 10,
    backgroundColor: "#FFFFFF",
    color: "#89898F",
    marginTop: 10,
    marginBottom: 15,
    borderRadius: 10,
  },
  btnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  btn: {
    backgroundColor: "#000AFF",
    paddingHorizontal: 20,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  userh1: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: 'bold',
  }
});