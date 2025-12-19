import firestore from '@react-native-firebase/firestore'

export type InventoryCategory =
  | 'Dairy'
  | 'Meat'
  | 'Fruits'
  | 'Vegetables'
  | 'Drinks'
  | 'Snacks'

export type InventoryItem = {
  id: string
  name: string
  quantity: number
  category: InventoryCategory
  imageUrl?: string | null
  imagePath?: string | null
}

const collection = firestore().collection('inventories')

function sanitizeItems(items: InventoryItem[]): any[] {
  return (Array.isArray(items) ? items : []).map((it) => ({
    id: String(it.id),
    name: String(it.name ?? ''),
    quantity: typeof it.quantity === 'number' && !Number.isNaN(it.quantity) ? it.quantity : 0,
    category: (it.category as InventoryCategory) || 'Snacks',
    imageUrl: it.imageUrl ?? null,
    imagePath: null,
  }))
}

function guessMime(mimeType?: string | null, localUri?: string | null): string {
  if (mimeType && typeof mimeType === 'string') return mimeType
  const u = (localUri || '').split('?')[0].toLowerCase()
  if (u.endsWith('.png')) return 'image/png'
  if (u.endsWith('.webp')) return 'image/webp'
  return 'image/jpeg'
}

function approxBytesFromBase64(b64: any): number {
  if (typeof b64 !== 'string') return 0
  const len = b64.length
  return Math.floor((len * 3) / 4)
}

export async function saveUserInventory(userId: string, items: InventoryItem[]) {
  await collection.doc(userId).set(
    {
      items: sanitizeItems(items),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  )
}

export function subscribeToUserInventory(
  userId: string,
  cb: (items: InventoryItem[]) => void
) {
  return collection.doc(userId).onSnapshot(
    (snapshot) => {
      if (!snapshot || !snapshot.exists) {
        cb([])
        return
      }

      const data = (snapshot.data() as any) ?? {}
      const raw = Array.isArray(data.items) ? data.items : []

      const cleaned: InventoryItem[] = raw.map((i: any) => ({
        id: String(i?.id ?? ''),
        name: String(i?.name ?? ''),
        quantity: typeof i?.quantity === 'number' && !Number.isNaN(i.quantity) ? i.quantity : 0,
        category: (i?.category as InventoryCategory) || 'Snacks',
        imageUrl: i?.imageUrl ?? null,
        imagePath: null,
      }))

      cb(cleaned)
    },
    (err) => {
      console.error('subscribeToUserInventory error', err)
      cb([])
    }
  )
}

export async function uploadInventoryItemImage(args: {
  userId: string
  localUri: string
  base64: string
  mimeType?: string | null
}): Promise<{ downloadURL: string; path: null }> {
  const { localUri, base64, mimeType } = args

  if (typeof base64 !== 'string' || base64.trim().length === 0) {
    throw new Error('No image data received. Please try selecting the image again.')
  }

  const mime = guessMime(mimeType, localUri)

  const bytes = approxBytesFromBase64(base64)
  if (bytes > 650_000) {
    throw new Error('Image is too large. Pick a smaller image or reduce quality.')
  }

  const dataUrl = `data:${mime};base64,${base64}`
  return { downloadURL: dataUrl, path: null }
}
