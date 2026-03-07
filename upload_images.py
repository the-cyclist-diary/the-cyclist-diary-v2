#!/usr/bin/env python3
"""
Upload all images from the Hugo content/ folder to the WebP server.

Usage:
    python upload_images.py [--server http://localhost:8080] [--workers 4] [--dry-run]

Environment variables:
    HUGO_WEBPSERVER_URL   Server base URL (overridden by --server)
    WEBPSERVER_API_KEY    Bearer token (optional)
"""

import argparse
import concurrent.futures
import os
import sys
from pathlib import Path

import requests

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

CONTENT_DIR = Path(__file__).parent / "content"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Upload images to the WebP server")
    parser.add_argument(
        "--server",
        default=os.environ.get("HUGO_WEBPSERVER_URL", "http://localhost:8080"),
        help="Base URL of the WebP server (default: http://localhost:8080)",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=4,
        help="Number of parallel uploads (default: 4)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List files that would be uploaded without actually uploading",
    )
    return parser.parse_args()


def upload(path: Path, server: str, headers: dict) -> tuple[str, str]:
    """
    Upload a single file via multipart POST.
    Returns (status, message) where status is 'uploaded', 'already_present', or 'error'.
    """
    try:
        with path.open("rb") as f:
            resp = requests.post(
                server.rstrip("/") + "/",
                files={"file": (path.name, f)},
                headers=headers,
                timeout=60,
            )

        if resp.status_code == 200:
            data = resp.json()
            if data.get("alreadyPresent"):
                return ("already_present", data.get("filename", path.name))
            return ("uploaded", data.get("filename", path.name))
        else:
            return ("error", f"HTTP {resp.status_code}: {resp.text[:120]}")

    except Exception as exc:
        return ("error", str(exc))


def main() -> None:
    args = parse_args()
    server: str = args.server.rstrip("/")

    api_key = os.environ.get("WEBPSERVER_API_KEY", "")
    headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}

    # Collect all image files
    images = sorted(
        p for p in CONTENT_DIR.rglob("*") if p.suffix.lower() in IMAGE_EXTENSIONS
    )

    total = len(images)
    print(f"Found {total} image(s) in {CONTENT_DIR}")
    print(f"Server : {server}")
    print(f"Workers: {args.workers}")
    if args.dry_run:
        print("\n[dry-run] Files that would be uploaded:")
        for p in images:
            print(f"  {p.relative_to(CONTENT_DIR)}")
        return

    print()

    counts = {"uploaded": 0, "already_present": 0, "error": 0}
    done = 0

    def task(path: Path) -> tuple[Path, str, str]:
        status, msg = upload(path, server, headers)
        return (path, status, msg)

    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(task, p): p for p in images}
        for future in concurrent.futures.as_completed(futures):
            path, status, msg = future.result()
            counts[status] += 1
            done += 1

            rel = path.relative_to(CONTENT_DIR)
            symbol = {"uploaded": "✓", "already_present": "=", "error": "✗"}[status]
            print(f"[{done:4d}/{total}] {symbol} {rel}  →  {msg}")

    print()
    print("─" * 50)
    print(f"  Uploaded        : {counts['uploaded']}")
    print(f"  Already present : {counts['already_present']}")
    print(f"  Errors          : {counts['error']}")
    print("─" * 50)

    if counts["error"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
