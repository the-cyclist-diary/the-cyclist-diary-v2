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