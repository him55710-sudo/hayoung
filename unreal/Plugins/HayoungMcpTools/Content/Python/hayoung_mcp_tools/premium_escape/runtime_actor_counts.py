from __future__ import annotations

from dataclasses import dataclass, field

import unreal


@dataclass(slots=True)  # noqa: MUTABLE_OK
class RuntimeActorCounts:
    lock_count: int = 0
    door_count: int = 0
    doors_with_required_key: int = 0
    doors_with_creak_sound: int = 0
    doors_with_locked_sound: int = 0
    audio_volume_count: int = 0
    audio_volumes_with_ambience: int = 0
    audio_volumes_with_runtime_settings: int = 0
    audio_volumes_with_footstep_surface: int = 0
    locks_with_expected_input: int = 0
    locks_with_hint: int = 0
    locks_with_input_sound: int = 0
    locks_with_detail_components: int = 0
    locks_with_kind_hardware: int = 0
    prop_count: int = 0
    props_with_sound: int = 0
    room_ambience_sounds: set[str] = field(default_factory=set)
    room_footstep_surfaces: set[str] = field(default_factory=set)
    lock_input_sounds: set[str] = field(default_factory=set)
    lock_success_sounds: set[str] = field(default_factory=set)
    lock_kinds: set[str] = field(default_factory=set)
    prop_sounds: set[str] = field(default_factory=set)

    def consume(self, actor: "unreal.Actor") -> None:
        label = actor.get_actor_label()
        if label.startswith("PE_Runtime_") and label.endswith("_LockActor"):
            self._consume_lock(actor)
        if label.startswith("PE_Runtime_") and label.endswith("_InteractableProp"):
            self._consume_prop(actor)
        if label.startswith("PE_Runtime_") and label.endswith("_DoorActor"):
            self._consume_door(actor)
        if label.startswith("PE_Runtime_") and label.endswith("_RoomAudioVolume"):
            self._consume_room_audio(actor)

    def _consume_lock(self, actor: "unreal.Actor") -> None:
        self.lock_count += 1
        self.locks_with_expected_input += int(bool(actor.get_editor_property("expected_input")))
        self.locks_with_hint += int(bool(actor.get_editor_property("interaction_hint")))
        input_sound = actor.get_editor_property("input_sound")
        if input_sound:
            self.locks_with_input_sound += 1
            self.lock_input_sounds.add(_asset_path(input_sound))
        success_sound = actor.get_editor_property("success_sound")
        if success_sound:
            self.lock_success_sounds.add(_asset_path(success_sound))
        self.locks_with_detail_components += int(len(actor.get_components_by_class(unreal.StaticMeshComponent)) >= 8)
        self.locks_with_kind_hardware += int(actor.has_runtime_lock_kind_hardware())
        self.lock_kinds.add(str(actor.get_editor_property("lock_kind")))

    def _consume_prop(self, actor: "unreal.Actor") -> None:
        self.prop_count += 1
        prop_sound = actor.get_editor_property("interaction_sound")
        if prop_sound:
            self.props_with_sound += 1
            self.prop_sounds.add(_asset_path(prop_sound))

    def _consume_door(self, actor: "unreal.Actor") -> None:
        self.door_count += 1
        self.doors_with_required_key += int(bool(actor.get_editor_property("required_key_id")))
        self.doors_with_creak_sound += int(bool(actor.get_editor_property("door_creak_sound")))
        self.doors_with_locked_sound += int(bool(actor.get_editor_property("locked_sound")))

    def _consume_room_audio(self, actor: "unreal.Actor") -> None:
        self.audio_volume_count += 1
        ambience_name = str(actor.get_room_ambience_debug_name())
        if actor.has_room_ambience() and ambience_name:
            self.audio_volumes_with_ambience += 1
            self.room_ambience_sounds.add(ambience_name)
        volume_ready = 0.2 <= actor.get_configured_volume_multiplier() <= 1.0
        fade_ready = 0.2 <= actor.get_fade_seconds() <= 3.0
        self.audio_volumes_with_runtime_settings += int(volume_ready and fade_ready)
        surface_name = str(actor.get_footstep_surface_name())
        if surface_name:
            self.audio_volumes_with_footstep_surface += 1
            self.room_footstep_surfaces.add(surface_name)


def _asset_path(asset: "unreal.SoundBase") -> str:
    return str(asset.get_path_name())
