using UnrealBuildTool;
using System.Collections.Generic;

public class Hayoung500Target : TargetRules
{
    public Hayoung500Target(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Game;
        DefaultBuildSettings = BuildSettingsVersion.Latest;
        IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
        ExtraModuleNames.Add("Hayoung500");
    }
}
