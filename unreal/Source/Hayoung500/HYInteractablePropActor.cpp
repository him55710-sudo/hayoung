#include "HYInteractablePropActor.h"
#include "Components/StaticMeshComponent.h"
#include "Engine/Engine.h"
#include "HYFirstPersonCharacter.h"
#include "Kismet/GameplayStatics.h"
#include "UObject/ConstructorHelpers.h"

AHYInteractablePropActor::AHYInteractablePropActor()
{
    PrimaryActorTick.bCanEverTick = true;
    PropMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("PropMesh"));
    RootComponent = PropMesh;

    InteractionPlateMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("InteractionPlateMesh"));
    InteractionPlateMesh->SetupAttachment(PropMesh);
    InteractionPlateMesh->SetRelativeLocation(FVector(0.0f, -54.0f, 8.0f));
    InteractionPlateMesh->SetRelativeScale3D(FVector(0.62f, 0.08f, 0.16f));

    FeedbackLampMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("FeedbackLampMesh"));
    FeedbackLampMesh->SetupAttachment(PropMesh);
    FeedbackLampMesh->SetRelativeLocation(FVector(34.0f, -58.0f, 32.0f));
    FeedbackLampMesh->SetRelativeScale3D(FVector(0.12f, 0.12f, 0.12f));

    RewardGlowMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("RewardGlowMesh"));
    RewardGlowMesh->SetupAttachment(PropMesh);
    RewardGlowMesh->SetRelativeLocation(FVector(-34.0f, -58.0f, 24.0f));
    RewardGlowMesh->SetRelativeScale3D(FVector(0.10f, 0.10f, 0.10f));

    static ConstructorHelpers::FObjectFinder<UStaticMesh> CubeMesh(TEXT("/Engine/BasicShapes/Cube.Cube"));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> SphereMesh(TEXT("/Engine/BasicShapes/Sphere.Sphere"));
    if (CubeMesh.Succeeded())
    {
        InteractionPlateMesh->SetStaticMesh(CubeMesh.Object);
    }
    if (SphereMesh.Succeeded())
    {
        FeedbackLampMesh->SetStaticMesh(SphereMesh.Object);
        RewardGlowMesh->SetStaticMesh(SphereMesh.Object);
    }
}

void AHYInteractablePropActor::BeginPlay()
{
    Super::BeginPlay();
    ClosedMeshLocation = PropMesh->GetRelativeLocation();
    ClosedMeshRotation = PropMesh->GetRelativeRotation();
    ClosedPlateLocation = InteractionPlateMesh->GetRelativeLocation();
    ClosedPlateRotation = InteractionPlateMesh->GetRelativeRotation();
    ClosedLampLocation = FeedbackLampMesh->GetRelativeLocation();
    ClosedLampScale = FeedbackLampMesh->GetRelativeScale3D();
    ClosedRewardLocation = RewardGlowMesh->GetRelativeLocation();
    ClosedRewardScale = RewardGlowMesh->GetRelativeScale3D();
}

void AHYInteractablePropActor::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
    UpdateInteractionMotion(DeltaSeconds);
}

bool AHYInteractablePropActor::Interact(AHYFirstPersonCharacter* Player)
{
    if (Player)
    {
        Player->NotifyInteractionFeedback();
    }

    if (bInteracted)
    {
        ShowFeedback(FString::Printf(TEXT("Already checked: %s"), *InteractionPrompt), FColor::Cyan);
        return true;
    }

    if (!Player || !Player->HasKey(RequiredKeyId))
    {
        ShowFeedback(TEXT("This prop needs another clue first."), FColor::Orange);
        return false;
    }

    bInteracted = true;
    MotionAlpha = FMath::Max(MotionAlpha, 0.35f);
    Player->AddKey(RewardKeyId);
    PlayInteractionSound();
    ShowFeedback(FString::Printf(TEXT("Interacted: %s"), *InteractionPrompt), FColor::Green);
    return true;
}

