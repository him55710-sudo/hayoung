#include "HYLockActor.h"
#include "Components/SceneComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Engine/StaticMesh.h"
#include "HYDoorActor.h"
#include "HYFirstPersonCharacter.h"
#include "Engine/Engine.h"
#include "Kismet/GameplayStatics.h"
#include "UObject/ConstructorHelpers.h"

AHYLockActor::AHYLockActor()
{
    PrimaryActorTick.bCanEverTick = true;

    LockRoot = CreateDefaultSubobject<USceneComponent>(TEXT("LockRoot"));
    RootComponent = LockRoot;

    LockMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("LockMesh"));
    LockMesh->SetupAttachment(LockRoot);

    DetailPlateMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("DetailPlateMesh"));
    DetailPlateMesh->SetupAttachment(LockRoot);
    DetailPlateMesh->SetRelativeLocation(FVector(0.0f, 9.0f, -3.0f));
    DetailPlateMesh->SetRelativeScale3D(FVector(1.12f, 0.16f, 0.78f));

    MovingBoltMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("MovingBoltMesh"));
    MovingBoltMesh->SetupAttachment(LockRoot);
    MovingBoltMesh->SetRelativeLocation(FVector(0.0f, -16.0f, 1.0f));
    MovingBoltMesh->SetRelativeScale3D(FVector(0.84f, 0.16f, 0.13f));

    IndicatorMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("IndicatorMesh"));
    IndicatorMesh->SetupAttachment(LockRoot);
    IndicatorMesh->SetRelativeLocation(FVector(0.0f, -18.0f, 28.0f));
    IndicatorMesh->SetRelativeScale3D(FVector(0.16f, 0.16f, 0.16f));

    InputPadMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("InputPadMesh"));
    InputPadMesh->SetupAttachment(LockRoot);
    InputPadMesh->SetRelativeLocation(FVector(0.0f, -21.0f, 4.0f));
    InputPadMesh->SetRelativeScale3D(FVector(0.54f, 0.08f, 0.42f));

    TactileWheelMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("TactileWheelMesh"));
    TactileWheelMesh->SetupAttachment(LockRoot);
    TactileWheelMesh->SetRelativeLocation(FVector(-18.0f, -24.0f, 4.0f));
    TactileWheelMesh->SetRelativeRotation(FRotator(90.0f, 0.0f, 0.0f));
    TactileWheelMesh->SetRelativeScale3D(FVector(0.22f, 0.22f, 0.07f));

    KeywayMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("KeywayMesh"));
    KeywayMesh->SetupAttachment(LockRoot);
    KeywayMesh->SetRelativeLocation(FVector(18.0f, -25.0f, -5.0f));
    KeywayMesh->SetRelativeRotation(FRotator(0.0f, 90.0f, 0.0f));
    KeywayMesh->SetRelativeScale3D(FVector(0.08f, 0.08f, 0.04f));

    FeedbackLampMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("FeedbackLampMesh"));
    FeedbackLampMesh->SetupAttachment(LockRoot);
    FeedbackLampMesh->SetRelativeLocation(FVector(18.0f, -22.0f, 23.0f));
    FeedbackLampMesh->SetRelativeScale3D(FVector(0.08f, 0.08f, 0.08f));

    static ConstructorHelpers::FObjectFinder<UStaticMesh> CubeMesh(TEXT("/Engine/BasicShapes/Cube.Cube"));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> SphereMesh(TEXT("/Engine/BasicShapes/Sphere.Sphere"));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> CylinderMesh(TEXT("/Engine/BasicShapes/Cylinder.Cylinder"));
    if (CubeMesh.Succeeded())
    {
        LockMesh->SetStaticMesh(CubeMesh.Object);
        DetailPlateMesh->SetStaticMesh(CubeMesh.Object);
        MovingBoltMesh->SetStaticMesh(CubeMesh.Object);
        InputPadMesh->SetStaticMesh(CubeMesh.Object);
    }
    if (SphereMesh.Succeeded())
    {
        IndicatorMesh->SetStaticMesh(SphereMesh.Object);
        FeedbackLampMesh->SetStaticMesh(SphereMesh.Object);
    }
    if (CylinderMesh.Succeeded())
    {
        TactileWheelMesh->SetStaticMesh(CylinderMesh.Object);
        KeywayMesh->SetStaticMesh(CylinderMesh.Object);
    }
    CreateKindSpecificHardware();
}

void AHYLockActor::BeginPlay()
{
    Super::BeginPlay();
    ClosedMeshLocation = LockMesh->GetRelativeLocation();
    ClosedMeshRotation = LockMesh->GetRelativeRotation();
    ClosedDetailPlateLocation = DetailPlateMesh->GetRelativeLocation();
    ClosedDetailPlateRotation = DetailPlateMesh->GetRelativeRotation();
    ClosedBoltLocation = MovingBoltMesh->GetRelativeLocation();
    ClosedBoltRotation = MovingBoltMesh->GetRelativeRotation();
    ClosedIndicatorLocation = IndicatorMesh->GetRelativeLocation();
    ClosedIndicatorRotation = IndicatorMesh->GetRelativeRotation();
    ClosedInputPadLocation = InputPadMesh->GetRelativeLocation();
    ClosedInputPadRotation = InputPadMesh->GetRelativeRotation();
    ClosedTactileWheelLocation = TactileWheelMesh->GetRelativeLocation();
    ClosedTactileWheelRotation = TactileWheelMesh->GetRelativeRotation();
    ClosedKeywayLocation = KeywayMesh->GetRelativeLocation();
    ClosedKeywayRotation = KeywayMesh->GetRelativeRotation();
    ClosedFeedbackLampLocation = FeedbackLampMesh->GetRelativeLocation();
    ClosedFeedbackLampRotation = FeedbackLampMesh->GetRelativeRotation();
    ClosedFeedbackLampScale = FeedbackLampMesh->GetRelativeScale3D();
    CacheKindSpecificHardwarePose();
    RefreshRuntimeLockHardware();
    ConfigureSolvedPose();
}

