// src/services/inventory.ts
import firestore from '@react-native-firebase/firestore';

export type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
};

const collection = firestore().collection('inventories');

export async function saveUserInventory(
  userId: string,
  items: InventoryItem[]
) {
  await collection.doc(userId).set(
    {
      items,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export function subscribeToUserInventory(
  userId: string,
  cb: (items: InventoryItem[]) => void
) {
  return collection.doc(userId).onSnapshot(
    (snapshot) => {
      if (!snapshot || !snapshot.exists) {
        cb([]);
        return;
      }
      const data = snapshot.data() as any;
      const raw = (data.items as any[]) || [];
      const cleaned: InventoryItem[] = raw.map((i) => ({
        id: i.id,
        name: i.name,
        quantity: typeof i.quantity === 'number' ? i.quantity : 0,
      }));
      cb(cleaned);
    },
    (err) => {
      console.error('subscribeToUserInventory error', err);
      cb([]);
    }
  );
}
