#pragma once

#include "CoreMinimal.h"
#include "Components/SceneComponent.h"
#include "HYFirstPersonBodyComponent.generated.h"

class UStaticMeshComponent;

UCLASS(ClassGroup=(Hayoung500), meta=(BlueprintSpawnableComponent))
class HAYOUNG500_API UHYFirstPersonBodyComponent : public USceneComponent
{
    GENERATED_BODY()

public:
    UHYFirstPersonBodyComponent();

    void SetFocusActive(bool bNewFocusActive);
    void TriggerInteractionFeedback();

    UFUNCTION(BlueprintPure, Category = "Hayoung500|FirstPerson")
    bool HasRuntimeFirstPersonBody() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|FirstPerson")
    bool HasRuntimeInteractionRig() const;

    UFUNCTION(BlueprintPure, Category = "Hayoung500|FirstPerson")
    float GetInteractionHandAlpha() const;

protected:
    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

private:
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Hayoung500|FirstPerson", meta = (AllowPrivateAccess = "true"))
    TObjectPtr<UStaticMeshComponent> LeftHandMesh;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Hayoung500|FirstPerson", meta = (AllowPrivateAccess = "true"))
    TObjectPtr<UStaticMeshComponent> RightHandMesh;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Hayoung500|FirstPerson", meta = (AllowPrivateAccess = "true"))
    TObjectPtr<UStaticMeshComponent> LeftForearmMesh;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Hayoung500|FirstPerson", meta = (AllowPrivateAccess = "true"))
    TObjectPtr<UStaticMeshComponent> RightForearmMesh;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Hayoung500|FirstPerson", meta = (AllowPrivateAccess = "true"))
    TObjectPtr<UStaticMeshComponent> ChestShadowMesh;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Hayoung500|FirstPerson", meta = (AllowPrivateAccess = "true"))
    TObjectPtr<UStaticMeshComponent> InteractionReachMesh;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Hayoung500|FirstPerson", meta = (AllowPrivateAccess = "true"))
    TObjectPtr<UStaticMeshComponent> FocusGlowMesh;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Hayoung500|FirstPerson", meta = (AllowPrivateAccess = "true"))
    TObjectPtr<UStaticMeshComponent> ReticleMesh;

    bool bFocusActive = false;
    float InteractionHandAlpha = 0.0f;
    float InteractionFeedbackSeconds = 0.0f;
    float MovementBobSeconds = 0.0f;

    void UpdateBodyPose(float DeltaTime);
};
