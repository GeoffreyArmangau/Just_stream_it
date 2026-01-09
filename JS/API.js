const API_URL = 'http://localhost:8000/api/v1/titles/';


// Fonction pour charger tous les genres et les ajouter aux selects
async function chargerTousLesGenres() {
  try {
    let url = 'http://localhost:8000/api/v1/genres';
    let genres = [];
    while (url) {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Erreur réseau');
      const data = await response.json();
      genres = genres.concat(data.results || data.genres || []);
      url = data.next;
    }
    // Récupère les selects existants
    const select1 = document.getElementById('film-selection-1');
    const select2 = document.getElementById('film-selection-2');
    // Vide les listes avant d'ajouter les options
    select1.innerHTML = '<option value="">-- Choisir un genre --</option>';
    select2.innerHTML = '<option value="">-- Choisir un genre --</option>';
    // Ajoute une option pour chaque genre
    genres.forEach(genre => {
      const option = document.createElement('option');
      option.value = genre.name || genre;
    option.textContent = genre.name || genre;
      select1.appendChild(option);
      select2.appendChild(option.cloneNode(true));
    });
  } catch (error) {
    console.error('Erreur lors de la récupération :', error);
  }
}

// Appel automatique au chargement de tous les genres
document.addEventListener('DOMContentLoaded', chargerTousLesGenres);



function addGenreListener(selectId, h1Id, gridSelector) {
    const select = document.getElementById(selectId);
    const h1 = document.getElementById(h1Id);
    // Nouvelle structure : le select et le h1 sont dans un div, la grid est le sibling de ce div
    const grid = select.closest('section').querySelector('.film-grid');
  select.addEventListener('change', async function() {
      if (select.value) {
          h1.textContent = select.options[select.selectedIndex].textContent;
          h1.setAttribute('data-genre', select.value);
          if (grid && grid.classList.contains('film-grid')) {
              await afficherFilmsParGenre(select.value, grid);
          }
      } else {
          h1.textContent = "Autres";
          h1.setAttribute('data-genre', '');
          if (grid && grid.classList.contains('film-grid')) {
              grid.innerHTML = '';
          }
      }
  });
}

addGenreListener('film-selection-1', 'autres-1');
addGenreListener('film-selection-2', 'autres-2');


async function afficherMeilleurFilm() {
    try {
        // Sélectionne la section du meilleur film
        const section = document.querySelector('section');
        const img = section.querySelector('.square-best-film img');
        const titre = section.querySelector('.best-film-txt h1');
        const synopsis = section.querySelector('.best-film-txt .best-film-content');
        const detailsBtn = section.querySelector('.right-layout a');

        let url = API_URL;
        let bestFilm = null;
        let bestScore = -Infinity;
        let pageCount = 0;
        const maxPages = 50;
        // Parcourt toutes les pages pour trouver le meilleur film
        while (url && pageCount < maxPages) {
            const response = await fetch(url);
            const data = await response.json();
            (data.results || []).forEach(film => {
                const score = parseFloat(film.imdb_score);
                if (!isNaN(score) && score > bestScore) {
                    bestScore = score;
                    bestFilm = film;
                }
            });
            url = data.next;
            pageCount++;
        }
        if (!bestFilm) {
            img.src = '';
            titre.textContent = 'Aucun film trouvé';
            synopsis.textContent = '';
            detailsBtn.href = '#';
            return;
        }
        // Récupère le synopsis via l'API détail si possible
        let description = '';
        try {
            const detailResp = await fetch(bestFilm.url);
            if (detailResp.ok) {
                const detailData = await detailResp.json();
                description = detailData.long_description || detailData.description || '';
            }
        } catch {}
        img.src = bestFilm.image_url;
        img.alt = bestFilm.title;
        titre.textContent = bestFilm.title;
        synopsis.textContent = description || bestFilm.title;
        detailsBtn.href = '#';
        detailsBtn.setAttribute('data-film-id', bestFilm.id);
        detailsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            afficherModalFilm(bestFilm.id);
        });
    } catch (error) {
        console.error('Erreur chargement meilleur film:', error);
    }
}


// Fonction pour afficher les films d'un genre donné dans la grid correspondante
async function afficherFilmsParGenre(genre, grid) {
    try {
        let url = `${API_URL}?genre=${encodeURIComponent(genre)}`;
        let films = [];
        let pageCount = 0;
        const maxPages = 10;
        while (url && pageCount < maxPages) {
            const response = await fetch(url);
            const data = await response.json();
            films = films.concat(data.results || []);
            url = data.next;
            pageCount++;
        }
        grid.innerHTML = '';
        if (!films.length) {
            grid.innerHTML = `<p>Aucun film trouvé pour ce genre.</p>`;
            return;
        }
        films.forEach(movie => {
            const filmDiv = document.createElement('div');
            filmDiv.className = 'film';
            filmDiv.innerHTML = `
                <img src="${movie.image_url}" alt="${movie.title}" onerror="this.src='../images/image-not-found.png'">
                <div class="hover">
                    <h3>${movie.title}</h3>
                    <div class="right-layout">
                        <a href="#" class="button" data-film-id="${movie.id}">Détails</a>
                    </div>
                </div>
            `;
            grid.appendChild(filmDiv);
        });
    } catch (error) {
        console.error(`Erreur chargement films pour le genre ${genre}:`, error);
    }
}

