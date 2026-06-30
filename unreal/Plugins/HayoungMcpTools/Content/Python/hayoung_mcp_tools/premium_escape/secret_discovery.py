from __future__ import annotations

from dataclasses import dataclass
from typing import Final, Literal, TypeAlias, assert_never

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _text

from .specs import RoomSpec
from .visuals import accent_material_path, material_path, prop_material_path

DiscoveryKind: TypeAlias = Literal["false_panel", "drawer_cache", "uv_reveal", "magnetic_release", "signal_model"]
Offset: TypeAlias = tuple[float, float, float]


@dataclass(frozen=True, slots=True)
class SecretBeat:
    name: str
    kind: DiscoveryKind
    x_ratio: float
    y_ratio: float
    clue: str
    reward: str


@dataclass(frozen=True, slots=True)
class RoomSecretPlan:
    room_prefix: str
    beats: tuple[SecretBeat, SecretBeat, SecretBeat]


@dataclass(frozen=True, slots=True)
class SecretContext:
    room: RoomSpec
    beat: SecretBeat
    index: int
    label: str
    origin: "unreal.Vector"


SECRET_PLANS: Final[tuple[RoomSecretPlan, ...]] = (
    RoomSecretPlan(
        "PremiumEscape_Room01_DiaryArchive",
        (
            SecretBeat("DiaryShelfFalseBack", "false_panel", -0.35, -0.12, "책장 뒤판의 얇은 그림자", "황동 열쇠 조각"),
            SecretBeat("EnvelopeDrawerCache", "drawer_cache", 0.05, -0.33, "편지 봉투 손때 방향", "0500 날짜 슬립"),
            SecretBeat("BookmarkUvReveal", "uv_reveal", 0.34, 0.18, "푸른 렌즈로만 보이는 책갈피 순서", "첫 번째 5 조각"),
        ),
    ),
    RoomSecretPlan(
        "PremiumEscape_Room02_CafePromise",
        (
            SecretBeat("ReceiptMagnetTill", "magnetic_release", -0.34, 0.18, "영수증 밑 자석 결제핀", "방향키 시작점"),
            SecretBeat("BoothSeatFalsePanel", "false_panel", -0.06, 0.35, "좌석 쿠션 아래 살짝 떠 있는 모서리", "컵받침 화살표"),
            SecretBeat("SteamLightMenuSignal", "signal_model", 0.34, -0.16, "스팀 불빛이 메뉴 숫자를 훑는다", "색상 버튼 순서"),
        ),
    ),
    RoomSecretPlan(
        "PremiumEscape_Room03_RainRepair",
        (
            SecretBeat("FuseBypassMagnet", "magnetic_release", -0.31, 0.28, "퓨즈박스 옆 리드센서 홈", "금속 하트 위치"),
            SecretBeat("RainWindowUvInk", "uv_reveal", -0.03, 0.39, "젖은 창문에 숨은 UV 빗방울", "2013 숫자 흔적"),
            SecretBeat("PipeTrayDrawer", "drawer_cache", 0.35, -0.21, "파이프 받침대가 레일처럼 밀린다", "밸브 방향 키"),
        ),
    ),
    RoomSecretPlan(
        "PremiumEscape_Room04_NightCity",
        (
            SecretBeat("SkylineTowerSlide", "signal_model", -0.30, 0.19, "도시 모형 높이가 빛 신호를 만든다", "금고 좌우 각도"),
            SecretBeat("ElevatorReedSwitch", "magnetic_release", 0.32, -0.22, "엘리베이터 호출판 뒤 자석 접점", "문자 HYS 신호"),
            SecretBeat("BridgeDeckFalsePanel", "false_panel", 0.02, -0.34, "다리 모형 데크 틈새", "옥상 게이트 키"),
        ),
    ),
    RoomSecretPlan(
        "PremiumEscape_Room05_HeavenVault",
        (
            SecretBeat("CloudTileLift", "false_panel", -0.34, -0.18, "구름 타일의 작은 리본", "마지막 0 조각"),
            SecretBeat("LetterVaultSecretDrawer", "drawer_cache", 0.08, 0.29, "편지 금고 아래 두 번째 손잡이", "하트 열쇠"),
            SecretBeat("HaloUvFinalOrder", "uv_reveal", 0.35, 0.19, "후광 렌즈로 보이는 최종 순서", "엔딩문 LOVE"),
        ),
    ),
)


