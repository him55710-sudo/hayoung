#include "HYFirstPersonBodyComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Engine/StaticMesh.h"
#include "GameFramework/Actor.h"
#include "UObject/ConstructorHelpers.h"

UHYFirstPersonBodyComponent::UHYFirstPersonBodyComponent()
{
    PrimaryComponentTick.bCanEverTick = true;

    LeftHandMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("LeftHandMesh"));
    LeftHandMesh->SetupAttachment(this);
    LeftHandMesh->SetRelativeLocation(FVector(43.0f, -16.0f, -29.0f));
    LeftHandMesh->SetRelativeScale3D(FVector(0.070f, 0.090f, 0.050f));
    LeftHandMesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);

    RightHandMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("RightHandMesh"));
    RightHandMesh->SetupAttachment(this);
    RightHandMesh->SetRelativeLocation(FVector(48.0f, 18.0f, -27.0f));
    RightHandMesh->SetRelativeScale3D(FVector(0.075f, 0.092f, 0.052f));
    RightHandMesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);

    LeftForearmMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("LeftForearmMesh"));
    LeftForearmMesh->SetupAttachment(this);
    LeftForearmMesh->SetRelativeLocation(FVector(28.0f, -15.0f, -35.0f));
    LeftForearmMesh->SetRelativeRotation(FRotator(0.0f, 85.0f, 88.0f));
    LeftForearmMesh->SetRelativeScale3D(FVector(0.036f, 0.036f, 0.30f));
    LeftForearmMesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);

    RightForearmMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("RightForearmMesh"));
    RightForearmMesh->SetupAttachment(this);
    RightForearmMesh->SetRelativeLocation(FVector(32.0f, 17.0f, -34.0f));
    RightForearmMesh->SetRelativeRotation(FRotator(0.0f, 95.0f, 92.0f));
    RightForearmMesh->SetRelativeScale3D(FVector(0.038f, 0.038f, 0.32f));
    RightForearmMesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);

    ChestShadowMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("ChestShadowMesh"));
    ChestShadowMesh->SetupAttachment(this);
    ChestShadowMesh->SetRelativeLocation(FVector(4.0f, 0.0f, -58.0f));
    ChestShadowMesh->SetRelativeScale3D(FVector(0.38f, 0.22f, 0.030f));
    ChestShadowMesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);

    InteractionReachMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("InteractionReachMesh"));
    InteractionReachMesh->SetupAttachment(this);
    InteractionReachMesh->SetRelativeLocation(FVector(70.0f, 0.0f, -21.0f));
    InteractionReachMesh->SetRelativeRotation(FRotator(0.0f, 90.0f, 0.0f));
    InteractionReachMesh->SetRelativeScale3D(FVector(0.018f, 0.018f, 0.36f));
    InteractionReachMesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);

    FocusGlowMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("FocusGlowMesh"));
    FocusGlowMesh->SetupAttachment(this);
    FocusGlowMesh->SetRelativeLocation(FVector(92.0f, 0.0f, -18.0f));
    FocusGlowMesh->SetRelativeScale3D(FVector(0.035f, 0.035f, 0.035f));
    FocusGlowMesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);

    ReticleMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("ReticleMesh"));
    ReticleMesh->SetupAttachment(this);
    ReticleMesh->SetRelativeLocation(FVector(112.0f, 0.0f, -18.0f));
    ReticleMesh->SetRelativeScale3D(FVector(0.012f, 0.012f, 0.012f));
    ReticleMesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);

    static ConstructorHelpers::FObjectFinder<UStaticMesh> SphereMesh(TEXT("/Engine/BasicShapes/Sphere.Sphere"));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> CylinderMesh(TEXT("/Engine/BasicShapes/Cylinder.Cylinder"));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> CubeMesh(TEXT("/Engine/BasicShapes/Cube.Cube"));
    if (SphereMesh.Succeeded())
    {
        LeftHandMesh->SetStaticMesh(SphereMesh.Object);
        RightHandMesh->SetStaticMesh(SphereMesh.Object);
        FocusGlowMesh->SetStaticMesh(SphereMesh.Object);
        ReticleMesh->SetStaticMesh(SphereMesh.Object);
    }
    if (CylinderMesh.Succeeded())
    {
        LeftForearmMesh->SetStaticMesh(CylinderMesh.Object);
        RightForearmMesh->SetStaticMesh(CylinderMesh.Object);
        InteractionReachMesh->SetStaticMesh(CylinderMesh.Object);
    }
    if (CubeMesh.Succeeded())
    {
        ChestShadowMesh->SetStaticMesh(CubeMesh.Object);
    }
    FocusGlowMesh->SetVisibility(false);
    InteractionReachMesh->SetVisibility(false);
    ReticleMesh->SetVisibility(false);
}

void UHYFirstPersonBodyComponent::SetFocusActive(bool bNewFocusActive)
{
    bFocusActive = bNewFocusActive;
}

void UHYFirstPersonBodyComponent::TriggerInteractionFeedback()
{
    InteractionFeedbackSeconds = 0.28f;
    InteractionHandAlpha = FMath::Max(InteractionHandAlpha, 0.42f);
}

