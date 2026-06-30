#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "HYDoorActor.generated.h"

class USoundBase;
class UStaticMeshComponent;
class AHYFirstPersonCharacter;

UCLASS()
class HAYOUNG500_API AHYDoorActor : public AActor
{
    GENERATED_BODY()

public:
    AHYDoorActor();

    virtual void Tick(float DeltaSeconds) override;

    UFUNCTION(BlueprintCallable, Category = "Hayoung500|Door")
    void OpenDoor();

    UFUNCTION(BlueprintCallable, Category = "Hayoung500|Door")
    bool TryOpenDoor(AHYFirstPersonCharacter* Player);

    UFUNCTION(BlueprintCallable, Category = "Hayoung500|Door")
    void CloseDoor();

    UFUNCTION(BlueprintCallable, Category = "Hayoung500|Simulation")
    void ResetDoorForSimulation();

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Door")
    bool IsUnlocked() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Door")
    bool IsOpen() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Door")
    FString GetPromptText() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Door")
    bool HasRuntimeDoorHardware() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Motion")
    float GetOpenAlpha() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Motion")
    float GetHandlePressAlpha() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Motion")
    float GetLockedFeedbackAlpha() const;

protected:
    virtual void BeginPlay() override;

private:
    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Door")
    TObjectPtr<UStaticMeshComponent> DoorMesh;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Door")
    TObjectPtr<UStaticMeshComponent> HandleMesh;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Door")
    TObjectPtr<UStaticMeshComponent> HingePinMesh;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Door")
    TObjectPtr<UStaticMeshComponent> LatchBoltMesh;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Door")
    TObjectPtr<UStaticMeshComponent> StatusLampMesh;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Door")
    float OpenYaw = 82.0f;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Door")
    float OpenSpeed = 4.0f;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Door")
    FName RequiredKeyId;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Audio")
    TObjectPtr<USoundBase> DoorCreakSound;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Audio")
    TObjectPtr<USoundBase> LockedSound;

    FRotator ClosedRotation;
    FVector ClosedHandleLocation;
    FRotator ClosedHandleRotation;
    FVector ClosedLatchLocation;
    FVector ClosedStatusLampScale;
    float OpenAlpha = 0.0f;
    float HandlePressAlpha = 0.0f;
    float LockedFeedbackAlpha = 0.0f;
    bool bTargetOpen = false;
    bool bUnlocked = false;

    void TriggerHandleFeedback(bool bLocked);
    void UpdateDoorHardware(float DeltaSeconds);
    void PlayDoorSound(USoundBase* Sound) const;
    void ShowFeedback(const FString& Message, const FColor& Color) const;
};
