from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import secrets

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='viewer')
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Client(db.Model):
    __tablename__ = 'clients'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    location_id = db.Column(db.String(100), nullable=False)
    api_key = db.Column(db.String(255), nullable=False)
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    last_sync = db.Column(db.DateTime)
    investment = db.Column(db.Float, default=0)
    
class PasswordResetToken(db.Model):
    __tablename__ = 'password_reset_tokens'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    token = db.Column(db.String(100), unique=True, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)

    @staticmethod
    def create_for_user(user_id):
        PasswordResetToken.query.filter_by(user_id=user_id, used=False).delete()
        reset_token = PasswordResetToken(
            user_id=user_id,
            token=secrets.token_urlsafe(32),
            expires_at=datetime.utcnow() + timedelta(minutes=30)
        )
        db.session.add(reset_token)
        db.session.commit()
        return reset_token    

class Contact(db.Model):
    __tablename__ = 'contacts'
    id = db.Column(db.String(50), primary_key=True)
    location_id = db.Column(db.String(100), nullable=False)
    contact_name = db.Column(db.String(200))
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    email = db.Column(db.String(120))
    phone = db.Column(db.String(50))
    source = db.Column(db.String(100))
    type = db.Column(db.String(50))
    tags = db.Column(db.Text)
    date_added = db.Column(db.DateTime)
    date_updated = db.Column(db.DateTime)
    custom_fields = db.Column(db.Text)
    attributions = db.Column(db.Text)
    synced_at = db.Column(db.DateTime, default=datetime.utcnow)