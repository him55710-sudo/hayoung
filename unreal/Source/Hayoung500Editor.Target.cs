using UnrealBuildTool;
using System.Collections.Generic;

public class Hayoung500EditorTarget : TargetRules
{
    public Hayoung500EditorTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Editor;
        DefaultBuildSettings = BuildSettingsVersion.Latest;
        IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
        ExtraModuleNames.Add("Hayoung500");
    }
}
