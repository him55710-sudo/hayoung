from __future__ import annotations

from dataclasses import dataclass
from typing import Final, Literal, TypeAlias, assert_never

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _text

from .level_ops import color
from .specs import RoomSpec
from .visuals import accent_material_path, prop_material_path

FixtureShape: TypeAlias = Literal["Cube", "Cylinder", "Sphere"]
Scale: TypeAlias = tuple[float, float, float]


@dataclass(frozen=True, slots=True)
class FixtureSpec:
    name: str
    shape: FixtureShape
    x_ratio: float
    y_ratio: float
    z: float
    scale: Scale
    cue: str


@dataclass(frozen=True, slots=True)
class RoomFixtureSet:
    room_prefix: str
    fixtures: tuple[FixtureSpec, ...]


FIXTURE_SETS: Final[tuple[RoomFixtureSet, ...]] = (
    RoomFixtureSet(
        "PremiumEscape_Room01_DiaryArchive",
        (
            FixtureSpec("FalseBookSafe", "Cube", -0.35, 0.24, 95.0, (0.58, 0.10, 0.34), "위장 책 금고"),
            FixtureSpec("DrawerStack", "Cube", 0.27, -0.12, 64.0, (0.64, 0.30, 0.50), "3단 서랍 탐색"),
            FixtureSpec("UnderShelfMagnet", "Cylinder", -0.34, -0.33, 42.0, (0.14, 0.14, 0.04), "책장 밑 자석 키"),
            FixtureSpec("UvPhotoStrip", "Cube", 0.07, 0.36, 118.0, (0.70, 0.04, 0.12), "UV 사진 흔적"),
            FixtureSpec("HintPhone", "Cube", 0.33, 0.23, 74.0, (0.28, 0.16, 0.04), "힌트폰 거치대"),
            FixtureSpec("UsedClueTray", "Cube", -0.06, -0.35, 48.0, (0.42, 0.20, 0.05), "사용한 단서 트레이"),
        ),
    ),
    RoomFixtureSet(
        "PremiumEscape_Room02_CafePromise",
        (
            FixtureSpec("ArrowCoasterTrail", "Cube", -0.34, 0.08, 45.0, (0.36, 0.26, 0.04), "컵받침 방향 순서"),
            FixtureSpec("ReceiptRail", "Cube", 0.06, 0.36, 112.0, (0.82, 0.04, 0.16), "영수증 레일"),
            FixtureSpec("ColorSyrupButtons", "Cylinder", 0.31, -0.24, 88.0, (0.16, 0.16, 0.06), "색상 버튼"),
            FixtureSpec("ServiceBell", "Sphere", -0.10, -0.32, 70.0, (0.16, 0.16, 0.10), "서비스벨 입력"),
            FixtureSpec("MenuBoardCipher", "Cube", 0.35, 0.30, 165.0, (0.60, 0.05, 0.34), "메뉴판 암호"),
            FixtureSpec("BoothSeatCache", "Cube", -0.38, -0.20, 58.0, (0.72, 0.34, 0.22), "좌석 밑 보관함"),
        ),
    ),
    RoomFixtureSet(
        "PremiumEscape_Room03_RainRepair",
        (
            FixtureSpec("RainWindowTrace", "Cube", -0.36, 0.34, 162.0, (0.54, 0.04, 0.46), "빗방울 숫자"),
            FixtureSpec("PipeValveGrid", "Cylinder", 0.24, 0.20, 118.0, (0.20, 0.20, 0.05), "파이프 밸브"),
            FixtureSpec("FuseSwitchBank", "Cube", 0.36, -0.10, 112.0, (0.50, 0.08, 0.42), "퓨즈 스위치"),
            FixtureSpec("MagnetHeartPlate", "Sphere", -0.18, -0.30, 84.0, (0.20, 0.12, 0.16), "자석 하트 홈"),
            FixtureSpec("ToolRackShadow", "Cube", -0.34, -0.02, 132.0, (0.46, 0.04, 0.40), "공구 실루엣"),
            FixtureSpec("WetKeypadShield", "Cube", 0.18, -0.36, 94.0, (0.36, 0.08, 0.30), "습기 키패드 덮개"),
        ),
    ),
    RoomFixtureSet(
        "PremiumEscape_Room04_NightCity",
        (
            FixtureSpec("SkylineHeightCode", "Cube", -0.38, 0.18, 96.0, (0.34, 0.24, 0.82), "건물 높이 코드"),
            FixtureSpec("RotarySafeCabinet", "Cube", 0.32, 0.16, 92.0, (0.52, 0.26, 0.62), "회전식 금고"),
            FixtureSpec("LetterBeacon", "Cylinder", 0.05, 0.34, 148.0, (0.16, 0.16, 0.38), "창문 글자 신호"),
            FixtureSpec("BridgeRouteModel", "Cube", -0.18, -0.26, 52.0, (0.86, 0.14, 0.08), "미니 다리 경로"),
            FixtureSpec("ElevatorCallPanel", "Cube", 0.40, -0.22, 116.0, (0.28, 0.06, 0.40), "엘리베이터 패널"),
            FixtureSpec("NeonDecoySign", "Cube", -0.36, -0.36, 172.0, (0.58, 0.04, 0.20), "네온 오답 단서"),
        ),
    ),
    RoomFixtureSet(
        "PremiumEscape_Room05_HeavenVault",
        (
            FixtureSpec("CloudStepSequence", "Sphere", -0.34, -0.26, 36.0, (0.44, 0.28, 0.10), "구름 발판 순서"),
            FixtureSpec("MemoryColumnA", "Cylinder", -0.22, 0.18, 170.0, (0.18, 0.18, 1.12), "기억 기둥 A"),
            FixtureSpec("MemoryColumnB", "Cylinder", 0.22, 0.18, 170.0, (0.18, 0.18, 1.12), "기억 기둥 B"),
            FixtureSpec("LetterVault", "Cube", 0.34, -0.02, 118.0, (0.58, 0.24, 0.58), "편지 금고"),
            FixtureSpec("HeartKeyPedestal", "Cylinder", 0.04, -0.34, 72.0, (0.28, 0.28, 0.24), "하트 키 받침대"),
            FixtureSpec("DoubleDoorHingeArc", "Cylinder", 0.00, 0.38, 164.0, (0.52, 0.52, 0.05), "양문 힌지 궤적"),
        ),
    ),
)


