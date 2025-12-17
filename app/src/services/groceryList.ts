// src/services/groceryList.ts
import firestore from '@react-native-firebase/firestore';

export type GroceryItem = {
  id: string;
  name: string;
  quantity: number;
  price?: number; // per unit
  done: boolean;
};

export type GroceryListDoc = {
  id: string;
  userId: string;
  title: string;
  items: GroceryItem[];
  createdAt?: any;
  updatedAt?: any;
};

const collection = firestore().collection('groceryLists');

/**
 * Create or update a grocery list.
 * - If listId is null  -> create NEW document.
 * - If listId has value -> update existing document.
 */
export async function saveGroceryList(
  userId: string,
  listId: string | null,
  title: string,
  items: GroceryItem[]
): Promise<string> {
  const payload = {
    userId,
    title,
    items,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };

  if (listId) {
    // Update existing list
    await collection.doc(listId).set(payload, { merge: true });
    return listId;
  } else {
    // Create brand-new list
    const docRef = await collection.add({
      ...payload,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
    return docRef.id;
  }
}

/**
 * Listen to ALL lists of a user (for Home screen).
 */
export function subscribeToUserGroceryLists(
  userId: string,
  cb: (lists: GroceryListDoc[]) => void
) {
  return collection.where('userId', '==', userId).onSnapshot(
    (snap) => {
      const arr: GroceryListDoc[] = [];
      snap.forEach((doc) => {
        const data = doc.data() as any;
        arr.push({
          id: doc.id,
          userId: data.userId,
          title: data.title || 'Untitled list',
          items: (data.items as GroceryItem[]) || [],
          createdAt: data.createdAt ?? null,
          updatedAt: data.updatedAt ?? null,
        });
      });

      // Sort newest first
      arr.sort((a, b) => {
        const ta =
          (a.updatedAt && a.updatedAt.toMillis?.()) ||
          (a.createdAt && a.createdAt.toMillis?.()) ||
          0;
        const tb =
          (b.updatedAt && b.updatedAt.toMillis?.()) ||
          (b.createdAt && b.createdAt.toMillis?.()) ||
          0;
        return tb - ta;
      });

      cb(arr);
    },
    (err) => {
      console.error('subscribeToUserGroceryLists error', err);
      cb([]);
    }
  );
}

/**
 * Listen to ONE list by id (for List screen).
 */
export function subscribeToGroceryList(
  listId: string,
  cb: (list: GroceryListDoc | null) => void
) {
  return collection.doc(listId).onSnapshot(
    (snapshot) => {
      if (!snapshot || !snapshot.exists) {
        cb(null);
        return;
      }
      const data = snapshot.data() as any;
      cb({
        id: snapshot.id,
        userId: data.userId,
        title: data.title || 'Untitled list',
        items: (data.items as GroceryItem[]) || [],
        createdAt: data.createdAt ?? null,
        updatedAt: data.updatedAt ?? null,
      });
    },
    (err) => {
      console.error('subscribeToGroceryList error', err);
      cb(null);
    }
  );
}
