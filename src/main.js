// app.j
const API_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const $ = id => document.getElementById(id);

const elements = {
  mediaPoster: $('media-poster'),
  mediaTitle: $('media-title'),
  mediaOverview: $('media-overview'),
  mediaRating: $('media-rating'),
  mediaYear: $('media-year'),
  mediaType: $('media-type'),
  genre: $('genre'),
  yearFrom: $('year-from'),
  yearTo: $('year-to'),
  applyFilters: $('apply-filters'),
  likeBtn: $('like-btn'),
  dislikeBtn: $('dislike-btn'),
  neutralBtn: $('neutral-btn'),
  randomBtn: $('random-btn'),
  trailerBtn: $('show-trailer'),
  trailerModal: $('trailer-modal'),
  closeTrailer: $('close-trailer'),
  trailerIframe: $('trailer-iframe'),
  trailerTitle: $('trailer-title'),
  themeToggle: $('theme-toggle')
};

let currentMedia = [];
let index = 0;

document.addEventListener('DOMContentLoaded', async () => {
  toggleThemeOnLoad();
  loadGenres();
  elements.applyFilters.addEventListener('click', fetchMedia);
  elements.randomBtn.addEventListener('click', () => randomMedia());
  elements.likeBtn.addEventListener('click', () => addToStorage('favorites'));
  elements.neutralBtn.addEventListener('click', () => addToStorage('watch-later'));
  elements.dislikeBtn.addEventListener('click', nextMedia);
  elements.trailerBtn.addEventListener('click', showTrailer);
  elements.closeTrailer.addEventListener('click', () => {
    elements.trailerModal.style.display = 'none';
    elements.trailerIframe.src = '';
  });
  elements.themeToggle.addEventListener('click', toggleTheme);
  await fetchMedia();
});

function toggleThemeOnLoad() {
  if (localStorage.getItem('theme') === 'dark' ||
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
}

function toggleTheme() {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
}

async function loadGenres() {
  const res = await fetch(`${API_URL}/genre/movie/list?api_key=${API_KEY}&language=es`);
  const data = await res.json();
  elements.genre.innerHTML = '<option value="">Todos</option>';
  data.genres.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = g.name;
    elements.genre.appendChild(opt);
  });
}

async function fetchMedia() {
  let url = `${API_URL}/discover/movie?api_key=${API_KEY}&language=es&sort_by=popularity.desc`;

  const genre = elements.genre.value;
  const yearFrom = elements.yearFrom.value;
  const yearTo = elements.yearTo.value;

  if (genre) url += `&with_genres=${genre}`;
  if (yearFrom) url += `&primary_release_date.gte=${yearFrom}-01-01`;
  if (yearTo) url += `&primary_release_date.lte=${yearTo}-12-31`;

  const res = await fetch(url);
  const data = await res.json();
  currentMedia = data.results;
  index = 0;
  showMedia();
}

function showMedia() {
  const media = currentMedia[index];
  if (!media) return;

  elements.mediaPoster.src = media.poster_path
    ? `https://image.tmdb.org/t/p/w500${media.poster_path}`
    : 'https://via.placeholder.com/300x450?text=No+Image';
  elements.mediaTitle.textContent = media.title;
  elements.mediaOverview.textContent = media.overview || 'Sin sinopsis disponible';
  elements.mediaRating.textContent = `⭐ ${media.vote_average}`;
  elements.mediaYear.textContent = `📅 ${media.release_date?.split('-')[0] || 'N/A'}`;
}

function nextMedia() {
  if (currentMedia.length === 0) return;
  index = (index + 1) % currentMedia.length;
  showMedia();
}

function randomMedia() {
  if (currentMedia.length === 0) return;
  index = Math.floor(Math.random() * currentMedia.length);
  showMedia();
}

function addToStorage(key) {
  const media = currentMedia[index];
  let stored = JSON.parse(localStorage.getItem(key)) || [];
  if (!stored.some(item => item.id === media.id)) {
    stored.push(media);
    localStorage.setItem(key, JSON.stringify(stored));
  }
  nextMedia();
}

async function showTrailer() {
  const media = currentMedia[index];
  const res = await fetch(`${API_URL}/movie/${media.id}/videos?api_key=${API_KEY}`);
  const data = await res.json();
  const trailer = data.results.find(v => v.type === "Trailer" && v.site === "YouTube");
  if (trailer) {
    elements.trailerIframe.src = `https://www.youtube.com/embed/${trailer.key}`;
    elements.trailerTitle.textContent = media.title;
    elements.trailerModal.style.display = 'flex';
  }
}
