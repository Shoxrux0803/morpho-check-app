from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from io import BytesIO

from services.pdf_services import generate_pdf_file
from services.docx_services import generate_docx_report
from routers.analyze_router import PatientData, calculate_bmi, generate_advices, generate_region_based_id
from utils.database import get_db
from sqlalchemy.orm import Session
from fastapi import Depends

router = APIRouter(tags=["PDF / DOCX Generatsiya"])


class PDFRequest(BaseModel):
    patient_data: dict
    analysis: dict
    advices: dict


@router.post(
    "/report",
    response_description="PDF faylini yaratish",
    responses={
        200: {"content": {"application/pdf": {}}},
        400: {"description": "Noto'g'ri so'rov formati"},
        500: {"description": "Server xatosi"},
    },
)
async def generate_pdf_endpoint(request_data: PatientData, db: Session = Depends(get_db)):
    try:
        # Reconstruct full data payload for pdf builder
        analysis = calculate_bmi(request_data)
        gender_norm = (request_data.gender or "").strip().lower()
        advices = generate_advices(analysis["bmi"], analysis["weight_diff"], int(request_data.age), gender_norm)
        
        data_dict = request_data.model_dump(by_alias=False)
        
        # Ensure ID code is present
        if not data_dict.get("id_code"):
            clean_region = (data_dict.get("region") or "").strip()
            data_dict["id_code"] = generate_region_based_id(db, clean_region)

        data_dict["analysis"] = analysis
        data_dict["advices"] = advices

        buffer = generate_pdf_file(data_dict)

        if not isinstance(buffer, BytesIO):
            raise HTTPException(status_code=500, detail="PDF generatsiyasi noto'g'ri formatda")

        buffer.seek(0)
        return StreamingResponse(
            content=buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=morphocheck.pdf",
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"PDF generatsiyasida xato: {str(e)}")


@router.post(
    "/generate-docx",
    response_description="DOCX faylini yaratish",
    responses={
        200: {
            "content": {
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {}
            }
        },
        400: {"description": "Noto'g'ri so'rov formati"},
        500: {"description": "Server xatosi"},
    },
)
async def generate_docx_endpoint(request_data: PatientData, db: Session = Depends(get_db)):
    """
    Kiritilgan ma'lumotlardan kirillcha DOCX anketasi yaratib yuklaydi.
    """
    try:
        # Reconstruct full data payload for docx builder
        analysis = calculate_bmi(request_data)
        gender_norm = (request_data.gender or "").strip().lower()
        advices = generate_advices(analysis["bmi"], analysis["weight_diff"], int(request_data.age), gender_norm)
        
        data_dict = request_data.model_dump(by_alias=False)
        
        # Ensure ID code is present
        if not data_dict.get("id_code"):
            clean_region = (data_dict.get("region") or "").strip()
            data_dict["id_code"] = generate_region_based_id(db, clean_region)

        data_dict["analysis"] = analysis
        data_dict["advices"] = advices

        buffer = generate_docx_report(data_dict)

        if not isinstance(buffer, BytesIO):
            raise HTTPException(status_code=500, detail="DOCX generatsiyasi noto'g'ri formatda")

        buffer.seek(0)
        return StreamingResponse(
            content=buffer,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": "attachment; filename=morphocheck_anketa.docx",
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"DOCX generatsiyasida xato: {str(e)}")