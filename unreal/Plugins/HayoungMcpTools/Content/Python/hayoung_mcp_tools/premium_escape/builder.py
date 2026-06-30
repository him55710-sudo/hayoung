from __future__ import annotations

from .audio import ensure_audio_assets
from .builder_result import SceneResult
from .cinematic_ambience import spawn_room_cinematic_ambience
from .clue_chain import spawn_room_clue_chains
from .cross_room_chain import spawn_cross_room_puzzle_chain
from .door_hardware import spawn_room_door_hardware
from .dressing import spawn_room_dressing
from .door_transitions import spawn_door_transition
from .ending import spawn_finale_ceremony
from .escape_cafe_props import spawn_room_escape_cafe_props
from .fixtures import spawn_escape_cafe_fixtures
from .first_person_foley import spawn_room_first_person_foley
from .hints import spawn_room_hint_system
from .interactions import spawn_room_interactions
from .lighting_quality import spawn_room_lighting_quality
from .lighting_build_fix import apply_dynamic_lighting_policy
from .lock_hardware import spawn_room_lock_hardware
from .level_ops import LEVEL_PATH, clear_generated_actors, open_or_create_level, save_current_level, spawn_connector, spawn_finale, spawn_player_start
from .lock_motions import spawn_room_lock_motions
from .lock_operations import spawn_room_lock_operations
from .mechanisms import spawn_room_mechanisms
from .operations import spawn_room_operations
from .playability import spawn_room_playability
from .progression import spawn_room_progress
from .puzzle_feedback import spawn_room_puzzle_feedback
from .rooms import spawn_room
from .runtime import spawn_room_runtime
from .runtime_escape_cafe_props import spawn_room_runtime_escape_cafe_props
from .room_dressing_quality import spawn_room_dressing_quality
from .room1_memory_prototype import spawn_room1_memory_prototype
from .search_surfaces import spawn_room_search_surfaces
from .secret_discovery import spawn_room_secret_discovery
from .setpieces import spawn_room_setpieces
from .sightlines import spawn_first_person_sightlines
from .soundscape import spawn_room_audio
from .spatial_audio import spawn_room_spatial_audio
from .specs import ROOMS, RoomSpec
from .timers import spawn_room_timer_system
from .visuals import ensure_visual_materials, spawn_global_visuals, spawn_room_visuals