def spawn_escape_cafe_fixtures(room: RoomSpec, density: int) -> int:
    fixture_set = _fixture_set_for(room)
    count = 0
    for fixture in fixture_set.fixtures:
        count += _spawn_fixture(room, fixture)
    for index in range(max(1, min(int(density), 5))):
        count += _spawn_search_marker(room, index)
    return count


def _fixture_set_for(room: RoomSpec) -> RoomFixtureSet:
    for fixture_set in FIXTURE_SETS:
        if fixture_set.room_prefix == room.prefix:
            return fixture_set
    return RoomFixtureSet(room.prefix, ())


def _spawn_fixture(room: RoomSpec, fixture: FixtureSpec) -> int:
    location = _fixture_location(room, fixture)
    scale = unreal.Vector(fixture.scale[0], fixture.scale[1], fixture.scale[2])
    label = f"PE_Fixture_{room.prefix}_{fixture.name}"
    match fixture.shape:
        case "Cube":
            _cube(label, location, scale, prop_material_path(room))
        case "Cylinder":
            _shape(label, "Cylinder", location, scale, accent_material_path(room))
        case "Sphere":
            _shape(label, "Sphere", location, scale, accent_material_path(room))
        case unreachable:
            assert_never(unreachable)
    _text(f"{label}_Cue", fixture.cue, unreal.Vector(location.x, location.y - 28.0, location.z + 52.0), unreal.Rotator(0.0, 0.0, 0.0), 11.0)
    _point_light(f"{label}_MicroHighlight", unreal.Vector(location.x, location.y - 16.0, location.z + 42.0), color(room), 150.0, 125.0)
    return 3


def _spawn_search_marker(room: RoomSpec, index: int) -> int:
    x = room.x - room.width * 0.32 + index * (room.width * 0.16)
    y = -room.depth * 0.41 + (index % 2) * room.depth * 0.18
    label = f"PE_Fixture_{room.prefix}_SearchLayer_{index + 1}"
    _cube(label, unreal.Vector(x, y, 22.0), unreal.Vector(0.30, 0.18, 0.035), accent_material_path(room))
    _text(f"{label}_Label", "뒤집기/열기/비추기", unreal.Vector(x, y - 20.0, 58.0), unreal.Rotator(0.0, 0.0, 0.0), 9.0)
    return 2


def _fixture_location(room: RoomSpec, fixture: FixtureSpec) -> "unreal.Vector":
    return unreal.Vector(room.x + room.width * fixture.x_ratio, room.depth * fixture.y_ratio, fixture.z)