// Fonction pour remplir toutes les sections par genre
async function afficherToutesLesSectionsParGenre() {
    // Sélectionne tous les h1[data-genre] et leur .film-grid suivant
    document.querySelectorAll('h1[data-genre]').forEach(async h1 => {
        const genre = h1.getAttribute('data-genre');
        // Cherche la .film-grid qui suit ce h1
        let grid = h1.nextElementSibling;
        if (grid && grid.classList.contains('film-grid')) {
            await afficherFilmsParGenre(genre, grid);
        }
    });
}


// Fonction pour afficher les films les mieux notés dans la section dédiée
async function afficherMeilleursFilms() {
    try {
        // Sélectionne la section "Films les mieux notés"
        const section = document.querySelector('h1#best-rated-film');
        if (!section) return;
        const grid = section.nextElementSibling;
        if (!grid || !grid.classList.contains('film-grid')) return;
        grid.innerHTML = '';
        let url = API_URL;
        let films = [];
        let pageCount = 0;
        const maxPages = 50;
        while (url && pageCount < maxPages) {
            const response = await fetch(url);
            const data = await response.json();
            // Filtre les films avec une note > 7
            const pageFilms = (data.results || []).filter(film => {
                const score = parseFloat(film.imdb_score);
                return !isNaN(score) && score > 7;
            });
            films = films.concat(pageFilms);
            url = data.next;
            pageCount++;
        }
        if (!films.length) {
            grid.innerHTML = `<p>Aucun film trouvé.</p>`;
            return;
        }
        films.sort((a, b) => parseFloat(b.imdb_score) - parseFloat(a.imdb_score));
        films.forEach(movie => {
            const filmDiv = document.createElement('div');
            filmDiv.className = 'film';
            filmDiv.innerHTML = `
                <img src="${movie.image_url}" alt="${movie.title}" onerror="this.src='../images/image-not-found.png'">
                <div class="hover">
                    <h3>${movie.title}</h3>
                    <div class="right-layout">
                        <a href="#" class="button" data-film-id="${movie.id}">Détails</a>
                    </div>
                </div>
            `;
            grid.appendChild(filmDiv);
        });
    } catch (error) {
        console.error('Erreur chargement films:', error);
    }
}


// Fonction pour afficher le modal avec les infos du film
async function afficherModalFilm(filmId) {
    const modal = document.getElementById('modal-detail');
    if (!modal) return;
    modal.style.display = 'block';
    const titre = modal.querySelector('.modal-film-title');
    const infos = modal.querySelector('.modal-film-infos');
    const synopsis = modal.querySelector('.modal-film-synopsis');
    const distribution = modal.querySelector('.modal-film-distribution');
    const realisation = modal.querySelector('.realisation');
    const image = modal.querySelector('.modal-film-image');
    titre.textContent = '';
    infos.textContent = '';
    synopsis.textContent = '';
    distribution.textContent = '';
    realisation.textContent = '';
    image.src = '';
    image.alt = '';
    const url = `http://localhost:8000/api/v1/titles/${filmId}`;
    try {
        const response = await fetch(url);
        const film = await response.json();
        titre.textContent = film.title;
        infos.innerHTML =
            `Année : ${film.year || 'N/A'}<br>` +
            `Genres : ${(film.genres || []).join(', ')}<br>` +
            `Durée : ${film.duration ? film.duration + ' minutes' : 'N/A'}<br>` +
            `IMDB score : ${film.imdb_score ? film.imdb_score + '/10' : 'N/A'}<br>` +
            (film.worldwide_gross_income ? `Recettes au box-office : ${film.worldwide_gross_income}<br>` : '');
        realisation.textContent = film.directors ? `${(film.directors || []).join(', ')}` : '';
        synopsis.textContent = film.long_description || film.description || '';
        distribution.textContent = film.actors ? `${(film.actors || []).join(', ')}` : '';
        image.src = film.image_url || '';
        image.alt = film.title;
    } catch (e) {
        titre.textContent = 'Film introuvable';
        infos.textContent = '';
        synopsis.textContent = '';
        distribution.textContent = '';
        realisation.textContent = '';
        image.src = '';
        image.alt = '';
    }
}

// Intercepte le clic sur tous les boutons Détails
function activerModalsFilms() {
    document.querySelectorAll('a.button[data-film-id]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const filmId = btn.getAttribute('data-film-id');
            if (filmId) afficherModalFilm(filmId);
        });
    });
    // Ajoute le bouton fermer
    const closeBtn = document.getElementById('close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            document.getElementById('modal-detail').style.display = 'none';
        });
    }
    // Ajoute aussi la croix
    const crossBtn = document.querySelector('#modal-detail .close-button');
    if (crossBtn) {
        crossBtn.addEventListener('click', function() {
            document.getElementById('modal-detail').style.display = 'none';
        });
    }
}


function ajouterDataFilmIdDansGrilles() {
    document.querySelectorAll('.film-grid .film a.button').forEach(a => {
        const href = a.getAttribute('href');
        const match = href && href.match(/id=(\d+)/);
        if (match) {
            a.setAttribute('data-film-id', match[1]);
        }
    });
}


async function affichageComplet() {
    await afficherMeilleurFilm();
    await afficherMeilleursFilms();
    await afficherToutesLesSectionsParGenre();
    ajouterDataFilmIdDansGrilles();
    activerModalsFilms();
}


document.addEventListener('DOMContentLoaded', affichageComplet);

