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
