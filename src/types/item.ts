import { nanoid } from 'nanoid'
import { User } from './user'

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

export interface Price {
  currency: string,
  currencyValue: string | null,
  quantity: number
}

export interface IItem {
  itemId: string,
  tradeType: string,
  itemStatus: number,
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
  user: string,
  offers: number,
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

export class Item implements IItem {
  public itemId = ''
  public tradeType = 'sell'
  public itemStatus = 0
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
  public price: Price = { currency: 'offer', currencyValue: null, quantity: 1 }
  public user = ''
  public offers = 0
  public editable = false
  public action = 0
  public loading = false
  public expanded = false

  constructor(id?: string) {
    this.itemId = id === undefined ? nanoid() : id
  }
}

export class Advertise extends Item {
  public slot = ''
  public width = 160
  public height = 600
}

export class Offer implements Price {
  public itemId: string
  public user: User
  public currency: string
  public currencyValue: string | null
  public quantity: number
  public accepted = false
  public loading = false

  constructor(itemId: string, userId: string, currency?: string, currencyValue?: string | null, quantity?: number) {
    this.itemId = itemId
    this.user = new User(userId)
    this.currency = currency || 'rune'
    this.currencyValue = currencyValue || 'eld'
    this.quantity = quantity || 1
  }

  getInfo() {
    this.loading = true
    setTimeout(() => {
      this.loading = false
    }, 2000)
  }
}