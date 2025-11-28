from sqlalchemy import case, select
from app.model import inspection_result

NORMALIZED_RESULT = case(
    (inspection_result.c.afvi_ai_keyin.ilike("%AI_OK%"), "OK"),
    (
        inspection_result.c.afvi_ai_keyin.in_([
            "AI_UNKNOWN_NG1",
            "AI_UNKNOWN_NG1_LOGIT",
            "AI_NG_NG1",
            "AI_NG_NG1_LOGIT",
            "AI_NG_NG1_UNDERCUT"
        ]),
        "NG"
    ),
    (inspection_result.c.afvi_ai_keyin == "AI_ICS_Recheck", "ICS_Recheck"),
    (inspection_result.c.afvi_ai_keyin.ilike("AI_UNKNOWN%"), "UNKNOWN"),
    else_=inspection_result.c.afvi_ai_keyin
).label("norm_result")

PRIORITY = case(
    (NORMALIZED_RESULT == "NG", 1),
    (NORMALIZED_RESULT == "ICS_Recheck", 2),
    (NORMALIZED_RESULT == "UNKNOWN", 3),
    else_=4
).label("priority")

