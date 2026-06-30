#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "HYRoomAudioVolume.generated.h"

class UAudioComponent;
class UBoxComponent;
class UHYFootstepAudioComponent;
class UPrimitiveComponent;
class USoundBase;
class AHYFirstPersonCharacter;

UCLASS()
class HAYOUNG500_API AHYRoomAudioVolume : public AActor
{
    GENERATED_BODY()

public:
    AHYRoomAudioVolume();

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Audio")
    bool HasRoomAmbience() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Audio")
    FString GetRoomAmbienceDebugName() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Audio")
    float GetConfiguredVolumeMultiplier() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Audio")
    float GetFadeSeconds() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Audio")
    bool IsAmbiencePlaybackActive() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Audio")
    int32 GetAmbiencePlaybackRequestCount() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Audio")
    int32 GetAmbienceFadeOutRequestCount() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Audio")
    FString GetFootstepSurfaceName() const;

    UFUNCTION(BlueprintCallable, Category = "Hayoung500|Audio")
    void PreviewEnterRoom();

    UFUNCTION(BlueprintCallable, Category = "Hayoung500|Audio")
    void PreviewEnterRoomForPlayer(AHYFirstPersonCharacter* Player);

    UFUNCTION(BlueprintCallable, Category = "Hayoung500|Audio")
    void PreviewExitRoom();

protected:
    virtual void BeginPlay() override;

private:
    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Audio")
    TObjectPtr<UBoxComponent> TriggerVolume;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Audio")
    TObjectPtr<UAudioComponent> AudioComponent;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Audio")
    TObjectPtr<USoundBase> RoomAmbience;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Audio")
    float VolumeMultiplier = 0.7f;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Audio")
    float FadeSeconds = 0.8f;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Audio")
    FName FootstepSurface = TEXT("wood");

    int32 AmbiencePlaybackRequestCount = 0;
    int32 AmbienceFadeOutRequestCount = 0;

    UFUNCTION()
    void OnBeginOverlap(UPrimitiveComponent* OverlappedComponent, AActor* OtherActor, UPrimitiveComponent* OtherComp, int32 OtherBodyIndex, bool bFromSweep, const FHitResult& SweepResult);

    UFUNCTION()
    void OnEndOverlap(UPrimitiveComponent* OverlappedComponent, AActor* OtherActor, UPrimitiveComponent* OtherComp, int32 OtherBodyIndex);

    void PrepareAudioComponent();
    void StartAmbience();
    void StopAmbience();
    void ApplyFootstepSurface(AHYFirstPersonCharacter* Player) const;
};
