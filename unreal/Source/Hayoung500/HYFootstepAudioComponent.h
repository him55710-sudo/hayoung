#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "HYFootstepAudioComponent.generated.h"

class USoundBase;

UCLASS(ClassGroup = (Hayoung500), meta = (BlueprintSpawnableComponent))
class HAYOUNG500_API UHYFootstepAudioComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UHYFootstepAudioComponent();

    virtual void BeginPlay() override;
    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Audio")
    bool HasFootstepAudio() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Audio")
    float GetStepInterval() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Audio")
    FString GetCurrentSurfaceName() const;

    UFUNCTION(BlueprintCallable, Category = "Hayoung500|Audio")
    void SetCurrentSurfaceName(FName NewSurfaceName);

private:
    UPROPERTY(EditAnywhere, Category = "Hayoung500|Audio")
    float StepInterval = 0.42f;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Audio")
    float MinimumStepSpeed = 24.0f;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Audio")
    float FootstepVolume = 0.42f;

    UPROPERTY(Transient)
    TObjectPtr<USoundBase> WoodStep;

    UPROPERTY(Transient)
    TObjectPtr<USoundBase> TileStep;

    UPROPERTY(Transient)
    TObjectPtr<USoundBase> ConcreteStep;

    UPROPERTY(Transient)
    TObjectPtr<USoundBase> MetalStep;

    UPROPERTY(Transient)
    TObjectPtr<USoundBase> CloudStep;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Audio")
    FName CurrentSurfaceName = TEXT("wood");

    float StepClock = 0.0f;

    USoundBase* ResolveCurrentStepSound() const;
    USoundBase* LoadStepSound(const TCHAR* ObjectPath) const;
};
