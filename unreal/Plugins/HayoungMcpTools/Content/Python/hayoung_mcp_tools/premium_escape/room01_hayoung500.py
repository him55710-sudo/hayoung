from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Final

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _point_light, _shape, _spawn, _text

from .audio import ensure_audio_assets
from .lighting_build_fix import apply_dynamic_lighting_policy
from .room1_memory_assets import ensure_beef_board_material, ensure_room1_image_material
from .room1_memory_specs import (
    BIRTHDAY_GIFT_IMAGE,
    HUNDRED_DAY_IMAGE,
    JATJEOL_CONFESSION_IMAGE,
    PHILIPPINES_TRIP_IMAGE,
    VIOLIN_KEYRING_IMAGE,
)
from .visuals import ensure_visual_materials, material_path


LEVEL_PATH: Final[str] = "/Game/Maps/Room01_Hayoung500"
PREFIX: Final[str] = "R01_"
MATERIAL_DIR: Final[str] = "/Game/Hayoung500/Room01/Materials"
BLUEPRINT_DIR: Final[str] = "/Game/Hayoung500/Blueprints"
AUDIO_DIR: Final[str] = "/Game/Hayoung500/Room01/Audio"

ROOM_WIDTH_CM: Final[float] = 900.0
ROOM_DEPTH_CM: Final[float] = 700.0
ROOM_HEIGHT_CM: Final[float] = 320.0


@dataclass(frozen=True, slots=True)
class MaterialSpec:
    key: str
    base_color: tuple[float, float, float]
    roughness: float = 0.75
    metallic: float = 0.0
    emissive: float = 0.0


@dataclass(frozen=True, slots=True)
class CameraSpec:
    label: str
    location: tuple[float, float, float]
    rotation: tuple[float, float, float]
    description: str


ROOM_MATERIALS: Final[tuple[MaterialSpec, ...]] = (
    MaterialSpec("AgedPlaster", (0.62, 0.50, 0.39), 0.92),
    MaterialSpec("OldWallpaper", (0.44, 0.31, 0.27), 0.88),
    MaterialSpec("WainscotWalnut", (0.19, 0.10, 0.055), 0.64),
    MaterialSpec("WalnutPlank", (0.24, 0.13, 0.070), 0.58),
    MaterialSpec("DarkCrevice", (0.025, 0.020, 0.018), 0.95),
    MaterialSpec("DustStain", (0.10, 0.082, 0.065), 0.96),
    MaterialSpec("OldPaper", (0.78, 0.68, 0.53), 0.82),
    MaterialSpec("PhotoPaper", (0.86, 0.80, 0.70), 0.52),
    MaterialSpec("Brass", (0.95, 0.61, 0.25), 0.32, 0.72),
    MaterialSpec("BlackIron", (0.035, 0.032, 0.030), 0.70, 0.45),
    MaterialSpec("AmberGlow", (1.0, 0.58, 0.22), 0.30, 0.0, 1.45),
    MaterialSpec("CandleWarm", (1.0, 0.74, 0.36), 0.36, 0.0, 1.10),
    MaterialSpec("RoseRed", (0.74, 0.15, 0.14), 0.62),
    MaterialSpec("ButtonYellow", (1.0, 0.82, 0.18), 0.40, 0.10),
    MaterialSpec("ButtonGreen", (0.20, 0.70, 0.32), 0.46),
    MaterialSpec("ButtonBlue", (0.22, 0.38, 0.86), 0.46),
    MaterialSpec("Porcelain", (0.86, 0.82, 0.74), 0.34),
    MaterialSpec("Meat", (0.62, 0.16, 0.10), 0.54),
    MaterialSpec("Glass", (0.40, 0.78, 0.78), 0.18, 0.0, 0.20),
)


CAMERAS: Final[tuple[CameraSpec, ...]] = (
    CameraSpec("EntranceOverview", (0.0, -305.0, 160.0), (-8.0, 0.0, 0.0), "입구에서 1번 방 전체와 동선 유도 조명을 보는 샷"),
    CameraSpec("DeskLetterCloseup", (-325.0, -255.0, 122.0), (-6.0, 42.0, 0.0), "책상, 편지, vita500 자물쇠 박스 클로즈업"),
    CameraSpec("FramesViolinMusic", (-120.0, 172.0, 172.0), (-7.0, 20.0, 0.0), "추억 액자 4개, 바이올린 수납 액자, 오르골 선반"),
    CameraSpec("GuroPyeongsangGrid", (-150.0, -25.0, 248.0), (-55.0, 28.0, 0.0), "중앙 3x3 숫자판과 구로평상 퍼즐"),
    CameraSpec("BeefDoorFinal", (270.0, -135.0, 152.0), (-9.0, 53.0, 0.0), "소고기 부위 퍼즐, A/B 시식 테이블, Room 2 문"),
)


def build_room01_hayoung500(enable_audio: bool = True) -> str:
    _open_or_create_level()
    _clear_room01_actors()

    ensure_visual_materials()
    material_count = _ensure_room01_materials()
    blueprint_result = _ensure_room01_blueprints()
    audio_assets = ensure_audio_assets() if enable_audio else {}
    attenuation_asset = _ensure_carousel_attenuation()

    counts: dict[str, int] = {}
    counts["renderer"] = _apply_renderer_runtime_settings()
    counts["world"] = _spawn_world_atmosphere()
    counts["architecture"] = _spawn_architecture()
    counts["entry_desk"] = _spawn_entry_and_desk(audio_assets)
    counts["memory_wall"] = _spawn_memory_frame_zone(audio_assets)
    counts["music_zone"] = _spawn_violin_music_zone(audio_assets, attenuation_asset)
    counts["painting_grid"] = _spawn_painting_and_guro_zone(audio_assets)
    counts["beef_steak_door"] = _spawn_beef_steak_and_door(audio_assets)
    counts["cameras"] = _spawn_validation_cameras()

    lighting_policy = apply_dynamic_lighting_policy()
    saved = bool(unreal.EditorLevelLibrary.save_current_level())

    return json.dumps(
        {
            "level_path": LEVEL_PATH,
            "saved": saved,
            "actor_count_by_zone": counts,
            "generated_actor_count": sum(counts.values()),
            "room_dimensions_cm": [ROOM_WIDTH_CM, ROOM_DEPTH_CM, ROOM_HEIGHT_CM],
            "material_asset_count": material_count,
            "blueprints": blueprint_result,
            "audio_assets_enabled": enable_audio,
            "carousel_attenuation_asset": attenuation_asset,
            "lighting_policy": lighting_policy.to_json(),
            "validation_cameras": [
                {"label": camera.label, "location": camera.location, "rotation": camera.rotation, "shows": camera.description}
                for camera in CAMERAS
            ],
            "placeholder_assets": _placeholder_assets(),
        },
        ensure_ascii=False,
        indent=2,
    )


