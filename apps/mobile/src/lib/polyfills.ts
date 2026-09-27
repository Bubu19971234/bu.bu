// Must be imported first (see app/_layout.tsx).
import 'react-native-url-polyfill/auto';
import * as Crypto from 'expo-crypto';

type CryptoLike = { randomUUID?: () => string; getRandomValues?: <T extends ArrayBufferView>(a: T) => T };
const g = globalThis as unknown as { crypto?: CryptoLike };
g.crypto = g.crypto ?? {};
if (!g.crypto.randomUUID) g.crypto.randomUUID = () => Crypto.randomUUID();
if (!g.crypto.getRandomValues) {
  g.crypto.getRandomValues = <T extends ArrayBufferView>(a: T) => Crypto.getRandomValues(a as unknown as Uint8Array) as unknown as T;
}
