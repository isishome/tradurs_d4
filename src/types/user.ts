export interface INotify {
  notifyNew: boolean,
  notifyPrivate: boolean,
  notifyEmail: boolean
}

export interface IUser extends INotify {
  id: string | null,
  yolk: number,
  avatar: number,
  battleTag?: string,
  temperature: number,
  online: boolean
}

export class User implements IUser {
  public id
  public yolk = 0
  public avatar = 0
  public battleTag = ''
  public temperature = 0
  public online = false
  public notifyNew = true
  public notifyPrivate = true
  public notifyEmail = true
  public loading = false
  constructor(id?: string) {
    this.id = id || null
  }
}