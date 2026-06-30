from __future__ import annotations

import json
from dataclasses import dataclass

import unreal

from .level_ops import LABEL_PREFIXES


@dataclass(frozen=True, slots=True)
class LightingPolicyResult:
    generated_actor_count: int
    movable_component_count: int
    static_component_count: int
    force_no_precomputed_lighting: bool

    def to_json(self) -> str:
        return json.dumps(
            {
                "generated_actor_count": self.generated_actor_count,
                "movable_component_count": self.movable_component_count,
                "static_component_count": self.static_component_count,
                "force_no_precomputed_lighting": self.force_no_precomputed_lighting,
                "ready": self.force_no_precomputed_lighting and self.static_component_count == 0,
            },
            ensure_ascii=False,
        )


def apply_dynamic_lighting_policy() -> LightingPolicyResult:
    world = unreal.EditorLevelLibrary.get_editor_world()
    settings = world.get_world_settings()
    settings.set_editor_property("force_no_precomputed_lighting", True)
    generated_actor_count = 0
    movable_component_count = 0
    static_component_count = 0
    actors = unreal.get_editor_subsystem(unreal.EditorActorSubsystem).get_all_level_actors()
    for actor in actors:
        if not actor.get_actor_label().startswith(LABEL_PREFIXES):
            continue
        generated_actor_count += 1
        for component in actor.get_components_by_class(unreal.SceneComponent):
            if hasattr(component, "set_mobility"):
                component.set_mobility(unreal.ComponentMobility.MOVABLE)
                movable_component_count += 1
            if _is_static(component):
                static_component_count += 1
    return LightingPolicyResult(
        generated_actor_count,
        movable_component_count,
        static_component_count,
        bool(settings.get_editor_property("force_no_precomputed_lighting")),
    )


def inspect_dynamic_lighting_policy() -> str:
    return apply_dynamic_lighting_policy().to_json()


def _is_static(component: "unreal.SceneComponent") -> bool:
    if not hasattr(component, "get_editor_property"):
        return False
    return component.get_editor_property("mobility") == unreal.ComponentMobility.STATIC
