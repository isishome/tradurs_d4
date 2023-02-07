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

export interface IPrice {
    currency: string,
    currencyValue: string | null,
    quantity: number | null
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
    price: IPrice,
    user: string,
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
    public price: IPrice = { currency: 'offer', currencyValue: null, quantity: null }
    public user: string = ''
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

export class Price implements IPrice {
    public currency: string
    public currencyValue: string | null
    public quantity: number | null

    constructor(currency?: string, currencyValue?: string, quantity?: number) {
        this.currency = currency || 'offer'
        this.currencyValue = currencyValue || null
        this.quantity = quantity || null
    }
}