from models import db, User
from werkzeug.security import generate_password_hash
from sqlalchemy import text


def init_db():
    db.create_all()

    # Migraciones manuales seguras
    try:
        db.session.execute(
            text("ALTER TABLE users ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id)")
        )

        db.session.execute(
            text("ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_sync TIMESTAMP")
        )

        db.session.commit()
        print("✅ Columnas verificadas correctamente")
    except Exception as e:
        print(f"⚠️ Error al verificar columnas: {e}")
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
        print(f"ℹ️ Admin ya existe: {admin_email}")