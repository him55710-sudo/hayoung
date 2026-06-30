from __future__ import annotations

from dataclasses import dataclass, field

from .first_person_foley import FOLEY_PROFILES
from .specs import ROOMS


@dataclass(frozen=True, slots=True)
class SceneActorCounts:
    setpiece_actor_count: int
    mechanism_actor_count: int
    dressing_actor_count: int
    camera_actor_count: int
    path_actor_count: int
    playability_actor_count: int
    playability_room_count: int
    playability_reach_target_count: int
    playability_door_clearance_count: int
    hint_actor_count: int
    hint_room_count: int
    hint_penalty_step_count: int
    hint_staff_channel_count: int
    timer_actor_count: int
    timer_room_count: int
    timer_countdown_display_count: int
    timer_emergency_channel_count: int
    spatial_audio_actor_count: int
    first_person_foley_actor_count: int
    first_person_foley_room_count: int
    first_person_foley_emitter_count: int
    door_transition_actor_count: int
    door_transition_pair_count: int
    door_transition_emitter_count: int
    clue_chain_actor_count: int
    progress_actor_count: int
    lock_motion_actor_count: int
    lock_operation_actor_count: int
    lock_operation_station_count: int
    unique_lock_operation_kind_count: int
    search_surface_actor_count: int
    room_shape_actor_count: int
    room_shape_room_count: int
    unique_room_footprint_count: int
    cinematic_actor_count: int
    cinematic_room_count: int
    visual_actor_count: int
    unique_foley_sound_count: int


def collect_scene_actor_counts(actors: list["unreal.Actor"]) -> SceneActorCounts:
    counts = _MutableSceneCounts()
    for actor in actors:
        counts.consume(actor)
    return counts.freeze()


