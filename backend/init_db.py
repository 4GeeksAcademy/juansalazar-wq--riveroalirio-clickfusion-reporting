from models import db, User
from werkzeug.security import generate_password_hash
from sqlalchemy import text

def init_db():
    db.create_all()
    
    # Agregar columna client_id si no existe (migración manual)
    try:
        db.session.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id)"))
        db.session.commit()
        print("✅ Columna client_id verificada en tabla users")
    except Exception as e:
        print(f"⚠️ Error al agregar columna: {e}")
        db.session.rollback()
    
    # Crear admin si no existe
    admin_email = "juan@clickfusion.com"
    existing = User.query.filter_by(email=admin_email).first()
    
    if not existing:
        admin = User(
            name="Admin ClickFusion",
            email=admin_email,
            password=generate_password_hash("123456"),
            role="admin"
        )
        db.session.add(admin)
        db.session.commit()
        print(f"✅ Admin creado: {admin_email}")
    else:
        print(f"ℹ️  Admin ya existe: {admin_email}")