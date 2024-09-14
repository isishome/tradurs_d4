export default {
  language: '언어',
  decimal: {
    style: 'decimal', minimumSignificantDigits: 3, maximumSignificantDigits: 5
  },
  seo: {
    title: "{itemName}{pageName}디아블로® IV {'|'} 트레이더스",
    desc: '트레이더스에서 디아블로® IV에 사용하는 다양한 아이템을 거래해 보세요',
    keywords: '디아4, 디아 4, 디아블로4, 디아블로 4, 디아, 디아블로, 거래, 거래소, 트레이드, 거래 사이트, 트레이드 사이트'
  },
  page: {
    tradeList: '거래 목록',
    itemInfo: '아이템 정보',
    awards: '어워즈',
    mySpace: '내 공간',
    messages: '메시지',
    blocks: '차단 관리',
    history: '활동 내역',
    support: '도움말',
    admin: '관리자',
    adminUser: '사용자 관리',
    adminItem: '아이템 관리',
    adminAffix: '속성 관리',
    pnf: '페이지를 찾을 수 없습니다',
    ftc: '데이터 서버에 문제가 발생했습니다'
  },
  battlenet: {
    title: 'BattleTag™ 입력',
    msg1: '',
    msg2: '의 정상적인 서비스 이용을 위해 Battle.net 에서 사용하는 BattleTag™를 입력해야 합니다.',
    desc: '배틀태그는 Tradurs 사용자 정보 페이지에서 언제나 수정 가능합니다',
    placeholder: '레비아탄#5112'
  },
  filter: {
    basic: '기본 필터',
    onlyCurrency: '가격 명시만 보기',
    all: '전체',
    onlyForMe: '나만의 검색',
    status: '아이템 상태',
    detail: '아이템 상세',
    type: '종류',
    advanced: '속성 필터',
    mine: '내 아이템',
    offered: '제안받은 아이템',
    offer: '제안 요청 아이템',
    preset: '필터 프리셋',
    presetName: '프리셋 명',
    noPreset: '프리셋을 추가해 주세요',
    selectPreset: '프리셋을 선택하세요',
    basicDescription: '기본 필터 정보는 사용자 저장소에 저장됩니다. 아이템 등록 시 하드코어와 시즌 여부는 기본 필터 정보에 의해 자동으로 설정됩니다.',
    presetDescription: '현재 설정되어 있는 필터 값들을 저장해두는 기능입니다. 최대 5개의 프리셋을 저장할 수 있습니다.',
    affixDescription: '속성 검색은 최대 6개의 속성 항목을 선택할 수 있고, 5개의 속성을 선택한 경우 5개 중 조합된 4개를 포함한 아이템들도 함께 검색됩니다.',
    description: {
      advanced: '속성 필터 사용 시 \'고유 속성\'과 \'속성\'을 구분해서 사용하세요',
      advanced2: '간혹 판매자가 \'고유 속성\'과 \'속성\'을 잘못 입력하는 경우가 있으니 이점 고려하여 필터 하세요'
    }
  },
  sort: {
    options: [
      { value: 'date_desc', label: '신규 아이템순' },
      { value: 'price_desc', label: '높은 가격순' },
      { value: 'price_asc', label: '낮은 가격순' },
      { value: 'popular_desc', label: '제안 많은 순' },
    ]
  },
  selectAll: '전체 선택',
  preset: {
    title: '프리셋 삭제',
    message: '해당 프리셋을 삭제할까요?'
  },
  season: {
    bg: '/images/season/005/season_emblem_ko.webp',
    first: {
      socket: '악의 종자 시즌에는 장신구 아이템 옵션의 홈 유형을 정확하게 선택할수록 아이템의 노출 빈도가 높아집니다'
    },
    second: {
      pact: '피의 시즌에는 방어구에 서약을 부여하여 흡혈귀의 힘을 해방할 수 있습니다',
      ferocity: '야성',
      divinity: '신성',
      eternity: '영원'
    }
  },
  noFilterdItems: '조건에 맞는 검색 결과가 없습니다',
  noFilterdItemsDesc: '아이템 필터를 확인해 보세요',
  noItem: '아이템 정보가 존재하지 않습니다',
  seller: '판매자',
  offerer: '제안자',
  user: {
    signout: '로그아웃',
    info: '정보 변경',
    battleTag: 'BattleTag™',
    yolk: '노른자',
    temperature: '매너 온도',
    notify: {
      title: '알림',
      new: '새 아이템',
      private: '거래',
      email: '이메일'
    },
    sh1: '거래가 ',
    sh2: '완료',
    sh3: '되지 않거나 판매자와 거래가 ',
    sh4: '진행 중이 아닌 경우',
    sh5: ' 배틀태그가 노출되지 않습니다'
  },
  searchOrSelect: '검색 / 선택',
  noMessage: '입력 한 텍스트와 매칭되는 {attr}을 찾을 수 없습니다',
  power: '능력',
  properties: '고유 속성',
  affixes: '속성',
  restrictions: '제약 조건',
  relistItem: {
    title: '아이템 끌어올림',
    message: '해당 아이템을 끌어올림 할까요?'
  },
  relistItems: {
    title: '아이템 일괄 끌어올림',
    subTitle: '선택한 아이템을 모두 일괄 끌어올림 할까요?',
    message: '끌어올림 할 수 없는 아이템이 선택된 경우 처리 중 제외됩니다.',
    failedTitle: '아이템 일괄 끌어올림 실패 항목'
  },
  statusItem: {
    suspendTitle: '아이템 판매 보류',
    suspendMessage: '해당 아이템을 판매 보류 할까요?',
    resumeTitle: '아이템 판매 재개',
    resumeMessage: '해당 아이템을 판매 재개 할까요?'
  },
  statusItems: {
    title: '아이템 일괄 {type}',
    subTitle: '선택한 아이템을 모두 일괄 {type}할까요?',
    message: '{type}할 수 없는 아이템이 선택된 경우 처리 중 제외됩니다.',
    failedTitle: '아이템 일괄 {type} 실패 항목'
  },
  reRegisterItem: {
    title: '아이템 재등록',
    message: '해당 아이템을 재등록할까요?'
  },
  reRegisterItems: {
    title: '아이템 일괄 재등록',
    subTitle: '선택한 아이템을 모두 재등록 할까요?',
    message: '재등록할 수 없는 아이템이 선택된 경우 처리 중 제외됩니다.',
    failedTitle: '아이템 일괄 재등록 실패 항목'
  },
  deleteItem: {
    title: '아이템 삭제',
    message: '해당 아이템을 삭제할까요?'
  },
  deleteItems: {
    title: '아이템 일괄 삭제',
    subTitle: '선택한 아이템을 모두 일괄 삭제할까요?',
    message: '삭제할 수 없는 아이템이 선택된 경우 처리 중 제외됩니다.',
    failedTitle: '아이템 일괄 삭제 실패 항목'
  },
  blockUser: {
    title: '사용자 차단',
    unblockTitle: '사용자 차단 해제',
    message: '해당 사용자를 차단할까요?',
    unblockMessage: '해당 사용자의 차단을 해제할까요?',
    block: '차단',
    unblock: '차단 해제',
    caption: '차단 해제는 48시간 이후 가능합니다',
    complete: '사용자 차단이 완료되었습니다',
    unblockComplete: '사용자 차단 해제가 완료되었습니다',
    noData: '차단된 사용자가 없습니다'
  },
  btn: {
    edit: '수정하기',
    cancel: '취소',
    add: '추가',
    apply: '적용',
    relist: '끌어올림',
    delete: '삭제',
    moreActions: '추가작업',
    suspend: '판매 보류',
    resume: '판매 재개',
    accept: '수락',
    close: '닫기',
    makeOffer: '제안하기',
    offer: '제안',
    refresh: '새로고침',
    move: '이동',
    complete: '완료 처리',
    submit: '제출하기',
    attributeFilter: '속성 검색',
    resetFilter: '검색 초기화',
    favorite: '관심 목록에 추가',
    unfavorite: '관심 목록에서 삭제',
    copy: '템플릿 복사',
    share: '공유',
    gotoItem: '아이템 바로가기',
    markRead: '읽음으로 표시',
    retractOffer: '제안 철회',
    turnDownOffer: '제안 거절',
    turnDown: '거절',
    imageAnalysis: '이미지 분석',
    newMessages: '새 메시지가 있습니다',
    request: '요청',
    block: '차단',
    unblock: '차단 해제',
    bulkUnblock: '일괄 차단 해제',
    showMore: '더보기',
    leave: '나가기',
    open: '만들기',
    join: '입장',
    allow: '광고 허용 방법',
    confirm: '확인',
    reRegister: '재등록',
    reConnect: '재연결'
  },
  attribute: {
    request: '{attr} 추가 요청',
    placeholder: "공격 회피 후 {'{'}x{'}'}초 동안  +{'{'}x{'}'} 공격 속도 증가",
    enter: '{attr}을 입력해 주세요',
    invalid: '잘못된 형식의 {attr} 입니다',
    exists: '이미 존재하는 {attr} 입니다',
    continuous: '연속 추가',
    complete: '옵션 추가 요청이 완료되었습니다',
    open: '옵션 열기',
    close: '속성 닫기'
  },
  item: {
    hardcore: '하드코어',
    softcore: '소프트코어',
    ladder: '증오의 그릇 시즌',
    seasonal: '시즌',
    eternal: '영원',
    quality: '아이템 등급',
    selectType: '아이템 유형',
    selectClass: '{type} 선택',
    selectRuneType: '룬 유형 선택',
    selectRune: '룬 선택',
    selectAspectCategory: '위상 범주',
    selectGem: '보석 선택',
    selectElixir: '비약 선택',
    selectSummoning: '소환 재료 선택',
    selectImage: '{tv} 이미지 선택',
    name: '아이템 명',
    power: '아이템 위력 {p}{u}',
    upgrade: '업그레이드: {u}/{ul}',
    level: '요구 레벨',
    gold: '금화',
    url: '아이템 주소',
    favorites: '관심 아이템',
    forDisplay: '전시용',
    expanded: '항상 아이템 확장'
  },
  price: {
    title: '가격',
    currency: '화폐 유형',
    quantity: '수량',
    getOffer: '제안받기',
    restrictGold: '판매/구매 가격은 최저 100,000 금화 이상 설정해야 합니다'
  },
  offer: {
    title: '가격 제안',
    list: '제안 목록',
    accepted: '수락됨',
    noOffer: '제안 내역이 없습니다',
    acceptOffer: '제안이 수락되었습니다',
    updateOffer: '제안 내용이 수정되었습니다',
    retractOffer: '제안이 철회되었습니다',
    turnDownOffer: '제안을 거절했습니다',
    complete: '아이템 거래가 완료되었습니다',
    noManners: '상대방이 나를 평가하지 않았어요:('
  },
  accept: {
    title: '제안 수락',
    msg1: '제안을 수락 하시겠습니까?',
    msg2: '제안 수락 후 ',
    msg3: '24시간이 지나면 ',
    msg4: '해당 거래는 ',
    msg5: '자동으로 완료 처리',
    msg6: '됩니다.'
  },
  retract: {
    title: '제안 철회',
    msg: '제안을 철회 하시겠습니까?',
    desc: '제안 철회는 아이템 당 1회만 가능합니다'
  },
  turnDown: {
    title: '제안 거절',
    msg: '제안을 거절 하시겠습니까?'
  },
  complete: {
    title: '매너 평가',
    message: '거래를 진행 한 상대는 어떠셨나요?',
    evaluate: '상대는 나를 이렇게 평가했어요'
  },
  analyze: {
    title: '아이템 이미지 분석',
    failedAnalyze: '이미지 분석이 실패했습니다',
    analyzingImage: '이미지 분석 중',
    aligningText: '텍스트 정렬 중',
    checkBasicInfo: '아이템 기본 정보 체크',
    checkCharacteristics: '아이템 고유 특성 체크',
    checkAffixes: '아이템 옵션 체크',
    checkRestrictions: '아이템 제약 조건 체크',
    aggregateItemInfo: '아이템 정보 취합 중',
    nonTradable: '거래 불가능한 아이템입니다',
    qualityNotFound: '아이템 품질 정보를 찾지 못했습니다',
    typeNotFound: '아이템 유형 정보를 찾지 못했습니다',
    typeValueNotFound: '아이템 유형 값 정보를 찾지 못했습니다',
    nameNotFound: '아이템 명 정보를 찾지 못했습니다',
    requireNotFound: '아이템 요구 레벨 정보를 찾지 못했습니다',
    dragAndDrop: '드래그 & 드롭',
    or: '또는',
    browse: '파일 선택',
    dragMessage: '이곳에 아이템 이미지를 드롭 하거나 클립보드에 복사된 아이템 이미지를 붙여넣기 하세요',
    notImageFormat: '이미지 형식의 파일이 아닙니다'
  },
  max: '최대',
  min: '최소',
  rune: {
    gain: '획득',
    requires: '필요',
    cooldown: '재사용 대기시간',
    second: '초'
  },
  messages: {
    title: '메세지 리스트',
    expire: '읽은 메시지는 7일간 보관됩니다',
    newItems: '새로운 아이템이 등록되었습니다 ({n})',
    newOffer: '(새) 제안 요청이 도착했습니다',
    acceptedOffer: '제안이 수락되었습니다',
    retractedOffer: '제안이 철회되었습니다',
    turnedDownOffer: '제안이 거절되었습니다',
    clipboard: '{t}이(가) 클립보드로 복사되었습니다',
    complete: '아이템 거래가 완료되었습니다 ({in})',
    favorite: '관심 아이템 목록에 추가되었습니다',
    title000: '(새) 제안 요청이 도착했습니다',
    title001: '판매자가 제안을 수락했습니다',
    title002: '아이템 거래가 완료되었습니다',
    title003: '제안자가 제안을 철회했습니다',
    title004: '판매자가 제안을 거절했습니다',
    title900: '사용자 문의가 도착했습니다',
    title999: '문의하신 내용 답변드립니다',
    noData: '수신된 메시지가 없습니다'
  },
  history: {
    period: '기간',
    temperatureRise: "+{degree}{'°C'}",
    temperatureDrop: "{degree}{'°C'}",
    yolkRise: "+{amount}개",
    yolkDrop: "{amount}개",
    description1: '활동 내역은 이번 달을 포함하여 최대 3개월 이전 데이터까지만 조회 가능합니다.',
    description2: '활동 내역 데이터 저장 이전에 등록된 아이템은 정보가 표시되지 않을 수 있으니 이점 참고하세요.',
    noData: '활동 내역이 없습니다'
  },
  notFound: {
    gotoMain: '메인 페이지로'
  },
  contact: {
    inquiries: '광고 및 제휴 문의',
    title: '디스코드로 문의 하기',
    contents: '문의 내용',
    answer: '답변 하기',
    answerContents: '답변 내용',
    question: '다른 도움이 필요하신가요?',
    send: '전송',
    success: '문의 내용이 정상적으로 접수되었습니다',
    successAnswer: '답변 내용이 정상적으로 접수되었습니다'
  },
  maintenance: {
    title: '시즌 시작 전 정기점검 안내',
    top: '안녕하세요. 트레이더스입니다.\n\n새로운 시즌이 시작되는 2023년 10월 18일 02:00 이전에 정기점검 안내드립니다.',
    contents: [
      { type: 'head', value: '◆ 점검 일자' },
      { type: 'list', value: '2023년 10월 18일(수) 01:00 ~ 점검 완료 시' },
      { type: 'head', value: '◆ 변동 사항' },
      { type: 'image', value: '/images/notice/20231018/season2.webp' },
      { type: 'list', value: '이전 시즌 데이터가 비시즌(스탠)으로 이동됩니다.' },
      { type: 'space' },
      { type: 'image', value: '/images/notice/20231018/pacts.webp' },
      { type: 'list', value: '서약 방어구 설정이 추가됩니다.' },
      { type: 'space' },
      { type: 'image', value: '/images/notice/20231018/ring.webp' },
      { type: 'list', value: '반지의 기본 특성이 변경됩니다.' },
      { type: 'space' },
      { type: 'image', value: '/images/notice/20231018/elixirs.webp' },
      { type: 'list', value: '비약 아이템 및 보석 아이템이 추가됩니다.' },
      { type: 'space' },
      { type: 'image', value: '/images/notice/20231018/myspace.webp' },
      { type: 'list', value: '"내 공간" 페이지가 추가되며 기존 "메시지" 및 "활동 내역" 페이지가 포함됩니다.' },
      { type: 'space' },
      { type: 'image', value: '/images/notice/20231018/manage_block.webp' },
      { type: 'list', value: '"내 공간" 페이지에 차단 관리 페이지가 추가됩니다.' },
      { type: 'space' },
      { type: 'image', value: '/images/notice/20231018/preset.webp' },
      { type: 'list', value: '필터 프리셋 기능이 추가됩니다.' },
      { type: 'space' }
    ],
    bottom: '서버가 정상화되면 다시 공지를 통해 안내해 드리도록 하겠습니다.\n\n감사합니다.',
    close: '24시간 동안 열지 않기'
  },
  notice: {
    title: '업데이트 안내',
    top: '안녕하세요. 트레이더스입니다. 변경 된 사항 안내드립니다.',
    contents: [
      { type: 'head', value: '◆ 변경 사항' },
      { type: 'list', value: '하루 최대 충전되는 노른자 수가 변경되었습니다.', class: 'text-weight-bold text-subtitle2' },
      { value: '30개 > 50개', class: 'text-weight-bold q-ml-xl q-my-sm text-orange text-h6' },
      { type: 'space' }
    ],
    bottom: '감사합니다.',
    close: '24시간 동안 열지 않기'
  },
  adblock: {
    title: '트레이더스에서 광고를 허용해 주세요',
    contents: '광고 차단 프로그램을 사용 중인 것 같습니다.\n\n트레이더스는 광고를 통해 서버 운영비를 지원받습니다.',
    allow: '허용함 & 새로고침'
  },
  message: {
    page: '페이지 {page}'
  },
  support: [
    {
      id: 'basic',
      question: '기본 정보',
      answer: [
        { type: 'question', contents: '1. 현금 거래도 가능한가요?' },
        { type: 'answer', contents: '→ 트레이더스는 게임 내 재화를 이용한 거래만 허용되며, 현금 거래를 허용하지 않습니다.' },
        { type: 'question', contents: '2. 어떤 정보가 데이터에 저장되나요?' },
        { type: 'answer', contents: '→ 기본적으로 거래에 사용될 고유 정보인 이메일과 배틀태그, 이중으로 암호화 된 비밀번호가 저장됩니다.' },
        { type: 'question', contents: '3. 사이트는 안전한가요?' },
        { type: 'answer', contents: '→ 사이트 설계 시 단순히 거래만이 아닌 보안에도 중점을 두고 개발되었습니다.' },
        { type: 'image', contents: 'mozilla' },
        { type: 'link', contents: 'https://observatory.mozilla.org/analyze/d4.tradurs.com', name: 'Mozilla Observatory - D4 Tradurs' },
        { type: 'text', contents: '모질라(Mozilla)에서 제공하는 보안 체크를 \'B\' 등급으로 통과하였습니다.' },
        { type: 'image', contents: 'w3' },
        { type: 'link', contents: 'https://validator.w3.org/nu/?doc=https%3A%2F%2Fd4.tradurs.com%2F', name: 'W3C Markup Validation - D4 Tradurs' },
        { type: 'text', contents: 'W3C에서 제공하는 웹 표준 체크에 1건의 체크 항목만 표시됩니다.' }
      ]
    },
    {
      id: 'qna',
      question: '자주 묻는 질문',
      answer: [
        { type: 'question', contents: '1. 아이템 목록 최상단에 고정으로 나오는 아이템(박스 우측 상단 혈흔 표식)은 무엇인가요?' },
        { type: 'answer', contents: '→ 주간 어워즈 각 부문 1위 사용자들의 아이템 중 하나가 고정으로 표시됩니다.' },
        { type: 'question', contents: '2. 아이템 수정 및 삭제, 이미지 분석이 비 활성화입니다.' },
        { type: 'answer', contents: '→ 아이템에 제안 요청이 있는 경우입니다. 반드시 등록하실 때 항목을 꼼꼼히 확인하고 등록해 주세요.' },
        { type: 'answer', contents: '→ 철회되거나 거절된 제안만 남은 경우 아이템 수정 및 삭제, 이미지 분석이 다시 활성화됩니다.' },
        { type: 'question', contents: '3. 내가 등록한 아이템이나 제안 요청 한 아이템을 볼 수 없나요?' },
        { type: 'answer', contents: '→ 로그인한 상태에서 좌측 필터 > 나만의 검색 항목 > \'내 아이템\', \'제안 요청 아이템\' 중 원하는 필터값을 체크해서 사용하시면 됩니다.' },
        { type: 'answer', contents: '→ 내 아이템\'을 체크하면 서브 체크 항목인 \'제안받은 아이템\' 필터가 활성화되며, 내 아이템 중 제안 요청이 있는 아이템만 필터가 가능합니다.' },
        { type: 'question', contents: '4. 거래가 무산된 경우 재 판매 설정을 할 수 있나요?' },
        { type: 'answer', contents: '→ 제안이 수락된 이후에는 거래를 취소할 수 없습니다. 상대방 과실이 있을 경우 비 매너 평가해 주시고 도움말 메뉴에 나온 \'템플릿 복사\' 기능을 이용해 아이템을 재등록해 주셔야 합니다.' },
        { type: 'question', contents: '5. 비 매너 평가자에게 페널티는 없나요?' },
        { type: 'answer', contents: '→ 비 매너 평가 점수가 일정 기간 동안 기준을 초과한 경우 페널티를 줄 예정입니다.' },
        { type: 'question', contents: '6. 아이템 가격 제안을 없앨 수 없나요?' },
        { type: 'answer', contents: '→ 좌측 필터 > \'가격 명시만 보기\'를 체크하셔서 가격이 명시된 아이템만 보기가 가능합니다.' },
        { type: 'answer', contents: '→ \'제안받기\'는 배틀태그 인증 사용자만 설정할 수 있습니다.' },
        { type: 'question', contents: '7. 노른자는 언제 제공되나요?' },
        { type: 'answer', contents: '→ 새로 로그인하거나 노른자를 소모 또는 회수하는 경우(계정 정보를 체크할 시) 일일 최대 30개의 노른자가 제공됩니다. (가입 당일 x)' },
        { type: 'question', contents: '8. 이미지 분석 기능을 정상적으로 사용할 수 없어요.' },
        { type: 'answer', contents: '→ 계속 개선 중이긴 하나 해상도가 낮거나(사용 중인 엔진의 추천 해상도 300 DPI) 인 게임 캡처가 아닌 아이템 이미지는 인식률이 떨어집니다.' },
        { type: 'question', contents: '9. 아이템 상태를 구분해서 볼 수 없나요?' },
        { type: 'answer', contents: '→ 좌측 필터 > \'아이템 상태\' 선택 상자를 이용해 필터 가능합니다.' },
        { type: 'question', contents: '10. 새 시즌이 시작되면 기존 거래 아이템들은 어떻게 되나요?' },
        { type: 'answer', contents: '→ 시즌이 새로 시작될 때마다 시즌 아이템은 영원의 영역(스탠더드)로 이동됩니다.' },
        { type: 'question', contents: '11. 아이템 상급 속성은 어떻게 지정하나요?' },
        { type: 'answer', contents: '→ 상급 속성은 아이템 인식으로 처리할 수 없어 직접 속성 추가, 수정 시 속성 좌측의 아이콘을 클릭하여 활성화하시면 됩니다.' },
        { type: 'question', contents: '12. 배틀 태그 인증이 어떻게 하나요?' },
        { type: 'answer', contents: '→ 트레이더스 정보 변경 페이지의 \'BattleTag™ 변경\' 항목에서 처리하면 됩니다.' },
        { type: 'answer', contents: '1. 정보 변경 페이지에 지정한 배틀 태그명과 현재 로그인 되어 있거나 로그인할 배틀넷 계정이 일치하는지 확인합니다.' },
        { type: 'answer', contents: '2. 배틀 태그 입력 필드 우측에 \'인증\' 버튼을 클릭하여 실제 배틀넷 계정 로그인을 진행하시면 인증이 완료됩니다.' },
        { type: 'answer', contents: '3. 1번에서 확인한 배틀 태그가 일치하는데도 인증이 실패하는 경우 다른 브라우저에서 인증을 진행하거나, 배틀넷 계정을 로그아웃 한 이후 다시 트레이더스 배틀 태그 인증을 진행해 주세요.' }
      ]
    },
    {
      id: 'join',
      question: '회원가입은 어떻게 하나요?',
      answer: [
        { type: 'image', contents: '01_login' },
        { type: 'text', contents: '1. 우측 상단에 로그인 버튼을 클릭합니다.' },
        { type: 'image', contents: '01_mobile' },
        { type: 'text', contents: '1.1. 모바일 환경에서는 우측 상단에 더 보기 아이콘을 클릭하시고 로그인 버튼을 클릭합니다.' },
        { type: 'image', contents: '02_join' },
        { type: 'text', contents: '2. 소셜 로그인을 이용하거나 \'트레이더스가 처음이신가요?\'\n링크를 클릭하여 가입 페이지로 이동합니다.' },
        { type: 'image', contents: '03_join' },
        { type: 'text', contents: '3. 이메일 인증 절차가 필요하기 때문에 실제 사용하는 이메일 주소를 사용하여 가입을 진행하셔야 합니다.' },
        { type: 'image', contents: '04_join' },
        { type: 'text', contents: '4. 소셜 로그인을 통한 가입의 경우 임의 비밀번호가 자동 입력됩니다. 원하는 비밀번호를 입력해서 가입하셔도 됩니다.' },
        { type: 'text', contents: '소셜 로그인 가입 시 실제 이메일 수신이 가능한 주소인지 꼭 확인하시기 바랍니다.\n소셜 로그인을 사용하는 경우에도 최초 가입 프로세스(계정 인증 절차)는 진행하셔야 합니다.', classes: 'text-orange-10 text-weight-bold text-body1' },
        { type: 'image', contents: '05_verify' },
        { type: 'text', contents: '5. 이메일 전송이 성공하면 이미지와 같은 알림이 표시됩니다. 인증을 24시간 내로 완료하지 않은 경우 해당 계정은 자동으로 삭제됩니다.' },
        { type: 'image', contents: '06_verify' },
        { type: 'text', contents: '6. 가입하실 때 사용하신 이메일의 메일함으로 이동하면 위와 같은 인증 메일을 확인할 수 있습니다.\n(메일이 보이지 않는 경우 스팸메일함을 확인해 보세요.)' },
        { type: 'image', contents: '07_verify' },
        { type: 'text', contents: '7. 계정 인증이 성공하면 이미지와 같은 알림이 표시됩니다.' },
        { type: 'image', contents: '08_battletag' },
        { type: 'text', contents: '8. 로그인 후 트레이더스 디아블로® IV 페이지로 이동하면 배틀태그 입력 화면이 나타납니다. (정상적인 사용을 위해 사용 중인 배틀태그를 입력하시면 됩니다.)' },
        { type: 'image', contents: '09_battletag' },
        { type: 'text', contents: '9.1. 사용자 정보 변경 페이지에서 배틀태그 수정이 가능합니다. (이미 인증된 배틀태그가 존재하는 경우 변경 불가)\n인증 버튼을 통해 배틀태그를 인증할 수 있습니다.' },
        { type: 'image', contents: '0901_battletag' },
        { type: 'text', contents: '9.2. 로그인 상태인 경우 사용자 툴팁에 배틀태그 인증 여부가 표시됩니다.' },
        { type: 'image', contents: '10_withdrawal' },
        { type: 'text', contents: '10. 회원 탈퇴는 사용자 정보 변경 페이지 하단에 위치하고 있으며 사용 중인 이메일 주소를 입력하면 탈퇴가 진행됩니다.' }
      ]
    },
    {
      id: 'register',
      question: '아이템은 어떻게 등록하나요?',
      answer: [
        { type: 'image', contents: '01_start' },
        { type: 'text', contents: '1. 우측 하단에 + 아이콘을 클릭합니다' },
        { type: 'image', contents: '02_description' },
        { type: 'text', contents: '2. 아이템 입력창이 열립니다.\n좌측 상단부터 순서대로,\n1: 아이템 티어, 2: 아이템 품질, 3: 아이템 유형, 4: 장비 클래스, 5: 아이템 이미지, 6: 아이템 수량, 7: 아이템 명, 8: 아이템 위력, 9: 업그레이드, 10: 요구 레벨, 11: 고유 특성과 옵션 및 제약 조건, 12 거래 금액, 13: 이미지 분석, 14 버튼 영역입니다.' },
        { type: 'image', contents: '03_tier' },
        { type: 'text', contents: '3. 아이템 티어를 선택합니다. (필수 선택값은 아닙니다)' },
        { type: 'image', contents: '04_quality' },
        { type: 'text', contents: '4. 아이템 품질을 선택합니다.' },
        { type: 'image', contents: '0401_quality' },
        { type: 'text', contents: '4.1. 아이템 품질에 따라 카드 색상이 변경됩니다.' },
        { type: 'image', contents: '0402_hardcore_ladder' },
        { type: 'text', contents: '4.2. 등록이 완료되면 아이템 카드에 있는 아이템 명 좌측 플래그로 하드코어와 래더 여부를 확인할 수 있습니다.' },
        { type: 'image', contents: '05_base' },
        { type: 'text', contents: '5. 아이템 유형과 장비 클래스, 아이템 이미지, 수량을 입력해 줍니다.' },
        { type: 'image', contents: '06_image' },
        { type: 'text', contents: '6. 아이템 이미지 버튼을 클릭하면 이미지를 선택할 수 있는 이미지 선택창이 열립니다.\n(*아이템 이미지 리스트에 없는 이미지가 있을 수 있습니다.)' },
        { type: 'image', contents: '07_base' },
        { type: 'text', contents: '7. 아이템 명과 아이템 위력, 업그레이드, 요구 레벨을 입력해 줍니다.\n아이템 명과 요구 레벨은 *필수 입력 필드입니다.\n아이템 위력과 업그레이드 필드는 입력하지 않으면 아이템 카드에 표시되지 않습니다.' },
        { type: 'image', contents: '08_attribute' },
        { type: 'text', contents: '8. 이제 고유 특성과 옵션, 제약 조건을 입력해 보겠습니다.\n우측 상단에 입력하고자 하는 탭을 선택하세요.\n\n먼저 고유 특성입니다.\n고유 특성은 아이템이 갖는 고유한 속성입니다. 상단의 장비 클래스를 선택하면 해당 클래스가 가질 수 있는 모든 고유 특성이 자동적으로 리스트업 됩니다.' },
        { type: 'image', contents: '09_attribute' },
        { type: 'text', contents: '9. 부가적으로 추가하길 원하는 고유 특성이 있을 경우 선택 상자를 클릭해 원하는 특성을 선택하거나,' },
        { type: 'image', contents: '10_attribute' },
        { type: 'text', contents: '10. 검색어를 직접 입력해 필터 된 특성을 추가할 수 있습니다.\n옵션과 제약 조건도 같은 방법으로 입력하면 됩니다. 옵션의 경우 필요한 옵션을 찾을 수 없을 경우 등록 요청을 할 수 있습니다.' },
        { type: 'image', contents: '11_attribute' },
        { type: 'text', contents: '11. 선택 상자 우측에 + 아이콘을 클릭하면 옵션 등록 요청 창이 열립니다.' },
        { type: 'image', contents: '12_attribute' },
        { type: 'text', contents: '12. 보통은 표준을 사용하고, 빈 홈에 보석 등을 장착한 경우 홈을 선택해 줍니다.\n요청하려는 옵션이 \'빠른 이동 속도 +10\'인 경우 \'빠른 이동 속도 +{x}\'라고 입력 후 등록 요청을 해 주면 됩니다.\n(요청된 옵션은 트레이더스 관리자가 확인 후 필요하다고 판단되면 추후 추가됨)' },
        { type: 'image', contents: '13_attribute' },
        { type: 'text', contents: '13. 추가된 속성에 {x}라고 기입한 부분은 입력 필드가 됩니다.\n입력 필드 우측에 해당 수치의 최소, 최댓값을 입력하는 필드도 자동으로 표시됩니다.' },
        { type: 'image', contents: '14_price' },
        { type: 'text', contents: '14. 이제 판매할 아이템의 가격을 책정합니다.\n화폐 항목은 현재 제안받기 / 금화만이 가능합니다. 구매자가 금액을 제안하기를 원하는 경우 \'제안받기\'를 선택하시면 됩니다.\n\n\'제안받기\'는 배틀태그 인증 사용자만 사용할 수 있습니다.' },
        { type: 'image', contents: '15_item' },
        { type: 'text', contents: '15. 적용을 눌러 아이템 등록을 완료합니다. 방금 등록한 아이템이 카드 형태로 표시됩니다.' },
        { type: 'image', contents: '16_finish' },
        { type: 'text', contents: '16. 카드 우측 상단 아이템 상태 좌측에 판매 종료까지 남은 시간이 표시됩니다.\n기본적으로 판매 기간은 2일(48시간)이며 연장이 필요 한 경우 아이템 좌측 하단의 \'수정하기\'를 클릭하고' },
        { type: 'image', contents: '17_relist' },
        { type: 'text', contents: '17. 수정 창 좌측 하단에 추가 작업 > 끌어올림을 선택하면 아이템이 최 상단으로 끌어올려짐과 동시에 판매 기간이 갱신됩니다.' },
        { type: 'image', contents: '18_analyze' },
        { type: 'text', contents: '18. 최근 추가된 기능인 이미지 분석은 수기로 아이템을 등록하는 번거로움을 개선하고자 작업되었으며, 아이템 등록이나 수정 창의 좌측 하단에 있는 \'이미지 분석\'을 클릭하여 잘 재단된 아이템 이미지를 선택해 주기만 하면 됩니다.' },
        { type: 'image', contents: '19_analyze' },
        { type: 'text', contents: '아이템 이미지 분석 화면\n\n19. 하드코어, 레더, 아이템 수량, 가격을 제외한 값들이 정상적으로 분석이 완료되었다면 아이템 정보가 자동으로 입력됩니다.\n(일정 해상도 이상의 잘 재단된 아이템 이미지일수록 높은 인식 결과를 얻을 수 있습니다.)' }
      ]
    },
    {
      id: 'trade',
      question: '아이템은 어떻게 거래하나요?',
      answer: [
        { type: 'text', contents: '\n\n\n구매자(어두운 테마), 판매자(밝은 테마) 화면으로 설명드립니다.' },
        { type: 'image', contents: '01_make_offer' },
        { type: 'text', contents: '1. 구매자는 원하는 아이템을 찾아 \'제안하기\' 버튼을 클릭합니다.' },
        { type: 'image', contents: '02_make_offer' },
        { type: 'text', contents: '2. 원하는 적정한 구매 가격을 제안합니다.' },
        { type: 'image', contents: '03_accept_offer' },
        { type: 'text', contents: '3. 판매자에게 제안이 왔다는 알림이 표시됩니다.\n이동 링크를 클릭하면 제안 목록 화면으로 이동됩니다.' },
        { type: 'image', contents: '04_accept_offer' },
        { type: 'text', contents: '4. 들어온 제안들이 카드로 표시됩니다.\n제안 가격이 마음에 들지 않는 경우 \'거절\'을 클릭합니다.' },
        { type: 'image', contents: '05_turndown_offer' },
        { type: 'text', contents: '5. 제안 거절 여부를 묻는 확인 창이 표시됩니다.\n제안을 거절하면,' },
        { type: 'image', contents: '06_turndown_offer' },
        { type: 'text', contents: '6. 제안을 요청한 구매자에게 제안이 거절되었다는 알림이 표시됩니다.' },
        { type: 'image', contents: '07_turndown_offer' },
        { type: 'text', contents: '7. 이동 링크를 클릭하면 제안 카드의 상태가 \'제안 거절\'로 업데이트 됩니다.\n제안이 거절되더라도 해당 아이템에 *다시 제안 요청할 수 있습니다.' },
        { type: 'image', contents: '08_remake_offer' },
        { type: 'text', contents: '8. 새로운 가격으로 다시 제안을 요청합니다.\n구매자 역시 *거래가 진행 중이지 않은 경우* 제안을 1회 철회 할 수 있습니다.' },
        { type: 'image', contents: '09_retract_offer' },
        { type: 'text', contents: '9. 제안 철회 여부를 묻는 확인 창이 표시됩니다.\n제안을 철회하면, 판매자에게 제안이 철회되었다는 알림이 표시됩니다.\n\n제안 철회는 *아이템 당 1회만 가능합니다.' },
        { type: 'image', contents: '04_accept_offer' },
        { type: 'text', contents: '10.1. 다시 4번으로 돌아가 제안을 수락해보겠습니다.\n \'수락\' 버튼을 클릭합니다.' },
        { type: 'image', contents: '10_accept_offer' },
        { type: 'text', contents: '10.2. 제안 수락 여부를 묻는 확인 창이 표시됩니다.\n제안을 수락하면,' },
        { type: 'image', contents: '11_proceed_trade' },
        { type: 'text', contents: '11. 구매자에게 제안 수락 알림이 표시되고, 이동 링크를 클릭하면 제안 카드가 \'거래 진행 상태\'(완료 처리화면)로 변경 됩니다.' },
        { type: 'image', contents: '12_proceed_trade' },
        { type: 'text', contents: '12. 판매자 역시 제안 카드가 \'거래 진행 상태\'(완료 처리화면)로 변경 됩니다.\n이제 구매자의 배틀태그가 표시됩니다.\n클릭 하면 배틀태그가 클립보드로 복사됩니다.' },
        { type: 'image', contents: '13_proceed_trade' },
        { type: 'text', contents: '13. 구매자 역시 아이템 카드에 판매자의 배틀태그가 표시됩니다.\n클릭 하면 배틀태그가 클립보드로 복사됩니다.\n이제 서로의 배틀태그를 통해 아이템 거래를 진행합니다.\n아이템 상태가 \'거래 진행 중\'으로 변경되면 *24시간 이내에 거래 완료 처리*를 해야하며,\n*24시간이 지나면 해당 아이템은 자동으로\'거래 완료\' 상태로 변경* 됩니다.\n(* 자동 처리 시 매너온도 1도 고정 하락에 유의)' },
        { type: 'image', contents: '1401_evaluation' },
        { type: 'image', contents: '1402_evaluation' },
        { type: 'text', contents: '14. 이제 판매자와 구매자는 완료 버튼을 클릭해 서로의 거래에 대한 매너 평가를 남겨주시면 됩니다.\n만약 상대방이 연락이 없거나 판매 또는 구매를 하지 않는 경우에도\n\n*꼭 완료 처리를 해주셔야 노른자(yolk)가 회수되며, 미 완료 처리로 인한 페널티를 받지 않습니다.' },
        { type: 'image', contents: '15_evaluation' },
        { type: 'text', contents: '15. 서로의 완료 처리가 끝나면 상대방이 남긴 매너 평가를 확인할 수 있습니다.' },
        { type: 'image', contents: '16_copy' },
        { type: 'text', contents: '16. 거래가 무산된 경우 아이템 카드 > 아이템 명 우측 > 더보기에 있는  \'템플릿 복사\' 기능을 사용하여 손쉽게 아이템 재등록이 가능합니다.' },
        { type: 'image', contents: '1701_sound' },
        { type: 'text', contents: '17.1. 메시지 수신 알림음을 듣고싶은 경우 브라우저(크롬) 주소창 좌측을 클릭하고,' },
        { type: 'image', contents: '1702_sound' },
        { type: 'text', contents: '17.2. \'사이트 설정\'을 선택합니다.' },
        { type: 'image', contents: '1703_sound' },
        { type: 'text', contents: '17.3. \'소리\' 탭 값을 \'허용\'으로 변경하면 이제 알림음을 들을 수 있습니다.' }
      ]
    },
    {
      id: 'batch',
      question: '아이템 일괄 처리 기능은 어떻게 사용하나요?',
      answer: [
        { type: 'image', contents: '01_filter' },
        { type: 'text', contents: '1. 먼저 일괄 처리 기능을 사용하기 위해서 \'나만의 검색\' 그룹의 \'내 아이템\' 항목을 활성화합니다.' },
        { type: 'image', contents: '02_active' },
        { type: 'text', contents: '2. 아이템 목록 상단에 일괄 처리 기능이 표시되며,\n 아이템 항목의 \'아이템 명\' 좌측에 체크박스가 추가됩니다.' },
        { type: 'image', contents: '03_select' },
        { type: 'text', contents: '3. 일괄 처리를 원하는 아이템들을 선택합니다.\n 아이템 목록의 스크롤을 이동해도 일괄 처리 기능 UI는 상단에 고정됩니다.' },
        { type: 'image', contents: '04_01_dropdown' },
        { type: 'text', contents: '4.1. 아이템 선택이 완료되면, 일괄 처리 기능 UI 우측에 \'드롭 다운 아이콘\'을 선택합니다.' },
        { type: 'image', contents: '04_02_dropdown' },
        { type: 'text', contents: '4.2. 끌어올림, 판매 보류, 판매 재개, 재등록, 삭제 중 원하는 기능을 선택합니다.' },
        { type: 'image', contents: '05_confirm' },
        { type: 'text', contents: '5. 일괄 처리 진행 여부에 대한 확인 창이 표시되고 \'수락\'을 누르면 일괄 처리가 시작됩니다.' },
        { type: 'image', contents: '06_failed' },
        { type: 'text', contents: '6. 일괄 처리가 완료되면 처리가 실패한 아이템과 실패 원인이 표시됩니다.\n(모두 정상적으로 처리된 경우 실패 항목은 표시되지 않습니다.) ' }
      ]
    },
    {
      id: 'greater',
      question: '상급 속성은 어떻게 활성화하나요?',
      answer: [
        { type: 'image', contents: '01_greater' },
        { type: 'text', contents: '아이템 등록 또는 수정 시 속성 > 옵션 탭에 추가된 속성 중 상급 상태로 변경을 원하는 속성의 좌측 아이콘을 클릭하면,' },
        { type: 'image', contents: '02_greater' },
        { type: 'text', contents: '상급 속성으로 활성화됩니다.' },
      ]
    },
    {
      id: 'yolk',
      question: '노른자(yolk)는 무엇인가요?',
      answer: [
        { type: 'image', contents: '01_yolk' },
        { type: 'text', contents: '우측 상단 사용자 아이콘\n(모바일 더보기 아이콘 > 사용자 아이콘)\n을 클릭하면 현재 보유한 노른자 개수를 확인할 수 있습니다.\n\n2024-06-03 현재,\n\n가입 시 30개의 노른자(yolk)가 부여됩니다.\n\n일일 최대 30개의 노른자가 충전됩니다.\n\n충전 시 노른자를 30개 이상 소유 중인 경우 더 이상 추가되지 않습니다.\n\n판매되거나 사용자 사이에 나눠 가질 수 없습니다.\n\n아이템 등록, 끌어올림, 제안 등록 시 1개씩 소모되며,\n\n아이템 거래가 정상적으로 완료되면 회수됩니다.\n\n이는 무분별한 아이템 등록이나 \n제안 요청을 막고자 함이며 앞으로 사용 개수나 부여 개수는 변경될 수 있습니다.' },
      ]
    },
    {
      id: 'allow',
      question: '광고 차단 프로그램에서 트레이더스를 어떻게 허용하나요?',
      answer: [
        { type: 'image', contents: '01_unicorn' },
        { type: 'text', contents: '1. 유니콘' },
        { type: 'text', contents: '유니콘 설정 > 화이트리스트 항목을 선택하여 tradurs.com 을 추가' },
        { type: 'image', contents: '02_adblock' },
        { type: 'text', contents: '2. 애드 블록' },
        { type: 'text', contents: '애드 블록 확장 프로그램을 사용 중인 경우 트레이더스 사이트에 접속 중일 때 애드 블록 확장 프로그램 아이콘을 클릭하여 Always로 항상 허용' },
        { type: 'image', contents: '03_adguard' },
        { type: 'text', contents: '3. 애드 가드' },
        { type: 'text', contents: '애드 가드 설정 > 허용 목록을 선택하여 tradurs.com을 추가' },
        { type: 'image', contents: '04_ublock' },
        { type: 'text', contents: '4. 유 블록' },
        { type: 'text', contents: '유 블록 설정 > 제외 목록을 선택하여 tradurs.com을 추가' }
      ]
    }
  ],
  awards: {
    description: '* 어워즈 순위는 단순히 종목 별 데이터 합산이 아닌 내부적으로 정한 기준을 바탕으로 산출됩니다',
    highPriced: {
      category: '지난 한 주간 판매가 상위 5',
      desc: ''
    },
    bestManners: {
      category: '지난 한 주간 매너 상위 5',
      desc: ''
    },
    mostSold: {
      category: '지난 한 주간 최다 판매 상위 5',
      unit: '개',
      desc: ''
    },
    mostPurchased: {
      category: '지난 한 주간 최다 구매 상위 5',
      unit: '개',
      desc: ''
    },
    noData: '수상 내역이 없습니다'
  },
  socket: {
    '0900': '알림 정보 인증이 실패했습니다',
    disconnect: '알림 서버와의 연결이 해제되었습니다.'
  }
}