def inspect_room01_hayoung500_plan() -> str:
    return json.dumps(
        {
            "level_path": LEVEL_PATH,
            "intent": "낡은 연구실/기억 보관실 톤의 9m x 7m x 3.2m 1인칭 방탈출 Room01",
            "puzzle_flow": [
                "입구 안내판",
                "책상 편지와 vita500 자물쇠",
                "추억 액자 4개와 색 버튼",
                "바이올린 키링 수납 액자",
                "바이올린 피규어와 회전목마 오르골",
                "놀이공원 그림 상태 변화",
                "3x3 숫자판과 구로평상",
                "소고기 부위 퍼즐",
                "A/B 스테이크 시식",
                "Room 2 문",
            ],
            "camera_count": len(CAMERAS),
            "required_blueprints": [
                "BP_InteractableBase",
                "BP_Room01PuzzleManager",
                "BP_PickupItem",
                "BP_RoomDoor",
                "BP_PlacableSlot",
            ],
        },
        ensure_ascii=False,
        indent=2,
    )


def _open_or_create_level() -> None:
    unreal.EditorAssetLibrary.make_directory("/Game/Maps")
    if unreal.EditorAssetLibrary.does_asset_exist(LEVEL_PATH):
        unreal.EditorLevelLibrary.load_level(LEVEL_PATH)
    else:
        unreal.EditorLevelLibrary.new_level(LEVEL_PATH)


def _clear_room01_actors() -> None:
    actor_subsystem = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    for actor in list(actor_subsystem.get_all_level_actors()):
        if actor.get_actor_label().startswith(PREFIX):
            actor_subsystem.destroy_actor(actor)


def _ensure_room01_materials() -> int:
    unreal.EditorAssetLibrary.make_directory(MATERIAL_DIR)
    created = 0
    for spec in ROOM_MATERIALS:
        if unreal.EditorAssetLibrary.does_asset_exist(_material_asset(spec.key)):
            continue
        if _create_material(spec):
            created += 1
    return created


def _create_material(spec: MaterialSpec) -> bool:
    material = unreal.AssetToolsHelpers.get_asset_tools().create_asset(
        f"M_R01_{spec.key}",
        MATERIAL_DIR,
        unreal.Material,
        unreal.MaterialFactoryNew(),
    )
    if not material:
        return False

    _connect_vector(material, "BaseColor", spec.base_color, unreal.MaterialProperty.MP_BASE_COLOR, -430, -140)
    _connect_scalar(material, "Roughness", spec.roughness, unreal.MaterialProperty.MP_ROUGHNESS, -150, 45)
    _connect_scalar(material, "Metallic", spec.metallic, unreal.MaterialProperty.MP_METALLIC, -150, 165)
    if spec.emissive > 0:
        emissive = tuple(channel * spec.emissive for channel in spec.base_color)
        _connect_vector(material, "Emissive", emissive, unreal.MaterialProperty.MP_EMISSIVE_COLOR, -430, 80)
    unreal.MaterialEditingLibrary.recompile_material(material)
    unreal.EditorAssetLibrary.save_asset(_material_asset(spec.key), only_if_is_dirty=True)
    return True


def _connect_vector(material: "unreal.Material", name: str, color: tuple[float, float, float], prop: "unreal.MaterialProperty", x: int, y: int) -> None:
    node = unreal.MaterialEditingLibrary.create_material_expression(material, unreal.MaterialExpressionVectorParameter, x, y)
    node.set_editor_property("parameter_name", name)
    node.set_editor_property("default_value", unreal.LinearColor(color[0], color[1], color[2], 1.0))
    unreal.MaterialEditingLibrary.connect_material_property(node, "", prop)


def _connect_scalar(material: "unreal.Material", name: str, value: float, prop: "unreal.MaterialProperty", x: int, y: int) -> None:
    node = unreal.MaterialEditingLibrary.create_material_expression(material, unreal.MaterialExpressionScalarParameter, x, y)
    node.set_editor_property("parameter_name", name)
    node.set_editor_property("default_value", value)
    unreal.MaterialEditingLibrary.connect_material_property(node, "", prop)


def _ensure_room01_blueprints() -> dict[str, str]:
    unreal.EditorAssetLibrary.make_directory(BLUEPRINT_DIR)
    specs = {
        "BP_InteractableBase": "/Script/Hayoung500.HYInteractablePropActor",
        "BP_Room01PuzzleManager": "/Script/Engine.Actor",
        "BP_PickupItem": "/Script/Hayoung500.HYInteractablePropActor",
        "BP_RoomDoor": "/Script/Hayoung500.HYDoorActor",
        "BP_PlacableSlot": "/Script/Hayoung500.HYInteractablePropActor",
    }
    result: dict[str, str] = {}
    for name, parent_path in specs.items():
        asset_path = f"{BLUEPRINT_DIR}/{name}"
        if unreal.EditorAssetLibrary.does_asset_exist(asset_path):
            result[name] = "existing"
            continue
        parent_class = unreal.load_class(None, parent_path) or unreal.Actor
        factory = unreal.BlueprintFactory()
        factory.set_editor_property("parent_class", parent_class)
        blueprint = unreal.AssetToolsHelpers.get_asset_tools().create_asset(name, BLUEPRINT_DIR, None, factory)
        if blueprint:
            _try_add_blueprint_variables(blueprint, name)
            unreal.EditorAssetLibrary.save_asset(asset_path, only_if_is_dirty=True)
            result[name] = "created"
        else:
            result[name] = "failed"
    return result


def _try_add_blueprint_variables(blueprint: "unreal.Blueprint", blueprint_name: str) -> None:
    if not hasattr(unreal, "BlueprintEditorLibrary") or not hasattr(unreal, "EdGraphPinType"):
        return
    variable_sets = {
        "BP_InteractableBase": (("InteractionText", "string", ""), ("RequiredPuzzleState", "name", "None")),
        "BP_Room01PuzzleManager": (
            ("Vita500Solved", "bool", "false"),
            ("MemoryFramesSolved", "bool", "false"),
            ("ViolinKeyringAcquired", "bool", "false"),
            ("ViolinDollActivated", "bool", "false"),
            ("CarouselAcquired", "bool", "false"),
            ("PaintingCompleted", "bool", "false"),
            ("PyeongsangSolved", "bool", "false"),
            ("BeefPuzzleSolved", "bool", "false"),
            ("SteakSolved", "bool", "false"),
            ("DoorToRoom2Open", "bool", "false"),
        ),
        "BP_PickupItem": (("ItemID", "name", "None"),),
        "BP_RoomDoor": (("Locked", "bool", "true"), ("Opened", "bool", "false")),
        "BP_PlacableSlot": (("RequiredItemID", "name", "None"), ("CorrectSlotID", "name", "None")),
    }
    for var_name, pin_category, default in variable_sets.get(blueprint_name, ()):
        try:
            pin_type = unreal.EdGraphPinType()
            pin_type.set_editor_property("pin_category", pin_category)
            unreal.BlueprintEditorLibrary.add_member_variable(blueprint, var_name, pin_type, default)
        except Exception:
            unreal.EditorAssetLibrary.set_metadata_tag(blueprint, var_name, default)


