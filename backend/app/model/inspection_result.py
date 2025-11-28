from sqlalchemy import MetaData, Table
from app.database import engine
from sqlalchemy import select

metadata = MetaData()

inspection_result_raw = Table(
    "v_inspection_result",
    metadata,
    autoload_with=engine,
    schema="pms_schema"
)



inspection_result = (
    select(
        inspection_result_raw.c.strip_id,
        inspection_result_raw.c.test_id,
        inspection_result_raw.c.ai_date_time,
        inspection_result_raw.c.core_version,
        inspection_result_raw.c.rms_customer,
        inspection_result_raw.c.file_name,
        inspection_result_raw.c.inspection_machine,
        inspection_result_raw.c.lot_no,
        inspection_result_raw.c.body_id,
        inspection_result_raw.c.n_unit_x,
        inspection_result_raw.c.n_unit_y,
        inspection_result_raw.c.rel_x_unit,
        inspection_result_raw.c.rel_y_unit,
        inspection_result_raw.c.defect_height,
        inspection_result_raw.c.defect_width,
        inspection_result_raw.c.skip_data,
        inspection_result_raw.c.bundle_no,
        inspection_result_raw.c.defect_code,
        inspection_result_raw.c.afvi_ai_keyin,
        inspection_result_raw.c.afvi_ai_defect,
        inspection_result_raw.c.afvi_ai_longest,
        inspection_result_raw.c.afvi_ai_gv,         
        inspection_result_raw.c.afvi_clf_defect,
        inspection_result_raw.c.afvi_clf_score,
        inspection_result_raw.c.afvi_false_defect,
        inspection_result_raw.c.afvi_false_score,
        inspection_result_raw.c.ivs_keyin1,
        inspection_result_raw.c.image_path,
    )
    .where(inspection_result_raw.c.inspection_machine.like("M__V%"))
).subquery()