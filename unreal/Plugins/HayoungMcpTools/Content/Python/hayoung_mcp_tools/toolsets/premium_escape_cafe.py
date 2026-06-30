from __future__ import annotations

import toolset_registry
import unreal

from hayoung_mcp_tools.premium_escape.builder import create_legendary_escape_cafe
from hayoung_mcp_tools.premium_escape.inspection import inspect_runtime_escape_cafe
from hayoung_mcp_tools.premium_escape.lighting_build_fix import inspect_dynamic_lighting_policy
from hayoung_mcp_tools.premium_escape.room1_memory_inspection import inspect_room1_memory_prototype
from hayoung_mcp_tools.premium_escape.runtime_escape_cafe_prop_simulation import simulate_runtime_escape_cafe_props
from hayoung_mcp_tools.premium_escape.runtime_footstep_simulation import simulate_runtime_footstep_surfaces
from hayoung_mcp_tools.premium_escape.simulation import simulate_escape_chain


@unreal.uclass()
class HayoungEscapeCafePremiumTools(unreal.ToolsetDefinition):

    @toolset_registry.tool_call
    @staticmethod
    def create_legendary_500_escape_cafe(
        theme_label: str = "하영이와 현수의 500일 방탈출",
        fidelity_pass: int = 5,
        enable_audio: bool = True,
    ) -> str:
        return create_legendary_escape_cafe(theme_label, fidelity_pass, enable_audio)

    @toolset_registry.tool_call
    @staticmethod
    def inspect_legendary_500_runtime() -> str:
        return inspect_runtime_escape_cafe()

    @toolset_registry.tool_call
    @staticmethod
    def inspect_room1_memory_prototype() -> str:
        return inspect_room1_memory_prototype()

    @toolset_registry.tool_call
    @staticmethod
    def inspect_dynamic_lighting_policy() -> str:
        return inspect_dynamic_lighting_policy()

    @toolset_registry.tool_call
    @staticmethod
    def simulate_legendary_500_escape_chain() -> str:
        return simulate_escape_chain()

    @toolset_registry.tool_call
    @staticmethod
    def simulate_runtime_escape_cafe_props() -> str:
        return simulate_runtime_escape_cafe_props()

    @toolset_registry.tool_call
    @staticmethod
    def simulate_runtime_footstep_surfaces() -> str:
        return simulate_runtime_footstep_surfaces()