def create_legendary_escape_cafe(theme_label: str, fidelity_pass: int, enable_audio: bool) -> str:
    density = max(2, min(int(fidelity_pass), 5))
    open_or_create_level()
    clear_generated_actors()
    visual_material_count = ensure_visual_materials()
    audio_assets = ensure_audio_assets() if enable_audio else {}

    visual_count = spawn_global_visuals()
    spawned_count = spawn_player_start() + visual_count
    interaction_count = 0
    runtime_count = 0
    runtime_escape_cafe_prop_count = 0
    fixture_count = 0
    setpiece_count = 0
    mechanism_count = 0
    dressing_count = 0
    sightline_count = 0
    playability_count = 0
    hint_count = 0
    timer_count = 0
    spatial_audio_count = 0
    first_person_foley_count = 0
    door_transition_count = 0
    clue_chain_count = 0
    cross_room_chain_count = 0
    progress_count = 0
    lock_motion_count = 0
    lock_operation_count = 0
    door_hardware_count = 0
    operations_count = 0
    lighting_quality_count = 0
    puzzle_feedback_count = 0
    search_surface_count = 0
    escape_cafe_prop_count = 0
    secret_discovery_count = 0
    ending_count = 0
    cinematic_count = 0
    room_dressing_quality_count = 0
    room1_memory_prototype_count = 0
    required_gate_key: str | None = None
    previous_room: RoomSpec | None = None
    for room in ROOMS:
        spawned_count += spawn_room(room, density)
        room_visuals = spawn_room_visuals(room)
        spawned_count += room_visuals
        visual_count += room_visuals
        room_lighting_quality = spawn_room_lighting_quality(room)
        spawned_count += room_lighting_quality
        lighting_quality_count += room_lighting_quality
        room_fixtures = spawn_escape_cafe_fixtures(room, density)
        spawned_count += room_fixtures
        fixture_count += room_fixtures
        room_dressing = spawn_room_dressing(room)
        spawned_count += room_dressing
        dressing_count += room_dressing
        room_dressing_quality = spawn_room_dressing_quality(room)
        spawned_count += room_dressing_quality
        room_dressing_quality_count += room_dressing_quality
        room_setpieces = spawn_room_setpieces(room)
        spawned_count += room_setpieces
        setpiece_count += room_setpieces
        room_mechanisms = spawn_room_mechanisms(room)
        spawned_count += room_mechanisms
        mechanism_count += room_mechanisms
        room_clue_chains = spawn_room_clue_chains(room)
        spawned_count += room_clue_chains
        clue_chain_count += room_clue_chains
        room_progress = spawn_room_progress(room)
        spawned_count += room_progress
        progress_count += room_progress
        room_lock_motions = spawn_room_lock_motions(room)
        spawned_count += room_lock_motions
        lock_motion_count += room_lock_motions
        room_lock_operations = spawn_room_lock_operations(room)
        spawned_count += room_lock_operations
        lock_operation_count += room_lock_operations
        room_puzzle_feedback = spawn_room_puzzle_feedback(room, audio_assets)
        spawned_count += room_puzzle_feedback
        puzzle_feedback_count += room_puzzle_feedback
        spawned_count += spawn_room_lock_hardware(room)
        room_door_hardware = spawn_room_door_hardware(room, audio_assets)
        spawned_count += room_door_hardware
        door_hardware_count += room_door_hardware
        room_operations = spawn_room_operations(room, audio_assets)
        spawned_count += room_operations
        operations_count += room_operations
        room_search_surfaces = spawn_room_search_surfaces(room)
        spawned_count += room_search_surfaces
        search_surface_count += room_search_surfaces
        room_escape_cafe_props = spawn_room_escape_cafe_props(room, audio_assets)
        spawned_count += room_escape_cafe_props
        escape_cafe_prop_count += room_escape_cafe_props
        room_secret_discovery = spawn_room_secret_discovery(room)
        spawned_count += room_secret_discovery
        secret_discovery_count += room_secret_discovery
        room_cinematic = spawn_room_cinematic_ambience(room)
        spawned_count += room_cinematic
        cinematic_count += room_cinematic
        room_sightlines = spawn_first_person_sightlines(room)
        spawned_count += room_sightlines
        sightline_count += room_sightlines
        room_playability = spawn_room_playability(room)
        spawned_count += room_playability
        playability_count += room_playability
        room_hints = spawn_room_hint_system(room)
        spawned_count += room_hints
        hint_count += room_hints
        room_timers = spawn_room_timer_system(room)
        spawned_count += room_timers
        timer_count += room_timers
        spawned_count += spawn_room_audio(room, audio_assets)
        room_spatial_audio = spawn_room_spatial_audio(room, audio_assets)
        spawned_count += room_spatial_audio
        spatial_audio_count += room_spatial_audio
        room_first_person_foley = spawn_room_first_person_foley(room, audio_assets)
        spawned_count += room_first_person_foley
        first_person_foley_count += room_first_person_foley
        room_interactions = spawn_room_interactions(room)
        spawned_count += room_interactions
        interaction_count += room_interactions
        runtime_layer = spawn_room_runtime(room, audio_assets, required_gate_key)
        spawned_count += runtime_layer.spawned_count
        runtime_count += runtime_layer.spawned_count
        room_runtime_escape_props = spawn_room_runtime_escape_cafe_props(room, audio_assets)
        spawned_count += room_runtime_escape_props
        runtime_count += room_runtime_escape_props
        runtime_escape_cafe_prop_count += room_runtime_escape_props
        required_gate_key = runtime_layer.exit_key
        if previous_room is not None:
            spawned_count += spawn_connector(previous_room, room)
            room_transition = spawn_door_transition(previous_room, room, audio_assets)
            spawned_count += room_transition
            door_transition_count += room_transition
        previous_room = room

    room1_memory_prototype_count = spawn_room1_memory_prototype(audio_assets)
    spawned_count += room1_memory_prototype_count
    cross_room_chain_count = spawn_cross_room_puzzle_chain(ROOMS)
    spawned_count += cross_room_chain_count
    spawned_count += spawn_finale(theme_label)
    ending_count = spawn_finale_ceremony(ROOMS[-1], audio_assets)
    spawned_count += ending_count
    lighting_policy = apply_dynamic_lighting_policy()
    saved = save_current_level()
    return SceneResult(
        level_path=LEVEL_PATH,
        saved=saved,
        spawned_count=spawned_count,
        room_count=len(ROOMS),
        audio_asset_count=len(audio_assets),
        interaction_marker_count=interaction_count,
        runtime_actor_count=runtime_count,
        runtime_escape_cafe_prop_actor_count=runtime_escape_cafe_prop_count,
        fixture_count=fixture_count,
        setpiece_count=setpiece_count,
        mechanism_actor_count=mechanism_count,
        dressing_actor_count=dressing_count,
        sightline_actor_count=sightline_count,
        playability_actor_count=playability_count,
        hint_actor_count=hint_count,
        timer_actor_count=timer_count,
        spatial_audio_actor_count=spatial_audio_count,
        first_person_foley_actor_count=first_person_foley_count,
        door_transition_actor_count=door_transition_count,
        clue_chain_actor_count=clue_chain_count,
        cross_room_chain_actor_count=cross_room_chain_count,
        progress_actor_count=progress_count,
        lock_motion_actor_count=lock_motion_count,
        lock_operation_actor_count=lock_operation_count,
        door_hardware_actor_count=door_hardware_count,
        operations_actor_count=operations_count,
        lighting_quality_actor_count=lighting_quality_count,
        puzzle_feedback_actor_count=puzzle_feedback_count,
        search_surface_actor_count=search_surface_count,
        escape_cafe_prop_actor_count=escape_cafe_prop_count,
        secret_discovery_actor_count=secret_discovery_count,
        ending_actor_count=ending_count,
        cinematic_actor_count=cinematic_count,
        visual_actor_count=visual_count,
        visual_material_count=visual_material_count,
        room_dressing_quality_actor_count=room_dressing_quality_count,
        room1_memory_prototype_actor_count=room1_memory_prototype_count,
        dynamic_lighting_movable_component_count=lighting_policy.movable_component_count,
        static_lighting_rebuild_component_count=lighting_policy.static_component_count,
    ).to_json()
