import unreal
import toolset_registry


def _actor_subsystem():
    return unreal.get_editor_subsystem(unreal.EditorActorSubsystem)


def _spawn(actor_class, location, rotation=None, label=None):
    rot = rotation or unreal.Rotator(0.0, 0.0, 0.0)
    actor = _actor_subsystem().spawn_actor_from_class(actor_class, location, rot)
    if label:
        actor.set_actor_label(label)
    return actor


def _cube(label, location, scale, material_path=None):
    actor = _spawn(unreal.StaticMeshActor, location, label=label)
    mesh = unreal.load_asset("/Engine/BasicShapes/Cube.Cube")
    actor.static_mesh_component.set_static_mesh(mesh)
    actor.set_actor_scale3d(scale)
    if material_path:
        material = unreal.load_asset(material_path)
        if material:
            actor.static_mesh_component.set_material(0, material)
    return actor


def _shape(label, shape, location, scale, material_path=None):
    actor = _spawn(unreal.StaticMeshActor, location, label=label)
    mesh = unreal.load_asset(f"/Engine/BasicShapes/{shape}.{shape}")
    actor.static_mesh_component.set_static_mesh(mesh)
    actor.set_actor_scale3d(scale)
    if material_path:
        material = unreal.load_asset(material_path)
        if material:
            actor.static_mesh_component.set_material(0, material)
    return actor


def _text(label, text, location, rotation=None, size=72.0):
    actor = _spawn(unreal.TextRenderActor, location, rotation=rotation, label=label)
    component = actor.get_component_by_class(unreal.TextRenderComponent)
    component.set_text(text)
    component.set_world_size(size)
    component.set_horizontal_alignment(unreal.HorizTextAligment.EHTA_CENTER)
    return actor


def _point_light(label, location, color, intensity, radius):
    actor = _spawn(unreal.PointLight, location, label=label)
    actor.light_component.set_light_color(color)
    actor.light_component.set_intensity(intensity)
    actor.light_component.set_attenuation_radius(radius)
    return actor


def _room_shell(prefix, title, x, accent, mood_note):
    spawned = 0
    _cube(f"{prefix}_Floor_Polished", unreal.Vector(x, 0, -10), unreal.Vector(6.3, 6.1, 0.1))
    _cube(f"{prefix}_BackWall_Textured", unreal.Vector(x, 310, 185), unreal.Vector(6.3, 0.12, 3.7))
    _cube(f"{prefix}_LeftWall_Textured", unreal.Vector(x - 315, 0, 185), unreal.Vector(0.12, 6.1, 3.7))
    _cube(f"{prefix}_RightWall_Textured", unreal.Vector(x + 315, 0, 185), unreal.Vector(0.12, 6.1, 3.7))
    _cube(f"{prefix}_Ceiling_ShadowPlane", unreal.Vector(x, 0, 372), unreal.Vector(6.3, 6.1, 0.08))
    spawned += 5

    for beam_index in range(4):
        y = -235 + beam_index * 155
        _cube(f"{prefix}_CeilingBeam_{beam_index + 1}", unreal.Vector(x, y, 345), unreal.Vector(6.0, 0.07, 0.08))
        _cube(f"{prefix}_FloorLightRail_{beam_index + 1}", unreal.Vector(x, y, 2), unreal.Vector(5.6, 0.025, 0.025))
        spawned += 2

    _text(
        f"{prefix}_Title",
        title,
        unreal.Vector(x, 296, 260),
        unreal.Rotator(0.0, 180.0, 0.0),
        38.0,
    )
    _text(
        f"{prefix}_Mood_Note",
        mood_note,
        unreal.Vector(x - 185, -245, 120),
        unreal.Rotator(0.0, 0.0, 0.0),
        18.0,
    )
    _point_light(
        f"{prefix}_Accent_Glow",
        unreal.Vector(x - 210, -40, 220),
        accent,
        1300.0,
        560.0,
    )
    spawned += 3
    return spawned


