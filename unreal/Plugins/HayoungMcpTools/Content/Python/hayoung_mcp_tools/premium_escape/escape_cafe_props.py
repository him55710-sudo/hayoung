from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Final, Literal, TypeAlias, assert_never

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _spawn, _text

from .specs import RoomSpec
from .visuals import accent_material_path, material_path, prop_material_path

AudioAssets: TypeAlias = Mapping[str, str]
Offset: TypeAlias = tuple[float, float, float]
PropKind: TypeAlias = Literal[
    "hidden_panel",
    "key_cache",
    "mechanical_lock",
    "direction_route",
    "electronic_panel",
    "finale_ritual",
]


@dataclass(frozen=True, slots=True)
class EscapeCafeProp:
    name: str
    kind: PropKind
    sound_key: str
    x_ratio: float
    y_ratio: float
    z: float
    cue: str


@dataclass(frozen=True, slots=True)
class EscapeCafePropPlan:
    room_prefix: str
    props: tuple[EscapeCafeProp, ...]


@dataclass(frozen=True, slots=True)
class EscapeCafePropContext:
    room: RoomSpec
    prop: EscapeCafeProp
    index: int
    label: str
    origin: "unreal.Vector"
    audio_assets: AudioAssets


REAL_ESCAPE_PROP_PLANS: Final[tuple[EscapeCafePropPlan, ...]] = (
    EscapeCafePropPlan("PremiumEscape_Room01_DiaryArchive", (EscapeCafeProp("PhotoBackMagnet", "hidden_panel", "sfx_paper_rustle", -0.36, 0.31, 126.0, "액자 뒤 자석 단서"), EscapeCafeProp("DiaryFalseBottom", "hidden_panel", "sfx_drawer_slide", 0.12, -0.34, 62.0, "일기장 이중 바닥"), EscapeCafeProp("BrassKeyHook", "key_cache", "sfx_key_pickup", 0.35, -0.04, 94.0, "황동 열쇠 고리"), EscapeCafeProp("BookSafeHasp", "mechanical_lock", "sfx_lock_click", -0.18, -0.18, 112.0, "책 금고 걸쇠"), EscapeCafeProp("UvBookmarkReader", "electronic_panel", "sfx_keypad_beep", 0.30, 0.22, 138.0, "UV 책갈피 판독"), EscapeCafeProp("HintPhoneCradle", "electronic_panel", "sfx_phone_buzz", -0.03, 0.37, 94.0, "힌트폰 진동 거치대"))),
    EscapeCafePropPlan("PremiumEscape_Room02_CafePromise", (EscapeCafeProp("ReceiptCashTray", "hidden_panel", "sfx_drawer_slide", -0.34, 0.20, 86.0, "영수증 금전함"), EscapeCafeProp("ArrowCoasterLine", "direction_route", "sfx_direction_press", -0.18, -0.32, 58.0, "컵받침 방향 경로"), EscapeCafeProp("SyrupButtonPanel", "electronic_panel", "sfx_button_press", 0.30, -0.18, 110.0, "시럽 색 버튼"), EscapeCafeProp("ServiceBellKey", "key_cache", "sfx_service_bell", 0.14, 0.34, 74.0, "서비스벨 밑 열쇠"), EscapeCafeProp("BoothSeatTrap", "hidden_panel", "sfx_floor_creak", -0.40, -0.04, 54.0, "좌석 밑 트랩"), EscapeCafeProp("MenuBoardLock", "mechanical_lock", "sfx_lock_click", 0.36, 0.25, 166.0, "메뉴판 잠금함"))),
    EscapeCafePropPlan("PremiumEscape_Room03_RainRepair", (EscapeCafeProp("RainGlassTrace", "hidden_panel", "sfx_rain_window", -0.36, 0.34, 172.0, "빗방울 숫자창"), EscapeCafeProp("ValveTurnRig", "direction_route", "sfx_valve_turn", -0.16, -0.26, 102.0, "밸브 회전 순서"), EscapeCafeProp("FuseSwitchBank", "electronic_panel", "sfx_fuse_toggle", 0.34, 0.20, 132.0, "퓨즈 스위치 뱅크"), EscapeCafeProp("MagnetHeartSeat", "key_cache", "sfx_magnetic_snap", 0.10, -0.35, 92.0, "자석 하트 홈"), EscapeCafeProp("ToolShadowCabinet", "mechanical_lock", "sfx_lock_click", -0.32, 0.05, 134.0, "공구 그림자 캐비닛"), EscapeCafeProp("WetKeypadCover", "electronic_panel", "sfx_keypad_beep", 0.36, -0.18, 112.0, "습기 키패드 커버"))),
    EscapeCafePropPlan("PremiumEscape_Room04_NightCity", (EscapeCafeProp("SkylineHeightDrawer", "hidden_panel", "sfx_drawer_slide", -0.38, 0.18, 98.0, "스카이라인 높이 서랍"), EscapeCafeProp("RotarySafeDial", "mechanical_lock", "sfx_safe_open", 0.27, 0.12, 106.0, "회전 금고 다이얼"), EscapeCafeProp("ElevatorCallPanel", "electronic_panel", "sfx_elevator_chime", 0.39, -0.20, 128.0, "엘리베이터 호출판"), EscapeCafeProp("BridgeRouteTiles", "direction_route", "sfx_direction_press", -0.12, -0.32, 54.0, "다리 경로 타일"), EscapeCafeProp("WindowLetterSignal", "hidden_panel", "sfx_neon_hum", 0.03, 0.36, 184.0, "창문 문자 신호"), EscapeCafeProp("NeonGateKey", "key_cache", "sfx_key_pickup", -0.34, -0.18, 112.0, "네온 게이트 키"))),
    EscapeCafePropPlan("PremiumEscape_Room05_HeavenVault", (EscapeCafeProp("CloudTileLift", "hidden_panel", "sfx_heaven_chime", -0.36, -0.25, 46.0, "구름 타일 리프트"), EscapeCafeProp("MemoryColumnDrawer", "hidden_panel", "sfx_drawer_slide", -0.16, 0.22, 142.0, "기억 기둥 서랍"), EscapeCafeProp("LetterVaultClasp", "mechanical_lock", "sfx_key_turn", 0.30, -0.04, 124.0, "편지 금고 클라스프"), EscapeCafeProp("HeartKeyNest", "key_cache", "sfx_key_pickup", 0.10, -0.34, 84.0, "하트 열쇠 받침"), EscapeCafeProp("Final500Dial", "electronic_panel", "sfx_dial_tick", -0.30, 0.20, 114.0, "500 최종 다이얼"), EscapeCafeProp("EndingGateRitual", "finale_ritual", "sfx_heaven_chime", 0.36, 0.32, 178.0, "엔딩문 의식 장치"))),
)


