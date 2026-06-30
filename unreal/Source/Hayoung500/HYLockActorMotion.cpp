#include "HYLockActor.h"

#include "Components/StaticMeshComponent.h"

void AHYLockActor::ConfigureSolvedPose()
{
    SolvedMeshOffset = FVector::ZeroVector;
    SolvedMeshRotation = FRotator::ZeroRotator;
    SolvedBoltOffset = FVector::ZeroVector;
    SolvedBoltRotation = FRotator::ZeroRotator;
    SolvedIndicatorOffset = FVector::ZeroVector;
    SolvedIndicatorRotation = FRotator::ZeroRotator;

    switch (LockKind)
    {
    case EHYLockKind::Combination:
        SolvedMeshOffset = FVector(0.0f, 0.0f, 28.0f);
        SolvedMeshRotation = FRotator(-8.0f, 0.0f, 0.0f);
        SolvedBoltOffset = FVector(0.0f, -22.0f, 10.0f);
        SolvedIndicatorOffset = FVector(0.0f, -4.0f, 18.0f);
        break;
    case EHYLockKind::Direction:
        SolvedMeshOffset = FVector(0.0f, -12.0f, 0.0f);
        SolvedMeshRotation = FRotator(0.0f, 0.0f, 10.0f);
        SolvedBoltOffset = FVector(0.0f, -34.0f, 0.0f);
        SolvedIndicatorOffset = FVector(8.0f, -10.0f, 12.0f);
        break;
    case EHYLockKind::Keypad:
        SolvedMeshOffset = FVector(0.0f, -18.0f, 0.0f);
        SolvedBoltOffset = FVector(0.0f, -42.0f, 0.0f);
        SolvedIndicatorOffset = FVector(0.0f, -14.0f, 14.0f);
        break;
    case EHYLockKind::KeyedPadlock:
        SolvedMeshOffset = FVector(0.0f, 0.0f, -16.0f);
        SolvedMeshRotation = FRotator(0.0f, 88.0f, 0.0f);
        SolvedBoltOffset = FVector(0.0f, -18.0f, -18.0f);
        SolvedBoltRotation = FRotator(0.0f, 74.0f, 0.0f);
        SolvedIndicatorOffset = FVector(0.0f, -6.0f, 22.0f);
        break;
    case EHYLockKind::Magnetic:
        SolvedMeshOffset = FVector(0.0f, -10.0f, 18.0f);
        SolvedMeshRotation = FRotator(0.0f, 18.0f, 0.0f);
        SolvedBoltOffset = FVector(12.0f, -24.0f, 18.0f);
        SolvedIndicatorOffset = FVector(0.0f, -18.0f, 20.0f);
        break;
    case EHYLockKind::ButtonSequence:
        SolvedMeshOffset = FVector(0.0f, -20.0f, 0.0f);
        SolvedMeshRotation = FRotator(12.0f, 0.0f, 0.0f);
        SolvedBoltOffset = FVector(0.0f, -38.0f, 0.0f);
        SolvedIndicatorOffset = FVector(-8.0f, -14.0f, 16.0f);
        break;
    case EHYLockKind::Letter:
        SolvedMeshOffset = FVector(0.0f, 0.0f, 8.0f);
        SolvedMeshRotation = FRotator(0.0f, 0.0f, 34.0f);
        SolvedBoltOffset = FVector(18.0f, -20.0f, 8.0f);
        SolvedIndicatorOffset = FVector(0.0f, -8.0f, 18.0f);
        break;
    case EHYLockKind::SafeDial:
        SolvedMeshOffset = FVector(18.0f, -12.0f, 0.0f);
        SolvedMeshRotation = FRotator(0.0f, 72.0f, 0.0f);
        SolvedBoltOffset = FVector(34.0f, -28.0f, 0.0f);
        SolvedBoltRotation = FRotator(0.0f, 0.0f, -18.0f);
        SolvedIndicatorOffset = FVector(0.0f, -10.0f, 20.0f);
        break;
    }
}

