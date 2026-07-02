export const siteBaseUrl = 'https://favmon.com';
export const siteDomain = 'favmon.com';
export const kofiUrl = 'https://ko-fi.com/favmon';
export const brandName = 'Favmon';
export const siteName = "Every Pokémon is Someone's Favorite";
export const ogImageUrl = `${siteBaseUrl}/og-image.png`;
export const twitterImageUrl = `${siteBaseUrl}/twitter-card.png`;

export const localeOptions = [
  { code: 'ja', prefix: '/ja', label: 'Japanese', nativeLabel: '日本語', ogLocale: 'ja_JP' },
  { code: 'ko', prefix: '/ko', label: 'Korean', nativeLabel: '한국어', ogLocale: 'ko_KR' },
  { code: 'zh-CN', prefix: '/zh-cn', label: 'Simplified Chinese', nativeLabel: '简体中文', ogLocale: 'zh_CN' },
  { code: 'zh-TW', prefix: '/zh-tw', label: 'Traditional Chinese', nativeLabel: '繁體中文', ogLocale: 'zh_TW' },
  { code: 'es-CL', prefix: '/es-cl', label: 'Spanish (Chile)', nativeLabel: 'Español CL', ogLocale: 'es_CL' },
  { code: 'en', prefix: '', label: 'English', nativeLabel: 'English', ogLocale: 'en_US' },
  { code: 'zh-HK', prefix: '/zh-hk', label: 'Traditional Chinese (Hong Kong)', nativeLabel: '繁體中文 HK', ogLocale: 'zh_HK' },
  { code: 'es', prefix: '/es', label: 'Spanish', nativeLabel: 'Español', ogLocale: 'es_ES' },
  { code: 'es-PR', prefix: '/es-pr', label: 'Spanish (Puerto Rico)', nativeLabel: 'Español PR', ogLocale: 'es_PR' },
  { code: 'fr', prefix: '/fr', label: 'French', nativeLabel: 'Français', ogLocale: 'fr_FR' },
  { code: 'es-CR', prefix: '/es-cr', label: 'Spanish (Costa Rica)', nativeLabel: 'Español CR', ogLocale: 'es_CR' },
];

export const routes = [
  { path: '/', label: 'Home', changefreq: 'daily', priority: '1.0' },
  { path: '/picker', label: 'Favorite Pokémon Picker', changefreq: 'weekly', priority: '0.8' },
  { path: '/game', label: 'Game', changefreq: 'weekly', priority: '0.8' },
  { path: '/explore', label: 'Explore', changefreq: 'daily', priority: '0.8' },
  { path: '/pokedex', label: 'Community Pokédex', changefreq: 'weekly', priority: '0.9' },
  { path: '/stats', label: 'Stats', changefreq: 'daily', priority: '0.9' },
];

const englishRouteSeo = {
  '/': {
    title: `Favmon | ${siteName}`,
    socialTitle: `${siteName} | Favmon`,
    description: 'Declare your favorite or least favorite Pokémon, reveal community Pokédex rankings, and download shareable trainer cards on Favmon.',
  },
  '/picker': {
    title: 'Favorite Pokémon Picker Board | Favmon',
    socialTitle: 'Favorite Pokémon Picker Board | Favmon',
    description: 'Build a shareable Favmon picker board with favorite Pokémon by generation, type, team slots, shiny preview, and import or export backup codes.',
  },
  '/game': {
    title: 'Pokémon Popularity Game | Favmon',
    socialTitle: "Who's More Loved? | Favmon",
    description: "Play Favmon's Pokémon popularity guessing game and choose which Pokémon has more love from community declaration data.",
  },
  '/explore': {
    title: 'Explore Pokémon Declarations | Favmon',
    socialTitle: 'Explore Pokémon Declarations | Favmon',
    description: 'Browse recent Favmon trainer declarations and discover the stories behind favorite and least favorite Pokémon picks.',
  },
  '/pokedex': {
    title: 'Community Pokédex Rankings | Favmon',
    socialTitle: 'Community Pokédex Rankings | Favmon',
    description: "Explore Favmon's community Pokédex rankings, National Dex coverage, revealed Pokémon, hidden entries, and fan counts.",
  },
  '/stats': {
    title: 'Pokémon Fan Rankings and Stats | Favmon',
    socialTitle: 'Pokémon Fan Rankings and Stats | Favmon',
    description: 'Track Favmon voting stats, top Pokémon rankings, Pokédex coverage, favorite picks, least-favorite picks, and latest declarations.',
  },
};