FString AHYInteractablePropActor::GetPromptText() const
{
    if (bInteracted)
    {
        return FString::Printf(TEXT("%s\nChecked."), *InteractionPrompt);
    }

    return FString::Printf(TEXT("%s\nE: interact"), *InteractionPrompt);
}

bool AHYInteractablePropActor::WasInteracted() const
{
    return bInteracted;
}

bool AHYInteractablePropActor::HasRuntimePropHardware() const
{
    return PropMesh && InteractionPlateMesh && FeedbackLampMesh && RewardGlowMesh;
}

float AHYInteractablePropActor::GetMotionAlpha() const
{
    return MotionAlpha;
}

void AHYInteractablePropActor::ResetInteractionForSimulation()
{
    bInteracted = false;
    MotionAlpha = 0.0f;
}

void AHYInteractablePropActor::UpdateInteractionMotion(float DeltaSeconds)
{
    const float TargetAlpha = bInteracted ? 1.0f : 0.0f;
    MotionAlpha = FMath::FInterpTo(MotionAlpha, TargetAlpha, DeltaSeconds, MotionSpeed);
    const FVector TargetLocation = ClosedMeshLocation + MotionOffset;
    const FRotator TargetRotation = ClosedMeshRotation + MotionRotation;
    PropMesh->SetRelativeLocation(FMath::Lerp(ClosedMeshLocation, TargetLocation, MotionAlpha));
    PropMesh->SetRelativeRotation(FRotator(
        FMath::Lerp(ClosedMeshRotation.Pitch, TargetRotation.Pitch, MotionAlpha),
        FMath::Lerp(ClosedMeshRotation.Yaw, TargetRotation.Yaw, MotionAlpha),
        FMath::Lerp(ClosedMeshRotation.Roll, TargetRotation.Roll, MotionAlpha)
    ));

    const FVector TargetPlateLocation = ClosedPlateLocation + FVector(0.0f, -10.0f, -2.0f);
    const FRotator TargetPlateRotation = ClosedPlateRotation + FRotator(-6.0f, 0.0f, 0.0f);
    InteractionPlateMesh->SetRelativeLocation(FMath::Lerp(ClosedPlateLocation, TargetPlateLocation, MotionAlpha));
    InteractionPlateMesh->SetRelativeRotation(FRotator(
        FMath::Lerp(ClosedPlateRotation.Pitch, TargetPlateRotation.Pitch, MotionAlpha),
        FMath::Lerp(ClosedPlateRotation.Yaw, TargetPlateRotation.Yaw, MotionAlpha),
        FMath::Lerp(ClosedPlateRotation.Roll, TargetPlateRotation.Roll, MotionAlpha)
    ));

    FeedbackLampMesh->SetRelativeLocation(FMath::Lerp(ClosedLampLocation, ClosedLampLocation + FVector(0.0f, -7.0f, 7.0f), MotionAlpha));
    FeedbackLampMesh->SetRelativeScale3D(FMath::Lerp(ClosedLampScale, ClosedLampScale * 1.55f, MotionAlpha));

    RewardGlowMesh->SetRelativeLocation(FMath::Lerp(ClosedRewardLocation, ClosedRewardLocation + FVector(0.0f, -12.0f, 18.0f), MotionAlpha));
    RewardGlowMesh->SetRelativeScale3D(FMath::Lerp(ClosedRewardScale, ClosedRewardScale * 1.7f, MotionAlpha));
}

void AHYInteractablePropActor::ShowFeedback(const FString& Message, const FColor& Color) const
{
    if (GEngine)
    {
        GEngine->AddOnScreenDebugMessage(-1, 2.4f, Color, Message);
    }
}

void AHYInteractablePropActor::PlayInteractionSound() const
{
    if (InteractionSound)
    {
        UGameplayStatics::PlaySoundAtLocation(this, InteractionSound, GetActorLocation());
    }
}
