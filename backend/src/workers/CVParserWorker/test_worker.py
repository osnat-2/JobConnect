import pytest

from worker import compute_match_score, extract_skills_from_text, infer_file_type


def test_infer_file_type_prefers_explicit_type():
    assert infer_file_type("https://example.com/resume.pdf", "DOCX") == "docx"


def test_infer_file_type_from_url():
    assert infer_file_type("https://example.com/resume.pdf", None) == "pdf"
    assert infer_file_type("https://example.com/resume.docx", None) == "docx"


def test_extract_skills_from_text_finds_keywords():
    text = "Experienced with Python, Docker and AWS cloud deployments."
    skills = extract_skills_from_text(text)
    assert "python" in skills
    assert "docker" in skills
    assert "aws" in skills


def test_compute_match_score_returns_fraction():
    job_requirements = ["Python", "Docker", "Kubernetes"]
    parsed_text = "Python developer with Docker experience"
    result = compute_match_score(job_requirements, parsed_text)

    assert result["matchScore"] == pytest.approx(1 / 3, rel=1e-3)
    assert "Python" in result["matchedSkills"]
    assert "Docker" in result["matchedSkills"]
    assert "Kubernetes" not in result["matchedSkills"]
