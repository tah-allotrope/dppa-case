"""
check_deploy_freshness.py
==========================

Freshness guard (PHASE-01 of plans/2026-07-25-guardrail-integrity-and-localization-plan.md,
superseding the PHASE-02 version from plans/2026-07-21-deploy-drift-repo-hygiene-plan.md):
compares the content-hashed asset filenames referenced by the live app's served HTML against
the filenames a fresh local build of the current working tree produces. Vite emits a new
hashed filename whenever the built output changes, so this is an exact equality test that
cannot be fooled by a stale, wrong, or missing build-commit marker -- unlike a commit-label
comparison, it cannot be tripped by a documentation-only commit either, because such a commit
never changes any asset's contents or hash.

The build-commit marker (injected by the Vite plugin in app/vite.config.js) is still read and
reported for human-readable provenance, and a marker ending in "-dirty" (meaning the build that
produced it was made from an uncommitted working tree) is always treated as a hard failure,
regardless of whether the asset hashes happen to match.

Never fails (exit 0) on network unreachability or a failing local build -- only a confirmed
reachable-but-stale deploy, or a confirmed dirty-tree live build, is treated as a failure
(exit 1). This keeps the check safe to run on a schedule without flaking on transient network
conditions or an unrelated local build breakage.

Run:  python tools/check_deploy_freshness.py
      (Windows, if the default python is shadowed: PYTHONPATH= py tools/check_deploy_freshness.py)

Flags:
  --url URL          Live URL to check (default: https://dppa-case.web.app)
  --skip-build        Skip the local `npm run build` step and compare only against the
                       existing app/dist/index.html (fails UNKNOWN if it does not exist)
  --write-log         On PASS, rewrite/insert the top data row of app/deployment.md's
                       "## Last Deploy" table with today's date and the live short commit
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import date, timezone, datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
APP_DIR = REPO_ROOT / "app"
DIST_INDEX = APP_DIR / "dist" / "index.html"
DEPLOYMENT_MD = APP_DIR / "deployment.md"

DEFAULT_URL = "https://dppa-case.web.app"
BUILD_COMMIT_RE = re.compile(r'<meta name="build-commit" content="([0-9a-f]{7,40}(?:-dirty)?|unknown)">')
ASSET_RE = re.compile(r'(?:src|href)="(/assets/[^"]+)"')
LAST_DEPLOY_HEADING = "## Last Deploy"


def fetch_html(url: str, timeout: int = 10) -> str:
    """GET url and return the decoded response body; lets network errors propagate."""
    with urllib.request.urlopen(url, timeout=timeout) as response:
        return response.read().decode("utf-8", errors="replace")


def extract_build_commit(html: str) -> str | None:
    """Return the build-commit meta tag's content value, or None if absent/malformed."""
    match = BUILD_COMMIT_RE.search(html)
    return match.group(1) if match else None


def is_dirty_marker(marker: str | None) -> bool:
    """Return True only when marker is a string ending in the literal suffix '-dirty'."""
    return isinstance(marker, str) and marker.endswith("-dirty")


def local_asset_paths(html: str) -> set[str]:
    """Return the set of /assets/... paths referenced by src/href attributes in html."""
    return set(ASSET_RE.findall(html))


# live_asset_paths is the same extraction applied to fetched HTML; kept as a distinct name
# for call-site clarity even though the implementation is identical.
live_asset_paths = local_asset_paths


def run_local_build(app_dir: Path = APP_DIR) -> bool:
    """Run `npm run build` in app_dir; return True on exit code 0, False otherwise. Never raises."""
    try:
        result = subprocess.run(
            ["npm", "run", "build"],
            cwd=str(app_dir),
            capture_output=True,
            text=True,
            shell=(sys.platform == "win32"),
        )
        return result.returncode == 0
    except OSError:
        return False


def write_deploy_log(deployment_md: Path, log_date: str, commit_short: str, description: str) -> bool:
    """Rewrite or insert the top data row of the '## Last Deploy' table; return True if changed."""
    if not deployment_md.exists():
        return False
    original = deployment_md.read_text(encoding="utf-8")
    lines = original.splitlines(keepends=True)

    try:
        heading_idx = next(i for i, line in enumerate(lines) if line.strip() == LAST_DEPLOY_HEADING)
    except StopIteration:
        return False

    # Find the header separator row ("|---|---|---|") after the heading, then the first data row.
    header_sep_idx = None
    for i in range(heading_idx + 1, len(lines)):
        stripped = lines[i].strip()
        if stripped.startswith("|") and set(stripped.replace("|", "").strip()) <= {"-", " "} and "-" in stripped:
            header_sep_idx = i
            break
    if header_sep_idx is None:
        return False

    first_data_idx = header_sep_idx + 1
    new_row = f"| {log_date} | `{commit_short}` | {description} |\n"

    existing_first_row = lines[first_data_idx] if first_data_idx < len(lines) else ""
    existing_date_match = re.match(r"^\|\s*(\d{4}-\d{2}-\d{2})\s*\|", existing_first_row)

    if existing_date_match and existing_date_match.group(1) == log_date:
        lines[first_data_idx] = new_row
    else:
        lines.insert(first_data_idx, new_row)

    updated = "".join(lines)
    if updated == original:
        return False
    deployment_md.write_text(updated, encoding="utf-8")
    return True


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--url", default=DEFAULT_URL, help="Live URL to check (default: %(default)s)")
    parser.add_argument("--skip-build", action="store_true", help="Skip the local build; use existing app/dist/index.html")
    parser.add_argument("--write-log", action="store_true", help="On PASS, update app/deployment.md's Last Deploy table")
    args = parser.parse_args(argv)

    if not args.skip_build:
        if not run_local_build():
            print("DEPLOY-FRESHNESS UNKNOWN: local build failed")
            return 0

    if not DIST_INDEX.exists():
        print(f"DEPLOY-FRESHNESS UNKNOWN: {DIST_INDEX} does not exist (build first, or omit --skip-build)")
        return 0

    local_html = DIST_INDEX.read_text(encoding="utf-8")
    local_assets = local_asset_paths(local_html)

    try:
        live_html = fetch_html(args.url)
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        print(f"DEPLOY-FRESHNESS UNKNOWN: could not reach {args.url} ({exc})")
        return 0

    live_assets = live_asset_paths(live_html)
    live_marker = extract_build_commit(live_html)
    live_marker_short = (live_marker[:7] if live_marker and live_marker != "unknown" else live_marker) or "none"

    if is_dirty_marker(live_marker):
        print(
            f"DEPLOY-FRESHNESS FAIL: live build marker {live_marker} was produced from a dirty "
            f"working tree (redeploy from a clean `git status --porcelain` tree)"
        )
        return 1

    if live_assets == local_assets:
        print(f"DEPLOY-FRESHNESS PASS (assets match local build; live marker {live_marker_short})")
        if args.write_log:
            today = datetime.now(timezone.utc).date().isoformat()
            description = "Verified fresh by tools/check_deploy_freshness.py --write-log"
            changed = write_deploy_log(DEPLOYMENT_MD, today, live_marker_short, description)
            if changed:
                print(f"DEPLOY-FRESHNESS: updated {DEPLOYMENT_MD} Last Deploy table ({today})")
        return 0

    print(
        "DEPLOY-FRESHNESS STALE: live assets "
        f"{sorted(live_assets)} != local build assets {sorted(local_assets)} "
        f'(live marker {live_marker_short}) — run "cd app && npm run predeploy && '
        'npx firebase deploy --only hosting --project dppa-case"'
    )
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