const japaneseRouteSeo = {
  '/': {
    title: `Favmon | ${siteName}`,
    socialTitle: `${siteName} | Favmon`,
    description: 'Favmonで好きなポケモンや苦手なポケモンを宣言し、コミュニティ図鑑ランキングと共有用トレーナーカードを楽しめます。',
  },
  '/picker': {
    title: 'お気に入りポケモンピッカーボード | Favmon',
    socialTitle: 'お気に入りポケモンピッカーボード | Favmon',
    description: 'Favmonで世代、タイプ、チーム枠ごとにお気に入りのポケモンを選び、バックアップコードをインポートまたはエクスポートできます。',
  },
  '/game': {
    title: 'ポケモン人気ゲーム | Favmon',
    socialTitle: 'どちらがより愛されている？ | Favmon',
    description: 'Favmonのコミュニティ宣言データを使って、どちらのポケモンがより多く選ばれているかを当てる人気ゲームです。',
  },
  '/explore': {
    title: 'ポケモン宣言を探索 | Favmon',
    socialTitle: 'ポケモン宣言を探索 | Favmon',
    description: 'Favmonに投稿された最新のトレーナー宣言を読み、好きなポケモンや苦手なポケモンに込められた理由を発見できます。',
  },
  '/pokedex': {
    title: 'コミュニティ図鑑ランキング | Favmon',
    socialTitle: 'コミュニティ図鑑ランキング | Favmon',
    description: 'Favmonのコミュニティ図鑑で、全国図鑑の発見状況、ファン数、まだ宣言されていないポケモンを確認できます。',
  },
  '/stats': {
    title: 'ポケモン人気ランキングと統計 | Favmon',
    socialTitle: 'ポケモン人気ランキングと統計 | Favmon',
    description: 'Favmonの投票統計、人気ランキング、図鑑カバー率、最新のコミュニティ宣言データを追跡できます。',
  },
};

const koreanRouteSeo = {
  '/': {
    title: `Favmon | ${siteName}`,
    socialTitle: `${siteName} | Favmon`,
    description: 'Favmon에서 가장 좋아하거나 덜 좋아하는 포켓몬을 선언하고 커뮤니티 도감 순위와 공유용 트레이너 카드를 확인하세요.',
  },
  '/picker': {
    title: '좋아하는 포켓몬 피커 보드 | Favmon',
    socialTitle: '좋아하는 포켓몬 피커 보드 | Favmon',
    description: 'Favmon에서 세대, 타입, 팀 슬롯별로 좋아하는 포켓몬을 고르고 백업 코드를 가져오거나 내보낼 수 있습니다.',
  },
  '/game': {
    title: '포켓몬 인기 게임 | Favmon',
    socialTitle: '누가 더 사랑받을까? | Favmon',
    description: 'Favmon 커뮤니티 선언 데이터를 바탕으로 어떤 포켓몬이 더 많은 사랑을 받는지 맞히는 인기 게임입니다.',
  },
  '/explore': {
    title: '포켓몬 선언 둘러보기 | Favmon',
    socialTitle: '포켓몬 선언 둘러보기 | Favmon',
    description: 'Favmon에 올라온 최신 트레이너 선언을 읽고 좋아하는 포켓몬과 덜 좋아하는 포켓몬에 담긴 이유를 살펴보세요.',
  },
  '/pokedex': {
    title: '커뮤니티 도감 순위 | Favmon',
    socialTitle: '커뮤니티 도감 순위 | Favmon',
    description: 'Favmon 커뮤니티 도감에서 전국도감 커버리지, 공개된 포켓몬, 숨겨진 포켓몬, 팬 수를 확인하세요.',
  },
  '/stats': {
    title: '포켓몬 팬 순위와 통계 | Favmon',
    socialTitle: '포켓몬 팬 순위와 통계 | Favmon',
    description: 'Favmon 투표 통계, 상위 포켓몬 순위, 도감 커버리지, 최신 커뮤니티 선언 데이터를 추적하세요.',
  },
};