def _lock_motion_rig(prefix, x, y, accent):
    spawned = 0
    _cube(f"{prefix}_Door_Panel", unreal.Vector(x + 255, y, 128), unreal.Vector(0.12, 0.82, 2.4))
    _cube(f"{prefix}_Door_Seam_Glow", unreal.Vector(x + 246, y, 132), unreal.Vector(0.035, 0.9, 2.55))
    _shape(f"{prefix}_Heart_Lock_Body", "Sphere", unreal.Vector(x + 215, y - 18, 118), unreal.Vector(0.38, 0.18, 0.32))
    _shape(f"{prefix}_Shackle_Arc", "Cylinder", unreal.Vector(x + 215, y - 18, 156), unreal.Vector(0.38, 0.38, 0.06))
    _cube(f"{prefix}_Bolt_Left_Closed", unreal.Vector(x + 188, y - 18, 124), unreal.Vector(0.42, 0.08, 0.08))
    _cube(f"{prefix}_Bolt_Right_Open_Target", unreal.Vector(x + 245, y - 18, 124), unreal.Vector(0.42, 0.08, 0.08))
    _shape(f"{prefix}_Gear_A", "Cylinder", unreal.Vector(x + 198, y - 22, 83), unreal.Vector(0.22, 0.22, 0.045))
    _shape(f"{prefix}_Gear_B", "Cylinder", unreal.Vector(x + 232, y - 22, 83), unreal.Vector(0.16, 0.16, 0.045))
    _point_light(f"{prefix}_Unlock_Spark_Ghost", unreal.Vector(x + 218, y - 42, 154), accent, 850.0, 180.0)
    spawned += 9
    return spawned


def _puzzle_console(prefix, x, puzzle_label, accent):
    spawned = 0
    _cube(f"{prefix}_Console_Wood_Base", unreal.Vector(x, 170, 55), unreal.Vector(1.0, 0.55, 0.5))
    _cube(f"{prefix}_Console_Glass_Top", unreal.Vector(x, 145, 105), unreal.Vector(0.92, 0.36, 0.08))
    _shape(f"{prefix}_Dial_Ring", "Cylinder", unreal.Vector(x - 45, 126, 128), unreal.Vector(0.34, 0.34, 0.04))
    _shape(f"{prefix}_Scanner_Orb", "Sphere", unreal.Vector(x + 44, 126, 126), unreal.Vector(0.18, 0.18, 0.18))
    _text(
        f"{prefix}_Puzzle_Label",
        puzzle_label,
        unreal.Vector(x, 116, 148),
        unreal.Rotator(0.0, 180.0, 0.0),
        20.0,
    )
    _point_light(f"{prefix}_Console_Interaction_Halo", unreal.Vector(x, 122, 145), accent, 700.0, 280.0)
    spawned += 6
    return spawned


def _photo_corridor(prefix, x, count):
    spawned = 0
    total = max(1, min(int(count), 12))
    start_y = -230
    for index in range(total):
        y = start_y + index * 72
        side = -1 if index % 2 == 0 else 1
        _cube(
            f"{prefix}_Memory_Frame_{index + 1:02d}",
            unreal.Vector(x + side * 190, y, 145),
            unreal.Vector(0.08, 0.52, 0.36),
        )
        _cube(
            f"{prefix}_Memory_Glow_{index + 1:02d}",
            unreal.Vector(x + side * 184, y, 145),
            unreal.Vector(0.025, 0.58, 0.42),
        )
        _text(
            f"{prefix}_Memory_Label_{index + 1:02d}",
            f"Memory {index + 1}",
            unreal.Vector(x + side * 182, y, 202),
            unreal.Rotator(0.0, 90.0 * side, 0.0),
            14.0,
        )
        spawned += 3
    return spawned


def _cloud_path(prefix, x):
    spawned = 0
    for index in range(7):
        y = -230 + index * 74
        offset = (-1) ** index * 28
        _shape(
            f"{prefix}_Cloud_Step_{index + 1}",
            "Sphere",
            unreal.Vector(x + offset, y, 12 + index * 3),
            unreal.Vector(0.62, 0.38, 0.12),
        )
        spawned += 1
    return spawned


