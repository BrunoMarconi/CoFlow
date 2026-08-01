# Base de Datos - CoFlow

## Objetivo

La base de datos de CoFlow ha sido diseñada para soportar un sistema de búsqueda de compañeros de piso basado en comunidades, compatibilidad de hábitos y capacidad económica.

El objetivo principal es ofrecer una arquitectura escalable, segura y flexible que permita evolucionar el producto sin necesidad de rediseñar la base de datos en futuras versiones.

## Tecnologías

- PostgreSQL como base de datos relacional.
- SQLAlchemy 2.0 como ORM.
- Alembic para migraciones.
- UUID como identificador principal de todas las entidades.
- FastAPI como framework backend.

## Convenciones

Todas las tablas utilizarán UUID como clave primaria.

Todas las tablas incluirán:

- created_at
- updated_at

Las relaciones utilizarán claves foráneas.

No se almacenarán contraseñas en texto plano.

Todos los nombres de tablas estarán en plural.

Todos los nombres de columnas estarán en inglés.



## Users Modulo 1

Representa la identidad del usuario dentro de CoFlow.

No almacena información sobre hábitos ni preferencias de búsqueda.

### Columnas

| Columna       | Tipo         | Descripción                                 |
| ------------- | ------------ | ------------------------------------------- |
| id            | UUID         | Identificador único del usuario.            |
| first_name    | VARCHAR(100) | Nombre.                                     |
| last_name     | VARCHAR(100) | Apellidos.                                  |
| email         | VARCHAR(255) | Correo electrónico (único).                 |
| password_hash | TEXT         | Contraseña cifrada.                         |
| phone         | VARCHAR(30)  | Número de teléfono.                         |
| role          | ENUM         | Rol del usuario (`USER`, `OWNER`, `ADMIN`). |
| is_verified   | BOOLEAN      | Indica si el email ha sido verificado.      |
| created_at    | TIMESTAMP    | Fecha de creación de la cuenta.             |
| updated_at    | TIMESTAMP    | Última modificación de la cuenta.           |


## UserProfiles

Contiene toda la información editable del usuario y utilizada por el algoritmo.

### Columnas

| Columna          | Tipo           Descripción                                           |
| ---------------- | ------------ | ----------------------------------------------------- |
| id               | UUID         | Identificador único del perfil.                       |
| user_id          | UUID         | Usuario al que pertenece el perfil.                   |
| avatar_url       | TEXT         | URL de la foto de perfil.                             |
| birth_date       | DATE         | Fecha de nacimiento.                                  |
| current_city     | VARCHAR(100) | Ciudad donde vive actualmente.                        |
| destination_city | VARCHAR(100) | Ciudad donde quiere mudarse.                          |
| max_budget       | INTEGER      | Presupuesto máximo mensual para el alquiler.          |
| occupation       | VARCHAR(100) | Profesión o situación (Estudiante, Trabajador, etc.). |
| bio              | TEXT         | Descripción breve del usuario.                        |
| move_in_date     | DATE         | Fecha aproximada en la que quiere mudarse.            |
| created_at       | TIMESTAMP    | Fecha de creación del perfil.                         |
| updated_at       | TIMESTAMP    | Última modificación del perfil.                       |


## Questions
Contiene todas las preguntas del unboarding

### Columnas

| Columna       | Tipo         | Descripción                                                                 |
| ------------- | ------------ | --------------------------------------------------------------------------- |
| id            | UUID         | Identificador único de la pregunta.                                         |
| title         | VARCHAR(255) | Texto de la pregunta.                                                       |
| description   | TEXT         | Explicación opcional para ayudar al usuario.                                |
| category      | VARCHAR(100) | Categoría (Limpieza, Sueño, Mascotas, etc.).                                |
| question_type | ENUM         | Tipo de pregunta (`single_choice`, `multiple_choice`, `slider`, `boolean`). |
| weight        | INTEGER      | Peso de la pregunta en el algoritmo de compatibilidad.                      |
| order         | INTEGER      | Orden en el que aparece durante el onboarding.                              |
| is_active     | BOOLEAN      | Indica si la pregunta está activa.                                          |
| created_at    | TIMESTAMP    | Fecha de creación.                                                          |
| updated_at    | TIMESTAMP    | Última modificación.                                                        |


## QuestionOptions
Almacena todas las opciones de respuesta disponibles para cada pregunta del onboarding.

### Columnas

| Columna     | Tipo         | Descripción                                                  |
| ----------- | ------------ | ------------------------------------------------------------ |
| id          | UUID         | Identificador único de la opción.                            |
| question_id | UUID         | Pregunta a la que pertenece la opción.                       |
| label       | VARCHAR(255) | Texto que verá el usuario.                                   |
| value       | INTEGER      | Valor numérico utilizado por el algoritmo de compatibilidad. |
| order       | INTEGER      | Orden en el que aparece la opción.                           |
| created_at  | TIMESTAMP    | Fecha de creación.                                           |
| updated_at  | TIMESTAMP    | Última modificación.                                         |


## UserAnswers
Almacena la respuesta que un usuario ha seleccionado para cada pregunta del onboarding.

No guarda el texto de la respuesta, sino la opción elegida (QuestionOption), permitiendo modificar preguntas y opciones sin afectar a los datos existentes.

### Columnas

| Columna     | Tipo      | Descripción                          |
| ----------- | --------- | ------------------------------------ |
| id          | UUID      | Identificador único de la respuesta. |
| user_id     | UUID      | Usuario que respondió la pregunta.   |
| question_id | UUID      | Pregunta respondida.                 |
| option_id   | UUID      | Opción seleccionada por el usuario.  |
| created_at  | TIMESTAMP | Fecha de creación de la respuesta.   |
| updated_at  | TIMESTAMP | Última modificación de la respuesta. |


## SolvencyPassports

Representa el Pasaporte de Solvencia de un usuario o de una comunidad, certificando que cumple los requisitos económicos para acceder a determinados inmuebles.

El pasaporte no almacena datos bancarios. Únicamente guarda el resultado de la evaluación financiera.

### Columnas

| Columna    | Tipo      | Descripción                                         |
| ---------- | --------- | --------------------------------------------------- |
| id         | UUID      | Identificador único del pasaporte.                  |
| user_id    | UUID      | Usuario propietario del pasaporte.                  |
| type       | ENUM      | Tipo de pasaporte (`BASIC`, `PREMIUM`).             |
| status     | ENUM      | Estado (`PENDING`, `ACTIVE`, `EXPIRED`, `REVOKED`). |
| score      | INTEGER   | Puntuación de solvencia calculada por el sistema.   |
| issued_at  | TIMESTAMP | Fecha de emisión.                                   |
| expires_at | TIMESTAMP | Fecha de expiración.                                |
| created_at | TIMESTAMP | Fecha de creación.                                  |
| updated_at | TIMESTAMP | Última modificación.                                |



## 5. Módulo 2 - Comunidades
    - Communities
    - CommunityMembers
    - Invitations

## 6. Módulo 3 - Propietarios
    - Owners
    - Properties
    - PropertyImages
    - Amenities
    - PropertyAmenities

## 7. Módulo 4 - Solicitudes
    - Applications

## 8. Módulo 5 - Matching
    - Matches

## 9. Módulo 6 - Sistema
    - Notifications

## 10. Relaciones generales

## 11. Reglas de negocio

## 12. Índices

## 13. Estado