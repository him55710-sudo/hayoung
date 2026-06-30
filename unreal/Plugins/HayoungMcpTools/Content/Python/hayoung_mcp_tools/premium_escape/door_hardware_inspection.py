from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass, field

import unreal

from .specs import ROOMS


@dataclass(frozen=True, slots=True)
class DoorHardwareCounts:
    actor_count: int
    door_count: int
    hinge_pin_count: int
    handle_count: int
    closer_count: int
    seal_count: int
    strike_count: int
    tactile_count: int
    audio_anchor_count: int
    sensor_count: int


@dataclass(slots=True)  # noqa: MUTABLE_OK
class _MutableDoorHardwareCounts:
    """Mutable accumulator for one door-hardware inspection pass."""

    actor_count: int = 0
    door_count: int = 0
    hinge_pin_count: int = 0
    handle_count: int = 0
    closer_count: int = 0
    seal_count: int = 0
    strike_count: int = 0
    tactile_count: int = 0
    audio_anchor_count: int = 0
    sensor_count: int = 0
    rooms: set[str] = field(default_factory=set)

    def consume(self, label: str) -> None:
        if not label.startswith("PE_DoorHardware_"):
            return
        self.actor_count += 1
        self.door_count += int(label.endswith("_BackerPanel"))
        self.hinge_pin_count += int(label.endswith("_HingePin"))
        self.handle_count += int(label.endswith("_LeverHandle"))
        self.closer_count += int(label.endswith("_DoorCloserBody"))
        self.seal_count += int("_RubberSeal_" in label or label.endswith("_BrushSeal_Bottom"))
        self.strike_count += int(label.endswith("_StrikeReceiver"))
        self.tactile_count += int(
            label.endswith("_TouchWearPlate")
            or label.endswith("_FingerSmudge")
            or label.endswith("_PalmPressureGhost"),
        )
        self.audio_anchor_count += int(label.endswith("_CreakAudioSource"))
        self.sensor_count += int("_MagneticContact" in label or label.endswith("_SensorLamp"))
        for room in ROOMS:
            if label.startswith(f"PE_DoorHardware_{room.prefix}_"):
                self.rooms.add(room.prefix)

    def freeze(self) -> DoorHardwareCounts:
        return DoorHardwareCounts(
            self.actor_count,
            len(self.rooms),
            self.hinge_pin_count,
            self.handle_count,
            self.closer_count,
            self.seal_count,
            self.strike_count,
            self.tactile_count,
            self.audio_anchor_count,
            self.sensor_count,
        )


def collect_door_hardware_counts(actors: Iterable["unreal.Actor"]) -> DoorHardwareCounts:
    counts = _MutableDoorHardwareCounts()
    for actor in actors:
        counts.consume(actor.get_actor_label())
    return counts.freeze()
