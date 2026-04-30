import os

import pytest

os.environ["QGG_DATABASE_URL"] = "sqlite:///:memory:"


@pytest.fixture(autouse=True)
def reset_db_tables():
    from app.database import Base, engine

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield

