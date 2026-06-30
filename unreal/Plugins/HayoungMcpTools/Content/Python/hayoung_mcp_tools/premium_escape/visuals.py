from __future__ import annotations

from dataclasses import dataclass
from typing import Final, TypeAlias

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _spawn

from .level_ops import color
from .specs import RoomSpec

Color: TypeAlias = tuple[float, float, float]
Scale: TypeAlias = tuple[float, float, float]

MATERIAL_DIR: Final[str] = "/Game/Hayoung500/Materials"


@dataclass(frozen=True, slots=True)
class VisualMaterialSpec:
    key: str
    base: Color
    roughness: float
    metallic: float
    emissive: float


@dataclass(frozen=True, slots=True)
class RoomMaterialProfile:
    prefix: str
    wall_key: str
    floor_key: str
    accent_key: str
    prop_key: str


@dataclass(frozen=True, slots=True)
class GlowPropSpec:
    name: str
    x_ratio: float
    y_ratio: float
    z: float
    scale: Scale
    material_key: str
    light_power: float


@dataclass(frozen=True, slots=True)
class VectorParamSpec:
    name: str
    value: Color
    prop: "unreal.MaterialProperty"


@dataclass(frozen=True, slots=True)
class ScalarParamSpec:
    name: str
    value: float
    prop: "unreal.MaterialProperty"


MATERIAL_SPECS: Final[tuple[VisualMaterialSpec, ...]] = (
    VisualMaterialSpec("WarmPlaster", (0.78, 0.63, 0.50), 0.82, 0.0, 0.0),
    VisualMaterialSpec("StoneFloor", (0.28, 0.25, 0.23), 0.74, 0.0, 0.0),
    VisualMaterialSpec("WalnutDark", (0.20, 0.11, 0.07), 0.58, 0.0, 0.0),
    VisualMaterialSpec("BrassEdge", (0.95, 0.66, 0.28), 0.33, 0.8, 0.0),
    VisualMaterialSpec("GlassTeal", (0.32, 0.92, 0.88), 0.22, 0.0, 0.75),
    VisualMaterialSpec("RainBlue", (0.24, 0.38, 0.95), 0.46, 0.0, 0.95),
    VisualMaterialSpec("NeonAmber", (1.0, 0.46, 0.18), 0.28, 0.0, 1.15),
    VisualMaterialSpec("HeavenPearl", (0.82, 0.90, 1.0), 0.38, 0.0, 0.55),
    VisualMaterialSpec("RoseGlow", (1.0, 0.42, 0.62), 0.34, 0.0, 0.9),
    VisualMaterialSpec("DeepShadow", (0.035, 0.032, 0.038), 0.9, 0.0, 0.0),
)

ROOM_MATERIALS: Final[tuple[RoomMaterialProfile, ...]] = (
    RoomMaterialProfile("PremiumEscape_Room01_DiaryArchive", "WarmPlaster", "WalnutDark", "RoseGlow", "BrassEdge"),
    RoomMaterialProfile("PremiumEscape_Room02_CafePromise", "WarmPlaster", "StoneFloor", "GlassTeal", "WalnutDark"),
    RoomMaterialProfile("PremiumEscape_Room03_RainRepair", "DeepShadow", "StoneFloor", "RainBlue", "GlassTeal"),
    RoomMaterialProfile("PremiumEscape_Room04_NightCity", "DeepShadow", "StoneFloor", "NeonAmber", "BrassEdge"),
    RoomMaterialProfile("PremiumEscape_Room05_HeavenVault", "HeavenPearl", "StoneFloor", "HeavenPearl", "RoseGlow"),
)

GLOW_PROPS: Final[tuple[GlowPropSpec, ...]] = (
    GlowPropSpec("BackWall_CinematicWash", 0.0, 0.485, 190.0, (3.6, 0.018, 1.05), "GlassTeal", 900.0),
    GlowPropSpec("Left_CoveLight_Rail", -0.485, -0.18, 238.0, (0.028, 2.35, 0.045), "RoseGlow", 620.0),
    GlowPropSpec("Right_CoveLight_Rail", 0.485, 0.18, 238.0, (0.028, 2.35, 0.045), "NeonAmber", 620.0),
    GlowPropSpec("Ceiling_Practical_Diffuser", -0.12, -0.04, 0.0, (0.72, 0.72, 0.035), "HeavenPearl", 760.0),
    GlowPropSpec("Puzzle_Focus_Pool", 0.26, -0.28, 34.0, (0.88, 0.48, 0.022), "BrassEdge", 520.0),
)


