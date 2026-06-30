#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "HYFirstPersonCharacter.generated.h"

class UCameraComponent;
class UHYFootstepAudioComponent;
class UHYFirstPersonBodyComponent;
class AHYLockActor;
class AHYInteractablePropActor;

UCLASS()
class HAYOUNG500_API AHYFirstPersonCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    AHYFirstPersonCharacter();

    UFUNCTION(BlueprintCallable, Category = "Hayoung500|Inventory")
    void AddKey(FName KeyId);

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Inventory")
    bool HasKey(FName KeyId) const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Interaction")
    AHYLockActor* GetFocusedLock() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Interaction")
    AHYInteractablePropActor* GetFocusedProp() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Interaction")
    FString GetFocusedPrompt() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Inventory")
    int32 GetInventoryKeyCount() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Progress")
    int32 GetEscapeStepIndex() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Progress")
    int32 GetEscapeStepCount() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Progress")
    int32 GetCurrentRoomNumber() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Progress")
    FString GetCurrentGoalText() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Audio")
    bool HasRuntimeFootstepAudio() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Audio")
    float GetRuntimeFootstepInterval() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Audio")
    FString GetRuntimeFootstepSurface() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|FirstPerson")
    bool HasRuntimeFirstPersonBody() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|FirstPerson")
    bool HasRuntimeInteractionRig() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|FirstPerson")
    float GetInteractionHandAlpha() const;

    UFUNCTION(BlueprintCallable, Category = "Hayoung500|FirstPerson")
    void NotifyInteractionFeedback();

protected:
    virtual void Tick(float DeltaSeconds) override;
    virtual void SetupPlayerInputComponent(UInputComponent* PlayerInputComponent) override;

private:
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Hayoung500|Camera", meta = (AllowPrivateAccess = "true"))
    TObjectPtr<UCameraComponent> FirstPersonCamera;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Hayoung500|Audio", meta = (AllowPrivateAccess = "true"))
    TObjectPtr<UHYFootstepAudioComponent> FootstepAudio;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Hayoung500|FirstPerson", meta = (AllowPrivateAccess = "true"))
    TObjectPtr<UHYFirstPersonBodyComponent> FirstPersonBody;

    UPROPERTY(EditDefaultsOnly, Category = "Hayoung500|Interaction")
    float InteractionDistance = 340.0f;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Inventory")
    TSet<FName> InventoryKeys;

    bool TraceInteractable(FHitResult& Hit) const;
    void BindPuzzleToken(UInputComponent* PlayerInputComponent, FName ActionName, const FString& Token);
    void AppendPuzzleToken(const FString& Token);
    void ClearPuzzleInput();
    void RemovePuzzleToken();
    void MoveForward(float Value);
    void MoveRight(float Value);
    void Turn(float Value);
    void LookUp(float Value);
    void Interact();
};
