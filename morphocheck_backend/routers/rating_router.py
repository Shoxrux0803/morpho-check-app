# morphocheck_backend/routers/rating_router.py
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
import logging

from utils.database import get_db
from models.rating import Rating           # <-- YANGI: rating modeli
from models.schemas import RatingRequest   # score (alias=rating) bilan

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post(
    "/submit-rating",
    status_code=status.HTTP_201_CREATED,
    tags=["Fikr va baho"],
    summary="Foydalanuvchi reytingini yuborish",
    response_description="Yuborilgan reyting va izoh saqlanadi va qaytariladi",
)
async def submit_rating(payload: RatingRequest, db: Session = Depends(get_db)):
    """
    score/rating: 1..5, comment: ixtiyoriy, user_id/name/email: ixtiyoriy
    """
    # 1) 1..5 oralig'i (pydantic ham tekshiradi, yana aniq qilib qo'yamiz)
    if payload.score is None or not 1 <= int(payload.score) <= 5:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Score (yoki rating) 1 dan 5 gacha bo‘lishi kerak."
        )

    try:
        # 2) DBga yozish
        rec = Rating(
            user_id = payload.user_id,
            score   = int(payload.score),
            comment = payload.comment,
            name    = payload.name,
            email   = str(payload.email) if payload.email else None,
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)

        logger.info("Rating saved: id=%s user_id=%s score=%s", rec.id, rec.user_id, rec.score)

        return {
            "status": "success",
            "message": "Rating saqlandi",
            "data": {
                "id": rec.id,
                "user_id": rec.user_id,
                "score": rec.score,
                "comment": rec.comment,
                "name": rec.name,
                "email": rec.email,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception("Ratingni saqlashda xatolik: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="DB xatosi",
        )
