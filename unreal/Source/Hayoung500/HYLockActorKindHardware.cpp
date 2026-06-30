#include "HYLockActor.h"

#include "Components/StaticMeshComponent.h"
#include "Engine/StaticMesh.h"
#include "UObject/ConstructorHelpers.h"

void AHYLockActor::CreateKindSpecificHardware()
{
    CombinationWheelMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("CombinationWheelMesh"));
    CombinationWheelMesh->SetupAttachment(LockRoot);
    DirectionButtonMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("DirectionButtonMesh"));
    DirectionButtonMesh->SetupAttachment(LockRoot);
    KeypadGridMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("KeypadGridMesh"));
    KeypadGridMesh->SetupAttachment(LockRoot);
    KeyBladeMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("KeyBladeMesh"));
    KeyBladeMesh->SetupAttachment(LockRoot);
    MagneticPlateMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("MagneticPlateMesh"));
    MagneticPlateMesh->SetupAttachment(LockRoot);
    ColorButtonMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("ColorButtonMesh"));
    ColorButtonMesh->SetupAttachment(LockRoot);
    LetterDrumMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("LetterDrumMesh"));
    LetterDrumMesh->SetupAttachment(LockRoot);
    SafeDialMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("SafeDialMesh"));
    SafeDialMesh->SetupAttachment(LockRoot);
    ResetPegMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("ResetPegMesh"));
    ResetPegMesh->SetupAttachment(LockRoot);

    static ConstructorHelpers::FObjectFinder<UStaticMesh> CubeMesh(TEXT("/Engine/BasicShapes/Cube.Cube"));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> SphereMesh(TEXT("/Engine/BasicShapes/Sphere.Sphere"));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> CylinderMesh(TEXT("/Engine/BasicShapes/Cylinder.Cylinder"));
    if (CubeMesh.Succeeded())
    {
        KeypadGridMesh->SetStaticMesh(CubeMesh.Object);
        KeyBladeMesh->SetStaticMesh(CubeMesh.Object);
        MagneticPlateMesh->SetStaticMesh(CubeMesh.Object);
    }
    if (SphereMesh.Succeeded())
    {
        DirectionButtonMesh->SetStaticMesh(SphereMesh.Object);
        ColorButtonMesh->SetStaticMesh(SphereMesh.Object);
        ResetPegMesh->SetStaticMesh(SphereMesh.Object);
    }
    if (CylinderMesh.Succeeded())
    {
        CombinationWheelMesh->SetStaticMesh(CylinderMesh.Object);
        LetterDrumMesh->SetStaticMesh(CylinderMesh.Object);
        SafeDialMesh->SetStaticMesh(CylinderMesh.Object);
    }
    RefreshRuntimeLockHardware();
}

void AHYLockActor::RefreshRuntimeLockHardware()
{
    CombinationWheelMesh->SetRelativeLocation(FVector(-22.0f, -26.0f, 8.0f));
    CombinationWheelMesh->SetRelativeRotation(FRotator(90.0f, 0.0f, 0.0f));
    CombinationWheelMesh->SetRelativeScale3D(FVector(0.11f, 0.11f, 0.045f));
    DirectionButtonMesh->SetRelativeLocation(FVector(0.0f, -28.0f, 8.0f));
    DirectionButtonMesh->SetRelativeScale3D(FVector(0.10f, 0.10f, 0.045f));
    KeypadGridMesh->SetRelativeLocation(FVector(0.0f, -27.0f, 6.0f));
    KeypadGridMesh->SetRelativeScale3D(FVector(0.36f, 0.035f, 0.30f));
    KeyBladeMesh->SetRelativeLocation(FVector(25.0f, -28.0f, -7.0f));
    KeyBladeMesh->SetRelativeScale3D(FVector(0.28f, 0.030f, 0.055f));
    MagneticPlateMesh->SetRelativeLocation(FVector(-2.0f, -28.0f, 13.0f));
    MagneticPlateMesh->SetRelativeScale3D(FVector(0.38f, 0.030f, 0.16f));
    ColorButtonMesh->SetRelativeLocation(FVector(-10.0f, -29.0f, 7.0f));
    ColorButtonMesh->SetRelativeScale3D(FVector(0.095f, 0.095f, 0.050f));
    LetterDrumMesh->SetRelativeLocation(FVector(0.0f, -27.0f, 9.0f));
    LetterDrumMesh->SetRelativeRotation(FRotator(90.0f, 0.0f, 0.0f));
    LetterDrumMesh->SetRelativeScale3D(FVector(0.16f, 0.16f, 0.065f));
    SafeDialMesh->SetRelativeLocation(FVector(0.0f, -30.0f, 8.0f));
    SafeDialMesh->SetRelativeRotation(FRotator(90.0f, 0.0f, 0.0f));
    SafeDialMesh->SetRelativeScale3D(FVector(0.20f, 0.20f, 0.055f));
    ResetPegMesh->SetRelativeLocation(FVector(22.0f, -27.0f, 18.0f));
    ResetPegMesh->SetRelativeScale3D(FVector(0.052f, 0.052f, 0.052f));
    ApplyKindSpecificHardwareVisibility();
    CacheKindSpecificHardwarePose();
}

