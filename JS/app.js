// 1. Constantes API + factorisation
// =====================

const titlesUrl = 'http://localhost:8000/api/v1/titles/';
const genresUrl = 'http://localhost:8000/api/v1/genres';

// =====================
// Fonction utilitaire pour fetch + json + gestion erreur pour eviter le DRY
// Correctif de la soutenance

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erreur réseau');
    return await response.json();
}

// =====================
// Fonction utilitaire pour créer un bloc film DOM
// Correctif de la soutenance
function createMovieElement(movie) {
    const movieDiv = document.createElement('div');
    movieDiv.className = 'film';

    const picture = document.createElement('img');
    picture.src = movie.image_url;
    picture.alt = movie.title;
    picture.onerror = function() { this.src = '../images/image-not-found.png'; };

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
        displayModalMovie(movie.id);
    });

    rightLayout.appendChild(detailsBtn);
    hoverDiv.appendChild(h3);
    hoverDiv.appendChild(rightLayout);
    movieDiv.appendChild(picture);
    movieDiv.appendChild(hoverDiv);
    return movieDiv;
}

// =====================
// 2. Affichage des films (meilleur, par genre, meilleurs films)
// =====================

/**
 * Cherche le film avec la meilleure note et affiche ses infos dans la section dédiée.
 */

// Nouvelle fonction pour récupérer les 7 meilleurs films (triés par score)
// Correctif de la soutenance
async function loadTopMovies() {
    const url = `${titlesUrl}?sort_by=-imdb_score&page_size=7`; // Correctif de la soutenance
    try {
        const data = await fetchJson(url);
        return data.results || [];
    } catch (error) {
        console.error('Erreur lors du chargement des meilleurs films:', error);
        return [];
    }
}

// Affiche le meilleur film dans la section dédiée
async function displayBestMovie() {
    const movies = await loadTopMovies();
    const bestMovie = movies[0];
    const section = document.querySelector('section');
    const picture = section.querySelector('.square-best-film img');
    const title = section.querySelector('.best-film-txt h1');
    const synopsis = section.querySelector('.best-film-txt .best-film-content');
    const detailsBtn = section.querySelector('.right-layout a');
    if (!bestMovie) {
        picture.src = '';
        title.textContent = 'Aucun film trouvé';
        synopsis.textContent = '';
        detailsBtn.href = '#';
        return;
    }
    let description = '';
    try {
        const detailData = await fetchJson(bestMovie.url);
        description = detailData.long_description || detailData.description || '';
    } catch {}
    picture.src = bestMovie.image_url || '../images/image-not-found.png';
    picture.alt = bestMovie.title;
    picture.onerror = function() { this.src = '../images/image-not-found.png'; };
    title.textContent = bestMovie.title;
    synopsis.textContent = description || 'Pas de description pour ce film';
    detailsBtn.href = '#';
    detailsBtn.setAttribute('data-film-id', bestMovie.id);
    detailsBtn.addEventListener('click', function(event) {
        event.preventDefault();
        displayModalMovie(bestMovie.id);
    });
}

// Affiche les 6 films suivants dans la section "Films les mieux notés"
// Correctif de la soutenance
async function displayBestRatedMovies() {
    const movies = await loadTopMovies();
    const bestRatedSection = document.getElementById('best-rated-film');
    if (!bestRatedSection) return;
    const grid = bestRatedSection.nextElementSibling;
    if (!grid || !grid.classList.contains('film-grid')) return;
    grid.innerHTML = '';
    // On prend les 6 films suivants (après le meilleur)
    movies.slice(1, 7).forEach(movie => {
        grid.appendChild(createMovieElement(movie));
    });
    applyDevelop(grid);
}

// =====================
// Génération dynamique des sections best-rated-film-1 et 2
// =====================

/**
 * Crée dynamiquement une section de films pour un genre donné
 * @param {string} genre - Le nom du genre à afficher
 * @param {string} title - Le texte à afficher dans le h1
 * Correctif de la soutenance
 */

