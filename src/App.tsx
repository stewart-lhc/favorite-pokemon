import {
  Ban,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Coffee,
  Gamepad2,
  Heart,
  Download,
  Search,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import { FormEvent, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  allGenerations,
  fetchPokemonList,
  formatPokemonName,
  getGeneration,
  generationLabel,
  mergePokemonStats,
  pokemonOfficialArtworkUrl,
  pokemonSpriteUrl,
  remotePokemonOfficialArtworkUrl,
  typeIconUrl,
} from './lib/pokemon';
import {
  createBackendDeclaration,
  loadBackendData,
  loadPokemonDeclarations,
} from './lib/backend';
import {
  clearDeclarations,
  getLocalDeclarationSummary,
  hasDeclaredOnDevice,
  markDeclaredOnDevice,
} from './lib/storage';
import type {
  Declaration,
  LocalDeclarationSummary,
  GenerationKey,
  Mode,
  PokemonRow,
  PokemonStat,
  PokemonType,
} from './types';

const localeOptions = [
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語', shortLabel: 'JA', prefix: '/ja', country: 'Japan' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어', shortLabel: 'KO', prefix: '/ko', country: 'South Korea' },
  { code: 'zh-CN', label: 'Simplified Chinese', nativeLabel: '简体中文', shortLabel: '简中', prefix: '/zh-cn', country: 'China' },
  { code: 'zh-TW', label: 'Traditional Chinese', nativeLabel: '繁體中文', shortLabel: '繁中', prefix: '/zh-tw', country: 'Taiwan' },
  { code: 'es-CL', label: 'Spanish (Chile)', nativeLabel: 'Español CL', shortLabel: 'ES-CL', prefix: '/es-cl', country: 'Chile' },
  { code: 'en', label: 'English', nativeLabel: 'English', shortLabel: 'EN', prefix: '', country: 'Singapore' },
  { code: 'zh-HK', label: 'Traditional Chinese (Hong Kong)', nativeLabel: '繁體中文 HK', shortLabel: 'ZH-HK', prefix: '/zh-hk', country: 'Hong Kong' },
  { code: 'es', label: 'Spanish (Spain)', nativeLabel: 'Español', shortLabel: 'ES', prefix: '/es', country: 'Spain' },
  { code: 'es-PR', label: 'Spanish (Puerto Rico)', nativeLabel: 'Español PR', shortLabel: 'ES-PR', prefix: '/es-pr', country: 'Puerto Rico' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', shortLabel: 'FR', prefix: '/fr', country: 'France' },
  { code: 'es-CR', label: 'Spanish (Costa Rica)', nativeLabel: 'Español CR', shortLabel: 'ES-CR', prefix: '/es-cr', country: 'Costa Rica' },
] as const;

type Language = typeof localeOptions[number]['code'];
type Route = '/' | '/game' | '/explore' | '/pokedex' | '/stats';
type SortKey = 'number' | 'name' | 'fans';
type StatusFilter = 'all' | 'revealed' | 'hidden';

const siteBaseUrl = 'https://favmon.com';
const siteDomain = 'favmon.com';
const kofiUrl = 'https://ko-fi.com/favmon';
const siteName = "Every Pokémon is Someone's Favorite";
const brandName = 'Favmon';
const ogImageUrl = `${siteBaseUrl}/og-image.png`;
const twitterImageUrl = `${siteBaseUrl}/twitter-card.png`;

type RouteSeo = { title: string; socialTitle: string; description: string };

const englishRouteSeo: Record<Route, RouteSeo> = {
  '/': {
    title: `Favmon | ${siteName}`,
    socialTitle: `${siteName} | Favmon`,
    description:
      'Declare your favorite or least favorite Pokémon, reveal community Pokédex rankings, and download shareable trainer cards on Favmon.',
  },
  '/game': {
    title: `Pokémon Popularity Game | Favmon`,
    socialTitle: `Who's More Loved? | Favmon`,
    description:
      'Play Favmon\'s Pokémon popularity guessing game and choose which Pokémon has more love from community declaration data.',
  },
  '/explore': {
    title: `Explore Pokémon Declarations | Favmon`,
    socialTitle: `Explore Pokémon Declarations | Favmon`,
    description:
      'Browse recent Favmon trainer declarations and discover the stories behind favorite and least favorite Pokémon picks.',
  },
  '/pokedex': {
    title: `Community Pokédex Rankings | Favmon`,
    socialTitle: `Community Pokédex Rankings | Favmon`,
    description:
      'Explore Favmon\'s community Pokédex rankings, National Dex coverage, revealed Pokémon, hidden entries, and fan counts.',
  },
  '/stats': {
    title: `Pokémon Fan Rankings and Stats | Favmon`,
    socialTitle: `Pokémon Fan Rankings and Stats | Favmon`,
    description:
      'Track Favmon voting stats, top Pokémon rankings, Pokédex coverage, favorite picks, least-favorite picks, and latest declarations.',
  },
};

const japaneseRouteSeo: Record<Route, RouteSeo> = {
  '/': {
    title: `Favmon | ${siteName}`,
    socialTitle: `${siteName} | Favmon`,
    description:
      'Favmonで好きなポケモンや苦手なポケモンを宣言し、コミュニティ図鑑ランキングと共有用トレーナーカードを楽しめます。',
  },
  '/game': {
    title: 'ポケモン人気ゲーム | Favmon',
    socialTitle: 'どちらがより愛されている？ | Favmon',
    description:
      'Favmonのコミュニティ宣言データを使って、どちらのポケモンがより多く選ばれているかを当てる人気ゲームです。',
  },
  '/explore': {
    title: 'ポケモン宣言を探索 | Favmon',
    socialTitle: 'ポケモン宣言を探索 | Favmon',
    description:
      'Favmonに投稿された最新のトレーナー宣言を読み、好きなポケモンや苦手なポケモンに込められた理由を発見できます。',
  },
  '/pokedex': {
    title: 'コミュニティ図鑑ランキング | Favmon',
    socialTitle: 'コミュニティ図鑑ランキング | Favmon',
    description:
      'Favmonのコミュニティ図鑑で、全国図鑑の発見状況、ファン数、まだ宣言されていないポケモンを確認できます。',
  },
  '/stats': {
    title: 'ポケモン人気ランキングと統計 | Favmon',
    socialTitle: 'ポケモン人気ランキングと統計 | Favmon',
    description:
      'Favmonの投票統計、人気ランキング、図鑑カバー率、最新のコミュニティ宣言データを追跡できます。',
  },
};

const koreanRouteSeo: Record<Route, RouteSeo> = {
  '/': {
    title: `Favmon | ${siteName}`,
    socialTitle: `${siteName} | Favmon`,
    description:
      'Favmon에서 가장 좋아하거나 덜 좋아하는 포켓몬을 선언하고 커뮤니티 도감 순위와 공유용 트레이너 카드를 확인하세요.',
  },
  '/game': {
    title: '포켓몬 인기 게임 | Favmon',
    socialTitle: '누가 더 사랑받을까? | Favmon',
    description:
      'Favmon 커뮤니티 선언 데이터를 바탕으로 어떤 포켓몬이 더 많은 사랑을 받는지 맞히는 인기 게임입니다.',
  },
  '/explore': {
    title: '포켓몬 선언 둘러보기 | Favmon',
    socialTitle: '포켓몬 선언 둘러보기 | Favmon',
    description:
      'Favmon에 올라온 최신 트레이너 선언을 읽고 좋아하는 포켓몬과 덜 좋아하는 포켓몬에 담긴 이유를 살펴보세요.',
  },
  '/pokedex': {
    title: '커뮤니티 도감 순위 | Favmon',
    socialTitle: '커뮤니티 도감 순위 | Favmon',
    description:
      'Favmon 커뮤니티 도감에서 전국도감 커버리지, 공개된 포켓몬, 숨겨진 포켓몬, 팬 수를 확인하세요.',
  },
  '/stats': {
    title: '포켓몬 팬 순위와 통계 | Favmon',
    socialTitle: '포켓몬 팬 순위와 통계 | Favmon',
    description:
      'Favmon 투표 통계, 상위 포켓몬 순위, 도감 커버리지, 최신 커뮤니티 선언 데이터를 추적하세요.',
  },
};

const simplifiedChineseRouteSeo: Record<Route, RouteSeo> = {
  '/': {
    title: `Favmon | ${siteName}`,
    socialTitle: `${siteName} | Favmon`,
    description:
      '在 Favmon 宣告你最喜欢或最不喜欢的宝可梦，查看社区图鉴排名，并下载适合分享的训练家卡片。',
  },
  '/game': {
    title: '宝可梦人气竞猜游戏 | Favmon',
    socialTitle: '谁更受欢迎？ | Favmon',
    description:
      '游玩 Favmon 宝可梦人气竞猜，根据社区宣告数据判断哪只宝可梦获得更多喜爱。',
  },
  '/explore': {
    title: '探索宝可梦宣告 | Favmon',
    socialTitle: '探索宝可梦宣告 | Favmon',
    description:
      '浏览 Favmon 最新训练家宣告，了解大家选择最喜欢或最不喜欢宝可梦背后的理由。',
  },
  '/pokedex': {
    title: '社区图鉴排名 | Favmon',
    socialTitle: '社区图鉴排名 | Favmon',
    description:
      '查看 Favmon 社区图鉴排名、全国图鉴覆盖率、已揭晓宝可梦、隐藏条目和粉丝数量。',
  },
  '/stats': {
    title: '宝可梦粉丝排名与统计 | Favmon',
    socialTitle: '宝可梦粉丝排名与统计 | Favmon',
    description:
      '追踪 Favmon 投票统计、热门宝可梦排名、图鉴覆盖率、最喜欢与最不喜欢选择和最新宣告。',
  },
};

const traditionalChineseRouteSeo: Record<Route, RouteSeo> = {
  '/': {
    title: `Favmon | ${siteName}`,
    socialTitle: `${siteName} | Favmon`,
    description:
      '在 Favmon 宣告你最喜歡或最不喜歡的寶可夢，查看社群圖鑑排名，並下載適合分享的訓練家卡片。',
  },
  '/game': {
    title: '寶可夢人氣猜謎遊戲 | Favmon',
    socialTitle: '誰更受歡迎？ | Favmon',
    description:
      '遊玩 Favmon 寶可夢人氣猜謎，根據社群宣告資料判斷哪隻寶可夢獲得更多喜愛。',
  },
  '/explore': {
    title: '探索寶可夢宣告 | Favmon',
    socialTitle: '探索寶可夢宣告 | Favmon',
    description:
      '瀏覽 Favmon 最新訓練家宣告，了解大家選擇最喜歡或最不喜歡寶可夢背後的理由。',
  },
  '/pokedex': {
    title: '社群圖鑑排名 | Favmon',
    socialTitle: '社群圖鑑排名 | Favmon',
    description:
      '查看 Favmon 社群圖鑑排名、全國圖鑑覆蓋率、已揭曉寶可夢、隱藏條目和粉絲數量。',
  },
  '/stats': {
    title: '寶可夢粉絲排名與統計 | Favmon',
    socialTitle: '寶可夢粉絲排名與統計 | Favmon',
    description:
      '追蹤 Favmon 投票統計、熱門寶可夢排名、圖鑑覆蓋率、最喜歡與最不喜歡選擇和最新宣告。',
  },
};

const spanishRouteSeo: Record<Route, RouteSeo> = {
  '/': {
    title: `Favmon | ${siteName}`,
    socialTitle: `${siteName} | Favmon`,
    description:
      'Declara tu Pokémon favorito o menos favorito en Favmon, consulta rankings de la Pokédex comunitaria y descarga cartas para compartir.',
  },
  '/game': {
    title: 'Juego de popularidad Pokémon | Favmon',
    socialTitle: '¿Quién es más querido? | Favmon',
    description:
      'Juega al reto de popularidad de Favmon y adivina qué Pokémon recibe más cariño según las declaraciones de la comunidad.',
  },
  '/explore': {
    title: 'Explorar declaraciones Pokémon | Favmon',
    socialTitle: 'Explorar declaraciones Pokémon | Favmon',
    description:
      'Explora las declaraciones recientes de entrenadores en Favmon y descubre las historias detrás de cada Pokémon elegido.',
  },
  '/pokedex': {
    title: 'Ranking de Pokédex comunitaria | Favmon',
    socialTitle: 'Ranking de Pokédex comunitaria | Favmon',
    description:
      'Consulta en Favmon el ranking de la Pokédex comunitaria, la cobertura de la Dex Nacional, entradas reveladas y recuentos de fans.',
  },
  '/stats': {
    title: 'Rankings y estadísticas Pokémon | Favmon',
    socialTitle: 'Rankings y estadísticas Pokémon | Favmon',
    description:
      'Sigue estadísticas de votos en Favmon, rankings de Pokémon, cobertura de Pokédex y las declaraciones más recientes.',
  },
};

const frenchRouteSeo: Record<Route, RouteSeo> = {
  '/': {
    title: `Favmon | ${siteName}`,
    socialTitle: `${siteName} | Favmon`,
    description:
      'Déclare ton Pokémon préféré ou le moins aimé sur Favmon, consulte les classements du Pokédex communautaire et télécharge des cartes à partager.',
  },
  '/game': {
    title: 'Jeu de popularité Pokémon | Favmon',
    socialTitle: 'Qui est le plus aimé ? | Favmon',
    description:
      'Joue au défi de popularité Favmon et choisis quel Pokémon reçoit le plus d\'amour selon les déclarations de la communauté.',
  },
  '/explore': {
    title: 'Explorer les déclarations Pokémon | Favmon',
    socialTitle: 'Explorer les déclarations Pokémon | Favmon',
    description:
      'Parcours les déclarations récentes des dresseurs sur Favmon et découvre les histoires derrière chaque Pokémon choisi.',
  },
  '/pokedex': {
    title: 'Classement du Pokédex communautaire | Favmon',
    socialTitle: 'Classement du Pokédex communautaire | Favmon',
    description:
      'Explore sur Favmon le classement du Pokédex communautaire, la couverture du Dex National, les entrées révélées et les fans.',
  },
  '/stats': {
    title: 'Classements et statistiques Pokémon | Favmon',
    socialTitle: 'Classements et statistiques Pokémon | Favmon',
    description:
      'Suis les statistiques Favmon, les meilleurs classements Pokémon, la couverture du Pokédex et les dernières déclarations.',
  },
};

const routeSeoByLanguage = {
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
} satisfies Record<Language, Record<Route, RouteSeo>>;

const ogLocaleByLanguage: Record<Language, string> = {
  ja: 'ja_JP',
  ko: 'ko_KR',
  'zh-CN': 'zh_CN',
  'zh-TW': 'zh_TW',
  'es-CL': 'es_CL',
  en: 'en_US',
  'zh-HK': 'zh_HK',
  es: 'es_ES',
  'es-PR': 'es_PR',
  fr: 'fr_FR',
  'es-CR': 'es_CR',
};

const englishTranslations = {
  appTitle: "Every Pokémon is someone's favourite",
  declare: 'Declare',
  game: 'Game',
  explore: 'Explore',
  pokedex: 'Pokédex',
  stats: 'Stats',
  promo: 'Track your Pokémon card collection with Card Codex (supports both English & Japanese cards)',
  fanDeclaration: 'Fan declaration',
  declarationLead: 'Add your name, choose the Pokémon you would defend anywhere, and make it official.',
  trainerName: 'Your name',
  trainerPlaceholder: 'Trainer',
  favouritePokemon: 'Favourite Pokémon',
  searchPlaceholder: 'Search by name or number',
  reason: 'Why is it your favourite?',
  reasonHelp: 'Tell us why - at least 10 characters',
  reasonPlaceholder: 'This is where hearts are won.',
  declareButton: 'Declare favourite',
  alreadyDeclared: 'You have already declared your favourite Pokémon on this device.',
  success: 'Declaration saved. That Pokémon has someone now.',
  firstFan: 'You are the first official fan of {pokemon} in the world!',
  moreFans: 'There are already {count} fans of {pokemon} like you!',
  journeyContinues: '{count} / 1025 Pokémon revealed - the journey continues...',
  kofiSupport: 'Enjoying the site? Support on Ko-fi',
  instagramChangeFormMsg: 'Want to change your declared Pokémon form? Send a message with your trainer name and Pokémon.',
  declaredPokemon: 'Your declared Pokémon',
  viewStats: 'View stats',
  communityPokedex: 'Community Pokédex',
  discoveredHeading: 'Pokémon discovered through favourites',
  searchPokedex: 'Search the Pokédex',
  sortBy: 'Sort by',
  generation: 'Generation',
  allGenerations: 'All generations',
  grid: 'Grid',
  list: 'List',
  all: 'All',
  revealed: 'Revealed',
  hidden: 'Hidden',
  showing: 'Showing',
  of: 'of',
  discovered: 'Discovered',
  hiddenShort: 'Hidden',
  statsHeading: 'How the universal declaration is going',
  refresh: 'Refresh',
  refreshing: 'Refreshing...',
  declarations: 'Declarations',
  uniquePokemon: 'Unique Pokémon',
  pokedexCovered: 'Pokédex covered',
  topTen: 'Top 10 most chosen',
  fullRanking: 'Full ranking',
  latest: 'Latest 10 declarations',
  chose: 'chose',
  noDeclarations: 'No declarations to show right now.',
  exploreHeading: 'Explore Declarations',
  loading: 'Loading Pokémon...',
  whosMoreLoved: "Who's More Loved?",
  pickTheOne: 'Pick the Pokémon with most love',
  streak: 'Streak',
  votes: 'declarations',
  playAgain: 'Play Again',
  gameOver: 'Game Over',
  support: 'Support me on Ko-fi',
  modeToggle: 'Favourite',
  language: 'Language',
  pokemonLoadWarning: 'Could not load PokéAPI data.',
  backendLoadWarning: 'Could not load Neon declarations.',
  pokemonLoadFallback: 'Could not load PokéAPI data.',
  backendLoadFallback: 'Could not load Neon data.',
  saveErrorFallback: 'Could not save declaration.',
  nationalDex: 'National Dex',
  currentPick: 'Current pick',
  trainerTerminal: 'Trainer terminal',
  favouriteFile: 'Favourite file',
  rivalFile: 'Rival file',
  saving: 'Saving...',
  downloadCardTitle: 'Download your Pokémon card!',
  downloadCardAria: 'Download your Pokémon card',
  cardArtStyle: 'Card art style',
  officialArt: 'Official Art',
  pixelArt: 'Pixel Art',
  shiny: 'Shiny',
  downloaded: 'Downloaded!',
  generatingCards: 'Generating cards...',
  cardGenerationError: 'Could not generate the card. Please try again.',
  cardSquare: 'Square (Instagram)',
  cardVertical: 'Story (TikTok)',
  cardHorizontal: 'Banner (X/Twitter)',
  sortNumber: 'Number',
  sortName: 'Name',
  sortFans: 'Most fans',
  fans: 'fans',
  byGeneration: 'By Generation',
  byType: 'By Type',
  rank: 'Rank',
  pokemonColumn: 'Pokémon',
  votesColumn: 'Votes',
  exitGame: 'Exit game',
  gameDisclaimer: 'Data based on declarations stored in our Neon database',
  legendary: 'Legendary.',
  niceTry: 'Nice try!',
  firstPage: 'First page',
  previous: 'Previous',
  next: 'Next',
  lastPage: 'Last page',
  close: 'Close',
  loadingDeclarations: 'Loading declarations',
  declarationsLoadError: 'Could not load declarations.',
  noDeclarationsYet: 'No declarations yet.',
  dexScan: 'Dex scan',
  ready: 'Ready',
  legalDisclaimer: 'This site is not affiliated with or endorsed by Nintendo or The Pokémon Company. Pokémon and all related names are trademarks of Nintendo/Creatures Inc./GAME FREAK Inc.',
  creatorLinks: 'Creator links',
  typeNormal: 'Normal',
  typeFighting: 'Fighting',
  typeFlying: 'Flying',
  typePoison: 'Poison',
  typeGround: 'Ground',
  typeRock: 'Rock',
  typeBug: 'Bug',
  typeGhost: 'Ghost',
  typeSteel: 'Steel',
  typeFire: 'Fire',
  typeWater: 'Water',
  typeGrass: 'Grass',
  typeElectric: 'Electric',
  typePsychic: 'Psychic',
  typeIce: 'Ice',
  typeDragon: 'Dragon',
  typeDark: 'Dark',
  typeFairy: 'Fairy',
  faqHeading: 'Favmon FAQ',
  faqWhatQuestion: 'What is Favmon?',
  faqWhatAnswer: 'Favmon is a fan-made community Pokédex where trainers declare their favorite or least favorite Pokémon, compare rankings, and reveal how far the National Dex has been covered.',
  faqShareQuestion: 'Can I share my Pokémon declaration?',
  faqShareAnswer: 'Yes. After saving a declaration, Favmon can generate square, story, and banner trainer cards for Instagram, TikTok, X, and other social platforms.',
  faqLeastQuestion: 'Can I choose a least favorite Pokémon?',
  faqLeastAnswer: 'Yes. Favmon includes a favorite mode and a least-favorite mode so the community can track both loved Pokémon and divisive picks.',
  faqDataQuestion: 'Where does Favmon get Pokémon and ranking data?',
  faqDataAnswer: 'Favmon uses PokéAPI for Pokémon names, types, sprites, and artwork. Community declaration counts come from this site\'s own Neon Postgres database.',
};

type TranslationMessages = typeof englishTranslations;

const spanishTranslations: TranslationMessages = {
  appTitle: 'Cada Pokémon es el favorito de alguien',
  declare: 'Declarar',
  game: 'Juego',
  explore: 'Explorar',
  pokedex: 'Pokédex',
  stats: 'Estadísticas',
  promo: 'Gestiona tu colección de cartas Pokémon con Card Codex',
  fanDeclaration: 'Declaración fan',
  declarationLead: 'Añade tu nombre, elige el Pokémon que defenderías en cualquier sitio y hazlo oficial.',
  trainerName: 'Tu nombre',
  trainerPlaceholder: 'Entrenador/a',
  favouritePokemon: 'Pokémon favorito',
  searchPlaceholder: 'Buscar por nombre o número',
  reason: '¿Por qué es tu favorito?',
  reasonHelp: 'Cuéntanos por qué - al menos 10 caracteres',
  reasonPlaceholder: 'Aquí se ganan corazones.',
  declareButton: 'Declarar favorito',
  alreadyDeclared: 'Ya has declarado tu Pokémon favorito en este dispositivo.',
  success: 'Declaración guardada. Ese Pokémon ya tiene a alguien.',
  firstFan: '¡Eres el primer fan oficial de {pokemon} en el mundo!',
  moreFans: '¡Ya hay {count} fans de {pokemon} como tú!',
  journeyContinues: '{count} / 1025 Pokémon revelados - el viaje continúa...',
  kofiSupport: '¿Te gusta la web? Apoya en Ko-fi',
  instagramChangeFormMsg: '¿Quieres cambiar la forma regional de tu Pokémon? Envía un mensaje con tu nombre de entrenador/a y Pokémon.',
  declaredPokemon: 'Tu Pokémon declarado',
  viewStats: 'Ver estadísticas',
  communityPokedex: 'Pokédex comunitaria',
  discoveredHeading: 'Pokémon descubiertos por favoritos',
  searchPokedex: 'Buscar en la Pokédex',
  sortBy: 'Ordenar por',
  generation: 'Generación',
  allGenerations: 'Todas las generaciones',
  grid: 'Cuadrícula',
  list: 'Lista',
  all: 'Todos',
  revealed: 'Revelados',
  hidden: 'Ocultos',
  showing: 'Mostrando',
  of: 'de',
  discovered: 'Descubiertos',
  hiddenShort: 'Ocultos',
  statsHeading: 'Cómo va la declaración universal',
  refresh: 'Actualizar',
  refreshing: 'Actualizando...',
  declarations: 'Declaraciones',
  uniquePokemon: 'Pokémon únicos',
  pokedexCovered: 'Pokédex cubierta',
  topTen: 'Top 10 más elegidos',
  fullRanking: 'Ranking completo',
  latest: 'Últimas 10 declaraciones',
  chose: 'eligió',
  noDeclarations: 'No hay declaraciones que mostrar por ahora.',
  exploreHeading: 'Explorar declaraciones',
  loading: 'Cargando Pokémon...',
  whosMoreLoved: '¿Quién es más querido?',
  pickTheOne: 'Elige el Pokémon con más cariño',
  streak: 'Racha',
  votes: 'declaraciones',
  playAgain: 'Jugar otra vez',
  gameOver: 'Fin del juego',
  support: 'Apóyame en Ko-fi',
  modeToggle: 'Favorito',
  language: 'Idioma',
  pokemonLoadWarning: 'No se pudieron cargar los datos de PokéAPI.',
  backendLoadWarning: 'No se pudieron cargar las declaraciones de Neon.',
  pokemonLoadFallback: 'No se pudieron cargar los datos de PokéAPI.',
  backendLoadFallback: 'No se pudieron cargar los datos de Neon.',
  saveErrorFallback: 'No se pudo guardar la declaración.',
  nationalDex: 'Dex nacional',
  currentPick: 'Selección actual',
  trainerTerminal: 'Terminal de entrenador',
  favouriteFile: 'Archivo favorito',
  rivalFile: 'Archivo rival',
  saving: 'Guardando...',
  downloadCardTitle: '¡Descarga tu carta Pokémon!',
  downloadCardAria: 'Descargar tu carta Pokémon',
  cardArtStyle: 'Estilo de arte de la carta',
  officialArt: 'Arte oficial',
  pixelArt: 'Pixel art',
  shiny: 'Shiny',
  downloaded: '¡Descargado!',
  generatingCards: 'Generando cartas...',
  cardGenerationError: 'No se pudo generar la carta. Inténtalo de nuevo.',
  cardSquare: 'Cuadrada (Instagram)',
  cardVertical: 'Historia (TikTok)',
  cardHorizontal: 'Banner (X/Twitter)',
  sortNumber: 'Número',
  sortName: 'Nombre',
  sortFans: 'Más fans',
  fans: 'fans',
  byGeneration: 'Por generación',
  byType: 'Por tipo',
  rank: 'Puesto',
  pokemonColumn: 'Pokémon',
  votesColumn: 'Votos',
  exitGame: 'Salir del juego',
  gameDisclaimer: 'Datos basados en declaraciones guardadas en nuestra base de datos Neon',
  legendary: 'Legendario.',
  niceTry: 'Buen intento.',
  firstPage: 'Primera página',
  previous: 'Anterior',
  next: 'Siguiente',
  lastPage: 'Última página',
  close: 'Cerrar',
  loadingDeclarations: 'Cargando declaraciones',
  declarationsLoadError: 'No se pudieron cargar las declaraciones.',
  noDeclarationsYet: 'Aún no hay declaraciones.',
  dexScan: 'Escaneo Dex',
  ready: 'Listo',
  legalDisclaimer: 'Este sitio no está afiliado ni respaldado por Nintendo ni The Pokémon Company. Pokémon y todos los nombres relacionados son marcas de Nintendo/Creatures Inc./GAME FREAK Inc.',
  creatorLinks: 'Enlaces del creador',
  typeNormal: 'Normal',
  typeFighting: 'Lucha',
  typeFlying: 'Volador',
  typePoison: 'Veneno',
  typeGround: 'Tierra',
  typeRock: 'Roca',
  typeBug: 'Bicho',
  typeGhost: 'Fantasma',
  typeSteel: 'Acero',
  typeFire: 'Fuego',
  typeWater: 'Agua',
  typeGrass: 'Planta',
  typeElectric: 'Eléctrico',
  typePsychic: 'Psíquico',
  typeIce: 'Hielo',
  typeDragon: 'Dragón',
  typeDark: 'Siniestro',
  typeFairy: 'Hada',
  faqHeading: 'Preguntas frecuentes de Favmon',
  faqWhatQuestion: '¿Qué es Favmon?',
  faqWhatAnswer: 'Favmon es una Pokédex comunitaria creada por fans donde entrenadores declaran su Pokémon favorito o menos favorito, comparan rankings y revelan el avance de la Dex Nacional.',
  faqShareQuestion: '¿Puedo compartir mi declaración Pokémon?',
  faqShareAnswer: 'Sí. Después de guardar una declaración, Favmon puede generar cartas cuadradas, verticales y de banner para Instagram, TikTok, X y otras redes sociales.',
  faqLeastQuestion: '¿Puedo elegir un Pokémon menos favorito?',
  faqLeastAnswer: 'Sí. Favmon incluye modo favorito y modo menos favorito para que la comunidad mida tanto los Pokémon queridos como las elecciones más divisivas.',
  faqDataQuestion: '¿De dónde obtiene Favmon los datos de Pokémon y rankings?',
  faqDataAnswer: 'Favmon usa PokéAPI para nombres, tipos, sprites e ilustraciones. Los conteos de declaraciones vienen de la base de datos Neon Postgres propia del sitio.',
};

const japaneseTranslations: TranslationMessages = {
  appTitle: 'どのポケモンも、誰かのいちばんのお気に入り',
  declare: '宣言',
  game: 'ゲーム',
  explore: '見る',
  pokedex: 'ポケモン図鑑',
  stats: '統計',
  promo: 'Card Codexでポケモンカードコレクションを管理',
  fanDeclaration: 'ファン宣言',
  declarationLead: '名前を入力し、どこでも守りたいポケモンを選んで、公式に宣言しましょう。',
  trainerName: 'あなたの名前',
  trainerPlaceholder: 'トレーナー',
  favouritePokemon: 'お気に入りのポケモン',
  searchPlaceholder: '名前または番号で検索',
  reason: 'なぜお気に入りですか？',
  reasonHelp: '理由を10文字以上で教えてください',
  reasonPlaceholder: 'ここで愛が証明されます。',
  declareButton: 'お気に入りを宣言',
  alreadyDeclared: 'この端末ではすでにお気に入りのポケモンを宣言しています。',
  success: '宣言を保存しました。このポケモンにはあなたがいます。',
  firstFan: 'あなたは世界初の{pokemon}公式ファンです！',
  moreFans: 'あなたのような{pokemon}ファンはすでに{count}人います！',
  journeyContinues: '{count} / 1025匹のポケモンが発見済み - 旅は続きます...',
  kofiSupport: 'サイトを楽しんでいますか？Ko-fiで応援',
  instagramChangeFormMsg: '宣言したポケモンの姿を変更したい場合は、トレーナー名とポケモンをメッセージで送ってください。',
  declaredPokemon: '宣言したポケモン',
  viewStats: '統計を見る',
  communityPokedex: 'コミュニティ図鑑',
  discoveredHeading: 'お気に入りから発見されたポケモン',
  searchPokedex: '図鑑を検索',
  sortBy: '並び替え',
  generation: '世代',
  allGenerations: 'すべての世代',
  grid: 'グリッド',
  list: 'リスト',
  all: 'すべて',
  revealed: '発見済み',
  hidden: '未発見',
  showing: '表示中',
  of: '中',
  discovered: '発見済み',
  hiddenShort: '未発見',
  statsHeading: 'みんなの宣言の進み具合',
  refresh: '更新',
  refreshing: '更新中...',
  declarations: '宣言',
  uniquePokemon: 'ユニークなポケモン',
  pokedexCovered: '図鑑カバー率',
  topTen: '選ばれたトップ10',
  fullRanking: '全ランキング',
  latest: '最新10件の宣言',
  chose: 'が選んだのは',
  noDeclarations: '現在表示できる宣言はありません。',
  exploreHeading: '宣言を探索',
  loading: 'ポケモンを読み込み中...',
  whosMoreLoved: 'どちらがより愛されている？',
  pickTheOne: 'より愛されているポケモンを選ぼう',
  streak: '連勝',
  votes: '宣言',
  playAgain: 'もう一度遊ぶ',
  gameOver: 'ゲームオーバー',
  support: 'Ko-fiで応援',
  modeToggle: 'お気に入り',
  language: '言語',
  pokemonLoadWarning: 'PokéAPIデータを読み込めませんでした。',
  backendLoadWarning: 'Neonの宣言を読み込めませんでした。',
  pokemonLoadFallback: 'PokéAPIデータを読み込めませんでした。',
  backendLoadFallback: 'Neonデータを読み込めませんでした。',
  saveErrorFallback: '宣言を保存できませんでした。',
  nationalDex: '全国図鑑',
  currentPick: '現在の選択',
  trainerTerminal: 'トレーナー端末',
  favouriteFile: 'お気に入りファイル',
  rivalFile: 'ライバルファイル',
  saving: '保存中...',
  downloadCardTitle: 'ポケモンカードをダウンロード！',
  downloadCardAria: 'ポケモンカードをダウンロード',
  cardArtStyle: 'カードアートのスタイル',
  officialArt: '公式アート',
  pixelArt: 'ドット絵',
  shiny: '色違い',
  downloaded: 'ダウンロード済み！',
  generatingCards: 'カードを生成中...',
  cardGenerationError: 'カードを生成できませんでした。もう一度お試しください。',
  cardSquare: '正方形（Instagram）',
  cardVertical: 'ストーリー（TikTok）',
  cardHorizontal: 'バナー（X/Twitter）',
  sortNumber: '番号',
  sortName: '名前',
  sortFans: 'ファンが多い順',
  fans: 'ファン',
  byGeneration: '世代別',
  byType: 'タイプ別',
  rank: '順位',
  pokemonColumn: 'ポケモン',
  votesColumn: '票',
  exitGame: 'ゲームを終了',
  gameDisclaimer: 'データはNeonデータベースに保存された宣言に基づきます',
  legendary: 'レジェンド級。',
  niceTry: 'ナイストライ。',
  firstPage: '最初のページ',
  previous: '前へ',
  next: '次へ',
  lastPage: '最後のページ',
  close: '閉じる',
  loadingDeclarations: '宣言を読み込み中',
  declarationsLoadError: '宣言を読み込めませんでした。',
  noDeclarationsYet: 'まだ宣言はありません。',
  dexScan: '図鑑スキャン',
  ready: '準備完了',
  legalDisclaimer: 'このサイトはNintendo、The Pokémon Companyとは提携しておらず、承認も受けていません。Pokémonおよび関連する名称はNintendo/Creatures Inc./GAME FREAK Inc.の商標です。',
  creatorLinks: 'クリエイターリンク',
  typeNormal: 'ノーマル',
  typeFighting: 'かくとう',
  typeFlying: 'ひこう',
  typePoison: 'どく',
  typeGround: 'じめん',
  typeRock: 'いわ',
  typeBug: 'むし',
  typeGhost: 'ゴースト',
  typeSteel: 'はがね',
  typeFire: 'ほのお',
  typeWater: 'みず',
  typeGrass: 'くさ',
  typeElectric: 'でんき',
  typePsychic: 'エスパー',
  typeIce: 'こおり',
  typeDragon: 'ドラゴン',
  typeDark: 'あく',
  typeFairy: 'フェアリー',
  faqHeading: 'Favmon FAQ',
  faqWhatQuestion: 'Favmonとは何ですか？',
  faqWhatAnswer: 'Favmonはファンメイドのコミュニティ図鑑です。トレーナーがお気に入り、または苦手なポケモンを宣言し、ランキングや全国図鑑の進行状況を確認できます。',
  faqShareQuestion: 'ポケモン宣言を共有できますか？',
  faqShareAnswer: 'はい。宣言を保存すると、Instagram、TikTok、Xなどで使える正方形、ストーリー、バナー形式のトレーナーカードを生成できます。',
  faqLeastQuestion: '苦手なポケモンも選べますか？',
  faqLeastAnswer: 'はい。Favmonにはお気に入りモードと苦手モードがあり、愛されているポケモンと意見が分かれるポケモンの両方を追跡できます。',
  faqDataQuestion: 'Favmonのポケモン情報とランキングデータはどこから来ますか？',
  faqDataAnswer: 'Favmonはポケモン名、タイプ、スプライト、公式アートにPokéAPIを使用します。コミュニティ宣言数は本サイト独自のNeon Postgresデータベースから取得します。',
};

const koreanTranslations: TranslationMessages = {
  appTitle: '모든 포켓몬은 누군가의 최애입니다',
  declare: '선언',
  game: '게임',
  explore: '둘러보기',
  pokedex: '포켓몬 도감',
  stats: '통계',
  promo: 'Card Codex로 포켓몬 카드 컬렉션을 관리하세요',
  fanDeclaration: '팬 선언',
  declarationLead: '이름을 적고 어디서든 지켜주고 싶은 포켓몬을 골라 공식으로 남겨보세요.',
  trainerName: '이름',
  trainerPlaceholder: '트레이너',
  favouritePokemon: '최애 포켓몬',
  searchPlaceholder: '이름 또는 번호로 검색',
  reason: '왜 최애인가요?',
  reasonHelp: '이유를 10자 이상 적어주세요',
  reasonPlaceholder: '마음이 전해지는 자리입니다.',
  declareButton: '최애 선언하기',
  alreadyDeclared: '이 기기에서는 이미 최애 포켓몬을 선언했습니다.',
  success: '선언이 저장되었습니다. 이제 그 포켓몬에게는 당신이 있습니다.',
  firstFan: '당신은 세계 최초의 {pokemon} 공식 팬입니다!',
  moreFans: '당신 같은 {pokemon} 팬이 이미 {count}명 있습니다!',
  journeyContinues: '{count} / 1025마리 포켓몬 공개 - 여정은 계속됩니다...',
  kofiSupport: '사이트가 마음에 드나요? Ko-fi에서 응원하기',
  instagramChangeFormMsg: '선언한 포켓몬의 폼을 바꾸고 싶다면 트레이너 이름과 포켓몬을 메시지로 보내주세요.',
  declaredPokemon: '선언한 포켓몬',
  viewStats: '통계 보기',
  communityPokedex: '커뮤니티 도감',
  discoveredHeading: '최애 선언으로 발견된 포켓몬',
  searchPokedex: '도감 검색',
  sortBy: '정렬',
  generation: '세대',
  allGenerations: '전체 세대',
  grid: '그리드',
  list: '목록',
  all: '전체',
  revealed: '공개됨',
  hidden: '숨김',
  showing: '표시',
  of: '/',
  discovered: '발견됨',
  hiddenShort: '숨김',
  statsHeading: '전 세계 선언 진행 상황',
  refresh: '새로고침',
  refreshing: '새로고침 중...',
  declarations: '선언',
  uniquePokemon: '고유 포켓몬',
  pokedexCovered: '도감 달성률',
  topTen: '가장 많이 선택된 Top 10',
  fullRanking: '전체 순위',
  latest: '최근 선언 10개',
  chose: '선택:',
  noDeclarations: '지금 표시할 선언이 없습니다.',
  exploreHeading: '선언 둘러보기',
  loading: '포켓몬을 불러오는 중...',
  whosMoreLoved: '누가 더 사랑받을까요?',
  pickTheOne: '사랑을 더 많이 받은 포켓몬을 고르세요',
  streak: '연승',
  votes: '선언',
  playAgain: '다시 하기',
  gameOver: '게임 오버',
  support: 'Ko-fi에서 응원하기',
  modeToggle: '최애',
  language: '언어',
  pokemonLoadWarning: 'PokéAPI 데이터를 불러올 수 없습니다.',
  backendLoadWarning: 'Neon 선언을 불러올 수 없습니다.',
  pokemonLoadFallback: 'PokéAPI 데이터를 불러올 수 없습니다.',
  backendLoadFallback: 'Neon 데이터를 불러올 수 없습니다.',
  saveErrorFallback: '선언을 저장할 수 없습니다.',
  nationalDex: '전국 도감',
  currentPick: '현재 선택',
  trainerTerminal: '트레이너 터미널',
  favouriteFile: '최애 파일',
  rivalFile: '라이벌 파일',
  saving: '저장 중...',
  downloadCardTitle: '포켓몬 카드를 다운로드하세요!',
  downloadCardAria: '포켓몬 카드 다운로드',
  cardArtStyle: '카드 아트 스타일',
  officialArt: '공식 아트',
  pixelArt: '픽셀 아트',
  shiny: '색이 다른',
  downloaded: '다운로드 완료!',
  generatingCards: '카드 생성 중...',
  cardGenerationError: '카드를 생성할 수 없습니다. 다시 시도해 주세요.',
  cardSquare: '정사각형(Instagram)',
  cardVertical: '스토리(TikTok)',
  cardHorizontal: '배너(X/Twitter)',
  sortNumber: '번호',
  sortName: '이름',
  sortFans: '팬 많은 순',
  fans: '팬',
  byGeneration: '세대별',
  byType: '타입별',
  rank: '순위',
  pokemonColumn: '포켓몬',
  votesColumn: '표',
  exitGame: '게임 나가기',
  gameDisclaimer: '데이터는 Neon 데이터베이스에 저장된 선언을 기준으로 합니다',
  legendary: '전설급입니다.',
  niceTry: '좋은 시도였어요.',
  firstPage: '첫 페이지',
  previous: '이전',
  next: '다음',
  lastPage: '마지막 페이지',
  close: '닫기',
  loadingDeclarations: '선언 불러오는 중',
  declarationsLoadError: '선언을 불러올 수 없습니다.',
  noDeclarationsYet: '아직 선언이 없습니다.',
  dexScan: '도감 스캔',
  ready: '준비 완료',
  legalDisclaimer: '이 사이트는 Nintendo 또는 The Pokémon Company와 제휴하거나 보증을 받지 않았습니다. Pokémon 및 관련 명칭은 Nintendo/Creatures Inc./GAME FREAK Inc.의 상표입니다.',
  creatorLinks: '크리에이터 링크',
  typeNormal: '노말',
  typeFighting: '격투',
  typeFlying: '비행',
  typePoison: '독',
  typeGround: '땅',
  typeRock: '바위',
  typeBug: '벌레',
  typeGhost: '고스트',
  typeSteel: '강철',
  typeFire: '불꽃',
  typeWater: '물',
  typeGrass: '풀',
  typeElectric: '전기',
  typePsychic: '에스퍼',
  typeIce: '얼음',
  typeDragon: '드래곤',
  typeDark: '악',
  typeFairy: '페어리',
  faqHeading: 'Favmon FAQ',
  faqWhatQuestion: 'Favmon은 무엇인가요?',
  faqWhatAnswer: 'Favmon은 팬이 만든 커뮤니티 도감입니다. 트레이너가 가장 좋아하거나 덜 좋아하는 포켓몬을 선언하고 순위와 전국도감 커버리지를 확인할 수 있습니다.',
  faqShareQuestion: '포켓몬 선언을 공유할 수 있나요?',
  faqShareAnswer: '네. 선언을 저장한 뒤 Instagram, TikTok, X 등에서 사용할 수 있는 정사각형, 스토리, 배너 형식의 트레이너 카드를 만들 수 있습니다.',
  faqLeastQuestion: '덜 좋아하는 포켓몬도 선택할 수 있나요?',
  faqLeastAnswer: '네. Favmon에는 좋아하는 모드와 덜 좋아하는 모드가 있어 사랑받는 포켓몬과 의견이 갈리는 선택을 모두 추적할 수 있습니다.',
  faqDataQuestion: 'Favmon의 포켓몬 정보와 순위 데이터는 어디에서 오나요?',
  faqDataAnswer: 'Favmon은 포켓몬 이름, 타입, 스프라이트, 공식 아트워크에 PokéAPI를 사용합니다. 커뮤니티 선언 수는 이 사이트의 Neon Postgres 데이터베이스에서 가져옵니다.',
};

const traditionalChineseTranslations: TranslationMessages = {
  appTitle: '每隻寶可夢都是某個人的最愛',
  declare: '宣言',
  game: '遊戲',
  explore: '探索',
  pokedex: '寶可夢圖鑑',
  stats: '統計',
  promo: '用 Card Codex 管理你的寶可夢卡牌收藏',
  fanDeclaration: '粉絲宣言',
  declarationLead: '輸入你的名字，選出你願意到處守護的寶可夢，讓這份喜愛正式成立。',
  trainerName: '你的名字',
  trainerPlaceholder: '訓練家',
  favouritePokemon: '最愛的寶可夢',
  searchPlaceholder: '用名稱或編號搜尋',
  reason: '為什麼牠是你的最愛？',
  reasonHelp: '告訴大家原因，至少 10 個字',
  reasonPlaceholder: '在這裡寫下你的心意。',
  declareButton: '宣言最愛',
  alreadyDeclared: '你已經在這台裝置宣言過最愛的寶可夢。',
  success: '宣言已儲存。這隻寶可夢現在有你了。',
  firstFan: '你是全世界第一位 {pokemon} 官方粉絲！',
  moreFans: '已經有 {count} 位像你一樣喜歡 {pokemon} 的粉絲！',
  journeyContinues: '{count} / 1025 隻寶可夢已被揭曉 - 旅程仍在繼續...',
  kofiSupport: '喜歡這個網站嗎？在 Ko-fi 支持我',
  instagramChangeFormMsg: '想更改宣言寶可夢的型態嗎？請傳訊息附上訓練家名稱與寶可夢。',
  declaredPokemon: '你宣言的寶可夢',
  viewStats: '查看統計',
  communityPokedex: '社群圖鑑',
  discoveredHeading: '透過最愛宣言被發現的寶可夢',
  searchPokedex: '搜尋圖鑑',
  sortBy: '排序',
  generation: '世代',
  allGenerations: '所有世代',
  grid: '格狀',
  list: '清單',
  all: '全部',
  revealed: '已揭曉',
  hidden: '未揭曉',
  showing: '顯示',
  of: '/',
  discovered: '已發現',
  hiddenShort: '未揭曉',
  statsHeading: '全民宣言進度',
  refresh: '重新整理',
  refreshing: '重新整理中...',
  declarations: '宣言',
  uniquePokemon: '不重複寶可夢',
  pokedexCovered: '圖鑑覆蓋率',
  topTen: '最常被選的前 10 名',
  fullRanking: '完整排名',
  latest: '最新 10 則宣言',
  chose: '選擇了',
  noDeclarations: '目前沒有可顯示的宣言。',
  exploreHeading: '探索宣言',
  loading: '正在載入寶可夢...',
  whosMoreLoved: '誰更受喜愛？',
  pickTheOne: '選出得到更多喜愛的寶可夢',
  streak: '連勝',
  votes: '宣言',
  playAgain: '再玩一次',
  gameOver: '遊戲結束',
  support: '在 Ko-fi 支持我',
  modeToggle: '最愛',
  language: '語言',
  pokemonLoadWarning: '無法載入 PokéAPI 資料。',
  backendLoadWarning: '無法載入 Neon 宣言。',
  pokemonLoadFallback: '無法載入 PokéAPI 資料。',
  backendLoadFallback: '無法載入 Neon 資料。',
  saveErrorFallback: '無法儲存宣言。',
  nationalDex: '全國圖鑑',
  currentPick: '目前選擇',
  trainerTerminal: '訓練家終端',
  favouriteFile: '最愛檔案',
  rivalFile: '勁敵檔案',
  saving: '儲存中...',
  downloadCardTitle: '下載你的寶可夢卡！',
  downloadCardAria: '下載你的寶可夢卡',
  cardArtStyle: '卡片美術風格',
  officialArt: '官方美術',
  pixelArt: '像素圖',
  shiny: '異色',
  downloaded: '已下載！',
  generatingCards: '正在產生卡片...',
  cardGenerationError: '無法產生卡片，請再試一次。',
  cardSquare: '正方形（Instagram）',
  cardVertical: '限時動態（TikTok）',
  cardHorizontal: '橫幅（X/Twitter）',
  sortNumber: '編號',
  sortName: '名稱',
  sortFans: '最多粉絲',
  fans: '粉絲',
  byGeneration: '依世代',
  byType: '依屬性',
  rank: '排名',
  pokemonColumn: '寶可夢',
  votesColumn: '票數',
  exitGame: '離開遊戲',
  gameDisclaimer: '資料依據儲存在 Neon 資料庫中的宣言',
  legendary: '傳說級表現。',
  niceTry: '不錯的嘗試。',
  firstPage: '第一頁',
  previous: '上一頁',
  next: '下一頁',
  lastPage: '最後一頁',
  close: '關閉',
  loadingDeclarations: '正在載入宣言',
  declarationsLoadError: '無法載入宣言。',
  noDeclarationsYet: '尚無宣言。',
  dexScan: '圖鑑掃描',
  ready: '就緒',
  legalDisclaimer: '本網站與 Nintendo 或 The Pokémon Company 無關，也未獲其背書。Pokémon 與所有相關名稱為 Nintendo/Creatures Inc./GAME FREAK Inc. 的商標。',
  creatorLinks: '創作者連結',
  typeNormal: '一般',
  typeFighting: '格鬥',
  typeFlying: '飛行',
  typePoison: '毒',
  typeGround: '地面',
  typeRock: '岩石',
  typeBug: '蟲',
  typeGhost: '幽靈',
  typeSteel: '鋼',
  typeFire: '火',
  typeWater: '水',
  typeGrass: '草',
  typeElectric: '電',
  typePsychic: '超能力',
  typeIce: '冰',
  typeDragon: '龍',
  typeDark: '惡',
  typeFairy: '妖精',
  faqHeading: 'Favmon 常見問題',
  faqWhatQuestion: 'Favmon 是什麼？',
  faqWhatAnswer: 'Favmon 是粉絲製作的社群圖鑑。訓練家可以宣告最喜歡或最不喜歡的寶可夢，查看排名與全國圖鑑覆蓋進度。',
  faqShareQuestion: '我可以分享自己的寶可夢宣告嗎？',
  faqShareAnswer: '可以。保存宣告後，Favmon 能生成正方形、限時動態和橫幅尺寸的訓練家卡片，方便分享到 Instagram、TikTok、X 等平台。',
  faqLeastQuestion: '可以選最不喜歡的寶可夢嗎？',
  faqLeastAnswer: '可以。Favmon 同時提供最喜歡模式和最不喜歡模式，讓社群追蹤受歡迎與較具爭議的寶可夢選擇。',
  faqDataQuestion: 'Favmon 的寶可夢資訊和排名資料從哪裡來？',
  faqDataAnswer: 'Favmon 使用 PokéAPI 取得寶可夢名稱、屬性、sprite 和官方插圖。社群宣告數量來自本站自己的 Neon Postgres 資料庫。',
};

const simplifiedChineseTranslations: TranslationMessages = {
  appTitle: '每只宝可梦，都会是某个人最喜欢的那只',
  declare: '宣言',
  game: '游戏',
  explore: '逛逛',
  pokedex: '图鉴',
  stats: '数据',
  promo: '用 Card Codex 打理你的宝可梦卡牌收藏',
  fanDeclaration: '最喜欢的宝可梦',
  declarationLead: '写下你的名字，选出你最喜欢的宝可梦，把这份选择留在大家的图鉴里。',
  trainerName: '你的名字',
  trainerPlaceholder: '训练家',
  favouritePokemon: '最喜欢的宝可梦',
  searchPlaceholder: '搜名字或编号',
  reason: '为什么最喜欢它？',
  reasonHelp: '说说你的理由，至少 10 个字',
  reasonPlaceholder: '说说你喜欢它的理由。',
  declareButton: '提交最喜欢',
  alreadyDeclared: '这台设备已经选过最喜欢的宝可梦了。',
  success: '已记录。它现在是你最喜欢的宝可梦了。',
  firstFan: '你是第一个选择 {pokemon} 的训练家！',
  moreFans: '已经有 {count} 位训练家也选择了 {pokemon}！',
  journeyContinues: '已收集 {count} / 1025 只宝可梦，图鉴还在继续补完...',
  kofiSupport: '喜欢这个网站？可以在 Ko-fi 支持我',
  instagramChangeFormMsg: '想调整你认领的地区形态？把训练家名字和宝可梦发给我就行。',
  declaredPokemon: '你最喜欢的宝可梦',
  viewStats: '看数据',
  communityPokedex: '大家的宝可梦图鉴',
  discoveredHeading: '大家选出的最喜欢宝可梦',
  searchPokedex: '搜索图鉴',
  sortBy: '排序',
  generation: '世代',
  allGenerations: '全部世代',
  grid: '宫格',
  list: '列表',
  all: '全部',
  revealed: '已点亮',
  hidden: '待点亮',
  showing: '正在显示',
  of: '/',
  discovered: '已收集',
  hiddenShort: '待收集',
  statsHeading: '大家都在选哪些宝可梦',
  refresh: '刷新',
  refreshing: '刷新中...',
  declarations: '宣言数',
  uniquePokemon: '被选择的宝可梦',
  pokedexCovered: '图鉴进度',
  topTen: '最受欢迎 Top 10',
  fullRanking: '完整排名',
  latest: '最新 10 条宣言',
  chose: '选择了',
  noDeclarations: '现在还没有宣言可以展示。',
  exploreHeading: '浏览宣言',
  loading: '正在加载宝可梦...',
  whosMoreLoved: '谁更受欢迎？',
  pickTheOne: '猜猜哪只宝可梦被更多人选择',
  streak: '连对',
  votes: '条宣言',
  playAgain: '再来一局',
  gameOver: '挑战结束',
  support: '在 Ko-fi 支持我',
  modeToggle: '最喜欢',
  language: '语言',
  pokemonLoadWarning: 'PokéAPI 数据加载失败。',
  backendLoadWarning: 'Neon 里的宣言加载失败。',
  pokemonLoadFallback: 'PokéAPI 数据加载失败。',
  backendLoadFallback: 'Neon 数据加载失败。',
  saveErrorFallback: '宣言保存失败。',
  nationalDex: '全国图鉴',
  currentPick: '当前选择',
  trainerTerminal: '训练家终端',
  favouriteFile: '最喜欢档案',
  rivalFile: '对手档案',
  saving: '保存中...',
  downloadCardTitle: '下载你的宝可梦卡！',
  downloadCardAria: '下载你的宝可梦卡',
  cardArtStyle: '卡面风格',
  officialArt: '官方立绘',
  pixelArt: '像素小人',
  shiny: '闪光',
  downloaded: '已下载！',
  generatingCards: '正在生成卡片...',
  cardGenerationError: '卡片生成失败，请再试一次。',
  cardSquare: '方图（Instagram）',
  cardVertical: '竖版故事（TikTok）',
  cardHorizontal: '横幅（X/Twitter）',
  sortNumber: '编号',
  sortName: '名字',
  sortFans: '人气优先',
  fans: '粉丝',
  byGeneration: '按世代',
  byType: '按属性',
  rank: '排名',
  pokemonColumn: '宝可梦',
  votesColumn: '票数',
  exitGame: '退出游戏',
  gameDisclaimer: '数据来自保存在 Neon 数据库里的真实宣言',
  legendary: '传说级表现。',
  niceTry: '差一点，再来。',
  firstPage: '第一页',
  previous: '上一页',
  next: '下一页',
  lastPage: '最后一页',
  close: '关闭',
  loadingDeclarations: '正在加载宣言',
  declarationsLoadError: '宣言加载失败。',
  noDeclarationsYet: '还没有宣言。',
  dexScan: '图鉴扫描',
  ready: '就绪',
  legalDisclaimer: '本站与 Nintendo 或 The Pokémon Company 无关联，也未获得其背书。Pokémon 及相关名称是 Nintendo/Creatures Inc./GAME FREAK Inc. 的商标。',
  creatorLinks: '创作者链接',
  typeNormal: '一般',
  typeFighting: '格斗',
  typeFlying: '飞行',
  typePoison: '毒',
  typeGround: '地面',
  typeRock: '岩石',
  typeBug: '虫',
  typeGhost: '幽灵',
  typeSteel: '钢',
  typeFire: '火',
  typeWater: '水',
  typeGrass: '草',
  typeElectric: '电',
  typePsychic: '超能力',
  typeIce: '冰',
  typeDragon: '龙',
  typeDark: '恶',
  typeFairy: '妖精',
  faqHeading: 'Favmon 常见问题',
  faqWhatQuestion: 'Favmon 是什么？',
  faqWhatAnswer: 'Favmon 是粉丝制作的社区图鉴。训练家可以宣告最喜欢或最不喜欢的宝可梦，查看排名与全国图鉴覆盖进度。',
  faqShareQuestion: '我可以分享自己的宝可梦宣告吗？',
  faqShareAnswer: '可以。保存宣告后，Favmon 能生成正方形、竖版故事和横幅尺寸的训练家卡片，方便分享到 Instagram、TikTok、X 等平台。',
  faqLeastQuestion: '可以选择最不喜欢的宝可梦吗？',
  faqLeastAnswer: '可以。Favmon 同时提供最喜欢模式和最不喜欢模式，让社区追踪受欢迎和更具争议的宝可梦选择。',
  faqDataQuestion: 'Favmon 的宝可梦信息和排名数据从哪里来？',
  faqDataAnswer: 'Favmon 使用 PokéAPI 获取宝可梦名称、属性、sprite 和官方插图。社区宣告数量来自本站自己的 Neon Postgres 数据库。',
};

const frenchTranslations: TranslationMessages = {
  appTitle: 'Chaque Pokémon est le favori de quelqu’un',
  declare: 'Déclarer',
  game: 'Jeu',
  explore: 'Explorer',
  pokedex: 'Pokédex',
  stats: 'Stats',
  promo: 'Gérez votre collection de cartes Pokémon avec Card Codex',
  fanDeclaration: 'Déclaration de fan',
  declarationLead: 'Ajoutez votre nom, choisissez le Pokémon que vous défendriez partout, et rendez cela officiel.',
  trainerName: 'Votre nom',
  trainerPlaceholder: 'Dresseur',
  favouritePokemon: 'Pokémon favori',
  searchPlaceholder: 'Rechercher par nom ou numéro',
  reason: 'Pourquoi est-ce votre favori ?',
  reasonHelp: 'Expliquez pourquoi - au moins 10 caractères',
  reasonPlaceholder: 'C’est ici que les cœurs se gagnent.',
  declareButton: 'Déclarer favori',
  alreadyDeclared: 'Vous avez déjà déclaré votre Pokémon favori sur cet appareil.',
  success: 'Déclaration enregistrée. Ce Pokémon a maintenant quelqu’un.',
  firstFan: 'Vous êtes le premier fan officiel de {pokemon} au monde !',
  moreFans: 'Il y a déjà {count} fans de {pokemon} comme vous !',
  journeyContinues: '{count} / 1025 Pokémon révélés - le voyage continue...',
  kofiSupport: 'Vous aimez le site ? Soutenez-moi sur Ko-fi',
  instagramChangeFormMsg: 'Vous voulez changer la forme du Pokémon déclaré ? Envoyez un message avec votre nom de dresseur et le Pokémon.',
  declaredPokemon: 'Votre Pokémon déclaré',
  viewStats: 'Voir les stats',
  communityPokedex: 'Pokédex communautaire',
  discoveredHeading: 'Pokémon découverts grâce aux favoris',
  searchPokedex: 'Rechercher dans le Pokédex',
  sortBy: 'Trier par',
  generation: 'Génération',
  allGenerations: 'Toutes les générations',
  grid: 'Grille',
  list: 'Liste',
  all: 'Tous',
  revealed: 'Révélés',
  hidden: 'Cachés',
  showing: 'Affichage',
  of: 'sur',
  discovered: 'Découverts',
  hiddenShort: 'Cachés',
  statsHeading: 'L’avancement de la déclaration universelle',
  refresh: 'Actualiser',
  refreshing: 'Actualisation...',
  declarations: 'Déclarations',
  uniquePokemon: 'Pokémon uniques',
  pokedexCovered: 'Pokédex couvert',
  topTen: 'Top 10 les plus choisis',
  fullRanking: 'Classement complet',
  latest: '10 dernières déclarations',
  chose: 'a choisi',
  noDeclarations: 'Aucune déclaration à afficher pour le moment.',
  exploreHeading: 'Explorer les déclarations',
  loading: 'Chargement des Pokémon...',
  whosMoreLoved: 'Qui est le plus aimé ?',
  pickTheOne: 'Choisissez le Pokémon avec le plus d’amour',
  streak: 'Série',
  votes: 'déclarations',
  playAgain: 'Rejouer',
  gameOver: 'Fin de partie',
  support: 'Me soutenir sur Ko-fi',
  modeToggle: 'Favori',
  language: 'Langue',
  pokemonLoadWarning: 'Impossible de charger les données PokéAPI.',
  backendLoadWarning: 'Impossible de charger les déclarations Neon.',
  pokemonLoadFallback: 'Impossible de charger les données PokéAPI.',
  backendLoadFallback: 'Impossible de charger les données Neon.',
  saveErrorFallback: 'Impossible d’enregistrer la déclaration.',
  nationalDex: 'Dex national',
  currentPick: 'Choix actuel',
  trainerTerminal: 'Terminal de dresseur',
  favouriteFile: 'Fichier favori',
  rivalFile: 'Fichier rival',
  saving: 'Enregistrement...',
  downloadCardTitle: 'Téléchargez votre carte Pokémon !',
  downloadCardAria: 'Télécharger votre carte Pokémon',
  cardArtStyle: 'Style d’illustration de carte',
  officialArt: 'Art officiel',
  pixelArt: 'Pixel art',
  shiny: 'Shiny',
  downloaded: 'Téléchargé !',
  generatingCards: 'Génération des cartes...',
  cardGenerationError: 'Impossible de générer la carte. Réessayez.',
  cardSquare: 'Carré (Instagram)',
  cardVertical: 'Story (TikTok)',
  cardHorizontal: 'Bannière (X/Twitter)',
  sortNumber: 'Numéro',
  sortName: 'Nom',
  sortFans: 'Plus de fans',
  fans: 'fans',
  byGeneration: 'Par génération',
  byType: 'Par type',
  rank: 'Rang',
  pokemonColumn: 'Pokémon',
  votesColumn: 'Votes',
  exitGame: 'Quitter le jeu',
  gameDisclaimer: 'Données basées sur les déclarations stockées dans notre base Neon',
  legendary: 'Légendaire.',
  niceTry: 'Bien essayé.',
  firstPage: 'Première page',
  previous: 'Précédent',
  next: 'Suivant',
  lastPage: 'Dernière page',
  close: 'Fermer',
  loadingDeclarations: 'Chargement des déclarations',
  declarationsLoadError: 'Impossible de charger les déclarations.',
  noDeclarationsYet: 'Pas encore de déclarations.',
  dexScan: 'Scan Dex',
  ready: 'Prêt',
  legalDisclaimer: 'Ce site n’est ni affilié à Nintendo ou The Pokémon Company, ni approuvé par eux. Pokémon et tous les noms associés sont des marques de Nintendo/Creatures Inc./GAME FREAK Inc.',
  creatorLinks: 'Liens du créateur',
  typeNormal: 'Normal',
  typeFighting: 'Combat',
  typeFlying: 'Vol',
  typePoison: 'Poison',
  typeGround: 'Sol',
  typeRock: 'Roche',
  typeBug: 'Insecte',
  typeGhost: 'Spectre',
  typeSteel: 'Acier',
  typeFire: 'Feu',
  typeWater: 'Eau',
  typeGrass: 'Plante',
  typeElectric: 'Électrik',
  typePsychic: 'Psy',
  typeIce: 'Glace',
  typeDragon: 'Dragon',
  typeDark: 'Ténèbres',
  typeFairy: 'Fée',
  faqHeading: 'FAQ Favmon',
  faqWhatQuestion: 'Qu\'est-ce que Favmon ?',
  faqWhatAnswer: 'Favmon est un Pokédex communautaire créé par des fans où les dresseurs déclarent leur Pokémon préféré ou le moins aimé, comparent les classements et suivent la couverture du Dex National.',
  faqShareQuestion: 'Puis-je partager ma déclaration Pokémon ?',
  faqShareAnswer: 'Oui. Après avoir enregistré une déclaration, Favmon peut générer des cartes carrées, story et bannière pour Instagram, TikTok, X et les autres plateformes sociales.',
  faqLeastQuestion: 'Puis-je choisir un Pokémon le moins aimé ?',
  faqLeastAnswer: 'Oui. Favmon propose un mode favori et un mode moins favori pour suivre à la fois les Pokémon adorés et les choix plus divisifs.',
  faqDataQuestion: 'D\'où viennent les données Pokémon et les classements Favmon ?',
  faqDataAnswer: 'Favmon utilise PokéAPI pour les noms, types, sprites et illustrations officielles. Les compteurs de déclarations viennent de la base Neon Postgres propre au site.',
};

const translations = {
  ja: japaneseTranslations,
  ko: koreanTranslations,
  'zh-CN': simplifiedChineseTranslations,
  'zh-TW': traditionalChineseTranslations,
  'es-CL': spanishTranslations,
  en: englishTranslations,
  'zh-HK': {
    ...traditionalChineseTranslations,
    appTitle: '每隻寶可夢都係某個人嘅最愛',
    declarationLead: '輸入你個名，揀一隻你會到處守護嘅寶可夢，正式宣言你嘅喜愛。',
    reasonPlaceholder: '喺呢度寫低你嘅心意。',
    success: '宣言已儲存。呢隻寶可夢而家有你喇。',
  },
  es: spanishTranslations,
  'es-PR': spanishTranslations,
  fr: frenchTranslations,
  'es-CR': spanishTranslations,
} satisfies Record<Language, TranslationMessages>;

const spanishNotFavouriteOverrides = {
  appTitle: 'Cada Pokémon también puede ser el menos favorito de alguien',
  fanDeclaration: 'Elección de menos favorito',
  declarationLead: 'Añade tu nombre, elige el Pokémon que menos te gusta y cuenta el motivo.',
  favouritePokemon: 'Pokémon menos favorito',
  reason: '¿Por qué es el que menos te gusta?',
  reasonHelp: 'Cuéntanos el motivo - al menos 10 caracteres',
  reasonPlaceholder: 'Cuenta qué es lo que no te convence.',
  declareButton: 'Elegir menos favorito',
  alreadyDeclared: 'Ya elegiste tu Pokémon menos favorito en este dispositivo.',
  success: 'Declaración guardada. Tu elección ya cuenta en las estadísticas.',
  firstFan: '¡Eres la primera persona que eligió a {pokemon} como menos favorito!',
  moreFans: 'Ya hay {count} personas que también eligieron a {pokemon} como menos favorito.',
  journeyContinues: '{count} / 1025 Pokémon ya aparecen en la lista de menos favoritos - seguimos contando...',
  declaredPokemon: 'Tu Pokémon menos favorito',
  discoveredHeading: 'Pokémon elegidos como menos favoritos',
  statsHeading: 'Cómo va la lista de menos favoritos',
  topTen: 'Top 10 menos favoritos',
  latest: 'Últimas 10 elecciones de menos favorito',
  chose: 'eligió como menos favorito',
  exploreHeading: 'Explorar elecciones de menos favorito',
  whosMoreLoved: '¿Qué Pokémon es menos favorito?',
  pickTheOne: 'Elige el Pokémon que más gente marcó como menos favorito',
  modeToggle: 'Menos favorito',
} satisfies Partial<Record<keyof TranslationMessages, string>>;

const notFavouriteOverrides = {
  en: {
    appTitle: "Every Pokémon is someone's least favourite",
    fanDeclaration: 'Least favourite choice',
    declarationLead: 'Add your name, choose the Pokémon you like least, and leave the reason.',
    favouritePokemon: 'Least favourite Pokémon',
    reason: 'Why is it your least favourite?',
    reasonHelp: 'Make the case - at least 10 characters',
    reasonPlaceholder: 'Tell us what never quite worked for you.',
    declareButton: 'Choose least favourite',
    alreadyDeclared: 'You have already chosen your least favourite Pokémon on this device.',
    success: 'Declaration saved. Your choice now counts in the stats.',
    firstFan: 'You are the first trainer to choose {pokemon} as least favourite!',
    moreFans: 'There are already {count} trainers who also chose {pokemon} as least favourite.',
    journeyContinues: '{count} / 1025 Pokémon are now on the least-favourite list - the count continues...',
    declaredPokemon: 'Your least favourite Pokémon',
    discoveredHeading: 'Pokémon chosen as least favourites',
    statsHeading: 'How the least-favourite list is shaping up',
    topTen: 'Top 10 least favourite',
    latest: 'Latest 10 least-favourite choices',
    chose: 'chose as least favourite',
    exploreHeading: 'Explore Least-Favourite Choices',
    whosMoreLoved: 'Which Pokémon is chosen less?',
    pickTheOne: 'Pick the Pokémon marked least favourite more often',
    modeToggle: 'Least Favourite',
  },
  es: spanishNotFavouriteOverrides,
  'es-CL': spanishNotFavouriteOverrides,
  'es-PR': spanishNotFavouriteOverrides,
  'es-CR': spanishNotFavouriteOverrides,
  ja: {
    appTitle: 'どのポケモンも、誰かのいちばん苦手な存在かもしれない',
    fanDeclaration: '苦手なポケモン',
    declarationLead: '名前を入力して、いちばん苦手なポケモンとその理由を残しましょう。',
    favouritePokemon: '苦手なポケモン',
    reason: 'なぜ苦手なのですか？',
    reasonHelp: '理由を10文字以上で書いてください',
    reasonPlaceholder: 'どこが苦手なのかを書いてみましょう。',
    declareButton: '苦手として選ぶ',
    alreadyDeclared: 'この端末ではすでに苦手なポケモンを選んでいます。',
    success: '保存しました。あなたの選択が統計に入りました。',
    firstFan: 'あなたは初めて{pokemon}を苦手に選んだトレーナーです！',
    moreFans: '{pokemon}を苦手に選んだトレーナーはすでに{count}人います。',
    journeyContinues: '{count} / 1025匹のポケモンが苦手リストに入りました - まだ続きます...',
    declaredPokemon: '苦手に選んだポケモン',
    discoveredHeading: '苦手として選ばれたポケモン',
    statsHeading: '苦手リストの進み具合',
    topTen: '苦手に選ばれたトップ10',
    latest: '最新10件の苦手な選択',
    chose: 'が苦手に選んだのは',
    exploreHeading: '苦手な選択を探索',
    whosMoreLoved: 'どちらがより苦手に選ばれている？',
    pickTheOne: '苦手に選ばれた数が多いポケモンを選ぼう',
    modeToggle: '苦手',
  },
  ko: {
    appTitle: '모든 포켓몬은 누군가가 덜 좋아하는 포켓몬일 수도 있습니다',
    fanDeclaration: '덜 좋아하는 포켓몬',
    declarationLead: '이름을 적고 덜 좋아하는 포켓몬과 그 이유를 남겨보세요.',
    favouritePokemon: '덜 좋아하는 포켓몬',
    reason: '왜 덜 좋아하나요?',
    reasonHelp: '이유를 10자 이상 적어주세요',
    reasonPlaceholder: '어떤 점이 아쉬웠는지 적어주세요.',
    declareButton: '덜 좋아함으로 선택',
    alreadyDeclared: '이 기기에서는 이미 덜 좋아하는 포켓몬을 선택했습니다.',
    success: '저장되었습니다. 선택이 통계에 반영됐습니다.',
    firstFan: '당신은 처음으로 {pokemon}을 덜 좋아한다고 선택한 트레이너입니다!',
    moreFans: '{pokemon}을 덜 좋아한다고 선택한 트레이너가 이미 {count}명 있습니다.',
    journeyContinues: '{count} / 1025마리 포켓몬이 덜 좋아함 목록에 올랐습니다 - 계속 집계 중...',
    declaredPokemon: '덜 좋아한다고 선택한 포켓몬',
    discoveredHeading: '덜 좋아함으로 선택된 포켓몬',
    statsHeading: '덜 좋아함 목록 진행 상황',
    topTen: '덜 좋아함 Top 10',
    latest: '최근 덜 좋아함 선택 10개',
    chose: '덜 좋아함:',
    exploreHeading: '덜 좋아함 선택 둘러보기',
    whosMoreLoved: '어느 포켓몬이 더 많이 덜 좋아함으로 선택됐을까요?',
    pickTheOne: '덜 좋아함 선택이 더 많은 포켓몬을 고르세요',
    modeToggle: '덜 좋아함',
  },
  'zh-CN': {
    appTitle: '每只宝可梦，也会有人最不喜欢',
    fanDeclaration: '最不喜欢的宝可梦',
    declarationLead: '写下你的名字，选出你最不喜欢的宝可梦，把这份选择也留在统计里。',
    favouritePokemon: '最不喜欢的宝可梦',
    reason: '为什么不喜欢它？',
    reasonHelp: '说说你的理由，至少 10 个字',
    reasonPlaceholder: '说说哪里让你不太喜欢。',
    declareButton: '提交最不喜欢',
    alreadyDeclared: '这台设备已经选过最不喜欢的宝可梦了。',
    success: '已记录。你的选择已经加入统计。',
    firstFan: '你是第一个把 {pokemon} 选为最不喜欢的训练家！',
    moreFans: '已经有 {count} 位训练家也不太喜欢 {pokemon}。',
    journeyContinues: '已有 {count} / 1025 只宝可梦进入最不喜欢统计，列表还在继续...',
    declaredPokemon: '你最不喜欢的宝可梦',
    discoveredHeading: '大家选出的最不喜欢宝可梦',
    statsHeading: '哪些宝可梦被选为最不喜欢',
    topTen: '最不受欢迎 Top 10',
    latest: '最新 10 条最不喜欢选择',
    chose: '选择最不喜欢',
    exploreHeading: '浏览最不喜欢选择',
    whosMoreLoved: '谁更不受欢迎？',
    pickTheOne: '猜猜哪只宝可梦被更多人选为最不喜欢',
    modeToggle: '最不喜欢',
  },
  'zh-TW': {
    appTitle: '每隻寶可夢，也可能是某個人最不喜歡的那隻',
    fanDeclaration: '最不喜歡的寶可夢',
    declarationLead: '輸入你的名字，選出你最不喜歡的寶可夢，也把這份選擇留在統計裡。',
    favouritePokemon: '最不喜歡的寶可夢',
    reason: '為什麼牠不是你的最愛？',
    reasonHelp: '說說你的理由，至少 10 個字',
    reasonPlaceholder: '說說哪裡讓你不太喜歡。',
    declareButton: '提交最不喜歡',
    alreadyDeclared: '你已經在這台裝置宣言過最不喜歡的寶可夢。',
    success: '已儲存。你的選擇已加入統計。',
    firstFan: '你是第一位把 {pokemon} 選為最不喜歡的訓練家！',
    moreFans: '已經有 {count} 位訓練家也不太喜歡 {pokemon}。',
    journeyContinues: '{count} / 1025 隻寶可夢已進入最不喜歡統計，列表還在繼續...',
    declaredPokemon: '你最不喜歡的寶可夢',
    discoveredHeading: '大家選出的最不喜歡寶可夢',
    statsHeading: '哪些寶可夢被選為最不喜歡',
    topTen: '最不受歡迎前 10 名',
    latest: '最新 10 則最不喜歡選擇',
    chose: '選為最不喜歡',
    exploreHeading: '探索最不喜歡選擇',
    whosMoreLoved: '哪隻寶可夢更不受歡迎？',
    pickTheOne: '選出被更多人選為最不喜歡的寶可夢',
    modeToggle: '最不喜歡',
  },
  'zh-HK': {
    appTitle: '每隻寶可夢，都可能係某個人最唔鍾意嗰隻',
    fanDeclaration: '最唔鍾意嘅寶可夢',
    declarationLead: '輸入你個名，揀一隻你最唔鍾意嘅寶可夢，將呢個選擇都留喺統計入面。',
    favouritePokemon: '最唔鍾意嘅寶可夢',
    reason: '點解佢唔係你嘅最愛？',
    reasonHelp: '講低你嘅理由，至少 10 個字',
    reasonPlaceholder: '講下邊度令你唔太鍾意。',
    declareButton: '提交最唔鍾意',
    alreadyDeclared: '你已經喺呢部裝置宣言過最唔鍾意嘅寶可夢。',
    success: '已儲存。你嘅選擇已加入統計。',
    firstFan: '你係第一位將 {pokemon} 揀做最唔鍾意嘅訓練家！',
    moreFans: '已經有 {count} 位訓練家都唔太鍾意 {pokemon}。',
    journeyContinues: '{count} / 1025 隻寶可夢已加入最唔鍾意統計，列表仲繼續...',
    declaredPokemon: '你最唔鍾意嘅寶可夢',
    discoveredHeading: '大家揀出嚟最唔鍾意嘅寶可夢',
    statsHeading: '邊啲寶可夢被揀做最唔鍾意',
    topTen: '最唔受歡迎前 10 名',
    latest: '最新 10 則最唔鍾意選擇',
    chose: '揀做最唔鍾意',
    exploreHeading: '探索最唔鍾意選擇',
    whosMoreLoved: '邊隻寶可夢更唔受歡迎？',
    pickTheOne: '揀出被更多人選為最唔鍾意嘅寶可夢',
    modeToggle: '最唔鍾意',
  },
  fr: {
    appTitle: 'Chaque Pokémon peut aussi être le moins favori de quelqu’un',
    fanDeclaration: 'Choix du moins favori',
    declarationLead: 'Ajoutez votre nom, choisissez le Pokémon que vous aimez le moins, et expliquez pourquoi.',
    favouritePokemon: 'Pokémon le moins favori',
    reason: 'Pourquoi est-ce celui que vous aimez le moins ?',
    reasonHelp: 'Expliquez votre choix - au moins 10 caractères',
    reasonPlaceholder: 'Dites ce qui vous convainc le moins.',
    declareButton: 'Choisir comme moins favori',
    alreadyDeclared: 'Vous avez déjà choisi votre Pokémon le moins favori sur cet appareil.',
    success: 'Déclaration enregistrée. Votre choix compte dans les stats.',
    firstFan: 'Vous êtes la première personne à choisir {pokemon} comme moins favori !',
    moreFans: 'Il y a déjà {count} personnes qui ont aussi choisi {pokemon} comme moins favori.',
    journeyContinues: '{count} / 1025 Pokémon apparaissent déjà dans la liste des moins favoris - on continue...',
    declaredPokemon: 'Votre Pokémon le moins favori',
    discoveredHeading: 'Pokémon choisis comme moins favoris',
    statsHeading: 'L’avancement de la liste des moins favoris',
    topTen: 'Top 10 des moins favoris',
    latest: '10 derniers choix de moins favori',
    chose: 'a choisi comme moins favori',
    exploreHeading: 'Explorer les choix de moins favori',
    whosMoreLoved: 'Quel Pokémon est le moins favori ?',
    pickTheOne: 'Choisissez le Pokémon le plus souvent marqué comme moins favori',
    modeToggle: 'Moins favori',
  },
} satisfies Record<Language, Partial<Record<keyof TranslationMessages, string>>>;

const typeLabelKeys: Record<PokemonType, keyof TranslationMessages> = {
  normal: 'typeNormal',
  fighting: 'typeFighting',
  flying: 'typeFlying',
  poison: 'typePoison',
  ground: 'typeGround',
  rock: 'typeRock',
  bug: 'typeBug',
  ghost: 'typeGhost',
  steel: 'typeSteel',
  fire: 'typeFire',
  water: 'typeWater',
  grass: 'typeGrass',
  electric: 'typeElectric',
  psychic: 'typePsychic',
  ice: 'typeIce',
  dragon: 'typeDragon',
  dark: 'typeDark',
  fairy: 'typeFairy',
};

function copyFor(language: Language, mode: Mode): TranslationMessages {
  return {
    ...translations[language],
    ...(mode === 'not_favourite' ? notFavouriteOverrides[language] : {}),
  };
}

function template(copy: string, values: Record<string, string>): string {
  return copy.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

function localeFromPathname(pathname: string): Language {
  const normalizedPathname = pathname.toLowerCase();
  const match = localeOptions
    .filter((option) => option.prefix)
    .find((option) => normalizedPathname === option.prefix || normalizedPathname.startsWith(`${option.prefix}/`));
  return match?.code ?? 'en';
}

function localePrefix(language: Language): string {
  return localeOptions.find((option) => option.code === language)?.prefix ?? '';
}

function stripLocalePrefix(pathname: string): string {
  const normalizedPathname = pathname.toLowerCase();
  const match = localeOptions
    .filter((option) => option.prefix)
    .find((option) => normalizedPathname === option.prefix || normalizedPathname.startsWith(`${option.prefix}/`));
  if (!match) return pathname;
  return pathname.slice(match.prefix.length) || '/';
}

function localizedPath(route: Route, language: Language): string {
  const prefix = localePrefix(language);
  return `${prefix}${route === '/' ? '' : route}` || '/';
}

function absoluteLocalizedUrl(route: Route, language: Language): string {
  return `${siteBaseUrl}${localizedPath(route, language)}`;
}

function seoFor(route: Route, language: Language): RouteSeo {
  return routeSeoByLanguage[language][route] ?? englishRouteSeo[route];
}

function alternateLinksForRoute(route: Route): Array<{ hreflang: string; href: string }> {
  return [
    { hreflang: 'x-default', href: absoluteLocalizedUrl(route, 'en') },
    ...localeOptions.map((option) => ({
      hreflang: option.code,
      href: absoluteLocalizedUrl(route, option.code),
    })),
  ];
}

function routeAndLanguageFromPathname(pathname: string): { route: Route; language: Language } {
  return {
    route: normalizeRoute(pathname),
    language: localeFromPathname(pathname),
  };
}

function upsertMetaContent(attributeName: 'name' | 'property' | 'http-equiv', attributeValue: string, content: string) {
  const selector = `meta[${attributeName}="${attributeValue}"]`;
  let meta = document.querySelector(selector) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attributeName, attributeValue);
    document.head.append(meta);
  }
  meta.setAttribute('content', content);
}

