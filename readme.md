# The Cyclist Diary v2

Ce projet permet de générer automatiquement des articles à partir d’issues GitHub, facilitant la gestion et la publication de récits d’aventure cycliste.

## Fonctionnement général

- Les articles sont créés sous forme d’issues GitHub, en utilisant un template spécifique.
- Un workflow GitHub Actions se charge de générer automatiquement les articles à partir des issues, dès qu’elles sont créées ou modifiées.

## Comment écrire un article

1. **Créer une nouvelle issue**
   - Utilise le template `Nouvel article` proposé lors de la création d’une issue.

2. **Remplir les champs du template**
   - **Date de l’article** : (optionnel) au format `AAAA-MM-JJ`. Si laissé vide, la date du jour sera utilisée.
   - **Contenu** : rédige ici le texte de ton article.

3. **Ajouter le bon label**
   - Le label doit désigner l’aventure liée à l’article (exemple : `Tour de Bretagne 2024`).
   - Cela permet de classer les articles par aventure.

4. **Définir le milestone**
   - Le milestone doit être `article` pour que l’issue soit prise en compte par le générateur.

5. **Joindre un fichier GPX (optionnel)**
   - Ajoute dans le corps de l’issue le tag `:gpx:` suivi du fichier uploadé (format `.zip` contenant le GPX).

### Exemple de contenu d’issue

```
Date de l'article : 2024-10-25

Contenu :
Aujourd’hui, superbe étape entre Nantes et Rennes sous le soleil !  
:gpx: mon-parcours-nantes-rennes.zip
```

- Pense à bien sélectionner le label de l’aventure et à associer le milestone `article`.

## Génération automatique

- À chaque création ou modification d’une issue avec le template article, le workflow [`generate-articles.yml`](.github/workflows/generate-articles.yml) se déclenche automatiquement.
- L’article est alors généré et publié selon la configuration du projet.

## Pour aller plus loin

- Voir le template d’issue : [`article.yml`](.github/ISSUE_TEMPLATE/article.yml)
- Voir le workflow de génération : [`generate-articles.yml`](.github/workflows/generate-articles.yml)

---
## Upload des images vers le serveur WebP

Les images du dossier `content/` doivent être uploadées manuellement sur le serveur WebP avant le build.  
Hugo les servira ensuite depuis ce serveur (si `HUGO_WEBPSERVER_URL` est défini) plutôt que de les traiter localement.

### Prérequis

```bash
python -m venv .venv
source .venv/bin/activate   # Windows : .venv\Scripts\activate
pip install requests
```

### Utilisation

```bash
# Upload vers le serveur local (défaut)
python upload_images.py

# Avec une clef d'API
WEBPSERVER_API_KEY=my-secret python upload_images.py

# Vers un serveur distant, avec plus de parallélisme
python upload_images.py --server https://images.example.com --workers 8

# Simuler sans rien envoyer
python upload_images.py --dry-run
```

La variable d'environnement `HUGO_WEBPSERVER_URL` est également lue comme URL de serveur par défaut si `--server` n'est pas précisé.

### Ce que fait le script

- Parcourt récursivement `content/` et collecte tous les fichiers `.jpg/.jpeg/.png/.gif/.webp`
- Envoie chaque fichier en multipart `POST /` sur le serveur
- Affiche `✓` (uploadé), `=` (déjà présent sur le serveur), ou `✗` (erreur) pour chaque fichier
- Sort avec le code 1 si au moins une erreur s'est produite

### Variables d'environnement

| Variable | Rôle |
|---|---|
| `HUGO_WEBPSERVER_URL` | URL de base du serveur (ex. `http://localhost:8080`) |
| `WEBPSERVER_API_KEY` | Clef d'API Bearer pour l'authentification (optionnel si le serveur est public) |

### Build Hugo avec le serveur WebP

Définir `HUGO_WEBPSERVER_URL` au moment du build pour que Hugo construise les URLs d'images pointant vers le serveur :

```bash
HUGO_WEBPSERVER_URL=https://images.example.com hugo build
```

Sans cette variable, Hugo génère les images localement (comportement par défaut, pratique pour le développement).

---