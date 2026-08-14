from app.database.models.compatibility_profile import CompatibilityProfile
from app.schemas.compatibility_score import CompatibilityCategoryScore

# Cada pregunta del test de onboarding tiene 4 opciones, en el mismo
# orden que frontend/src/app/(auth)/onboarding/page.tsx (array STAGES).
# Este módulo es la única fuente de verdad para pasar esas respuestas
# de texto a un score 0-100: si cambia el copy de una opción ahí,
# debe actualizarse aquí también.
QUESTION_OPTIONS: dict[str, list[str]] = {
    "cleanliness": ["Muy relajado", "Limpieza básica semanal", "Limpieza frecuente y organizada", "Nivel de limpieza muy alto"],
    "dishes": ["Los lavo justo después de usarlos", "Los limpio durante el mismo día", "Pueden quedarse hasta el día siguiente", "No me importa que se acumulen"],
    "common_objects": ["Prefiero las zonas comunes despejadas", "Acepto algunos objetos personales", "Me da bastante igual", "Me gusta que la casa se sienta vivida"],
    "noise": ["Muy tranquilo y silencioso", "Tranquilo, con algunos momentos sociales", "Social y con bastante actividad", "Muy animado y abierto"],
    "visits": ["Siempre deberían avisar", "Prefiero que avisen con tiempo", "No me importa alguna visita espontánea", "Me encantan las visitas espontáneas"],
    "sleepovers": ["Solo en ocasiones especiales", "Está bien si se avisa antes", "No me importa mientras sea razonable", "No tengo ningún problema"],
    "wake_up": ["Antes de las 7:00", "Entre las 7:00 y las 9:00", "Entre las 9:00 y las 11:00", "Después de las 11:00"],
    "night_noise": ["Necesito silencio", "Acepto un poco de ruido", "Me adapto bastante bien", "Normalmente no me afecta"],
    "smoking": ["No quiero convivir con fumadores", "Está bien si se fuma únicamente fuera", "Me da igual", "Yo fumo"],
    "alcohol": ["Prefiero evitarlo", "Solo ocasionalmente", "Me da igual", "Forma parte de mi vida social"],
    "pets": ["Prefiero vivir sin mascotas", "Depende del animal", "Me encantan las mascotas", "Tengo mascota"],
    "bills": ["Dividir todos los gastos exactamente", "Una persona paga y después se compensa", "Crear un fondo común", "Me adapto al sistema del piso"],
    "food": ["Cada persona compra su comida", "Compartir solo productos básicos", "Hacer algunas compras juntos", "Compartir la mayoría de la comida"],
    "communication": ["Hablarlo en el momento", "Esperar a estar tranquilos", "Hablarlo en una reunión de convivencia", "Prefiero escribirlo por mensaje"],
    "conflicts": ["Hablando directamente", "Buscando un acuerdo intermedio", "Necesito tiempo antes de hablar", "Intento evitar las discusiones"],
    "rules": ["Deben estar muy claras y cumplirse", "Son importantes, pero pueden adaptarse", "Solo necesitamos algunas reglas básicas", "Prefiero una convivencia espontánea"],
    "culture": ["Me encanta conocer culturas diferentes", "Soy bastante abierto", "Depende de las costumbres", "Prefiero convivir con personas parecidas a mí"],
    "space": ["Necesito mucho tiempo a solas", "Necesito bastante espacio personal", "Busco un equilibrio", "Me encanta hacer vida en común"],
    "lifestyle": ["Compartir gastos y mantener independencia", "Tener una relación cordial", "Hacer algunos planes juntos", "Crear una amistad y una comunidad"],
}

# True = el índice 0 de la opción representa el valor más bajo del eje
# (se puntúa idx/3*100). False = el índice 0 representa el valor más
# alto (se puntúa (3-idx)/3*100).
QUESTION_DIRECTION: dict[str, bool] = {
    "cleanliness": True,
    "dishes": False,
    "common_objects": False,
    "noise": True,
    "visits": True,
    "sleepovers": True,
    "wake_up": False,
    "night_noise": False,
    "smoking": True,
    "alcohol": True,
    "pets": True,
    "bills": False,
    "food": False,
    "communication": False,
    "conflicts": False,
    "rules": False,
    "culture": False,
    "space": True,
    "lifestyle": True,
}

