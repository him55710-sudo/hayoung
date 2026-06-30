from __future__ import annotations

from dataclasses import dataclass
from typing import Final, Literal, TypeAlias, assert_never

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _text

from .level_ops import color
from .specs import RoomSpec
from .visuals import accent_material_path, floor_material_path, material_path, prop_material_path, wall_material_path

SetpieceShape: TypeAlias = Literal["Cube", "Cylinder", "Sphere"]
MaterialRole: TypeAlias = Literal["wall", "floor", "accent", "prop", "shadow", "glass", "brass"]
Scale: TypeAlias = tuple[float, float, float]


@dataclass(frozen=True, slots=True)
class SetpieceSpec:
    name: str
    shape: SetpieceShape
    x_ratio: float
    y_ratio: float
    z: float
    scale: Scale
    role: MaterialRole
    cue: str
    glow: float


@dataclass(frozen=True, slots=True)
class RoomSetpieceSet:
    room_prefix: str
    pieces: tuple[SetpieceSpec, ...]


SETPIECE_SETS: Final[tuple[RoomSetpieceSet, ...]] = (
    RoomSetpieceSet(
        "PremiumEscape_Room01_DiaryArchive",
        (
            SetpieceSpec("Archive_Aisle_Left", "Cube", -0.42, -0.04, 118.0, (0.24, 3.5, 1.55), "prop", "좁은 책장 통로", 360.0),
            SetpieceSpec("Archive_Aisle_Right", "Cube", 0.42, -0.04, 118.0, (0.24, 3.5, 1.55), "prop", "반대편 책장 통로", 360.0),
            SetpieceSpec("Thread_Clue_Board", "Cube", 0.0, 0.43, 164.0, (1.85, 0.04, 0.82), "wall", "사진 실 단서 보드", 540.0),
            SetpieceSpec("Diary_Reading_Table", "Cube", 0.0, -0.23, 56.0, (1.18, 0.72, 0.24), "brass", "일기 탐색 테이블", 420.0),
            SetpieceSpec("False_Book_Wall", "Cube", -0.19, 0.37, 92.0, (0.92, 0.06, 0.42), "accent", "가짜 책 금고 벽", 620.0),
            SetpieceSpec("HintPhone_Niche", "Cube", 0.30, -0.36, 86.0, (0.52, 0.10, 0.44), "glass", "힌트폰 벽감", 580.0),
        ),
    ),
    RoomSetpieceSet(
        "PremiumEscape_Room02_CafePromise",
        (
            SetpieceSpec("Cafe_L_Counter_Long", "Cube", -0.18, -0.36, 70.0, (2.8, 0.34, 0.52), "prop", "L자 카페 카운터", 430.0),
            SetpieceSpec("Cafe_L_Counter_Return", "Cube", 0.38, -0.10, 70.0, (0.34, 1.85, 0.52), "prop", "카운터 반환부", 430.0),
            SetpieceSpec("Menu_Lightbox", "Cube", 0.0, 0.45, 184.0, (2.2, 0.04, 0.50), "glass", "메뉴판 라이트박스", 760.0),
            SetpieceSpec("Booth_Privacy_Back", "Cube", -0.36, 0.05, 92.0, (0.82, 0.08, 0.70), "wall", "좌석 칸막이", 280.0),
            SetpieceSpec("Syrup_Button_Bar", "Cylinder", 0.24, -0.32, 108.0, (0.44, 0.44, 0.08), "accent", "색상 버튼 바", 720.0),
            SetpieceSpec("Receipt_Track_Table", "Cube", 0.14, 0.18, 64.0, (1.20, 0.36, 0.16), "brass", "영수증 레일 테이블", 520.0),
        ),
    ),
    RoomSetpieceSet(
        "PremiumEscape_Room03_RainRepair",
        (
            SetpieceSpec("Rain_Window_Panes", "Cube", -0.43, 0.35, 176.0, (0.06, 1.75, 1.10), "glass", "빗물 창문 패널", 860.0),
            SetpieceSpec("Pipe_Wall_Main", "Cylinder", 0.18, 0.38, 166.0, (0.12, 0.12, 1.35), "brass", "주 파이프 라인", 620.0),
            SetpieceSpec("Pipe_Wall_Cross", "Cylinder", 0.34, 0.25, 126.0, (0.10, 0.10, 1.10), "accent", "교차 파이프 라인", 620.0),
            SetpieceSpec("Fuse_Breaker_Cabinet", "Cube", 0.42, -0.06, 128.0, (0.42, 0.12, 0.92), "wall", "퓨즈 차단기 캐비닛", 520.0),
            SetpieceSpec("Repair_Workbench", "Cube", -0.12, -0.36, 62.0, (1.35, 0.42, 0.30), "prop", "수리 작업대", 350.0),
            SetpieceSpec("Magnet_Test_Plate", "Sphere", -0.32, -0.16, 94.0, (0.34, 0.18, 0.28), "accent", "자석 테스트 플레이트", 780.0),
        ),
    ),
    RoomSetpieceSet(
        "PremiumEscape_Room04_NightCity",
        (
            SetpieceSpec("Mini_Skyline_Row", "Cube", -0.12, 0.20, 92.0, (2.80, 0.24, 0.88), "shadow", "미니 도시 스카이라인", 500.0),
            SetpieceSpec("Neon_Route_Sign", "Cube", -0.32, -0.42, 182.0, (1.20, 0.04, 0.36), "glass", "네온 경로 표지", 1050.0),
            SetpieceSpec("Bridge_Route_Table", "Cube", -0.04, -0.22, 54.0, (1.80, 0.28, 0.12), "brass", "다리 경로 모형", 460.0),
            SetpieceSpec("Elevator_Door_Frame", "Cube", 0.43, 0.02, 150.0, (0.36, 0.10, 1.35), "wall", "엘리베이터 문 프레임", 420.0),
            SetpieceSpec("Rooftop_Rail_Long", "Cube", 0.0, -0.47, 118.0, (4.1, 0.06, 0.32), "accent", "옥상 난간", 650.0),
            SetpieceSpec("Safe_Platform", "Cylinder", 0.28, 0.22, 54.0, (0.62, 0.62, 0.16), "brass", "금고 회전 받침대", 560.0),
        ),
    ),
    RoomSetpieceSet(
        "PremiumEscape_Room05_HeavenVault",
        (
            SetpieceSpec("Cloud_Aisle_Platform", "Sphere", -0.24, -0.30, 34.0, (0.86, 0.52, 0.16), "glass", "구름길 발판", 780.0),
            SetpieceSpec("Memory_Column_Left", "Cylinder", -0.30, 0.08, 176.0, (0.28, 0.28, 1.52), "wall", "기억 기둥 좌", 620.0),
            SetpieceSpec("Memory_Column_Right", "Cylinder", 0.30, 0.08, 176.0, (0.28, 0.28, 1.52), "wall", "기억 기둥 우", 620.0),
            SetpieceSpec("Letter_Vault_Dais", "Cylinder", 0.0, -0.06, 48.0, (0.90, 0.90, 0.18), "brass", "편지 금고 단상", 720.0),
            SetpieceSpec("Heart_Gate_Pillar_Left", "Cube", -0.24, 0.42, 184.0, (0.26, 0.20, 1.34), "accent", "하트 게이트 기둥 좌", 900.0),
            SetpieceSpec("Heart_Gate_Pillar_Right", "Cube", 0.24, 0.42, 184.0, (0.26, 0.20, 1.34), "accent", "하트 게이트 기둥 우", 900.0),
        ),
    ),
)


