from app.core.config import settings


def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "ollama" in data
    assert "connected" in data["ollama"]
    assert "configured_model" in data["ollama"]
    assert "github" in data
    assert "token_configured" in data["github"]
    
    # Verify no sensitive credentials leaked
    assert "GITHUB_TOKEN" not in data
    assert "token" not in data["github"]
    if settings.GITHUB_TOKEN:
        assert settings.GITHUB_TOKEN not in str(data)


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "documentation" in data
    assert data["documentation"] == "/docs"
