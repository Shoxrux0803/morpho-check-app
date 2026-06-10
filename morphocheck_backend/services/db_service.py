from sqlalchemy.orm import Session
from models.userdata import UserData


def save_user_data(db: Session, data: dict):
    user_data = UserData(**data)
    db.add(user_data)
    db.commit()
    db.refresh(user_data)
    return user_data