void AHYLockActor::ConfigureInputFeedbackPose(const FString& Token)
{
    InputPlateOffset = FVector(0.0f, -4.0f, 0.0f);
    InputPlateRotation = FRotator::ZeroRotator;
    InputIndicatorOffset = FVector(0.0f, -5.0f, 6.0f);
    InputIndicatorRotation = FRotator::ZeroRotator;

    switch (LockKind)
    {
    case EHYLockKind::Combination:
        InputPlateOffset = FVector(0.0f, -3.0f, 0.0f);
        InputIndicatorRotation = FRotator(0.0f, 0.0f, 28.0f);
        break;
    case EHYLockKind::Direction:
        InputPlateOffset = FVector(0.0f, -5.0f, 0.0f);
        if (Token.Equals(TEXT("U"), ESearchCase::IgnoreCase))
        {
            InputIndicatorOffset = FVector(0.0f, -6.0f, 15.0f);
        }
        else if (Token.Equals(TEXT("D"), ESearchCase::IgnoreCase))
        {
            InputIndicatorOffset = FVector(0.0f, -6.0f, -8.0f);
        }
        else if (Token.Equals(TEXT("L"), ESearchCase::IgnoreCase))
        {
            InputIndicatorOffset = FVector(-12.0f, -6.0f, 3.0f);
        }
        else
        {
            InputIndicatorOffset = FVector(12.0f, -6.0f, 3.0f);
        }
        break;
    case EHYLockKind::Keypad:
        InputPlateOffset = FVector(0.0f, -7.0f, -2.0f);
        InputIndicatorOffset = FVector(0.0f, -8.0f, 8.0f);
        break;
    case EHYLockKind::KeyedPadlock:
        InputPlateRotation = FRotator(0.0f, 22.0f, 0.0f);
        InputIndicatorOffset = FVector(0.0f, -5.0f, 12.0f);
        break;
    case EHYLockKind::Magnetic:
        InputPlateOffset = FVector(9.0f, -5.0f, 7.0f);
        InputIndicatorOffset = FVector(12.0f, -8.0f, 11.0f);
        break;
    case EHYLockKind::ButtonSequence:
        InputPlateOffset = FVector(0.0f, -8.0f, -4.0f);
        InputPlateRotation = FRotator(-7.0f, 0.0f, 0.0f);
        InputIndicatorOffset = FVector(-8.0f, -7.0f, 8.0f);
        break;
    case EHYLockKind::Letter:
        InputPlateRotation = FRotator(0.0f, 0.0f, 24.0f);
        InputIndicatorRotation = FRotator(0.0f, 0.0f, -20.0f);
        break;
    case EHYLockKind::SafeDial:
        InputPlateRotation = FRotator(0.0f, 36.0f, 0.0f);
        InputIndicatorRotation = FRotator(0.0f, 0.0f, -18.0f);
        break;
    }
}

void AHYLockActor::TriggerInputFeedback(const FString& Token)
{
    if (!bSolved)
    {
        ConfigureInputFeedbackPose(Token);
        InputFeedbackAlpha = 1.0f;
    }
}