const simplifiedChineseRouteSeo = {
  '/': {
    title: `Favmon | ${siteName}`,
    socialTitle: `${siteName} | Favmon`,
    description: '在 Favmon 宣告你最喜欢或最不喜欢的宝可梦，查看社区图鉴排名，并下载适合分享的训练家卡片。',
  },
  '/picker': {
    title: '最喜欢宝可梦选择板 | Favmon',
    socialTitle: '最喜欢宝可梦选择板 | Favmon',
    description: '在 Favmon 按世代、属性和队伍槽选择你最喜欢的宝可梦，支持闪光预览、导入和导出备份代码。',
  },
  '/game': {
    title: '宝可梦人气竞猜游戏 | Favmon',
    socialTitle: '谁更受欢迎？ | Favmon',
    description: '游玩 Favmon 宝可梦人气竞猜，根据社区宣告数据判断哪只宝可梦获得更多喜爱。',
  },
  '/explore': {
    title: '探索宝可梦宣告 | Favmon',
    socialTitle: '探索宝可梦宣告 | Favmon',
    description: '浏览 Favmon 最新训练家宣告，了解大家选择最喜欢或最不喜欢宝可梦背后的理由。',
  },
  '/pokedex': {
    title: '社区图鉴排名 | Favmon',
    socialTitle: '社区图鉴排名 | Favmon',
    description: '查看 Favmon 社区图鉴排名、全国图鉴覆盖率、已揭晓宝可梦、隐藏条目和粉丝数量。',
  },
  '/stats': {
    title: '宝可梦粉丝排名与统计 | Favmon',
    socialTitle: '宝可梦粉丝排名与统计 | Favmon',
    description: '追踪 Favmon 投票统计、热门宝可梦排名、图鉴覆盖率、最喜欢与最不喜欢选择和最新宣告。',
  },
};

const traditionalChineseRouteSeo = {
  '/': {
    title: `Favmon | ${siteName}`,
    socialTitle: `${siteName} | Favmon`,
    description: '在 Favmon 宣告你最喜歡或最不喜歡的寶可夢，查看社群圖鑑排名，並下載適合分享的訓練家卡片。',
  },
  '/picker': {
    title: '最喜歡寶可夢選擇板 | Favmon',
    socialTitle: '最喜歡寶可夢選擇板 | Favmon',
    description: '在 Favmon 按世代、屬性和隊伍格選擇你最喜歡的寶可夢，支援閃光預覽、匯入和匯出備份代碼。',
  },
  '/game': {
    title: '寶可夢人氣猜謎遊戲 | Favmon',
    socialTitle: '誰更受歡迎？ | Favmon',
    description: '遊玩 Favmon 寶可夢人氣猜謎，根據社群宣告資料判斷哪隻寶可夢獲得更多喜愛。',
  },
  '/explore': {
    title: '探索寶可夢宣告 | Favmon',
    socialTitle: '探索寶可夢宣告 | Favmon',
    description: '瀏覽 Favmon 最新訓練家宣告，了解大家選擇最喜歡或最不喜歡寶可夢背後的理由。',
  },
  '/pokedex': {
    title: '社群圖鑑排名 | Favmon',
    socialTitle: '社群圖鑑排名 | Favmon',
    description: '查看 Favmon 社群圖鑑排名、全國圖鑑覆蓋率、已揭曉寶可夢、隱藏條目和粉絲數量。',
  },
  '/stats': {
    title: '寶可夢粉絲排名與統計 | Favmon',
    socialTitle: '寶可夢粉絲排名與統計 | Favmon',
    description: '追蹤 Favmon 投票統計、熱門寶可夢排名、圖鑑覆蓋率、最喜歡與最不喜歡選擇和最新宣告。',
  },
};

