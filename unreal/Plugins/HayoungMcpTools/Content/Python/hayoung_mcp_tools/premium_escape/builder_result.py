from __future__ import annotations

import json
from dataclasses import dataclass

from .specs import ROOMS


@dataclass(frozen=True, slots=True)
class SceneResult:
    level_path: str
    saved: bool
    spawned_count: int
    room_count: int
    audio_asset_count: int
    interaction_marker_count: int
    runtime_actor_count: int
    runtime_escape_cafe_prop_actor_count: int
    fixture_count: int
    setpiece_count: int
    mechanism_actor_count: int
    dressing_actor_count: int
    sightline_actor_count: int
    playability_actor_count: int
    hint_actor_count: int
    timer_actor_count: int
    spatial_audio_actor_count: int
    first_person_foley_actor_count: int
    door_transition_actor_count: int
    clue_chain_actor_count: int
    cross_room_chain_actor_count: int
    progress_actor_count: int
    lock_motion_actor_count: int
    lock_operation_actor_count: int
    door_hardware_actor_count: int
    operations_actor_count: int
    lighting_quality_actor_count: int
    puzzle_feedback_actor_count: int
    search_surface_actor_count: int
    escape_cafe_prop_actor_count: int
    secret_discovery_actor_count: int
    ending_actor_count: int
    cinematic_actor_count: int
    visual_actor_count: int
    visual_material_count: int
    room_dressing_quality_actor_count: int
    room1_memory_prototype_actor_count: int
    dynamic_lighting_movable_component_count: int
    static_lighting_rebuild_component_count: int

    def to_json(self) -> str:
        return json.dumps(
            {
                "level_path": self.level_path,
                "saved": self.saved,
                "spawned_count": self.spawned_count,
                "room_count": self.room_count,
                "audio_asset_count": self.audio_asset_count,
                "interaction_marker_count": self.interaction_marker_count,
                "runtime_actor_count": self.runtime_actor_count,
                "runtime_escape_cafe_prop_actor_count": self.runtime_escape_cafe_prop_actor_count,
                "fixture_count": self.fixture_count,
                "setpiece_count": self.setpiece_count,
                "mechanism_actor_count": self.mechanism_actor_count,
                "dressing_actor_count": self.dressing_actor_count,
                "sightline_actor_count": self.sightline_actor_count,
                "playability_actor_count": self.playability_actor_count,
                "hint_actor_count": self.hint_actor_count,
                "timer_actor_count": self.timer_actor_count,
                "spatial_audio_actor_count": self.spatial_audio_actor_count,
                "first_person_foley_actor_count": self.first_person_foley_actor_count,
                "door_transition_actor_count": self.door_transition_actor_count,
                "clue_chain_actor_count": self.clue_chain_actor_count,
                "cross_room_chain_actor_count": self.cross_room_chain_actor_count,
                "progress_actor_count": self.progress_actor_count,
                "lock_motion_actor_count": self.lock_motion_actor_count,
                "lock_operation_actor_count": self.lock_operation_actor_count,
                "door_hardware_actor_count": self.door_hardware_actor_count,
                "operations_actor_count": self.operations_actor_count,
                "lighting_quality_actor_count": self.lighting_quality_actor_count,
                "puzzle_feedback_actor_count": self.puzzle_feedback_actor_count,
                "search_surface_actor_count": self.search_surface_actor_count,
                "escape_cafe_prop_actor_count": self.escape_cafe_prop_actor_count,
                "secret_discovery_actor_count": self.secret_discovery_actor_count,
                "ending_actor_count": self.ending_actor_count,
                "cinematic_actor_count": self.cinematic_actor_count,
                "visual_actor_count": self.visual_actor_count,
                "visual_material_count": self.visual_material_count,
                "room_dressing_quality_actor_count": self.room_dressing_quality_actor_count,
                "room1_memory_prototype_actor_count": self.room1_memory_prototype_actor_count,
                "dynamic_lighting_movable_component_count": self.dynamic_lighting_movable_component_count,
                "static_lighting_rebuild_component_count": self.static_lighting_rebuild_component_count,
                "rooms": [room.prefix for room in ROOMS],
                "locks": [lock.kind.value for room in ROOMS for lock in room.locks],
                "player": "PlayerStart, 3D capsule, eye-height marker, and interaction ray are placed in Room 01",
                "interaction": "E-use trigger volumes, input sockets, motion start/end markers, door swing paths, and SFX cue labels are generated",
                "audio": "room ambience SoundWave assets plus SFX marker actors are generated",
                "runtime": "C++ first-person game mode, chained lock actors, animated door actors, and room audio volumes are wired when the Hayoung500 module is loaded",
                "runtime_escape_cafe_props": "thirty real escape-cafe props are playable first-person interaction actors with prompts, reward keys, motion offsets, and object SFX",
                "fixtures": "escape-cafe search props, hidden keys, safe cabinets, direction trails, UV clues, fuse panels, and finale pedestals are generated per room",
                "setpieces": "large room-identity structures such as archive aisles, cafe counters, rain repair walls, city skyline, and heaven vault pillars are generated",
                "mechanisms": "detailed escape-cafe lock mechanisms, keys, dials, keypads, sensors, button panels, and safe hardware are generated at every puzzle station",
                "dressing": "Korean escape-cafe surface dressing, clue cards, hint monitors, CCTV domes, cable trays, scuffs, and dust markers are generated in each room",
                "sightlines": "room-specific first-person preview cameras, floor path strips, waypoints, and player-eye glow markers are generated",
                "playability": "first-person stand zones, walkable lanes, reach targets, and door clearance zones are generated per room",
                "hints": "hint phone/tablet stations, three penalty steps, staff reply speakers, CCTV domes, and microphones are generated per room",
                "timers": "60-minute countdown displays, pressure ticks, final-ten tension cues, emergency buttons, and staff timer syncs are generated per room",
                "spatial_audio": "localized ambience emitters for paper rustle, hint phone buzz, cafe machine hiss, rain window, neon hum, and heaven chimes are generated",
                "first_person_foley": "player body scale references, footstep material pads, door hinge creaks, prop touch foley, and nearby action emitters are generated per room",
                "door_transitions": "room-to-room vestibules, thresholds, jambs, key readers, bolt travel cues, swing arcs, and hinge creak emitters are generated between every adjacent room",
                "clue_chain": "diegetic clue-flow panels connect observation, decoding, and lock input targets for every puzzle station",
                "cross_room_chain": "source fragments from rooms 1-4 feed the final 500 + HEART receiver in room 5",
                "progression": "room progress boards, lock status lamps, reward key feedback, and door signal strips are generated in each room",
                "lock_motions": "first-person tactile operation rigs show hand start/end positions, press depth, turn arcs, key insertion, magnetic snaps, and lock feedback per puzzle",
                "lock_operations": "diegetic operation plates, input slot previews, hand rails, success lamps, error lamps, and kind-specific manipulation cues are generated for every lock",
                "door_hardware": "per-room exit doors include lever handles, key cylinders, three hinge stacks, rubber seals, closers, magnetic sensors, tactile wear, and creak audio anchors",
                "operations": "staff intercoms, CCTV recording lamps, reset checklists, emergency release boxes, no-force labels, prop inventories, and maintenance traces are generated per room",
                "lighting_quality": "per-room post-process volumes, key/fill/rim/puzzle/exit lights, volumetric beams, dust motes, reflection cards, and shadow catchers are generated",
                "puzzle_feedback": "success, error, input-progress, reward-glow, reset, rebound, and lock-specific audio feedback are generated for every puzzle station",
                "search_surfaces": "room-specific drawers, false bottoms, locked boxes, UV/lens tools, key caches, dust outlines, and scratch marks create real escape-cafe search flow",
                "escape_cafe_props": "thirty realistic cafe-room props add hidden panels, key caches, mechanical lock bodies, direction routes, electronic panels, hand targets, reveal ghosts, and object SFX anchors",
                "secret_discovery": "hidden panels, UV reveals, magnetic releases, signal models, reward caches, and cross-room search links are generated in all five rooms",
                "ending": "final room ceremony stage, final letter, heart-key unlock motion, success photo spot, coupons, and ending audio cues are generated",
                "cinematic_ambience": "room-specific volumetric beams, haze particles, shadow slats, and color references make every room read as a distinct premium escape-cafe set",
                "visuals": "persistent material assets, cinematic fog, global fill lights, room finish panels, cove lights, and puzzle highlight pools are generated",
                "room_dressing_quality": "five distinct rooms receive premium escape-cafe wall panels, trim, service ceilings, readable search affordances, wear marks, practical lights, and material breakup",
                "room1_memory_prototype": "Room 01 receives the playable 500-day memory prototype: Vita500 lock, memory color sequence, violin keyring, carousel, painting slot, Guro bench grid, beef-cut wall puzzle, steak vote, and Room 2 door",
                "lighting_policy": "generated actors are converted to movable components and force-no-precomputed lighting is enabled to prevent massive static lighting rebuild warnings during prototype iteration",
            },
            ensure_ascii=False,
        )
