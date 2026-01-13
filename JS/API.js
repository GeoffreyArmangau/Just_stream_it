const titlesUrl = 'http://localhost:8000/api/v1/titles/';
const genresUrl = 'http://localhost:8000/api/v1/genres';

// Synchronise l'attribut data-genre avec le texte du h1 pour les sections best-rated-film-1 et best-rated-film-2
function synchroniserDataGenreAvecTexte() {
    const ids = ['best-rated-film-1', 'best-rated-film-2'];
    ids.forEach(id => {
        const h1 = document.getElementById(id);
        if (h1) {
            const texte = h1.textContent.trim();
            h1.setAttribute('data-genre', texte);
        }
    });
}


// Surveille les changements de texte sur les h1 ciblés et synchronise data-genre
function activerSyncDataGenre() {
    const ids = ['best-rated-film-1', 'best-rated-film-2'];
    ids.forEach(id => {
        const h1 = document.getElementById(id);
        if (h1) {
            const observer = new MutationObserver(() => {
                h1.setAttribute('data-genre', h1.textContent.trim());
            });
            observer.observe(h1, { childList: true, characterData: true, subtree: true });
        }
    });
}


// Fonction pour charger tous les genres et les ajouter aux selects
async function chargerTousLesGenres() {
    try {
        let url = genresUrl;
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

        let url = titlesUrl;
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
        let url = `${titlesUrl}?genre=${encodeURIComponent(genre)}`;
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
        // Limite à 6 films pour chaque catégorie
        films.slice(0, 6).forEach(movie => {
            const filmDiv = document.createElement('div');
            filmDiv.className = 'film';

            const img = document.createElement('img');
            img.src = movie.image_url;
            img.alt = movie.title;
            img.onerror = function() { this.src = '../images/image-not-found.png'; };

            const hoverDiv = document.createElement('div');
            hoverDiv.className = 'hover';

            const h3 = document.createElement('h3');
            h3.textContent = movie.title;

            const rightLayout = document.createElement('div');
            rightLayout.className = 'right-layout';

            const detailsBtn = document.createElement('a');
            detailsBtn.href = '#';
            detailsBtn.className = 'button';
            detailsBtn.setAttribute('data-film-id', movie.id);
            detailsBtn.textContent = 'Détails';
            detailsBtn.addEventListener('click', function(e) {
                e.preventDefault();
                afficherModalFilm(movie.id);
            });

            rightLayout.appendChild(detailsBtn);
            hoverDiv.appendChild(h3);
            hoverDiv.appendChild(rightLayout);
            filmDiv.appendChild(img);
            filmDiv.appendChild(hoverDiv);
            grid.appendChild(filmDiv);
        });
        appliquerVoirPlus(grid);
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
    const ids = ['best-rated-film-1', 'best-rated-film-2'];
    for (const id of ids) {
        const section = document.getElementById(id);
        if (!section) continue;
        const genre = section.getAttribute('data-genre');
        const grid = section.nextElementSibling;
        if (!grid || !grid.classList.contains('film-grid')) continue;
        grid.innerHTML = '';
        let url = titlesUrl;
        let films = [];
        let pageCount = 0;
        const maxPages = 50;
        while (url && pageCount < maxPages) {
            let fetchUrl = url;
            if (genre) {
                const sep = fetchUrl.includes('?') ? '&' : '?';
                fetchUrl = `${fetchUrl}${sep}genre=${encodeURIComponent(genre)}`;
            }
            const response = await fetch(fetchUrl);
            const data = await response.json();
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
            continue;
        }
        films.sort((a, b) => parseFloat(b.imdb_score) - parseFloat(a.imdb_score));
        films.slice(0, 6).forEach(movie => {
            const filmDiv = document.createElement('div');
            filmDiv.className = 'film';

            const img = document.createElement('img');
            img.src = movie.image_url;
            img.alt = movie.title;
            img.onerror = function() { this.src = '../images/image-not-found.png'; };

            const hoverDiv = document.createElement('div');
            hoverDiv.className = 'hover';

            const h3 = document.createElement('h3');
            h3.textContent = movie.title;

            const rightLayout = document.createElement('div');
            rightLayout.className = 'right-layout';

            const detailsBtn = document.createElement('a');
            detailsBtn.href = '#';
            detailsBtn.className = 'button';
            detailsBtn.setAttribute('data-film-id', movie.id);
            detailsBtn.textContent = 'Détails';
            detailsBtn.addEventListener('click', function(e) {
                e.preventDefault();
                afficherModalFilm(movie.id);
            });

            rightLayout.appendChild(detailsBtn);
            hoverDiv.appendChild(h3);
            hoverDiv.appendChild(rightLayout);
            filmDiv.appendChild(img);
            filmDiv.appendChild(hoverDiv);
            grid.appendChild(filmDiv);
        });
        appliquerVoirPlus(grid);
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
    const url = `${titlesUrl}${filmId}`;
    try {
        const response = await fetch(url);
        const film = await response.json();
        titre.textContent = film.title;
        infos.innerHTML =
            `Année : ${film.year || 'N/A'}<br>` +
            `Genres : ${(film.genres || []).join(', ')}<br>` +
            `Classification : ${getAgeRatingFromMovie(film)}<br>` +
            `Durée : ${film.duration ? film.duration + ' minutes' : 'N/A'}<br>` +
            `IMDB score : ${film.imdb_score ? film.imdb_score + '/10' : 'N/A'}<br>` +
            (film.worldwide_gross_income ? `Recettes au box-office : ${film.worldwide_gross_income}<br>` : '');
        realisation.textContent = film.directors ? `${(film.directors || []).join(', ')}` : '';
        synopsis.textContent = film.long_description || film.description || '';
        distribution.textContent = film.actors ? `${(film.actors || []).join(', ')}` : '';
        image.src = film.image_url || '';
        image.onerror = function() { this.src = '../images/image-not-found.png'; };
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

// Fonction utilitaire pour déterminer le nombre de films visibles selon la taille d'écran
function getNbFilmsVisibles() {
    if (window.innerWidth <= 600) return 2; // mobile
    if (window.innerWidth <= 900) return 4; // tablette
    return 6; // desktop
}


// Fonction pour masquer les films et gérer les boutons Voir plus / Voir moins
function appliquerVoirPlus(grid) {
    const films = Array.from(grid.querySelectorAll('.film'));
    const nbVisibles = getNbFilmsVisibles();
    let voirPlusBtn = grid.nextElementSibling;
    if (!voirPlusBtn || !voirPlusBtn.classList.contains('voir-plus')) {
        voirPlusBtn = document.createElement('button');
        voirPlusBtn.className = 'voir-plus button';
        voirPlusBtn.textContent = 'Voir plus';
        grid.parentNode.insertBefore(voirPlusBtn, grid.nextSibling);
    }

    // État du bouton : voir plus ou voir moins ?
    let etat = voirPlusBtn.getAttribute('data-etat') || 'plus';

    function afficherRestreint() {
        films.forEach((film, idx) => {
            if (idx < nbVisibles) {
                film.classList.remove('film-cache');
            } else {
                film.classList.add('film-cache');
            }
        });
        voirPlusBtn.textContent = 'Voir plus';
        voirPlusBtn.setAttribute('data-etat', 'plus');
        voirPlusBtn.style.display = films.length > nbVisibles ? 'block' : 'none';
    }

    function afficherTout() {
        films.forEach(film => film.classList.remove('film-cache'));
        voirPlusBtn.textContent = 'Voir moins';
        voirPlusBtn.setAttribute('data-etat', 'moins');
        voirPlusBtn.style.display = 'block';
    }

    // Applique l'état initial
    if (etat === 'moins') {
        afficherTout();
    } else {
        afficherRestreint();
    }

    voirPlusBtn.onclick = function() {
        if (voirPlusBtn.getAttribute('data-etat') === 'plus') {
            afficherTout();
        } else {
            afficherRestreint();
        }
    };
}


// Réapplique le masquage lors du redimensionnement
window.addEventListener('resize', () => {
    document.querySelectorAll('.film-grid').forEach(grid => {
        appliquerVoirPlus(grid);
    });
});

// Fonction qui détermine la classification d'âge en fonction des genres
function getAgeRatingFromMovie(movie) {
  // age rating based on genres
  if (movie.genres.includes("Adult") || movie.genres.includes("Family")) {
    return "18+";
  }
  if (movie.genres.includes("Horror") || movie.genres.includes("Crime")) {
    return "16+";
  }
  if (movie.genres.includes("Drama")) {
    return "12+";
  }
  return "Tous publics";
}


async function affichageComplet() {
    synchroniserDataGenreAvecTexte();
    activerSyncDataGenre();
    await afficherMeilleurFilm();
    await afficherMeilleursFilms();
    await afficherToutesLesSectionsParGenre();
    ajouterDataFilmIdDansGrilles();
    activerModalsFilms();
}


document.addEventListener('DOMContentLoaded', affichageComplet);

