# JustStreamIt

JustStreamIt est une application web permettant de parcourir, filtrer et visualiser des informations sur des films à partir d'une API REST développée en Django. Ce projet est destiné à l'apprentissage des bases du développement web fullstack (front-end JavaScript, back-end Python/Django).

## Fonctionnalités principales
- Affichage dynamique des meilleurs films et de différentes catégories
- Navigation par genre et recherche de films
- Affichage des détails d'un film dans une fenêtre modale
- API RESTful pour la gestion et la consultation des films

## Structure du projet

```
API/
  OCMovies-API-EN-FR/   # Backend Django (API, base de données, scripts)
HTML/
  index.html             # Page principale de l'application
JS/
  app.js                 # Logique front-end (récupération et affichage des films)
styles/
  style.css              # Feuilles de style CSS
images/                  # Images utilisées dans l'application
```

## Installation et lancement

### 1. Backend (API Django)

1. Rendez-vous dans le dossier `API/OCMovies-API-EN-FR`.
2. Installez les dépendances Python :
   ```bash
   pip install -r requirements.txt
   ```
3. Créez la base de données et chargez les données :
   ```bash
   python manage.py migrate
   python manage.py create_db
   ```
4. Lancez le serveur Django :
   ```bash
   python manage.py runserver
   ```

L'API sera accessible sur `http://127.0.0.1:8000/api/v1/titles/`.

### 2. Frontend (HTML/JS/CSS)

1. Ouvrez le fichier `HTML/index.html` dans votre navigateur.
2. Assurez-vous que le serveur Django est bien lancé pour que l'application puisse interroger l'API.

## Technologies utilisées
- **Back-end** : Python 3, Django, Django REST Framework
- **Front-end** : HTML5, CSS3, JavaScript (ES6)

## Bonnes pratiques
- Le code est organisé pour séparer la logique front-end (JS) et back-end (Python/Django).
- Les fonctions sont commentées pour faciliter la compréhension.
- Les tests sont disponibles dans le dossier `tests/` du backend.

## Auteurs
Projet réalisé dans le cadre d’OpenClassrooms.

---

**NB :** Le dossier `SASS/` et le fichier `app.scss` ne sont pas pris en compte dans ce README.
browseable documentation interface of the API by visiting [http://localhost:8000/api/v1/titles/](http://localhost:8000/api/v1/titles/).