function upsertLinkHref(rel: string, href: string) {
  let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.append(link);
  }
  link.setAttribute('href', href);
}

function syncAlternateLinks(route: Route) {
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((link) => link.remove());
  const fragment = document.createDocumentFragment();
  alternateLinksForRoute(route).forEach((alternate) => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', alternate.hreflang);
    link.setAttribute('href', alternate.href);
    fragment.append(link);
  });
  document.head.append(fragment);
}

function buildStructuredData({
  route,
  language,
  seo,
  faq,
}: {
  route: Route;
  language: Language;
  seo: RouteSeo;
  faq: Array<{ question: string; answer: string }>;
}) {
  const canonicalUrl = absoluteLocalizedUrl(route, language);
  const pageId = `${canonicalUrl}#webpage`;
  const websiteId = `${siteBaseUrl}/#website`;
  const organizationId = `${siteBaseUrl}/#organization`;
  const graph: unknown[] = [
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
        'Explore community Pokédex rankings',
        'Play a Pokémon popularity guessing game',
        'Download square, story, and banner social cards',
      ],
      publisher: { '@id': organizationId },
    },
    {
      '@type': 'WebPage',
      '@id': pageId,
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
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

function syncStructuredData(route: Route, language: Language, seo: RouteSeo, faq: Array<{ question: string; answer: string }>) {
  let script = document.querySelector('script#structured-data') as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = 'structured-data';
    script.type = 'application/ld+json';
    document.head.append(script);
  }
  script.textContent = JSON.stringify(buildStructuredData({ route, language, seo, faq }));
}