const spanishRouteSeo = {
  '/': {
    title: `Favmon | ${siteName}`,
    socialTitle: `${siteName} | Favmon`,
    description: 'Declara tu Pokémon favorito o menos favorito en Favmon, consulta rankings de la Pokédex comunitaria y descarga cartas para compartir.',
  },
  '/picker': {
    title: 'Tablero para elegir Pokémon favoritos | Favmon',
    socialTitle: 'Tablero para elegir Pokémon favoritos | Favmon',
    description: 'Crea un tablero Favmon con Pokémon favoritos por generación, tipo y equipo, con vista shiny y códigos de copia de seguridad.',
  },
  '/game': {
    title: 'Juego de popularidad Pokémon | Favmon',
    socialTitle: '¿Quién es más querido? | Favmon',
    description: 'Juega al reto de popularidad de Favmon y adivina qué Pokémon recibe más cariño según las declaraciones de la comunidad.',
  },
  '/explore': {
    title: 'Explorar declaraciones Pokémon | Favmon',
    socialTitle: 'Explorar declaraciones Pokémon | Favmon',
    description: 'Explora las declaraciones recientes de entrenadores en Favmon y descubre las historias detrás de cada Pokémon elegido.',
  },
  '/pokedex': {
    title: 'Ranking de Pokédex comunitaria | Favmon',
    socialTitle: 'Ranking de Pokédex comunitaria | Favmon',
    description: 'Consulta en Favmon el ranking de la Pokédex comunitaria, la cobertura de la Dex Nacional, entradas reveladas y recuentos de fans.',
  },
  '/stats': {
    title: 'Rankings y estadísticas Pokémon | Favmon',
    socialTitle: 'Rankings y estadísticas Pokémon | Favmon',
    description: 'Sigue estadísticas de votos en Favmon, rankings de Pokémon, cobertura de Pokédex y las declaraciones más recientes.',
  },
};

const frenchRouteSeo = {
  '/': {
    title: `Favmon | ${siteName}`,
    socialTitle: `${siteName} | Favmon`,
    description: 'Déclare ton Pokémon préféré ou le moins aimé sur Favmon, consulte les classements du Pokédex communautaire et télécharge des cartes à partager.',
  },
  '/picker': {
    title: 'Tableau de Pokémon favoris | Favmon',
    socialTitle: 'Tableau de Pokémon favoris | Favmon',
    description: 'Créez un tableau Favmon avec vos Pokémon favoris par génération, type et équipe, avec aperçu shiny et codes de sauvegarde.',
  },
  '/game': {
    title: 'Jeu de popularité Pokémon | Favmon',
    socialTitle: 'Qui est le plus aimé ? | Favmon',
    description: "Joue au défi de popularité Favmon et choisis quel Pokémon reçoit le plus d'amour selon les déclarations de la communauté.",
  },
  '/explore': {
    title: 'Explorer les déclarations Pokémon | Favmon',
    socialTitle: 'Explorer les déclarations Pokémon | Favmon',
    description: 'Parcours les déclarations récentes des dresseurs sur Favmon et découvre les histoires derrière chaque Pokémon choisi.',
  },
  '/pokedex': {
    title: 'Classement du Pokédex communautaire | Favmon',
    socialTitle: 'Classement du Pokédex communautaire | Favmon',
    description: 'Explore sur Favmon le classement du Pokédex communautaire, la couverture du Dex National, les entrées révélées et les fans.',
  },
  '/stats': {
    title: 'Classements et statistiques Pokémon | Favmon',
    socialTitle: 'Classements et statistiques Pokémon | Favmon',
    description: 'Suis les statistiques Favmon, les meilleurs classements Pokémon, la couverture du Pokédex et les dernières déclarations.',
  },
};

