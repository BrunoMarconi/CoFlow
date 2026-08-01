from sqlalchemy.orm import Session

from app.database.models.amenity import Amenity


class AmenityService:

    def list_active(self, db: Session) -> list[Amenity]:
        return (
            db.query(Amenity)
            .filter(Amenity.is_active.is_(True))
            .order_by(Amenity.label.asc())
            .all()
        )
