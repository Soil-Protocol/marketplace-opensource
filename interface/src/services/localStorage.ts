class LocalStorageService {
  get = (key: string, fallback: string = '') => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key) ?? fallback
    }
  }
  set = (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value)
    }
  }
}

export const ls = new LocalStorageService()
