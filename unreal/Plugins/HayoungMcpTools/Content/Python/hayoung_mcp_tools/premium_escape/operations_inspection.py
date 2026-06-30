from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass

import unreal

from .specs import ROOMS


@dataclass(frozen=True, slots=True)
class OperationsCounts:
    actor_count: int
    room_count: int
    intercom_count: int
    emergency_release_count: int
    reset_checklist_count: int
    cctv_recording_count: int
    no_force_label_count: int
    maglock_status_count: int
    staff_key_count: int
    maintenance_count: int
    prop_inventory_count: int
    audio_anchor_count: int


def collect_operations_counts(actors: Iterable["unreal.Actor"]) -> OperationsCounts:
    actor_count = 0
    intercom_count = 0
    emergency_release_count = 0
    reset_checklist_count = 0
    cctv_recording_count = 0
    no_force_label_count = 0
    maglock_status_count = 0
    staff_key_count = 0
    maintenance_count = 0
    prop_inventory_count = 0
    audio_anchor_count = 0
    rooms: set[str] = set()
    for actor in actors:
        label = actor.get_actor_label()
        if not label.startswith("PE_Operations_"):
            continue
        actor_count += 1
        intercom_count += int(label.endswith("_IntercomBase"))
        emergency_release_count += int(label.endswith("_EmergencyReleaseBox"))
        reset_checklist_count += int(label.endswith("_ResetChecklist"))
        cctv_recording_count += int(label.endswith("_CCTVRecordLamp"))
        no_force_label_count += int("_NoForceLabel_" in label)
        maglock_status_count += int(label.endswith("_MaglockStatusPanel"))
        staff_key_count += int(label.endswith("_StaffKeyReplica"))
        maintenance_count += int("_Maintenance_" in label)
        prop_inventory_count += int(label.endswith("_PropInventoryBoard"))
        audio_anchor_count += int(label.endswith("_StaffBuzzEmitter"))
        for room in ROOMS:
            if label.startswith(f"PE_Operations_{room.prefix}_"):
                rooms.add(room.prefix)
    return OperationsCounts(
        actor_count,
        len(rooms),
        intercom_count,
        emergency_release_count,
        reset_checklist_count,
        cctv_recording_count,
        no_force_label_count,
        maglock_status_count,
        staff_key_count,
        maintenance_count,
        prop_inventory_count,
        audio_anchor_count,
    )
