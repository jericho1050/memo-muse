import os
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)


def test_health_check():
	res = client.get('/health')
	assert res.status_code == 200
	assert res.json() == {'status': 'ok'}


def test_generate_summary_too_many_items():
	os.environ['GROQ_API_KEY'] = 'test'
	items = [{'image_url': 'http://example.com/img.jpg'} for _ in range(6)]
	res = client.post('/generate-summary', json={'media_items': items})
	assert res.status_code == 413
