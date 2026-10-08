def test_root_health_endpoint(client):
    """Verify GET /health returns 200 OK with expected status."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_api_v1_health_endpoint(client):
    """Verify GET /api/v1/health returns 200 OK with expected status."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