def _ensure_carousel_attenuation() -> str | None:
    unreal.EditorAssetLibrary.make_directory(AUDIO_DIR)
    asset_path = f"{AUDIO_DIR}/SA_R01_Carousel3D"
    if unreal.EditorAssetLibrary.does_asset_exist(asset_path):
        return f"{asset_path}.SA_R01_Carousel3D"
    try:
        factory = unreal.SoundAttenuationFactory()
        asset = unreal.AssetToolsHelpers.get_asset_tools().create_asset("SA_R01_Carousel3D", AUDIO_DIR, unreal.SoundAttenuation, factory)
        if asset:
            settings = asset.get_editor_property("attenuation")
            _safe_set(settings, "falloff_distance", 520.0)
            _safe_set(settings, "attenuation_shape_extents", unreal.Vector(80.0, 80.0, 80.0))
            asset.set_editor_property("attenuation", settings)
            unreal.EditorAssetLibrary.save_asset(asset_path, only_if_is_dirty=True)
            return f"{asset_path}.SA_R01_Carousel3D"
    except Exception:
        return None
    return None


def _apply_renderer_runtime_settings() -> int:
    world = unreal.EditorLevelLibrary.get_editor_world()
    if world:
        for command in (
            "r.DynamicGlobalIlluminationMethod 1",
            "r.ReflectionMethod 1",
            "r.Shadow.Virtual.Enable 1",
            "r.Lumen.Reflections.Allow 1",
            "r.Lumen.DiffuseIndirect.Allow 1",
        ):
            unreal.SystemLibrary.execute_console_command(world, command)
        settings = world.get_world_settings()
        settings.set_editor_property("force_no_precomputed_lighting", True)
    return 1


def _spawn_world_atmosphere() -> int:
    count = 0
    post = _spawn(unreal.PostProcessVolume, unreal.Vector(0.0, 0.0, 160.0), label=f"{PREFIX}PostProcess_CinematicWarmArchive")
    post.set_editor_property("unbound", True)
    post.set_editor_property("blend_weight", 1.0)
    settings = post.get_editor_property("settings")
    for prop, value in (
        ("auto_exposure_bias", -0.35),
        ("bloom_intensity", 0.62),
        ("vignette_intensity", 0.38),
        ("film_grain_intensity", 0.22),
        ("scene_fringe_intensity", 0.08),
    ):
        _safe_set(settings, prop, value)
    post.set_editor_property("settings", settings)
    count += _movable(post)

    fog = _spawn(unreal.ExponentialHeightFog, unreal.Vector(0.0, 0.0, 4.0), label=f"{PREFIX}VolumetricDustFog")
    fog_component = fog.get_component_by_class(unreal.ExponentialHeightFogComponent)
    if fog_component:
        fog_component.set_editor_property("fog_density", 0.026)
        fog_component.set_editor_property("fog_height_falloff", 0.30)
        _safe_set(fog_component, "volumetric_fog", True)
    count += _movable(fog)

    count += _movable(_spawn(unreal.PlayerStart, unreal.Vector(-18.0, -292.0, 42.0), unreal.Rotator(0.0, 0.0, 0.0), f"{PREFIX}PlayerStart_FirstPerson"))
    count += _movable(_point_light(f"{PREFIX}AmbientWarmMemoryLift", unreal.Vector(-160.0, -120.0, 245.0), unreal.LinearColor(1.0, 0.68, 0.38, 1.0), 820.0, 500.0))
    count += _movable(_point_light(f"{PREFIX}CoolBackShadowFill", unreal.Vector(235.0, 250.0, 260.0), unreal.LinearColor(0.34, 0.44, 0.65, 1.0), 260.0, 660.0))
    return count


def _spawn_architecture() -> int:
    count = 0
    count += _mesh("Floor_OldWalnutBase", "Cube", (0, 0, -5), (4.50, 3.50, 0.07), "WalnutPlank")
    for index, x in enumerate(range(-420, 421, 70)):
        tint = "WalnutPlank" if index % 2 == 0 else "WainscotWalnut"
        count += _mesh(f"Floor_Plank_{index:02d}", "Cube", (float(x), 0.0, 1.5), (0.32, 3.45, 0.018), tint)
        count += _mesh(f"Floor_Seam_{index:02d}", "Cube", (float(x) + 34.5, 0.0, 4.2), (0.006, 3.42, 0.006), "DarkCrevice")

    wall_specs = (
        ("BackWall_AgedWallpaper", (0, 352, 164), (4.52, 0.055, 1.62), "OldWallpaper"),
        ("FrontWall_EntranceLeft", (-300, -352, 164), (1.46, 0.055, 1.62), "OldWallpaper"),
        ("FrontWall_EntranceRight", (300, -352, 164), (1.46, 0.055, 1.62), "OldWallpaper"),
        ("LeftWall_AgedPlaster", (-452, 0, 164), (0.055, 3.52, 1.62), "AgedPlaster"),
        ("RightWall_AgedPlaster", (452, 0, 164), (0.055, 3.52, 1.62), "AgedPlaster"),
        ("Ceiling_DarkArchiveLid", (0, 0, 324), (4.52, 3.52, 0.06), "DarkCrevice"),
    )
    for label, loc, scale, material in wall_specs:
        count += _mesh(label, "Cube", loc, scale, material)

    for y in (-350, 350):
        count += _mesh(f"BaseMolding_Y{y}_Lower", "Cube", (0, y, 28), (4.50, 0.045, 0.10), "WainscotWalnut")
        count += _mesh(f"CrownMolding_Y{y}_Upper", "Cube", (0, y, 294), (4.50, 0.040, 0.08), "WainscotWalnut")
    for x in (-450, 450):
        count += _mesh(f"BaseMolding_X{x}_Lower", "Cube", (x, 0, 28), (0.045, 3.50, 0.10), "WainscotWalnut")
        count += _mesh(f"CrownMolding_X{x}_Upper", "Cube", (x, 0, 294), (0.040, 3.50, 0.08), "WainscotWalnut")
    for x in (-446, 446):
        for y in (-346, 346):
            count += _mesh(f"CornerPost_{x}_{y}", "Cube", (x, y, 160), (0.10, 0.10, 1.55), "WainscotWalnut")

    for index, y in enumerate((-250, -125, 0, 125, 250)):
        count += _mesh(f"CeilingBeam_{index}", "Cube", (0, y, 300), (4.05, 0.06, 0.07), "BlackIron")
        count += _rect_light(f"CeilingAmberStrip_{index}", (0, y, 292), (90.0, 0.0, 0.0), 1.0, 0.18, 145.0, 520.0)

    count += _spawn_architectural_decals()
    count += _spawn_floor_litter()
    return count


