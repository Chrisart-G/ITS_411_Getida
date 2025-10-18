// firebase/auth.js
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { Alert } from "react-native";

/** ───────── AUTH ───────── */

export const signUpUser = async (email, password) => {
  try {
    const cred = await auth().createUserWithEmailAndPassword(email, password);
    Alert.alert("Success", "Account created successfully!");
    return cred.user;
  } catch (e) {
    Alert.alert("Error", e?.message ?? "Signup failed");
    throw e;
  }
};

export const loginUser = async (email, password) => {
  try {
    const cred = await auth().signInWithEmailAndPassword(email, password);
    Alert.alert("Success", "Logged in successfully!");
    return cred.user;
  } catch (e) {
    Alert.alert("Error", e?.message ?? "Login failed");
    throw e;
  }
};

export const logoutUser = async () => {
  try {
    await auth().signOut();
    Alert.alert("Success", "Logged out successfully!");
  } catch (e) {
    Alert.alert("Error", e?.message ?? "Logout failed");
    throw e;
  }
};

/** ───────── TODOS (Firestore) ───────── */

export const addTodoItem = async (userId, name, tags) => {
  try {
    await firestore().collection("items").add({
      name,
      tags,
      userId,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
    Alert.alert("Success", "Item added successfully!");
  } catch (e) {
    Alert.alert("Error", e?.message ?? "Failed to add item");
    throw e;
  }
};

export const deleteTodoItem = async (itemId) => {
  try {
    await firestore().collection("items").doc(itemId).delete();
    Alert.alert("Success", "Item removed successfully!");
  } catch (e) {
    Alert.alert("Error", e?.message ?? "Failed to remove item");
    throw e;
  }
};

// BEFORE (needs composite index)
export const subscribeUserItems = (userId, onItems) => {
  return firestore()
    .collection("items")
    .where("userId", "==", userId)
    // .orderBy("createdAt", "desc")  // <- remove to avoid index requirement
    .onSnapshot(
      (snap) => {
        const list = (snap?.docs ?? []).map((d) => {
          const data = d.data() || {};
          const ts = data.createdAt;
          return {
            id: d.id,
            name: data.name ?? "",
            tags: Array.isArray(data.tags) ? data.tags : [],
            userId: data.userId ?? "",
            createdAt: ts?.toDate?.() ?? (typeof ts === "number" ? new Date(ts) : undefined),
          };
        });
        // client-side sort (newest first)
        list.sort((a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0));
        onItems(list);
      },
      (err) => {
        console.error("Firestore onSnapshot error:", err);
        onItems([]);
      }
    );
};


