from __future__ import annotations

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _text

from .level_ops import color
from .locks import spawn_lock_station
from .specs import RoomSpec
from .visuals import accent_material_path, floor_material_path, material_path, prop_material_path, wall_material_path


def spawn_room(room: RoomSpec, density: int) -> int:
    count = _spawn_shell(room)
    count += _spawn_decor(room, density)
    for lock in room.locks:
        count += spawn_lock_station(room, lock)
    return count


def _spawn_shell(room: RoomSpec) -> int:
    accent = color(room)
    half_w = room.width / 2.0
    half_d = room.depth / 2.0
    _cube(f"{room.prefix}_Floor_UniqueFootprint", unreal.Vector(room.x, 0.0, -10.0), unreal.Vector(room.width / 100.0, room.depth / 100.0, 0.12), floor_material_path(room))
    _cube(f"{room.prefix}_Back_Wall_Dressed", unreal.Vector(room.x, half_d, room.height / 2.0), unreal.Vector(room.width / 100.0, 0.10, room.height / 100.0), wall_material_path(room))
    _cube(f"{room.prefix}_Left_Wall_Dressed", unreal.Vector(room.x - half_w, 0.0, room.height / 2.0), unreal.Vector(0.10, room.depth / 100.0, room.height / 100.0), wall_material_path(room))
    _cube(f"{room.prefix}_Right_Wall_Dressed", unreal.Vector(room.x + half_w, 0.0, room.height / 2.0), unreal.Vector(0.10, room.depth / 100.0, room.height / 100.0), wall_material_path(room))
    _cube(f"{room.prefix}_Ceiling_ShadowGrid", unreal.Vector(room.x, 0.0, room.height + 6.0), unreal.Vector(room.width / 100.0, room.depth / 100.0, 0.06), wall_material_path(room))
    _text(f"{room.prefix}_Title", room.title, unreal.Vector(room.x, half_d - 18.0, room.height - 58.0), unreal.Rotator(0.0, 180.0, 0.0), 36.0)
    _text(f"{room.prefix}_Subtitle", room.subtitle, unreal.Vector(room.x, half_d - 22.0, room.height - 102.0), unreal.Rotator(0.0, 180.0, 0.0), 18.0)
    _text(f"{room.prefix}_Layout_Note", room.layout_note, unreal.Vector(room.x - half_w + 120.0, -half_d + 48.0, 110.0), unreal.Rotator(0.0, 25.0, 0.0), 16.0)
    _point_light(f"{room.prefix}_Practical_KeyLight", unreal.Vector(room.x - half_w * 0.35, -half_d * 0.15, room.height - 82.0), accent, 1800.0, max(room.width, room.depth))
    _point_light(f"{room.prefix}_Puzzle_RimLight", unreal.Vector(room.x + half_w * 0.32, half_d * 0.26, 185.0), accent, 950.0, 520.0)
    return 10 + _spawn_shape_variant(room)


