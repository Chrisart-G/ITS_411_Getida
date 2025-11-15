
import firestore from "@react-native-firebase/firestore";
import { Alert } from "react-native";

export type TodoItem = {
  id: string;
  name: string;
  tags: string[];
  userId: string;
  createdAt?: Date;
};

export const addTodoItem = async (
  userId: string,
  name: string,
  tags: string[]
): Promise<void> => {
  if (!userId) {
    Alert.alert("Error", "Missing user ID");
    throw new Error("Missing userId");
  }
  if (!name.trim()) {
    Alert.alert("Error", "Enter item name.");
    throw new Error("Missing item name");
  }
  try {
    await firestore().collection("items").add({
      name: name.trim(),
      tags,
      userId,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
    Alert.alert("Success", "Item added successfully!");
  } catch (e: unknown) {
    const msg = (e as Error)?.message ?? "Failed to add item";
    Alert.alert("Error", msg);
    throw e;
  }
};

export const deleteTodoItem = async (itemId: string): Promise<void> => {
  if (!itemId) return;
  try {
    await firestore().collection("items").doc(itemId).delete();
    Alert.alert("Success", "Item removed successfully!");
  } catch (e: unknown) {
    const msg = (e as Error)?.message ?? "Failed to remove item";
    Alert.alert("Error", msg);
    throw e;
  }
};


export const subscribeUserItems = (
  userId: string,
  onItems: (items: TodoItem[]) => void
): (() => void) => {
  if (!userId) {
    console.warn("subscribeUserItems called without userId");
    return () => {};
  }

  const q = firestore().collection("items").where("userId", "==", userId);

  const unsubscribe = q.onSnapshot(
    (snap) => {
      const list: TodoItem[] = (snap?.docs ?? []).map((d) => {
        const data = d.data() as any;
        const ts = data?.createdAt;
        return {
          id: d.id,
          name: data?.name ?? "",
          tags: Array.isArray(data?.tags) ? data.tags : [],
          userId: data?.userId ?? "",
          createdAt:
            ts?.toDate?.() ??
            (typeof ts === "number" ? new Date(ts) : undefined),
        };
      });

      // Newest first without requiring an index
      list.sort(
        (a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0)
      );
      onItems(list);
    },
    (err) => {
      console.error("Firestore onSnapshot error:", err);
      onItems([]); // keep UI stable even if rules block
    }
  );

  return unsubscribe;
};
