from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass, field

from .specs import ROOMS


@dataclass(frozen=True, slots=True)
class EscapeCafePropCounts:
    actor_count: int
    room_count: int
    station_count: int
    hidden_panel_count: int
    key_cache_count: int
    lock_hardware_count: int
    direction_route_count: int
    electronic_input_count: int
    reveal_ghost_count: int
    tactile_target_count: int
    audio_anchor_count: int


@dataclass(slots=True)  # noqa: MUTABLE_OK
class _MutableEscapeCafePropCounts:
    actor_count: int = 0
    station_count: int = 0
    hidden_panel_count: int = 0
    key_cache_count: int = 0
    lock_hardware_count: int = 0
    direction_route_count: int = 0
    electronic_input_count: int = 0
    reveal_ghost_count: int = 0
    tactile_target_count: int = 0
    audio_anchor_count: int = 0
    rooms: set[str] = field(default_factory=set)

    def consume(self, label: str) -> None:
        if not label.startswith("PE_RealEscapeProp_"):
            return
        self.actor_count += 1
        self.station_count += int(label.endswith("_StationPlate"))
        self.hidden_panel_count += int("_HiddenPanel_" in label)
        self.key_cache_count += int("_KeyCache_" in label)
        self.lock_hardware_count += int("_LockHardware_" in label)
        self.direction_route_count += int("_DirectionArrow_" in label)
        self.electronic_input_count += int("_ElectronicInput_" in label)
        self.reveal_ghost_count += int(label.endswith("_RevealGhost"))
        self.tactile_target_count += int(label.endswith("_HandTarget"))
        self.audio_anchor_count += int(label.endswith("_AudioAnchor"))
        for room in ROOMS:
            if label.startswith(f"PE_RealEscapeProp_{room.prefix}_"):
                self.rooms.add(room.prefix)

    def freeze(self) -> EscapeCafePropCounts:
        return EscapeCafePropCounts(
            self.actor_count,
            len(self.rooms),
            self.station_count,
            self.hidden_panel_count,
            self.key_cache_count,
            self.lock_hardware_count,
            self.direction_route_count,
            self.electronic_input_count,
            self.reveal_ghost_count,
            self.tactile_target_count,
            self.audio_anchor_count,
        )


def collect_escape_cafe_prop_counts(actors: Iterable["unreal.Actor"]) -> EscapeCafePropCounts:
    counts = _MutableEscapeCafePropCounts()
    for actor in actors:
        counts.consume(actor.get_actor_label())
    return counts.freeze()