def _spawn_shape_variant(room: RoomSpec) -> int:
    half_w = room.width / 2.0
    half_d = room.depth / 2.0
    match room.prefix:
        case "PremiumEscape_Room01_DiaryArchive":
            _cube(f"PE_RoomShape_{room.prefix}_ParallelArchiveAisle_Left", unreal.Vector(room.x - 135.0, -half_d + 190.0, 92.0), unreal.Vector(0.34, 2.65, 1.55), prop_material_path(room))
            _cube(f"PE_RoomShape_{room.prefix}_ParallelArchiveAisle_Right", unreal.Vector(room.x + 135.0, -half_d + 190.0, 92.0), unreal.Vector(0.34, 2.65, 1.55), prop_material_path(room))
            _cube(f"PE_RoomShape_{room.prefix}_FalseBookcase_HingeGap", unreal.Vector(room.x + half_w - 92.0, 58.0, 112.0), unreal.Vector(0.18, 1.18, 1.82), accent_material_path(room))
            _cube(f"PE_RoomShape_{room.prefix}_KneeholeDesk_SearchNook", unreal.Vector(room.x - half_w + 115.0, -half_d + 105.0, 54.0), unreal.Vector(1.05, 0.56, 0.24), prop_material_path(room))
            _cube(f"PE_RoomShape_{room.prefix}_PhotoTrough_HiddenSlot", unreal.Vector(room.x, half_d - 68.0, 76.0), unreal.Vector(1.9, 0.12, 0.18), accent_material_path(room))
            _text(f"PE_RoomShape_{room.prefix}_FlowNote", "narrow archive aisles -> kneehole desk -> hinged bookcase", unreal.Vector(room.x - 170.0, -half_d + 42.0, 142.0), unreal.Rotator(0.0, 20.0, 0.0), 9.0)
            return 6
        case "PremiumEscape_Room02_CafePromise":
            _cube(f"PE_RoomShape_{room.prefix}_LShape_Service_Alcove", unreal.Vector(room.x + half_w - 95.0, -half_d + 165.0, 75.0), unreal.Vector(1.65, 2.4, 1.5), prop_material_path(room))
            _cube(f"PE_RoomShape_{room.prefix}_BoothPocket_DoubleSeat", unreal.Vector(room.x - half_w + 150.0, half_d - 118.0, 45.0), unreal.Vector(1.30, 0.44, 0.28), floor_material_path(room))
            _cube(f"PE_RoomShape_{room.prefix}_ReceiptRail_CounterRun", unreal.Vector(room.x + 62.0, -half_d + 78.0, 103.0), unreal.Vector(2.25, 0.08, 0.10), accent_material_path(room))
            _cube(f"PE_RoomShape_{room.prefix}_CupTray_Island", unreal.Vector(room.x - 95.0, -35.0, 58.0), unreal.Vector(0.82, 0.46, 0.16), prop_material_path(room))
            _cube(f"PE_RoomShape_{room.prefix}_StaffPassThrough_Window", unreal.Vector(room.x + half_w - 108.0, half_d - 122.0, 154.0), unreal.Vector(0.16, 0.92, 0.56), accent_material_path(room))
            _text(f"PE_RoomShape_{room.prefix}_FlowNote", "L-counter search -> booth coaster -> staff box", unreal.Vector(room.x - 250.0, -half_d + 54.0, 150.0), unreal.Rotator(0.0, 18.0, 0.0), 9.0)
            return 6
        case "PremiumEscape_Room03_RainRepair":
            _cube(f"PE_RoomShape_{room.prefix}_RaisedPipeCatwalk", unreal.Vector(room.x - 75.0, half_d - 115.0, 62.0), unreal.Vector(2.05, 0.36, 0.20), floor_material_path(room))
            _cube(f"PE_RoomShape_{room.prefix}_SunkenServiceTrench", unreal.Vector(room.x + 38.0, -half_d + 135.0, -2.0), unreal.Vector(1.65, 0.72, 0.05), material_path("DeepShadow"))
            _cube(f"PE_RoomShape_{room.prefix}_RainWindow_Recess", unreal.Vector(room.x - half_w + 84.0, 58.0, 162.0), unreal.Vector(0.12, 1.46, 1.28), accent_material_path(room))
            _cube(f"PE_RoomShape_{room.prefix}_FuseWall_ServiceBay", unreal.Vector(room.x + half_w - 90.0, -45.0, 132.0), unreal.Vector(0.18, 1.10, 1.28), prop_material_path(room))
            _shape(f"PE_RoomShape_{room.prefix}_ValveRing_Clearance", "Cylinder", unreal.Vector(room.x + 92.0, -half_d + 190.0, 82.0), unreal.Vector(0.42, 0.42, 0.04), accent_material_path(room))
            _text(f"PE_RoomShape_{room.prefix}_FlowNote", "wet window -> service trench -> fuse wall -> valve ring", unreal.Vector(room.x - 200.0, -half_d + 56.0, 150.0), unreal.Rotator(0.0, 22.0, 0.0), 9.0)
            return 6
        case "PremiumEscape_Room04_NightCity":
            _cube(f"PE_RoomShape_{room.prefix}_Raised_Rooftop_Balcony", unreal.Vector(room.x, -half_d + 95.0, 62.0), unreal.Vector(room.width / 130.0, 1.25, 0.22), floor_material_path(room))
            _cube(f"PE_RoomShape_{room.prefix}_Catwalk_Rail", unreal.Vector(room.x, -half_d + 170.0, 122.0), unreal.Vector(room.width / 130.0, 0.08, 0.44), accent_material_path(room))
            _cube(f"PE_RoomShape_{room.prefix}_ElevatorVestibule_Nook", unreal.Vector(room.x + half_w - 125.0, half_d - 118.0, 108.0), unreal.Vector(1.12, 0.70, 1.26), prop_material_path(room))
            _cube(f"PE_RoomShape_{room.prefix}_MiniSkyline_LongTable", unreal.Vector(room.x - 105.0, 35.0, 55.0), unreal.Vector(2.75, 0.70, 0.20), material_path("DeepShadow"))
            _cube(f"PE_RoomShape_{room.prefix}_BridgeRoute_DiagonalHint", unreal.Vector(room.x + 120.0, -80.0, 82.0), unreal.Vector(1.42, 0.08, 0.06), accent_material_path(room))
            _text(f"PE_RoomShape_{room.prefix}_FlowNote", "balcony skyline -> elevator vestibule -> safe route", unreal.Vector(room.x - 315.0, -half_d + 58.0, 150.0), unreal.Rotator(0.0, 17.0, 0.0), 9.0)
            return 6
        case "PremiumEscape_Room05_HeavenVault":
            _shape(f"PE_RoomShape_{room.prefix}_Circular_Vault_Base", "Cylinder", unreal.Vector(room.x, 35.0, 4.0), unreal.Vector(4.8, 4.8, 0.08), accent_material_path(room))
            _shape(f"PE_RoomShape_{room.prefix}_InnerCloud_RingPath", "Cylinder", unreal.Vector(room.x, 35.0, 18.0), unreal.Vector(2.95, 2.95, 0.045), floor_material_path(room))
            _cube(f"PE_RoomShape_{room.prefix}_LetterAltar_Front", unreal.Vector(room.x, -half_d + 170.0, 74.0), unreal.Vector(1.25, 0.42, 0.34), prop_material_path(room))
            _cube(f"PE_RoomShape_{room.prefix}_MemoryColumn_Left", unreal.Vector(room.x - 330.0, 75.0, 138.0), unreal.Vector(0.30, 0.30, 1.95), accent_material_path(room))
            _cube(f"PE_RoomShape_{room.prefix}_MemoryColumn_Right", unreal.Vector(room.x + 330.0, 75.0, 138.0), unreal.Vector(0.30, 0.30, 1.95), accent_material_path(room))
            _text(f"PE_RoomShape_{room.prefix}_FlowNote", "cloud ring path -> letter altar -> heart gate", unreal.Vector(room.x - 260.0, -half_d + 64.0, 160.0), unreal.Rotator(0.0, 19.0, 0.0), 9.0)
            return 6
        case _:
            return 0


def _spawn_decor(room: RoomSpec, density: int) -> int:
    count = 0
    for index, decor in enumerate(room.decor):
        x_offset = -room.width * 0.34 + index * (room.width * 0.17)
        y_offset = -room.depth * 0.28 + (index % 2) * room.depth * 0.24
        _cube(f"{room.prefix}_Decor_{decor}_Tableau", unreal.Vector(room.x + x_offset, y_offset, 48.0), unreal.Vector(0.78, 0.30, 0.30), prop_material_path(room))
        _text(f"{room.prefix}_Decor_{decor}_Label", decor.replace("_", " "), unreal.Vector(room.x + x_offset, y_offset - 32.0, 98.0), unreal.Rotator(0.0, 0.0, 0.0), 13.0)
        count += 2
    for index in range(density):
        _cube(f"{room.prefix}_Searchable_Clue_Surface_{index + 1}", unreal.Vector(room.x - 210.0 + index * 95.0, -room.depth * 0.08, 26.0), unreal.Vector(0.42, 0.22, 0.055), accent_material_path(room))
        count += 1
    return count
