import { nanoid } from 'nanoid'

export interface IUser {
  id: string,
  battleTag?: string
}

export class User implements IUser {
  public id
  public battleTag = ''
  public loading = false
  constructor(id?: string) {
    this.id = id === undefined ? nanoid() : id
  }

  getInfo() {
    this.loading = true
    setTimeout(() => {
      this.battleTag = '#Avatar'
      this.loading = false
    }, 2000)
  }
}