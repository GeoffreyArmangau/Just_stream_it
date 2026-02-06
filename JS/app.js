// =====================
// 1. Constantes API
// =====================
const titlesUrl = 'http://localhost:8000/api/v1/titles/';
const genresUrl = 'http://localhost:8000/api/v1/genres';

// =====================
// 2. Affichage des films (meilleur, par genre, meilleurs films)
// =====================

/**
 * Cherche le film avec la meilleure note et affiche ses infos dans la section dédiée.
 */

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
        let bestScore = 0;
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
        synopsis.textContent = description || 'Pas de description pour ce film';
        detailsBtn.href = '#';
        detailsBtn.setAttribute('data-film-id', bestFilm.id);
        detailsBtn.addEventListener('click', function(event) {
            event.preventDefault();
            afficherModalFilm(bestFilm.id);
        });
    } catch (error) {
        console.error('Erreur chargement meilleur film:', error);
    }
}


// Fonction pour afficher les films d'un genre donné dans la grid correspondante
/**
 * Affiche les films d'un genre donné dans la grille fournie.
 * @param {string} genre - Le genre à afficher
 * @param {HTMLElement} grid - La grille où afficher les films
 */
async function afficherFilmsParGenre(genre, grid) {
    try {
        let url = `${titlesUrl}?genre=${encodeURIComponent(genre)}`;
        let films = [];
        let pageCount = 0;
        const maxPages = 50;
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
            detailsBtn.addEventListener('click', function(event) {
                event.preventDefault();
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
/**
 * Pour chaque h1[data-genre], affiche les films du genre correspondant dans la grille suivante.
 */
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


/**
 * Affiche les meilleurs films (note > 7) pour les sections best-rated-film-1 et best-rated-film-2.
 */


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
            const pageFilms = (data.results || []);
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
            detailsBtn.addEventListener('click', function(event) {
                event.preventDefault();
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


// =====================
// 3. Modale d'affichage des détails d'un film
// =====================

/**
 * Affiche la modale avec tous les détails d'un film donné.
 * @param {string|number} filmId - L'identifiant du film à afficher
 */

// Fonction pour afficher le modal avec les infos du film
async function afficherModalFilm(filmId) {
    const modal = document.getElementById('modal-detail');
    if (!modal) return;
    /**
     * Ajoute les actions pour ouvrir et fermer la modale de détails de film.
     */
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
            `Pays d'origine: ${film.countries || '<N/A>'}<br>` +
            `Classification : ${getAgeRatingFromMovie(film)}<br>` +
            `Durée : ${film.duration ? film.duration + ' minutes' : 'N/A'}<br>` +
            `IMDB score : ${film.imdb_score ? film.imdb_score + '/10' : 'N/A'}<br>` +
            `Recettes au box-office : ${film.worldwide_gross_income ? film.worldwide_gross_income + ' $' : 'N/A'}<br>`;
        realisation.textContent = film.directors ? `${(film.directors || []).join(', ')}` : '';
        synopsis.textContent = film.long_description || film.description || '';
        distribution.textContent = film.actors ? `${(film.actors || []).join(', ')}` : '';
        image.src = film.image_url || '';
        image.onerror = function() { this.src = '../images/image-not-found.png'; };
        image.alt = film.title;
    } catch (error) {
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
        btn.addEventListener('click', function(event) {
            event.preventDefault();
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


/**
 * Ajoute l'attribut data-film-id sur les boutons Détails dans les grilles de films.
 */
function ajouterDataFilmIdDansGrilles() {
    document.querySelectorAll('.film-grid .film a.button').forEach(a => {
        const href = a.getAttribute('href');
        const match = href && href.match(/id=(\d+)/);
        if (match) {
            a.setAttribute('data-film-id', match[1]);
        }
    });
}


// =====================
// 4. Utilitaires d'affichage
// =====================

/**
 * Retourne le nombre de films à afficher selon la taille de l'écran.
 * @returns {number}
 */

// Fonction utilitaire pour déterminer le nombre de films visibles selon la taille d'écran
function getNombreFilmsVisibles() {
    if (window.innerWidth <= 600) return 2; // mobile
    if (window.innerWidth <= 900) return 4; // tablette
    return 6; // desktop
}


/**
 * Gère l'affichage Voir plus / Voir moins dans une grille de films.
 * @param {HTMLElement} grid - La grille à gérer
 */

// Fonction pour masquer les films et gérer les boutons Voir plus / Voir moins
function appliquerVoirPlus(grid) {
    const films = Array.from(grid.querySelectorAll('.film'));
    const nombreVisibles = getNombreFilmsVisibles();
    let voirPlusBouton = grid.nextElementSibling;
    if (!voirPlusBouton || !voirPlusBouton.classList.contains('voir-plus')) {
        voirPlusBouton = document.createElement('button');
        voirPlusBouton.className = 'voir-plus button';
        voirPlusBouton.textContent = 'Voir plus';
        grid.parentNode.insertBefore(voirPlusBouton, grid.nextSibling);
    }

    // Récupère l'état actuel du bouton
    let etat = voirPlusBouton.getAttribute('data-etat') || 'plus';

    function afficherRestreint() {
        films.forEach((film, index) => {
            if (index < nombreVisibles) {
                film.classList.remove('film-cache');
            } else {
                film.classList.add('film-cache');
            }
        });        
        voirPlusBouton.textContent = 'Voir plus';
        voirPlusBouton.setAttribute('data-etat', 'plus');
        if (films.length > nombreVisibles){
            voirPlusBouton.style.display = 'block';
        } else {
            voirPlusBouton.style.display = 'none';
        }     
    }

    function afficherTout() {
        films.forEach(film => film.classList.remove('film-cache'));
        voirPlusBouton.textContent = 'Voir moins';
        voirPlusBouton.setAttribute('data-etat', 'moins');
        voirPlusBouton.style.display = 'block';
    }
    // Applique l'état initial
    if (etat === 'moins') {
        afficherTout();
    } else {
        afficherRestreint();
    }

    voirPlusBouton.onclick = function() {
        if (voirPlusBouton.getAttribute('data-etat') === 'plus') {
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


/**
 * Détermine la classification d'âge d'un film selon ses genres.
 * @param {Object} movie - L'objet film
 * @returns {string} - La classification d'âge
 */

// Fonction qui détermine la classification d'âge en fonction des genres
function getAgeRatingFromMovie(movie) {
  // age rating based on genres
  if (movie.genres.includes("Adult") || movie.genres.includes("Erotic")) {
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

// =====================
// 5. Gestion des genres (select)
// =====================
// Charge tous les genres et les ajoute aux selects
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
        const select1 = document.getElementById('film-selection-1');
        const select2 = document.getElementById('film-selection-2');
        select1.innerHTML = '<option value="">-- Choisir un genre --</option>';
        select2.innerHTML = '<option value="">-- Choisir un genre --</option>';
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


/**
 * Ajoute un écouteur sur le select pour changer le genre affiché et mettre à jour la grille de films.
 * @param {string} selectId - L'id du select HTML
 * @param {string} h1Id - L'id du h1 à mettre à jour
 */

// Ajoute un écouteur sur le select pour changer le genre affiché
function addGenreListener(selectId, h1Id) {
    const select = document.getElementById(selectId);
    const h1 = document.getElementById(h1Id);
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


/**
 * Synchronise immédiatement l'attribut data-genre des h1 ciblés avec leur texte,
 * puis active un MutationObserver pour maintenir la synchronisation en temps réel.
 */
function synchroniserEtObserverDataGenre() {
    var ids = ['best-rated-film-1', 'best-rated-film-2'];
    for (var i = 0; i < ids.length; i++) {
        var h1 = document.getElementById(ids[i]);
        if (h1) {
            h1.setAttribute('data-genre', h1.textContent.trim());
            // Pas d'observateur, juste une synchronisation simple
        }
    }
}

// =====================
// 6. Initialisation globale
// =====================

/**
 * Fonction principale appelée au chargement de la page. Initialise tout le site.
 */


async function affichageComplet() {
    await chargerTousLesGenres();
    synchroniserEtObserverDataGenre();
    await afficherMeilleurFilm();
    await afficherMeilleursFilms();
    await afficherToutesLesSectionsParGenre();
    ajouterDataFilmIdDansGrilles();
    activerModalsFilms();
}


document.addEventListener('DOMContentLoaded', affichageComplet);
addGenreListener('film-selection-1', 'autres-1');
addGenreListener('film-selection-2', 'autres-2');