type CardFormatKey = 'square' | 'vertical' | 'horizontal';
type CardArtStyle = 'official' | 'pixel';
type ShowcasePokemon = Pick<PokemonRow, 'id' | 'name' | 'number' | 'generationLabel' | 'artwork' | 'sprite'>;

const scanPreviewCount = 5;
const scanStepDelayMs = 3000;
const scanStartDelayMs = 1000;
const scanRestDelayMs = 3000;
const pokedexPageSize = 50;

const fontStylesheetsByLanguage: Partial<Record<Language, string>> = {
  ja: 'https://fonts.googleapis.com/css2?family=DotGothic16&display=swap',
  ko: 'https://fonts.googleapis.com/css2?family=Gugi&family=Noto+Sans+KR:wght@400;500;700;900&display=swap',
  'zh-CN': 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&family=ZCOOL+QingKe+HuangYou&display=swap',
  'zh-TW': 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap',
  'zh-HK': 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap',
};

const cardFormats: Record<CardFormatKey, { width: number; height: number; labelKey: keyof TranslationMessages; sub: string }> = {
  square: { width: 1080, height: 1080, labelKey: 'cardSquare', sub: '1080x1080' },
  vertical: { width: 1080, height: 1920, labelKey: 'cardVertical', sub: '1080x1920' },
  horizontal: { width: 1200, height: 630, labelKey: 'cardHorizontal', sub: '1200x630' },
};

