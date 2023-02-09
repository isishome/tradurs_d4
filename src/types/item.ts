export interface Attribute {
    valueId?: number,
    action?: number,
    disable?: boolean,
    restore?: number
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
    itemId: number | null,
    name: string,
    quantity: number,
    quality: string,
    itemType: string,
    itemTypeValues: Array<number>,
    equipmentClass: string,
    runeId: string,
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
    public itemId: number | null = null
    public name: string = ''
    public quantity = 1
    public quality: string = ''
    public itemType: string = ''
    public itemTypeValues: Array<number> = []
    public equipmentClass: string = ''
    public runeId: string = ''
    public properties: Array<Property> = []
    public affixes: Array<Affix> = []
    public price: Price = { currency: 'offer', currencyValue: null, quantity: 1 }
    public user: string = ''
    public offers: number = 0
    public editable: boolean = false
    public action: number = 0
    public loading: boolean = false
    public expanded: boolean = false

    constructor() { }
}

export class Advertise extends Item {
    public slot: string = ''
    public width: number = 160
    public height: number = 600
}

export class Offer implements Price {
    public itemId: number | null
    public userId: number
    public currency: string
    public currencyValue: string | null
    public quantity: number

    constructor(userId: number, currency?: string, currencyValue?: string | null, quantity?: number) {
        this.itemId = null
        this.userId = userId
        this.currency = currency || 'rune'
        this.currencyValue = currencyValue || 'eld'
        this.quantity = quantity || 1
    }
}