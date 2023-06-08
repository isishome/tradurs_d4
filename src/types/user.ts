export interface IUser {
  id: string | null,
  yolk: number,
  avatar: number,
  battleTag?: string,
  temperature: number
}

export class User implements IUser {
  public id
  public yolk = 0
  public avatar = 0
  public battleTag = ''
  public temperature = 0
  public loading = false
  constructor(id?: string) {
    this.id = id || null
  }
}