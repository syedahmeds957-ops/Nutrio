const storage = new Map<string, string>();

const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    return storage.has(key) ? storage.get(key)! : null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    storage.set(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    storage.delete(key);
  },
  clear: async (): Promise<void> => {
    storage.clear();
  },
  getAllKeys: async (): Promise<string[]> => {
    return Array.from(storage.keys());
  },
};

export default AsyncStorage;
