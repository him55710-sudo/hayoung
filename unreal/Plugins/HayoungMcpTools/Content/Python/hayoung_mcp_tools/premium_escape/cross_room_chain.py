from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from typing import Final

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _text

from .specs import RoomSpec
from .visuals import accent_material_path, material_path, prop_material_path


@dataclass(frozen=True, slots=True)
class CrossRoomFragment:
    source_room: RoomSpec
    code_piece: str
    clue_role: str
    rel_x: float
    rel_y: float


def spawn_cross_room_puzzle_chain(rooms: Sequence[RoomSpec]) -> int:
    fragments = _fragments_for(rooms)
    final_room = rooms[-1]
    count = 0
    for index, fragment in enumerate(fragments, start=1):
        count += _spawn_source_fragment(index, fragment, final_room)
    count += _spawn_final_receiver(final_room, fragments)
    return count


def _fragments_for(rooms: Sequence[RoomSpec]) -> tuple[CrossRoomFragment, ...]:
    return (
        CrossRoomFragment(rooms[0], "5", "사진 날짜에서 첫 자리", -248.0, -186.0),
        CrossRoomFragment(rooms[1], "0", "영수증 화살표 뒤 빈 자리", 238.0, 230.0),
        CrossRoomFragment(rooms[2], "0", "퓨즈 전압계가 멈춘 자리", -196.0, 292.0),
        CrossRoomFragment(rooms[3], "HEART", "옥상 창문 신호의 하트 키", 310.0, 248.0),
    )


def _spawn_source_fragment(index: int, fragment: CrossRoomFragment, final_room: RoomSpec) -> int:
    room = fragment.source_room
    label = f"PE_CrossChain_{room.prefix}_Fragment_{index:02d}"
    origin = unreal.Vector(room.x + fragment.rel_x, fragment.rel_y, 116.0)
    _cube(f"{label}_HiddenPocket", origin, unreal.Vector(0.34, 0.030, 0.16), prop_material_path(room))
    _cube(f"{label}_CodeShard", unreal.Vector(origin.x, origin.y - 13.0, origin.z + 18.0), unreal.Vector(0.22, 0.018, 0.075), accent_material_path(room))
    _shape(f"{label}_PickupToken", "Sphere", unreal.Vector(origin.x - 34.0, origin.y - 17.0, origin.z + 16.0), unreal.Vector(0.052, 0.052, 0.052), material_path("RoseGlow"))
    _text(f"{label}_RoleText", fragment.clue_role, unreal.Vector(origin.x, origin.y - 26.0, origin.z + 42.0), unreal.Rotator(0.0, 0.0, 0.0), 5.4)
    _text(f"{label}_CodeText", fragment.code_piece, unreal.Vector(origin.x, origin.y - 30.0, origin.z + 2.0), unreal.Rotator(0.0, 0.0, 0.0), 7.0)
    _cube(f"{label}_InventoryTag", unreal.Vector(origin.x + 42.0, origin.y - 12.0, origin.z - 18.0), unreal.Vector(0.14, 0.018, 0.046), material_path("BrassEdge"))
    _cube(f"{label}_DependencyLine_ToFinal", unreal.Vector((room.x + final_room.x) / 2.0, room.depth / 2.0 + 18.0, 230.0), unreal.Vector(max(0.32, abs(final_room.x - room.x) / 220.0), 0.012, 0.012), accent_material_path(room))
    _point_light(f"{label}_MemoryPulse", unreal.Vector(origin.x, origin.y - 36.0, origin.z + 34.0), _accent(room), 170.0, 145.0)
    return 8


def _spawn_final_receiver(final_room: RoomSpec, fragments: tuple[CrossRoomFragment, ...]) -> int:
    base = f"PE_CrossChain_{final_room.prefix}_FinalReceiver"
    origin = unreal.Vector(final_room.x - 312.0, -final_room.depth / 2.0 + 164.0, 132.0)
    _cube(f"{base}_ConsoleBase", origin, unreal.Vector(1.08, 0.18, 0.32), prop_material_path(final_room))
    _cube(f"{base}_CombinationBoard", unreal.Vector(origin.x, origin.y - 20.0, origin.z + 54.0), unreal.Vector(1.12, 0.026, 0.28), material_path("DeepShadow"))
    _text(f"{base}_CombinationText", "최종 조합: 5 0 0 + HEART", unreal.Vector(origin.x, origin.y - 34.0, origin.z + 82.0), unreal.Rotator(0.0, 0.0, 0.0), 7.2)
    count = 3
    for index, fragment in enumerate(fragments, start=1):
        slot_x = origin.x - 162.0 + index * 70.0
        slot = unreal.Vector(slot_x, origin.y - 34.0, origin.z + 22.0)
        _cube(f"{base}_ReceiverSlot_{index:02d}", slot, unreal.Vector(0.24, 0.024, 0.09), material_path("BrassEdge"))
        _text(f"{base}_ReceiverSlotText_{index:02d}", fragment.code_piece, unreal.Vector(slot.x, slot.y - 10.0, slot.z + 18.0), unreal.Rotator(0.0, 0.0, 0.0), 5.2)
        _cube(f"{base}_DependencyLine_{index:02d}", unreal.Vector(slot.x, slot.y - 12.0, slot.z - 28.0), unreal.Vector(0.020, 0.32, 0.020), accent_material_path(fragment.source_room))
        _point_light(f"{base}_ReceiverGlow_{index:02d}", unreal.Vector(slot.x, slot.y - 30.0, slot.z + 34.0), _accent(fragment.source_room), 120.0, 125.0)
        count += 4
    _cube(f"{base}_FinalLockCable", unreal.Vector(final_room.x - 62.0, origin.y - 26.0, 152.0), unreal.Vector(1.82, 0.018, 0.018), material_path("GlassTeal"))
    _text(f"{base}_EscapeCafeRule", "앞 방 조각을 회수해야 마지막 자물쇠 입력이 성립한다", unreal.Vector(origin.x + 48.0, origin.y - 42.0, origin.z - 42.0), unreal.Rotator(0.0, 0.0, 0.0), 5.4)
    _point_light(f"{base}_SolvedPathBloom", unreal.Vector(origin.x + 178.0, origin.y - 64.0, origin.z + 88.0), _accent(final_room), 360.0, 320.0)
    return count + 3


def _accent(room: RoomSpec) -> "unreal.LinearColor":
    return unreal.LinearColor(room.accent[0], room.accent[1], room.accent[2], 1.0)