@unreal.uclass()
class HayoungEscapeRoomTools(unreal.ToolsetDefinition):
    """Creates 500-day anniversary escape-room layouts, lighting, and city-block mood tests."""

    @staticmethod
    @toolset_registry.tool_call
    def create_anniversary_room(room_label: str = "500일의 방") -> dict:
        """Create a simple playable escape-room blockout.

        Args:
            room_label: Label text to place above the locked door.

        Returns:
            Summary of spawned actors and intended next steps.
        """
        spawned = []

        spawned.append(_cube("Room_Floor", unreal.Vector(0, 0, -10), unreal.Vector(8, 8, 0.1)))
        spawned.append(_cube("Back_Wall", unreal.Vector(0, 380, 190), unreal.Vector(8, 0.12, 4)))
        spawned.append(_cube("Left_Wall", unreal.Vector(-400, 0, 190), unreal.Vector(0.12, 8, 4)))
        spawned.append(_cube("Right_Wall", unreal.Vector(400, 0, 190), unreal.Vector(0.12, 8, 4)))
        spawned.append(_cube("Locked_Door_500", unreal.Vector(0, 374, 120), unreal.Vector(1.4, 0.08, 2.4)))
        spawned.append(_cube("Puzzle_Desk", unreal.Vector(-190, 150, 45), unreal.Vector(1.7, 0.8, 0.35)))
        spawned.append(_cube("Clue_Box_Heart", unreal.Vector(230, 135, 72), unreal.Vector(0.55, 0.55, 0.55)))
        spawned.append(_cube("Moon_Window", unreal.Vector(255, 377, 185), unreal.Vector(1.2, 0.06, 1.15)))
        spawned.append(
            _text(
                "Door_Title_500",
                room_label,
                unreal.Vector(0, 365, 265),
                unreal.Rotator(0.0, 180.0, 0.0),
                46.0,
            )
        )

        HayoungEscapeRoomTools.setup_anniversary_lighting()

        return {
            "spawned_count": len(spawned),
            "room_label": room_label,
            "next_steps": [
                "Ask the agent to add clue props near Puzzle_Desk.",
                "Ask the agent to replace blockout cubes with real meshes.",
                "Ask the agent to tune lighting after camera placement.",
            ],
        }

    @staticmethod
    @toolset_registry.tool_call
    def setup_anniversary_lighting(warm_intensity: float = 2400.0, moon_intensity: float = 600.0) -> dict:
        """Set warm romantic practical lighting plus cool moonlight.

        Args:
            warm_intensity: Intensity for the warm desk and lamp lights.
            moon_intensity: Intensity for the cool window light.

        Returns:
            Names and colors of created lights.
        """
        warm = unreal.LinearColor(1.0, 0.58, 0.34, 1.0)
        moon = unreal.LinearColor(0.42, 0.62, 1.0, 1.0)

        _point_light("Warm_Lamp_Main", unreal.Vector(-245, 120, 210), warm, warm_intensity, 650.0)
        _point_light("Rose_Table_Glow", unreal.Vector(150, -150, 115), unreal.LinearColor(1.0, 0.22, 0.28, 1.0), 900.0, 420.0)
        _point_light("Moon_Window_Fill", unreal.Vector(280, 315, 230), moon, moon_intensity, 850.0)

        return {
            "lights": ["Warm_Lamp_Main", "Rose_Table_Glow", "Moon_Window_Fill"],
            "mood": "warm amber interior with cool moonlit contrast",
        }

    @staticmethod
    @toolset_registry.tool_call
    def generate_memory_city_block(blocks: int = 3) -> dict:
        """Create a small stylized city block for memory-scene experiments.

        Args:
            blocks: Number of simple building blocks to create.

        Returns:
            Count and layout note for generated city pieces.
        """
        count = max(1, min(blocks, 12))
        for index in range(count):
            x = -240 + index * 120
            height = 120 + (index % 4) * 45
            _cube(
                f"Memory_City_Building_{index + 1}",
                unreal.Vector(x, -420, height / 2),
                unreal.Vector(0.8, 0.75, height / 100),
            )

        _text(
            "Memory_City_Sign_500",
            "D+500",
            unreal.Vector(0, -455, 225),
            unreal.Rotator(0.0, 0.0, 0.0),
            38.0,
        )

        return {
            "building_count": count,
            "layout": "simple skyline blockout for later replacement with city assets",
        }

    @staticmethod
    @toolset_registry.tool_call
    def create_five_room_escape_level(theme_label: str = "500일의 방") -> dict:
        """Create a five-room Roblox-like 3D escape-game blockout.

        Args:
            theme_label: Main theme label placed in the lobby and final room.

        Returns:
            Room names, puzzle types, and actor count created for the level.
        """
        room_specs = [
            {
                "name": "Room_01_Memory_Lobby",
                "title": "기억의 로비",
                "x": 0,
                "accent": "combination lock 0500",
                "puzzle": "자물쇠 문제",
            },
            {
                "name": "Room_02_Direction_Gallery",
                "title": "방향의 복도",
                "x": 900,
                "accent": "arrow sequence",
                "puzzle": "방향키 문제",
            },
            {
                "name": "Room_03_Light_Studio",
                "title": "빛의 작업실",
                "x": 1800,
                "accent": "moon and lamp order",
                "puzzle": "조명 순서 문제",
            },
            {
                "name": "Room_04_City_Memory",
                "title": "추억의 도시",
                "x": 2700,
                "accent": "mini city route",
                "puzzle": "3D 이동/점프 문제",
            },
            {
                "name": "Room_05_Final_Vault",
                "title": "마지막 금고",
                "x": 3600,
                "accent": "heart key finale",
                "puzzle": "최종 조합 문제",
            },
        ]

        spawned_count = 0
        for index, room in enumerate(room_specs):
            x = room["x"]
            _cube(f"{room['name']}_Floor", unreal.Vector(x, 0, -10), unreal.Vector(6, 6, 0.1))
            _cube(f"{room['name']}_BackWall", unreal.Vector(x, 300, 180), unreal.Vector(6, 0.12, 3.6))
            _cube(f"{room['name']}_LeftWall", unreal.Vector(x - 300, 0, 180), unreal.Vector(0.12, 6, 3.6))
            _cube(f"{room['name']}_RightWall", unreal.Vector(x + 300, 0, 180), unreal.Vector(0.12, 6, 3.6))
            _cube(f"{room['name']}_Door_Out", unreal.Vector(x + 280, 250, 120), unreal.Vector(0.12, 0.75, 2.4))
            _cube(f"{room['name']}_Puzzle_Device", unreal.Vector(x, 180, 60), unreal.Vector(0.9, 0.35, 0.55))
            _cube(f"{room['name']}_Reward_Pedestal", unreal.Vector(x - 185, -125, 45), unreal.Vector(0.55, 0.55, 0.45))
            _text(
                f"{room['name']}_Title",
                room["title"],
                unreal.Vector(x, 286, 250),
                unreal.Rotator(0.0, 180.0, 0.0),
                36.0,
            )
            _text(
                f"{room['name']}_Puzzle_Label",
                room["puzzle"],
                unreal.Vector(x, 165, 120),
                unreal.Rotator(0.0, 180.0, 0.0),
                22.0,
            )
            _point_light(
                f"{room['name']}_Warm_Key_Light",
                unreal.Vector(x - 160, 30, 210),
                unreal.LinearColor(1.0, 0.55, 0.36, 1.0),
                1000.0 + index * 180,
                520.0,
            )
            spawned_count += 10

            if index < len(room_specs) - 1:
                _cube(
                    f"Connector_{index + 1}_To_{index + 2}",
                    unreal.Vector(x + 450, 250, 0),
                    unreal.Vector(3.0, 0.8, 0.08),
                )
                spawned_count += 1

        _text(
            "Five_Room_Main_Title",
            theme_label,
            unreal.Vector(0, -230, 210),
            unreal.Rotator(0.0, 0.0, 0.0),
            44.0,
        )
        _point_light(
            "Five_Room_Final_Heart_Glow",
            unreal.Vector(3600, -95, 165),
            unreal.LinearColor(1.0, 0.18, 0.22, 1.0),
            1800.0,
            650.0,
        )
        spawned_count += 2

        return {
            "spawned_count": spawned_count,
            "rooms": [room["name"] for room in room_specs],
            "puzzles": {room["name"]: room["puzzle"] for room in room_specs},
            "recommended_next_prompt": "Replace blockout puzzle devices with interactive Blueprint actors and connect them to the HUD room progress state.",
        }

    @staticmethod
    @toolset_registry.tool_call
    def create_cinematic_500_escape_level(theme_label: str = "500일의 방", detail_density: int = 2) -> dict:
        """Create a richer five-room anniversary escape environment for first MCP passes.

        Args:
            theme_label: Main title text for the level.
            detail_density: 1-4 density for extra rails, memory frames, and light props.

        Returns:
            Actor counts plus recommended follow-up prompts for replacing blockout meshes.
        """
        density = max(1, min(int(detail_density), 4))
        room_specs = [
            {
                "prefix": "Cinematic_Room_01_Fresh_Start",
                "title": "1-100일 풋풋한 시작",
                "x": 0,
                "puzzle": "첫 자물쇠 / 첫 사진",
                "mood": "diary, first photo, warm morning",
                "accent": unreal.LinearColor(1.0, 0.52, 0.36, 1.0),
            },
            {
                "prefix": "Cinematic_Room_02_Cafe_Promise",
                "title": "101-200일 가까워진 약속",
                "x": 900,
                "puzzle": "방향키 / 약속의 별",
                "mood": "cafe chairs, ring, green clue",
                "accent": unreal.LinearColor(0.45, 0.95, 0.72, 1.0),
            },
            {
                "prefix": "Cinematic_Room_03_Rain_Reconcile",
                "title": "201-300일 고난과 화해",
                "x": 1800,
                "puzzle": "비 금고 / 깨진 소리",
                "mood": "rain glass, repaired heart, low strings",
                "accent": unreal.LinearColor(0.46, 0.58, 1.0, 1.0),
            },
            {
                "prefix": "Cinematic_Room_04_Night_City",
                "title": "301-400일 버틴 밤",
                "x": 2700,
                "puzzle": "지친 밤 선택 / 창문 신호",
                "mood": "night city, notes, bridge",
                "accent": unreal.LinearColor(1.0, 0.58, 0.36, 1.0),
            },
            {
                "prefix": "Cinematic_Room_05_Heaven_Gate",
                "title": "401-500일 하늘문",
                "x": 3600,
                "puzzle": "하늘문 / 편지 엔딩",
                "mood": "cloud path, memory photos, bright gate",
                "accent": unreal.LinearColor(0.78, 0.9, 1.0, 1.0),
            },
        ]

        spawned_count = 0
        for index, room in enumerate(room_specs):
            x = room["x"]
            spawned_count += _room_shell(room["prefix"], room["title"], x, room["accent"], room["mood"])
            spawned_count += _puzzle_console(room["prefix"], x, room["puzzle"], room["accent"])
            spawned_count += _lock_motion_rig(room["prefix"], x, 258, room["accent"])
            _cube(f"{room['prefix']}_Reward_Pedestal", unreal.Vector(x - 190, -125, 46), unreal.Vector(0.55, 0.55, 0.46))
            _shape(f"{room['prefix']}_Reward_Glow_Orb", "Sphere", unreal.Vector(x - 190, -125, 92), unreal.Vector(0.18, 0.18, 0.18))
            spawned_count += 2

            for prop_index in range(density):
                prop_y = -215 + prop_index * 72
                _cube(
                    f"{room['prefix']}_Readable_Clue_Prop_{prop_index + 1}",
                    unreal.Vector(x - 105 + prop_index * 70, prop_y, 42),
                    unreal.Vector(0.34, 0.18, 0.06),
                )
                spawned_count += 1

            if index < len(room_specs) - 1:
                _cube(
                    f"Cinematic_Connector_{index + 1}_To_{index + 2}",
                    unreal.Vector(x + 450, 260, 0),
                    unreal.Vector(3.0, 0.75, 0.08),
                )
                _point_light(
                    f"Cinematic_Connector_{index + 1}_Guiding_Light",
                    unreal.Vector(x + 450, 248, 155),
                    room["accent"],
                    650.0,
                    360.0,
                )
                spawned_count += 2

        spawned_count += _photo_corridor("Cinematic_Final", 3600, 6 + density)
        spawned_count += _cloud_path("Cinematic_Final", 3600)
        _shape("Cinematic_Final_Heaven_Gate_Ring", "Cylinder", unreal.Vector(3600, 275, 175), unreal.Vector(1.2, 1.2, 0.08))
        _point_light("Cinematic_Final_Heaven_Bloom_Key", unreal.Vector(3600, 210, 210), unreal.LinearColor(0.95, 0.92, 1.0, 1.0), 3600.0, 980.0)
        _text(
            "Cinematic_Main_Title_500",
            theme_label,
            unreal.Vector(0, -255, 220),
            unreal.Rotator(0.0, 0.0, 0.0),
            48.0,
        )
        spawned_count += 3

        return {
            "spawned_count": spawned_count,
            "rooms": [room["prefix"] for room in room_specs],
            "quality_intent": "cinematic blockout: layered rooms, readable puzzle consoles, lock motion reference parts, memory corridor, cloud path, and per-room accent lighting",
            "recommended_next_prompts": [
                "Replace BasicShapes actors with Nanite-ready GLB meshes and keep labels.",
                "Turn each *_Door_Seam_Glow and *_Bolt_* group into a Blueprint unlock animation.",
                "Import the six couple photos and assign them to Cinematic_Final_Memory_Frame materials.",
                "Add post-process volume: ACES contrast, mild bloom, warm highlights, cool shadows.",
            ],
        }