const featuredPokemon = [
  { id: 25, name: 'Pikachu', number: '#025', generationLabel: 'Gen I' },
  { id: 6, name: 'Charizard', number: '#006', generationLabel: 'Gen I' },
  { id: 1, name: 'Bulbasaur', number: '#001', generationLabel: 'Gen I' },
  { id: 7, name: 'Squirtle', number: '#007', generationLabel: 'Gen I' },
  { id: 133, name: 'Eevee', number: '#133', generationLabel: 'Gen I' },
  { id: 150, name: 'Mewtwo', number: '#150', generationLabel: 'Gen I' },
  { id: 151, name: 'Mew', number: '#151', generationLabel: 'Gen I' },
];

function officialArtworkUrl(pokemonId: number): string {
  return pokemonOfficialArtworkUrl(pokemonId);
}

function pixelArtworkUrl(pokemonId: number): string {
  return pokemonSpriteUrl(pokemonId);
}

function featuredToShowcasePokemon(pokemon: typeof featuredPokemon[number]): ShowcasePokemon {
  return {
    ...pokemon,
    artwork: officialArtworkUrl(pokemon.id),
    sprite: pixelArtworkUrl(pokemon.id),
  };
}

function declarationToShowcasePokemon(declaration: Declaration): ShowcasePokemon {
  return {
    id: declaration.pokemonId,
    name: declaration.pokemonName,
    number: `#${String(declaration.pokemonId).padStart(3, '0')}`,
    generationLabel: generationLabel(getGeneration(declaration.pokemonId)),
    artwork: officialArtworkUrl(declaration.pokemonId),
    sprite: pixelArtworkUrl(declaration.pokemonId),
  };
}

