#!/usr/bin/env python3
"""
Script pour uploader les images WebP vers R2 (CloudFlare)
Utilise AWS CLI (compatible S3) et ne ré-uploade pas les fichiers existants.
"""
import os
import subprocess
import sys
from pathlib import Path
from typing import Set

# Configuration R2
R2_BUCKET = os.environ.get('R2_BUCKET', 'the-cyclist-diary-images')
R2_ENDPOINT = os.environ.get('R2_ENDPOINT', 'https://59d55d1a4dbc1f28fe6cd3d2d2036e4d.r2.cloudflarestorage.com')
R2_ACCESS_KEY = os.environ.get('R2_ACCESS_KEY_ID')
R2_SECRET_KEY = os.environ.get('R2_ACCESS_KEY')

# Dossier source des images
PUBLIC_DIR = Path(__file__).parent.parent / "public"


def check_aws_cli():
    """Vérifie que AWS CLI est installé"""
    try:
        subprocess.run(['aws', '--version'], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ AWS CLI n'est pas installé. Installez-le avec:")
        print("   pip install awscli")
        print("   ou: sudo apt install awscli")
        return False


def get_existing_files() -> Set[str]:
    """Récupère la liste des fichiers déjà présents sur R2"""
    print("🔍 Récupération de la liste des fichiers sur R2...")
    
    try:
        cmd = [
            'aws', 's3', 'ls',
            f's3://{R2_BUCKET}/',
            '--recursive',
            '--endpoint-url', R2_ENDPOINT
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        
        # Parse la sortie: "2024-03-11 10:30:00   12345 path/to/file.webp"
        existing = set()
        for line in result.stdout.strip().split('\n'):
            if line:
                parts = line.split()
                if len(parts) >= 4:
                    # Le chemin est tout après la taille
                    filepath = ' '.join(parts[3:])
                    existing.add(filepath)
        
        print(f"✅ {len(existing)} fichiers déjà présents sur R2")
        return existing
    
    except subprocess.CalledProcessError as e:
        print(f"⚠️  Impossible de lister les fichiers R2: {e.stderr}")
        print("   Le bucket est peut-être vide ou inaccessible")
        return set()


def find_webp_files() -> list[tuple[Path, str]]:
    """Trouve tous les fichiers WebP dans public/ et retourne (chemin_complet, chemin_relatif)"""
    webp_files = []
    
    for webp_file in PUBLIC_DIR.rglob("*.webp"):
        # Chemin relatif depuis public/
        rel_path = webp_file.relative_to(PUBLIC_DIR)
        webp_files.append((webp_file, str(rel_path)))
    
    return webp_files


def upload_file(local_path: Path, remote_path: str) -> bool:
    """Upload un fichier vers R2"""
    try:
        cmd = [
            'aws', 's3', 'cp',
            str(local_path),
            f's3://{R2_BUCKET}/{remote_path}',
            '--endpoint-url', R2_ENDPOINT,
            '--content-type', 'image/webp',
            '--cache-control', 'public, max-age=31536000, immutable'
        ]
        
        subprocess.run(cmd, capture_output=True, check=True)
        return True
    
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur lors de l'upload de {remote_path}: {e.stderr.decode()}")
        return False


def main():
    """Fonction principale"""
    print("🚀 Upload des images WebP vers R2")
    print("=" * 60)
    
    # Vérifications préalables
    if not check_aws_cli():
        sys.exit(1)
    
    if not R2_ACCESS_KEY or not R2_SECRET_KEY:
        print("❌ Variables d'environnement manquantes:")
        print("   R2_ACCESS_KEY_ID et R2_ACCESS_KEY doivent être définies")
        sys.exit(1)
    
    if not PUBLIC_DIR.exists():
        print(f"❌ Le dossier {PUBLIC_DIR} n'existe pas")
        print("   Lancez 'hugo' pour générer le site d'abord")
        sys.exit(1)
    
    # Configure AWS CLI avec les credentials R2
    os.environ['AWS_ACCESS_KEY_ID'] = R2_ACCESS_KEY
    os.environ['AWS_SECRET_ACCESS_KEY'] = R2_SECRET_KEY
    
    # Récupère les fichiers existants
    existing_files = get_existing_files()
    
    # Trouve tous les fichiers WebP
    print(f"\n🔍 Recherche des fichiers WebP dans {PUBLIC_DIR}...")
    webp_files = find_webp_files()
    print(f"✅ {len(webp_files)} fichiers WebP trouvés")
    
    # Filtre les fichiers à uploader
    to_upload = []
    for local_path, remote_path in webp_files:
        if remote_path not in existing_files:
            to_upload.append((local_path, remote_path))
    
    if not to_upload:
        print("\n✅ Tous les fichiers sont déjà sur R2 !")
        return
    
    print(f"\n📤 {len(to_upload)} fichiers à uploader...")
    print("-" * 60)
    
    # Upload les fichiers
    success_count = 0
    fail_count = 0
    
    for i, (local_path, remote_path) in enumerate(to_upload, 1):
        print(f"[{i}/{len(to_upload)}] {remote_path}...", end=" ")
        
        if upload_file(local_path, remote_path):
            print("✅")
            success_count += 1
        else:
            print("❌")
            fail_count += 1
    
    # Résumé
    print("\n" + "=" * 60)
    print(f"✅ Upload terminé: {success_count} réussis, {fail_count} échecs")
    print(f"📊 Total sur R2: {len(existing_files) + success_count} fichiers")


if __name__ == "__main__":
    main()
