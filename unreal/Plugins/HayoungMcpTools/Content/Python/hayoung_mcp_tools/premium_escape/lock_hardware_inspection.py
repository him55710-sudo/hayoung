from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass, field

import unreal

from .specs import ROOMS


@dataclass(frozen=True, slots=True)
class LockHardwareCounts:
    actor_count: int
    station_count: int
    room_count: int
    shackle_count: int
    keyway_count: int
    tactile_count: int
    sound_port_count: int
    feedback_lamp_count: int
    hardware_detail_count: int
    unique_lock_kind_count: int


@dataclass(slots=True)  # noqa: MUTABLE_OK
class _MutableLockHardwareCounts:
    """Mutable accumulator for one lock-hardware inspection pass."""

    actor_count: int = 0
    station_count: int = 0
    shackle_count: int = 0
    keyway_count: int = 0
    tactile_count: int = 0
    sound_port_count: int = 0
    feedback_lamp_count: int = 0
    hardware_detail_count: int = 0
    rooms: set[str] = field(default_factory=set)
    lock_kinds: set[str] = field(default_factory=set)

    def consume(self, label: str) -> None:
        if not label.startswith("PE_LockHardware_"):
            return
        self.actor_count += 1
        self.station_count += int(label.endswith("_Backplate"))
        self.shackle_count += int(label.endswith("_Shackle"))
        self.keyway_count += int(label.endswith("_Keyway"))
        self.tactile_count += int(label.endswith("_TactileGrip"))
        self.sound_port_count += int(label.endswith("_SoundPort"))
        self.feedback_lamp_count += int(label.endswith("_SolvedLamp") or label.endswith("_ErrorLamp"))
        self.hardware_detail_count += int("_HardwareDetail_" in label)
        for room in ROOMS:
            if label.startswith(f"PE_LockHardware_{room.prefix}_"):
                self.rooms.add(room.prefix)
                for lock in room.locks:
                    if f"_{lock.kind.value}_" in label:
                        self.lock_kinds.add(lock.kind.value)

    def freeze(self) -> LockHardwareCounts:
        return LockHardwareCounts(
            self.actor_count,
            self.station_count,
            len(self.rooms),
            self.shackle_count,
            self.keyway_count,
            self.tactile_count,
            self.sound_port_count,
            self.feedback_lamp_count,
            self.hardware_detail_count,
            len(self.lock_kinds),
        )


def collect_lock_hardware_counts(actors: Iterable["unreal.Actor"]) -> LockHardwareCounts:
    counts = _MutableLockHardwareCounts()
    for actor in actors:
        counts.consume(actor.get_actor_label())
    return counts.freeze()
