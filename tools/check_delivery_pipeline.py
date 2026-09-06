"""
check_delivery_pipeline.py
===========================

Propagation guard (PHASE-02 of plans/2026-08-22-delivery-stall-recovery-plan.md):
every other guard in this repository asks "is this number right?" -- none asks
"did this work reach anyone?" This one measures the distance between three states
that should, most of the time, coincide: the working tree, the local `master`
branch, its upstream on GitHub, and the commit the live site was actually built
from.

Three integers:
  dirty_tracked    -- tracked files with a staged or unstaged modification
                       (untracked files are reported but never gate; this repo
                       legitimately carries untracked local-only artifacts, e.g.
                       Windows-only Playwright visual baselines)
  unpushed         -- commits reachable from HEAD but not from the branch's
                       upstream (falls back to origin/<branch> if none is set)
  undeployed       -- commits reachable from HEAD but not from the commit the
                       live site's build-commit marker names

Never fails (exit 0) when the live URL can't be reached or its build-commit
marker is unusable -- those are the same "don't flake on transient conditions"
cases check_deploy_freshness.py already treats leniently. Otherwise exits 1 the
moment any of the three counts is non-zero (subject to --max-age-days).

Run:  python tools/check_delivery_pipeline.py
      (Windows, if the default python is shadowed: PYTHONPATH= py tools/check_delivery_pipeline.py)

Flags:
  --url URL             Live URL to check (default: https://dppa-case.web.app)
  --max-age-days N       Only fail a stage whose oldest blocking commit is older
                         than N days (default: 0, meaning any non-zero count fails
                         immediately). dirty_tracked has no commit to date, so it
                         is always treated as age 0 and, with N >= 1, never fails
                         on its own.
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TOOLS_DIR = Path(__file__).resolve().parent
if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))

from check_deploy_freshness import DEFAULT_URL, extract_build_commit, fetch_html  # noqa: E402

import urllib.error  # noqa: E402


def _run_git(args: list[str]) -> str | None:
    """Run a git command in REPO_ROOT; return stripped stdout, or None on any failure."""
    try:
        result = subprocess.run(
            ["git", *args],
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
        )
    except OSError:
        return None
    if result.returncode != 0:
        return None
    return result.stdout.strip()


def git_status_porcelain() -> str:
    """Return the raw `git status --porcelain=v1` output for the working tree."""
    return _run_git(["status", "--porcelain=v1"]) or ""


def dirty_tracked_count(porcelain: str) -> int:
    """Count tracked files with a staged or unstaged modification (not `??`, not `!!`)."""
    count = 0
    for line in porcelain.splitlines():
        if not line:
            continue
        status = line[:2]
        if status in ("??", "!!"):
            continue
        count += 1
    return count


def untracked_count(porcelain: str) -> int:
    """Count `??` entries in `git status --porcelain=v1` output. Informational only."""
    return sum(1 for line in porcelain.splitlines() if line.startswith("??"))


def resolve_upstream() -> str | None:
    """Return the current branch's configured upstream, falling back to origin/<branch>."""
    upstream = _run_git(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"])
    if upstream:
        return upstream
    branch = _run_git(["rev-parse", "--abbrev-ref", "HEAD"])
    if not branch or branch == "HEAD":
        return None
    candidate = f"origin/{branch}"
    if _run_git(["rev-parse", "--verify", "--quiet", candidate]) is not None:
        return candidate
    return None


def unpushed_count(upstream: str) -> int | None:
    """Return `git rev-list --count <upstream>..HEAD`, or None if it cannot be computed."""
    out = _run_git(["rev-list", "--count", f"{upstream}..HEAD"])
    if out is None or not out.isdigit():
        return None
    return int(out)


def undeployed_count(marker_commit: str) -> int | None:
    """Return `git rev-list --count <marker_commit>..HEAD`, or None if the commit is unknown."""
    out = _run_git(["rev-list", "--count", f"{marker_commit}..HEAD"])
    if out is None or not out.isdigit():
        return None
    return int(out)


def deployable_commits(since_ref: str, paths: list[str]) -> list[str]:
    """Return commit hashes between since_ref and HEAD touching at least one of paths."""
    out = _run_git(["rev-list", f"{since_ref}..HEAD", "--", *paths])
    if out is None:
        return []
    return [line for line in out.splitlines() if line]


def commit_age_days(commit_hash: str) -> int:
    """Return the age in days of a single commit, or 0 if unavailable."""
    out = _run_git(["log", "-1", "--format=%ct", commit_hash])
    if not out or not out.strip().isdigit():
        return 0
    now = datetime.now(timezone.utc).timestamp()
    return max(0, int((now - int(out.strip())) / 86400))

def oldest_commit_age_days(rev_range: str) -> int:
    """Return the age in days of the oldest commit in `rev_range`, or 0 if unavailable."""
    out = _run_git(["log", "--format=%at", rev_range])
    if not out:
        return 0
    timestamps = [int(line) for line in out.splitlines() if line.strip().isdigit()]
    if not timestamps:
        return 0
    oldest = min(timestamps)
    now = datetime.now(timezone.utc).timestamp()
    return max(0, int((now - oldest) / 86400))


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--url", default=DEFAULT_URL, help="Live URL to check (default: %(default)s)")
    parser.add_argument(
        "--max-age-days",
        type=int,
        default=0,
        help="Only fail a stage whose oldest blocking commit is older than N days (default: 0)",
    )
    parser.add_argument(
        "--deploy-paths",
        nargs="*",
        default=["app/"],
        help="Undeployed commits touching one of these paths gate the deploy stage; "
        "all other undeployed commits are reported as informational only (default: app/)",
    )
    args = parser.parse_args(argv)

    porcelain = git_status_porcelain()
    dirty = dirty_tracked_count(porcelain)
    untracked = untracked_count(porcelain)

    upstream = resolve_upstream()
    unpushed = unpushed_count(upstream) if upstream else None
    unpushed_age = oldest_commit_age_days(f"{upstream}..HEAD") if upstream and unpushed else 0

    try:
        live_html = fetch_html(args.url)
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        print(f"DELIVERY-PIPELINE UNKNOWN: could not reach {args.url} ({exc})")
        print(f"  dirty_tracked: {dirty}  (untracked: {untracked}, informational)")
        print(f"  unpushed: {unpushed if unpushed is not None else 'unknown'}")
        return 0

    live_marker = extract_build_commit(live_html)
    live_marker_clean = live_marker[:-6] if live_marker and live_marker.endswith("-dirty") else live_marker

    undeployed: int | None = None
    undeployed_age = 0
    if not live_marker_clean or live_marker_clean == "unknown":
        print(f"DELIVERY-PIPELINE UNKNOWN: live build-commit marker is unusable ({live_marker!r})")
        print(f"  dirty_tracked: {dirty}  (untracked: {untracked}, informational)")
        print(f"  unpushed: {unpushed if unpushed is not None else 'unknown'}")
        return 0

    undeployed = undeployed_count(live_marker_clean)
    if undeployed is None:
        print(
            f"DELIVERY-PIPELINE UNKNOWN: live build-commit marker {live_marker_clean} is not a "
            "known commit in this checkout"
        )
        print(f"  dirty_tracked: {dirty}  (untracked: {untracked}, informational)")
        print(f"  unpushed: {unpushed if unpushed is not None else 'unknown'}")
        return 0
    if undeployed:
        undeployed_age = oldest_commit_age_days(f"{live_marker_clean}..HEAD")

    # Deployable-content filter: only undeployed commits touching --deploy-paths
    # (default: app/) can stall the deploy stage. Documentation-only commits are
    # reported as informational and never fail on their own.
    deployable = deployable_commits(live_marker_clean, args.deploy_paths) if undeployed else []
    doc_only = (undeployed or 0) - len(deployable)
    deployable_age = max([commit_age_days(commit) for commit in deployable], default=0)

    # A stage fails when it is non-zero AND its oldest blocking commit's age (in
    # days) is >= --max-age-days. dirty_tracked has no commit, so its age is
    # always 0: with the default N=0 that still fails (0 >= 0), matching "any
    # non-zero count fails immediately"; with N >= 1 it never fails on its own.
    stalled_lines = []
    if dirty > 0 and 0 >= args.max_age_days:
        stalled_lines.append(f"  uncommitted files: {dirty}")
    if unpushed is not None and unpushed > 0 and unpushed_age >= args.max_age_days:
        stalled_lines.append(f"  unpushed commits: {unpushed} (oldest {unpushed_age}d old, upstream {upstream})")
    if deployable and deployable_age >= args.max_age_days:
        stalled_lines.append(
            f"  undeployed commits: {undeployed} ({len(deployable)} deployable, oldest {deployable_age}d old, live marker {live_marker_clean[:7]})"
        )

    doc_only_line = (
        f"  documentation-only commits: {doc_only} (informational, does not gate)" if doc_only > 0 else ""
    )
    if stalled_lines:
        print("DELIVERY-PIPELINE STALLED")
        for line in stalled_lines:
            print(line)
        if doc_only_line:
            print(doc_only_line)
        if untracked:
            print(f"  untracked files: {untracked}  (informational, does not gate)")
        return 1

    if doc_only_line:
        print(doc_only_line)
    print(
        f"DELIVERY-PIPELINE CLEAN (0 uncommitted, "
        f"{unpushed if unpushed is not None else 0} unpushed, "
        f"{undeployed if undeployed is not None else 0} undeployed)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