def _spawn_architectural_decals() -> int:
    count = 0
    back_positions = [(-380, 351, 88), (-295, 351, 236), (-210, 351, 164), (-112, 351, 286), (-30, 351, 74), (62, 351, 250), (146, 351, 132), (232, 351, 274), (336, 351, 112)]
    for index, loc in enumerate(back_positions):
        scale = (0.24 + (index % 3) * 0.07, 0.006, 0.07 + (index % 2) * 0.045)
        count += _mesh(f"Decal_BackWall_Stain_{index:02d}", "Cube", loc, scale, "DustStain")

    side_positions = [
        (-451, -278, 76), (-451, -214, 236), (-451, -118, 154), (-451, -35, 290), (-451, 48, 104), (-451, 145, 218),
        (451, -246, 122), (451, -160, 260), (451, -66, 72), (451, 38, 232), (451, 142, 152), (451, 254, 288),
    ]
    for index, loc in enumerate(side_positions):
        count += _mesh(f"Decal_SideWall_Dirt_{index:02d}", "Cube", loc, (0.006, 0.20, 0.06), "DustStain")

    for index, (x, y, z) in enumerate(((-360, 343, 208), (-286, 343, 206), (-104, 343, 204), (-25, 343, 204), (60, 343, 232), (188, 343, 238), (306, 343, 220))):
        count += _mesh(f"PinHoleCluster_{index:02d}", "Sphere", (x, y - 4, z), (0.018, 0.018, 0.018), "BlackIron")
        count += _mesh(f"TapeScar_{index:02d}", "Cube", (x + 18, y - 2, z + 16), (0.12, 0.006, 0.018), "OldPaper")
    return count


def _spawn_floor_litter() -> int:
    count = 0
    litter = [(-350, -260), (-288, -116), (-210, 68), (-88, 196), (36, -215), (148, 14), (276, -246), (332, 124), (380, 252), (-390, 220)]
    for index, (x, y) in enumerate(litter):
        count += _mesh(f"FloorPaperScrap_{index:02d}", "Cube", (x, y, 8), (0.12, 0.075, 0.004), "OldPaper", unreal.Rotator(0.0, 0.0, float((index * 23) % 90)))
        if index % 2 == 0:
            count += _mesh(f"FloorDustSmudge_{index:02d}", "Cube", (x + 18, y - 12, 6), (0.18, 0.11, 0.003), "DustStain")
    return count


def _spawn_entry_and_desk(audio_assets: dict[str, str]) -> int:
    count = 0
    count += _wall_board("StoryBoard", (-447, -235, 190), (0.035, 0.80, 0.74), "하영아.\n방탈출을 풀며\n우리의 추억을\n잘 떠올려봐!!", 15.0, side="left")
    count += _wall_board("RuleBoard", (-447, -235, 86), (0.035, 0.70, 0.46), "규칙 안내\n인터넷 사용 가능\n힌트는 카톡 또는 전화", 9.5, side="left")

    count += _mesh("Desk_MainOakTop", "Cube", (-318, -190, 66), (1.20, 0.62, 0.09), "WainscotWalnut")
    count += _mesh("Desk_LeftPedestal", "Cube", (-372, -190, 34), (0.28, 0.52, 0.58), "WainscotWalnut")
    count += _mesh("Desk_RightPedestal", "Cube", (-264, -190, 34), (0.28, 0.52, 0.58), "WainscotWalnut")
    count += _mesh("Desk_BackRail", "Cube", (-318, -158, 102), (1.20, 0.055, 0.36), "WainscotWalnut")
    count += _mesh("Chair_Seat", "Cube", (-224, -255, 42), (0.40, 0.38, 0.10), "WainscotWalnut")
    count += _mesh("Chair_Back", "Cube", (-224, -278, 91), (0.40, 0.045, 0.64), "WainscotWalnut")

    count += _mesh("DeskLamp_Base", "Cylinder", (-382, -205, 78), (0.10, 0.10, 0.08), "Brass")
    count += _mesh("DeskLamp_Stem", "Cylinder", (-382, -205, 112), (0.030, 0.030, 0.36), "BlackIron")
    count += _mesh("DeskLamp_Shade", "Cone", (-382, -205, 137), (0.20, 0.20, 0.18), "AmberGlow")
    count += _spot_light("DeskLamp_Spot_WarmFocus", (-382, -205, 130), (65.0, 0.0, 0.0), 2100.0, 340.0, 36.0)

    count += _mesh("LetterPaper_Interactable", "Cube", (-328, -204, 77), (0.46, 0.31, 0.010), "OldPaper")
    count += _text_actor("Letter_Text", "정하영,,,,\n500일을 까먹었지...\n오늘부터 나는 다른 거 마실 거야.\n정답: vita500", (-328, -244, 96), 8.0)
    count += _spawn_lock_actor("Vita500LetterLock", (-276, -175, 94), "vita500", "LETTER", "", "Room1_P0_Vita500Solved", audio_assets)

    for index, x in enumerate((-366, -345, -286, -250)):
        count += _mesh(f"Desk_Book_{index}", "Cube", (x, -155 + index * 7, 84 + index * 4), (0.26, 0.17, 0.035), "OldPaper" if index % 2 else "RoseRed")
    for index, (x, y) in enumerate(((-362, -232), (-252, -228))):
        count += _mesh(f"Desk_Photo_{index}", "Cube", (x, y, 82), (0.16, 0.012, 0.12), "PhotoPaper")
    count += _mesh("Desk_BlackPen", "Cylinder", (-300, -238, 84), (0.018, 0.018, 0.24), "BlackIron", unreal.Rotator(90.0, 30.0, 0.0))
    count += _mesh("Desk_TapeRoll", "Cylinder", (-246, -160, 88), (0.08, 0.08, 0.035), "OldPaper")
    count += _mesh("Desk_EmptyBottle", "Cylinder", (-395, -165, 106), (0.052, 0.052, 0.30), "Glass")
    count += _mesh("Desk_CrumpledNoteA", "Sphere", (-360, -258, 76), (0.055, 0.045, 0.025), "OldPaper")
    count += _mesh("Desk_CrumpledNoteB", "Sphere", (-258, -208, 79), (0.040, 0.032, 0.022), "OldPaper")
    return count