def material_path(key: str) -> str:
    name = f"M_PE_{key}"
    return f"{MATERIAL_DIR}/{name}.{name}"


def wall_material_path(room: RoomSpec) -> str:
    return material_path(_profile(room).wall_key)


def floor_material_path(room: RoomSpec) -> str:
    return material_path(_profile(room).floor_key)


def accent_material_path(room: RoomSpec) -> str:
    return material_path(_profile(room).accent_key)


def prop_material_path(room: RoomSpec) -> str:
    return material_path(_profile(room).prop_key)


def ensure_visual_materials() -> int:
    unreal.EditorAssetLibrary.make_directory(MATERIAL_DIR)
    created = 0
    for spec in MATERIAL_SPECS:
        if not unreal.EditorAssetLibrary.does_asset_exist(_asset_path(spec.key)):
            if _create_material(spec):
                created += 1
    return created


def spawn_global_visuals() -> int:
    count = 0
    count += _spawn_post_process()
    count += _spawn_fog()
    count += _spawn_sky_light()
    _point_light("PE_Visual_Global_WarmLift", unreal.Vector(2200.0, -720.0, 560.0), unreal.LinearColor(1.0, 0.82, 0.62, 1.0), 3200.0, 4600.0)
    _point_light("PE_Visual_Global_MoonFill", unreal.Vector(2800.0, 980.0, 620.0), unreal.LinearColor(0.44, 0.58, 1.0, 1.0), 2400.0, 5200.0)
    return count + 2


def spawn_room_visuals(room: RoomSpec) -> int:
    half_w = room.width / 2.0
    half_d = room.depth / 2.0
    accent = color(room)
    count = 0
    _cube(f"PE_Visual_{room.prefix}_FloorFinish", unreal.Vector(room.x, 0.0, -2.0), unreal.Vector(room.width / 100.0, room.depth / 100.0, 0.018), floor_material_path(room))
    _cube(f"PE_Visual_{room.prefix}_BackWallFinish", unreal.Vector(room.x, half_d - 3.0, room.height / 2.0), unreal.Vector(room.width / 100.0, 0.025, room.height / 100.0), wall_material_path(room))
    _cube(f"PE_Visual_{room.prefix}_CeilingVignette", unreal.Vector(room.x, 0.0, room.height + 2.0), unreal.Vector(room.width / 100.0, room.depth / 100.0, 0.025), material_path("DeepShadow"))
    count += 3
    for spec in GLOW_PROPS:
        count += _spawn_glow_prop(room, spec)
    _point_light(f"PE_Visual_{room.prefix}_Hero_KeyLight", unreal.Vector(room.x - half_w * 0.28, -half_d * 0.32, room.height - 72.0), accent, 2300.0, max(room.width, room.depth) * 0.95)
    _point_light(f"PE_Visual_{room.prefix}_Lock_ContactLight", unreal.Vector(room.x + half_w * 0.31, -half_d * 0.18, 115.0), accent, 920.0, 360.0)
    _point_light(f"PE_Visual_{room.prefix}_Back_SilhouetteLight", unreal.Vector(room.x, half_d * 0.42, room.height - 120.0), accent, 1450.0, 560.0)
    count += 3
    return count + _spawn_room_signature(room)


def _profile(room: RoomSpec) -> RoomMaterialProfile:
    for profile in ROOM_MATERIALS:
        if profile.prefix == room.prefix:
            return profile
    return ROOM_MATERIALS[0]


def _asset_path(key: str) -> str:
    return f"{MATERIAL_DIR}/M_PE_{key}"


