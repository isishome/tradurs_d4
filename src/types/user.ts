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
  verified: boolean,
  temperature: number,
  online: boolean,
  blockable: boolean,
  unblockable: boolean
}

export interface IMessage {
  msgId: number,
  msgType: string,
  msgValue: string,
  itemId: number,
  itemName: string,
  currency: string,
  currencyValue: string,
  regDate: string,
  readYn: boolean,
  quantity: number,
  show: boolean,
  selected: boolean,
  disable: boolean
}

export interface IAnswer {
  open: boolean,
  loading: boolean,
  msgId: number | null,
  contents: string
}

export interface IBlock {
  battleTag: string,
  regDate: string,
  selected: boolean,
  disable: boolean
}

export class User implements IUser {
  public id
  public yolk = 0
  public avatar = 0
  public battleTag = ''
  public verified = false
  public temperature = 0
  public online = false
  public blockable = false
  public unblockable = false
  public notifyNew = true
  public notifyPrivate = true
  public notifyEmail = true
  public loading = false
  constructor(id?: string) {
    this.id = id || null
  }
}