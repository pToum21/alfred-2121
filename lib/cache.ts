// lib/cache.ts

import NodeCache from 'node-cache';

// Cache for 15 minutes
const cache = new NodeCache({ stdTTL: 900 });

export function getOrSetCache<T>(
  key: string,
  cb: () => Promise<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const value = cache.get<T>(key);
    if (value) {
      return resolve(value);
    }

    cb().then((result) => {
      cache.set(key, result);
      resolve(result);
    }).catch(reject);
  });
}