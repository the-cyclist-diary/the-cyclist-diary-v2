# Scripts

Ce dossier contient les scripts utilitaires pour le site.

## upload-images-to-r2.py

Script Python pour uploader les images WebP générées par Hugo vers CloudFlare R2.

**Utilisation** :
```bash
# Configurer les credentials (voir .env.example)
source .env

# Builder le site
hugo --minify

# Uploader les images
python3 scripts/upload-images-to-r2.py
```

**Fonctionnalités** :
- Détecte automatiquement les images déjà présentes sur R2
- N'uploade que les nouvelles images
- Configure les bonnes métadonnées (Content-Type, Cache-Control)
- Affiche une progression détaillée

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
4. Execute le script Python d'upload

**Configuration requise** :
- Créer un fichier `.env` à partir de `.env.example`
- Remplir avec vos credentials R2 CloudFlare

Voir [docs/R2_IMAGES_SETUP.md](../docs/R2_IMAGES_SETUP.md) pour plus de détails.
