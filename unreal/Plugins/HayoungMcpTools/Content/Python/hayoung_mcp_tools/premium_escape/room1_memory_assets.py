from __future__ import annotations

from typing import Final

import unreal

from .room1_memory_specs import BEEF_IMAGE_SOURCE
from .visuals import material_path

ROOM1_TEXTURE_DIR: Final[str] = "/Game/Hayoung500/Room1/Textures"
ROOM1_MATERIAL_DIR: Final[str] = "/Game/Hayoung500/Room1/Materials"
BEEF_TEXTURE_NAME: Final[str] = "T_Room1_BeefCutsPuzzle"
BEEF_MATERIAL_NAME: Final[str] = "M_Room1_BeefCutsPuzzle"
BEEF_TEXTURE_ASSET: Final[str] = f"{ROOM1_TEXTURE_DIR}/{BEEF_TEXTURE_NAME}"
BEEF_TEXTURE_REF: Final[str] = f"{BEEF_TEXTURE_ASSET}.{BEEF_TEXTURE_NAME}"
BEEF_MATERIAL_ASSET: Final[str] = f"{ROOM1_MATERIAL_DIR}/{BEEF_MATERIAL_NAME}"
BEEF_MATERIAL_REF: Final[str] = f"{BEEF_MATERIAL_ASSET}.{BEEF_MATERIAL_NAME}"


def ensure_beef_board_material() -> str:
    if unreal.EditorAssetLibrary.does_asset_exist(BEEF_MATERIAL_ASSET):
        return BEEF_MATERIAL_REF
    texture_ref = _ensure_beef_texture()
    if texture_ref is None:
        return material_path("WarmPlaster")
    return _create_beef_material(texture_ref)


def beef_texture_available() -> bool:
    return unreal.EditorAssetLibrary.does_asset_exist(BEEF_TEXTURE_ASSET)


def beef_material_available() -> bool:
    return unreal.EditorAssetLibrary.does_asset_exist(BEEF_MATERIAL_ASSET)


def _ensure_beef_texture() -> str | None:
    if unreal.EditorAssetLibrary.does_asset_exist(BEEF_TEXTURE_ASSET):
        return BEEF_TEXTURE_REF
    if not BEEF_IMAGE_SOURCE.exists():
        return None
    unreal.EditorAssetLibrary.make_directory(ROOM1_TEXTURE_DIR)
    task = unreal.AssetImportTask()
    task.set_editor_property("filename", str(BEEF_IMAGE_SOURCE))
    task.set_editor_property("destination_path", ROOM1_TEXTURE_DIR)
    task.set_editor_property("destination_name", BEEF_TEXTURE_NAME)
    task.set_editor_property("automated", True)
    task.set_editor_property("replace_existing", True)
    task.set_editor_property("save", True)
    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
    if unreal.EditorAssetLibrary.does_asset_exist(BEEF_TEXTURE_ASSET):
        return BEEF_TEXTURE_REF
    return None


def _create_beef_material(texture_ref: str) -> str:
    unreal.EditorAssetLibrary.make_directory(ROOM1_MATERIAL_DIR)
    texture = unreal.load_asset(texture_ref)
    if not texture:
        return material_path("WarmPlaster")
    material = unreal.AssetToolsHelpers.get_asset_tools().create_asset(
        BEEF_MATERIAL_NAME,
        ROOM1_MATERIAL_DIR,
        unreal.Material,
        unreal.MaterialFactoryNew(),
    )
    if not material:
        return material_path("WarmPlaster")
    texture_node = unreal.MaterialEditingLibrary.create_material_expression(
        material,
        unreal.MaterialExpressionTextureSample,
        -420,
        -80,
    )
    texture_node.set_editor_property("texture", texture)
    roughness_node = unreal.MaterialEditingLibrary.create_material_expression(
        material,
        unreal.MaterialExpressionScalarParameter,
        -160,
        120,
    )
    roughness_node.set_editor_property("parameter_name", "Roughness")
    roughness_node.set_editor_property("default_value", 0.72)
    unreal.MaterialEditingLibrary.connect_material_property(texture_node, "RGB", unreal.MaterialProperty.MP_BASE_COLOR)
    unreal.MaterialEditingLibrary.connect_material_property(roughness_node, "", unreal.MaterialProperty.MP_ROUGHNESS)
    unreal.MaterialEditingLibrary.recompile_material(material)
    unreal.EditorAssetLibrary.save_asset(BEEF_MATERIAL_ASSET, only_if_is_dirty=True)
    return BEEF_MATERIAL_REF