def _create_material(spec: VisualMaterialSpec) -> bool:
    asset_tools = unreal.AssetToolsHelpers.get_asset_tools()
    material = asset_tools.create_asset(f"M_PE_{spec.key}", MATERIAL_DIR, unreal.Material, unreal.MaterialFactoryNew())
    if not material:
        return False
    _connect_vector(material, VectorParamSpec("BaseColor", spec.base, unreal.MaterialProperty.MP_BASE_COLOR))
    _connect_scalar(material, ScalarParamSpec("Roughness", spec.roughness, unreal.MaterialProperty.MP_ROUGHNESS))
    _connect_scalar(material, ScalarParamSpec("Metallic", spec.metallic, unreal.MaterialProperty.MP_METALLIC))
    if spec.emissive > 0.0:
        _connect_vector(material, VectorParamSpec("Emissive", _emissive(spec), unreal.MaterialProperty.MP_EMISSIVE_COLOR))
    unreal.MaterialEditingLibrary.recompile_material(material)
    unreal.EditorAssetLibrary.save_asset(_asset_path(spec.key), only_if_is_dirty=True)
    return True


def _connect_vector(material: "unreal.Material", spec: VectorParamSpec) -> None:
    node = unreal.MaterialEditingLibrary.create_material_expression(material, unreal.MaterialExpressionVectorParameter, -420, -120)
    node.set_editor_property("parameter_name", spec.name)
    node.set_editor_property("default_value", unreal.LinearColor(spec.value[0], spec.value[1], spec.value[2], 1.0))
    unreal.MaterialEditingLibrary.connect_material_property(node, "", spec.prop)


def _connect_scalar(material: "unreal.Material", spec: ScalarParamSpec) -> None:
    node = unreal.MaterialEditingLibrary.create_material_expression(material, unreal.MaterialExpressionScalarParameter, -160, 80)
    node.set_editor_property("parameter_name", spec.name)
    node.set_editor_property("default_value", spec.value)
    unreal.MaterialEditingLibrary.connect_material_property(node, "", spec.prop)


def _emissive(spec: VisualMaterialSpec) -> Color:
    return (spec.base[0] * spec.emissive, spec.base[1] * spec.emissive, spec.base[2] * spec.emissive)


def _spawn_glow_prop(room: RoomSpec, spec: GlowPropSpec) -> int:
    half_w = room.width / 2.0
    half_d = room.depth / 2.0
    z = room.height - 56.0 if spec.z == 0.0 else spec.z
    location = unreal.Vector(room.x + half_w * spec.x_ratio, half_d * spec.y_ratio, z)
    _cube(f"PE_Visual_{room.prefix}_{spec.name}", location, unreal.Vector(spec.scale[0], spec.scale[1], spec.scale[2]), material_path(spec.material_key))
    _point_light(f"PE_Visual_{room.prefix}_{spec.name}_Glow", unreal.Vector(location.x, location.y, location.z + 32.0), color(room), spec.light_power, 330.0)
    return 2


def _spawn_room_signature(room: RoomSpec) -> int:
    accent_path = accent_material_path(room)
    _shape(f"PE_Visual_{room.prefix}_Signature_OrbitalRing", "Cylinder", unreal.Vector(room.x, -room.depth * 0.36, 128.0), unreal.Vector(0.72, 0.72, 0.035), accent_path)
    _cube(f"PE_Visual_{room.prefix}_Signature_RevealPanel", unreal.Vector(room.x - room.width * 0.32, room.depth * 0.33, 146.0), unreal.Vector(0.038, 0.82, 0.64), accent_path)
    return 2


def _spawn_post_process() -> int:
    actor = _spawn(unreal.PostProcessVolume, unreal.Vector(2200.0, 0.0, 220.0), label="PE_Visual_Global_PostProcessVolume")
    actor.set_editor_property("unbound", True)
    actor.set_editor_property("blend_weight", 1.0)
    return 1


def _spawn_fog() -> int:
    actor = _spawn(unreal.ExponentialHeightFog, unreal.Vector(2200.0, 0.0, 0.0), label="PE_Visual_Global_ExponentialHeightFog")
    component = actor.get_component_by_class(unreal.ExponentialHeightFogComponent)
    if component:
        component.set_editor_property("fog_density", 0.018)
        component.set_editor_property("fog_height_falloff", 0.22)
    return 1


def _spawn_sky_light() -> int:
    actor = _spawn(unreal.SkyLight, unreal.Vector(2200.0, 0.0, 420.0), label="PE_Visual_Global_SkyLight")
    component = actor.get_component_by_class(unreal.SkyLightComponent)
    if component:
        component.set_editor_property("intensity", 0.42)
        component.set_editor_property("light_color", unreal.Color(180, 205, 255, 255))
    return 1
