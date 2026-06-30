import unreal
from toolset_registry.registration import Registration

try:
    from hayoung_mcp_tools.toolsets.escape_cafe_masterplan import HayoungEscapeCafeMasterplanTools
    from hayoung_mcp_tools.toolsets.premium_escape_cafe import HayoungEscapeCafePremiumTools
    from hayoung_mcp_tools.toolsets.romantic_escape_room import HayoungEscapeRoomTools

    _hayoung_toolset_registration = Registration(
        [
            HayoungEscapeRoomTools,
            HayoungEscapeCafeMasterplanTools,
            HayoungEscapeCafePremiumTools,
        ]
    )
    if _hayoung_toolset_registration.register():
        unreal.log("Hayoung MCP toolsets registered.")
    else:
        unreal.log_warning("Hayoung MCP toolsets could not register because ToolsetRegistry is unavailable.")
except Exception as exc:
    unreal.log_error(f"Failed to register Hayoung MCP toolsets: {exc}")
