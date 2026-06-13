import {
  Ban,
  Coffee,
  Github,
  Instagram,
  Music2,
  Download,
  Trophy,
  Youtube,
  X,
} from 'lucide-react';
import { FormEvent, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  allGenerations,
  fetchPokemonList,
  formatPokemonName,
  generationLabel,
  mergePokemonStats,
  typeIconUrl,
} from './lib/pokemon';
import {
  createBackendDeclaration,
  loadBackendData,
  loadPokemonDeclarations,
} from './lib/backend';
import {
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

type Language = 'en' | 'es';
type Route = '/' | '/game' | '/explore' | '/pokedex' | '/stats';
type SortKey = 'number' | 'name' | 'fans';
type StatusFilter = 'all' | 'revealed' | 'hidden';

const translations = {
  en: {
    appTitle: "Every Pokémon is someone's favourite",
    declare: 'Declare',
    game: 'Game',
    explore: 'Explore',
    pokedex: 'Pokédex',
    stats: 'Stats',
    promo: 'Track your Pokémon card collection with Card Codex (supports both English & Japanese cards)',
    fanDeclaration: 'Fan declaration',
    declarationLead:
      'Add your name, choose the Pokémon you would defend anywhere, and make it official.',
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
    instagramChangeFormMsg:
      'Want to change your declared Pokémon form? Send a message with your trainer name and Pokémon.',
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
    discovered: 'Discovered',
    hiddenShort: 'Hidden',
    statsHeading: 'How the universal declaration is going',
    refresh: 'Refresh',
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
  },
  es: {
    appTitle: 'Cada Pokémon es el favorito de alguien',
    declare: 'Declarar',
    game: 'Juego',
    explore: 'Explorar',
    pokedex: 'Pokédex',
    stats: 'Estadísticas',
    promo: 'Gestiona tu colección de cartas Pokémon con Card Codex',
    fanDeclaration: 'Declaración fan',
    declarationLead:
      'Añade tu nombre, elige el Pokémon que defenderías en cualquier sitio y hazlo oficial.',
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
    instagramChangeFormMsg:
      '¿Quieres cambiar la forma regional de tu Pokémon? Envía un mensaje con tu nombre de entrenador/a y Pokémon.',
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
    discovered: 'Descubiertos',
    hiddenShort: 'Ocultos',
    statsHeading: 'Cómo va la declaración universal',
    refresh: 'Actualizar',
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
  },
} satisfies Record<Language, Record<string, string>>;

const notFavouriteOverrides = {
  en: {
    appTitle: "Every Pokémon is someone's least favourite",
    fanDeclaration: 'Villain declaration',
    declarationLead: 'Add your name, choose the Pokémon you would banish, and make it official.',
    favouritePokemon: 'Least favourite Pokémon',
    reason: 'Why is it not your favourite?',
    reasonHelp: 'Make the case - at least 10 characters',
    reasonPlaceholder: 'This is where grudges become canon.',
    declareButton: 'Condemn Pokémon',
    alreadyDeclared: 'You have already declared your least favourite Pokémon on this device.',
    success: 'Declaration saved. That poor Pokémon.',
    firstFan: 'You are the first official hater of {pokemon} in the world!',
    moreFans: 'There are already {count} haters of {pokemon} like you!',
    journeyContinues: '{count} / 1025 Pokémon sentenced - the reckoning continues...',
    declaredPokemon: 'Your sentenced Pokémon',
    discoveredHeading: 'Pokémon sentenced through villain declarations',
    statsHeading: 'How the universal condemnation is going',
    topTen: 'Top 10 most hated',
    latest: 'Latest 10 villain declarations',
    chose: 'condemned',
    exploreHeading: 'Explore Villain Declarations',
    whosMoreLoved: 'Which Pokémon is more hated?',
    pickTheOne: 'Pick the Pokémon with most haters',
    modeToggle: 'Not My Favourite',
  },
  es: {
    appTitle: 'Cada Pokémon es el menos favorito de alguien',
    fanDeclaration: 'Declaración villana',
    declarationLead: 'Añade tu nombre, elige el Pokémon que desterrarías y hazlo oficial.',
    favouritePokemon: 'Pokémon menos favorito',
    reason: '¿Por qué no es tu favorito?',
    reasonHelp: 'Defiende tu caso - al menos 10 caracteres',
    reasonPlaceholder: 'Aquí las manías se hacen canon.',
    declareButton: 'Sentenciar Pokémon',
    alreadyDeclared: 'Ya declaraste tu Pokémon menos favorito en este dispositivo.',
    success: 'Declaración guardada. Pobre Pokémon.',
    firstFan: '¡Eres el primer hater oficial de {pokemon} en el mundo!',
    moreFans: '¡Ya hay {count} haters de {pokemon} como tú!',
    journeyContinues: '{count} / 1025 Pokémon sentenciados - el juicio continúa...',
    declaredPokemon: 'Tu Pokémon sentenciado',
    discoveredHeading: 'Pokémon sentenciados por declaraciones villanas',
    statsHeading: 'Cómo va la condena universal',
    topTen: 'Top 10 más odiados',
    latest: 'Últimas 10 declaraciones villanas',
    chose: 'condenó',
    exploreHeading: 'Explorar declaraciones villanas',
    whosMoreLoved: '¿Qué Pokémon es más odiado?',
    pickTheOne: 'Elige el Pokémon con más detractores',
    modeToggle: 'No favorito',
  },
} satisfies Record<Language, Partial<Record<keyof typeof translations.en, string>>>;

const typeLabels: Record<PokemonType, string> = {
  normal: 'Normal',
  fighting: 'Fighting',
  flying: 'Flying',
  poison: 'Poison',
  ground: 'Ground',
  rock: 'Rock',
  bug: 'Bug',
  ghost: 'Ghost',
  steel: 'Steel',
  fire: 'Fire',
  water: 'Water',
  grass: 'Grass',
  electric: 'Electric',
  psychic: 'Psychic',
  ice: 'Ice',
  dragon: 'Dragon',
  dark: 'Dark',
  fairy: 'Fairy',
};

function copyFor(language: Language, mode: Mode) {
  return {
    ...translations[language],
    ...(mode === 'not_favourite' ? notFavouriteOverrides[language] : {}),
  };
}

function template(copy: string, values: Record<string, string>): string {
  return copy.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

type CardFormatKey = 'square' | 'vertical' | 'horizontal';
type CardArtStyle = 'official' | 'pixel';

const cardFormats: Record<CardFormatKey, { width: number; height: number; label: string; sub: string }> = {
  square: { width: 1080, height: 1080, label: 'Square (Instagram)', sub: '1080x1080' },
  vertical: { width: 1080, height: 1920, label: 'Story (TikTok)', sub: '1080x1920' },
  horizontal: { width: 1200, height: 630, label: 'Banner (X/Twitter)', sub: '1200x630' },
};

function officialArtworkUrl(pokemonId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
}

function pixelArtworkUrl(pokemonId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
}

function shinyArtworkUrl(url: string, style: CardArtStyle): string {
  if (style === 'pixel') {
    return url.replace('/sprites/pokemon/', '/sprites/pokemon/shiny/');
  }
  return url.replace('/official-artwork/', '/official-artwork/shiny/');
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

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxY: number,
) {
  const words = text.split(/\s+/);
  let line = '';
  for (const word of words) {
    const next = `${line}${word} `;
    if (context.measureText(next).width > maxWidth && line) {
      if (y + lineHeight > maxY) {
        context.fillText(`${line.trimEnd()}...`, x, y);
        return;
      }
      context.fillText(line.trimEnd(), x, y);
      line = `${word} `;
      y += lineHeight;
    } else {
      line = next;
    }
  }
  context.fillText(line.trim(), x, y);
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

function drawImageGlow(context: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
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

  const fontFamily = getComputedStyle(document.body).fontFamily || 'sans-serif';
  const pokemonName = formatPokemonName(declaration.pokemonName);
  const reason = declaration.reason.replace(/\n/g, ' ');
  const baseImageUrl = artStyle === 'pixel'
    ? pixelArtworkUrl(declaration.pokemonId)
    : officialArtworkUrl(declaration.pokemonId);
  const imageUrl = shiny ? shinyArtworkUrl(baseImageUrl, artStyle) : baseImageUrl;
  const pokemonImage = await loadCanvasImage(imageUrl).catch((error) => {
    if (shiny) return loadCanvasImage(baseImageUrl);
    throw error;
  });

  context.fillStyle = '#1a1a2e';
  context.fillRect(0, 0, width, height);
  drawPokeballMark(context, width * 0.85, height * 0.85, Math.min(width, height) * 0.5, 0.05);

  const headerHeight = height * 0.08;
  context.fillStyle = '#cc0000';
  context.fillRect(0, 0, width, headerHeight);
  context.fillStyle = '#fff';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = `${format === 'horizontal' ? 24 : 28}px ${fontFamily}`;
  context.fillText(appTitle, width / 2, headerHeight / 2);

  if (format === 'horizontal') {
    const imageColumnWidth = width * 0.45;
    const imageSize = Math.min(imageColumnWidth, height - headerHeight) * 0.8;
    const imageX = imageColumnWidth / 2 + 40;
    const imageY = headerHeight + (height - headerHeight) / 2;
    drawImageGlow(context, imageX, imageY, imageSize * 0.6);
    context.drawImage(pokemonImage, imageX - imageSize / 2, imageY - imageSize / 2, imageSize, imageSize);

    const textX = imageColumnWidth + 20;
    const textWidth = width - textX - 60;
    const nameY = headerHeight + (height - headerHeight) / 2 - 50;
    context.textAlign = 'left';
    context.textBaseline = 'alphabetic';
    context.font = `bold 64px ${fontFamily}`;
    context.fillStyle = '#fff';
    context.fillText(pokemonName, textX, nameY);
    context.fillStyle = '#cc0000';
    context.fillRect(textX, nameY + 15, 80, 4);
    context.font = `32px ${fontFamily}`;
    context.fillStyle = '#ffcb05';
    context.fillText(`✦ ${declaration.trainerName}`, textX, nameY + 65);
    if (reason) {
      context.font = `italic ${reason.length > 200 ? 20 : 26}px ${fontFamily}`;
      context.fillStyle = 'rgba(255, 255, 255, 0.85)';
      drawWrappedText(context, `"${reason}"`, textX, nameY + 115, textWidth, 39, height - 55);
    }
  } else if (format === 'square') {
    const imageSize = (height - headerHeight - 60) * 0.5;
    const imageX = width / 2;
    const imageY = headerHeight + imageSize / 2 + 70;
    const drawnSize = imageSize * 0.9;
    drawImageGlow(context, imageX, imageY, drawnSize * 0.6);
    context.drawImage(pokemonImage, imageX - drawnSize / 2, imageY - drawnSize / 2, drawnSize, drawnSize);
    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';
    const nameY = headerHeight + imageSize + 110;
    context.font = `bold 60px ${fontFamily}`;
    context.fillStyle = '#fff';
    context.fillText(pokemonName, imageX, nameY);
    context.font = `32px ${fontFamily}`;
    context.fillStyle = '#ffcb05';
    context.fillText(`✦ ${declaration.trainerName}`, imageX, nameY + 60);
    if (reason) {
      context.font = `italic ${reason.length > 200 ? 22 : 26}px ${fontFamily}`;
      context.fillStyle = 'rgba(255, 255, 255, 0.85)';
      drawWrappedText(context, `"${reason}"`, imageX, nameY + 120, width * 0.8, 39, height - 55);
    }
  } else {
    const imageX = width / 2;
    const imageSize = width * 0.55;
    const contentHeight = height - headerHeight - 60;
    const reservedTextHeight = imageSize + 240;
    const imageY = headerHeight + (contentHeight - reservedTextHeight) / 2 + imageSize / 2;
    drawImageGlow(context, imageX, imageY, imageSize * 0.6);
    context.drawImage(pokemonImage, imageX - imageSize / 2, imageY - imageSize / 2, imageSize, imageSize);
    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';
    const nameY = imageY + imageSize / 2 + 80;
    context.font = `bold 60px ${fontFamily}`;
    context.fillStyle = '#fff';
    context.fillText(pokemonName, imageX, nameY);
    context.font = `32px ${fontFamily}`;
    context.fillStyle = '#ffcb05';
    context.fillText(`✦ ${declaration.trainerName}`, imageX, nameY + 80);
    if (reason) {
      context.font = `italic ${reason.length > 300 ? 22 : 26}px ${fontFamily}`;
      context.fillStyle = 'rgba(255, 255, 255, 0.85)';
      drawWrappedText(context, `"${reason}"`, imageX, nameY + 160, width * 0.85, 39, height - 55);
    }
  }

  context.font = `18px ${fontFamily}`;
  context.fillStyle = 'rgba(255, 203, 5, 0.55)';
  context.textAlign = 'center';
  context.textBaseline = 'bottom';
  context.fillText('favipokemon.vercel.app', width / 2, height - 30);
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
  const [route, setRoute] = useState<Route>(() => normalizeRoute(window.location.pathname));
  const [language, setLanguage] = useState<Language>(() =>
    window.location.pathname.startsWith('/es') ? 'es' : 'en',
  );
  const [mode, setMode] = useState<Mode>(() => readMode());
  const [pokemon, setPokemon] = useState<PokemonRow[]>([]);
  const [stats, setStats] = useState<PokemonStat[]>([]);
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [pokemonLoading, setPokemonLoading] = useState(true);
  const [backendLoading, setBackendLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [backendError, setBackendError] = useState('');
  const [promoVisible, setPromoVisible] = useState(true);
  const t = copyFor(language, mode);
  const loading = pokemonLoading || backendLoading;

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
          setLoadError(error instanceof Error ? error.message : 'Could not load PokeAPI data.');
        }
      })
      .finally(() => {
        if (alive) setPokemonLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

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
          setBackendError(error instanceof Error ? error.message : 'Could not load Neon data.');
        }
      })
      .finally(() => {
        if (alive) setBackendLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [mode]);

  useEffect(() => {
    const onPop = () => setRoute(normalizeRoute(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.mode = mode;
    localStorage.setItem('favorite_pokemon_mode', mode);
  }, [mode]);

  const displayPokemon = useMemo(() => mergePokemonStats(pokemon, stats), [pokemon, stats]);

  function handleDeclarationSubmitted(declaration: Declaration) {
    setDeclarations((current) => [declaration, ...current].slice(0, 20));
    setStats((current) => incrementStat(current, declaration));
  }

  function navigate(event: MouseEvent<HTMLAnchorElement>, nextRoute: Route) {
    event.preventDefault();
    window.history.pushState({}, '', nextRoute);
    setRoute(nextRoute);
  }

  function toggleLanguage() {
    setLanguage((current) => (current === 'en' ? 'es' : 'en'));
  }

  function toggleMode() {
    setMode((current) => (current === 'favourite' ? 'not_favourite' : 'favourite'));
  }

  return (
    <>
      <header className={promoVisible ? 'site-header' : 'site-header site-header--promo-hidden'}>
        <nav className="navbar" aria-label="Main navigation">
          <a className="brand" href="/" onClick={(event) => navigate(event, '/')}>
            <span className="brand-mark" aria-hidden="true" />
            <span>{t.appTitle}</span>
          </a>
          <div className="navbar-right">
            <div className="nav-links">
              <NavLink route="/" activeRoute={route} onNavigate={navigate}>
                {t.declare}
              </NavLink>
              <NavLink route="/game" activeRoute={route} onNavigate={navigate}>
                {t.game}
              </NavLink>
              <NavLink route="/explore" activeRoute={route} onNavigate={navigate}>
                {t.explore}
              </NavLink>
              <NavLink route="/pokedex" activeRoute={route} onNavigate={navigate}>
                {t.pokedex}
              </NavLink>
              <NavLink route="/stats" activeRoute={route} onNavigate={navigate}>
                {t.stats}
              </NavLink>
            </div>
            <div className="navbar-actions">
              <button
                type="button"
                className={`mode-toggle mode-toggle--${mode}`}
                onClick={toggleMode}
              >
                {mode === 'favourite' ? <Trophy size={16} /> : <Ban size={16} />}
                <span className="mode-toggle-text">{t.modeToggle}</span>
              </button>
              <a className="kofi-nav-button" href="https://ko-fi.com/mixel34">
                <Coffee size={16} />
                <span className="kofi-text">Ko-fi</span>
              </a>
              <a className="discord-nav-button" href="https://discord.gg/9qqUxfeFS5">
                Discord
              </a>
              <button type="button" className="language-toggle" onClick={toggleLanguage}>
                {language === 'en' ? 'ES' : 'EN'}
              </button>
            </div>
          </div>
        </nav>
        {promoVisible && (
          <div className="promo-banner">
            <a href="https://cardcodex.com/pokemon/">{t.promo}</a>
            <button
              type="button"
              className="promo-banner-close"
              aria-label="Close promotion"
              onClick={() => setPromoVisible(false)}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </header>

      <main className="app-shell">
        {loadError && <p className="message warning">Could not load PokéAPI data. {loadError}</p>}
        {backendError && <p className="message warning">Could not load Neon declarations. {backendError}</p>}
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
        {route === '/game' && <GamePage pokemon={displayPokemon} mode={mode} t={t} />}
        {route === '/explore' && <ExplorePage declarations={declarations} t={t} />}
        {route === '/pokedex' && (
          <PokedexPage pokemon={displayPokemon} mode={mode} loading={loading} t={t} />
        )}
        {route === '/stats' && (
          <StatsPage pokemon={displayPokemon} declarations={declarations} loading={loading} t={t} />
        )}
      </main>

      {route !== '/game' && <Footer />}
    </>
  );
}

function NavLink({
  route,
  activeRoute,
  onNavigate,
  children,
}: {
  route: Route;
  activeRoute: Route;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, route: Route) => void;
  children: string;
}) {
  return (
    <a
      href={route}
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
  t: Record<string, string>;
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

  const heroPokemon = useMemo(() => {
    if (selected) return selected;
    if (!submittedSummary) return null;
    return pokemon.find((row) => row.id === submittedSummary.declaration.pokemonId) ?? null;
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
      setError(submitError instanceof Error ? submitError.message : 'Could not save declaration.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page">
      <div className="declaration-hero">
        <div>
          <p className="eyebrow">{t.fanDeclaration}</p>
          <h1>{t.appTitle}</h1>
          <p>{t.declarationLead}</p>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          {heroPokemon ? <img src={heroPokemon.sprite} alt="" /> : <span>?</span>}
        </div>
      </div>

      {alreadyDeclared ? (
        <DeclarationSuccessPanel summary={submittedSummary} t={t} />
      ) : (
        <form className="declaration-form" onSubmit={submit}>
          {error && <p className="message error">{error}</p>}
          <label className="field">
            <span>{t.trainerName}</span>
            <input
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
                      <img src={row.sprite} alt="" />
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
                <img src={selected.sprite} alt="" />
                <div>
                  <strong>{selected.name}</strong>
                  <small>
                    {selected.number} · {selected.generationLabel}
                  </small>
                </div>
              </button>
            )}
          </div>

          <label className="field">
            <span>{t.reason}</span>
            <small>{t.reasonHelp}</small>
            <textarea
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
            {submitting ? 'Saving...' : t.declareButton}
          </button>
        </form>
      )}

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

function DeclarationSuccessPanel({
  summary,
  t,
}: {
  summary: LocalDeclarationSummary | null;
  t: Record<string, string>;
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
    <div className="declaration-form declaration-success-panel">
      <a className="success-kofi-link" href="https://ko-fi.com/mixel34" target="_blank" rel="noopener noreferrer">
        <Coffee size={16} />
        {t.kofiSupport}
      </a>
      <h2>{t.success}</h2>
      {declaration ? (
        <>
          <PokemonSprite className="success-pokemon" pokemonId={declaration.pokemonId} name={pokemonName} />
          <p className="message success">{fanMessage}</p>
          <p className="success-progress">
            {template(t.journeyContinues, { count: String(summary.revealedCount) })}
          </p>
          <div className="success-declaration">
            <span>{t.declaredPokemon}</span>
            <strong>{pokemonName}</strong>
            <p>"{declaration.reason}"</p>
          </div>
          <p className="success-note">{t.instagramChangeFormMsg}</p>
          <PokemonCardDownloader declaration={declaration} appTitle={t.appTitle} />
        </>
      ) : (
        <p className="message warning">{fanMessage}</p>
      )}
    </div>
  );
}

function PokemonCardDownloader({ declaration, appTitle }: { declaration: Declaration; appTitle: string }) {
  const [artStyle, setArtStyle] = useState<CardArtStyle>('official');
  const [format, setFormat] = useState<CardFormatKey>('vertical');
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
          await generatePokemonCardCanvas(key, declaration, artStyle, shiny, appTitle),
        ] as const),
      );
      setCanvases(Object.fromEntries(entries));
    } catch (cardError) {
      setError(cardError instanceof Error ? cardError.message : 'Could not generate the card. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [appTitle, artStyle, declaration, shiny]);

  useEffect(() => {
    void generateCards();
  }, [generateCards]);

  useEffect(() => {
    const sourceCanvas = canvases[format];
    const target = previewRef.current;
    if (!sourceCanvas || !target) return;

    target.innerHTML = '';
    const previewCanvas = document.createElement('canvas');
    const previewWidth = format === 'horizontal' ? 520 : 360;
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
    <section className="share-card-section" aria-label="Download your Pokemon card">
      <h3 className="share-card-title">🎉 Download your Pokémon card!</h3>
      <div className="share-card-controls">
        <div className="share-art-toggle" role="group" aria-label="Card art style">
          <button
            type="button"
            className={artStyle === 'official' ? 'active' : ''}
            onClick={() => setArtStyle('official')}
          >
            Official Art
          </button>
          <button
            type="button"
            className={artStyle === 'pixel' ? 'active' : ''}
            onClick={() => setArtStyle('pixel')}
          >
            Pixel Art
          </button>
        </div>
        <label className="share-shiny-check">
          <input
            type="checkbox"
            checked={shiny}
            onChange={(event) => setShiny(event.target.checked)}
          />
          <span className="share-shiny-box" aria-hidden="true" />
          <span>Shiny</span>
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
              <span className="share-dl-label">{item.label}</span>
              <span className="share-dl-sub">{downloaded[key] ? '✓ Downloaded!' : item.sub}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="share-preview-area">
        {loading && <div className="spinner" aria-label="Generating cards..." />}
        {error && <p className="message error">{error}</p>}
        <div ref={previewRef} className="share-preview-canvas" />
      </div>
    </section>
  );
}

function ExplorePage({
  declarations,
  t,
}: {
  declarations: Declaration[];
  t: Record<string, string>;
}) {
  return (
    <section className="page">
      <div className="explore-container" aria-label={t.exploreHeading}>
        {declarations.length === 0 && (
          <div className="empty-explore">
            <p>{t.noDeclarations}</p>
          </div>
        )}
        {declarations.map((declaration) => (
          <article className="reel-item" key={declaration.id}>
            <div className="reel-content">
              <PokemonSprite
                className="reel-pokemon-image"
                pokemonId={declaration.pokemonId}
                name={declaration.pokemonName}
              />
              <h2 className="reel-trainer">{declaration.trainerName}</h2>
              <p className="reel-pokemon-name">{declaration.pokemonName}</p>
              <p className="reel-reason">"{declaration.reason}"</p>
              <p className="reel-meta">{new Date(declaration.createdAt).toLocaleDateString()}</p>
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
  loading,
  t,
}: {
  pokemon: PokemonRow[];
  mode: Mode;
  loading: boolean;
  t: Record<string, string>;
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

  const pageSize = 100;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section className="page">
      <div className="page-heading">
        <p className="eyebrow">{t.communityPokedex}</p>
        <h1>{t.discoveredHeading}</h1>
      </div>
      <section className="progress-panel">
        <div className="progress-copy">
          <span>
            {discovered} / {total} Pokémon {t.discovered.toLowerCase()}
          </span>
          <strong>{progress.toFixed(1)}%</strong>
        </div>
        <div className="progress-track">
          <div className="progress-fill high" style={{ width: `${progress}%` }} />
        </div>
      </section>

      <section className="pokedex-tools">
        <label className="pokedex-search">
          <span>{t.searchPokedex}</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.searchPlaceholder}
          />
        </label>
        <label className="pokedex-select">
          <span>{t.sortBy}</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
            <option value="number">Number</option>
            <option value="name">Name</option>
            <option value="fans">Most fans</option>
          </select>
        </label>
        <label className="pokedex-select">
          <span>{t.generation}</span>
          <select
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
          {t.showing} {filtered.length} of {total}
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
              <img src={row.sprite} alt="" />
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
              <img src={row.sprite} alt="" />
              <strong>{row.name}</strong>
              <span className="list-status">{row.votes} fans</span>
            </button>
          ))}
        </div>
      )}

      <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />

      {modalPokemon && (
        <PokemonModal
          pokemon={modalPokemon}
          mode={mode}
          onClose={() => setModalPokemon(null)}
        />
      )}
    </section>
  );
}

function StatsPage({
  pokemon,
  declarations,
  loading,
  t,
}: {
  pokemon: PokemonRow[];
  declarations: Declaration[];
  loading: boolean;
  t: Record<string, string>;
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

  const typeRows = Object.keys(typeLabels).map((type) => ({
    label: typeLabels[type as PokemonType],
    votes: pokemon
      .filter((row) => row.types.includes(type as PokemonType))
      .reduce((sum, row) => sum + row.votes, 0),
  }));

  return (
    <section className="page">
      <div className="page-heading split-heading">
        <div>
          <p className="eyebrow">{t.stats}</p>
          <h1>{t.statsHeading}</h1>
        </div>
        <button className="secondary-button" type="button" onClick={refresh} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : t.refresh}
        </button>
      </div>

      {loading && <div className="spinner" aria-label={t.loading} />}
      {!loading && (
        <>
          <div className="metrics-grid">
            <article className="metric-card">
              <span>{t.declarations}</span>
              <strong>{totalVotes.toLocaleString()}</strong>
            </article>
            <article className="metric-card">
              <span>{t.uniquePokemon}</span>
              <strong>{unique.toLocaleString()}</strong>
            </article>
            <article className="metric-card">
              <span>{t.pokedexCovered}</span>
              <strong>{coverage.toFixed(1)}%</strong>
            </article>
          </div>

          <section className="stats-section">
            <h2>{t.topTen}</h2>
            <BarChart rows={sorted.slice(0, 10).map((row) => ({ ...row, label: row.name }))} />
          </section>

          <section className="stats-section">
            <h2 onClick={() => setExpandedGeneration((value) => !value)}>
              By Generation <span>{expandedGeneration ? '▲' : '▼'}</span>
            </h2>
            {expandedGeneration && (
              <BarChart rows={generationRows.sort((a, b) => b.votes - a.votes)} />
            )}
          </section>

          <section className="stats-section">
            <h2 onClick={() => setExpandedType((value) => !value)}>
              By Type <span>{expandedType ? '▲' : '▼'}</span>
            </h2>
            {expandedType && <BarChart rows={typeRows.sort((a, b) => b.votes - a.votes).slice(0, 12)} />}
          </section>

          <section className="stats-section">
            <h2>{t.fullRanking}</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Pokémon</th>
                    <th>Votes</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.slice(0, 25).map((row, index) => (
                    <tr key={row.id}>
                      <td>#{index + 1}</td>
                      <td>
                        <span className="table-pokemon">
                          <img src={row.sprite} alt="" />
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

          <section className="stats-section">
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

function GamePage({ pokemon, mode, t }: { pokemon: PokemonRow[]; mode: Mode; t: Record<string, string> }) {
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

  if (!pair) {
    return (
      <section className="game-page">
        <a className="game-exit-btn" href="/" aria-label="Exit game">
          ×
        </a>
        <div className="game-loading">
          <div className="spinner" />
          <span>{t.loading}</span>
        </div>
      </section>
    );
  }

  return (
    <section className="game-page">
      <a className="game-exit-btn" href="/" aria-label="Exit game">
        ×
      </a>
      <div className="game-content-wrapper">
        <header className="game-header">
          <h1 className="game-title">{t.whosMoreLoved}</h1>
          <p className="game-subtitle">{t.pickTheOne}</p>
          <div className="game-streak">
            <Trophy size={18} />
            <span>{t.streak}:</span>
            <strong>{streak}</strong>
          </div>
        </header>
        <div className="game-arena">
          <GameCard
            pokemon={pair[0]}
            selected={selectedId === pair[0].id}
            revealing={revealing}
            otherVotes={pair[1].votes}
            onChoose={choose}
            t={t}
          />
          <div className="game-vs">VS</div>
          <GameCard
            pokemon={pair[1]}
            selected={selectedId === pair[1].id}
            revealing={revealing}
            otherVotes={pair[0].votes}
            onChoose={choose}
            t={t}
          />
        </div>
        <footer className="game-footer">
          <a className="game-kofi-link" href="https://ko-fi.com/mixel34">
            <Coffee size={16} />
            {t.support}
          </a>
          <p className="game-disclaimer">Data based on declarations stored in our Neon database</p>
        </footer>
      </div>
      {gameOver && (
        <div className="game-over">
          <div className="game-over-card">
            <p className="game-over-title">{t.gameOver}</p>
            <strong className="game-over-streak">{streak}</strong>
            <p className="game-over-message">{streak > 4 ? 'Legendary.' : 'Nice try!'}</p>
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
  t: Record<string, string>;
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
      <img className="game-card-artwork" src={pokemon.artwork} alt="" />
      <strong className="game-card-name">{pokemon.name}</strong>
      <span className="game-card-id">
        {pokemon.number} · {generationLabel(pokemon.generation)}
      </span>
      <span className="game-card-types">
        {pokemon.types.map((type) => (
          <span className="type-badge" key={type}>
            <img src={typeIconUrl(type)} alt="" />
            {typeLabels[type]}
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
            {row.sprite && <img src={row.sprite} alt="" />}
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

function Pagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;
  return (
    <div className="modal-pagination">
      <button className="secondary-button pagination-icon-btn" onClick={() => onPageChange(1)} disabled={page === 1}>
        ⇤
      </button>
      <button className="secondary-button" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}>
        Previous
      </button>
      <span className="modal-pagination-total">
        {page} / {pageCount}
      </span>
      <button
        className="secondary-button"
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
      >
        Next
      </button>
      <button
        className="secondary-button pagination-icon-btn"
        onClick={() => onPageChange(pageCount)}
        disabled={page === pageCount}
      >
        ⇥
      </button>
    </div>
  );
}

function PokemonModal({
  pokemon,
  mode,
  onClose,
}: {
  pokemon: PokemonRow;
  mode: Mode;
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
          setError(loadError instanceof Error ? loadError.message : 'Could not load declarations.');
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [pokemon.id, mode]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <article className="modal">
        <button className="icon-button modal-close" type="button" onClick={onClose} aria-label="Close">
          ×
        </button>
        <header className="modal-header">
          <img src={pokemon.sprite} alt="" />
          <div>
            <h2>{pokemon.name}</h2>
            <p>
              {pokemon.number} · {pokemon.generationLabel} · {pokemon.votes} fans
            </p>
          </div>
        </header>
        <div className="declaration-list">
          {loading && <div className="spinner" aria-label="Loading declarations" />}
          {error && <p className="message warning">{error}</p>}
          {!loading && declarations.length === 0 && <p className="empty-state">No declarations yet.</p>}
          {declarations.map((declaration) => (
            <article className="declaration-item" key={declaration.id}>
              <strong>{declaration.trainerName}</strong>
              <span>{new Date(declaration.createdAt).toLocaleString()}</span>
              <p>{declaration.reason}</p>
            </article>
          ))}
        </div>
      </article>
    </div>
  );
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
      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`}
      alt={name}
    />
  );
}

function Footer() {
  return (
    <footer className="creator-credits">
      <div className="creator-credits-content">
        <p>© 2026 Mixel</p>
        <p className="legal-disclaimer">
          This site is not affiliated with or endorsed by Nintendo or The Pokémon Company. Pokémon
          and all related names are trademarks of Nintendo/Creatures Inc./GAME FREAK Inc.
        </p>
      </div>
      <nav aria-label="Creator links">
        <a href="https://instagram.com/myfav_pokepick" aria-label="Instagram">
          <Instagram size={20} />
        </a>
        <a href="https://www.youtube.com/@Mixel34" aria-label="YouTube">
          <Youtube size={20} />
        </a>
        <a href="https://tiktok.com/@my_fav_pokepick" aria-label="TikTok">
          <Music2 size={20} />
        </a>
        <a href="https://github.com/mixel34p" aria-label="GitHub">
          <Github size={20} />
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
  const path = pathname.startsWith('/es') ? pathname.slice(3) || '/' : pathname;
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
