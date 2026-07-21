"""
check_deploy_freshness.py
==========================

Freshness guard (PHASE-02 of plans/2026-07-21-deploy-drift-repo-hygiene-plan.md):
compares the build-commit marker embedded in the live app's served HTML
(injected by the Vite plugin in app/vite.config.js) against the local
git HEAD, so a stale production deploy is a machine-detectable finding
instead of something someone has to remember to check.

Never fails (exit 0) on network unreachability -- only a confirmed
reachable-but-stale deploy is treated as a failure (exit 1). This keeps
the check safe to run on a schedule without flaking on transient
network conditions.

Run:  python tools/check_deploy_freshness.py
      (Windows, if the default python is shadowed: PYTHONPATH= py tools/check_deploy_freshness.py)
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
import urllib.error
import urllib.request

DEFAULT_URL = "https://dppa-case.web.app"
DEFAULT_REF = "HEAD"
BUILD_COMMIT_RE = re.compile(r'<meta name="build-commit" content="([0-9a-f]{7,40}|unknown)">')


def fetch_html(url: str, timeout: int = 10) -> str:
    """GET url and return the decoded response body; lets network errors propagate."""
    with urllib.request.urlopen(url, timeout=timeout) as response:
        return response.read().decode("utf-8", errors="replace")


def extract_build_commit(html: str) -> str | None:
    """Return the build-commit meta tag's content value, or None if absent/malformed."""
    match = BUILD_COMMIT_RE.search(html)
    return match.group(1) if match else None


def local_head_commit(ref: str = DEFAULT_REF) -> str:
    """Return the full 40-character commit hash for ref via `git rev-parse`."""
    result = subprocess.run(
        ["git", "rev-parse", ref], capture_output=True, text=True, check=True
    )
    return result.stdout.strip()


def compare_commits(live: str, local: str) -> tuple[bool, str]:
    """Compare the live marker against the local commit; return (is_fresh, message)."""
    live_short = live[:7]
    local_short = local[:7]
    if live == local or local.startswith(live):
        return True, f"live={live_short} local={local_short}"
    return False, f"live={live_short} local={local_short}"


def _commits_apart(live: str, local: str) -> str:
    try:
        result = subprocess.run(
            ["git", "rev-list", "--count", f"{live}..{local}"],
            capture_output=True,
            text=True,
            check=True,
        )
        return f"{result.stdout.strip()} commit(s) apart"
    except subprocess.CalledProcessError:
        return "live commit not found in current history"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default=DEFAULT_URL, help="Live URL to check (default: %(default)s)")
    parser.add_argument("--ref", default=DEFAULT_REF, help="Local git ref to compare against (default: %(default)s)")
    args = parser.parse_args(argv)

    try:
        html = fetch_html(args.url)
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        print(f"DEPLOY-FRESHNESS UNKNOWN: could not reach {args.url} ({exc})")
        return 0

    live_commit = extract_build_commit(html)
    if live_commit is None:
        print(f"DEPLOY-FRESHNESS UNKNOWN: no build-commit marker in {args.url} (site predates the Phase 2 build marker)")
        return 0

    if live_commit == "unknown":
        print("DEPLOY-FRESHNESS UNKNOWN: live build marker is 'unknown' (build ran without git metadata)")
        return 0

    local_commit = local_head_commit(args.ref)
    is_fresh, _ = compare_commits(live_commit, local_commit)

    if is_fresh:
        print(f"DEPLOY-FRESHNESS PASS (commit {local_commit[:7]})")
        return 0

    apart = _commits_apart(live_commit, local_commit)
    print(
        f"DEPLOY-FRESHNESS STALE: live={live_commit[:7]} local={local_commit[:7]} "
        f"({apart} — run \"cd app && npm run build && npx firebase deploy --only hosting --project dppa-case\")"
    )
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