export const routeSeoByLanguage = {
  ja: japaneseRouteSeo,
  ko: koreanRouteSeo,
  'zh-CN': simplifiedChineseRouteSeo,
  'zh-TW': traditionalChineseRouteSeo,
  'es-CL': spanishRouteSeo,
  en: englishRouteSeo,
  'zh-HK': traditionalChineseRouteSeo,
  es: spanishRouteSeo,
  'es-PR': spanishRouteSeo,
  fr: frenchRouteSeo,
  'es-CR': spanishRouteSeo,
};

export const faqByLanguage = {
  en: [
    ['What is Favmon?', 'Favmon is a fan-made community Pokédex where trainers declare their favorite or least favorite Pokémon, compare rankings, and reveal how far the National Dex has been covered.'],
    ['Can I share my Pokémon declaration?', 'Yes. After saving a declaration, Favmon can generate square, story, and banner trainer cards for Instagram, TikTok, X, and other social platforms.'],
    ['Can I choose a least favorite Pokémon?', 'Yes. Favmon includes a favorite mode and a least-favorite mode so the community can track both loved Pokémon and divisive picks.'],
    ['Where does Favmon get Pokémon and ranking data?', "Favmon uses PokéAPI for Pokémon names, types, sprites, and artwork. Community declaration counts come from this site's own Neon Postgres database."],
  ],
  ja: [
    ['Favmonとは何ですか？', 'Favmonはファンメイドのコミュニティ図鑑です。トレーナーがお気に入り、または苦手なポケモンを宣言し、ランキングや全国図鑑の進行状況を確認できます。'],
    ['ポケモン宣言を共有できますか？', 'はい。宣言を保存すると、Instagram、TikTok、Xなどで使える正方形、ストーリー、バナー形式のトレーナーカードを生成できます。'],
    ['苦手なポケモンも選べますか？', 'はい。Favmonにはお気に入りモードと苦手モードがあり、愛されているポケモンと意見が分かれるポケモンの両方を追跡できます。'],
    ['Favmonのポケモン情報とランキングデータはどこから来ますか？', 'Favmonはポケモン名、タイプ、スプライト、公式アートにPokéAPIを使用します。コミュニティ宣言数は本サイト独自のNeon Postgresデータベースから取得します。'],
  ],
  ko: [
    ['Favmon은 무엇인가요?', 'Favmon은 팬이 만든 커뮤니티 도감입니다. 트레이너가 가장 좋아하거나 덜 좋아하는 포켓몬을 선언하고 순위와 전국도감 커버리지를 확인할 수 있습니다.'],
    ['포켓몬 선언을 공유할 수 있나요?', '네. 선언을 저장한 뒤 Instagram, TikTok, X 등에서 사용할 수 있는 정사각형, 스토리, 배너 형식의 트레이너 카드를 만들 수 있습니다.'],
    ['덜 좋아하는 포켓몬도 선택할 수 있나요?', '네. Favmon에는 좋아하는 모드와 덜 좋아하는 모드가 있어 사랑받는 포켓몬과 의견이 갈리는 선택을 모두 추적할 수 있습니다.'],
    ['Favmon의 포켓몬 정보와 순위 데이터는 어디에서 오나요?', 'Favmon은 포켓몬 이름, 타입, 스프라이트, 공식 아트워크에 PokéAPI를 사용합니다. 커뮤니티 선언 수는 이 사이트의 Neon Postgres 데이터베이스에서 가져옵니다.'],
  ],
  'zh-CN': [
    ['Favmon 是什么？', 'Favmon 是粉丝制作的社区图鉴。训练家可以宣告最喜欢或最不喜欢的宝可梦，查看排名与全国图鉴覆盖进度。'],
    ['我可以分享自己的宝可梦宣告吗？', '可以。保存宣告后，Favmon 能生成正方形、竖版故事和横幅尺寸的训练家卡片，方便分享到 Instagram、TikTok、X 等平台。'],
    ['可以选择最不喜欢的宝可梦吗？', '可以。Favmon 同时提供最喜欢模式和最不喜欢模式，让社区追踪受欢迎和更具争议的宝可梦选择。'],
    ['Favmon 的宝可梦信息和排名数据从哪里来？', 'Favmon 使用 PokéAPI 获取宝可梦名称、属性、sprite 和官方插图。社区宣告数量来自本站自己的 Neon Postgres 数据库。'],
  ],
  'zh-TW': [
    ['Favmon 是什麼？', 'Favmon 是粉絲製作的社群圖鑑。訓練家可以宣告最喜歡或最不喜歡的寶可夢，查看排名與全國圖鑑覆蓋進度。'],
    ['我可以分享自己的寶可夢宣告嗎？', '可以。保存宣告後，Favmon 能生成正方形、限時動態和橫幅尺寸的訓練家卡片，方便分享到 Instagram、TikTok、X 等平台。'],
    ['可以選最不喜歡的寶可夢嗎？', '可以。Favmon 同時提供最喜歡模式和最不喜歡模式，讓社群追蹤受歡迎與較具爭議的寶可夢選擇。'],
    ['Favmon 的寶可夢資訊和排名資料從哪裡來？', 'Favmon 使用 PokéAPI 取得寶可夢名稱、屬性、sprite 和官方插圖。社群宣告數量來自本站自己的 Neon Postgres 資料庫。'],
  ],
  'zh-HK': [
    ['Favmon 是什麼？', 'Favmon 是粉絲製作的社群圖鑑。訓練家可以宣告最喜歡或最不喜歡的寶可夢，查看排名與全國圖鑑覆蓋進度。'],
    ['我可以分享自己的寶可夢宣告嗎？', '可以。保存宣告後，Favmon 能生成正方形、限時動態和橫幅尺寸的訓練家卡片，方便分享到 Instagram、TikTok、X 等平台。'],
    ['可以選最不喜歡的寶可夢嗎？', '可以。Favmon 同時提供最喜歡模式和最不喜歡模式，讓社群追蹤受歡迎與較具爭議的寶可夢選擇。'],
    ['Favmon 的寶可夢資訊和排名資料從哪裡來？', 'Favmon 使用 PokéAPI 取得寶可夢名稱、屬性、sprite 和官方插圖。社群宣告數量來自本站自己的 Neon Postgres 資料庫。'],
  ],
  es: [
    ['¿Qué es Favmon?', 'Favmon es una Pokédex comunitaria creada por fans donde entrenadores declaran su Pokémon favorito o menos favorito, comparan rankings y revelan el avance de la Dex Nacional.'],
    ['¿Puedo compartir mi declaración Pokémon?', 'Sí. Después de guardar una declaración, Favmon puede generar cartas cuadradas, verticales y de banner para Instagram, TikTok, X y otras redes sociales.'],
    ['¿Puedo elegir un Pokémon menos favorito?', 'Sí. Favmon incluye modo favorito y modo menos favorito para que la comunidad mida tanto los Pokémon queridos como las elecciones más divisivas.'],
    ['¿De dónde obtiene Favmon los datos de Pokémon y rankings?', 'Favmon usa PokéAPI para nombres, tipos, sprites e ilustraciones. Los conteos de declaraciones vienen de la base de datos Neon Postgres propia del sitio.'],
  ],
  fr: [
    ["Qu'est-ce que Favmon ?", 'Favmon est un Pokédex communautaire créé par des fans où les dresseurs déclarent leur Pokémon préféré ou le moins aimé, comparent les classements et suivent la couverture du Dex National.'],
    ['Puis-je partager ma déclaration Pokémon ?', 'Oui. Après avoir enregistré une déclaration, Favmon peut générer des cartes carrées, story et bannière pour Instagram, TikTok, X et les autres plateformes sociales.'],
    ['Puis-je choisir un Pokémon le moins aimé ?', 'Oui. Favmon propose un mode favori et un mode moins favori pour suivre à la fois les Pokémon adorés et les choix plus divisifs.'],
    ["D'où viennent les données Pokémon et les classements Favmon ?", 'Favmon utilise PokéAPI pour les noms, types, sprites et illustrations officielles. Les compteurs de déclarations viennent de la base Neon Postgres propre au site.'],
  ],
};

