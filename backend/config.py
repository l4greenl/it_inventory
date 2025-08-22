import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key'
    SQLALCHEMY_DATABASE_URI = 'postgresql://postgres:123456@localhost:5433/inventory'
    SQLALCHEMY_TRACK_MODIFICATIONS = False