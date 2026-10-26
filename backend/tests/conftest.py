import sys
import os
import pytest
from starlette.testclient import TestClient

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)