def spawn_room_escape_cafe_props(room: RoomSpec, audio_assets: AudioAssets) -> int:
    count = 0
    for index, prop in enumerate(_props_for(room)):
        origin = unreal.Vector(room.x + room.width * prop.x_ratio, room.depth * prop.y_ratio, prop.z)
        label = f"PE_RealEscapeProp_{room.prefix}_{index + 1:02d}_{prop.name}"
        count += _spawn_prop(EscapeCafePropContext(room, prop, index, label, origin, audio_assets))
    return count


def _spawn_prop(context: EscapeCafePropContext) -> int:
    count = _spawn_base(context)
    count += _spawn_kind(context)
    count += _spawn_audio_anchor(context)
    return count


def _spawn_base(context: EscapeCafePropContext) -> int:
    _cube(f"{context.label}_StationPlate", context.origin, unreal.Vector(0.48, 0.16, 0.055), prop_material_path(context.room))
    _cube(f"{context.label}_HandTarget", _point(context, (0.0, -18.0, 20.0)), unreal.Vector(0.24, 0.016, 0.055), accent_material_path(context.room))
    _cube(f"{context.label}_RevealGhost", _point(context, (0.0, -36.0, 23.0)), unreal.Vector(0.42, 0.012, 0.050), material_path("GlassTeal"))
    _cube(f"{context.label}_WearArc", _point(context, (-24.0, -9.0, -16.0)), unreal.Vector(0.20, 0.010, 0.010), material_path("DeepShadow"))
    _text(f"{context.label}_CueLabel", context.prop.cue, _point(context, (0.0, -28.0, 48.0)), unreal.Rotator(0.0, 0.0, 0.0), 5.8)
    _point_light(f"{context.label}_InspectionPool", _point(context, (0.0, -52.0, 54.0)), _accent(context.room), 135.0, 120.0)
    return 6


def _spawn_kind(context: EscapeCafePropContext) -> int:
    match context.prop.kind:
        case "hidden_panel":
            return _spawn_hidden_panel(context)
        case "key_cache":
            return _spawn_key_cache(context)
        case "mechanical_lock":
            return _spawn_mechanical_lock(context)
        case "direction_route":
            return _spawn_direction_route(context)
        case "electronic_panel":
            return _spawn_electronic_panel(context)
        case "finale_ritual":
            return _spawn_finale_ritual(context)
        case unreachable:
            assert_never(unreachable)


def _spawn_hidden_panel(context: EscapeCafePropContext) -> int:
    _cube(f"{context.label}_HiddenPanel_Seam", _point(context, (0.0, -22.0, 8.0)), unreal.Vector(0.38, 0.010, 0.016), material_path("RoseGlow"))
    _cube(f"{context.label}_HiddenPanel_LiftedEdge", _point(context, (-19.0, -28.0, 18.0)), unreal.Vector(0.12, 0.010, 0.038), material_path("HeavenPearl"))
    _shape(f"{context.label}_HiddenPanel_Pin", "Cylinder", _point(context, (23.0, -26.0, 18.0)), unreal.Vector(0.028, 0.028, 0.014), material_path("BrassEdge"))
    return 3