void AHYLockActor::CacheKindSpecificHardwarePose()
{
    ClosedCombinationWheelLocation = CombinationWheelMesh->GetRelativeLocation();
    ClosedCombinationWheelRotation = CombinationWheelMesh->GetRelativeRotation();
    ClosedDirectionButtonLocation = DirectionButtonMesh->GetRelativeLocation();
    ClosedDirectionButtonRotation = DirectionButtonMesh->GetRelativeRotation();
    ClosedKeypadGridLocation = KeypadGridMesh->GetRelativeLocation();
    ClosedKeypadGridRotation = KeypadGridMesh->GetRelativeRotation();
    ClosedKeyBladeLocation = KeyBladeMesh->GetRelativeLocation();
    ClosedKeyBladeRotation = KeyBladeMesh->GetRelativeRotation();
    ClosedMagneticPlateLocation = MagneticPlateMesh->GetRelativeLocation();
    ClosedMagneticPlateRotation = MagneticPlateMesh->GetRelativeRotation();
    ClosedColorButtonLocation = ColorButtonMesh->GetRelativeLocation();
    ClosedColorButtonRotation = ColorButtonMesh->GetRelativeRotation();
    ClosedLetterDrumLocation = LetterDrumMesh->GetRelativeLocation();
    ClosedLetterDrumRotation = LetterDrumMesh->GetRelativeRotation();
    ClosedSafeDialLocation = SafeDialMesh->GetRelativeLocation();
    ClosedSafeDialRotation = SafeDialMesh->GetRelativeRotation();
    ClosedResetPegLocation = ResetPegMesh->GetRelativeLocation();
    ClosedResetPegRotation = ResetPegMesh->GetRelativeRotation();
}

void AHYLockActor::ApplyKindSpecificHardwareVisibility()
{
    CombinationWheelMesh->SetVisibility(LockKind == EHYLockKind::Combination, true);
    DirectionButtonMesh->SetVisibility(LockKind == EHYLockKind::Direction, true);
    KeypadGridMesh->SetVisibility(LockKind == EHYLockKind::Keypad, true);
    KeyBladeMesh->SetVisibility(LockKind == EHYLockKind::KeyedPadlock, true);
    MagneticPlateMesh->SetVisibility(LockKind == EHYLockKind::Magnetic, true);
    ColorButtonMesh->SetVisibility(LockKind == EHYLockKind::ButtonSequence, true);
    LetterDrumMesh->SetVisibility(LockKind == EHYLockKind::Letter, true);
    SafeDialMesh->SetVisibility(LockKind == EHYLockKind::SafeDial, true);
    ResetPegMesh->SetVisibility(true, true);
}

void AHYLockActor::UpdateKindSpecificHardwareMotion()
{
    CombinationWheelMesh->SetRelativeRotation(ClosedCombinationWheelRotation + FRotator(0.0f, 0.0f, InputFeedbackAlpha * 64.0f + UnlockAlpha * 180.0f));
    DirectionButtonMesh->SetRelativeLocation(ClosedDirectionButtonLocation + FVector(0.0f, -7.0f * InputFeedbackAlpha, 2.0f * UnlockAlpha));
    KeypadGridMesh->SetRelativeLocation(ClosedKeypadGridLocation + FVector(0.0f, -5.0f * InputFeedbackAlpha, 0.0f));
    KeyBladeMesh->SetRelativeRotation(ClosedKeyBladeRotation + FRotator(0.0f, 72.0f * UnlockAlpha + 26.0f * InputFeedbackAlpha, 0.0f));
    MagneticPlateMesh->SetRelativeLocation(ClosedMagneticPlateLocation + FVector(12.0f * InputFeedbackAlpha, -8.0f * UnlockAlpha, 8.0f * UnlockAlpha));
    ColorButtonMesh->SetRelativeLocation(ClosedColorButtonLocation + FVector(0.0f, -8.0f * InputFeedbackAlpha, -3.0f * InputFeedbackAlpha));
    LetterDrumMesh->SetRelativeRotation(ClosedLetterDrumRotation + FRotator(0.0f, 0.0f, 48.0f * InputFeedbackAlpha + 96.0f * UnlockAlpha));
    SafeDialMesh->SetRelativeRotation(ClosedSafeDialRotation + FRotator(0.0f, 0.0f, 92.0f * InputFeedbackAlpha + 210.0f * UnlockAlpha));
    ResetPegMesh->SetRelativeLocation(ClosedResetPegLocation + FVector(0.0f, -3.0f * InputFeedbackAlpha, 4.0f * UnlockAlpha));
}
