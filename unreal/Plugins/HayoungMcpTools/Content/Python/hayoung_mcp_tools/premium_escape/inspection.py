from __future__ import annotations

import unreal

from .inspection_result import RuntimeInspection
from .inspection_scene_counts import collect_scene_actor_counts
from .lock_hardware_inspection import collect_lock_hardware_counts
from .door_hardware_inspection import collect_door_hardware_counts
from .operations_inspection import collect_operations_counts
from .lighting_quality_inspection import collect_lighting_quality_counts
from .cross_room_chain_inspection import collect_cross_room_chain_counts
from .ending_inspection import collect_ending_counts
from .escape_cafe_props_inspection import collect_escape_cafe_prop_counts
from .secret_discovery_inspection import collect_secret_discovery_counts
from .runtime_secret_inspection import collect_runtime_secret_counts
from .runtime_escape_cafe_props_inspection import collect_runtime_escape_cafe_prop_counts
from .puzzle_feedback_inspection import collect_puzzle_feedback_counts
from .room_dressing_quality_inspection import collect_room_dressing_quality_counts
from .runtime_actor_counts import RuntimeActorCounts


def inspect_runtime_escape_cafe() -> str:
    actors = unreal.get_editor_subsystem(unreal.EditorActorSubsystem).get_all_level_actors()
    runtime = RuntimeActorCounts()
    for actor in actors:
        runtime.consume(actor)
    scene = collect_scene_actor_counts(actors)
    lock_hardware = collect_lock_hardware_counts(actors)
    door_hardware = collect_door_hardware_counts(actors)
    operations = collect_operations_counts(actors)
    lighting_quality = collect_lighting_quality_counts(actors)
    puzzle_feedback = collect_puzzle_feedback_counts(actors)
    cross_room = collect_cross_room_chain_counts(actors)
    ending = collect_ending_counts(actors)
    secret_discovery = collect_secret_discovery_counts(actors)
    runtime_secret = collect_runtime_secret_counts(actors)
    escape_cafe_props = collect_escape_cafe_prop_counts(actors)
    runtime_escape_cafe_props = collect_runtime_escape_cafe_prop_counts(actors)
    room_dressing_quality = collect_room_dressing_quality_counts(actors)
    hud_class_loaded = bool(unreal.load_class(None, "/Script/Hayoung500.HYEscapeHUD"))
    return RuntimeInspection(
        runtime.lock_count,
        runtime.door_count,
        runtime.doors_with_required_key,
        runtime.doors_with_creak_sound,
        runtime.doors_with_locked_sound,
        runtime.audio_volume_count,
        runtime.audio_volumes_with_ambience,
        len(runtime.room_ambience_sounds),
        runtime.audio_volumes_with_runtime_settings,
        runtime.audio_volumes_with_footstep_surface,
        len(runtime.room_footstep_surfaces),
        runtime.locks_with_expected_input,
        runtime.locks_with_hint,
        runtime.locks_with_input_sound,
        len(runtime.lock_input_sounds),
        len(runtime.lock_success_sounds),
        runtime.locks_with_detail_components,
        runtime.locks_with_kind_hardware,
        len(runtime.lock_kinds),
        runtime.prop_count,
        runtime.props_with_sound,
        len(runtime.prop_sounds),
        scene.setpiece_actor_count,
        scene.mechanism_actor_count,
        scene.dressing_actor_count,
        scene.camera_actor_count,
        scene.path_actor_count,
        scene.playability_actor_count,
        scene.playability_room_count,
        scene.playability_reach_target_count,
        scene.playability_door_clearance_count,
        scene.hint_actor_count,
        scene.hint_room_count,
        scene.hint_penalty_step_count,
        scene.hint_staff_channel_count,
        scene.timer_actor_count,
        scene.timer_room_count,
        scene.timer_countdown_display_count,
        scene.timer_emergency_channel_count,
        scene.spatial_audio_actor_count,
        scene.first_person_foley_actor_count,
        scene.first_person_foley_room_count,
        scene.first_person_foley_emitter_count,
        scene.unique_foley_sound_count,
        scene.door_transition_actor_count,
        scene.door_transition_pair_count,
        scene.door_transition_emitter_count,
        door_hardware.actor_count,
        door_hardware.door_count,
        door_hardware.hinge_pin_count,
        door_hardware.handle_count,
        door_hardware.closer_count,
        door_hardware.seal_count,
        door_hardware.strike_count,
        door_hardware.tactile_count,
        door_hardware.audio_anchor_count,
        door_hardware.sensor_count,
        operations.actor_count,
        operations.room_count,
        operations.intercom_count,
        operations.emergency_release_count,
        operations.reset_checklist_count,
        operations.cctv_recording_count,
        operations.no_force_label_count,
        operations.maglock_status_count,
        operations.staff_key_count,
        operations.maintenance_count,
        operations.prop_inventory_count,
        operations.audio_anchor_count,
        lighting_quality.actor_count,
        lighting_quality.room_count,
        lighting_quality.post_process_count,
        lighting_quality.key_light_count,
        lighting_quality.fill_light_count,
        lighting_quality.rim_light_count,
        lighting_quality.puzzle_light_count,
        lighting_quality.exit_light_count,
        lighting_quality.volumetric_beam_count,
        lighting_quality.dust_mote_count,
        lighting_quality.reflection_card_count,
        lighting_quality.shadow_catcher_count,
        lighting_quality.exposure_anchor_count,
        puzzle_feedback.actor_count,
        puzzle_feedback.room_count,
        puzzle_feedback.station_count,
        puzzle_feedback.success_lamp_count,
        puzzle_feedback.error_lamp_count,
        puzzle_feedback.progress_node_count,
        puzzle_feedback.correction_frame_count,
        puzzle_feedback.reward_glow_count,
        puzzle_feedback.reset_cue_count,
        puzzle_feedback.hand_rebound_count,
        puzzle_feedback.audio_anchor_count,
        scene.clue_chain_actor_count,
        cross_room.actor_count,
        cross_room.fragment_count,
        cross_room.receiver_slot_count,
        cross_room.dependency_line_count,
        scene.progress_actor_count,
        scene.lock_motion_actor_count,
        scene.lock_operation_actor_count,
        scene.lock_operation_station_count,
        scene.unique_lock_operation_kind_count,
        lock_hardware.actor_count,
        lock_hardware.station_count,
        lock_hardware.room_count,
        lock_hardware.shackle_count,
        lock_hardware.keyway_count,
        lock_hardware.tactile_count,
        lock_hardware.sound_port_count,
        lock_hardware.feedback_lamp_count,
        lock_hardware.hardware_detail_count,
        lock_hardware.unique_lock_kind_count,
        scene.search_surface_actor_count,
        escape_cafe_props.actor_count,
        escape_cafe_props.room_count,
        escape_cafe_props.station_count,
        escape_cafe_props.hidden_panel_count,
        escape_cafe_props.key_cache_count,
        escape_cafe_props.lock_hardware_count,
        escape_cafe_props.direction_route_count,
        escape_cafe_props.electronic_input_count,
        escape_cafe_props.reveal_ghost_count,
        escape_cafe_props.tactile_target_count,
        escape_cafe_props.audio_anchor_count,
        secret_discovery.actor_count,
        secret_discovery.room_count,
        secret_discovery.hidden_panel_count,
        secret_discovery.reveal_ghost_count,
        secret_discovery.reward_cache_count,
        secret_discovery.tool_cue_count,
        secret_discovery.dependency_link_count,
        runtime_secret.actor_count,
        runtime_secret.room_count,
        runtime_secret.interactable_count,
        runtime_secret.sound_count,
        runtime_secret.reward_key_count,
        runtime_secret.required_key_count,
        runtime_secret.motion_count,
        ending.actor_count,
        ending.photo_spot_count,
        ending.letter_count,
        ending.audio_cue_count,
        scene.room_shape_actor_count,
        scene.room_shape_room_count,
        scene.unique_room_footprint_count,
        scene.cinematic_actor_count,
        scene.cinematic_room_count,
        scene.visual_actor_count,
        _count_material_assets(),
        _count_audio_assets(),
        hud_class_loaded,
        runtime_escape_cafe_props.actor_count,
        runtime_escape_cafe_props.room_count,
        runtime_escape_cafe_props.interactable_count,
        runtime_escape_cafe_props.props_with_sound,
        runtime_escape_cafe_props.reward_key_count,
        runtime_escape_cafe_props.motion_config_count,
        runtime_escape_cafe_props.hardware_count,
        runtime_escape_cafe_props.cue_count,
        runtime_escape_cafe_props.glow_count,
        room_dressing_quality.actor_count,
        room_dressing_quality.room_count,
        room_dressing_quality.wall_panel_count,
        room_dressing_quality.trim_count,
        room_dressing_quality.ceiling_service_count,
        room_dressing_quality.practical_light_count,
        room_dressing_quality.search_affordance_count,
        room_dressing_quality.wear_count,
        room_dressing_quality.material_break_count,
    ).to_json()


def _count_material_assets() -> int:
    material_assets = unreal.EditorAssetLibrary.list_assets("/Game/Hayoung500/Materials", recursive=True, include_folder=False)
    return sum(1 for asset in material_assets if asset.endswith(".M_PE_WarmPlaster") or "/M_PE_" in asset)


def _count_audio_assets() -> int:
    audio_assets = unreal.EditorAssetLibrary.list_assets("/Game/Hayoung500/Audio", recursive=True, include_folder=False)
    return sum(1 for asset in audio_assets if "/Game/Hayoung500/Audio/" in asset)
