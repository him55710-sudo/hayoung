#include "HYEscapeHUD.h"
#include "Engine/Canvas.h"
#include "HYFirstPersonCharacter.h"

void AHYEscapeHUD::DrawHUD()
{
    Super::DrawHUD();

    if (!Canvas)
    {
        return;
    }

    const float CenterX = Canvas->ClipX * 0.5f;
    const float CenterY = Canvas->ClipY * 0.5f;
    const FLinearColor Accent(0.78f, 0.92f, 1.0f, 0.88f);
    DrawReticle(CenterX, CenterY, Accent);

    const AHYFirstPersonCharacter* Character = Cast<AHYFirstPersonCharacter>(GetOwningPawn());
    if (!Character)
    {
        return;
    }

    DrawInventoryBadge(Character->GetInventoryKeyCount(), Accent);
    DrawProgressPanel(Character->GetCurrentRoomNumber(), Character->GetEscapeStepIndex(), Character->GetEscapeStepCount(), Character->GetCurrentGoalText(), Canvas->ClipX, Accent);
    DrawPromptPanel(Character->GetFocusedPrompt(), Canvas->ClipX, Canvas->ClipY, Accent);
}

void AHYEscapeHUD::DrawReticle(float CenterX, float CenterY, const FLinearColor& Accent)
{
    DrawLine(CenterX - 18.0f, CenterY, CenterX - 6.0f, CenterY, Accent, 1.8f);
    DrawLine(CenterX + 6.0f, CenterY, CenterX + 18.0f, CenterY, Accent, 1.8f);
    DrawLine(CenterX, CenterY - 18.0f, CenterX, CenterY - 6.0f, Accent, 1.8f);
    DrawLine(CenterX, CenterY + 6.0f, CenterX, CenterY + 18.0f, Accent, 1.8f);
    DrawRect(FLinearColor(1.0f, 1.0f, 1.0f, 0.86f), CenterX - 2.0f, CenterY - 2.0f, 4.0f, 4.0f);
}

void AHYEscapeHUD::DrawPromptPanel(const FString& Prompt, float CanvasWidth, float CanvasHeight, const FLinearColor& Accent)
{
    const float PanelWidth = FMath::Clamp(CanvasWidth * 0.48f, 460.0f, 760.0f);
    const float PanelHeight = 116.0f;
    const float X = 34.0f;
    const float Y = CanvasHeight - PanelHeight - 34.0f;
    DrawPanel(X, Y, PanelWidth, PanelHeight, Accent, 5.0f);
    DrawText(TEXT("FOCUS"), FColor(170, 232, 255), X + 22.0f, Y + 16.0f, nullptr, 0.74f);
    DrawText(Prompt, FColor::White, X + 22.0f, Y + 42.0f, nullptr, 0.92f);
    DrawText(TEXT("E / Enter"), FColor(210, 226, 235), X + PanelWidth - 114.0f, Y + 16.0f, nullptr, 0.74f);
}

void AHYEscapeHUD::DrawInventoryBadge(int32 KeyCount, const FLinearColor& Accent)
{
    DrawPanel(30.0f, 28.0f, 178.0f, 58.0f, Accent, 4.0f);
    DrawText(TEXT("KEYS"), FColor(170, 232, 255), 50.0f, 40.0f, nullptr, 0.74f);
    DrawText(FString::Printf(TEXT("%02d"), KeyCount), FColor::White, 142.0f, 36.0f, nullptr, 1.14f);
}

void AHYEscapeHUD::DrawProgressPanel(int32 RoomNumber, int32 StepIndex, int32 StepCount, const FString& Objective, float CanvasWidth, const FLinearColor& Accent)
{
    const float PanelWidth = FMath::Clamp(CanvasWidth * 0.42f, 430.0f, 660.0f);
    const float X = FMath::Max(236.0f, CanvasWidth - PanelWidth - 30.0f);
    const float Y = 28.0f;
    const float ProgressWidth = PanelWidth - 44.0f;
    const float ProgressAlpha = StepCount > 0 ? FMath::Clamp(static_cast<float>(StepIndex) / static_cast<float>(StepCount), 0.0f, 1.0f) : 0.0f;

    DrawPanel(X, Y, PanelWidth, 92.0f, Accent, 4.0f);
    DrawText(FString::Printf(TEXT("ROOM %d / 5"), RoomNumber), FColor(170, 232, 255), X + 22.0f, Y + 14.0f, nullptr, 0.74f);
    DrawText(FString::Printf(TEXT("ESCAPE FLOW %02d / %02d"), StepIndex, StepCount), FColor(210, 226, 235), X + PanelWidth - 190.0f, Y + 14.0f, nullptr, 0.68f);
    DrawRect(FLinearColor(0.08f, 0.10f, 0.12f, 0.82f), X + 22.0f, Y + 40.0f, ProgressWidth, 7.0f);
    DrawRect(Accent, X + 22.0f, Y + 40.0f, ProgressWidth * ProgressAlpha, 7.0f);
    DrawText(Objective, FColor::White, X + 22.0f, Y + 57.0f, nullptr, 0.76f);
}

void AHYEscapeHUD::DrawPanel(float X, float Y, float Width, float Height, const FLinearColor& Accent, float AccentWidth)
{
    DrawRect(FLinearColor(0.015f, 0.018f, 0.024f, 0.68f), X, Y, Width, Height);
    DrawRect(FLinearColor(0.03f, 0.08f, 0.10f, 0.72f), X, Y, Width, 1.0f);
    DrawRect(Accent, X, Y, AccentWidth, Height);
    DrawLine(X, Y + Height, X + Width, Y + Height, FLinearColor(0.38f, 0.72f, 0.86f, 0.42f), 1.0f);
}
