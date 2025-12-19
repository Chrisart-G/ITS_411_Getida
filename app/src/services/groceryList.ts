import firestore from '@react-native-firebase/firestore'

export type GroceryItem = {
  id: string
  name: string
  quantity: number
  price?: number
  done: boolean
  imageUrl?: string | null
  imagePath?: string | null
}

export type GroceryListDoc = {
  id: string
  userId: string
  title: string
  items: GroceryItem[]
  createdAt?: any
  updatedAt?: any
}

const collection = firestore().collection('groceryLists')

function sanitizeItems(items: GroceryItem[]): any[] {
  return items.map((it) => {
    const clean: any = {
      id: it.id,
      name: it.name,
      quantity: it.quantity,
      done: !!it.done,
      imageUrl: it.imageUrl ?? null,
      imagePath: null,
    }
    if (typeof it.price === 'number' && !Number.isNaN(it.price)) {
      clean.price = it.price
    }
    return clean
  })
}

function toMillis(v: any): number {
  if (!v) return 0
  if (typeof v.toMillis === 'function') return v.toMillis()
  if (typeof v.seconds === 'number') return v.seconds * 1000
  if (typeof v === 'number') return v
  if (v instanceof Date) return v.getTime()
  return 0
}

function guessMime(mimeType?: string | null, localUri?: string | null): string {
  if (mimeType && typeof mimeType === 'string') return mimeType
  const u = (localUri || '').split('?')[0].toLowerCase()
  if (u.endsWith('.png')) return 'image/png'
  if (u.endsWith('.webp')) return 'image/webp'
  return 'image/jpeg'
}

function approxBytesFromBase64(b64: string): number {
  const len = b64.length
  return Math.floor((len * 3) / 4)
}

export async function saveGroceryList(
  userId: string,
  listId: string | null,
  title: string,
  items: GroceryItem[]
): Promise<string> {
  const payload = {
    userId,
    title,
    items: sanitizeItems(items),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  }

  if (listId) {
    await collection.doc(listId).set(payload, { merge: true })
    return listId
  }

  const docRef = await collection.add({
    ...payload,
    createdAt: firestore.FieldValue.serverTimestamp(),
  })
  return docRef.id
}

export function subscribeToUserGroceryLists(
  userId: string,
  cb: (lists: GroceryListDoc[]) => void
) {
  return collection.where('userId', '==', userId).onSnapshot(
    (snap) => {
      const arr: GroceryListDoc[] = []
      snap.forEach((doc) => {
        const data = doc.data() as any
        arr.push({
          id: doc.id,
          userId: data.userId,
          title: data.title || 'Untitled list',
          items: (data.items as GroceryItem[]) || [],
          createdAt: data.createdAt ?? null,
          updatedAt: data.updatedAt ?? null,
        })
      })
      arr.sort((a, b) => {
        const ta = toMillis(a.updatedAt) || toMillis(a.createdAt)
        const tb = toMillis(b.updatedAt) || toMillis(b.createdAt)
        return tb - ta
      })
      cb(arr)
    },
    (err) => {
      console.error('subscribeToUserGroceryLists error', err)
      cb([])
    }
  )
}

export function subscribeToGroceryList(
  listId: string,
  cb: (list: GroceryListDoc | null) => void
) {
  return collection.doc(listId).onSnapshot(
    (snapshot) => {
      if (!snapshot || !snapshot.exists) return cb(null)
      const data = snapshot.data() as any
      cb({
        id: snapshot.id,
        userId: data.userId,
        title: data.title || 'Untitled list',
        items: (data.items as GroceryItem[]) || [],
        createdAt: data.createdAt ?? null,
        updatedAt: data.updatedAt ?? null,
      })
    },
    (err) => {
      console.error('subscribeToGroceryList error', err)
      cb(null)
    }
  )
}

export async function deleteGroceryListAndImages(listId: string) {
  await collection.doc(listId).delete()
}

export async function uploadGroceryItemImage(args: {
  userId: string
  listId: string
  itemId: string
  localUri: string
  base64: string
  mimeType?: string | null
}): Promise<{ downloadURL: string; path: null }> {
  const { localUri, base64, mimeType } = args

  if (!base64 || base64.trim().length === 0) {
    throw new Error('No image data received. Please try selecting the image again.')
  }

  const mime = guessMime(mimeType, localUri)

  const bytes = approxBytesFromBase64(base64)
  if (bytes > 650_000) {
    throw new Error('Image is too large for Firestore. Pick a smaller image or reduce quality.')
  }

  const dataUrl = `data:${mime};base64,${base64}`
  return { downloadURL: dataUrl, path: null }
}
