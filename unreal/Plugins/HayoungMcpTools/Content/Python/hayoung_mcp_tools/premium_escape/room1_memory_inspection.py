from __future__ import annotations

import json
from dataclasses import dataclass

import unreal

from .room1_memory_assets import beef_material_available, beef_texture_available
from .room1_memory_specs import REQUIRED_ROOM1_LABELS, ROOM1_PROTO_PREFIX


@dataclass(frozen=True, slots=True)
class Room1MemoryInspection:
    actor_count: int
    runtime_lock_count: int
    runtime_prop_count: int
    room2_door_count: int
    beef_texture_imported: bool
    beef_material_created: bool
    force_no_precomputed_lighting: bool
    static_component_count: int
    missing_labels: tuple[str, ...]

    def is_ready(self) -> bool:
        return (
            self.actor_count >= 70
            and self.runtime_lock_count == 2
            and self.runtime_prop_count >= 10
            and self.room2_door_count == 1
            and self.beef_texture_imported
            and self.beef_material_created
            and self.force_no_precomputed_lighting
            and self.static_component_count == 0
            and len(self.missing_labels) == 0
        )

    def to_json(self) -> str:
        return json.dumps(
            {
                "actor_count": self.actor_count,
                "runtime_lock_count": self.runtime_lock_count,
                "runtime_prop_count": self.runtime_prop_count,
                "room2_door_count": self.room2_door_count,
                "beef_texture_imported": self.beef_texture_imported,
                "beef_material_created": self.beef_material_created,
                "force_no_precomputed_lighting": self.force_no_precomputed_lighting,
                "static_component_count": self.static_component_count,
                "missing_labels": list(self.missing_labels),
                "ready": self.is_ready(),
            },
            ensure_ascii=False,
        )


def inspect_room1_memory_prototype() -> str:
    actors = unreal.get_editor_subsystem(unreal.EditorActorSubsystem).get_all_level_actors()
    labels = {actor.get_actor_label() for actor in actors}
    room1_actors = [actor for actor in actors if actor.get_actor_label().startswith(ROOM1_PROTO_PREFIX)]
    runtime_lock_count = sum(1 for actor in room1_actors if actor.get_actor_label().endswith("_Lock"))
    runtime_prop_count = sum(1 for actor in room1_actors if actor.get_actor_label().endswith("_Prop"))
    room2_door_count = sum(1 for actor in room1_actors if actor.get_actor_label() == f"{ROOM1_PROTO_PREFIX}_DoorToRoom2")
    missing_labels = tuple(label for label in REQUIRED_ROOM1_LABELS if label not in labels)
    return Room1MemoryInspection(
        len(room1_actors),
        runtime_lock_count,
        runtime_prop_count,
        room2_door_count,
        beef_texture_available(),
        beef_material_available(),
        _force_no_precomputed_lighting(),
        _static_component_count(room1_actors),
        missing_labels,
    ).to_json()


def _force_no_precomputed_lighting() -> bool:
    world = unreal.EditorLevelLibrary.get_editor_world()
    return bool(world.get_world_settings().get_editor_property("force_no_precomputed_lighting"))


def _static_component_count(actors: list["unreal.Actor"]) -> int:
    count = 0
    for actor in actors:
        for component in actor.get_components_by_class(unreal.SceneComponent):
            if component.get_editor_property("mobility") == unreal.ComponentMobility.STATIC:
                count += 1
    return count
