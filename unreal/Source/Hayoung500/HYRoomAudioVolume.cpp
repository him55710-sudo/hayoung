#include "HYRoomAudioVolume.h"
#include "Components/AudioComponent.h"
#include "Components/BoxComponent.h"
#include "HYFirstPersonCharacter.h"
#include "HYFootstepAudioComponent.h"
#include "Sound/SoundBase.h"

AHYRoomAudioVolume::AHYRoomAudioVolume()
{
    PrimaryActorTick.bCanEverTick = false;

    TriggerVolume = CreateDefaultSubobject<UBoxComponent>(TEXT("TriggerVolume"));
    RootComponent = TriggerVolume;
    TriggerVolume->SetCollisionEnabled(ECollisionEnabled::QueryOnly);
    TriggerVolume->SetCollisionObjectType(ECC_WorldDynamic);
    TriggerVolume->SetCollisionResponseToAllChannels(ECR_Ignore);
    TriggerVolume->SetCollisionResponseToChannel(ECC_Pawn, ECR_Overlap);

    AudioComponent = CreateDefaultSubobject<UAudioComponent>(TEXT("AudioComponent"));
    AudioComponent->SetupAttachment(TriggerVolume);
    AudioComponent->bAutoActivate = false;
    AudioComponent->bAllowSpatialization = false;
}

bool AHYRoomAudioVolume::HasRoomAmbience() const
{
    return RoomAmbience != nullptr;
}

FString AHYRoomAudioVolume::GetRoomAmbienceDebugName() const
{
    return RoomAmbience ? RoomAmbience->GetPathName() : FString();
}

float AHYRoomAudioVolume::GetConfiguredVolumeMultiplier() const
{
    return VolumeMultiplier;
}

float AHYRoomAudioVolume::GetFadeSeconds() const
{
    return FadeSeconds;
}

bool AHYRoomAudioVolume::IsAmbiencePlaybackActive() const
{
    return AudioComponent && AudioComponent->IsPlaying();
}

int32 AHYRoomAudioVolume::GetAmbiencePlaybackRequestCount() const
{
    return AmbiencePlaybackRequestCount;
}

int32 AHYRoomAudioVolume::GetAmbienceFadeOutRequestCount() const
{
    return AmbienceFadeOutRequestCount;
}

FString AHYRoomAudioVolume::GetFootstepSurfaceName() const
{
    return FootstepSurface.ToString();
}

void AHYRoomAudioVolume::PreviewEnterRoom()
{
    StartAmbience();
}

void AHYRoomAudioVolume::PreviewEnterRoomForPlayer(AHYFirstPersonCharacter* Player)
{
    StartAmbience();
    ApplyFootstepSurface(Player);
}

void AHYRoomAudioVolume::PreviewExitRoom()
{
    StopAmbience();
}

void AHYRoomAudioVolume::BeginPlay()
{
    Super::BeginPlay();

    PrepareAudioComponent();

    TriggerVolume->OnComponentBeginOverlap.AddDynamic(this, &AHYRoomAudioVolume::OnBeginOverlap);
    TriggerVolume->OnComponentEndOverlap.AddDynamic(this, &AHYRoomAudioVolume::OnEndOverlap);
}

void AHYRoomAudioVolume::OnBeginOverlap(UPrimitiveComponent* OverlappedComponent, AActor* OtherActor, UPrimitiveComponent* OtherComp, int32 OtherBodyIndex, bool bFromSweep, const FHitResult& SweepResult)
{
    if (AHYFirstPersonCharacter* Player = Cast<AHYFirstPersonCharacter>(OtherActor))
    {
        PreviewEnterRoomForPlayer(Player);
    }
}

void AHYRoomAudioVolume::OnEndOverlap(UPrimitiveComponent* OverlappedComponent, AActor* OtherActor, UPrimitiveComponent* OtherComp, int32 OtherBodyIndex)
{
    if (Cast<AHYFirstPersonCharacter>(OtherActor))
    {
        StopAmbience();
    }
}

void AHYRoomAudioVolume::PrepareAudioComponent()
{
    if (AudioComponent && RoomAmbience && AudioComponent->Sound != RoomAmbience)
    {
        AudioComponent->SetSound(RoomAmbience);
    }
}

void AHYRoomAudioVolume::StartAmbience()
{
    PrepareAudioComponent();
    if (AudioComponent && AudioComponent->Sound)
    {
        ++AmbiencePlaybackRequestCount;
        AudioComponent->FadeIn(FadeSeconds, VolumeMultiplier);
    }
}

void AHYRoomAudioVolume::StopAmbience()
{
    if (AudioComponent)
    {
        ++AmbienceFadeOutRequestCount;
        AudioComponent->FadeOut(FadeSeconds, 0.0f);
    }
}

void AHYRoomAudioVolume::ApplyFootstepSurface(AHYFirstPersonCharacter* Player) const
{
    if (Player)
    {
        if (UHYFootstepAudioComponent* Footsteps = Player->FindComponentByClass<UHYFootstepAudioComponent>())
        {
            Footsteps->SetCurrentSurfaceName(FootstepSurface);
        }
    }
}