void AHYLockActor::UpdateUnlockMotion(float DeltaSeconds)
{
    const float TargetAlpha = bSolved ? 1.0f : 0.0f;
    UnlockAlpha = FMath::FInterpTo(UnlockAlpha, TargetAlpha, DeltaSeconds, UnlockAnimationSpeed);
    const FVector TargetLocation = ClosedMeshLocation + SolvedMeshOffset;
    const FRotator TargetRotation = ClosedMeshRotation + SolvedMeshRotation;
    LockMesh->SetRelativeLocation(FMath::Lerp(ClosedMeshLocation, TargetLocation, UnlockAlpha));
    LockMesh->SetRelativeRotation(FRotator(
        FMath::Lerp(ClosedMeshRotation.Pitch, TargetRotation.Pitch, UnlockAlpha),
        FMath::Lerp(ClosedMeshRotation.Yaw, TargetRotation.Yaw, UnlockAlpha),
        FMath::Lerp(ClosedMeshRotation.Roll, TargetRotation.Roll, UnlockAlpha)
    ));

    const FVector TargetBoltLocation = ClosedBoltLocation + SolvedBoltOffset;
    const FRotator TargetBoltRotation = ClosedBoltRotation + SolvedBoltRotation;
    MovingBoltMesh->SetRelativeLocation(FMath::Lerp(ClosedBoltLocation, TargetBoltLocation, UnlockAlpha));
    MovingBoltMesh->SetRelativeRotation(FRotator(
        FMath::Lerp(ClosedBoltRotation.Pitch, TargetBoltRotation.Pitch, UnlockAlpha),
        FMath::Lerp(ClosedBoltRotation.Yaw, TargetBoltRotation.Yaw, UnlockAlpha),
        FMath::Lerp(ClosedBoltRotation.Roll, TargetBoltRotation.Roll, UnlockAlpha)
    ));

    const FVector TargetIndicatorLocation = ClosedIndicatorLocation + SolvedIndicatorOffset;
    const FRotator TargetIndicatorRotation = ClosedIndicatorRotation + SolvedIndicatorRotation;
    IndicatorMesh->SetRelativeLocation(FMath::Lerp(ClosedIndicatorLocation, TargetIndicatorLocation, UnlockAlpha));
    IndicatorMesh->SetRelativeRotation(FRotator(
        FMath::Lerp(ClosedIndicatorRotation.Pitch, TargetIndicatorRotation.Pitch, UnlockAlpha),
        FMath::Lerp(ClosedIndicatorRotation.Yaw, TargetIndicatorRotation.Yaw, UnlockAlpha),
        FMath::Lerp(ClosedIndicatorRotation.Roll, TargetIndicatorRotation.Roll, UnlockAlpha)
    ));

    const FVector TargetInputPadLocation = ClosedInputPadLocation + (SolvedBoltOffset * 0.18f);
    InputPadMesh->SetRelativeLocation(FMath::Lerp(ClosedInputPadLocation, TargetInputPadLocation, UnlockAlpha));

    const FRotator TargetWheelRotation = ClosedTactileWheelRotation + SolvedMeshRotation + FRotator(0.0f, 0.0f, 42.0f);
    TactileWheelMesh->SetRelativeRotation(FRotator(
        FMath::Lerp(ClosedTactileWheelRotation.Pitch, TargetWheelRotation.Pitch, UnlockAlpha),
        FMath::Lerp(ClosedTactileWheelRotation.Yaw, TargetWheelRotation.Yaw, UnlockAlpha),
        FMath::Lerp(ClosedTactileWheelRotation.Roll, TargetWheelRotation.Roll, UnlockAlpha)
    ));

    const FRotator TargetKeywayRotation = ClosedKeywayRotation + SolvedBoltRotation + FRotator(0.0f, 54.0f, 0.0f);
    KeywayMesh->SetRelativeRotation(FRotator(
        FMath::Lerp(ClosedKeywayRotation.Pitch, TargetKeywayRotation.Pitch, UnlockAlpha),
        FMath::Lerp(ClosedKeywayRotation.Yaw, TargetKeywayRotation.Yaw, UnlockAlpha),
        FMath::Lerp(ClosedKeywayRotation.Roll, TargetKeywayRotation.Roll, UnlockAlpha)
    ));

    const FVector TargetLampLocation = ClosedFeedbackLampLocation + (SolvedIndicatorOffset * 0.35f);
    FeedbackLampMesh->SetRelativeLocation(FMath::Lerp(ClosedFeedbackLampLocation, TargetLampLocation, UnlockAlpha));
    FeedbackLampMesh->SetRelativeScale3D(FMath::Lerp(ClosedFeedbackLampScale, ClosedFeedbackLampScale * 1.45f, UnlockAlpha));
    UpdateKindSpecificHardwareMotion();
}

