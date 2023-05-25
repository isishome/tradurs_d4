export interface IUser {
  id: string | null,
  battleTag?: string,
  avatar: number
}

export class User implements IUser {
  public id
  public battleTag = ''
  public avatar = 5
  public loading = false
  constructor(id?: string) {
    this.id = id || null
  }
}