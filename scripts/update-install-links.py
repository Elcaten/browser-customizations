#!/usr/bin/env python3
"""Regenerate the README install links from userscript/userstyle metadata."""

import argparse
from pathlib import Path
import re
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
START = "<!-- install-links:start -->"
END = "<!-- install-links:end -->"


def update_links(root, repository, branch):
    links = []
    base = f"https://raw.githubusercontent.com/{repository}/refs/heads/{quote(branch, safe='/')}"
    for folder, suffix, kind in (
        ("userscripts", ".user.js", "script"),
        ("userstyles", ".user.css", "style"),
    ):
        for path in (root / folder).rglob(f"*{suffix}"):
            match = re.search(r"^\s*(?://\s*)?@name\s+(.+)$", path.read_text(), re.MULTILINE)
            name = match.group(1).strip() if match else path.name.removesuffix(suffix)
            label = f"Install {name}" if name.casefold().endswith(f" {kind}") else f"Install {name} {kind}"
            escaped_label = label.replace("[", "\\[").replace("]", "\\]")
            url = f"{base}/{quote(path.relative_to(root).as_posix())}"
            links.append((label.casefold(), f"[{escaped_label}]({url})"))

    section = START + "\n\n" + "\n\n".join(link for _, link in sorted(links)) + "\n\n" + END
    readme = root / "README.md"
    text = readme.read_text()
    if START not in text and END not in text:
        text = text.rstrip() + "\n\n## Install\n\n" + section + "\n"
    else:
        if text.count(START) != 1 or text.count(END) != 1 or text.index(START) > text.index(END):
            raise ValueError("README must contain exactly one ordered pair of install-links markers")
        before, remaining = text.split(START)
        _, after = remaining.split(END)
        text = before + section + after
    readme.write_text(text)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repository", required=True, help="GitHub owner/repository")
    parser.add_argument("--branch", default="main")
    args = parser.parse_args()
    update_links(ROOT, args.repository, args.branch)