def spawn_room_secret_discovery(room: RoomSpec) -> int:
    plan = _plan_for(room)
    count = 0
    for index, beat in enumerate(plan.beats):
        origin = unreal.Vector(room.x + room.width * beat.x_ratio, room.depth * beat.y_ratio, 94.0)
        label = f"PE_SecretDiscovery_{room.prefix}_{index + 1:02d}_{beat.name}"
        count += _spawn_secret(SecretContext(room, beat, index, label, origin))
    return count


def _spawn_secret(context: SecretContext) -> int:
    _cube(f"{context.label}_SearchAnchor", context.origin, unreal.Vector(0.52, 0.024, 0.018), prop_material_path(context.room))
    _cube(f"{context.label}_HiddenPanelClosed", _point(context, (0.0, -12.0, 9.0)), unreal.Vector(0.46, 0.014, 0.16), material_path("WalnutDark"))
    _cube(f"{context.label}_OpenGhost", _point(context, (0.0, -45.0, 26.0)), unreal.Vector(0.45, 0.010, 0.14), material_path("GlassTeal"))
    _cube(f"{context.label}_RewardCache", _point(context, (18.0, -38.0, 13.0)), unreal.Vector(0.18, 0.012, 0.055), material_path("HeavenPearl"))
    _text(f"{context.label}_ToolCue", context.beat.clue, _point(context, (0.0, -52.0, 52.0)), unreal.Rotator(0.0, 0.0, 0.0), 5.4)
    _text(f"{context.label}_RewardLabel", context.beat.reward, _point(context, (20.0, -53.0, 30.0)), unreal.Rotator(0.0, 0.0, 0.0), 4.6)
    _cube(f"{context.label}_DependencyLink", _point(context, (-24.0, -30.0, -11.0)), unreal.Vector(0.26, 0.009, 0.010), accent_material_path(context.room))
    _text(f"{context.label}_NoForceMark", "SEARCH", _point(context, (-26.0, -21.0, 33.0)), unreal.Rotator(0.0, 0.0, 0.0), 4.2)
    _point_light(f"{context.label}_DiscoveryGlow", _point(context, (0.0, -42.0, 45.0)), _accent(context.room), 220.0, 155.0)
    return 9 + _spawn_kind_detail(context) + _spawn_micro_evidence(context)


def _spawn_kind_detail(context: SecretContext) -> int:
    match context.beat.kind:
        case "false_panel":
            return _spawn_false_panel(context)
        case "drawer_cache":
            return _spawn_drawer_cache(context)
        case "uv_reveal":
            return _spawn_uv_reveal(context)
        case "magnetic_release":
            return _spawn_magnetic_release(context)
        case "signal_model":
            return _spawn_signal_model(context)
        case unreachable:
            assert_never(unreachable)


def _spawn_false_panel(context: SecretContext) -> int:
    _cube(f"{context.label}_LiftRibbon", _point(context, (-23.0, -23.0, 24.0)), unreal.Vector(0.035, 0.010, 0.18), material_path("RoseGlow"))
    _cube(f"{context.label}_HingeShadow", _point(context, (25.0, -23.0, 12.0)), unreal.Vector(0.030, 0.010, 0.18), material_path("DeepShadow"))
    _cube(f"{context.label}_SeamOutline", _point(context, (0.0, -24.0, 31.0)), unreal.Vector(0.49, 0.008, 0.010), material_path("BrassEdge"))
    _shape(f"{context.label}_FingerNotch", "Cylinder", _point(context, (-18.0, -26.0, 10.0)), unreal.Vector(0.045, 0.045, 0.010), accent_material_path(context.room))
    return 4


def _spawn_drawer_cache(context: SecretContext) -> int:
    _cube(f"{context.label}_DrawerFace", _point(context, (0.0, -19.0, 10.0)), unreal.Vector(0.40, 0.020, 0.105), material_path("WalnutDark"))
    _cube(f"{context.label}_PulledDrawerGhost", _point(context, (0.0, -55.0, 10.0)), unreal.Vector(0.38, 0.018, 0.090), material_path("GlassTeal"))
    _shape(f"{context.label}_DrawerKnob", "Sphere", _point(context, (0.0, -25.0, 14.0)), unreal.Vector(0.045, 0.045, 0.030), material_path("BrassEdge"))
    _cube(f"{context.label}_InnerSlip", _point(context, (-17.0, -58.0, 20.0)), unreal.Vector(0.15, 0.012, 0.045), material_path("HeavenPearl"))
    return 4