function shinyArtworkUrl(pokemonId: number, style: CardArtStyle): string {
  if (style === 'pixel') {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemonId}.png`;
  }
  return remotePokemonOfficialArtworkUrl(pokemonId).replace('/official-artwork/', '/official-artwork/shiny/');
}

function loadCanvasImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

type CardPalette = {
  backgroundA: string;
  backgroundB: string;
  panel: string;
  accent: string;
  accentDark: string;
  secondary: string;
  text: string;
  muted: string;
  line: string;
};

function cardPaletteForMode(mode: Mode): CardPalette {
  if (mode === 'not_favourite') {
    return {
      backgroundA: '#160c2a',
      backgroundB: '#30184b',
      panel: '#f8f3ff',
      accent: '#ff4f8b',
      accentDark: '#9f1f58',
      secondary: '#53d8fb',
      text: '#16102a',
      muted: '#594d78',
      line: '#53d8fb',
    };
  }

  return {
    backgroundA: '#102052',
    backgroundB: '#163f76',
    panel: '#fffaf0',
    accent: '#e3350d',
    accentDark: '#8f1d0b',
    secondary: '#ffcb05',
    text: '#11142d',
    muted: '#374064',
    line: '#ffcb05',
  };
}

function roundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const corner = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + corner, y);
  context.lineTo(x + width - corner, y);
  context.quadraticCurveTo(x + width, y, x + width, y + corner);
  context.lineTo(x + width, y + height - corner);
  context.quadraticCurveTo(x + width, y + height, x + width - corner, y + height);
  context.lineTo(x + corner, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - corner);
  context.lineTo(x, y + corner);
  context.quadraticCurveTo(x, y, x + corner, y);
  context.closePath();
}

function fillRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string | CanvasGradient | CanvasPattern,
) {
  roundedRectPath(context, x, y, width, height, radius);
  context.fillStyle = fillStyle;
  context.fill();
}

function strokeRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  strokeStyle: string | CanvasGradient | CanvasPattern,
  lineWidth: number,
) {
  roundedRectPath(context, x, y, width, height, radius);
  context.strokeStyle = strokeStyle;
  context.lineWidth = lineWidth;
  context.stroke();
}

function trimTextToWidth(context: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (context.measureText(text).width <= maxWidth) return text;
  let result = text;
  while (result.length > 1 && context.measureText(`${result}...`).width > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result.trimEnd()}...`;
}

function wrapCanvasText(context: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const units = /\s/.test(normalized)
    ? normalized.split(/(\s+)/).filter(Boolean)
    : Array.from(normalized);
  const lines: string[] = [];
  let line = '';
  let truncated = false;

  for (let unitIndex = 0; unitIndex < units.length; unitIndex += 1) {
    const unit = units[unitIndex];
    const next = `${line}${unit}`;
    if (context.measureText(next).width <= maxWidth || !line) {
      if (!line && context.measureText(unit).width > maxWidth) {
        const chars = Array.from(unit);
        for (let charIndex = 0; charIndex < chars.length; charIndex += 1) {
          const char = chars[charIndex];
          const charNext = `${line}${char}`;
          if (context.measureText(charNext).width > maxWidth && line) {
            lines.push(line);
            line = char;
          } else {
            line = charNext;
          }
          if (lines.length === maxLines) {
            truncated = charIndex < chars.length - 1 || unitIndex < units.length - 1;
            break;
          }
        }
      } else {
        line = next;
      }
    } else {
      lines.push(line.trimEnd());
      line = unit.trimStart();
    }

    if (lines.length === maxLines) {
      truncated = truncated || unitIndex < units.length - 1;
      break;
    }
  }

  if (lines.length < maxLines && line) {
    lines.push(line.trimEnd());
  } else if (line) {
    truncated = true;
  }

  if (lines.length > maxLines) {
    lines.length = maxLines;
    truncated = true;
  }

  if (truncated && lines.length) {
    lines[maxLines - 1] = trimTextToWidth(context, lines[maxLines - 1], maxWidth);
  }

  return lines;
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
  textAlign: CanvasTextAlign = 'left',
) {
  const lines = wrapCanvasText(context, text, maxWidth, maxLines);
  context.textAlign = textAlign;
  context.textBaseline = 'top';
  lines.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight);
  });
}

function drawPokeballMark(context: CanvasRenderingContext2D, x: number, y: number, radius: number, alpha: number) {
  context.save();
  context.globalAlpha = alpha;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.strokeStyle = '#fff';
  context.lineWidth = radius * 0.05;
  context.stroke();
  context.beginPath();
  context.moveTo(x - radius, y);
  context.lineTo(x + radius, y);
  context.stroke();
  context.beginPath();
  context.arc(x, y, radius * 0.25, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function drawImageGlow(context: CanvasRenderingContext2D, x: number, y: number, radius: number, palette: CardPalette) {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.26)');
  gradient.addColorStop(0.42, `${palette.secondary}55`);
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
}

function fitText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize: number,
  fontFamily: string,
  weight = 900,
  style = 'normal',
): number {
  let size = maxSize;
  while (size > minSize) {
    context.font = `${style} ${weight} ${size}px ${fontFamily}`;
    if (context.measureText(text).width <= maxWidth) return size;
    size -= 2;
  }
  context.font = `${style} ${weight} ${minSize}px ${fontFamily}`;
  return minSize;
}

function drawHeaderRibbon(
  context: CanvasRenderingContext2D,
  appTitle: string,
  x: number,
  y: number,
  width: number,
  height: number,
  palette: CardPalette,
  fontFamily: string,
) {
  const gradient = context.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, palette.accent);
  gradient.addColorStop(1, palette.accentDark);
  fillRoundedRect(context, x, y, width, height, Math.min(24, height / 3), gradient);
  context.fillStyle = palette.secondary;
  context.fillRect(x + 18, y + height - 8, width - 36, 8);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#fff';
  fitText(context, appTitle, width - 70, Math.round(height * 0.42), 22, fontFamily, 900);
  context.fillText(appTitle, x + width / 2, y + height / 2 - 3);
}

function drawMetaPill(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  palette: CardPalette,
  fontFamily: string,
) {
  fillRoundedRect(context, x, y, width, height, height / 2, 'rgba(255, 255, 255, 0.9)');
  strokeRoundedRect(context, x, y, width, height, height / 2, `${palette.line}cc`, 4);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = palette.text;
  fitText(context, text, width - 34, Math.round(height * 0.48), 18, fontFamily, 900);
  context.fillText(text, x + width / 2, y + height / 2);
}

function drawTrainerBadge(
  context: CanvasRenderingContext2D,
  trainerName: string,
  x: number,
  y: number,
  width: number,
  height: number,
  palette: CardPalette,
  fontFamily: string,
) {
  fillRoundedRect(context, x, y, width, height, 18, palette.secondary);
  strokeRoundedRect(context, x, y, width, height, 18, 'rgba(17, 20, 45, 0.34)', 4);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = palette.text;
  fitText(context, trainerName, width - 42, Math.round(height * 0.48), 22, fontFamily, 900);
  context.fillText(trainerName, x + width / 2, y + height / 2 + 1);
}

function drawQuotePanel(
  context: CanvasRenderingContext2D,
  reason: string,
  x: number,
  y: number,
  width: number,
  height: number,
  palette: CardPalette,
  fontFamily: string,
  fontSize: number,
  lineHeight: number,
  maxLines: number,
  textAlign: CanvasTextAlign = 'center',
) {
  if (!reason.trim()) return;

  fillRoundedRect(context, x, y, width, height, 24, 'rgba(255, 255, 255, 0.93)');
  strokeRoundedRect(context, x, y, width, height, 24, `${palette.line}bb`, 5);
  context.fillStyle = palette.text;
  context.font = `700 ${fontSize}px ${fontFamily}`;
  drawWrappedText(
    context,
    reason,
    textAlign === 'center' ? x + width / 2 : x + 34,
    y + Math.max(22, (height - lineHeight * maxLines) / 2),
    width - 68,
    lineHeight,
    maxLines,
    textAlign,
  );
}

function drawPokemonImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  size: number,
  artStyle: CardArtStyle,
  palette: CardPalette,
) {
  drawImageGlow(context, x, y, size * 0.72, palette);
  context.save();
  context.imageSmoothingEnabled = artStyle !== 'pixel';
  context.imageSmoothingQuality = artStyle === 'pixel' ? 'low' : 'high';
  context.shadowColor = 'rgba(0, 0, 0, 0.26)';
  context.shadowBlur = 26;
  context.shadowOffsetY = 12;
  context.drawImage(image, x - size / 2, y - size / 2, size, size);
  context.restore();
}

