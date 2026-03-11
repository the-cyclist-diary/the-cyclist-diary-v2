#!/bin/bash
# Script helper pour uploader les images vers R2

set -e

echo "🚀 Upload des images WebP vers R2"
echo "=================================="
echo ""

# Vérifier que .env existe
if [ ! -f .env ]; then
    echo "❌ Fichier .env introuvable"
    echo "   Créez-le à partir de .env.example avec vos credentials R2"
    exit 1
fi

# Charger les variables d'environnement
echo "📋 Chargement de la configuration..."
source .env

# Vérifier que les variables sont définies
if [ -z "$R2_ACCESS_KEY_ID" ] || [ -z "$R2_ACCESS_KEY" ]; then
    echo "❌ Variables R2_ACCESS_KEY_ID et/ou R2_ACCESS_KEY non définies dans .env"
    exit 1
fi

# Vérifier que le dossier public existe
if [ ! -d "public" ]; then
    echo "⚠️  Le dossier public/ n'existe pas"
    echo "   Lancement de la build Hugo..."
    hugo --minify
fi

# Vérifier que awscli est installé
if ! command -v aws &> /dev/null; then
    echo "📦 Installation des dépendances Python..."
    pip install -r scripts/requirements.txt
fi

# Compter les images WebP
webp_count=$(find public -name "*.webp" | wc -l)
echo "📊 $webp_count images WebP trouvées dans public/"
echo ""

# Lancer le script Python
echo "🔄 Lancement de l'upload..."
python3 scripts/upload-images-to-r2.py

echo ""
echo "✅ Terminé !"
