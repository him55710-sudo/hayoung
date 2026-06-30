#include "HYGameMode.h"
#include "HYEscapeHUD.h"
#include "HYFirstPersonCharacter.h"

AHYGameMode::AHYGameMode()
{
    DefaultPawnClass = AHYFirstPersonCharacter::StaticClass();
    HUDClass = AHYEscapeHUD::StaticClass();
}
