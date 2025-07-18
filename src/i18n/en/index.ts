export default {
  language: 'Language',
  decimal: {
    style: 'decimal',
    minimumSignificantDigits: 3,
    maximumSignificantDigits: 5
  },
  seo: {
    title: "{itemName}{pageName}Diablo® IV {'|'} Tradurs",
    desc: 'Trade various items used in Diablo® IV on the Tradurs',
    keywords:
      'dia4, dia 4, diablo4, diablo 4, dia, diablo, trade, trading, trade site, trade web'
  },
  page: {
    tradeList: 'Trade List',
    itemInfo: 'Item Information',
    awards: 'Awards',
    mySpace: 'My Space',
    messages: 'Messages',
    blocks: 'Blocks',
    history: 'History',
    support: 'Help',
    admin: 'Admin',
    adminUser: 'Manage User',
    adminItem: 'Manage Item',
    adminAffix: 'Manage Affix',
    adminNotice: 'Send Notice',
    pnf: 'Page not found',
    ftc: 'A problem has occurred with the data server'
  },
  battlenet: {
    title: 'Enter BattleTag™',
    msg1: 'In order to provide useful services to you on ',
    msg2: ', you must enter the BattleTag™ used in Battle.net.',
    desc: 'BattleTag™ can always be edited on the user information page of the Tradurs site',
    placeholder: 'leviathan#5112'
  },
  filter: {
    basic: 'Basic Filter',
    onlyCurrency: 'Show only priced',
    onlyForMe: 'Only For Me',
    all: 'All',
    status: 'Item Status',
    detail: 'Item Detail',
    type: 'Type(s)',
    advanced: 'Attributes Filter',
    mine: 'My Items',
    offered: 'Have been offered',
    offer: 'Have made an offer',
    preset: 'Filter Preset',
    presetName: 'Preset Name',
    noPreset: 'Add a preset',
    selectPreset: 'Select a preset',
    basicDescription:
      'The basic filter information is saved in your account storage. When you register an item, its hardcore and seasonal status is automatically set by the basic filter information.',
    presetDescription:
      'This feature saves the currently set filter values. Up to 3 presets can be saved.',
    affixDescription:
      'Affixes search allows you to select up to 6 affixes, and if 5 affixes are selected, items containing 4 of the 5 affixes combined will also be searched.',
    description: {
      advanced:
        "When using attributes filters, use 'characteristics affixes' and 'affixes' separately.",
      advanced2:
        "Sometimes sellers input 'characteristics affixes' and 'affixes' incorrectly, so consider this and filter."
    }
  },
  sort: {
    options: [
      { value: 'date_desc', label: 'Newest' },
      { value: 'price_desc', label: 'Highest price' },
      { value: 'price_asc', label: 'Lowest price' },
      { value: 'popular_desc', label: 'Many offered' }
    ]
  },
  selectAll: 'Select All',
  preset: {
    title: 'Delete Preset',
    message: 'Do you want to delete this preset?'
  },
  season: {
    bg: '/images/season/009/season_emblem_en.webp',
    first: {
      socket:
        'During Season of the Malignant, the more accurately you select the socket type in the accessory item affixes, the more often your items will be seen'
    },
    second: {
      pact: 'During the Season of Blood, you can unpack vampire power by enchanting your armor with pacts',
      ferocity: 'Ferocity',
      divinity: 'Divinity',
      eternity: 'Eternity'
    },
    color: 'text-primary'
  },
  noFilterdItems: 'No search results matched your criteria',
  noFilterdItemsDesc: 'Check out the item filters',
  noItem: 'Item information does not exist',
  seller: 'Seller',
  offerer: 'Offerer',
  user: {
    signout: 'Sign out',
    info: 'Change Info',
    battleTag: 'BattleTag™',
    yolk: 'Yolk',
    temperature: 'Manner Temperature',
    notify: {
      title: 'Notify',
      new: 'New Item',
      private: 'Trade',
      email: 'Email',
      sound: 'Sound',
      volume: 'Volume'
    },
    notifySound: {
      sound0: 'Default',
      sound1: 'Butcher',
      sound2: 'Cow'
    },
    sh1: 'BattleTags will not be displayed if the trade is ',
    sh2: 'not completed',
    sh3: ' or the trade with the seller is ',
    sh4: 'not in progress',
    sh5: ''
  },
  searchOrSelect: 'Search / Select',
  noMessage: 'No {attr} were found to match the text you entered',
  power: 'Power',
  properties: 'Characteristics',
  affixes: 'Affixes',
  restrictions: 'Restrictions',
  relistItem: {
    title: 'Relist Item',
    message: 'Are you sure you want to relist the item?'
  },
  relistItems: {
    title: 'Relist items',
    subTitle: 'Do you want to relist all selected items?',
    message:
      'If items are selected that cannot be relisted, they will be excluded during processing',
    failedTitle: 'Failed to relist items'
  },
  statusItem: {
    suspendTitle: 'Suspend Sale',
    suspendMessage: 'Are you sure you want to suspend sale?',
    resumeTitle: 'Resume Sale',
    resumeMessage: 'Are you sure you want to resume sale?'
  },
  statusItems: {
    title: '{type}',
    subTitle: 'Do you want to {type} all selected items?',
    message:
      'If items are selected that cannot be {type}, they will be excluded during processing',
    failedTitle: 'Failed to {type}'
  },
  reRegisterItem: {
    title: 'Re-Register item',
    message: 'Do you want to re-register this item?'
  },
  reRegisterItems: {
    title: 'Re-Register items',
    subTitle: 'Do you want to re-register all selected items?',
    message:
      'If items are selected that cannot be re-registered, they will be excluded during processing',
    failedTitle: 'Failed to re-register items'
  },
  deleteItem: {
    title: 'Delete Item',
    message: 'Are you sure you want to delete the item?'
  },
  deleteItems: {
    title: 'Delete items',
    subTitle: 'Do you want to delete all selected items?',
    message:
      'If items are selected that cannot be deleted, they will be excluded during processing',
    failedTitle: 'Failed to delete items'
  },
  blockUser: {
    title: 'Block user',
    unblockTitle: 'Unblock user',
    message: 'Do you want to block the user?',
    unblockMessage: 'Do you want to unblock this user?',
    block: 'Block',
    unblock: 'Unblock',
    caption: 'Unblocking is available after 48 hours',
    complete: 'User blocking is complete',
    unblockComplete: 'User unblocking is complete',
    noData: 'No users are blocked'
  },
  btn: {
    edit: 'Edit',
    cancel: 'Cancel',
    add: 'Add',
    apply: 'Apply',
    relist: 'Relist',
    delete: 'Delete',
    moreActions: 'More Actions',
    suspend: 'Suspend Sale',
    resume: 'Resume Sale',
    accept: 'Accept',
    close: 'Close',
    makeOffer: 'Make Offer',
    offer: 'Offer',
    refresh: 'Refresh',
    move: 'Move',
    complete: 'Complete',
    submit: 'Submit',
    attributeFilter: 'Attribute Filter',
    resetFilter: 'Reset Filter',
    favorite: 'Add to Favorites',
    unfavorite: 'Remove to Favorites',
    copy: 'Copy Template',
    share: 'Share',
    gotoItem: 'Go to item',
    markRead: 'Mark messages as read',
    retractOffer: 'Retract Offer',
    turnDownOffer: 'Turn Down Offer',
    turnDown: 'Turn Down',
    imageAnalysis: 'Analysis',
    newMessages: 'You have a new message',
    request: 'Request',
    block: 'Block',
    unblock: 'Unblock',
    bulkUnblock: 'Bulk Unblock',
    showMore: 'Show More',
    leave: 'Leave',
    open: 'Open',
    join: 'Join',
    allow: 'How to allow ads',
    confirm: 'Confirm',
    reRegister: 'Re-Register',
    reConnect: 'Re-Connect'
  },
  attribute: {
    request: 'Request additional {attr}',
    requestMessage: 'Request an admin to add the attribute.',
    placeholder:
      "+{'{'}x{'}'}% Increased Attack Speed for {'{'}x{'}'} Seconds After Dodging an Attack",
    enter: 'Please enter the {attr}',
    invalid: 'Invalid {attr} format',
    exists: 'Already exists {attr}',
    continuous: 'continuous addition',
    complete: 'Your request to add an affix is complete',
    open: 'Open Attributes',
    close: 'Close Attributes'
  },
  item: {
    hardcore: 'Hardcore',
    softcore: 'Softcore',
    ladder: 'Season of SINS of the HORADRIM',
    seasonal: 'Seasonal',
    eternal: 'Eternal',
    quality: 'Item Quality',
    selectType: 'Item Type',
    selectClass: 'Select {type}',
    rune: 'Rune',
    selectRuneType: 'Select Rune Type',
    aspect: 'Aspect',
    selectAspectCategory: 'Select Aspect Category',
    selectGem: 'Select Gem',
    selectElixir: 'Select Elixir',
    selectSummoning: 'Select Summoning material',
    selectImage: 'Select {tv} Image',
    name: 'Item Name',
    power: '{p} Item Power',
    upgrade: 'Upgrade: {u}/{ul}',
    level: 'Requires Level',
    gold: 'Gold',
    url: 'Item URL',
    favorites: 'Favorite Items',
    forDisplay: 'For Display',
    expanded: 'Always expand items',
    unknown: 'Unknown Item'
  },
  price: {
    title: 'Price',
    currency: 'Currency',
    quantity: 'Quantity',
    getOffer: 'Get An Offer',
    restrictGold: 'Must have a minimum sale/purchase price of 100,000 gold'
  },
  offer: {
    title: 'Get An Offer',
    list: 'Offer List',
    accepted: 'Accepted',
    noOffer: 'No offers have been made',
    acceptOffer: 'The offer has been accepted',
    updateOffer: 'The offer has been updated',
    retractOffer: 'The offer has been retracted',
    turnDownOffer: 'The offer has been turned down',
    complete: 'Item trade completed',
    noManners: "The trade partner didn't evaluate me:("
  },
  accept: {
    title: 'Accept Offer',
    msg1: 'Would you like to accept the offer?',
    msg2: '',
    msg3: 'After 24 hours ',
    msg4: 'of accepting the offer, the transaction will be ',
    msg5: 'automatically processed as complete',
    msg6: '.'
  },
  retract: {
    title: 'Retract Offer',
    msg: 'Would you like to retract an offer?',
    desc: 'You can only retract an offer once per item'
  },
  turnDown: {
    title: 'Turn Down Offer',
    msg: 'Would you like to turn down the offer?'
  },
  complete: {
    title: 'Manner Evaluation',
    message: 'How was the manner of trading partner?',
    evaluate: 'Trading partner evaluated you as below'
  },
  analyze: {
    title: 'Analyzing item image',
    failedAnalyze: 'Failed to analyze image',
    analyzingImage: 'Analyzing an image',
    aligningText: 'Aligning text',
    checkBasicInfo: 'Check item basic information',
    checkCharacteristics: 'Check item properties',
    checkAffixes: 'Check item affixes',
    checkRestrictions: 'Check item restrictions',
    aggregateItemInfo: 'Aggregating item information',
    nonTradable: 'This is a non-tradable item',
    qualityNotFound: 'Item quality information not found',
    typeNotFound: 'Item type information not found',
    typeValueNotFound: 'Item type value information not found',
    nameNotFound: 'Item name information not found',
    requireNotFound: 'Item requires level information not found',
    dragAndDrop: 'Drag & Drop',
    or: 'or',
    browse: 'browse',
    dragMessage:
      'Drop an item image here or paste an item image copied from the clipboard',
    notImageFormat: 'The file is not in an image format'
  },
  max: 'Max',
  min: 'Min',
  rune: {
    gain: 'Gain',
    requires: 'Requires',
    cooldown: 'Cooldown',
    second: ' Second(s)'
  },
  messages: {
    title: 'Message List',
    expire: 'Read messages will be kept for 7 days',
    newItems: 'A new item has been registered ({n})',
    newOffer: 'A (new) offer has arrived',
    acceptedOffer: 'Offer has been accepted',
    retractedOffer: 'Offer has been retracted',
    turnedDownOffer: 'Offer has been turned down',
    clipboard: 'The {t} has been copied to the clipboard',
    complete: 'Item trade completed ({in})',
    favorite: 'Added to favorite items list',
    title000: 'A (new) offer has arrived',
    title001: 'The seller has accepted your offer',
    title002: 'Item trade completed',
    title003: 'The offer was retracted by the offeror',
    title004: 'The offer was turned down by the seller',
    title900: 'The user inquiry has arrived',
    title999: "We're happy to answer your questions",
    noData: 'No messages'
  },
  history: {
    period: 'Period',
    temperatureRise: "+{degree}{'°C'}",
    temperatureDrop: "{degree}{'°C'}",
    yolkRise: '+{amount}',
    yolkDrop: '{amount}',
    description1:
      'You can only view activity history data up to three months old, including the current month.',
    description2:
      'Please note that items registered before the activity history data was stored may not display information.',
    noData: 'No activity history'
  },
  notFound: {
    gotoMain: 'Go to main page'
  },
  contact: {
    inquiries: 'Advertising / Partnership',
    title: 'Contact Discord',
    question: 'Do you need any other help?',
    contents: 'Content of inquiry',
    answer: 'Answer Inquiry',
    answerContents: 'Content of answer',
    send: 'Send',
    success: 'Your inquiry was successfully received',
    successAnswer: 'Your answer was successfully sent'
  },
  maintenance: {
    title: 'Pre-Season Maintenance Guide',
    top: 'Hello. This is Tradurs.\n\nWe would like to inform you about the regular maintenance before the new season starts on October 17, 2023 at 10:00.',
    contents: [
      { type: 'head', value: '◆ Maintenance Date' },
      {
        type: 'list',
        value: 'October 17, 2023 (Tue) 09:00 ~ Upon completion of maintenance'
      },
      { type: 'head', value: '◆ What will change' },
      { type: 'image', value: '/images/notice/20231018/season2.webp' },
      {
        type: 'list',
        value: 'Previous season data is moved to off-season (standard).'
      },
      { type: 'space' },
      { type: 'image', value: '/images/notice/20231018/pacts.webp' },
      { type: 'list', value: 'Added pact armor settings.' },
      { type: 'space' },
      { type: 'image', value: '/images/notice/20231018/ring.webp' },
      { type: 'list', value: 'Characteristics of the ring are changed.' },
      { type: 'space' },
      { type: 'image', value: '/images/notice/20231018/elixirs.webp' },
      { type: 'list', value: 'Elixir items and gem items are added.' },
      { type: 'space' },
      { type: 'image', value: '/images/notice/20231018/myspace.webp' },
      {
        type: 'list',
        value:
          'The "My Space" page is added and includes the existing "Messages" and "History" pages.'
      },
      { type: 'space' },
      { type: 'image', value: '/images/notice/20231018/manage_block.webp' },
      { type: 'list', value: '"Block" page is added to the "My Space" page.' },
      { type: 'space' },
      { type: 'image', value: '/images/notice/20231018/preset.webp' },
      { type: 'list', value: 'Filter preset feature is added.' },
      { type: 'space' }
    ],
    bottom:
      'We will notify you again when the server is normalized.\n\nThank you.',
    close: 'Do not open for 24 hours'
  },
  notice: {
    title: 'Update Notice',
    top: 'Hello. This is Tradurs. Information on adding features related to notification sounds.',
    contents: [
      {
        type: 'list',
        value:
          "Judicator's Mask, Betrayer's Husk material items have been added.",
        class: 'text-body1'
      },
      { type: 'space' },
      { type: 'image', value: '/images/notice/20250517/judicatorsmask.webp' },
      { type: 'image', value: '/images/notice/20250517/betrayershusk.webp' },
      { type: 'space' },
      { type: 'space' },
      {
        type: 'list',
        value: 'Urivar Material Set, Belial Material Set has been added.',
        class: 'text-body1'
      },
      { type: 'space' },
      { type: 'image', value: '/images/notice/20250517/urivar_set.webp' },
      { type: 'image', value: '/images/notice/20250517/belial_set.webp' },
      { type: 'space' },
      { type: 'space' }
    ],
    bottom: 'Thank you',
    close: 'Do not open for 24 hours'
  },
  adblock: {
    title: 'Please allow ads on Tradurs',
    contents:
      'It looks like you are using an ad blocker.\n\nTradurs relies on advertising to help fund our servers',
    allow: 'Allow & Refresh'
  },
  message: {
    page: 'Page {page}'
  },
  support: [
    {
      id: 'basic',
      question: 'Basic Information',
      answer: [
        { type: 'question', contents: '1. Can I trade for cash?' },
        {
          type: 'answer',
          contents:
            '→ Tradurs only allows trading using in-game currency and item, and does not allow cash trading.'
        },
        {
          type: 'question',
          contents: '2. What information is stored in the data?'
        },
        {
          type: 'answer',
          contents:
            '→ By default, we store your email, battle tag, and double-encrypted password, which are unique information that will be used for transactions.'
        },
        { type: 'question', contents: '3. Is the site secure?' },
        {
          type: 'answer',
          contents:
            '→ The site was designed with security in mind, not just transactions.'
        },
        { type: 'image', contents: 'mozilla' },
        {
          type: 'link',
          contents: 'https://observatory.mozilla.org/analyze/d4.tradurs.com',
          name: 'Mozilla Observatory - D4 Tradurs'
        },
        {
          type: 'text',
          contents:
            "Passed the security checks provided by Mozilla with a grade of 'B'"
        },
        { type: 'image', contents: 'w3' },
        {
          type: 'link',
          contents:
            'https://validator.w3.org/nu/?doc=https%3A%2F%2Fd4.tradurs.com%2F',
          name: 'W3C Markup Validation - D4 Tradurs'
        },
        {
          type: 'text',
          contents:
            'The web standards check provided by W3C shows only 1 checked item.'
        }
      ]
    },
    {
      id: 'qna',
      question: 'Frequently asked questions',
      answer: [
        {
          type: 'question',
          contents:
            '1. What is the fixed item at the top of the item list (blood mark in the upper right corner of the box)?'
        },
        {
          type: 'answer',
          contents:
            '→ One of the items from the top users in each category of the weekly awards will appear as a sticky.'
        },
        {
          type: 'question',
          contents: '2. Item editing and deletion, image analysis is disabled.'
        },
        {
          type: 'answer',
          contents:
            '→ The item has a suggestion request. Please be sure to check the item carefully when registering.'
        },
        {
          type: 'answer',
          contents:
            '→ If only retracted or turned down offers remain, editing and deleting items and analyzing images will be enabled again.'
        },
        {
          type: 'question',
          contents:
            "3. I can't see the items I've registered or the items with suggestion requests?"
        },
        {
          type: 'answer',
          contents:
            "→ While logged in, please check the filter on the left side > Only For Me > 'My items', 'Have made an offer', and use the desired filter value."
        },
        {
          type: 'answer',
          contents:
            "→ If you check 'My items', the sub-checked 'Have been offered' filter will be activated, and you can filter only the items with suggestion requests among your items."
        },
        {
          type: 'question',
          contents: '4. Can I set up a resale if the transaction is canceled?'
        },
        {
          type: 'answer',
          contents:
            "→ You cannot cancel a trade after the offer has been accepted. If the other party is at fault, please rate them rude and re-list the item using the 'Copy Template' function in the Help menu."
        },
        {
          type: 'question',
          contents: '5. Are there any penalties for unkind raters?'
        },
        {
          type: 'answer',
          contents:
            '→ We plan to penalize non-mannered reviewers if their score exceeds the threshold for a period of time.'
        },
        { type: 'question', contents: "6. Can't I remove 'Get An Offer'?" },
        {
          type: 'answer',
          contents:
            "→ Left filter > 'Show only priced' to see only items with stated prices."
        },
        {
          type: 'answer',
          contents:
            "→ 'Get An Offer' is only available to BattleTag-authenticated users."
        },
        { type: 'question', contents: '7. When will the yolk be served?' },
        {
          type: 'answer',
          contents:
            '→ If you log in again or consume or retrieve yolks (when checking your account information), you will receive up to 30 yolks per day. (day of registration x)'
        },
        {
          type: 'question',
          contents: "8. I can't use the image analysis function normally."
        },
        {
          type: 'answer',
          contents:
            "→ We're working on it, but images of items that are not game captures with low resolution (300 DPI is the recommended resolution for the engine you're using) are not recognized."
        },
        {
          type: 'question',
          contents: "9. Why can't I see item states separately?"
        },
        {
          type: 'answer',
          contents:
            "→ You can filter using the left filter > 'Item status' selection box."
        },
        {
          type: 'question',
          contents:
            '10. What happens to my existing trade items when a new season starts?'
        },
        {
          type: 'answer',
          contents:
            '→ With each new season, seasonal items are moved to the Eternal Realm (Standard).'
        },
        {
          type: 'question',
          contents: '11. How do I assign greater affixes to an item?'
        },
        {
          type: 'answer',
          contents:
            '→ Greater affixes cannot be handled by item recognition, so you can add or edit them manually by clicking the icon on the left side of the affix to activate it.'
        },
        {
          type: 'question',
          contents: '12. How do I authenticate my battle tag?'
        },
        {
          type: 'answer',
          contents:
            "→ You can process it in the 'Change BattleTag™' section on the Tradurs Information Change page."
        },
        {
          type: 'answer',
          contents:
            '1. Check whether the battle tag name specified on the information change page matches the Battle.net account you are currently logged in or will be logging into.'
        },
        {
          type: 'answer',
          contents:
            "2. To complete authentication, click the 'VERIFY' button on the right side of the battle tag input field to log in to your actual Battle.net account."
        },
        {
          type: 'answer',
          contents:
            '3. If authentication fails even though the battle tag confirmed in step 1 matches, please proceed with authentication in another browser, or log out of your Battle.net account and proceed with Tradurs Battle Tag authentication again.'
        }
      ]
    },
    {
      id: 'join',
      question: 'How do I sign up?',
      answer: [
        { type: 'image', contents: '01_login' },
        {
          type: 'text',
          contents: '1. Click the Sign in button in the upper right corner..'
        },
        { type: 'image', contents: '01_mobile' },
        {
          type: 'text',
          contents:
            '1.1. On mobile, click the More icon in the top right corner and click the Sign In button.'
        },
        { type: 'image', contents: '02_join' },
        {
          type: 'text',
          contents:
            '2. Use your social login or click the "New to Tradurs?" link to go to the signup page. (If this is your first time using Social Login, you\'ll still need to go through the signup process.)'
        },
        { type: 'image', contents: '03_join' },
        {
          type: 'text',
          contents:
            "3. Because of the email verification process, you'll need to sign up using the email address you actually use."
        },
        { type: 'image', contents: '04_join' },
        {
          type: 'text',
          contents:
            '4. If you sign up via social login, a random password will be auto-populated. You can also sign up by entering a password of your choice.'
        },
        {
          type: 'text',
          contents:
            'When signing up for social login, please make sure that the address is one that can actually receive emails.\nEven if you use social login, you must go through the initial registration process (account verification process).',
          classes: 'text-orange-10 text-weight-bold text-body1'
        },
        { type: 'image', contents: '05_verify' },
        {
          type: 'text',
          contents:
            "5. If the email is successful, you'll see a notification like the one in the image. If verification is not completed within 24 hours, the account is automatically deleted."
        },
        { type: 'image', contents: '06_verify' },
        {
          type: 'text',
          contents:
            "6. Go to the inbox of the email you used to sign up and you'll see a verification email like the one above.\n(If you don't see the mail, check your spam folder.)"
        },
        { type: 'image', contents: '07_verify' },
        {
          type: 'text',
          contents:
            "7. If your account is successfully verified, you'll see a notification like the one in the image."
        },
        { type: 'image', contents: '08_battletag' },
        {
          type: 'text',
          contents:
            '8. After logging in and navigating to the Tradurs Diablo® IV page, you will be prompted to enter your battle tag. (For normal use, enter the battle tag you are using.)'
        },
        { type: 'image', contents: '09_battletag' },
        {
          type: 'text',
          contents:
            '9.1. You can edit your battle tag on the Change User Information page. (If a battle tag already exists, it cannot be changed.)\nYou can authenticate your battle tag through the Authenticate button.'
        },
        { type: 'image', contents: '0901_battletag' },
        {
          type: 'text',
          contents:
            '9.2. If you are logged in, the user tooltip will show if the battle tag is authenticated or not.'
        },
        { type: 'image', contents: '10_withdrawal' },
        {
          type: 'text',
          contents:
            '10. Withdrawal is located at the bottom of the Change User Information page and is done by entering the email address you are using.'
        }
      ]
    },
    {
      id: 'register',
      question: 'How do I list an items?',
      answer: [
        { type: 'image', contents: '01_start' },
        {
          type: 'text',
          contents: '1. Click the + icon in the bottom right corner'
        },
        { type: 'image', contents: '02_description' },
        {
          type: 'text',
          contents:
            '2. The item input window opens.\nIn order from the top left,\n 1: Item tier, 2: Item quality, 3: Item type, 4: Equipment class, 5: Item image, 6: Item quantity, 7: Item name, 8: Item power, 9: Upgrade, 10: Required level, 11: Unique traits and options and constraints, 12: Trade amount, 13: Image analysis, 14: Button area.'
        },
        { type: 'image', contents: '03_tier' },
        {
          type: 'text',
          contents: '3. Select an item tier. (This is not a required selection)'
        },
        { type: 'image', contents: '04_quality' },
        { type: 'text', contents: '4. Select an item quality.' },
        { type: 'image', contents: '0401_quality' },
        {
          type: 'text',
          contents:
            '4.1. The card color changes based on the quality of the item.'
        },
        { type: 'image', contents: '0402_hardcore_ladder' },
        {
          type: 'text',
          contents:
            '4.2. Once registered, you can tell if an item is hardcore or laddered by the flag to the left of the item name on the item card.'
        },
        { type: 'image', contents: '05_base' },
        {
          type: 'text',
          contents:
            '5. Enter the item type and equipment class, item image, and quantity.'
        },
        { type: 'image', contents: '06_image' },
        {
          type: 'text',
          contents:
            '6. Clicking the Item image button opens an image picker from which you can select an image.\n(*You may have an image that is not in the list of item images.)'
        },
        { type: 'image', contents: '07_base' },
        {
          type: 'text',
          contents:
            '7. Enter the name of the item and its power, upgrade, and required level.\nThe item name and required level are *required fields.\nThe Item Power and Upgrade fields are not displayed on the item card unless they are filled in.'
        },
        { type: 'image', contents: '08_attribute' },
        {
          type: 'text',
          contents:
            "8. Now let's enter the unique attributes, options, and constraints:\nSelect the tab you want to enter in the top right corner:\nFirst, the unique attributes:\nA unique attribute is a unique property that an item has. If you select an equipment class at the top, it will automatically list all the unique attributes that that class can have."
        },
        { type: 'image', contents: '09_attribute' },
        {
          type: 'text',
          contents:
            '9. If there are additional unique attributes you would like to add, click the select box to select the desired attribute, or'
        },
        { type: 'image', contents: '10_attribute' },
        {
          type: 'text',
          contents:
            "10. You can add filtered attributes by entering your own search terms.\nAffixes and restrictions can be entered in the same way. For affixes, you can make a registration request if you can't find the affix you need."
        },
        { type: 'image', contents: '11_attribute' },
        {
          type: 'text',
          contents:
            '11. Click the + icon to the right of the selection box to open the affix registration request window.'
        },
        { type: 'image', contents: '12_attribute' },
        {
          type: 'text',
          contents:
            "12. Usually use Standard, and if you have gem in an empty socket, select a socket.\nIf the affix you want to request is 'Fast Movement Speed +10', you can enter 'Fast Movement Speed +{x}' and make a request to register it.\n(The requested affix will be checked by the Tradurs Manager and added later if it is deemed necessary)"
        },
        { type: 'image', contents: '13_attribute' },
        {
          type: 'text',
          contents:
            '13. The part where you write {x} in the added attribute becomes an input field.\nTo the right of the input field, fields for entering the minimum and maximum values of that number are also automatically displayed.'
        },
        { type: 'image', contents: '14_price' },
        {
          type: 'text',
          contents:
            "14. Now set a price for the item you want to sell:\nMoney items are currently only available for take offers/gold coins. 'Get An Offer' is only available to BattleTag-authenticated users."
        },
        { type: 'image', contents: '15_item' },
        {
          type: 'text',
          contents:
            '15. Press Apply to finalize the item registration. The item you just registered is displayed in the form of a card.'
        },
        { type: 'image', contents: '16_finish' },
        {
          type: 'text',
          contents:
            "16. On the top right of the card, to the left of the item status, you will see the time remaining until the sale ends.\nBy default, the sale period is 2 days (48 hours), if you need to extend it, click 'Edit' on the bottom left of the item."
        },
        { type: 'image', contents: '17_relist' },
        {
          type: 'text',
          contents:
            '17. In the bottom left of the edit window, select More actions > Pull to move the item to the top and renew the sale period.'
        },
        { type: 'image', contents: '18_analyze' },
        {
          type: 'text',
          contents:
            "18. The recently added feature, Analyze image, was created to improve the hassle of manually listing items, simply click 'Analyze image' in the bottom left corner of the item listing or editing window and select a well-cut image of the item."
        },
        { type: 'image', contents: '19_analyze' },
        {
          type: 'text',
          contents:
            'Item image analysis screen\n\n19. If the values except hardcore, leather, item quantity, and price are analyzed normally, the item information will be entered automatically.\n(A well-cut item image with a certain resolution or higher will achieve higher recognition results.)'
        }
      ]
    },
    {
      id: 'trade',
      question: 'How do I trade items?',
      answer: [
        {
          type: 'text',
          contents:
            '\n\n\nHere are the buyer (dark theme) and seller (light theme) screens.'
        },
        { type: 'image', contents: '01_make_offer' },
        {
          type: 'text',
          contents:
            "1. The buyer finds the item they want and clicks the 'Make Offer' button."
        },
        { type: 'image', contents: '02_make_offer' },
        {
          type: 'text',
          contents: '2. Make an offer for the desired purchase price.'
        },
        { type: 'image', contents: '03_accept_offer' },
        {
          type: 'text',
          contents:
            '3. The seller will be notified that you have made an offer.'
        },
        { type: 'image', contents: '04_accept_offer' },
        {
          type: 'text',
          contents:
            "4. The incoming offers are displayed in a card.\nIf you don't like the offer price, click 'Turn Down'."
        },
        { type: 'image', contents: '05_turndown_offer' },
        {
          type: 'text',
          contents:
            '5. You will see a confirmation window asking you to turn down the offer.\nIf you turn down the offer,'
        },
        { type: 'image', contents: '06_turndown_offer' },
        {
          type: 'text',
          contents:
            '6. The buyer who requested the offer will be notified that the offer has been turned down.'
        },
        { type: 'image', contents: '07_turndown_offer' },
        {
          type: 'text',
          contents:
            "7. Click the Go link and the status of the offer card will be updated to 'Offer turned down' - If your offer is turned down, you can still *request* an offer for the item."
        },
        { type: 'image', contents: '08_remake_offer' },
        {
          type: 'text',
          contents:
            '8. Request an offer again with a new price.\nThe buyer can also retract an offer once *if no trade is in progress*.'
        },
        { type: 'image', contents: '09_retract_offer' },
        {
          type: 'text',
          contents:
            '9. You will see a confirmation window asking if you want to retract the offer.\nIf you do, the seller will be notified that the offer has been retracted.\n\nYou can only retract an offer once per *item.'
        },
        { type: 'image', contents: '04_accept_offer' },
        {
          type: 'text',
          contents:
            "10.1. Let's go back to number 4 and accept the offer.\n Click the 'Accept' button."
        },
        { type: 'image', contents: '10_accept_offer' },
        {
          type: 'text',
          contents:
            '10.2. You will see a confirmation window asking you to accept the offer.\n If you accept the offer,'
        },
        { type: 'image', contents: '11_proceed_trade' },
        {
          type: 'text',
          contents:
            "11. The buyer will be notified of the offer acceptance, and the offer card will change to 'Trade in progress' (completion screen) when they click the go link."
        },
        { type: 'image', contents: '12_proceed_trade' },
        {
          type: 'text',
          contents:
            "12. The seller's offer card will also change to 'Trade in progress'. nNow the buyer's battle tag will be displayed.nClick to copy the battle tag to the clipboard."
        },
        { type: 'image', contents: '13_proceed_trade' },
        {
          type: 'text',
          contents:
            "13. The buyer will also see the seller's battle tag on the item card.\nClick to copy the battle tag to the clipboard.\nYou will now proceed to trade the item via each other's battle tag.\nWhen the item status changes to 'Trade in progress', you have *24 hours to complete the trade.\nAfter 24 hours, the item will automatically change to 'Trade complete' status.\n(Note the fixed 1 degree drop in manor temperature when processing automatically.)"
        },
        { type: 'image', contents: '1401_evaluation' },
        { type: 'image', contents: '1402_evaluation' },
        {
          type: 'text',
          contents:
            "14. Now the seller and buyer can leave a manners rating for each other's transaction by clicking the Done button.\n\n*If the other party doesn't contact you or doesn't make a sale or purchase,\n\n*you still need to complete the transaction so that you get your yolk back and don't get penalized for not completing the transaction."
        },
        { type: 'image', contents: '15_evaluation' },
        {
          type: 'text',
          contents:
            "15. When you're done with each other, you can see the manners evaluation that the other person left."
        },
        { type: 'image', contents: '16_copy' },
        {
          type: 'text',
          contents:
            "16. If the transaction is canceled, you can easily re-register the item using the 'Copy Template' function located on the item card > right side of the item name > More icon."
        },
        { type: 'image', contents: '1701_sound' },
        {
          type: 'text',
          contents:
            '17.1. If you want to hear a notification sound when you receive a message, click on the left side of the browser (Chrome) address bar,'
        },
        { type: 'image', contents: '1702_sound' },
        { type: 'text', contents: "17.2. Select 'Site Settings'." },
        { type: 'image', contents: '1703_sound' },
        {
          type: 'text',
          contents:
            "17.3. Change the value of the 'Sound' tab to 'Allow' and you should now be able to hear the notification sound."
        }
      ]
    },
    {
      id: 'batch',
      question: 'How do I use the item batch processing feature?',
      answer: [
        { type: 'image', contents: '01_filter' },
        {
          type: 'text',
          contents:
            "1. First, to use the batch processing feature, activate the 'My Items' item in the 'Only For Me' group."
        },
        { type: 'image', contents: '02_active' },
        {
          type: 'text',
          contents:
            "2. The batch processing feature is displayed at the top of the item list,\n and a checkbox is added to the left of the 'item name' of the item item."
        },
        { type: 'image', contents: '03_select' },
        {
          type: 'text',
          contents:
            '3. Select the items you want to batch process.\n Even if you scroll the item list, the batch processing feature UI remains fixed at the top.'
        },
        { type: 'image', contents: '04_01_dropdown' },
        {
          type: 'text',
          contents:
            "4.1. Once item selection is complete, select the 'drop-down icon' on the right side of the batch processing feature UI."
        },
        { type: 'image', contents: '04_02_dropdown' },
        {
          type: 'text',
          contents:
            '4.2. Select the desired function: Relist, Suspend Sale, Resume Sale, Re-Register or Delete.'
        },
        { type: 'image', contents: '05_confirm' },
        {
          type: 'text',
          contents:
            "5. A confirmation window will appear asking if you want to proceed with batch processing, and when you click 'Accept', batch processing will begin."
        },
        { type: 'image', contents: '06_failed' },
        {
          type: 'text',
          contents:
            '6. When batch processing is completed, the items that failed to process and the reason for failure are displayed.\n(If all were processed normally, failed items will not be displayed.) '
        }
      ]
    },
    {
      id: 'greater',
      question: 'How do I activate greater affixes?',
      answer: [
        { type: 'image', contents: '01_greater' },
        {
          type: 'text',
          contents:
            'When registering or modifying an item, click the icon on the left of the affix you want to change to greater status among the affixes added to the Attributes > Affixes tab,'
        },
        { type: 'image', contents: '02_greater' },
        { type: 'text', contents: 'to activated it as a greater affix.' }
      ]
    },
    {
      id: 'yolk',
      question: "What is 'yolk'?",
      answer: [
        { type: 'image', contents: '01_yolk' },
        {
          type: 'text',
          contents:
            'Top-right user icon\n(Mobile More icon > User icon)\nto see how many yolks you currently have.\n\nAs of 2024-06-03,\n\nYou are granted 30 yolks when you sign up.\n\nUp to 30 yolks are recharged per day.\n\nWhen charging, if you own more than 30 yolks, no more will be added.\n\nIt cannot be sold or shared between users.\n\nOne is consumed when listing, relisting, or offering an item,\n\nand is redeemed when the item trade is successfully completed.\n\nThis is to discourage frivolous item registrations or\nrequests for suggestions, and the number of uses or grants may change in the future.'
        }
      ]
    },
    {
      id: 'allow',
      question: 'How do I allow Tradurs in my ad blocker?',
      answer: [
        { type: 'image', contents: '01_unicorn' },
        { type: 'text', contents: '1. Unicorn' },
        {
          type: 'text',
          contents: 'Add tradurs.com by selecting Unicorn Settings > Whitelist'
        },
        { type: 'image', contents: '02_adblock' },
        { type: 'text', contents: '2. AdBlock' },
        {
          type: 'text',
          contents:
            "If you are using an ad block extension, click on the ad block extension icon when you are on the tradur's site and set it to Always"
        },
        { type: 'image', contents: '03_adguard' },
        { type: 'text', contents: '3. AdGuard' },
        {
          type: 'text',
          contents: 'Add tradurs.com by selecting AdGuard Settings > Whitelist'
        },
        { type: 'image', contents: '04_ublock' },
        { type: 'text', contents: '4. uBlock Origin' },
        {
          type: 'text',
          contents:
            'Add tradurs.com by selecting User Block Settings > Trusted sites'
        }
      ]
    }
  ],
  awards: {
    description:
      '* Awards rankings are calculated based on internally determined criteria, not just the sum of data for each event',
    highPriced: {
      category: 'Top 5 selling prices for the past week',
      desc: ''
    },
    bestManners: {
      category: 'Top 5 manners for the past week',
      desc: ''
    },
    mostSold: {
      category: 'Top 5 sales in the past week',
      unit: '',
      desc: ''
    },
    mostPurchased: {
      category: 'Top 5 most purchased in the past week',
      unit: '',
      desc: ''
    },
    noData: 'No awards'
  },
  socket: {
    '0900': 'Notify information authentication failed',
    disconnect:
      'The connection to the notification server has been disconnected.'
  }
}
