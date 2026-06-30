#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "HYInteractablePropActor.generated.h"

class AHYFirstPersonCharacter;
class USoundBase;
class UStaticMeshComponent;

UCLASS()
class HAYOUNG500_API AHYInteractablePropActor : public AActor
{
    GENERATED_BODY()

public:
    AHYInteractablePropActor();

    virtual void Tick(float DeltaSeconds) override;

    UFUNCTION(BlueprintCallable, Category = "Hayoung500|Prop")
    bool Interact(AHYFirstPersonCharacter* Player);

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Prop")
    FString GetPromptText() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Prop")
    bool WasInteracted() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Prop")
    bool HasRuntimePropHardware() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|Motion")
    float GetMotionAlpha() const;

    UFUNCTION(BlueprintCallable, Category = "Hayoung500|Simulation")
    void ResetInteractionForSimulation();

protected:
    virtual void BeginPlay() override;

private:
    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Prop")
    TObjectPtr<UStaticMeshComponent> PropMesh;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Prop")
    TObjectPtr<UStaticMeshComponent> InteractionPlateMesh;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Prop")
    TObjectPtr<UStaticMeshComponent> FeedbackLampMesh;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Prop")
    TObjectPtr<UStaticMeshComponent> RewardGlowMesh;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Prop")
    FString InteractionPrompt;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Prop")
    FName RequiredKeyId;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Prop")
    FName RewardKeyId;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Audio")
    TObjectPtr<USoundBase> InteractionSound;

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Motion")
    FVector MotionOffset = FVector(0.0f, -22.0f, 0.0f);

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Motion")
    FRotator MotionRotation = FRotator(0.0f, 18.0f, 0.0f);

    UPROPERTY(EditAnywhere, Category = "Hayoung500|Motion")
    float MotionSpeed = 5.0f;

    UPROPERTY(VisibleAnywhere, Category = "Hayoung500|Prop")
    bool bInteracted = false;

    FVector ClosedMeshLocation;
    FRotator ClosedMeshRotation;
    FVector ClosedPlateLocation;
    FRotator ClosedPlateRotation;
    FVector ClosedLampLocation;
    FVector ClosedLampScale;
    FVector ClosedRewardLocation;
    FVector ClosedRewardScale;
    float MotionAlpha = 0.0f;

    void UpdateInteractionMotion(float DeltaSeconds);
    void ShowFeedback(const FString& Message, const FColor& Color) const;
    void PlayInteractionSound() const;
};