void AHYLockActor::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
    UpdateUnlockMotion(DeltaSeconds);
    UpdateInputFeedback(DeltaSeconds);
}

bool AHYLockActor::Interact(AHYFirstPersonCharacter* Player)
{
    if (Player)
    {
        Player->NotifyInteractionFeedback();
    }

    if (bSolved)
    {
        ShowFeedback(TEXT("Already solved. Opening the door."), FColor::Cyan);
        if (DoorToOpen)
        {
            DoorToOpen->OpenDoor();
        }
        return true;
    }

    if (!Player || !Player->HasKey(RequiredKeyId))
    {
        ShowFeedback(TEXT("Missing the required clue or key."), FColor::Orange);
        PlayResultSound(FailSound);
        return false;
    }

    if (!ExpectedInput.IsEmpty() && !PendingInput.Equals(ExpectedInput, ESearchCase::IgnoreCase))
    {
        ShowFeedback(FString::Printf(TEXT("Input mismatch: %s"), *InteractionHint), FColor::Red);
        PlayResultSound(FailSound);
        return false;
    }

    bSolved = true;
    Player->AddKey(RewardKeyId);
    ShowFeedback(FString::Printf(TEXT("Solved: %s"), *InteractionHint), FColor::Green);
    PlayResultSound(SuccessSound);

    if (DoorToOpen)
    {
        DoorToOpen->OpenDoor();
    }

    return true;
}

void AHYLockActor::SetPendingInput(const FString& NewInput)
{
    PendingInput = NewInput.TrimStartAndEnd();
}

void AHYLockActor::AppendInputToken(const FString& Token)
{
    if (!bSolved && !Token.IsEmpty())
    {
        PendingInput += Token;
        TriggerInputFeedback(Token);
        PlayResultSound(InputSound);
        ShowFeedback(FString::Printf(TEXT("Input: %s"), *PendingInput), FColor::Silver);
    }
}

void AHYLockActor::RemoveLastInputToken()
{
    if (!PendingInput.IsEmpty())
    {
        PendingInput.LeftChopInline(1);
        TriggerInputFeedback(TEXT("BACK"));
        ShowFeedback(FString::Printf(TEXT("Input: %s"), *PendingInput), FColor::Silver);
    }
}

void AHYLockActor::ClearPendingInput()
{
    PendingInput.Empty();
    TriggerInputFeedback(TEXT("CLEAR"));
    ShowFeedback(TEXT("Input cleared."), FColor::Silver);
}

void AHYLockActor::ResetLockForSimulation()
{
    bSolved = false;
    PendingInput.Empty();
    UnlockAlpha = 0.0f;
    InputFeedbackAlpha = 0.0f;
}

FString AHYLockActor::GetPromptText() const
{
    if (bSolved)
    {
        return FString::Printf(TEXT("%s\nSolved. E opens the linked door."), *InteractionHint);
    }

    if (PendingInput.IsEmpty())
    {
        return FString::Printf(TEXT("%s\nInput: _"), *InteractionHint);
    }

    return FString::Printf(TEXT("%s\nInput: %s"), *InteractionHint, *PendingInput);
}

bool AHYLockActor::IsSolved() const
{
    return bSolved;
}

float AHYLockActor::GetUnlockAlpha() const
{
    return UnlockAlpha;
}

float AHYLockActor::GetInputFeedbackAlpha() const
{
    return InputFeedbackAlpha;
}

bool AHYLockActor::HasRuntimeLockHardware() const
{
    return LockMesh && DetailPlateMesh && MovingBoltMesh && IndicatorMesh && InputPadMesh && TactileWheelMesh && KeywayMesh && FeedbackLampMesh;
}

bool AHYLockActor::HasRuntimeLockKindHardware() const
{
    switch (LockKind)
    {
    case EHYLockKind::Combination:
        return CombinationWheelMesh != nullptr;
    case EHYLockKind::Direction:
        return DirectionButtonMesh != nullptr;
    case EHYLockKind::Keypad:
        return KeypadGridMesh != nullptr;
    case EHYLockKind::KeyedPadlock:
        return KeyBladeMesh != nullptr;
    case EHYLockKind::Magnetic:
        return MagneticPlateMesh != nullptr;
    case EHYLockKind::ButtonSequence:
        return ColorButtonMesh != nullptr;
    case EHYLockKind::Letter:
        return LetterDrumMesh != nullptr;
    case EHYLockKind::SafeDial:
        return SafeDialMesh != nullptr;
    default:
        return false;
    }
}

void AHYLockActor::ShowFeedback(const FString& Message, const FColor& Color) const
{
    if (GEngine)
    {
        GEngine->AddOnScreenDebugMessage(-1, 2.4f, Color, Message);
    }
}

void AHYLockActor::PlayResultSound(USoundBase* Sound) const
{
    if (Sound)
    {
        UGameplayStatics::PlaySoundAtLocation(this, Sound, GetActorLocation());
    }
}
