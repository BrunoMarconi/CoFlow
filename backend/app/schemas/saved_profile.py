from pydantic import BaseModel


class SavedProfileActionResponse(BaseModel):
    saved: bool
