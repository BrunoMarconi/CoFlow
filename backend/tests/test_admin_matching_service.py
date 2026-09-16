from app.database.models.compatibility_profile import CompatibilityProfile
from app.database.models.user import User
from app.services.admin_matching_service import calculate_match


BASE_ANSWERS = {
    "cleanliness": "Limpieza frecuente y organizada",
    "dishes": "Los limpio durante el mismo día",
    "common_objects": "Acepto algunos objetos personales",
    "noise": "Tranquilo, con algunos momentos sociales",
    "visits": "Prefiero que avisen con tiempo",
    "sleepovers": "Está bien si se avisa antes",
    "wake_up": "Entre las 7:00 y las 9:00",
    "night_noise": "Acepto un poco de ruido",
    "smoking": "Está bien si se fuma únicamente fuera",
    "alcohol": "Solo ocasionalmente",
    "pets": "Me encantan las mascotas",
    "bills": "Dividir todos los gastos exactamente",
    "food": "Compartir solo productos básicos",
    "communication": "Hablarlo en el momento",
    "conflicts": "Buscando un acuerdo intermedio",
    "rules": "Son importantes, pero pueden adaptarse",
    "culture": "Me encanta conocer culturas diferentes",
    "space": "Busco un equilibrio",
    "lifestyle": "Hacer algunos planes juntos",
}


def make_user(email: str, **overrides: str) -> User:
    answers = {**BASE_ANSWERS, **overrides}
    user = User(
        first_name="Test",
        last_name="User",
        email=email,
        password_hash="hash",
        onboarding_completed=True,
        rental_budget=500,
        interests=["Cocinar", "Senderismo"],
    )
    user.compatibility_profile = CompatibilityProfile(**answers)
    return user


def test_identical_profiles_are_fully_explainable_and_eligible():
    result = calculate_match(make_user("one@example.com"), make_user("two@example.com"))

    assert result.eligible is True
    assert result.score == 100
    assert sum(factor.weight for factor in result.factors) == 100
    assert [factor.key for factor in result.factors] == [
        "cleanliness", "schedule", "sociability", "smoking",
        "noise", "guests", "pets", "lifestyle",
    ]
    assert result.shared_interests == ["Cocinar", "Senderismo"]


def test_smoking_conflict_is_a_blocking_filter():
    non_smoker = make_user("one@example.com", smoking="No quiero convivir con fumadores")
    smoker = make_user("two@example.com", smoking="Yo fumo")

    result = calculate_match(non_smoker, smoker)

    restriction = next(item for item in result.hard_filters if item.key == "restrictions")
    assert restriction.passed is False
    assert result.eligible is False


def test_missing_zone_and_date_are_transparent_not_silent_rejections():
    result = calculate_match(make_user("one@example.com"), make_user("two@example.com"))

    unknown = {item.key: item.passed for item in result.hard_filters}
    assert unknown["zone"] is None
    assert unknown["move_in"] is None
    assert result.eligible is True
