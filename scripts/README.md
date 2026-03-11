# Scripts

Ce dossier contient les scripts utilitaires pour le site.

## requirements.txt

Dépendances Python nécessaires pour les scripts d'upload :
- `awscli` : client CLI S3-compatible pour interagir avec CloudFlare R2

**Installation** :
```bash
pip install -r scripts/requirements.txt
```

## upload-images-to-r2.py

Script Python pour synchroniser les images WebP générées par Hugo vers CloudFlare R2.

**Utilisation** :
```bash
# Configurer les credentials (voir .env.example)
source .env

# Builder le site
hugo --minify

# Synchroniser les images
python3 scripts/upload-images-to-r2.py
```

**Fonctionnalités** :
- Utilise `aws s3 sync` pour des uploads parallélisés ultra-rapides
- Ne ré-uploade que les fichiers modifiés (comparaison par taille)
- Supprime automatiquement les images orphelines sur R2
- Configure les bonnes métadonnées (Content-Type, Cache-Control)
- Affiche des statistiques détaillées

**Performance** :
- ~10-50x plus rapide que les uploads séquentiels
- Parallélisation automatique par AWS CLI

## upload-images.sh

Script bash helper qui automatise le processus complet.

**Utilisation** :
```bash
./scripts/upload-images.sh
```

Ce script :
1. Vérifie que `.env` existe
2. Charge les variables d'environnement  
3. Lance la build Hugo si nécessaire
4. Synchronise les images avec R2 (upload + nettoyage)

**Configuration requise** :
- Créer un fichier `.env` à partir de `.env.example`
- Remplir avec vos credentials R2 CloudFlare

Voir [docs/R2_IMAGES_SETUP.md](../docs/R2_IMAGES_SETUP.md) pour plus de détails.
