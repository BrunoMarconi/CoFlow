from pydantic import BaseModel, ConfigDict


class AmenityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    key: str
    label: str
