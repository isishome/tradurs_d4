import { nanoid } from 'nanoid'
import { User } from './user'
import { useItemStore } from 'src/stores/item-store'

const store = useItemStore()

export interface Attribute {
  valueId?: string,
  action?: number,
  disable?: boolean,
  restore?: number
}

export interface Power extends Attribute {
  powerId: number,
  powerValues: Array<number>
}

export interface Property extends Attribute {
  propertyId: number,
  propertyValues: Array<number>
}

export interface Affix extends Attribute {
  affixId: number,
  affixValues: Array<number>
}

export interface IPrice {
  currency: string | null,
  currencyValue: string | null,
  quantity: number
}

export interface IItem {
  itemId: string,
  hardcore: boolean,
  ladder: boolean,
  statusCode: string,
  name: string,
  quantity: number,
  quality: string,
  itemType: string,
  itemTypeValues: Array<number>,
  equipmentClass: string,
  runeId: string,
  powers: Array<Power>,
  properties: Array<Property>,
  affixes: Array<Affix>,
  price: Price,
  relistCount: number,
  authorized: boolean,
  user: User,
  offers: Array<Offer>,
  editable: boolean,
  action: number,
  loading: boolean,
  expanded: boolean
}

// export interface Advertise extends IItem {
//     slot: string,
//     width: number,
//     height: number
// }

export class Price implements IPrice {
  public currency: string
  public currencyValue: string | null
  public quantity: number
  public loading = false

  constructor(currency?: string, currencyValue?: string | null, quantity?: number) {
    this.currency = currency || 'rune'
    this.currencyValue = currencyValue || 'eld'
    this.quantity = quantity || 1
  }
}

export class Item implements IItem {
  public itemId = ''
  public hardcore = false
  public ladder = true
  public statusCode = '000'
  public name = ''
  public quantity = 1
  public quality = 'normal'
  public itemType = 'weapons'
  public itemTypeValues: Array<number> = []
  public equipmentClass = 'axes'
  public runeId = ''
  public powers: Array<Power> = []
  public properties: Array<Property> = []
  public affixes: Array<Affix> = []
  public price: Price = new Price()
  public relistCount = 0
  public authorized = false
  public user: User = new User()
  public offers: Array<Offer> = []
  public editable = false
  public action = 0
  public loading = false
  public expanded = false

  constructor(id?: string) {
    this.itemId = id === undefined ? nanoid() : id
  }

  upsert(resolve?: Function, reject?: Function) {
    store[this.itemId !== '' ? 'updateItem' : 'addItem'](this)
      .then((response) => {
        Object.assign(this, response)
        resolve?.()
      })
      .catch(() => {
        reject?.()
      })
  }

  relist(resolve?: Function, reject?: Function) {
    store.relistItem(this.itemId)
      .then(() => {
        resolve?.()
      })
      .catch(() => {
        reject?.()
      })
  }

  delete(resolve?: Function, reject?: Function) {
    store.deleteItem(this.itemId)
      .then(() => {
        resolve?.()
      })
      .catch(() => {
        reject?.()
      })
  }

  status(resolve?: Function, reject?: Function) {
    store.statusItem(this.itemId)
      .then(() => {
        resolve?.()
      })
      .catch(() => {
        reject?.()
      })
  }
}

export class Advertise extends Item {
  public slot = ''
  public width = 160
  public height = 600
}

export class Offer {
  public offerId: string
  public itemId: string
  public itemStatusCode: string
  public statusCode: string
  public user: User
  public price: Price
  public authorized = false
  public loading = false

  constructor(itemId?: string, itemStatusCode?: string, statusCode?: string) {
    this.offerId = ''
    this.itemId = itemId || ''
    this.itemStatusCode = itemStatusCode || '000'
    this.statusCode = statusCode || '000'
    this.user = new User()
    this.price = new Price()
  }

  info(resolve?: Function, reject?: Function) {
    store.getOffers(this.itemId, this.offerId)
      .then((response) => {
        if (response.length > 0)
          Object.assign(this, response[0])
        resolve?.()
      })
      .catch(() => {
        reject?.()
      })
  }

  make(resolve?: Function, reject?: Function) {
    store.makeOffer(this)
      .then((response) => {
        Object.assign(this, response)
        resolve?.()
      })
      .catch(() => {
        reject?.()
      })
  }

  accept(resolve?: Function, reject?: Function) {
    store.acceptOffer(this.offerId)
      .then(() => {
        resolve?.()
      })
      .catch(() => {
        reject?.()
      })
  }
}