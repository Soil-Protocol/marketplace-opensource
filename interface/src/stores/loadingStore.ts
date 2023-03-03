import { makeAutoObservable } from 'mobx'

class LoadingStore {
  constructor() {
    makeAutoObservable(this)
  }

  loadingCount = 0

  get isLoading() {
    return this.loadingCount > 0
  }

  increase = () => {
    this.loadingCount++
  }

  decrease = () => {
    if (this.loadingCount > 0) {
      this.loadingCount--
    }
  }

  resetLoading = () => {
    this.loadingCount = 0
  }
}

export const loadingStore = new LoadingStore()