void AHYLockActor::UpdateInputFeedback(float DeltaSeconds)
{
    InputFeedbackAlpha = FMath::FInterpTo(InputFeedbackAlpha, 0.0f, DeltaSeconds, InputFeedbackDecaySpeed);
    const FVector TargetPlateLocation = ClosedDetailPlateLocation + InputPlateOffset;
    const FRotator TargetPlateRotation = ClosedDetailPlateRotation + InputPlateRotation;
    DetailPlateMesh->SetRelativeLocation(FMath::Lerp(ClosedDetailPlateLocation, TargetPlateLocation, InputFeedbackAlpha));
    DetailPlateMesh->SetRelativeRotation(FRotator(
        FMath::Lerp(ClosedDetailPlateRotation.Pitch, TargetPlateRotation.Pitch, InputFeedbackAlpha),
        FMath::Lerp(ClosedDetailPlateRotation.Yaw, TargetPlateRotation.Yaw, InputFeedbackAlpha),
        FMath::Lerp(ClosedDetailPlateRotation.Roll, TargetPlateRotation.Roll, InputFeedbackAlpha)
    ));

    const FVector TargetInputPadLocation = ClosedInputPadLocation + (InputPlateOffset * 0.72f);
    const FRotator TargetInputPadRotation = ClosedInputPadRotation + InputPlateRotation;
    InputPadMesh->SetRelativeLocation(FMath::Lerp(ClosedInputPadLocation, TargetInputPadLocation, InputFeedbackAlpha));
    InputPadMesh->SetRelativeRotation(FRotator(
        FMath::Lerp(ClosedInputPadRotation.Pitch, TargetInputPadRotation.Pitch, InputFeedbackAlpha),
        FMath::Lerp(ClosedInputPadRotation.Yaw, TargetInputPadRotation.Yaw, InputFeedbackAlpha),
        FMath::Lerp(ClosedInputPadRotation.Roll, TargetInputPadRotation.Roll, InputFeedbackAlpha)
    ));

    if (bSolved)
    {
        return;
    }

    const FVector TargetIndicatorLocation = ClosedIndicatorLocation + InputIndicatorOffset;
    const FRotator TargetIndicatorRotation = ClosedIndicatorRotation + InputIndicatorRotation;
    IndicatorMesh->SetRelativeLocation(FMath::Lerp(ClosedIndicatorLocation, TargetIndicatorLocation, InputFeedbackAlpha));
    IndicatorMesh->SetRelativeRotation(FRotator(
        FMath::Lerp(ClosedIndicatorRotation.Pitch, TargetIndicatorRotation.Pitch, InputFeedbackAlpha),
        FMath::Lerp(ClosedIndicatorRotation.Yaw, TargetIndicatorRotation.Yaw, InputFeedbackAlpha),
        FMath::Lerp(ClosedIndicatorRotation.Roll, TargetIndicatorRotation.Roll, InputFeedbackAlpha)
    ));

    const FRotator TargetWheelRotation = ClosedTactileWheelRotation + InputIndicatorRotation + FRotator(0.0f, 0.0f, 26.0f);
    TactileWheelMesh->SetRelativeRotation(FRotator(
        FMath::Lerp(ClosedTactileWheelRotation.Pitch, TargetWheelRotation.Pitch, InputFeedbackAlpha),
        FMath::Lerp(ClosedTactileWheelRotation.Yaw, TargetWheelRotation.Yaw, InputFeedbackAlpha),
        FMath::Lerp(ClosedTactileWheelRotation.Roll, TargetWheelRotation.Roll, InputFeedbackAlpha)
    ));

    const FRotator TargetKeywayRotation = ClosedKeywayRotation + InputPlateRotation + FRotator(0.0f, 18.0f, 0.0f);
    KeywayMesh->SetRelativeRotation(FRotator(
        FMath::Lerp(ClosedKeywayRotation.Pitch, TargetKeywayRotation.Pitch, InputFeedbackAlpha),
        FMath::Lerp(ClosedKeywayRotation.Yaw, TargetKeywayRotation.Yaw, InputFeedbackAlpha),
        FMath::Lerp(ClosedKeywayRotation.Roll, TargetKeywayRotation.Roll, InputFeedbackAlpha)
    ));

    FeedbackLampMesh->SetRelativeScale3D(FMath::Lerp(ClosedFeedbackLampScale, ClosedFeedbackLampScale * 1.28f, InputFeedbackAlpha));
    UpdateKindSpecificHardwareMotion();
}