function drawCardBackdrop(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  palette: CardPalette,
  radius: number,
  padding: number,
) {
  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, palette.backgroundA);
  background.addColorStop(0.58, palette.backgroundB);
  background.addColorStop(1, '#0d132b');
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.save();
  context.globalAlpha = 0.08;
  context.fillStyle = '#fff';
  context.beginPath();
  context.moveTo(width * 0.1, 0);
  context.lineTo(width * 0.42, 0);
  context.lineTo(width * 0.18, height);
  context.lineTo(0, height);
  context.closePath();
  context.fill();
  context.restore();

  drawPokeballMark(context, width * 0.8, height * 0.74, Math.min(width, height) * 0.36, 0.08);
  drawPokeballMark(context, width * 0.18, height * 0.18, Math.min(width, height) * 0.16, 0.045);

  fillRoundedRect(context, padding, padding, width - padding * 2, height - padding * 2, radius, 'rgba(14, 20, 49, 0.5)');
  strokeRoundedRect(context, padding, padding, width - padding * 2, height - padding * 2, radius, palette.line, Math.max(6, padding * 0.18));
  strokeRoundedRect(context, padding + 15, padding + 15, width - padding * 2 - 30, height - padding * 2 - 30, radius * 0.72, 'rgba(255, 255, 255, 0.24)', 3);
}

async function generatePokemonCardCanvas(
  format: CardFormatKey,
  declaration: Declaration,
  artStyle: CardArtStyle,
  shiny: boolean,
  appTitle: string,
): Promise<HTMLCanvasElement> {
  await document.fonts?.ready;
  const canvas = document.createElement('canvas');
  const { width, height } = cardFormats[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas is not available in this browser.');
  }

  const computedFontFamily = getComputedStyle(document.body).fontFamily || 'sans-serif';
  const displayFontFamily = `${computedFontFamily}, "Noto Sans SC", "Noto Sans TC", "Noto Sans KR", sans-serif`;
  const readableFontFamily = '"Noto Sans SC", "Noto Sans TC", "Noto Sans KR", "Microsoft YaHei", "PingFang SC", "Arial Unicode MS", "Trebuchet MS", sans-serif';
  const pokemonName = formatPokemonName(declaration.pokemonName);
  const reason = declaration.reason.replace(/\n/g, ' ').trim();
  const palette = cardPaletteForMode(declaration.mode);
  const dexNumber = `#${String(declaration.pokemonId).padStart(3, '0')}`;
  const metadata = `${dexNumber} / ${generationLabel(getGeneration(declaration.pokemonId))}`;
  if (document.fonts?.load) {
    await Promise.allSettled([
      document.fonts.load(`700 38px "Noto Sans SC"`, `${reason}${declaration.trainerName}`),
      document.fonts.load(`700 38px "Noto Sans TC"`, `${reason}${declaration.trainerName}`),
      document.fonts.load(`700 38px "Noto Sans KR"`, `${reason}${declaration.trainerName}`),
    ]);
  }
  const baseImageUrl = artStyle === 'pixel'
    ? pixelArtworkUrl(declaration.pokemonId)
    : officialArtworkUrl(declaration.pokemonId);
  const imageUrl = shiny ? shinyArtworkUrl(declaration.pokemonId, artStyle) : baseImageUrl;
  const pokemonImage = await loadCanvasImage(imageUrl).catch((error) => {
    if (shiny) return loadCanvasImage(baseImageUrl);
    throw error;
  });

  if (format === 'horizontal') {
    const padding = 28;
    drawCardBackdrop(context, width, height, palette, 34, padding);

    const headerX = 62;
    const headerY = 58;
    const headerWidth = width - headerX * 2;
    drawHeaderRibbon(context, appTitle, headerX, headerY, headerWidth, 64, palette, readableFontFamily);

    const imageSize = artStyle === 'pixel' ? 360 : 420;
    drawPokemonImage(context, pokemonImage, 320, 356, imageSize, artStyle, palette);

    const textX = 610;
    const textWidth = 500;
    drawMetaPill(context, metadata, textX, 158, 250, 48, palette, readableFontFamily);

    context.textAlign = 'left';
    context.textBaseline = 'alphabetic';
    context.fillStyle = '#fff';
    const nameSize = fitText(context, pokemonName, textWidth, 82, 50, displayFontFamily, 900);
    context.fillText(pokemonName, textX, 286);
    context.fillStyle = palette.secondary;
    context.fillRect(textX, 306, Math.min(190, textWidth * 0.42), Math.max(8, nameSize * 0.1));

    drawTrainerBadge(context, declaration.trainerName, textX, 332, 360, 62, palette, readableFontFamily);
    drawQuotePanel(context, reason, textX, 418, 500, 118, palette, readableFontFamily, reason.length > 150 ? 25 : 30, 36, 3, 'left');
  } else if (format === 'square') {
    const padding = 40;
    drawCardBackdrop(context, width, height, palette, 46, padding);

    drawHeaderRibbon(context, appTitle, 78, 76, width - 156, 82, palette, readableFontFamily);
    const imageSize = artStyle === 'pixel' ? 420 : 520;
    drawPokemonImage(context, pokemonImage, width / 2, 390, imageSize, artStyle, palette);

    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';
    context.fillStyle = '#fff';
    fitText(context, pokemonName, 880, 94, 58, displayFontFamily, 900);
    context.fillText(pokemonName, width / 2, 690);

    drawMetaPill(context, metadata, width / 2 - 170, 724, 340, 54, palette, readableFontFamily);
    drawTrainerBadge(context, declaration.trainerName, width / 2 - 270, 804, 540, 68, palette, readableFontFamily);
    drawQuotePanel(context, reason, 116, 902, width - 232, 112, palette, readableFontFamily, reason.length > 130 ? 26 : 31, 37, 2);
  } else {
    const padding = 54;
    drawCardBackdrop(context, width, height, palette, 58, padding);

    drawHeaderRibbon(context, appTitle, 96, 94, width - 192, 104, palette, readableFontFamily);
    const imageSize = artStyle === 'pixel' ? 650 : 780;
    drawPokemonImage(context, pokemonImage, width / 2, 650, imageSize, artStyle, palette);

    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';
    context.fillStyle = '#fff';
    fitText(context, pokemonName, 900, 116, 66, displayFontFamily, 900);
    context.fillText(pokemonName, width / 2, 1118);

    drawMetaPill(context, metadata, width / 2 - 190, 1162, 380, 60, palette, readableFontFamily);
    drawTrainerBadge(context, declaration.trainerName, width / 2 - 310, 1264, 620, 84, palette, readableFontFamily);
    drawQuotePanel(context, reason, 118, 1420, width - 236, 260, palette, readableFontFamily, reason.length > 220 ? 32 : 38, 48, 4);
  }

  context.font = `900 ${format === 'horizontal' ? 26 : 30}px ${readableFontFamily}`;
  context.fillStyle = palette.secondary;
  context.textAlign = 'center';
  context.textBaseline = 'bottom';
  const footerOffset = format === 'horizontal' ? 34 : format === 'vertical' ? 82 : 44;
  context.fillText(siteDomain, width / 2, height - footerOffset);
  return canvas;
}