def spawn_room_setpieces(room: RoomSpec) -> int:
    count = 0
    for spec in _setpieces_for(room).pieces:
        count += _spawn_setpiece(room, spec)
    return count


def _setpieces_for(room: RoomSpec) -> RoomSetpieceSet:
    for setpieces in SETPIECE_SETS:
        if setpieces.room_prefix == room.prefix:
            return setpieces
    return RoomSetpieceSet(room.prefix, ())


def _spawn_setpiece(room: RoomSpec, spec: SetpieceSpec) -> int:
    location = unreal.Vector(room.x + room.width * spec.x_ratio, room.depth * spec.y_ratio, spec.z)
    scale = unreal.Vector(spec.scale[0], spec.scale[1], spec.scale[2])
    label = f"PE_Setpiece_{room.prefix}_{spec.name}"
    material = _material_for(room, spec.role)
    match spec.shape:
        case "Cube":
            _cube(label, location, scale, material)
        case "Cylinder":
            _shape(label, "Cylinder", location, scale, material)
        case "Sphere":
            _shape(label, "Sphere", location, scale, material)
        case unreachable:
            assert_never(unreachable)
    _text(f"{label}_Cue", spec.cue, unreal.Vector(location.x, location.y - 42.0, location.z + 62.0), unreal.Rotator(0.0, 0.0, 0.0), 10.0)
    _point_light(f"{label}_SignatureGlow", unreal.Vector(location.x, location.y - 22.0, location.z + 44.0), color(room), spec.glow, 280.0)
    return 3


def _material_for(room: RoomSpec, role: MaterialRole) -> str:
    match role:
        case "wall":
            return wall_material_path(room)
        case "floor":
            return floor_material_path(room)
        case "accent":
            return accent_material_path(room)
        case "prop":
            return prop_material_path(room)
        case "shadow":
            return material_path("DeepShadow")
        case "glass":
            return material_path("GlassTeal")
        case "brass":
            return material_path("BrassEdge")
        case unreachable:
            assert_never(unreachable)
