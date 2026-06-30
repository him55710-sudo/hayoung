from __future__ import annotations

from dataclasses import dataclass
from typing import Final, Literal, TypeAlias, assert_never

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _text

from .specs import RoomSpec
from .visuals import accent_material_path, material_path, prop_material_path

SurfaceKind: TypeAlias = Literal["drawer", "false_bottom", "locked_box", "lens_tool", "key_cache"]
Scale: TypeAlias = tuple[float, float, float]


@dataclass(frozen=True, slots=True)
class SearchStation:
    name: str
    kind: SurfaceKind
    x_ratio: float
    y_ratio: float
    cue: str


@dataclass(frozen=True, slots=True)
class RoomSearchPlan:
    room_prefix: str
    label: str
    stations: tuple[SearchStation, ...]


@dataclass(frozen=True, slots=True)
class SearchContext:
    room: RoomSpec
    station: SearchStation
    index: int
    label: str
    origin: "unreal.Vector"


SEARCH_PLANS: Final[tuple[RoomSearchPlan, ...]] = (
    RoomSearchPlan("PremiumEscape_Room01_DiaryArchive", "archive shelves", (SearchStation("BookmarkDrawer", "drawer", -0.31, -0.22, "book spine count -> drawer key"), SearchStation("LetterFalseBottom", "false_bottom", 0.16, -0.34, "lift velvet floor for date scrap"), SearchStation("BrassKeyHook", "key_cache", 0.34, 0.18, "magnet key under frame"), SearchStation("PhotoFrameSlot", "locked_box", -0.06, 0.26, "photo frame opens after four digits"), SearchStation("DustyIndexLens", "lens_tool", 0.30, -0.04, "blue lens reveals bookmark order"))),
    RoomSearchPlan("PremiumEscape_Room02_CafePromise", "cafe counter", (SearchStation("ReceiptTill", "drawer", -0.28, 0.16, "receipt order hidden in cash tray"), SearchStation("MenuUvLens", "lens_tool", 0.05, -0.30, "UV coaster reveals button colors"), SearchStation("ServiceLockBox", "locked_box", 0.32, 0.25, "staff box accepts direction code"), SearchStation("BoothCushionFalseBottom", "false_bottom", -0.36, 0.35, "booth cushion hides arrow napkin"), SearchStation("CupTagCache", "key_cache", 0.23, -0.05, "cup tag order unlocks service bell"))),
    RoomSearchPlan("PremiumEscape_Room03_RainRepair", "repair bench", (SearchStation("FuseCabinet", "locked_box", -0.32, 0.26, "fuse hasp opens after magnet clue"), SearchStation("PipeFalseBottom", "false_bottom", 0.18, -0.12, "pipe tray hides wet number strip"), SearchStation("ToolDrawer", "drawer", 0.34, -0.32, "tool drawer slides after key pickup"), SearchStation("RainGaugeLens", "lens_tool", -0.12, 0.36, "lens aligns droplets into keypad digits"), SearchStation("ValveKeyCache", "key_cache", 0.30, 0.08, "valve ring releases small cabinet key"))),
    RoomSearchPlan("PremiumEscape_Room04_NightCity", "rooftop model", (SearchStation("SkylineDrawer", "drawer", -0.28, 0.17, "building heights sit in drawer order"), SearchStation("ElevatorLockBox", "locked_box", 0.29, -0.18, "safe dial route in elevator box"), SearchStation("SignalLens", "lens_tool", 0.03, 0.32, "lens aligns window initials"), SearchStation("BridgeFalsePanel", "false_bottom", -0.08, -0.30, "bridge deck lifts for left-right route"), SearchStation("NeonKeyCache", "key_cache", 0.36, 0.12, "neon tag hides gate key"))),
    RoomSearchPlan("PremiumEscape_Room05_HeavenVault", "final vault", (SearchStation("CloudFalseBottom", "false_bottom", -0.30, -0.22, "cloud tile lifts for final number"), SearchStation("LetterVaultBox", "locked_box", 0.12, 0.28, "letter box grants heart key"), SearchStation("EndingKeyCache", "key_cache", 0.34, -0.05, "final key glows under pearl tray"), SearchStation("MemoryColumnDrawer", "drawer", -0.10, 0.06, "column drawer stores previous room tokens"), SearchStation("HaloLensReveal", "lens_tool", 0.26, 0.32, "halo lens reveals final order"))),
)


def spawn_room_search_surfaces(room: RoomSpec) -> int:
    plan = _plan_for(room)
    count = 0
    for index, station in enumerate(plan.stations):
        origin = unreal.Vector(room.x + room.width * station.x_ratio, room.depth * station.y_ratio, 76.0)
        label = f"PE_SearchSurface_{room.prefix}_{index + 1:02d}_{station.name}"
        count += _spawn_station(SearchContext(room, station, index, label, origin))
    return count


def _spawn_station(context: SearchContext) -> int:
    _cube(f"{context.label}_SearchTable", context.origin, unreal.Vector(0.54, 0.20, 0.12), prop_material_path(context.room))
    _cube(f"{context.label}_InteractionZone", _point(context, (0.0, -20.0, 24.0)), unreal.Vector(0.58, 0.022, 0.018), accent_material_path(context.room))
    _text(f"{context.label}_Cue", context.station.cue, _point(context, (0.0, -26.0, 42.0)), unreal.Rotator(0.0, 0.0, 0.0), 5.6)
    _point_light(f"{context.label}_SearchGlow", _point(context, (0.0, -42.0, 45.0)), _accent(context.room), 165.0, 140.0)
    return 4 + _spawn_surface_kind(context) + _spawn_evidence_bits(context)