function downloadCard(canvas: HTMLCanvasElement, pokemonName: string, format: CardFormatKey, shiny: boolean) {
  const link = document.createElement('a');
  const slug = pokemonName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  link.download = `my-favorite-${slug || 'pokemon'}${shiny ? '-shiny' : ''}-${format}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export default function App() {
  const [{ route, language }, setLocationState] = useState(() =>
    routeAndLanguageFromPathname(window.location.pathname),
  );
  const [mode, setMode] = useState<Mode>(() => readMode());
  const [pokemon, setPokemon] = useState<PokemonRow[]>([]);
  const [stats, setStats] = useState<PokemonStat[]>([]);
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [pokemonLoading, setPokemonLoading] = useState(true);
  const [backendLoading, setBackendLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [backendError, setBackendError] = useState('');
  const [usesMobileNav, setUsesMobileNav] = useState(() =>
    typeof window.matchMedia === 'function' ? window.matchMedia('(max-width: 1060px)').matches : false,
  );
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement | null>(null);
  const t = useMemo(() => copyFor(language, mode), [language, mode]);
  const loading = pokemonLoading;

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has('resetDeclaration')) return;
    clearDeclarations();
    url.searchParams.delete('resetDeclaration');
    window.location.replace(`${url.pathname}${url.search}${url.hash}`);
  }, []);

  useEffect(() => {
    let alive = true;
    fetchPokemonList()
      .then((rows) => {
        if (alive) {
          setPokemon(rows);
          setLoadError('');
        }
      })
      .catch((error: unknown) => {
        if (alive) {
          setLoadError(error instanceof Error ? error.message : t.pokemonLoadFallback);
        }
      })
      .finally(() => {
        if (alive) setPokemonLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [t.pokemonLoadFallback]);

  useEffect(() => {
    let alive = true;
    setBackendLoading(true);
    loadBackendData(mode)
      .then((payload) => {
        if (alive) {
          setStats(payload.stats);
          setDeclarations(payload.latest);
          setBackendError('');
        }
      })
      .catch((error: unknown) => {
        if (alive) {
          setStats([]);
          setDeclarations([]);
          setBackendError(error instanceof Error ? error.message : t.backendLoadFallback);
        }
      })
      .finally(() => {
        if (alive) setBackendLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [mode, t.backendLoadFallback]);

  useEffect(() => {
    const onPop = () => setLocationState(routeAndLanguageFromPathname(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
    };
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const mediaQuery = window.matchMedia('(max-width: 1060px)');
    const syncMobileNav = () => setUsesMobileNav(mediaQuery.matches);

    syncMobileNav();
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncMobileNav);
      return () => {
        mediaQuery.removeEventListener('change', syncMobileNav);
      };
    }

    mediaQuery.addListener(syncMobileNav);
    return () => {
      mediaQuery.removeListener(syncMobileNav);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.mode = mode;
    localStorage.setItem('favorite_pokemon_mode', mode);
  }, [mode, t.backendLoadFallback]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.locale = language;
  }, [language]);

  useEffect(() => {
    if (!languageMenuOpen) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setLanguageMenuOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setLanguageMenuOpen(false);
      }
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [languageMenuOpen]);

  useEffect(() => {
    const existing = document.getElementById('locale-font-stylesheet') as HTMLLinkElement | null;
    const href = fontStylesheetsByLanguage[language];
    if (!href) {
      existing?.remove();
      return;
    }
    if (existing?.href === href) return;
    const link = existing ?? document.createElement('link');
    link.id = 'locale-font-stylesheet';
    link.rel = 'stylesheet';
    link.href = href;
    if (!existing) document.head.appendChild(link);
  }, [language]);

  useEffect(() => {
    const seo = seoFor(route, language);
    const canonicalUrl = absoluteLocalizedUrl(route, language);
    const faq = [
      { question: t.faqWhatQuestion, answer: t.faqWhatAnswer },
      { question: t.faqShareQuestion, answer: t.faqShareAnswer },
      { question: t.faqLeastQuestion, answer: t.faqLeastAnswer },
      { question: t.faqDataQuestion, answer: t.faqDataAnswer },
    ];
    document.title = seo.title;

    upsertLinkHref('canonical', canonicalUrl);
    upsertMetaContent('name', 'description', seo.description);
    upsertMetaContent('http-equiv', 'content-language', language);
    upsertMetaContent('property', 'og:url', canonicalUrl);
    upsertMetaContent('property', 'og:title', seo.socialTitle);
    upsertMetaContent('property', 'og:description', seo.description);
    upsertMetaContent('property', 'og:locale', ogLocaleByLanguage[language]);
    upsertMetaContent('property', 'og:image', ogImageUrl);
    upsertMetaContent('property', 'og:image:secure_url', ogImageUrl);
    upsertMetaContent('name', 'twitter:domain', siteDomain);
    upsertMetaContent('name', 'twitter:url', canonicalUrl);
    upsertMetaContent('name', 'twitter:title', seo.socialTitle);
    upsertMetaContent('name', 'twitter:description', seo.description);
    upsertMetaContent('name', 'twitter:image', twitterImageUrl);
    syncAlternateLinks(route);
    syncStructuredData(route, language, seo, faq);
  }, [route, language, t]);

  const displayPokemon = useMemo(() => mergePokemonStats(pokemon, stats), [pokemon, stats]);
  const activeLocaleOption = localeOptions.find((option) => option.code === language) ?? localeOptions[0];

  function handleDeclarationSubmitted(declaration: Declaration) {
    setDeclarations((current) => [declaration, ...current].slice(0, 20));
    setStats((current) => incrementStat(current, declaration));
  }

  function navigate(event: MouseEvent<HTMLAnchorElement>, nextRoute: Route) {
    event.preventDefault();
    const nextPath = localizedPath(nextRoute, language);
    window.history.pushState({}, '', nextPath);
    setLocationState({ route: nextRoute, language });
  }

  function changeLanguage(nextLanguage: Language) {
    const nextPath = localizedPath(route, nextLanguage);
    window.history.pushState({}, '', nextPath);
    setLocationState({ route, language: nextLanguage });
    setLanguageMenuOpen(false);
  }

  function toggleMode() {
    setMode((current) => (current === 'favourite' ? 'not_favourite' : 'favourite'));
  }

  function renderNavigationLinks() {
    return (
      <>
        <NavLink route="/" activeRoute={route} language={language} onNavigate={navigate}>
          {t.declare}
        </NavLink>
        <NavLink route="/game" activeRoute={route} language={language} onNavigate={navigate}>
          {t.game}
        </NavLink>
        <NavLink route="/explore" activeRoute={route} language={language} onNavigate={navigate}>
          {t.explore}
        </NavLink>
        <NavLink route="/pokedex" activeRoute={route} language={language} onNavigate={navigate}>
          {t.pokedex}
        </NavLink>
        <NavLink route="/stats" activeRoute={route} language={language} onNavigate={navigate}>
          {t.stats}
        </NavLink>
      </>
    );
  }

  return (
    <>
      <header className="site-header">
        <nav className="navbar" aria-label="Main navigation">
          <a className="brand" href={localizedPath('/', language)} onClick={(event) => navigate(event, '/')}>
            <img className="brand-mark" src="/brand/brand-mark.svg" alt="" width={44} height={44} aria-hidden="true" />
            <span>{t.appTitle}</span>
          </a>
          <div className="navbar-right">
            {!usesMobileNav && <div className="nav-links nav-links--desktop">{renderNavigationLinks()}</div>}
            <div className="navbar-actions">
              <button
                type="button"
                className={`mode-toggle mode-toggle--${mode}`}
                onClick={toggleMode}
                aria-label={t.modeToggle}
              >
                {mode === 'favourite' ? <Trophy size={16} /> : <Ban size={16} />}
                <span className="mode-toggle-text">{t.modeToggle}</span>
              </button>
              <a
                className="kofi-nav-button"
                href={kofiUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t.kofiSupport}
              >
                <Coffee size={16} />
                <span className="kofi-text">Ko-fi</span>
              </a>
              <div className={`language-select${languageMenuOpen ? ' is-open' : ''}`} ref={languageMenuRef}>
                <button
                  type="button"
                  className="language-trigger"
                  aria-label={t.language}
                  aria-expanded={languageMenuOpen}
                  aria-haspopup="listbox"
                  onClick={() => setLanguageMenuOpen((open) => !open)}
                >
                  <span>{activeLocaleOption.shortLabel}</span>
                  <ChevronDown size={14} aria-hidden="true" />
                </button>
                <div className="language-menu-list" role="listbox" aria-label={t.language} hidden={!languageMenuOpen}>
                  {localeOptions.map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      className={option.code === language ? 'active' : ''}
                      role="option"
                      aria-selected={option.code === language}
                      onClick={() => changeLanguage(option.code)}
                    >
                      <span>{option.nativeLabel}</span>
                      <small>{option.shortLabel}</small>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {usesMobileNav && (
        <nav className="nav-links mobile-nav-dock" aria-label="Main navigation">
          {renderNavigationLinks()}
        </nav>
      )}

      <main className={`app-shell${route === '/explore' ? ' app-shell--explore' : ''}`}>
        {loadError && <p className="message warning">{t.pokemonLoadWarning} {loadError}</p>}
        {backendError && <p className="message warning">{t.backendLoadWarning} {backendError}</p>}
        {route === '/' && (
          <DeclarePage
            pokemon={displayPokemon}
            loading={loading}
            declarations={declarations}
            mode={mode}
            t={t}
            onSubmitted={handleDeclarationSubmitted}
          />
        )}
        {route === '/game' && <GamePage pokemon={displayPokemon} mode={mode} language={language} t={t} />}
        {route === '/explore' && <ExplorePage declarations={declarations} language={language} t={t} />}
        {route === '/pokedex' && (
          <PokedexPage pokemon={displayPokemon} mode={mode} language={language} loading={loading} t={t} />
        )}
        {route === '/stats' && (
          <StatsPage
            pokemon={displayPokemon}
            declarations={declarations}
            language={language}
            loading={loading}
            dataPending={backendLoading}
            t={t}
          />
        )}
      </main>

      {route !== '/game' && route !== '/explore' && <Footer t={t} />}
    </>
  );
}

function NavLink({
  route,
  activeRoute,
  language,
  onNavigate,
  children,
}: {
  route: Route;
  activeRoute: Route;
  language: Language;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, route: Route) => void;
  children: string;
}) {
  return (
    <a
      href={localizedPath(route, language)}
      className={route === activeRoute ? 'active' : ''}
      onClick={(event) => onNavigate(event, route)}
    >
      {children}
    </a>
  );
}

function DeclarePage({
  pokemon,
  loading,
  declarations,
  mode,
  t,
  onSubmitted,
}: {
  pokemon: PokemonRow[];
  loading: boolean;
  declarations: Declaration[];
  mode: Mode;
  t: TranslationMessages;
  onSubmitted: (declaration: Declaration) => void;
}) {
  const [trainerName, setTrainerName] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<PokemonRow | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alreadyDeclared, setAlreadyDeclared] = useState(() => hasDeclaredOnDevice(mode));
  const [submittedSummary, setSubmittedSummary] = useState<LocalDeclarationSummary | null>(() =>
    getLocalDeclarationSummary(mode),
  );

  useEffect(() => {
    setAlreadyDeclared(hasDeclaredOnDevice(mode));
    setSubmittedSummary(getLocalDeclarationSummary(mode));
  }, [mode]);

  const filteredPokemon = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return pokemon
      .filter((row) => {
        if (!normalized) return true;
        return row.name.toLowerCase().includes(normalized) || String(row.id).includes(normalized);
      })
      .slice(0, 8);
  }, [pokemon, query]);

  const heroPokemon = useMemo<ShowcasePokemon | null>(() => {
    if (selected) return selected;
    if (!submittedSummary) return null;
    return pokemon.find((row) => row.id === submittedSummary.declaration.pokemonId) ??
      declarationToShowcasePokemon(submittedSummary.declaration);
  }, [pokemon, selected, submittedSummary]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected || trainerName.trim().length < 2 || reason.trim().length < 10 || alreadyDeclared || submitting) {
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await createBackendDeclaration({
        trainerName: trainerName.trim(),
        pokemonId: selected.id,
        pokemonName: selected.name,
        reason: reason.trim(),
        mode,
      });
      const summary = {
        declaration: result.declaration,
        fanCount: result.fanCount,
        revealedCount: result.revealedCount,
      };
      markDeclaredOnDevice(mode, summary);
      setAlreadyDeclared(true);
      setSubmittedSummary(summary);
      onSubmitted(result.declaration);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t.saveErrorFallback);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page declare-page">
      <div className="declaration-hero">
        <div>
          <p className="eyebrow">{t.fanDeclaration}</p>
          <h1>{t.appTitle}</h1>
          <p>{t.declarationLead}</p>
          <a className="hero-cta-button" href="#trainer-terminal">
            <span>{t.declare}</span>
            <ChevronDown size={18} aria-hidden="true" />
          </a>
          <PokemonAssetStrip className="hero-party-strip" />
        </div>
        <div className="home-side-stack">
          <PokemonShowcase pokemon={heroPokemon} previewPool={pokemon} t={t} />
          <div className="home-mini-grid">
            <div className="home-mini-panel">
              <span>{t.nationalDex}</span>
              <strong>1025</strong>
            </div>
            <div className="home-mini-panel home-mini-panel--blue">
              <span>{t.currentPick}</span>
              <strong>{heroPokemon?.name ?? '???'}</strong>
            </div>
          </div>
        </div>
      </div>

      {alreadyDeclared ? (
        <DeclarationSuccessPanel id="trainer-terminal" summary={submittedSummary} t={t} />
      ) : (
        <form id="trainer-terminal" className="declaration-form trainer-console" onSubmit={submit}>
          <div className="trainer-console-header">
            <span>{t.trainerTerminal}</span>
            <strong>{mode === 'favourite' ? t.favouriteFile : t.rivalFile}</strong>
          </div>
          {error && <p className="message error">{error}</p>}
          <div className="trainer-field-grid">
            <label className="field" htmlFor="trainer-name">
              <span>{t.trainerName}</span>
              <input
                id="trainer-name"
                name="trainerName"
                value={trainerName}
                onChange={(event) => setTrainerName(event.target.value)}
                placeholder={t.trainerPlaceholder}
              />
            </label>

            <div className="selector">
              <label htmlFor="pokemon-search">{t.favouritePokemon}</label>
              <input
                id="pokemon-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={loading ? t.loading : t.searchPlaceholder}
              />
              <Search className="selector-search-icon" size={18} aria-hidden="true" />
              {query && !selected && (
                <ul className="selector-menu">
                  {filteredPokemon.map((row) => (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(row);
                          setQuery(row.name);
                        }}
                      >
                        <img src={row.sprite} alt="" width={48} height={48} loading="lazy" decoding="async" />
                        <span>{row.name}</span>
                        <small>{row.number}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {loading && !selected && !query && <div className="spinner" aria-label={t.loading} />}
              {selected && (
                <button type="button" className="selected-pokemon" onClick={() => setSelected(null)}>
                  <img src={selected.sprite} alt="" width={56} height={56} loading="lazy" decoding="async" />
                  <div>
                    <strong>{selected.name}</strong>
                    <small>
                      {selected.number} · {selected.generationLabel}
                    </small>
                  </div>
                </button>
              )}
            </div>
          </div>

          <label className="field" htmlFor="declaration-reason">
            <span>{t.reason}</span>
            <small>{t.reasonHelp}</small>
            <textarea
              id="declaration-reason"
              name="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value.slice(0, 300))}
              placeholder={t.reasonPlaceholder}
            />
            <span className="char-count">{reason.length}/300</span>
          </label>

          <button
            className="primary-button"
            type="submit"
            disabled={
              !selected ||
              trainerName.trim().length < 2 ||
              reason.trim().length < 10 ||
              alreadyDeclared ||
              submitting
            }
          >
            {submitting ? t.saving : t.declareButton}
          </button>
        </form>
      )}

      <SeoFaq t={t} />

      <section className="latest-strip" aria-label={t.latest}>
        {declarations.slice(0, 3).map((declaration) => (
          <article className="latest-card" key={declaration.id}>
            <PokemonSprite pokemonId={declaration.pokemonId} name={declaration.pokemonName} />
            <div>
              <strong>{declaration.trainerName}</strong>
              <span>
                {t.chose} {declaration.pokemonName}
              </span>
              <p>{declaration.reason}</p>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}

function SeoFaq({ t }: { t: TranslationMessages }) {
  const items = [
    { question: t.faqWhatQuestion, answer: t.faqWhatAnswer },
    { question: t.faqShareQuestion, answer: t.faqShareAnswer },
    { question: t.faqLeastQuestion, answer: t.faqLeastAnswer },
    { question: t.faqDataQuestion, answer: t.faqDataAnswer },
  ];

  return (
    <section className="seo-faq" aria-labelledby="favmon-faq-heading">
      <div className="seo-faq-heading">
        <h2 id="favmon-faq-heading">{t.faqHeading}</h2>
      </div>
      <div className="seo-faq-grid">
        {items.map((item) => (
          <article className="seo-faq-item" key={item.question}>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function DeclarationSuccessPanel({
  id,
  summary,
  t,
}: {
  id?: string;
  summary: LocalDeclarationSummary | null;
  t: TranslationMessages;
}) {
  const declaration = summary?.declaration;
  const pokemonName = declaration?.pokemonName ?? '';
  const fanMessage = summary
    ? template(summary.fanCount === 1 ? t.firstFan : t.moreFans, {
      count: String(summary.fanCount),
      pokemon: pokemonName,
    })
    : t.alreadyDeclared;

  return (
    <div id={id} className="declaration-form declaration-success-panel">
      <div className="success-topbar">
        <div className="success-heading">
          <h2>{t.success}</h2>
          {declaration && <p className="message success success-message">{fanMessage}</p>}
        </div>
        <a className="success-kofi-link" href={kofiUrl} target="_blank" rel="noopener noreferrer">
          <Coffee size={16} />
          {t.kofiSupport}
        </a>
      </div>
      {declaration ? (
        <div className="success-layout">
          <aside className="success-summary-card">
            <div className="success-pokemon-lockup">
              <PokemonSprite className="success-pokemon" pokemonId={declaration.pokemonId} name={pokemonName} />
              <div>
                <span>{t.declaredPokemon}</span>
                <strong>{pokemonName}</strong>
              </div>
            </div>
            <p className="success-progress">
              {template(t.journeyContinues, { count: String(summary.revealedCount) })}
            </p>
            <div className="success-declaration">
              <span>{t.reason}</span>
              <p>{declaration.reason}</p>
            </div>
          </aside>

          <div className="success-share-column">
            <p className="success-note">{t.instagramChangeFormMsg}</p>
            <PokemonCardDownloader declaration={declaration} t={t} />
          </div>
        </div>
      ) : (
        <p className="message warning">{fanMessage}</p>
      )}
    </div>
  );
}

function PokemonCardDownloader({ declaration, t }: { declaration: Declaration; t: TranslationMessages }) {
  const [artStyle, setArtStyle] = useState<CardArtStyle>('official');
  const [format, setFormat] = useState<CardFormatKey>('square');
  const [shiny, setShiny] = useState(false);
  const [canvases, setCanvases] = useState<Partial<Record<CardFormatKey, HTMLCanvasElement>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloaded, setDownloaded] = useState<Partial<Record<CardFormatKey, boolean>>>({});
  const previewRef = useRef<HTMLDivElement>(null);

  const generateCards = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const entries = await Promise.all(
        (Object.keys(cardFormats) as CardFormatKey[]).map(async (key) => [
          key,
          await generatePokemonCardCanvas(key, declaration, artStyle, shiny, t.appTitle),
        ] as const),
      );
      setCanvases(Object.fromEntries(entries));
    } catch (cardError) {
      setError(cardError instanceof Error ? cardError.message : t.cardGenerationError);
    } finally {
      setLoading(false);
    }
  }, [artStyle, declaration, shiny, t]);

  useEffect(() => {
    void generateCards();
  }, [generateCards]);

  useEffect(() => {
    const sourceCanvas = canvases[format];
    const target = previewRef.current;
    if (!sourceCanvas || !target) return;

    target.innerHTML = '';
    const previewCanvas = document.createElement('canvas');
    const previewWidth = format === 'horizontal' ? 740 : format === 'square' ? 560 : 420;
    const scale = previewWidth / sourceCanvas.width;
    previewCanvas.width = previewWidth;
    previewCanvas.height = sourceCanvas.height * scale;
    previewCanvas.getContext('2d')?.drawImage(sourceCanvas, 0, 0, previewCanvas.width, previewCanvas.height);
    target.appendChild(previewCanvas);
  }, [canvases, format]);

  function handleDownload(nextFormat: CardFormatKey) {
    setFormat(nextFormat);
    const canvas = canvases[nextFormat];
    if (!canvas) return;
    downloadCard(canvas, declaration.pokemonName, nextFormat, shiny);
    setDownloaded((current) => ({ ...current, [nextFormat]: true }));
    window.setTimeout(() => {
      setDownloaded((current) => ({ ...current, [nextFormat]: false }));
    }, 2400);
  }

  return (
    <section className="share-card-section" aria-label={t.downloadCardAria}>
      <h3 className="share-card-title">{t.downloadCardTitle}</h3>
      <div className="share-card-controls">
        <div className="share-art-toggle" role="group" aria-label={t.cardArtStyle}>
          <button
            type="button"
            className={artStyle === 'official' ? 'active' : ''}
            onClick={() => setArtStyle('official')}
          >
            {t.officialArt}
          </button>
          <button
            type="button"
            className={artStyle === 'pixel' ? 'active' : ''}
            onClick={() => setArtStyle('pixel')}
          >
            {t.pixelArt}
          </button>
        </div>
        <label className="share-shiny-check">
          <input
            type="checkbox"
            checked={shiny}
            onChange={(event) => setShiny(event.target.checked)}
          />
          <span className="share-shiny-box" aria-hidden="true" />
          <span>{t.shiny}</span>
        </label>
      </div>

      <div className="share-download-row">
        {(Object.entries(cardFormats) as Array<[CardFormatKey, typeof cardFormats[CardFormatKey]]>).map(([key, item]) => (
          <button
            key={key}
            type="button"
            className={`share-dl-btn ${format === key ? 'active' : ''}`}
            onClick={() => handleDownload(key)}
            onMouseEnter={() => setFormat(key)}
            disabled={loading || Boolean(error)}
          >
            <Download size={24} />
            <span className="share-dl-info">
              <span className="share-dl-label">{t[item.labelKey]}</span>
              <span className="share-dl-sub">{downloaded[key] ? `✓ ${t.downloaded}` : item.sub}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="share-preview-area">
        {loading && <div className="spinner" aria-label={t.generatingCards} />}
        {error && <p className="message error">{error}</p>}
        <div ref={previewRef} className="share-preview-canvas" />
      </div>
    </section>
  );
}

function ExplorePage({
  declarations,
  language,
  t,
}: {
  declarations: Declaration[];
  language: Language;
  t: TranslationMessages;
}) {
  return (
    <section className="page explore-page">
      <div className="explore-page-heading sr-only">
        <p className="eyebrow">{t.explore}</p>
        <h1>{t.exploreHeading}</h1>
      </div>
      <div className="explore-container" aria-label={t.exploreHeading}>
        {declarations.length === 0 && (
          <div className="empty-explore">
            <div className="empty-explore-field" aria-hidden="true">
              <img
                className="empty-explore-art empty-explore-art--main"
                src={officialArtworkUrl(25)}
                alt=""
                width={475}
                height={475}
                loading="lazy"
                decoding="async"
              />
              <img
                className="empty-explore-art empty-explore-art--left"
                src={officialArtworkUrl(1)}
                alt=""
                width={475}
                height={475}
                loading="lazy"
                decoding="async"
              />
              <img
                className="empty-explore-art empty-explore-art--right"
                src={officialArtworkUrl(6)}
                alt=""
                width={475}
                height={475}
                loading="lazy"
                decoding="async"
              />
            </div>
            <PokemonAssetStrip className="empty-explore-strip" />
            <p>{t.noDeclarations}</p>
          </div>
        )}
        {declarations.map((declaration) => (
          <article className="reel-item" key={declaration.id}>
            <img
              className="reel-aura-art"
              src={officialArtworkUrl(declaration.pokemonId)}
              alt=""
              aria-hidden="true"
              width={475}
              height={475}
              loading="lazy"
              decoding="async"
            />
            <div className="reel-content">
              <PokemonSprite
                className="reel-pokemon-image"
                pokemonId={declaration.pokemonId}
                name={declaration.pokemonName}
              />
              <h2 className="reel-trainer">{declaration.trainerName}</h2>
              <p className="reel-pokemon-name">{declaration.pokemonName}</p>
              <p className="reel-reason">"{declaration.reason}"</p>
              <p className="reel-meta">{new Date(declaration.createdAt).toLocaleDateString(language)}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PokedexPage({
  pokemon,
  mode,
  language,
  loading,
  t,
}: {
  pokemon: PokemonRow[];
  mode: Mode;
  language: Language;
  loading: boolean;
  t: TranslationMessages;
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('number');
  const [generation, setGeneration] = useState<'all' | GenerationKey>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [modalPokemon, setModalPokemon] = useState<PokemonRow | null>(null);
  const declaredIds = useMemo(() => new Set(pokemon.filter((row) => row.votes > 0).map((row) => row.id)), [pokemon]);
  const total = pokemon.length;
  const discovered = declaredIds.size;
  const progress = total > 0 ? (discovered / total) * 100 : 0;

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const rows = pokemon
      .filter((row) => {
        const revealed = declaredIds.has(row.id);
        if (status === 'revealed' && !revealed) return false;
        if (status === 'hidden' && revealed) return false;
        if (generation !== 'all' && row.generation !== generation) return false;
        if (!normalized) return true;
        return row.name.toLowerCase().includes(normalized) || String(row.id).includes(normalized);
      })
      .sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name);
        if (sort === 'fans') return b.votes - a.votes;
        return a.id - b.id;
      });
    return rows;
  }, [pokemon, query, sort, generation, status, declaredIds]);

  useEffect(() => {
    setPage(1);
  }, [query, sort, generation, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pokedexPageSize));
  const pageRows = filtered.slice((page - 1) * pokedexPageSize, page * pokedexPageSize);

  return (
    <section className="page pokedex-page">
      <div className="page-heading">
        <p className="eyebrow">{t.communityPokedex}</p>
        <h1>{t.discoveredHeading}</h1>
        <PokemonAssetStrip className="pokedex-asset-strip" />
      </div>
      <section className="progress-panel">
        <div className="progress-copy">
          <span>
            {discovered} / {total} {t.pokemonColumn} {t.discovered.toLowerCase()}
          </span>
          <strong>{progress.toFixed(1)}%</strong>
        </div>
        <div className="progress-track">
          <div className="progress-fill high" style={{ width: `${progress}%` }} />
        </div>
      </section>

      <section className="pokedex-tools">
        <label className="pokedex-search" htmlFor="pokedex-search">
          <span>{t.searchPokedex}</span>
          <input
            id="pokedex-search"
            name="pokedexSearch"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.searchPlaceholder}
          />
          <Search className="pokedex-search-icon" size={18} aria-hidden="true" />
        </label>
        <label className="pokedex-select" htmlFor="pokedex-sort">
          <span>{t.sortBy}</span>
          <select
            id="pokedex-sort"
            name="pokedexSort"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
          >
            <option value="number">{t.sortNumber}</option>
            <option value="name">{t.sortName}</option>
            <option value="fans">{t.sortFans}</option>
          </select>
        </label>
        <label className="pokedex-select" htmlFor="pokedex-generation">
          <span>{t.generation}</span>
          <select
            id="pokedex-generation"
            name="pokedexGeneration"
            value={generation}
            onChange={(event) => setGeneration(event.target.value as 'all' | GenerationKey)}
          >
            <option value="all">{t.allGenerations}</option>
            {allGenerations().map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <div className="segmented-control">
          <button className={layout === 'grid' ? 'active' : ''} onClick={() => setLayout('grid')}>
            {t.grid}
          </button>
          <button className={layout === 'list' ? 'active' : ''} onClick={() => setLayout('list')}>
            {t.list}
          </button>
        </div>
      </section>

      <div className="filter-row">
        {(['all', 'revealed', 'hidden'] as StatusFilter[]).map((item) => (
          <button
            key={item}
            type="button"
            className={status === item ? 'active' : ''}
            onClick={() => setStatus(item)}
          >
            {t[item]}
          </button>
        ))}
      </div>

      <div className="pokedex-summary">
        <span>
          {t.showing} {filtered.length} {t.of} {total}
        </span>
        <span>
          {t.discovered}: {discovered}
        </span>
        <span>
          {t.hiddenShort}: {Math.max(0, total - discovered)}
        </span>
      </div>

      {loading && <div className="spinner" aria-label={t.loading} />}
      {!loading && layout === 'grid' && (
        <div className="pokedex-grid">
          {pageRows.map((row) => (
            <button
              type="button"
              className="pokemon-card is-revealed"
              key={row.id}
              onClick={() => setModalPokemon(row)}
            >
              <span className="fan-badge">{row.votes}</span>
              <img src={row.sprite} alt="" width={96} height={96} loading="lazy" decoding="async" />
              <strong>{row.name}</strong>
              <span>{row.number}</span>
            </button>
          ))}
        </div>
      )}
      {!loading && layout === 'list' && (
        <div className="pokedex-list">
          {pageRows.map((row) => (
            <button
              type="button"
              className="pokedex-list-row is-revealed"
              key={row.id}
              onClick={() => setModalPokemon(row)}
            >
              <span className="list-number">{row.number}</span>
              <img src={row.sprite} alt="" width={64} height={64} loading="lazy" decoding="async" />
              <strong>{row.name}</strong>
              <span className="list-status">{row.votes} {t.fans}</span>
            </button>
          ))}
        </div>
      )}

      <Pagination page={page} pageCount={pageCount} onPageChange={setPage} t={t} />

      {modalPokemon && (
        <PokemonModal
          pokemon={modalPokemon}
          mode={mode}
          language={language}
          t={t}
          onClose={() => setModalPokemon(null)}
        />
      )}
    </section>
  );
}

function StatsPage({
  pokemon,
  declarations,
  language,
  loading,
  dataPending,
  t,
}: {
  pokemon: PokemonRow[];
  declarations: Declaration[];
  language: Language;
  loading: boolean;
  dataPending: boolean;
  t: TranslationMessages;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [expandedGeneration, setExpandedGeneration] = useState(true);
  const [expandedType, setExpandedType] = useState(true);
  const sorted = useMemo(() => [...pokemon].sort((a, b) => b.votes - a.votes), [pokemon]);
  const unique = pokemon.filter((row) => row.votes > 0).length;
  const totalVotes = pokemon.reduce((sum, row) => sum + row.votes, 0);
  const coverage = pokemon.length ? (unique / pokemon.length) * 100 : 0;

  function refresh() {
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 550);
  }

  const generationRows = allGenerations().map((item) => ({
    label: item.label,
    votes: pokemon
      .filter((row) => row.generation === item.key)
      .reduce((sum, row) => sum + row.votes, 0),
    sprite: pokemon.find((row) => row.generation === item.key)?.sprite,
  }));

  const typeRows = Object.keys(typeLabelKeys).map((type) => ({
    label: t[typeLabelKeys[type as PokemonType]],
    votes: pokemon
      .filter((row) => row.types.includes(type as PokemonType))
      .reduce((sum, row) => sum + row.votes, 0),
  }));
  const statsNavItems = [
    { id: 'stats-top-ten', label: t.topTen },
    { id: 'stats-generation', label: t.byGeneration },
    { id: 'stats-type', label: t.byType },
    { id: 'stats-ranking', label: t.fullRanking },
    { id: 'stats-latest', label: t.latest },
  ];

  return (
    <section className="page stats-page">
      <div className="page-heading split-heading">
        <div>
          <p className="eyebrow">{t.stats}</p>
          <h1>{t.statsHeading}</h1>
          <PokemonAssetStrip className="league-sprite-strip" />
        </div>
        <button className="secondary-button" type="button" onClick={refresh} disabled={refreshing}>
          {refreshing ? t.refreshing : t.refresh}
        </button>
      </div>

      {loading && <StatsSkeleton t={t} />}
      {!loading && (
        <>
          <nav className="stats-jump-nav" aria-label={t.statsHeading}>
            {statsNavItems.map((item) => (
              <a key={item.id} href={`#${item.id}`}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className={`metrics-grid${dataPending ? ' is-pending' : ''}`} aria-busy={dataPending}>
            <article className="metric-card">
              <Heart size={20} aria-hidden="true" />
              <span>{t.declarations}</span>
              <strong>{totalVotes.toLocaleString(language)}</strong>
              <img className="metric-card-art" src={officialArtworkUrl(25)} alt="" width={475} height={475} loading="lazy" decoding="async" />
            </article>
            <article className="metric-card">
              <Sparkles size={20} aria-hidden="true" />
              <span>{t.uniquePokemon}</span>
              <strong>{unique.toLocaleString(language)}</strong>
              <img className="metric-card-art" src={officialArtworkUrl(151)} alt="" width={475} height={475} loading="lazy" decoding="async" />
            </article>
            <article className="metric-card">
              <Gamepad2 size={20} aria-hidden="true" />
              <span>{t.pokedexCovered}</span>
              <strong>{coverage.toFixed(1)}%</strong>
              <img className="metric-card-art" src={officialArtworkUrl(133)} alt="" width={475} height={475} loading="lazy" decoding="async" />
            </article>
          </div>

          <section className="stats-section stats-section--chart" id="stats-top-ten">
            <h2>{t.topTen}</h2>
            <BarChart rows={sorted.slice(0, 10).map((row) => ({ ...row, label: row.name }))} />
          </section>

          <section className="stats-section stats-section--chart" id="stats-generation">
            <h2>
              <button className="stats-section-toggle" type="button" onClick={() => setExpandedGeneration((value) => !value)} aria-expanded={expandedGeneration}>
                <span>{t.byGeneration}</span>
                <span aria-hidden="true">{expandedGeneration ? '▲' : '▼'}</span>
              </button>
            </h2>
            {expandedGeneration && (
              <BarChart rows={generationRows.sort((a, b) => b.votes - a.votes)} />
            )}
          </section>

          <section className="stats-section stats-section--chart" id="stats-type">
            <h2>
              <button className="stats-section-toggle" type="button" onClick={() => setExpandedType((value) => !value)} aria-expanded={expandedType}>
                <span>{t.byType}</span>
                <span aria-hidden="true">{expandedType ? '▲' : '▼'}</span>
              </button>
            </h2>
            {expandedType && <BarChart rows={typeRows.sort((a, b) => b.votes - a.votes).slice(0, 12)} />}
          </section>

          <section className="stats-section stats-section--ranking" id="stats-ranking">
            <h2>{t.fullRanking}</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t.rank}</th>
                    <th>{t.pokemonColumn}</th>
                    <th>{t.votesColumn}</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.slice(0, 25).map((row, index) => (
                    <tr key={row.id}>
                      <td>#{index + 1}</td>
                      <td>
                        <span className="table-pokemon">
                          <img src={row.sprite} alt="" width={48} height={48} loading="lazy" decoding="async" />
                          {row.name}
                        </span>
                      </td>
                      <td>{row.votes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="stats-section stats-section--latest" id="stats-latest">
            <h2>{t.latest}</h2>
            <div className="latest-grid">
              {declarations.slice(0, 10).map((declaration) => (
                <article className="latest-card" key={declaration.id}>
                  <PokemonSprite pokemonId={declaration.pokemonId} name={declaration.pokemonName} />
                  <div>
                    <strong>{declaration.trainerName}</strong>
                    <span>
                      {t.chose} {declaration.pokemonName}
                    </span>
                    <p>{declaration.reason}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </section>
  );
}

function GamePage({
  pokemon,
  mode,
  language,
  t,
}: {
  pokemon: PokemonRow[];
  mode: Mode;
  language: Language;
  t: TranslationMessages;
}) {
  const [pair, setPair] = useState<[PokemonRow, PokemonRow] | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (pokemon.length >= 2) setPair(makePair(pokemon));
  }, [pokemon]);

  function choose(row: PokemonRow) {
    if (!pair || revealing) return;
    const other = pair.find((item) => item.id !== row.id)!;
    const correct = mode === 'favourite' ? row.votes >= other.votes : row.votes >= other.votes;
    setSelectedId(row.id);
    setRevealing(true);
    window.setTimeout(() => {
      if (correct) {
        setStreak((value) => value + 1);
        setPair(makePair(pokemon));
        setSelectedId(null);
        setRevealing(false);
      } else {
        setGameOver(true);
      }
    }, 850);
  }

  return (
    <section className="game-page">
      <a className="game-exit-btn" href={localizedPath('/', language)} aria-label={t.exitGame}>
        <X size={24} />
      </a>
      <div className="game-content-wrapper">
        <header className="game-header">
          <h1 className="game-title">{t.whosMoreLoved}</h1>
          <p className="game-subtitle">{t.pickTheOne}</p>
          <PokemonAssetStrip className="game-party-strip" />
          <div className="game-streak">
            <Trophy size={18} />
            <span>{t.streak}:</span>
            <strong>{streak}</strong>
          </div>
        </header>
        <div className="game-arena">
          {pair ? (
            <GameCard
              pokemon={pair[0]}
              selected={selectedId === pair[0].id}
              revealing={revealing}
              otherVotes={pair[1].votes}
              onChoose={choose}
              t={t}
            />
          ) : (
            <GameCardSkeleton t={t} />
          )}
          <div className="game-vs">VS</div>
          {pair ? (
            <GameCard
              pokemon={pair[1]}
              selected={selectedId === pair[1].id}
              revealing={revealing}
              otherVotes={pair[0].votes}
              onChoose={choose}
              t={t}
            />
          ) : (
            <GameCardSkeleton t={t} />
          )}
        </div>
        <footer className="game-footer">
          <a className="game-kofi-link" href={kofiUrl} target="_blank" rel="noopener noreferrer">
            <Coffee size={16} />
            {t.support}
          </a>
          <p className="game-disclaimer">{t.gameDisclaimer}</p>
        </footer>
      </div>
      {gameOver && pair && (
        <div className="game-over">
          <div className="game-over-card">
            <p className="game-over-title">{t.gameOver}</p>
            <strong className="game-over-streak">{streak}</strong>
            <p className="game-over-message">{streak > 4 ? t.legendary : t.niceTry}</p>
            <button
              className="game-play-again"
              type="button"
              onClick={() => {
                setGameOver(false);
                setRevealing(false);
                setSelectedId(null);
                setStreak(0);
                setPair(makePair(pokemon));
              }}
            >
              {t.playAgain}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function GameCardSkeleton({ t }: { t: TranslationMessages }) {
  return (
    <div className="game-card game-card--skeleton" aria-label={t.loading}>
      <span className="game-card-number" aria-hidden="true">#---</span>
      <span className="game-card-art-frame">
        <span className="game-card-artwork-placeholder" aria-hidden="true" />
      </span>
      <strong className="game-card-name">---</strong>
      <span className="game-card-id">Gen ?</span>
      <span className="game-card-types">
        <span className="type-badge type-badge--placeholder">---</span>
      </span>
    </div>
  );
}

function GameCard({
  pokemon,
  selected,
  revealing,
  otherVotes,
  onChoose,
  t,
}: {
  pokemon: PokemonRow;
  selected: boolean;
  revealing: boolean;
  otherVotes: number;
  onChoose: (pokemon: PokemonRow) => void;
  t: TranslationMessages;
}) {
  const winner = pokemon.votes >= otherVotes;
  const stateClass = revealing
    ? selected
      ? winner
        ? 'game-card--correct'
        : 'game-card--wrong'
      : winner
        ? 'game-card--correct'
        : ''
    : 'game-card--playable';
  return (
    <button
      type="button"
      className={`game-card ${stateClass}`}
      onClick={() => onChoose(pokemon)}
      disabled={revealing}
    >
      <span className="game-card-number" aria-hidden="true">{pokemon.number}</span>
      <span className="game-card-art-frame">
        <img
          className="game-card-artwork"
          src={pokemon.artwork}
          alt=""
          width={475}
          height={475}
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </span>
      <strong className="game-card-name">{pokemon.name}</strong>
      <span className="game-card-id">
        {pokemon.number} · {generationLabel(pokemon.generation)}
      </span>
      <span className="game-card-types">
        {pokemon.types.map((type) => (
          <span className="type-badge" key={type}>
            <img src={typeIconUrl(type)} alt="" width={17} height={17} loading="lazy" decoding="async" />
            {t[typeLabelKeys[type]]}
          </span>
        ))}
      </span>
      {revealing && (
        <span className="game-card-votes">
          <strong>{pokemon.votes}</strong>
          <small>{t.votes}</small>
        </span>
      )}
    </button>
  );
}

function BarChart({ rows }: { rows: Array<{ label: string; votes: number; sprite?: string }> }) {
  const max = Math.max(1, ...rows.map((row) => row.votes));
  return (
    <div className="bar-chart">
      {rows.map((row) => (
        <div className="bar-row" key={row.label}>
          <div className="bar-label">
            {row.sprite && <img src={row.sprite} alt="" width={48} height={48} loading="lazy" decoding="async" />}
            <span>{row.label}</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(row.votes / max) * 100}%` }} />
          </div>
          <strong>{row.votes}</strong>
        </div>
      ))}
    </div>
  );
}

function StatsSkeleton({ t }: { t: TranslationMessages }) {
  return (
    <div className="stats-skeleton" aria-label={t.loading}>
      <div className="metrics-grid">
        {[t.declarations, t.uniquePokemon, t.pokedexCovered].map((label) => (
          <article className="metric-card metric-card--skeleton" key={label}>
            <span>{label}</span>
            <strong>---</strong>
          </article>
        ))}
      </div>
      {[t.topTen, t.byGeneration, t.byType, t.fullRanking].map((label) => (
        <section className="stats-section stats-section--skeleton" key={label}>
          <h2>{label}</h2>
          <div className="skeleton-bars" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Pagination({
  page,
  pageCount,
  onPageChange,
  t,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  t: TranslationMessages;
}) {
  if (pageCount <= 1) return null;
  return (
    <div className="modal-pagination">
      <button
        className="secondary-button pagination-icon-btn"
        onClick={() => onPageChange(1)}
        disabled={page === 1}
        aria-label={t.firstPage}
      >
        <ChevronsLeft size={18} />
      </button>
      <button className="secondary-button" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}>
        <ChevronLeft size={18} />
        {t.previous}
      </button>
      <span className="modal-pagination-total">
        {page} / {pageCount}
      </span>
      <button
        className="secondary-button"
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
      >
        {t.next}
        <ChevronRight size={18} />
      </button>
      <button
        className="secondary-button pagination-icon-btn"
        onClick={() => onPageChange(pageCount)}
        disabled={page === pageCount}
        aria-label={t.lastPage}
      >
        <ChevronsRight size={18} />
      </button>
    </div>
  );
}

function PokemonModal({
  pokemon,
  mode,
  language,
  t,
  onClose,
}: {
  pokemon: PokemonRow;
  mode: Mode;
  language: Language;
  t: TranslationMessages;
  onClose: () => void;
}) {
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    loadPokemonDeclarations(pokemon.id, mode)
      .then((rows) => {
        if (alive) setDeclarations(rows);
      })
      .catch((loadError: unknown) => {
        if (alive) {
          setDeclarations([]);
          setError(loadError instanceof Error ? loadError.message : t.declarationsLoadError);
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [pokemon.id, mode, t.declarationsLoadError]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <article className="modal">
        <button className="icon-button modal-close" type="button" onClick={onClose} aria-label={t.close}>
          <X size={20} />
        </button>
        <header className="modal-header">
          <img src={pokemon.sprite} alt="" width={84} height={84} loading="lazy" decoding="async" />
          <div>
            <h2>{pokemon.name}</h2>
            <p>
              {pokemon.number} · {pokemon.generationLabel} · {pokemon.votes} {t.fans}
            </p>
          </div>
        </header>
        <div className="declaration-list">
          {loading && <div className="spinner" aria-label={t.loadingDeclarations} />}
          {error && <p className="message warning">{error}</p>}
          {!loading && declarations.length === 0 && <p className="empty-state">{t.noDeclarationsYet}</p>}
          {declarations.map((declaration) => (
            <article className="declaration-item" key={declaration.id}>
              <strong>{declaration.trainerName}</strong>
              <span>{new Date(declaration.createdAt).toLocaleString(language)}</span>
              <p>{declaration.reason}</p>
            </article>
          ))}
        </div>
      </article>
    </div>
  );
}

function PokemonAssetStrip({ className = '' }: { className?: string }) {
  return (
    <div className={`pokemon-asset-strip ${className}`} aria-hidden="true">
      {featuredPokemon.map((pokemon) => (
        <img
          key={pokemon.id}
          src={pixelArtworkUrl(pokemon.id)}
          alt=""
          width={96}
          height={96}
          loading="lazy"
          decoding="async"
        />
      ))}
    </div>
  );
}

function PokemonShowcase({
  pokemon,
  previewPool = [],
  t,
}: {
  pokemon: ShowcasePokemon | null;
  previewPool?: ShowcasePokemon[];
  t: TranslationMessages;
}) {
  const [scanPreview, setScanPreview] = useState<ShowcasePokemon | null>(null);
  const scanPool = useMemo(
    () => (previewPool.length > 0 ? previewPool : featuredPokemon.map(featuredToShowcasePokemon)),
    [previewPool],
  );

  useEffect(() => {
    if (pokemon || prefersReducedMotion()) {
      setScanPreview(null);
      return;
    }

    let timeoutId: number | undefined;
    let cancelled = false;
    let lastId: number | null = null;
    let shownThisCycle = new Set<number>();

    const schedule = (callback: () => void, delay: number) => {
      timeoutId = window.setTimeout(callback, delay);
    };

    const pickNextPokemon = () => {
      const freshPool = scanPool.filter((item) => !shownThisCycle.has(item.id));
      const sourcePool = freshPool.length > 0 ? freshPool : scanPool;
      const nonRepeatingPool = sourcePool.filter((item) => item.id !== lastId);
      const candidates = nonRepeatingPool.length > 0 ? nonRepeatingPool : sourcePool;
      const next = candidates[Math.floor(Math.random() * candidates.length)] ?? null;
      if (!next) return null;
      lastId = next.id;
      shownThisCycle.add(next.id);
      return next;
    };

    const startCycle = () => {
      if (cancelled) return;
      shownThisCycle = new Set<number>();
      let remaining = Math.min(scanPreviewCount, Math.max(scanPool.length, 1));

      const showNext = () => {
        if (cancelled) return;
        if (remaining <= 0) {
          setScanPreview(null);
          schedule(startCycle, scanRestDelayMs);
          return;
        }

        setScanPreview(pickNextPokemon());
        remaining -= 1;
        schedule(showNext, scanStepDelayMs);
      };

      showNext();
    };

    setScanPreview(null);
    schedule(startCycle, scanStartDelayMs);

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [pokemon, scanPool]);

  const active = pokemon ?? scanPreview;
  const state = pokemon ? 'selected' : active ? 'scanning' : 'unknown';

  return (
    <aside className={`pokemon-showcase pokemon-showcase--${state}`} aria-label={active?.name ?? 'Unknown Pokémon'}>
      <div className="showcase-screen-label" aria-hidden="true">
        <span>{t.dexScan}</span>
        <span>{pokemon ? t.ready : '???'}</span>
      </div>
      <div className="showcase-art-stage" aria-hidden="true">
        {active ? (
          <>
            <img
              key={`art-${active.id}`}
              className="showcase-artwork"
              src={active.artwork}
              alt=""
              width={475}
              height={475}
              loading={pokemon ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={pokemon ? 'high' : 'auto'}
            />
            <img
              key={`sprite-${active.id}`}
              className="showcase-sprite"
              src={active.sprite}
              alt=""
              width={96}
              height={96}
              loading="lazy"
              decoding="async"
            />
          </>
        ) : (
          <div className="showcase-unknown">
            <span>?</span>
          </div>
        )}
        {!pokemon && <span className="showcase-scanline" />}
      </div>
      <div className="showcase-dex-card">
        <span>{active?.number ?? '#???'}</span>
        <strong>{active?.name ?? '???'}</strong>
        <small>{active?.generationLabel ?? 'Unknown'}</small>
      </div>
    </aside>
  );
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function PokemonSprite({
  pokemonId,
  name,
  className,
}: {
  pokemonId: number;
  name: string;
  className?: string;
}) {
  return (
    <img
      className={className}
      src={pokemonSpriteUrl(pokemonId)}
      alt={name}
      width={96}
      height={96}
      loading="lazy"
      decoding="async"
    />
  );
}

function Footer({ t }: { t: TranslationMessages }) {
  return (
    <footer className="creator-credits">
      <div className="creator-credits-content">
        <p>© 2026 Favmon</p>
        <p className="legal-disclaimer">{t.legalDisclaimer}</p>
      </div>
      <nav aria-label={t.creatorLinks}>
        <a href={kofiUrl} target="_blank" rel="noopener noreferrer" aria-label="Ko-fi">
          <Coffee size={20} />
        </a>
      </nav>
    </footer>
  );
}

function makePair(pokemon: PokemonRow[]): [PokemonRow, PokemonRow] {
  if (pokemon.length < 2) return [pokemon[0], pokemon[0]];
  const first = pokemon[Math.floor(Math.random() * pokemon.length)];
  let second = pokemon[Math.floor(Math.random() * pokemon.length)];
  while (second.id === first.id) {
    second = pokemon[Math.floor(Math.random() * pokemon.length)];
  }
  return [first, second];
}

function normalizeRoute(pathname: string): Route {
  const path = stripLocalePrefix(pathname);
  if (path === '/game' || path === '/explore' || path === '/pokedex' || path === '/stats') return path;
  return '/';
}

function readMode(): Mode {
  const raw = localStorage.getItem('favorite_pokemon_mode');
  return raw === 'not_favourite' ? 'not_favourite' : 'favourite';
}

function incrementStat(stats: PokemonStat[], declaration: Declaration): PokemonStat[] {
  const index = stats.findIndex((item) => item.pokemonId === declaration.pokemonId);
  if (index === -1) {
    return [
      ...stats,
      {
        pokemonId: declaration.pokemonId,
        pokemonName: declaration.pokemonName,
        fanCount: 1,
      },
    ];
  }
  return stats.map((item, itemIndex) =>
    itemIndex === index
      ? {
          ...item,
          pokemonName: declaration.pokemonName,
          fanCount: item.fanCount + 1,
        }
      : item,
  );
}
