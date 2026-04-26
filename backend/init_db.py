from models import db, User
from werkzeug.security import generate_password_hash

def init_db():
    """Crea tablas e inserta el admin inicial si no existe. Idempotente."""
    db.create_all()

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