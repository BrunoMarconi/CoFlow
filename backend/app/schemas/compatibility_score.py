from pydantic import BaseModel


class CompatibilityCategoryScore(BaseModel):
    key: str
    label: str
    score: int
    description: str


class CompatibilityScoreResponse(BaseModel):
    categories: list[CompatibilityCategoryScore]
