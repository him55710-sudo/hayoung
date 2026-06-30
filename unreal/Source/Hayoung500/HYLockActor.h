#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "HYLockActor.generated.h"

class AHYDoorActor;
class AHYFirstPersonCharacter;
class USceneComponent;
class USoundBase;
class UStaticMeshComponent;

UENUM(BlueprintType)
enum class EHYLockKind : uint8
{
    Combination,
    Direction,
    Keypad,
    KeyedPadlock,
    Magnetic,
    ButtonSequence,
    Letter,
    SafeDial
};

UCLASS()
class HAYOUNG500_API AHYLockActor : public AActor
{
    GENERATED_BODY()

public:
    AHYLockActor();

    virtual void Tick(float DeltaSeconds) override;

    UFUNCTION(BlueprintCallable, Category = "Hayoung500|Lock")
    bool Interact(AHYFirstPersonCharacter* Player);

    UFUNCTION(BlueprintCallable, Category = "Hayoung500|Lock")
    void SetPendingInput(const FString& NewInput);

    UFUNCTION(BlueprintCallable, Category = "Hayoung500|Lock")
    void AppendInputToken(const FString& Token);

    UFUNCTION(BlueprintCallable, Category = "Hayoung500|Lock")
    void RemoveLastInputToken();

    UFUNCTION(BlueprintCallable, Category = "Hayoung500|Lock")
    void ClearPendingInput();

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Lock")
    FString GetPromptText() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Lock")
    bool IsSolved() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Motion")
    float GetUnlockAlpha() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Motion")
    float GetInputFeedbackAlpha() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Lock")
    bool HasRuntimeLockHardware() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Lock")
    bool HasRuntimeLockKindHardware() const;

    UFUNCTION(BlueprintCallable, Category = "Hayoung500|Lock")
    void RefreshRuntimeLockHardware();

    UFUNCTION(BlueprintCallable, Category = "Hayoung500|Simulation")
    void ResetLockForSimulation();

protected:
    virtual void BeginPlay() override;

private:
    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Lock")
    TObjectPtr<USceneComponent> LockRoot;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Lock")
    TObjectPtr<UStaticMeshComponent> LockMesh;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Lock")
    TObjectPtr<UStaticMeshComponent> DetailPlateMesh;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Lock")
    TObjectPtr<UStaticMeshComponent> MovingBoltMesh;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Lock")
    TObjectPtr<UStaticMeshComponent> IndicatorMesh;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Lock")
    TObjectPtr<UStaticMeshComponent> InputPadMesh;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Lock")
    TObjectPtr<UStaticMeshComponent> TactileWheelMesh;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Lock")
    TObjectPtr<UStaticMeshComponent> KeywayMesh;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Lock")
    TObjectPtr<UStaticMeshComponent> FeedbackLampMesh;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Lock")
    TObjectPtr<UStaticMeshComponent> CombinationWheelMesh;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Lock")
    TObjectPtr<UStaticMeshComponent> DirectionButtonMesh;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Lock")
    TObjectPtr<UStaticMeshComponent> KeypadGridMesh;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Lock")
    TObjectPtr<UStaticMeshComponent> KeyBladeMesh;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Lock")
    TObjectPtr<UStaticMeshComponent> MagneticPlateMesh;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Lock")
    TObjectPtr<UStaticMeshComponent> ColorButtonMesh;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Lock")
    TObjectPtr<UStaticMeshComponent> LetterDrumMesh;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Lock")
    TObjectPtr<UStaticMeshComponent> SafeDialMesh;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Lock")
    TObjectPtr<UStaticMeshComponent> ResetPegMesh;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Lock")
    EHYLockKind LockKind = EHYLockKind::Combination;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Lock")
    FString ExpectedInput;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Lock")
    FString PendingInput;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Lock")
    FString InteractionHint;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Lock")
    FName RequiredKeyId;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Lock")
    FName RewardKeyId;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Lock")
    TObjectPtr<AHYDoorActor> DoorToOpen;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Audio")
    TObjectPtr<USoundBase> SuccessSound;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Audio")
    TObjectPtr<USoundBase> FailSound;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Audio")
    TObjectPtr<USoundBase> InputSound;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Motion")
    float UnlockAnimationSpeed = 5.5f;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Motion")
    float InputFeedbackDecaySpeed = 12.0f;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Lock")
    bool bSolved = false;

    FVector ClosedMeshLocation;
    FRotator ClosedMeshRotation;
    FVector ClosedDetailPlateLocation;
    FRotator ClosedDetailPlateRotation;
    FVector ClosedBoltLocation;
    FRotator ClosedBoltRotation;
    FVector ClosedIndicatorLocation;
    FRotator ClosedIndicatorRotation;
    FVector ClosedInputPadLocation;
    FRotator ClosedInputPadRotation;
    FVector ClosedTactileWheelLocation;
    FRotator ClosedTactileWheelRotation;
    FVector ClosedKeywayLocation;
    FRotator ClosedKeywayRotation;
    FVector ClosedFeedbackLampLocation;
    FRotator ClosedFeedbackLampRotation;
    FVector ClosedFeedbackLampScale;
    FVector ClosedCombinationWheelLocation;
    FRotator ClosedCombinationWheelRotation;
    FVector ClosedDirectionButtonLocation;
    FRotator ClosedDirectionButtonRotation;
    FVector ClosedKeypadGridLocation;
    FRotator ClosedKeypadGridRotation;
    FVector ClosedKeyBladeLocation;
    FRotator ClosedKeyBladeRotation;
    FVector ClosedMagneticPlateLocation;
    FRotator ClosedMagneticPlateRotation;
    FVector ClosedColorButtonLocation;
    FRotator ClosedColorButtonRotation;
    FVector ClosedLetterDrumLocation;
    FRotator ClosedLetterDrumRotation;
    FVector ClosedSafeDialLocation;
    FRotator ClosedSafeDialRotation;
    FVector ClosedResetPegLocation;
    FRotator ClosedResetPegRotation;
    FVector SolvedMeshOffset;
    FRotator SolvedMeshRotation;
    FVector SolvedBoltOffset;
    FRotator SolvedBoltRotation;
    FVector SolvedIndicatorOffset;
    FRotator SolvedIndicatorRotation;
    FVector InputPlateOffset;
    FRotator InputPlateRotation;
    FVector InputIndicatorOffset;
    FRotator InputIndicatorRotation;
    float UnlockAlpha = 0.0f;
    float InputFeedbackAlpha = 0.0f;

    void ConfigureSolvedPose();
    void ConfigureInputFeedbackPose(const FString& Token);
    void CreateKindSpecificHardware();
    void CacheKindSpecificHardwarePose();
    void ApplyKindSpecificHardwareVisibility();
    void UpdateKindSpecificHardwareMotion();
    void TriggerInputFeedback(const FString& Token);
    void UpdateUnlockMotion(float DeltaSeconds);
    void UpdateInputFeedback(float DeltaSeconds);
    void ShowFeedback(const FString& Message, const FColor& Color) const;
    void PlayResultSound(USoundBase* Sound) const;
};