def _spawn_uv_reveal(context: SecretContext) -> int:
    _shape(f"{context.label}_UvTorchBody", "Cylinder", _point(context, (-20.0, -22.0, 14.0)), unreal.Vector(0.055, 0.055, 0.18), material_path("DeepShadow"))
    _cube(f"{context.label}_HiddenInkCard", _point(context, (12.0, -34.0, 15.0)), unreal.Vector(0.24, 0.010, 0.070), material_path("HeavenPearl"))
    for stroke in range(3):
        _cube(f"{context.label}_UvStroke_{stroke + 1}", _point(context, (-8.0 + stroke * 9.0, -45.0, 22.0)), unreal.Vector(0.040, 0.006, 0.065), material_path("GlassTeal"))
    _point_light(f"{context.label}_UvCone", _point(context, (0.0, -50.0, 31.0)), unreal.LinearColor(0.42, 0.45, 1.0, 1.0), 130.0, 90.0)
    return 6


def _spawn_magnetic_release(context: SecretContext) -> int:
    _shape(f"{context.label}_MagnetPuck", "Cylinder", _point(context, (-22.0, -24.0, 15.0)), unreal.Vector(0.065, 0.065, 0.018), material_path("BrassEdge"))
    _cube(f"{context.label}_ReedSensorPlate", _point(context, (9.0, -26.0, 15.0)), unreal.Vector(0.17, 0.010, 0.052), material_path("DeepShadow"))
    _cube(f"{context.label}_RelayCable", _point(context, (20.0, -30.0, 2.0)), unreal.Vector(0.010, 0.16, 0.010), accent_material_path(context.room))
    _cube(f"{context.label}_LatchReleasedGhost", _point(context, (30.0, -43.0, 20.0)), unreal.Vector(0.12, 0.012, 0.045), material_path("GlassTeal"))
    return 4


def _spawn_signal_model(context: SecretContext) -> int:
    for post in range(4):
        _cube(f"{context.label}_SignalPost_{post + 1}", _point(context, (-27.0 + post * 18.0, -30.0, 15.0 + post * 5.0)), unreal.Vector(0.028, 0.028, 0.08 + post * 0.014), accent_material_path(context.room))
    _cube(f"{context.label}_LightPath", _point(context, (0.0, -47.0, 34.0)), unreal.Vector(0.36, 0.008, 0.012), material_path("RoseGlow"))
    _text(f"{context.label}_SignalReadout", "SYNC", _point(context, (0.0, -53.0, 42.0)), unreal.Rotator(0.0, 0.0, 0.0), 4.2)
    return 6


def _spawn_micro_evidence(context: SecretContext) -> int:
    _cube(f"{context.label}_DustBreak", _point(context, (-31.0, -14.0, -12.0)), unreal.Vector(0.14, 0.008, 0.009), material_path("HeavenPearl"))
    _cube(f"{context.label}_ScratchArrow", _point(context, (28.0, -13.0, -12.0)), unreal.Vector(0.16, 0.008, 0.009), material_path("RoseGlow"))
    _shape(f"{context.label}_TinyScrew", "Cylinder", _point(context, (32.0, -23.0, 31.0)), unreal.Vector(0.025, 0.025, 0.006), material_path("BrassEdge"))
    return 3


def _plan_for(room: RoomSpec) -> RoomSecretPlan:
    for plan in SECRET_PLANS:
        if plan.room_prefix == room.prefix:
            return plan
    return RoomSecretPlan(room.prefix, SECRET_PLANS[0].beats)


def _point(context: SecretContext, offset: Offset) -> "unreal.Vector":
    return unreal.Vector(context.origin.x + offset[0], context.origin.y + offset[1], context.origin.z + offset[2])


def _accent(room: RoomSpec) -> "unreal.LinearColor":
    return unreal.LinearColor(room.accent[0], room.accent[1], room.accent[2], 1.0)