def _spawn_surface_kind(context: SearchContext) -> int:
    match context.station.kind:
        case "drawer":
            return _spawn_drawer(context)
        case "false_bottom":
            return _spawn_false_bottom(context)
        case "locked_box":
            return _spawn_locked_box(context)
        case "lens_tool":
            return _spawn_lens_tool(context)
        case "key_cache":
            return _spawn_key_cache(context)
        case unreachable:
            assert_never(unreachable)


def _spawn_drawer(context: SearchContext) -> int:
    _cube(f"{context.label}_DrawerFaceClosed", _point(context, (0.0, -15.0, 4.0)), unreal.Vector(0.44, 0.026, 0.10), material_path("WalnutDark"))
    _cube(f"{context.label}_DrawerSlideGhost", _point(context, (0.0, -46.0, 4.0)), unreal.Vector(0.40, 0.018, 0.08), material_path("GlassTeal"))
    _shape(f"{context.label}_HandlePull", "Cylinder", _point(context, (0.0, -19.0, 8.0)), unreal.Vector(0.045, 0.045, 0.16), material_path("BrassEdge"))
    _cube(f"{context.label}_HiddenSlip", _point(context, (16.0, -48.0, 12.0)), unreal.Vector(0.16, 0.014, 0.05), material_path("HeavenPearl"))
    return 4


def _spawn_false_bottom(context: SearchContext) -> int:
    _cube(f"{context.label}_FalseFloorPanel", _point(context, (0.0, -12.0, 5.0)), unreal.Vector(0.43, 0.018, 0.028), material_path("WalnutDark"))
    _cube(f"{context.label}_LiftedCornerGhost", _point(context, (-20.0, -18.0, 18.0)), unreal.Vector(0.13, 0.014, 0.04), material_path("GlassTeal"))
    _cube(f"{context.label}_SeamLine", _point(context, (0.0, -19.0, 15.0)), unreal.Vector(0.46, 0.010, 0.010), material_path("RoseGlow"))
    _text(f"{context.label}_TinyMark", "PULL", _point(context, (22.0, -24.0, 22.0)), unreal.Rotator(0.0, 0.0, 0.0), 4.0)
    return 4


def _spawn_locked_box(context: SearchContext) -> int:
    _cube(f"{context.label}_LockBoxBody", _point(context, (0.0, -12.0, 12.0)), unreal.Vector(0.34, 0.18, 0.16), material_path("DeepShadow"))
    _cube(f"{context.label}_HaspPlate", _point(context, (0.0, -24.0, 16.0)), unreal.Vector(0.18, 0.014, 0.07), material_path("BrassEdge"))
    _shape(f"{context.label}_PadlockLoop", "Cylinder", _point(context, (0.0, -29.0, 30.0)), unreal.Vector(0.07, 0.07, 0.025), accent_material_path(context.room))
    _cube(f"{context.label}_OpenLidGhost", _point(context, (0.0, -42.0, 33.0)), unreal.Vector(0.36, 0.014, 0.035), material_path("GlassTeal"))
    return 4


def _spawn_lens_tool(context: SearchContext) -> int:
    _shape(f"{context.label}_UvLens", "Cylinder", _point(context, (-18.0, -16.0, 15.0)), unreal.Vector(0.09, 0.09, 0.018), material_path("GlassTeal"))
    _cube(f"{context.label}_UvTorch", _point(context, (18.0, -16.0, 15.0)), unreal.Vector(0.22, 0.035, 0.035), material_path("DeepShadow"))
    _cube(f"{context.label}_RevealCard", _point(context, (0.0, -37.0, 11.0)), unreal.Vector(0.32, 0.014, 0.075), material_path("HeavenPearl"))
    _point_light(f"{context.label}_UvRevealLight", _point(context, (0.0, -42.0, 25.0)), unreal.LinearColor(0.4, 0.48, 1.0, 1.0), 120.0, 90.0)
    return 4


def _spawn_key_cache(context: SearchContext) -> int:
    _cube(f"{context.label}_KeyTagRack", _point(context, (0.0, -16.0, 17.0)), unreal.Vector(0.34, 0.014, 0.10), material_path("BrassEdge"))
    for slot in range(3):
        _shape(f"{context.label}_KeyTag_{slot + 1}", "Cylinder", _point(context, (-18.0 + slot * 18.0, -25.0, 10.0)), unreal.Vector(0.035, 0.035, 0.012), accent_material_path(context.room))
    return 4


def _spawn_evidence_bits(context: SearchContext) -> int:
    _cube(f"{context.label}_ScratchDirection", _point(context, (-30.0, -9.0, -12.0)), unreal.Vector(0.18, 0.012, 0.010), material_path("RoseGlow"))
    _cube(f"{context.label}_DustFreeOutline", _point(context, (28.0, -9.0, -11.0)), unreal.Vector(0.14, 0.012, 0.010), material_path("HeavenPearl"))
    return 2


def _plan_for(room: RoomSpec) -> RoomSearchPlan:
    for plan in SEARCH_PLANS:
        if plan.room_prefix == room.prefix:
            return plan
    return RoomSearchPlan(room.prefix, room.title, ())


def _point(context: SearchContext, offset: Scale) -> "unreal.Vector":
    return unreal.Vector(context.origin.x + offset[0], context.origin.y + offset[1], context.origin.z + offset[2])


def _accent(room: RoomSpec) -> "unreal.LinearColor":
    return unreal.LinearColor(room.accent[0], room.accent[1], room.accent[2], 1.0)
