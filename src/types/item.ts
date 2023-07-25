import { uid } from 'quasar'
import { User } from './user'

export interface Attribute {
  valueId?: number | string,
  action?: number,
  disable?: boolean,
  restore?: number
}

export interface Property extends Attribute {
  propertyId: number,
  propertyValues: Array<number>
}

export interface AffixValue {
  valueRangeId: number | string,
  value: number,
  min: number,
  max: number
}

export interface Affix extends Attribute {
  affixId: number,
  affixValues: Array<AffixValue>
}

export interface Restriction extends Attribute {
  restrictId: number,
  restrictValues: Array<number>
}

export interface IPrice {
  currency: string | null,
  currencyValue: string | number | null,
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
  itemTypeValue1: string,
  itemTypeValue2: string,
  imageId: number,
  power: number,
  upgrade: number,
  level: number,
  properties: Array<Property>,
  affixes: Array<Affix>,
  restrictions: Array<Restriction>,
  price: Price,
  endDate: string,
  updDate: string,
  relistCount: number,
  authorized: boolean,
  user: User,
  offers: number,
  evaluations: Array<number>,
  favorite: boolean,
  forDisplay: boolean,
  editable: boolean,
  actions: Array<number>,
  loading: boolean,
  expanded: boolean,
  reward: boolean
}

// export interface Advertise extends IItem {
//     slot: string,
//     width: number,
//     height: number
// }

export class Price implements IPrice {
  public currency: string
  public currencyValue: string | number | null
  public quantity: number
  public loading = false

  constructor(currency?: string, currencyValue?: string | number | null, quantity?: number) {
    this.currency = currency || 'gold'
    this.currencyValue = this.currency === 'rune' ? 'eld' : currencyValue || null
    this.quantity = quantity || 1
  }
}

export class Item implements IItem {
  public itemId = ''
  public hardcore = false
  public ladder = false
  public statusCode = '000'
  public name = ''
  public quantity = 1
  public quality = 'rare'
  public itemType = ''
  public itemTypeValue1 = ''
  public itemTypeValue2 = ''
  public imageId = 0
  public power = 0
  public upgrade = 0
  public level = 0
  public properties: Array<Property> = []
  public affixes: Array<Affix> = []
  public restrictions: Array<Restriction> = []
  public price: Price = new Price()
  public endDate = ''
  public updDate = ''
  public relistCount = 0
  public authorized = false
  public user: User = new User()
  public offers = 0
  public evaluations: Array<number> = []
  public favorite = false
  public forDisplay = false
  public editable = false
  public actions: Array<number> = []
  public loading = false
  public expanded = false
  public reward = false

  constructor(id?: string) {
    this.itemId = id === undefined ? uid() : id
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
  public evaluations = []
  public user: User
  public price: Price
  public retractable = true
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
}