faqByLanguage['es-CL'] = faqByLanguage.es;
faqByLanguage['es-PR'] = faqByLanguage.es;
faqByLanguage['es-CR'] = faqByLanguage.es;

export function localePrefix(language) {
  return localeOptions.find((option) => option.code === language)?.prefix ?? '';
}

export function localizedPath(route, language) {
  const prefix = localePrefix(language);
  return `${prefix}${route === '/' ? '' : route}` || '/';
}

export function absoluteLocalizedUrl(route, language) {
  return `${siteBaseUrl}${localizedPath(route, language)}`;
}

export function alternatesForRoute(route) {
  return [
    { hreflang: 'x-default', href: absoluteLocalizedUrl(route, 'en') },
    ...localeOptions.map((option) => ({ hreflang: option.code, href: absoluteLocalizedUrl(route, option.code) })),
  ];
}

export function seoFor(route, language) {
  return routeSeoByLanguage[language]?.[route] ?? englishRouteSeo[route];
}

export function ogLocaleFor(language) {
  return localeOptions.find((option) => option.code === language)?.ogLocale ?? 'en_US';
}

export function faqFor(language) {
  return faqByLanguage[language] ?? faqByLanguage.en;
}

export function buildStructuredData(route, language) {
  const seo = seoFor(route, language);
  const canonicalUrl = absoluteLocalizedUrl(route, language);
  const organizationId = `${siteBaseUrl}/#organization`;
  const websiteId = `${siteBaseUrl}/#website`;
  const graph = [
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: brandName,
      alternateName: siteName,
      url: siteBaseUrl,
      logo: `${siteBaseUrl}/icon-512x512.png`,
      sameAs: [kofiUrl],
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: siteBaseUrl,
      name: brandName,
      alternateName: siteName,
      description: englishRouteSeo['/'].description,
      inLanguage: localeOptions.map((option) => option.code),
      publisher: { '@id': organizationId },
      isAccessibleForFree: true,
    },
    {
      '@type': 'WebApplication',
      '@id': `${siteBaseUrl}/#webapp`,
      name: brandName,
      alternateName: siteName,
      url: siteBaseUrl,
      applicationCategory: 'GameApplication',
      operatingSystem: 'Web',
      isAccessibleForFree: true,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: [
        'Declare a favorite or least favorite Pokémon',
        'Build and export a Favorite Pokémon picker board',
        'Explore community Pokédex rankings',
        'Play a Pokémon popularity guessing game',
        'Download square, story, and banner social cards',
      ],
      publisher: { '@id': organizationId },
    },
    {
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: seo.socialTitle,
      description: seo.description,
      inLanguage: language,
      isPartOf: { '@id': websiteId },
      publisher: { '@id': organizationId },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: ogImageUrl,
        width: 1200,
        height: 630,
      },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: brandName,
          item: siteBaseUrl,
        },
        ...(route === '/'
          ? []
          : [
              {
                '@type': 'ListItem',
                position: 2,
                name: seo.socialTitle,
                item: canonicalUrl,
              },
            ]),
      ],
    },
  ];

  if (route === '/') {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonicalUrl}#faq`,
      inLanguage: language,
      mainEntity: faqFor(language).map(([question, answer]) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer,
        },
      })),
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}