def _spawn_key_cache(context: EscapeCafePropContext) -> int:
    _cube(f"{context.label}_KeyCache_Rack", _point(context, (0.0, -23.0, 13.0)), unreal.Vector(0.34, 0.012, 0.060), material_path("BrassEdge"))
    _shape(f"{context.label}_KeyCache_Ring", "Cylinder", _point(context, (-14.0, -28.0, 21.0)), unreal.Vector(0.042, 0.042, 0.010), accent_material_path(context.room))
    _cube(f"{context.label}_KeyCache_Tag", _point(context, (14.0, -29.0, 12.0)), unreal.Vector(0.11, 0.010, 0.038), material_path("HeavenPearl"))
    return 3


def _spawn_mechanical_lock(context: EscapeCafePropContext) -> int:
    _cube(f"{context.label}_LockHardware_Body", _point(context, (0.0, -23.0, 17.0)), unreal.Vector(0.28, 0.060, 0.110), material_path("DeepShadow"))
    _shape(f"{context.label}_LockHardware_Shackle", "Cylinder", _point(context, (0.0, -30.0, 34.0)), unreal.Vector(0.060, 0.060, 0.014), material_path("BrassEdge"))
    _shape(f"{context.label}_LockHardware_Keyway", "Cylinder", _point(context, (16.0, -31.0, 14.0)), unreal.Vector(0.022, 0.022, 0.014), accent_material_path(context.room))
    return 3


def _spawn_direction_route(context: EscapeCafePropContext) -> int:
    for slot, text in enumerate(("U", "R", "D", "L"), start=1):
        _text(f"{context.label}_DirectionArrow_{slot:02d}", text, _point(context, (-24.0 + slot * 12.0, -29.0, 18.0)), unreal.Rotator(0.0, 0.0, 0.0), 8.0)
    _cube(f"{context.label}_DirectionArrow_Channel", _point(context, (0.0, -26.0, 4.0)), unreal.Vector(0.40, 0.010, 0.020), material_path("GlassTeal"))
    return 5


def _spawn_electronic_panel(context: EscapeCafePropContext) -> int:
    _cube(f"{context.label}_ElectronicInput_Screen", _point(context, (0.0, -24.0, 22.0)), unreal.Vector(0.30, 0.010, 0.075), material_path("GlassTeal"))
    for slot in range(3):
        _shape(f"{context.label}_ElectronicInput_Button_{slot + 1:02d}", "Sphere", _point(context, (-14.0 + slot * 14.0, -31.0, 8.0)), unreal.Vector(0.024, 0.024, 0.024), accent_material_path(context.room))
    return 4


def _spawn_finale_ritual(context: EscapeCafePropContext) -> int:
    _shape(f"{context.label}_FinaleRitual_Halo", "Cylinder", _point(context, (0.0, -23.0, 28.0)), unreal.Vector(0.18, 0.18, 0.014), material_path("HeavenPearl"))
    _cube(f"{context.label}_FinaleRitual_LetterSlot", _point(context, (-18.0, -30.0, 13.0)), unreal.Vector(0.13, 0.010, 0.050), material_path("RoseGlow"))
    _shape(f"{context.label}_FinaleRitual_HeartKeyGlow", "Sphere", _point(context, (18.0, -31.0, 15.0)), unreal.Vector(0.045, 0.045, 0.045), accent_material_path(context.room))
    return 3


def _spawn_audio_anchor(context: EscapeCafePropContext) -> int:
    asset_path = context.audio_assets.get(context.prop.sound_key, "")
    if not asset_path:
        return 0
    sound = unreal.load_asset(asset_path)
    actor = _spawn(unreal.AmbientSound, _point(context, (0.0, -38.0, 32.0)), label=f"{context.label}_AudioAnchor")
    component = actor.get_editor_property("audio_component")
    component.set_editor_property("sound", sound)
    component.set_editor_property("volume_multiplier", 0.08)
    component.set_editor_property("auto_activate", False)
    return 1


def _props_for(room: RoomSpec) -> tuple[EscapeCafeProp, ...]:
    for plan in REAL_ESCAPE_PROP_PLANS:
        if plan.room_prefix == room.prefix:
            return plan.props
    return ()


def _point(context: EscapeCafePropContext, offset: Offset) -> "unreal.Vector":
    return unreal.Vector(context.origin.x + offset[0], context.origin.y + offset[1], context.origin.z + offset[2])


def _accent(room: RoomSpec) -> "unreal.LinearColor":
    return unreal.LinearColor(room.accent[0], room.accent[1], room.accent[2], 1.0)
