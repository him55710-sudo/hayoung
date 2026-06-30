#pragma once

#include "CoreMinimal.h"
#include "GameFramework/HUD.h"
#include "HYEscapeHUD.generated.h"

UCLASS()
class HAYOUNG500_API AHYEscapeHUD : public AHUD
{
    GENERATED_BODY()

public:
    virtual void DrawHUD() override;

private:
    void DrawReticle(float CenterX, float CenterY, const FLinearColor& Accent);
    void DrawPromptPanel(const FString& Prompt, float CanvasWidth, float CanvasHeight, const FLinearColor& Accent);
    void DrawInventoryBadge(int32 KeyCount, const FLinearColor& Accent);
    void DrawProgressPanel(int32 RoomNumber, int32 StepIndex, int32 StepCount, const FString& Objective, float CanvasWidth, const FLinearColor& Accent);
    void DrawPanel(float X, float Y, float Width, float Height, const FLinearColor& Accent, float AccentWidth);
};
