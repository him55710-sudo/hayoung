#include "HYDoorActor.h"
#include "Components/StaticMeshComponent.h"
#include "Engine/Engine.h"
#include "Engine/StaticMesh.h"
#include "HYFirstPersonCharacter.h"
#include "Kismet/GameplayStatics.h"
#include "UObject/ConstructorHelpers.h"

AHYDoorActor::AHYDoorActor()
{
    PrimaryActorTick.bCanEverTick = true;
    DoorMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("DoorMesh"));
    RootComponent = DoorMesh;

    HandleMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("HandleMesh"));
    HandleMesh->SetupAttachment(DoorMesh);
    HandleMesh->SetRelativeLocation(FVector(42.0f, -14.0f, 4.0f));
    HandleMesh->SetRelativeRotation(FRotator(0.0f, 90.0f, 0.0f));
    HandleMesh->SetRelativeScale3D(FVector(0.035f, 0.035f, 0.34f));
    HandleMesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);

    HingePinMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("HingePinMesh"));
    HingePinMesh->SetupAttachment(DoorMesh);
    HingePinMesh->SetRelativeLocation(FVector(-48.0f, -13.0f, 0.0f));
    HingePinMesh->SetRelativeScale3D(FVector(0.028f, 0.028f, 1.42f));
    HingePinMesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);

    LatchBoltMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("LatchBoltMesh"));
    LatchBoltMesh->SetupAttachment(DoorMesh);
    LatchBoltMesh->SetRelativeLocation(FVector(48.0f, -13.0f, 17.0f));
    LatchBoltMesh->SetRelativeScale3D(FVector(0.13f, 0.035f, 0.05f));
    LatchBoltMesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);

    StatusLampMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("StatusLampMesh"));
    StatusLampMesh->SetupAttachment(DoorMesh);
    StatusLampMesh->SetRelativeLocation(FVector(31.0f, -16.0f, 39.0f));
    StatusLampMesh->SetRelativeScale3D(FVector(0.055f, 0.055f, 0.055f));
    StatusLampMesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);

    static ConstructorHelpers::FObjectFinder<UStaticMesh> CubeMesh(TEXT("/Engine/BasicShapes/Cube.Cube"));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> CylinderMesh(TEXT("/Engine/BasicShapes/Cylinder.Cylinder"));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> SphereMesh(TEXT("/Engine/BasicShapes/Sphere.Sphere"));
    if (CylinderMesh.Succeeded())
    {
        HandleMesh->SetStaticMesh(CylinderMesh.Object);
        HingePinMesh->SetStaticMesh(CylinderMesh.Object);
    }
    if (CubeMesh.Succeeded())
    {
        LatchBoltMesh->SetStaticMesh(CubeMesh.Object);
    }
    if (SphereMesh.Succeeded())
    {
        StatusLampMesh->SetStaticMesh(SphereMesh.Object);
    }
}

void AHYDoorActor::BeginPlay()
{
    Super::BeginPlay();
    ClosedRotation = GetActorRotation();
    ClosedHandleLocation = HandleMesh->GetRelativeLocation();
    ClosedHandleRotation = HandleMesh->GetRelativeRotation();
    ClosedLatchLocation = LatchBoltMesh->GetRelativeLocation();
    ClosedStatusLampScale = StatusLampMesh->GetRelativeScale3D();
}

void AHYDoorActor::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);

    const float TargetAlpha = bTargetOpen ? 1.0f : 0.0f;
    OpenAlpha = FMath::FInterpTo(OpenAlpha, TargetAlpha, DeltaSeconds, OpenSpeed);

    FRotator Rotation = ClosedRotation;
    Rotation.Yaw += OpenYaw * OpenAlpha + FMath::Sin(LockedFeedbackAlpha * UE_PI * 5.0f) * LockedFeedbackAlpha * 2.4f;
    SetActorRotation(Rotation);
    UpdateDoorHardware(DeltaSeconds);
}

void AHYDoorActor::OpenDoor()
{
    bUnlocked = true;
    TriggerHandleFeedback(false);

    if (!bTargetOpen)
    {
        PlayDoorSound(DoorCreakSound);
    }

    bTargetOpen = true;
}

