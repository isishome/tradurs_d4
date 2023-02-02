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
    quantity: number
}

export interface IItem {
    itemId: number | null,
    name: string,
    quality: string,
    itemType: string,
    itemTypeValues: Array<number>,
    equipmentClass: string,
    runeId: string,
    properties: Array<Property>,
    affixes: Array<Affix>,
    price: Price,
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
    public quality: string = ''
    public itemType: string = ''
    public itemTypeValues: Array<number> = []
    public equipmentClass: string = ''
    public runeId: string = ''
    public properties: Array<Property> = []
    public affixes: Array<Affix> = []
    public price: Price = { currency: '', quantity: 1 }
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