import { Props as CoreDialogProps } from 'core/CoreDialog'
import { makeAutoObservable } from 'mobx'

export class DialogStore {
  constructor() {
    makeAutoObservable(this)
  }

  private defaultProps: Partial<CoreDialogProps> = {
    onClose: () => this.close(),
    onOk: () => this.close(),
    divider: false,
    center: false,
  }

  props: Partial<CoreDialogProps> = this.defaultProps

  isOpen = false

  open = (content: string, props: Partial<CoreDialogProps> = {}) => {
    this.props = { ...this.defaultProps, ...props, children: content }
    this.isOpen = true
  }

  close = () => {
    this.isOpen = false
  }
}

export const dialogStore = new DialogStore()
