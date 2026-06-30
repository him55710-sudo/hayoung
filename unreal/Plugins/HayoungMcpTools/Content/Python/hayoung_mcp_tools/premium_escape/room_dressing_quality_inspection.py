from __future__ import annotations

from dataclasses import dataclass, field

from .specs import ROOMS


@dataclass(frozen=True, slots=True)
class RoomDressingQualityCounts:
    actor_count: int
    room_count: int
    wall_panel_count: int
    trim_count: int
    ceiling_service_count: int
    practical_light_count: int
    search_affordance_count: int
    wear_count: int
    material_break_count: int


def collect_room_dressing_quality_counts(actors: list["unreal.Actor"]) -> RoomDressingQualityCounts:
    counts = _MutableRoomDressingQualityCounts()
    for actor in actors:
        counts.consume(actor.get_actor_label())
    return counts.freeze()


@dataclass(slots=True)  # noqa: MUTABLE_OK
class _MutableRoomDressingQualityCounts:
    actor_count: int = 0
    wall_panel_count: int = 0
    trim_count: int = 0
    ceiling_service_count: int = 0
    practical_light_count: int = 0
    search_affordance_count: int = 0
    wear_count: int = 0
    material_break_count: int = 0
    rooms: set[str] = field(default_factory=set)

    def consume(self, label: str) -> None:
        if not label.startswith("PE_RoomDressing_"):
            return
        self.actor_count += 1
        self.wall_panel_count += int("_WallPanel_" in label)
        self.trim_count += int("_Trim_" in label)
        self.ceiling_service_count += int("_CeilingService_" in label)
        self.practical_light_count += int("_PracticalLight_" in label)
        self.search_affordance_count += int("_SearchAffordance_" in label)
        self.wear_count += int("_Wear_" in label)
        self.material_break_count += int("_MaterialBreak_" in label)
        for room in ROOMS:
            if label.startswith(f"PE_RoomDressing_{room.prefix}_"):
                self.rooms.add(room.prefix)

    def freeze(self) -> RoomDressingQualityCounts:
        return RoomDressingQualityCounts(
            self.actor_count,
            len(self.rooms),
            self.wall_panel_count,
            self.trim_count,
            self.ceiling_service_count,
            self.practical_light_count,
            self.search_affordance_count,
            self.wear_count,
            self.material_break_count,
        )
