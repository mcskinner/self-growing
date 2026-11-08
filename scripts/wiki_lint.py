#!/usr/bin/env python3
"""Check inline local Markdown links and wiki index coverage; no semantic verdicts."""

import re
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
LINK = re.compile(r"\[[^\]\n]*\]\(([^\s)]+)(?:\s+\"[^\"]*\")?\)")


def local_links(page):
    # Ignore fenced examples. This intentionally isn't a complete Markdown parser.
    text = re.sub(r"^(`{3,}|~{3,}).*?^\1[^\n]*$", "", page.read_text(), flags=re.M | re.S)
    for match in LINK.finditer(text):
        url = urlsplit(match[1])
        if not url.scheme and not url.netloc and url.path:
            yield match[1], (page.parent / unquote(url.path)).resolve()


def lint(wiki):
    wiki = wiki.resolve()
    pages = sorted(wiki.rglob("*.md"))
    errors = []
    if not (wiki / "index.md").is_file():
        return ["Missing wiki index.md"]
    for page in pages:
        for label, target in local_links(page):
            if not target.exists():
                errors.append(f"{page.relative_to(wiki)}: missing local target: {label}")
    indexed = {target for _, target in local_links(wiki / "index.md")}
    for page in pages:
        if page.name in {"README.md", "index.md", "log.md"} and page.parent == wiki:
            continue
        if page not in indexed:
            errors.append(f"{page.relative_to(wiki)}: not linked from index.md")
    return errors


def main():
    errors = lint(ROOT / "docs/wiki")
    for error in errors:
        print(error)
    if not errors:
        print("Wiki links and index coverage OK (anchors/external links/semantics not checked)")
    return bool(errors)


if __name__ == "__main__":
    raise SystemExit(main())