function createGenderSection(genre, title) {
    const main = document.querySelector('main');
    if (!main) return;
    const section = document.createElement('section');
    const h1 = document.createElement('h1');
    h1.textContent = title;
    h1.setAttribute('data-genre', genre);
    const grid = document.createElement('div');
    grid.className = 'film-grid';
    const btn = document.createElement('button');
    btn.className = 'voir-plus button';
    btn.style.display = 'none';
    btn.textContent = 'Voir plus';
    section.appendChild(h1);
    section.appendChild(grid);
    section.appendChild(btn);
    const autresSection = main.querySelector('.line-selector')?.closest('section');
    if (autresSection) {
        main.insertBefore(section, autresSection);
    } else {
        main.appendChild(section);
    }
    // Affiche les films pour ce genre
    displayMovieGender(genre, grid);
}


// Fonction pour afficher les films d'un genre donné dans la grid correspondante
/**
 * Affiche les films d'un genre donné dans la grille fournie.
 * @param {string} genre - Le genre à afficher
 * @param {HTMLElement} grid - La grille où afficher les films
 * Correctif de la soutenance
 */
async function displayMovieGender(genre, grid) {
    let movies = [];
    try {
        const url = `${titlesUrl}?genre=${encodeURIComponent(genre)}&sort_by=-imdb_score&page_size=6`; // Correctif de la soutenance
        const data = await fetchJson(url);
        movies = data.results || [];
    } catch (error) {
        console.error(`Erreur lors de la récupération des films pour le genre ${genre}:`, error);
        grid.innerHTML = `<p>Erreur lors du chargement des films.</p>`;
        return;
    }
    grid.innerHTML = '';
    if (!movies.length) {
        grid.innerHTML = `<p>Aucun film trouvé pour ce genre.</p>`;
        return;
    }
    movies.forEach(movie => {
        grid.appendChild(createMovieElement(movie));
    });
    applyDevelop(grid);
}


// =====================
// 3. Modale d'affichage des détails d'un film
// =====================

/**
 * Affiche la modale avec tous les détails d'un film donné.
 * @param {string|number} movieID - L'identifiant du film à afficher
 */

// Fonction pour afficher le modal avec les infos du film
async function displayModalMovie(movieID) {
    const modal = document.getElementById('modal-detail');
    if (!modal) return;
    /**
     * Ajoute les actions pour ouvrir et fermer la modale de détails de film.
     */
    modal.style.display = 'block';
    const title = modal.querySelector('.modal-film-title');
    const infos = modal.querySelector('.modal-film-infos');
    const synopsis = modal.querySelector('.modal-film-synopsis');
    const distribution = modal.querySelector('.modal-film-distribution');
    const realisation = modal.querySelector('.realisation');
    const picture = modal.querySelector('.modal-film-image');
    title.textContent = '';
    infos.textContent = '';
    synopsis.textContent = '';
    distribution.textContent = '';
    realisation.textContent = '';
    picture.src = '';
    picture.alt = '';
    const url = `${titlesUrl}${movieID}`;
    try {
        const movie = await fetchJson(url);
        title.textContent = movie.title;
        infos.innerHTML =
            `Année : ${movie.year || 'N/A'}<br>` +
            `Genres : ${(movie.genres || []).join(', ')}<br>` +
            `Pays d'origine: ${movie.countries || '<N/A>'}<br>` +
            `Classification : ${getAgeRatingFromMovie(movie)}<br>` +
            `Durée : ${movie.duration ? movie.duration + ' minutes' : 'N/A'}<br>` +
            `IMDB score : ${movie.imdb_score ? movie.imdb_score + '/10' : 'N/A'}<br>` +
            `Recettes au box-office : ${movie.worldwide_gross_income ? movie.worldwide_gross_income + ' $' : 'N/A'}<br>`;
        realisation.textContent = movie.directors ? `${(movie.directors || []).join(', ')}` : '';
        synopsis.textContent = movie.long_description || movie.description || '';
        distribution.textContent = movie.actors ? `${(movie.actors || []).join(', ')}` : '';
        picture.src = movie.image_url || '';
        picture.onerror = function() { this.src = '../images/image-not-found.png'; };
        picture.alt = movie.title;
    } catch (error) {
        title.textContent = 'Film introuvable';
        infos.textContent = '';
        synopsis.textContent = '';
        distribution.textContent = '';
        realisation.textContent = '';
        picture.src = '';
        picture.alt = '';
    }
}