def _spawn_memory_frame_zone(audio_assets: dict[str, str]) -> int:
    count = 0
    frames = (
        ("JatjeolConfession", "첫 고백\n잣절 공원 벤치", JATJEOL_CONFESSION_IMAGE, "ButtonYellow", (-275, 346, 214)),
        ("BirthdayGift", "현수 생일\n하영이가 준 선물", BIRTHDAY_GIFT_IMAGE, "ButtonGreen", (-118, 346, 214)),
        ("PhilippinesTrip", "필리핀 여행\n높은 하늘", PHILIPPINES_TRIP_IMAGE, "ButtonBlue", (-275, 346, 112)),
        ("HundredDay", "100일 네 컷\n홍대의 네 장면", HUNDRED_DAY_IMAGE, "RoseRed", (-118, 346, 112)),
    )
    for name, caption, image, material, loc in frames:
        image_material = ensure_room1_image_material(f"Premium_{name}", image)
        count += _mesh(f"MemoryFrame_{name}_Outer_{material}", "Cube", loc, (0.62, 0.045, 0.43), material)
        count += _mesh_ref(f"MemoryFrame_{name}_Photo", "Cube", (loc[0], loc[1] - 5, loc[2] + 2), (0.50, 0.018, 0.31), image_material)
        count += _text_actor(f"MemoryFrame_{name}_Caption", caption, (loc[0], loc[1] - 25, loc[2] - 45), 7.8)
        count += _mesh(f"MemoryFrame_{name}_PinA", "Sphere", (loc[0] - 26, loc[1] - 7, loc[2] + 30), (0.018, 0.018, 0.018), "Brass")
        count += _mesh(f"MemoryFrame_{name}_PinB", "Sphere", (loc[0] + 26, loc[1] - 7, loc[2] + 30), (0.018, 0.018, 0.018), "Brass")

    buttons = (("Yellow", "노랑", "ButtonYellow", -320), ("Green", "초록", "ButtonGreen", -255), ("Blue", "파랑", "ButtonBlue", -190), ("Red", "빨강", "RoseRed", -125))
    for name, text, material, x in buttons:
        count += _mesh(f"ColorSequenceButton_{name}", "Cylinder", (x, 255, 38), (0.19, 0.19, 0.055), material)
        count += _text_actor(f"ColorSequenceButton_{name}_Label", text, (x, 236, 70), 8.0)
    count += _spawn_lock_actor("MemoryColorOrderLock_YGBR", (-222, 248, 80), "YGBR", "BUTTON_SEQUENCE", "Room1_P0_Vita500Solved", "Room1_P1_ColorOrderSolved", audio_assets)
    count += _rect_light("MemoryWall_WarmGalleryWash", (-205, 300, 272), (0.0, 180.0, 0.0), 2.0, 0.42, 560.0, 920.0)
    return count


def _spawn_violin_music_zone(audio_assets: dict[str, str], attenuation_asset: str | None) -> int:
    count = 0
    violin_material = ensure_room1_image_material("Premium_ViolinKeyring", VIOLIN_KEYRING_IMAGE)
    count += _mesh("ViolinSecretFrame_OuterBox", "Cube", (30, 348, 202), (0.55, 0.055, 0.76), "WainscotWalnut")
    count += _mesh_ref("ViolinSecretFrame_Photo", "Cube", (30, 342, 202), (0.44, 0.018, 0.57), violin_material)
    count += _mesh("ViolinSecretFrame_OpenPanelGhost", "Cube", (76, 326, 198), (0.10, 0.024, 0.65), "Glass")
    count += _mesh("ViolinSecretFrame_HiddenCavity", "Cube", (30, 332, 134), (0.32, 0.035, 0.14), "DarkCrevice")
    count += _spawn_prop_actor("KeyringPickup", (30, 314, 136), "액자 속 바이올린 키링을 줍기", "Room1_P1_ColorOrderSolved", "ViolinKeyring", "sfx_key_pickup", audio_assets, "Brass", (0.18, 0.05, 0.16))

    count += _mesh("MusicShelf_BackCabinet", "Cube", (160, 300, 82), (1.08, 0.28, 0.80), "WainscotWalnut")
    count += _mesh("MusicShelf_Top", "Cube", (160, 270, 124), (1.12, 0.34, 0.08), "WainscotWalnut")
    for index, x in enumerate((110, 138, 188, 216)):
        count += _spawn_small_doll(index, x, 276, 142)
    count += _spawn_violin_performer((160, 248, 150))
    count += _spawn_prop_actor("ViolinDollActivation", (160, 246, 158), "피규어에게 바이올린 키링 건네기", "ViolinKeyring", "Room1_P2_DollPlayed", "sfx_lock_click", audio_assets, "ButtonBlue", (0.22, 0.16, 0.24))

    count += _mesh("CarouselMusicBox_Base", "Cylinder", (160, 128, 88), (0.40, 0.40, 0.10), "Brass")
    count += _mesh("CarouselMusicBox_RotateRing", "Cylinder", (160, 128, 106), (0.34, 0.34, 0.025), "AmberGlow")
    count += _mesh("CarouselMusicBox_CenterPole", "Cylinder", (160, 128, 132), (0.035, 0.035, 0.54), "Brass")
    count += _mesh("CarouselMusicBox_Roof", "Cone", (160, 128, 165), (0.42, 0.42, 0.20), "RoseRed")
    for index, angle in enumerate((0, 120, 240)):
        x = 160 + 26 * _cos(angle)
        y = 128 + 26 * _sin(angle)
        count += _mesh(f"CarouselHorse_{index}", "Sphere", (x, y, 130), (0.11, 0.045, 0.075), "Porcelain")
        count += _mesh(f"CarouselPole_{index}", "Cylinder", (x, y, 130), (0.012, 0.012, 0.34), "Brass")
    count += _spawn_prop_actor("CarouselPickup", (160, 128, 118), "오르골에서 회전목마 소품 꺼내기", "Room1_P2_DollPlayed", "Carousel", "sfx_key_pickup", audio_assets, "AmberGlow", (0.24, 0.24, 0.10))
    count += _point_light(f"{PREFIX}Carousel_SpatialSoundCueLight", unreal.Vector(160, 128, 174), unreal.LinearColor(1.0, 0.52, 0.76, 1.0), 1250.0, 360.0) and 1
    if attenuation_asset:
        count += _text_actor("CarouselSoundAttenuationNote", "3D Sound Slot:\nSA_R01_Carousel3D\nBGM 교체 가능", (222, 106, 160), 7.2)
    return count


