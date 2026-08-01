"""add owner profiles, properties, property images and amenities

Revision ID: d4e7b2a91f0c
Revises: c1f4a9d2e6b3
Create Date: 2026-07-31 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e7b2a91f0c'
down_revision: Union[str, Sequence[str], None] = 'c1f4a9d2e6b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


AMENITIES = [
    {"key": "wifi", "label": "Wi-Fi"},
    {"key": "air_conditioning", "label": "Aire acondicionado"},
    {"key": "heating", "label": "Calefacción"},
    {"key": "washing_machine", "label": "Lavadora"},
    {"key": "dishwasher", "label": "Lavavajillas"},
    {"key": "terrace", "label": "Terraza"},
    {"key": "balcony", "label": "Balcón"},
    {"key": "elevator", "label": "Ascensor"},
    {"key": "garage", "label": "Garaje"},
    {"key": "storage_room", "label": "Trastero"},
    {"key": "workspace", "label": "Zona de trabajo"},
    {"key": "accessibility", "label": "Accesibilidad"},
    {"key": "pool", "label": "Piscina"},
    {"key": "garden", "label": "Jardín"},
]


def upgrade() -> None:
    """Upgrade schema."""
    # Los enums se crean implícitamente como parte del DDL de
    # create_table (igual que en la migración b0824d3c7f7d, que crea
    # varias tablas nuevas con columnas Enum sin invocar .create() por
    # separado). Llamar aquí a .create() además causaría un intento de
    # creación duplicada del tipo Postgres.
    owner_type_enum = sa.Enum(
        'INDIVIDUAL', 'COMPANY', 'AGENCY',
        name='owner_type',
    )

    property_type_enum = sa.Enum(
        'APARTMENT', 'HOUSE', 'STUDIO', 'SHARED_APARTMENT', 'OTHER',
        name='property_type',
    )

    property_status_enum = sa.Enum(
        'DRAFT', 'READY', 'PAUSED', 'PUBLISHED', 'RENTED', 'ARCHIVED',
        name='property_status',
    )

    op.create_table(
        'owner_profiles',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('owner_type', owner_type_enum, nullable=False),
        sa.Column('display_name', sa.String(length=120), nullable=False),
        sa.Column('phone', sa.String(length=30), nullable=False),
        sa.Column('contact_email', sa.String(length=255), nullable=False),
        sa.Column('company_name', sa.String(length=150), nullable=True),
        sa.Column('tax_id', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', name='uq_owner_profiles_user_id'),
    )

    op.create_table(
        'properties',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('owner_profile_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('property_type', property_type_enum, nullable=False),
        sa.Column(
            'status', property_status_enum, nullable=False,
            server_default='DRAFT',
        ),
        sa.Column('address_line', sa.String(length=200), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False),
        sa.Column('province', sa.String(length=100), nullable=False),
        sa.Column('postal_code', sa.String(length=15), nullable=False),
        sa.Column('neighborhood', sa.String(length=120), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('surface_m2', sa.Integer(), nullable=True),
        sa.Column('bedrooms', sa.Integer(), nullable=False),
        sa.Column('bathrooms', sa.Integer(), nullable=False),
        sa.Column('floor', sa.String(length=20), nullable=True),
        sa.Column(
            'has_elevator', sa.Boolean(), nullable=False,
            server_default=sa.false(),
        ),
        sa.Column(
            'furnished', sa.Boolean(), nullable=False,
            server_default=sa.false(),
        ),
        sa.Column('max_tenants', sa.Integer(), nullable=False),
        sa.Column('total_monthly_rent', sa.Integer(), nullable=True),
        sa.Column('deposit', sa.Integer(), nullable=True),
        sa.Column(
            'utilities_included', sa.Boolean(), nullable=False,
            server_default=sa.false(),
        ),
        sa.Column('available_from', sa.Date(), nullable=True),
        sa.Column('minimum_stay_months', sa.Integer(), nullable=True),
        sa.Column('pets_allowed', sa.Boolean(), nullable=True),
        sa.Column('smoking_allowed', sa.Boolean(), nullable=True),
        sa.Column('couples_allowed', sa.Boolean(), nullable=True),
        sa.Column('students_allowed', sa.Boolean(), nullable=True),
        sa.Column('registration_allowed', sa.Boolean(), nullable=True),
        sa.Column('additional_requirements', sa.Text(), nullable=True),
        sa.Column('ready_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('rented_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('archived_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ['owner_profile_id'], ['owner_profiles.id'], ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_properties_owner_profile_id'),
        'properties', ['owner_profile_id'], unique=False,
    )

    op.create_table(
        'property_images',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('property_id', sa.Integer(), nullable=False),
        sa.Column('storage_key', sa.String(length=255), nullable=False),
        sa.Column('image_url', sa.String(length=500), nullable=False),
        sa.Column(
            'position', sa.Integer(), nullable=False, server_default='0',
        ),
        sa.Column(
            'is_cover', sa.Boolean(), nullable=False,
            server_default=sa.false(),
        ),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ['property_id'], ['properties.id'], ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_property_images_property_id'),
        'property_images', ['property_id'], unique=False,
    )

    op.create_table(
        'amenities',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('key', sa.String(length=50), nullable=False),
        sa.Column('label', sa.String(length=100), nullable=False),
        sa.Column(
            'is_active', sa.Boolean(), nullable=False,
            server_default=sa.true(),
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key', name='uq_amenities_key'),
    )

    op.create_table(
        'property_amenities',
        sa.Column('property_id', sa.Integer(), nullable=False),
        sa.Column('amenity_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ['amenity_id'], ['amenities.id'], ondelete='CASCADE',
        ),
        sa.ForeignKeyConstraint(
            ['property_id'], ['properties.id'], ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('property_id', 'amenity_id'),
    )

    # Semilla de amenities iniciales. No existe infraestructura de seeds
    # independiente de Alembic en el proyecto, así que se insertan aquí,
    # dentro de la propia migración que crea la tabla.
    amenities_table = sa.table(
        'amenities',
        sa.column('key', sa.String),
        sa.column('label', sa.String),
        sa.column('is_active', sa.Boolean),
    )
    op.bulk_insert(
        amenities_table,
        [
            {**amenity, "is_active": True}
            for amenity in AMENITIES
        ],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('property_amenities')
    op.drop_table('amenities')

    op.drop_index(
        op.f('ix_property_images_property_id'),
        table_name='property_images',
    )
    op.drop_table('property_images')

    op.drop_index(
        op.f('ix_properties_owner_profile_id'), table_name='properties',
    )
    op.drop_table('properties')

    op.drop_table('owner_profiles')

    sa.Enum(name='property_status').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='property_type').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='owner_type').drop(op.get_bind(), checkfirst=True)
