from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker

DB_USER = "postgres"
DB_PASS = "1121"
DB_HOST = "localhost"
DB_PORT = 5432
DB_NAME = "postgres"

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL)


try:
    with engine.connect() as conn:

        SessionLocal  = sessionmaker(autocommit = False, autoflush= False, bind=engine)
        # result = conn.execute(text("SELECT version();"))
        # version = result.fetchone()
        # print(f"PostgreSQL 연결 성공! 버전: {version[0]}")

      
except OperationalError as e:
    print(f" PostgreSQL 연결 실패: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