def _spawn_painting_and_guro_zone(audio_assets: dict[str, str]) -> int:
    count = 0
    count += _mesh("AmusementPainting_Frame", "Cube", (448, 92, 202), (0.040, 1.54, 0.92), "WainscotWalnut")
    count += _mesh("AmusementPainting_Canvas", "Cube", (442, 92, 202), (0.020, 1.34, 0.76), "AgedPlaster")
    count += _mesh("Painting_FerrisWheelEmpty", "Cylinder", (432, 38, 212), (0.30, 0.30, 0.018), "Brass", unreal.Rotator(0, 90, 0))
    count += _mesh("Painting_CoasterTrack", "Cube", (432, 130, 188), (0.018, 0.74, 0.030), "RoseRed")
    count += _mesh("Painting_EmptyCarouselSilhouette", "Cylinder", (431, 188, 182), (0.20, 0.20, 0.015), "DarkCrevice", unreal.Rotator(0, 90, 0))
    count += _spawn_prop_actor("PaintingCarouselSlot", (426, 188, 182), "그림의 빈 회전목마 자리에 소품 넣기", "Carousel", "Room1_P4_PaintingSolved", "sfx_lock_click", audio_assets, "AmberGlow", (0.12, 0.20, 0.10))
    count += _text_actor("AmusementPainting_Title", "우리의 추억 여행\n회전목마가 비어 있다", (425, 92, 260), 10.0, side="right")
    count += _rect_light("AmusementPainting_FrameLight", (410, 92, 258), (0, -90, 0), 0.32, 1.40, 420.0, 680.0)

    grid_start_x = -126.0
    grid_start_y = -42.0
    for cell in range(1, 10):
        row = (cell - 1) // 3
        col = (cell - 1) % 3
        x = grid_start_x + col * 82
        y = grid_start_y + row * 82
        material = "DarkCrevice" if cell == 9 else "AgedPlaster"
        count += _mesh(f"GuroGrid_Cell_{cell:02d}", "Cube", (x, y, 8), (0.38, 0.38, 0.014), material)
        count += _text_actor(f"GuroGrid_Number_{cell:02d}", str(cell), (x, y - 12, 22), 15.0, floor=True)
    count += _mesh("PyeongsangBench_WoodTop", "Cube", (-36, 22, 34), (0.78, 0.46, 0.11), "WainscotWalnut")
    for index, (x, y) in enumerate(((-70, -2), (-2, -2), (-70, 46), (-2, 46))):
        count += _mesh(f"PyeongsangBench_Leg_{index}", "Cube", (x, y, 16), (0.06, 0.06, 0.22), "WainscotWalnut")
    count += _spawn_prop_actor("PyeongsangSlotNine", (38, 122, 46), "평상을 9번 칸에 놓기", "Room1_P4_PaintingSolved", "Room1_P5_BenchOnNine", "sfx_lock_click", audio_assets, "WainscotWalnut", (0.36, 0.25, 0.08))
    count += _text_actor("GuroHintNote", "우리가 처음 앉았던 곳.\n이름 속에 이미 자리가 숨어 있었다.", (-240, 34, 64), 8.5)
    count += _mesh("HiddenMeatUnderNine", "Sphere", (44, 126, 20), (0.13, 0.09, 0.045), "Meat")
    count += _spawn_prop_actor("MeatPickupUnderNine", (44, 126, 32), "9번 칸 아래 고기 조각 줍기", "Room1_P5_BenchOnNine", "MeatPiece", "sfx_key_pickup", audio_assets, "Meat", (0.18, 0.12, 0.06))
    return count


def _spawn_beef_steak_and_door(audio_assets: dict[str, str]) -> int:
    count = 0
    beef_material = ensure_beef_board_material()
    count += _mesh("BeefPuzzle_FrameLarge", "Cube", (448, 242, 118), (0.040, 1.16, 0.70), "WainscotWalnut")
    count += _mesh_ref("BeefPuzzle_ImageNoNames", "Cube", (442, 242, 124), (0.020, 1.02, 0.52), beef_material)
    count += _text_actor("BeefPuzzle_Hint", "힌트: 100일의 기억은 소의 윗등 쪽,\n목심과 등심 사이 어딘가에 숨어 있다.", (424, 242, 54), 7.0, side="right")
    for index, (y, z, answer) in enumerate(((202, 164, False), (242, 174, True), (284, 162, False), (226, 104, False), (282, 104, False))):
        material = "AmberGlow" if answer else "Glass"
        count += _mesh(f"BeefPuzzle_AnonymousSlot_{index}", "Cube", (428, y, z), (0.016, 0.16, 0.075), material)
    count += _spawn_prop_actor("SalchisalCorrectSlot", (418, 242, 174), "고기 조각을 윗등 사이에 놓기", "MeatPiece", "Room1_P6_MeatSolved", "sfx_lock_click", audio_assets, "Meat", (0.08, 0.14, 0.06))

    count += _mesh("SteakVote_Table", "Cube", (274, -226, 54), (1.22, 0.54, 0.14), "WainscotWalnut")
    count += _steak_plate("A", "현수의 스테이크", (220, -228, 82), "Room1_P6_MeatSolved", "TastedHyunsuSteak", audio_assets)
    count += _steak_plate("B", "홍대 알페로", (330, -228, 82), "TastedHyunsuSteak", "BothSteaksTasted", audio_assets)
    count += _spawn_prop_actor("FinalVoteHyunsuSteak", (274, -172, 92), "최종 선택: 현수의 스테이크에 투표", "BothSteaksTasted", "Room1_P7_FinalSolved", "sfx_lock_click", audio_assets, "AmberGlow", (0.22, 0.16, 0.12))
    count += _text_actor("WrongVoteLineNote", "B 선택 시: 지금 삐졌어.\nA 선택 시: 다음 기억으로.", (274, -286, 114), 8.2)

    door_class = _blueprint_class("BP_RoomDoor") or unreal.load_class(None, "/Script/Hayoung500.HYDoorActor")
    if door_class:
        door = _spawn(door_class, unreal.Vector(360, 344, 112), unreal.Rotator(0, 180, 0), f"{PREFIX}DoorToRoom2_Runtime")
        door.set_actor_scale3d(unreal.Vector(0.76, 0.08, 1.42))
        _set_actor_mesh(door, "/Engine/BasicShapes/Cube.Cube", _mat("WainscotWalnut"))
        _safe_set(door, "required_key_id", "Room1_P7_FinalSolved")
        _safe_set(door, "door_creak_sound", _sound(audio_assets, "sfx_door_creak"))
        _safe_set(door, "locked_sound", _sound(audio_assets, "sfx_error_buzz"))
        count += _movable(door)
    count += _mesh("DoorToRoom2_FrameLeft", "Cube", (318, 338, 116), (0.045, 0.05, 1.52), "BlackIron")
    count += _mesh("DoorToRoom2_FrameRight", "Cube", (402, 338, 116), (0.045, 0.05, 1.52), "BlackIron")
    count += _mesh("DoorToRoom2_FrameTop", "Cube", (360, 338, 194), (0.86, 0.05, 0.045), "BlackIron")
    count += _mesh("DoorToRoom2_WarmCrackLight", "Cube", (315, 333, 116), (0.018, 0.015, 1.42), "AmberGlow")
    count += _point_light(f"{PREFIX}DoorToRoom2_FinalWarmGlow_DisabledUntilSolved", unreal.Vector(360, 314, 186), unreal.LinearColor(1.0, 0.74, 0.36, 1.0), 980.0, 280.0) and 1
    count += _text_actor("DoorToRoom2_Label", "다음 기억으로", (360, 320, 232), 10.0)
    count += _mesh("Room2Placeholder_TransferPad", "Cube", (360, 444, 10), (1.10, 0.62, 0.030), "DarkCrevice")
    return count


