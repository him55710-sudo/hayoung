from __future__ import annotations

import sys
from pathlib import Path

import unreal


project_dir = Path(unreal.Paths.project_dir())
plugin_python = project_dir / "Plugins" / "HayoungMcpTools" / "Content" / "Python"
if str(plugin_python) not in sys.path:
    sys.path.insert(0, str(plugin_python))

from hayoung_mcp_tools.premium_escape.room01_hayoung500 import build_room01_hayoung500


print(build_room01_hayoung500(enable_audio=True))
