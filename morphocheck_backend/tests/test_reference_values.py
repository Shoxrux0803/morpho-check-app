from types import SimpleNamespace
import pytest
from routers.ai_router import PredictParamsRequest, predict_params


@pytest.mark.asyncio
async def test_template_reference_is_never_presented_as_ai_or_measured_data():
    result = await predict_params(PredictParamsRequest(age=10, gender="erkak", target_form="analysis"), SimpleNamespace(id=1))
    assert result["mode"] == "reference_only"
    assert result["is_measured"] is False
    assert result["source"] == "interpolated_anthropometric_template"
    assert result["units"]["height"] == "cm"
    assert result["units"]["weight"] == "kg"
    assert result["units"]["totalBodyWater"] == "L"