// Intercepte le clic sur tous les boutons Détails
function activateMoviesModal() {
    document.querySelectorAll('a.button[data-film-id]').forEach(btn => {
        btn.addEventListener('click', function(event) {
            event.preventDefault();
            const movieID = btn.getAttribute('data-film-id');
            if (movieID) displayModalMovie(movieID);
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


// =====================
// 4. Utilitaires d'affichage
// =====================

/**
 * Retourne le nombre de films à afficher selon la taille de l'écran.
 * @returns {number}
 */

// Fonction utilitaire pour déterminer le nombre de films visibles selon la taille d'écran
function getNumberOfVisibleMovie() {
    if (window.innerWidth <= 600) return 2; // mobile
    if (window.innerWidth <= 900) return 4; // tablette
    return 6; // desktop
}


/**
 * Gère l'affichage Voir plus / Voir moins dans une grille de films.
 * @param {HTMLElement} grid - La grille à gérer
 */

// Fonction pour masquer les films et gérer les boutons Voir plus / Voir moins
function applyDevelop(grid) {
    const movies = Array.from(grid.querySelectorAll('.film'));
    const nombreVisibles = getNumberOfVisibleMovie();
    let seeMoreButton = grid.nextElementSibling;
    if (!seeMoreButton || !seeMoreButton.classList.contains('voir-plus')) {
        seeMoreButton = document.createElement('button');
        seeMoreButton.className = 'voir-plus button';
        seeMoreButton.textContent = 'Voir plus';
        grid.parentNode.insertBefore(seeMoreButton, grid.nextSibling);
    }

    // Récupère l'état actuel du bouton
    let etat = seeMoreButton.getAttribute('data-etat') || 'plus';

    function displayLess() {
        movies.forEach((movie, index) => {
            if (index < nombreVisibles) {
                movie.classList.remove('film-cache');
            } else {
                movie.classList.add('film-cache');
            }
        });        
        seeMoreButton.textContent = 'Voir plus';
        seeMoreButton.setAttribute('data-etat', 'plus');
        if (movies.length > nombreVisibles){
            seeMoreButton.style.display = 'block';
        } else {
            seeMoreButton.style.display = 'none';
        }     
    }

    function displayMore() {
        movies.forEach(movie => movie.classList.remove('film-cache'));
        seeMoreButton.textContent = 'Voir moins';
        seeMoreButton.setAttribute('data-etat', 'moins');
        seeMoreButton.style.display = 'block';
    }
    // Applique l'état initial
    if (etat === 'moins') {
        displayMore();
    } else {
        displayLess();
    }

    seeMoreButton.onclick = function() {
        if (seeMoreButton.getAttribute('data-etat') === 'plus') {
            displayMore();
        } else {
            displayLess();
        }
    };
}


// Réapplique le masquage lors du redimensionnement
window.addEventListener('resize', () => {
    document.querySelectorAll('.film-grid').forEach(grid => {
        applyDevelop(grid);
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
async function loadAllGender() {
    let url = genresUrl;
    let genres = [];
    try {
        while (url) {
            const data = await fetchJson(url);
            genres = genres.concat(data.results || data.genres || []);
            url = data.next;
        }
    } catch (error) {
        console.error('Erreur lors de la récupération :', error);
        return;
    }
    const select1 = document.getElementById('film-selection-1');
    if (select1) {
        select1.innerHTML = '<option value="">-- Choisir un genre --</option>';
        genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.name || genre;
            option.textContent = genre.name || genre;
            select1.appendChild(option);
        });
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
                await displayMovieGender(select.value, grid);
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

// =====================
// 6. Initialisation globale
// =====================

/**
 * Fonction principale appelée au chargement de la page. Initialise tout le site.
 */

async function displayAll() {
    await loadAllGender();
    await displayBestMovie();
    await displayBestRatedMovies();
    // Génération dynamique des deux sections genres fixes tel que vu lors de la soutenance
    createGenderSection('Sci-Fi', 'Sci-Fi');
    createGenderSection('Mystery', 'Mystery');
    activateMoviesModal();
}


document.addEventListener('DOMContentLoaded', displayAll);
addGenreListener('film-selection-1', 'autres-1');