def _spawn_validation_cameras() -> int:
    count = 0
    for camera in CAMERAS:
        actor = _spawn(
            unreal.CameraActor,
            unreal.Vector(*camera.location),
            unreal.Rotator(*camera.rotation),
            f"{PREFIX}Camera_{camera.label}",
        )
        component = actor.get_component_by_class(unreal.CameraComponent)
        if component:
            component.set_editor_property("field_of_view", 64.0 if camera.label != "GuroPyeongsangGrid" else 54.0)
        count += _movable(actor)
    return count


def _wall_board(label: str, location: tuple[float, float, float], scale: tuple[float, float, float], text: str, text_size: float, side: str) -> int:
    material = "WainscotWalnut"
    count = _mesh(label, "Cube", location, scale, material)
    if side == "left":
        paper_loc = (location[0] + 5, location[1], location[2])
        text_loc = (location[0] + 24, location[1], location[2] + 4)
        rot = unreal.Rotator(0, 90, 0)
    else:
        paper_loc = (location[0] - 5, location[1], location[2])
        text_loc = (location[0] - 24, location[1], location[2] + 4)
        rot = unreal.Rotator(0, -90, 0)
    count += _mesh(f"{label}_Paper", "Cube", paper_loc, (scale[0] * 0.46, scale[1] * 0.84, scale[2] * 0.82), "OldPaper")
    actor = _text(f"{PREFIX}{label}_Text", text, unreal.Vector(*text_loc), rot, text_size)
    count += _movable(actor)
    return count


def _spawn_lock_actor(
    label: str,
    location: tuple[float, float, float],
    expected_input: str,
    lock_kind: str,
    required_key: str,
    reward_key: str,
    audio_assets: dict[str, str],
) -> int:
    lock_class = unreal.load_class(None, "/Script/Hayoung500.HYLockActor")
    if not lock_class:
        return _mesh(f"{label}_VisualFallback", "Cube", location, (0.34, 0.14, 0.22), "Brass")
    actor = _spawn(lock_class, unreal.Vector(*location), unreal.Rotator(0.0, 180.0, 0.0), f"{PREFIX}{label}")
    actor.set_actor_scale3d(unreal.Vector(0.48, 0.14, 0.32))
    if hasattr(unreal, "HYLockKind"):
        enum_value = getattr(unreal.HYLockKind, lock_kind, unreal.HYLockKind.COMBINATION)
        actor.set_editor_property("lock_kind", enum_value)
    actor.set_editor_property("expected_input", expected_input)
    actor.set_editor_property("interaction_hint", f"{label} / expected: {expected_input}")
    actor.set_editor_property("required_key_id", required_key)
    actor.set_editor_property("reward_key_id", reward_key)
    _safe_set(actor, "success_sound", _sound(audio_assets, "sfx_lock_click"))
    _safe_set(actor, "fail_sound", _sound(audio_assets, "sfx_error_buzz"))
    _safe_set(actor, "input_sound", _sound(audio_assets, "sfx_keypad_beep"))
    if hasattr(actor, "refresh_runtime_lock_hardware"):
        actor.refresh_runtime_lock_hardware()
    _set_actor_mesh(actor, "/Engine/BasicShapes/Cube.Cube", _mat("Brass"))
    return _movable(actor)


def _spawn_prop_actor(
    label: str,
    location: tuple[float, float, float],
    prompt: str,
    required_key: str,
    reward_key: str,
    sound_key: str,
    audio_assets: dict[str, str],
    material: str,
    scale: tuple[float, float, float],
) -> int:
    prop_class = _blueprint_class("BP_PickupItem") or unreal.load_class(None, "/Script/Hayoung500.HYInteractablePropActor")
    if not prop_class:
        return _mesh(f"{label}_VisualFallback", "Cube", location, scale, material)
    actor = _spawn(prop_class, unreal.Vector(*location), unreal.Rotator(0, 180, 0), f"{PREFIX}{label}_Interactable")
    actor.set_actor_scale3d(unreal.Vector(*scale))
    _safe_set(actor, "interaction_prompt", prompt)
    _safe_set(actor, "required_key_id", required_key)
    _safe_set(actor, "reward_key_id", reward_key)
    _safe_set(actor, "interaction_sound", _sound(audio_assets, sound_key))
    _safe_set(actor, "motion_offset", unreal.Vector(0.0, -18.0, 13.0))
    _safe_set(actor, "motion_rotation", unreal.Rotator(0.0, 18.0, 0.0))
    _set_actor_mesh(actor, "/Engine/BasicShapes/Cube.Cube", _mat(material))
    return _movable(actor)


def _spawn_small_doll(index: int, x: float, y: float, z: float) -> int:
    count = 0
    count += _mesh(f"SideDoll_{index}_Body", "Cylinder", (x, y, z), (0.055, 0.055, 0.22), "OldPaper")
    count += _mesh(f"SideDoll_{index}_Head", "Sphere", (x, y, z + 22), (0.060, 0.060, 0.060), "Porcelain")
    count += _mesh(f"SideDoll_{index}_Hair", "Sphere", (x, y, z + 27), (0.065, 0.065, 0.030), "DarkCrevice")
    return count


def _spawn_violin_performer(location: tuple[float, float, float]) -> int:
    x, y, z = location
    count = 0
    count += _mesh("ViolinPerformer_Platform", "Cylinder", (x, y, z - 16), (0.26, 0.26, 0.055), "Brass")
    count += _mesh("ViolinPerformer_Body", "Cylinder", (x, y, z + 2), (0.070, 0.070, 0.22), "OldPaper")
    count += _mesh("ViolinPerformer_Head", "Sphere", (x, y, z + 28), (0.065, 0.065, 0.065), "Porcelain")
    count += _mesh("ViolinPerformer_Violin", "Cube", (x + 12, y - 7, z + 16), (0.18, 0.026, 0.055), "WainscotWalnut")
    count += _mesh("ViolinPerformer_Bow", "Cylinder", (x - 12, y - 9, z + 19), (0.010, 0.010, 0.22), "Brass", unreal.Rotator(88, 30, 0))
    return count