bool AHYDoorActor::TryOpenDoor(AHYFirstPersonCharacter* Player)
{
    if (Player)
    {
        Player->NotifyInteractionFeedback();
    }

    if (bUnlocked || RequiredKeyId.IsNone() || (Player && Player->HasKey(RequiredKeyId)))
    {
        TriggerHandleFeedback(false);
        OpenDoor();
        return true;
    }

    TriggerHandleFeedback(true);
    PlayDoorSound(LockedSound);
    ShowFeedback(TEXT("Door is locked. Solve this room's final lock first."), FColor::Orange);
    return false;
}

void AHYDoorActor::CloseDoor()
{
    bTargetOpen = false;
}

void AHYDoorActor::ResetDoorForSimulation()
{
    bUnlocked = false;
    bTargetOpen = false;
    OpenAlpha = 0.0f;
    HandlePressAlpha = 0.0f;
    LockedFeedbackAlpha = 0.0f;
}

bool AHYDoorActor::IsUnlocked() const
{
    return bUnlocked;
}

bool AHYDoorActor::IsOpen() const
{
    return bTargetOpen;
}

FString AHYDoorActor::GetPromptText() const
{
    if (bTargetOpen)
    {
        return TEXT("Door\nOpen.");
    }

    if (bUnlocked || RequiredKeyId.IsNone())
    {
        return TEXT("Door\nE: open");
    }

    return TEXT("Locked door\nSolve the room locks first.");
}

bool AHYDoorActor::HasRuntimeDoorHardware() const
{
    return HandleMesh && HingePinMesh && LatchBoltMesh && StatusLampMesh
        && HandleMesh->GetStaticMesh() && HingePinMesh->GetStaticMesh()
        && LatchBoltMesh->GetStaticMesh() && StatusLampMesh->GetStaticMesh();
}

float AHYDoorActor::GetOpenAlpha() const
{
    return OpenAlpha;
}

float AHYDoorActor::GetHandlePressAlpha() const
{
    return HandlePressAlpha;
}

float AHYDoorActor::GetLockedFeedbackAlpha() const
{
    return LockedFeedbackAlpha;
}

void AHYDoorActor::TriggerHandleFeedback(bool bLocked)
{
    HandlePressAlpha = 1.0f;
    if (bLocked)
    {
        LockedFeedbackAlpha = 1.0f;
    }
}

void AHYDoorActor::UpdateDoorHardware(float DeltaSeconds)
{
    HandlePressAlpha = FMath::FInterpTo(HandlePressAlpha, 0.0f, DeltaSeconds, 7.5f);
    LockedFeedbackAlpha = FMath::FInterpTo(LockedFeedbackAlpha, 0.0f, DeltaSeconds, 9.0f);

    if (HandleMesh)
    {
        HandleMesh->SetRelativeLocation(ClosedHandleLocation + FVector(0.0f, -4.5f * HandlePressAlpha, -1.0f * HandlePressAlpha));
        HandleMesh->SetRelativeRotation(ClosedHandleRotation + FRotator(-18.0f * HandlePressAlpha, 0.0f, 0.0f));
    }
    if (LatchBoltMesh)
    {
        const float BoltAlpha = FMath::Max(OpenAlpha, bUnlocked ? 1.0f : 0.0f);
        LatchBoltMesh->SetRelativeLocation(ClosedLatchLocation + FVector(-11.0f * BoltAlpha, 0.0f, 0.0f));
    }
    if (StatusLampMesh)
    {
        const float Pulse = FMath::Max(OpenAlpha, LockedFeedbackAlpha);
        StatusLampMesh->SetRelativeScale3D(ClosedStatusLampScale * FMath::Lerp(1.0f, 1.45f, Pulse));
    }
}

void AHYDoorActor::PlayDoorSound(USoundBase* Sound) const
{
    if (Sound)
    {
        UGameplayStatics::PlaySoundAtLocation(this, Sound, GetActorLocation());
    }
}

void AHYDoorActor::ShowFeedback(const FString& Message, const FColor& Color) const
{
    if (GEngine)
    {
        GEngine->AddOnScreenDebugMessage(-1, 2.4f, Color, Message);
    }
}