CATEGORY_QUESTIONS: dict[str, list[str]] = {
    "cleanliness": ["cleanliness", "dishes", "common_objects"],
    "social_energy": ["noise", "visits", "sleepovers"],
    "schedule": ["wake_up", "night_noise"],
    "financial": ["bills", "food"],
    "conflict": ["communication", "conflicts", "rules"],
    "tolerance": ["smoking", "alcohol", "pets", "culture", "space", "lifestyle"],
}

CATEGORY_LABELS: dict[str, str] = {
    "cleanliness": "Limpieza",
    "social_energy": "Energía Social",
    "schedule": "Horario",
    "financial": "Financiero",
    "conflict": "Conflictos",
    "tolerance": "Tolerancia",
}

# (umbral mínimo, descripción) evaluados de mayor a menor.
CATEGORY_DESCRIPTIONS: dict[str, list[tuple[int, str]]] = {
    "cleanliness": [
        (80, "Muy ordenado/a y meticuloso/a"),
        (60, "Cuidadoso/a con el orden diario"),
        (40, "Orden moderado, sin obsesionarse"),
        (0, "Convivencia relajada con el orden"),
    ],
    "social_energy": [
        (80, "Muy sociable, le encanta tener gente en casa"),
        (60, "Disfruta de un ambiente animado"),
        (40, "Valora la tranquilidad del hogar"),
        (0, "Prioriza la calma y el silencio"),
    ],
    "schedule": [
        (80, "Madrugador/a muy disciplinado/a"),
        (60, "Rutina bastante marcada"),
        (40, "Rutina moderada"),
        (0, "Ritmo flexible, sin horarios fijos"),
    ],
    "financial": [
        (80, "Prefiere independencia económica total"),
        (60, "Le gusta mantener las cuentas claras"),
        (40, "Equilibrio entre compartir y ser independiente"),
        (0, "Le gusta compartir gastos y compras"),
    ],
    "conflict": [
        (80, "Muy directo/a resolviendo conflictos"),
        (60, "Comunicación directa y proactiva"),
        (40, "Prefiere hablar las cosas con calma"),
        (0, "Prefiere evitar la confrontación"),
    ],
    "tolerance": [
        (80, "Muy flexible y adaptable"),
        (60, "Bastante abierto/a a otras formas de convivir"),
        (40, "Se adapta si las diferencias no son grandes"),
        (0, "Prefiere convivir con personas afines a él/ella"),
    ],
}


def _question_score(question: str, value: str) -> float:
    options = QUESTION_OPTIONS[question]
    index = options.index(value) if value in options else 1.5
    if not QUESTION_DIRECTION[question]:
        index = 3 - index
    return index / 3 * 100


def _describe(category: str, score: int) -> str:
    for threshold, text in CATEGORY_DESCRIPTIONS[category]:
        if score >= threshold:
            return text
    return CATEGORY_DESCRIPTIONS[category][-1][1]


def compute_category_scores(
    profile: CompatibilityProfile,
) -> list[CompatibilityCategoryScore]:
    categories = []
    for key, questions in CATEGORY_QUESTIONS.items():
        question_scores = [
            _question_score(question, getattr(profile, question))
            for question in questions
        ]
        score = round(sum(question_scores) / len(question_scores))
        categories.append(
            CompatibilityCategoryScore(
                key=key,
                label=CATEGORY_LABELS[key],
                score=score,
                description=_describe(key, score),
            )
        )
    return categories


def average_category_scores(
    all_scores: list[list[CompatibilityCategoryScore]],
) -> list[CompatibilityCategoryScore]:
    if not all_scores:
        return []

    averaged = []
    for key in CATEGORY_QUESTIONS:
        values = [
            category.score
            for scores in all_scores
            for category in scores
            if category.key == key
        ]
        score = round(sum(values) / len(values))
        averaged.append(
            CompatibilityCategoryScore(
                key=key,
                label=CATEGORY_LABELS[key],
                score=score,
                description=_describe(key, score),
            )
        )
    return averaged
