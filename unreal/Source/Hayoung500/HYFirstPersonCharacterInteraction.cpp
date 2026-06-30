#include "HYFirstPersonCharacter.h"

#include "Camera/CameraComponent.h"
#include "Components/InputComponent.h"
#include "HYDoorActor.h"
#include "HYInteractablePropActor.h"
#include "HYLockActor.h"

AHYLockActor* AHYFirstPersonCharacter::GetFocusedLock() const
{
    FHitResult Hit;
    return TraceInteractable(Hit) ? Cast<AHYLockActor>(Hit.GetActor()) : nullptr;
}

AHYInteractablePropActor* AHYFirstPersonCharacter::GetFocusedProp() const
{
    FHitResult Hit;
    return TraceInteractable(Hit) ? Cast<AHYInteractablePropActor>(Hit.GetActor()) : nullptr;
}

FString AHYFirstPersonCharacter::GetFocusedPrompt() const
{
    FHitResult Hit;
    if (!TraceInteractable(Hit))
    {
        return TEXT("Find a lock, keypad, safe, or door.");
    }

    if (const AHYLockActor* LockActor = Cast<AHYLockActor>(Hit.GetActor()))
    {
        return LockActor->GetPromptText();
    }

    if (const AHYDoorActor* DoorActor = Cast<AHYDoorActor>(Hit.GetActor()))
    {
        return DoorActor->GetPromptText();
    }

    if (const AHYInteractablePropActor* PropActor = Cast<AHYInteractablePropActor>(Hit.GetActor()))
    {
        return PropActor->GetPromptText();
    }

    return TEXT("Look closer.");
}

bool AHYFirstPersonCharacter::TraceInteractable(FHitResult& Hit) const
{
    if (!GetWorld())
    {
        return false;
    }

    const FVector Start = FirstPersonCamera->GetComponentLocation();
    const FVector End = Start + FirstPersonCamera->GetForwardVector() * InteractionDistance;
    FCollisionQueryParams Params(SCENE_QUERY_STAT(HYInteractTrace), false, this);
    return GetWorld()->LineTraceSingleByChannel(Hit, Start, End, ECC_Visibility, Params);
}

void AHYFirstPersonCharacter::BindPuzzleToken(UInputComponent* PlayerInputComponent, FName ActionName, const FString& Token)
{
    FInputActionBinding Binding(ActionName, IE_Pressed);
    Binding.ActionDelegate.GetDelegateForManualSet().BindLambda([this, Token]()
    {
        AppendPuzzleToken(Token);
    });
    PlayerInputComponent->AddActionBinding(Binding);
}

void AHYFirstPersonCharacter::AppendPuzzleToken(const FString& Token)
{
    if (AHYLockActor* LockActor = GetFocusedLock())
    {
        NotifyInteractionFeedback();
        LockActor->AppendInputToken(Token);
    }
}

void AHYFirstPersonCharacter::ClearPuzzleInput()
{
    if (AHYLockActor* LockActor = GetFocusedLock())
    {
        NotifyInteractionFeedback();
        LockActor->ClearPendingInput();
    }
}

void AHYFirstPersonCharacter::RemovePuzzleToken()
{
    if (AHYLockActor* LockActor = GetFocusedLock())
    {
        NotifyInteractionFeedback();
        LockActor->RemoveLastInputToken();
    }
}

void AHYFirstPersonCharacter::Interact()
{
    FHitResult Hit;
    if (!TraceInteractable(Hit))
    {
        return;
    }

    if (AHYLockActor* LockActor = Cast<AHYLockActor>(Hit.GetActor()))
    {
        NotifyInteractionFeedback();
        LockActor->Interact(this);
        return;
    }

    if (AHYDoorActor* DoorActor = Cast<AHYDoorActor>(Hit.GetActor()))
    {
        NotifyInteractionFeedback();
        DoorActor->TryOpenDoor(this);
        return;
    }

    if (AHYInteractablePropActor* PropActor = Cast<AHYInteractablePropActor>(Hit.GetActor()))
    {
        NotifyInteractionFeedback();
        PropActor->Interact(this);
    }
}