def _steak_plate(label: str, owner: str, location: tuple[float, float, float], required_key: str, reward_key: str, audio_assets: dict[str, str]) -> int:
    x, y, z = location
    count = 0
    count += _mesh(f"Steak_{label}_Plate", "Cylinder", (x, y, z), (0.30, 0.30, 0.025), "Porcelain")
    count += _mesh(f"Steak_{label}_Meat", "Sphere", (x, y, z + 9), (0.19, 0.12, 0.045), "Meat")
    count += _mesh(f"Steak_{label}_Juice", "Cube", (x - 4, y + 8, z + 12), (0.12, 0.07, 0.004), "RoseRed")
    count += _mesh(f"Steak_{label}_FlagPole", "Cylinder", (x, y - 26, z + 28), (0.008, 0.008, 0.23), "Brass")
    count += _mesh(f"Steak_{label}_Flag", "Cube", (x, y - 33, z + 39), (0.15, 0.012, 0.09), "OldPaper")
    count += _text_actor(f"Steak_{label}_Label", f"{label}\n{owner}", (x, y - 48, z + 52), 7.0)
    count += _spawn_prop_actor(f"SteakTaste_{label}", (x, y, z + 18), f"{owner} 맛보기", required_key, reward_key, "sfx_key_pickup", audio_assets, "Meat", (0.16, 0.11, 0.055))
    return count


def _mesh(
    label: str,
    shape: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    material_key: str,
    rotation: "unreal.Rotator | None" = None,
) -> int:
    return _movable(_mesh_actor(label, f"/Engine/BasicShapes/{shape}.{shape}", location, scale, _mat(material_key), rotation))


def _mesh_ref(
    label: str,
    shape: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    material_ref: str,
    rotation: "unreal.Rotator | None" = None,
) -> int:
    return _movable(_mesh_actor(label, f"/Engine/BasicShapes/{shape}.{shape}", location, scale, material_ref, rotation))


def _mesh_actor(
    label: str,
    mesh_path: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    material_ref: str,
    rotation: "unreal.Rotator | None" = None,
) -> "unreal.StaticMeshActor":
    actor = _spawn(unreal.StaticMeshActor, unreal.Vector(*location), rotation or unreal.Rotator(0, 0, 0), f"{PREFIX}{label}")
    actor.set_actor_scale3d(unreal.Vector(*scale))
    mesh = unreal.load_asset(mesh_path)
    material = unreal.load_asset(material_ref)
    if mesh:
        actor.static_mesh_component.set_static_mesh(mesh)
    if material:
        actor.static_mesh_component.set_material(0, material)
    actor.static_mesh_component.set_collision_enabled(unreal.CollisionEnabled.QUERY_AND_PHYSICS)
    return actor


def _rect_light(label: str, location: tuple[float, float, float], rotation: tuple[float, float, float], width: float, height: float, intensity: float, attenuation: float) -> int:
    actor = _spawn(unreal.RectLight, unreal.Vector(*location), unreal.Rotator(*rotation), f"{PREFIX}{label}")
    component = actor.get_component_by_class(unreal.RectLightComponent)
    if component:
        component.set_editor_property("intensity", intensity)
        component.set_editor_property("attenuation_radius", attenuation)
        component.set_editor_property("source_width", width * 100.0)
        component.set_editor_property("source_height", height * 100.0)
        component.set_light_color(unreal.LinearColor(1.0, 0.62, 0.35, 1.0))
    return _movable(actor)


def _spot_light(label: str, location: tuple[float, float, float], rotation: tuple[float, float, float], intensity: float, attenuation: float, cone: float) -> int:
    actor = _spawn(unreal.SpotLight, unreal.Vector(*location), unreal.Rotator(*rotation), f"{PREFIX}{label}")
    component = actor.get_component_by_class(unreal.SpotLightComponent)
    if component:
        component.set_editor_property("intensity", intensity)
        component.set_editor_property("attenuation_radius", attenuation)
        component.set_editor_property("inner_cone_angle", cone * 0.55)
        component.set_editor_property("outer_cone_angle", cone)
        component.set_light_color(unreal.LinearColor(1.0, 0.70, 0.38, 1.0))
    return _movable(actor)


def _text_actor(label: str, text: str, location: tuple[float, float, float], size: float, side: str = "back", floor: bool = False) -> int:
    if floor:
        rotation = unreal.Rotator(-90, 0, 0)
    elif side == "left":
        rotation = unreal.Rotator(0, 90, 0)
    elif side == "right":
        rotation = unreal.Rotator(0, -90, 0)
    else:
        rotation = unreal.Rotator(0, 180, 0)
    return _movable(_text(f"{PREFIX}{label}", text, unreal.Vector(*location), rotation, size))


def _set_actor_mesh(actor: "unreal.Actor", mesh_path: str, material_ref: str) -> None:
    mesh = unreal.load_asset(mesh_path)
    material = unreal.load_asset(material_ref)
    for component in actor.get_components_by_class(unreal.StaticMeshComponent):
        if mesh:
            component.set_static_mesh(mesh)
        if material:
            component.set_material(0, material)
        component.set_collision_enabled(unreal.CollisionEnabled.QUERY_AND_PHYSICS)


def _blueprint_class(name: str) -> "unreal.Class | None":
    return unreal.load_class(None, f"{BLUEPRINT_DIR}/{name}.{name}_C")


def _sound(audio_assets: dict[str, str], key: str) -> "unreal.SoundBase | None":
    asset_path = audio_assets.get(key)
    return unreal.load_asset(asset_path) if asset_path else None


def _mat(key: str) -> str:
    return f"{_material_asset(key)}.M_R01_{key}" if key in {spec.key for spec in ROOM_MATERIALS} else material_path(key)


def _material_asset(key: str) -> str:
    return f"{MATERIAL_DIR}/M_R01_{key}"


def _movable(actor: "unreal.Actor") -> int:
    for component in actor.get_components_by_class(unreal.SceneComponent):
        if hasattr(component, "set_mobility"):
            component.set_mobility(unreal.ComponentMobility.MOVABLE)
    return 1


def _safe_set(target: object, property_name: str, value: object) -> None:
    if value is None:
        return
    try:
        target.set_editor_property(property_name, value)
    except Exception:
        pass


def _cos(degrees: float) -> float:
    import math

    return math.cos(math.radians(degrees))


def _sin(degrees: float) -> float:
    import math

    return math.sin(math.radians(degrees))


def _placeholder_assets() -> list[str]:
    return [
        "모든 목재/회벽/오염 재질은 절차형 PBR placeholder입니다. 최종은 Fab/Quixel 고해상도 wood/plaster/decal 세트로 교체 권장.",
        "바이올린 피규어, 회전목마, 고기 조각, 스테이크는 UE 기본 메쉬 조합 placeholder입니다. 최종은 개별 Static Mesh 또는 Nanite 가능 모델 필요.",
        "오르골 BGM은 SourceAudio/Hayoung500 placeholder WAV입니다. 실제 500일 테마 오르골 음원으로 교체 가능.",
        "추억 액자와 소고기 퍼즐 이미지는 사용자가 제공한 로컬 이미지를 머티리얼로 import합니다.",
        "Blueprint 변수는 에디터 Python API 지원 범위에서 자동 추가하며, 실패 시 Metadata로 기록됩니다.",
    ]
