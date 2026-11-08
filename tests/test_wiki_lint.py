from scripts.wiki_lint import lint


def test_requires_index(tmp_path):
    assert lint(tmp_path) == ["Missing wiki index.md"]


def test_checks_local_targets_and_index_coverage(tmp_path):
    (tmp_path / "index.md").write_text("[Concept](concept.md)\n")
    (tmp_path / "concept.md").write_text("[Missing](absent.md)\n")
    (tmp_path / "orphan.md").write_text("An unindexed thought\n")
    errors = lint(tmp_path)
    assert any("missing local target: absent.md" in error for error in errors)
    assert "orphan.md: not linked from index.md" in errors
    assert not any("concept.md: not linked" in error for error in errors)


def test_external_links_anchors_and_code_are_not_checked(tmp_path):
    (tmp_path / "index.md").write_text(
        "[Concept](concept.md#section) [External](https://example.invalid/missing)\n"
        "[Anchor](#heading) [Mail](mailto:example@example.invalid)\n"
        "```md\n[Example](does-not-exist.md)\n```\n"
    )
    (tmp_path / "concept.md").write_text("# Section\n")
    assert lint(tmp_path) == []


def test_nested_pages_and_percent_encoded_links(tmp_path):
    nested = tmp_path / "sources"
    nested.mkdir()
    (nested / "a source.md").write_text("[Back](../index.md)\n")
    (tmp_path / "index.md").write_text("[Source](sources/a%20source.md)\n")
    assert lint(tmp_path) == []