bool UHYFirstPersonBodyComponent::HasRuntimeFirstPersonBody() const
{
    return LeftHandMesh && RightHandMesh && LeftForearmMesh && RightForearmMesh && ChestShadowMesh
        && LeftHandMesh->GetStaticMesh() && RightHandMesh->GetStaticMesh()
        && LeftForearmMesh->GetStaticMesh() && RightForearmMesh->GetStaticMesh()
        && ChestShadowMesh->GetStaticMesh();
}

bool UHYFirstPersonBodyComponent::HasRuntimeInteractionRig() const
{
    return InteractionReachMesh && FocusGlowMesh && ReticleMesh
        && InteractionReachMesh->GetStaticMesh() && FocusGlowMesh->GetStaticMesh()
        && ReticleMesh->GetStaticMesh();
}

float UHYFirstPersonBodyComponent::GetInteractionHandAlpha() const
{
    return InteractionHandAlpha;
}

void UHYFirstPersonBodyComponent::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
    UpdateBodyPose(DeltaTime);
}

void UHYFirstPersonBodyComponent::UpdateBodyPose(float DeltaTime)
{
    const AActor* Owner = GetOwner();
    const float MovementAlpha = Owner ? FMath::Clamp(Owner->GetVelocity().Size2D() / 240.0f, 0.0f, 1.0f) : 0.0f;
    MovementBobSeconds += DeltaTime * FMath::Lerp(2.5f, 7.5f, MovementAlpha);
    const float BodyBob = FMath::Sin(MovementBobSeconds) * MovementAlpha;

    if (InteractionFeedbackSeconds > 0.0f)
    {
        InteractionFeedbackSeconds = FMath::Max(0.0f, InteractionFeedbackSeconds - DeltaTime);
    }

    const float TargetAlpha = (bFocusActive || InteractionFeedbackSeconds > 0.0f) ? 1.0f : 0.0f;
    InteractionHandAlpha = FMath::FInterpTo(InteractionHandAlpha, TargetAlpha, DeltaTime, 10.0f);

    if (LeftHandMesh)
    {
        FVector Location = FMath::Lerp(FVector(43.0f, -16.0f, -29.0f), FVector(54.0f, -12.0f, -23.0f), InteractionHandAlpha);
        Location.Z += BodyBob * 1.8f;
        LeftHandMesh->SetRelativeLocation(Location);
    }
    if (RightHandMesh)
    {
        FVector Location = FMath::Lerp(FVector(48.0f, 18.0f, -27.0f), FVector(66.0f, 11.0f, -20.0f), InteractionHandAlpha);
        Location.Z -= BodyBob * 1.5f;
        RightHandMesh->SetRelativeLocation(Location);
        RightHandMesh->SetRelativeRotation(FRotator(-8.0f * InteractionHandAlpha, 0.0f, 18.0f * InteractionHandAlpha + BodyBob * 1.2f));
    }
    if (LeftForearmMesh)
    {
        FVector Location = FMath::Lerp(FVector(28.0f, -15.0f, -35.0f), FVector(40.0f, -13.0f, -31.0f), InteractionHandAlpha);
        Location.Z += BodyBob * 1.2f;
        LeftForearmMesh->SetRelativeLocation(Location);
        LeftForearmMesh->SetRelativeRotation(FRotator(InteractionHandAlpha * -5.0f, 85.0f, 88.0f));
    }
    if (RightForearmMesh)
    {
        FVector Location = FMath::Lerp(FVector(32.0f, 17.0f, -34.0f), FVector(48.0f, 14.0f, -30.0f), InteractionHandAlpha);
        Location.Z -= BodyBob * 1.0f;
        RightForearmMesh->SetRelativeLocation(Location);
        RightForearmMesh->SetRelativeRotation(FRotator(InteractionHandAlpha * -7.0f, 95.0f, 92.0f + BodyBob * 1.4f));
    }
    if (ChestShadowMesh)
    {
        ChestShadowMesh->SetRelativeLocation(FVector(4.0f, 0.0f, -58.0f + BodyBob * 0.8f));
    }
    if (InteractionReachMesh)
    {
        InteractionReachMesh->SetVisibility(InteractionHandAlpha > 0.08f);
        InteractionReachMesh->SetRelativeScale3D(FVector(0.018f, 0.018f, FMath::Lerp(0.20f, 0.46f, InteractionHandAlpha)));
    }
    if (FocusGlowMesh)
    {
        FocusGlowMesh->SetVisibility(InteractionHandAlpha > 0.12f);
        FocusGlowMesh->SetRelativeScale3D(FVector(0.035f, 0.035f, FMath::Lerp(0.025f, 0.070f, InteractionHandAlpha)));
    }
    if (ReticleMesh)
    {
        ReticleMesh->SetVisibility(bFocusActive);
        ReticleMesh->SetRelativeScale3D(FVector(0.012f, 0.012f, FMath::Lerp(0.012f, 0.028f, InteractionHandAlpha)));
    }
}
