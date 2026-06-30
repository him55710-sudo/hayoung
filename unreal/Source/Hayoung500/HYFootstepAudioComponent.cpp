#include "HYFootstepAudioComponent.h"

#include "GameFramework/Actor.h"
#include "Kismet/GameplayStatics.h"
#include "Sound/SoundBase.h"

UHYFootstepAudioComponent::UHYFootstepAudioComponent()
{
    PrimaryComponentTick.bCanEverTick = true;
    WoodStep = LoadStepSound(TEXT("/Game/Hayoung500/Audio/sfx_footstep_wood.sfx_footstep_wood"));
    TileStep = LoadStepSound(TEXT("/Game/Hayoung500/Audio/sfx_footstep_tile.sfx_footstep_tile"));
    ConcreteStep = LoadStepSound(TEXT("/Game/Hayoung500/Audio/sfx_footstep_concrete.sfx_footstep_concrete"));
    MetalStep = LoadStepSound(TEXT("/Game/Hayoung500/Audio/sfx_footstep_metal.sfx_footstep_metal"));
    CloudStep = LoadStepSound(TEXT("/Game/Hayoung500/Audio/sfx_footstep_cloud.sfx_footstep_cloud"));
}

void UHYFootstepAudioComponent::BeginPlay()
{
    Super::BeginPlay();

    WoodStep = LoadStepSound(TEXT("/Game/Hayoung500/Audio/sfx_footstep_wood.sfx_footstep_wood"));
    TileStep = LoadStepSound(TEXT("/Game/Hayoung500/Audio/sfx_footstep_tile.sfx_footstep_tile"));
    ConcreteStep = LoadStepSound(TEXT("/Game/Hayoung500/Audio/sfx_footstep_concrete.sfx_footstep_concrete"));
    MetalStep = LoadStepSound(TEXT("/Game/Hayoung500/Audio/sfx_footstep_metal.sfx_footstep_metal"));
    CloudStep = LoadStepSound(TEXT("/Game/Hayoung500/Audio/sfx_footstep_cloud.sfx_footstep_cloud"));
}

void UHYFootstepAudioComponent::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

    const AActor* Owner = GetOwner();
    if (!Owner)
    {
        return;
    }

    const float Speed = Owner->GetVelocity().Size2D();
    if (Speed < MinimumStepSpeed)
    {
        StepClock = 0.0f;
        return;
    }

    StepClock += DeltaTime;
    if (StepClock < StepInterval)
    {
        return;
    }

    StepClock = 0.0f;
    if (USoundBase* StepSound = ResolveCurrentStepSound())
    {
        UGameplayStatics::PlaySoundAtLocation(this, StepSound, Owner->GetActorLocation(), FootstepVolume);
    }
}

bool UHYFootstepAudioComponent::HasFootstepAudio() const
{
    return WoodStep || TileStep || ConcreteStep || MetalStep || CloudStep;
}

float UHYFootstepAudioComponent::GetStepInterval() const
{
    return StepInterval;
}

FString UHYFootstepAudioComponent::GetCurrentSurfaceName() const
{
    return CurrentSurfaceName.ToString();
}

void UHYFootstepAudioComponent::SetCurrentSurfaceName(FName NewSurfaceName)
{
    CurrentSurfaceName = NewSurfaceName.IsNone() ? FName(TEXT("wood")) : NewSurfaceName;
}

USoundBase* UHYFootstepAudioComponent::ResolveCurrentStepSound() const
{
    const FString Surface = GetCurrentSurfaceName();
    if (Surface == TEXT("wood"))
    {
        return WoodStep;
    }
    if (Surface == TEXT("tile"))
    {
        return TileStep ? TileStep.Get() : WoodStep.Get();
    }
    if (Surface == TEXT("concrete"))
    {
        return ConcreteStep ? ConcreteStep.Get() : WoodStep.Get();
    }
    if (Surface == TEXT("metal"))
    {
        return MetalStep ? MetalStep.Get() : WoodStep.Get();
    }
    return CloudStep ? CloudStep.Get() : WoodStep.Get();
}

USoundBase* UHYFootstepAudioComponent::LoadStepSound(const TCHAR* ObjectPath) const
{
    return LoadObject<USoundBase>(nullptr, ObjectPath);
}