@dataclass(slots=True)
class _MutableSceneCounts:  # noqa: MUTABLE_OK
    setpiece_actor_count: int = 0
    mechanism_actor_count: int = 0
    dressing_actor_count: int = 0
    camera_actor_count: int = 0
    path_actor_count: int = 0
    playability_actor_count: int = 0
    spatial_audio_actor_count: int = 0
    first_person_foley_actor_count: int = 0
    first_person_foley_emitter_count: int = 0
    door_transition_actor_count: int = 0
    door_transition_emitter_count: int = 0
    clue_chain_actor_count: int = 0
    progress_actor_count: int = 0
    lock_motion_actor_count: int = 0
    lock_operation_actor_count: int = 0
    search_surface_actor_count: int = 0
    room_shape_actor_count: int = 0
    cinematic_actor_count: int = 0
    visual_actor_count: int = 0
    hint_actor_count: int = 0
    timer_actor_count: int = 0
    playability_reach_target_count: int = 0
    playability_door_clearance_count: int = 0
    hint_penalty_step_count: int = 0
    hint_staff_channel_count: int = 0
    timer_countdown_display_count: int = 0
    timer_emergency_channel_count: int = 0
    playability_rooms: set[str] = field(default_factory=set)
    hint_rooms: set[str] = field(default_factory=set)
    timer_rooms: set[str] = field(default_factory=set)
    first_person_foley_rooms: set[str] = field(default_factory=set)
    foley_sounds: set[str] = field(default_factory=set)
    door_transition_pairs: set[str] = field(default_factory=set)
    lock_operation_stations: set[str] = field(default_factory=set)
    lock_operation_kinds: set[str] = field(default_factory=set)
    room_shape_rooms: set[str] = field(default_factory=set)
    cinematic_rooms: set[str] = field(default_factory=set)

    def consume(self, actor: "unreal.Actor") -> None:
        label = actor.get_actor_label()
        self._consume_simple_prefixes(label)
        self._consume_playability(label)
        self._consume_hints(label)
        self._consume_timers(label)
        self._consume_foley(actor, label)
        self._consume_transitions(label)
        self._consume_lock_operations(label)
        self._consume_room_identity(label)

    def freeze(self) -> SceneActorCounts:
        room_footprints = {f"{room.width:.1f}x{room.depth:.1f}x{room.height:.1f}" for room in ROOMS}
        return SceneActorCounts(
            self.setpiece_actor_count,
            self.mechanism_actor_count,
            self.dressing_actor_count,
            self.camera_actor_count,
            self.path_actor_count,
            self.playability_actor_count,
            len(self.playability_rooms),
            self.playability_reach_target_count,
            self.playability_door_clearance_count,
            self.hint_actor_count,
            len(self.hint_rooms),
            self.hint_penalty_step_count,
            self.hint_staff_channel_count,
            self.timer_actor_count,
            len(self.timer_rooms),
            self.timer_countdown_display_count,
            self.timer_emergency_channel_count,
            self.spatial_audio_actor_count,
            self.first_person_foley_actor_count,
            len(self.first_person_foley_rooms),
            self.first_person_foley_emitter_count,
            self.door_transition_actor_count,
            len(self.door_transition_pairs),
            self.door_transition_emitter_count,
            self.clue_chain_actor_count,
            self.progress_actor_count,
            self.lock_motion_actor_count,
            self.lock_operation_actor_count,
            len(self.lock_operation_stations),
            len(self.lock_operation_kinds),
            self.search_surface_actor_count,
            self.room_shape_actor_count,
            len(self.room_shape_rooms),
            len(room_footprints),
            self.cinematic_actor_count,
            len(self.cinematic_rooms),
            self.visual_actor_count,
            len(self.foley_sounds),
        )

    def _consume_simple_prefixes(self, label: str) -> None:
        self.setpiece_actor_count += int(label.startswith("PE_Setpiece_"))
        self.mechanism_actor_count += int(label.startswith("PE_Mechanism_"))
        self.dressing_actor_count += int(label.startswith("PE_Dressing_"))
        self.camera_actor_count += int(label.startswith("PE_Camera_"))
        self.path_actor_count += int(label.startswith("PE_Path_"))
        self.spatial_audio_actor_count += int(label.startswith("PE_SpatialAudio_"))
        self.clue_chain_actor_count += int(label.startswith("PE_ClueChain_"))
        self.progress_actor_count += int(label.startswith("PE_Progress_"))
        self.lock_motion_actor_count += int(label.startswith("PE_LockMotion_"))
        self.search_surface_actor_count += int(label.startswith("PE_SearchSurface_"))
        self.visual_actor_count += int(label.startswith("PE_Visual_"))

    def _consume_playability(self, label: str) -> None:
        if not label.startswith("PE_Playability_"):
            return
        self.playability_actor_count += 1
        for room in ROOMS:
            if label.startswith(f"PE_Playability_{room.prefix}_"):
                self.playability_rooms.add(room.prefix)
        self.playability_reach_target_count += int("_Reach_" in label)
        self.playability_door_clearance_count += int("_DoorClearance_" in label)

    def _consume_hints(self, label: str) -> None:
        if not label.startswith("PE_Hint_"):
            return
        self.hint_actor_count += 1
        for room in ROOMS:
            if label.startswith(f"PE_Hint_{room.prefix}_"):
                self.hint_rooms.add(room.prefix)
        self.hint_penalty_step_count += int("_PenaltyStep_" in label)
        staff_label = "_CctvDome" in label or "_MicCapsule" in label or "_SpeakerReplyPanel" in label
        self.hint_staff_channel_count += int(staff_label)

    def _consume_timers(self, label: str) -> None:
        if not label.startswith("PE_Timer_"):
            return
        self.timer_actor_count += 1
        for room in ROOMS:
            if label.startswith(f"PE_Timer_{room.prefix}_"):
                self.timer_rooms.add(room.prefix)
        self.timer_countdown_display_count += int("_CountdownScreen" in label)
        emergency_label = "_EmergencyButton" in label or "_ExitMap" in label or "_StaffTimerSync" in label
        self.timer_emergency_channel_count += int(emergency_label)

    def _consume_foley(self, actor: "unreal.Actor", label: str) -> None:
        if not label.startswith("PE_Foley_"):
            return
        self.first_person_foley_actor_count += 1
        for profile in FOLEY_PROFILES:
            if label.startswith(f"PE_Foley_{profile.prefix}_"):
                self.first_person_foley_rooms.add(profile.prefix)
        if label.endswith("_Emitter"):
            self.first_person_foley_emitter_count += 1
            component = actor.get_editor_property("audio_component")
            sound = component.get_editor_property("sound")
            if sound:
                self.foley_sounds.add(str(sound.get_path_name()))

    def _consume_transitions(self, label: str) -> None:
        if not label.startswith("PE_Transition_"):
            return
        self.door_transition_actor_count += 1
        for index in range(len(ROOMS) - 1):
            pair = f"PE_Transition_{ROOMS[index].prefix}_To_{ROOMS[index + 1].prefix}"
            if label.startswith(pair):
                self.door_transition_pairs.add(pair)
        self.door_transition_emitter_count += int(label.endswith("_DoorCreakEmitter"))

    def _consume_lock_operations(self, label: str) -> None:
        if not label.startswith("PE_LockOperation_"):
            return
        self.lock_operation_actor_count += 1
        for room in ROOMS:
            for index, lock in enumerate(room.locks):
                station = f"PE_LockOperation_{room.prefix}_L{index + 1:02d}_{lock.kind.value}"
                if label.startswith(station):
                    self.lock_operation_stations.add(station)
                    self.lock_operation_kinds.add(lock.kind.value)

    def _consume_room_identity(self, label: str) -> None:
        if label.startswith("PE_RoomShape_"):
            self.room_shape_actor_count += 1
            for room in ROOMS:
                if label.startswith(f"PE_RoomShape_{room.prefix}_"):
                    self.room_shape_rooms.add(room.prefix)
        if label.startswith("PE_Cinematic_"):
            self.cinematic_actor_count += 1
            for room in ROOMS:
                if label.startswith(f"PE_Cinematic_{room.prefix}_"):
                    self.cinematic_rooms.add(room.prefix)
