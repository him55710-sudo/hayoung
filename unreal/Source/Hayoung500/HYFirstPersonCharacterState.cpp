#include "HYFirstPersonCharacter.h"

#include "HYFirstPersonBodyComponent.h"
#include "HYFootstepAudioComponent.h"

void AHYFirstPersonCharacter::AddKey(FName KeyId)
{
    if (KeyId != NAME_None)
    {
        InventoryKeys.Add(KeyId);
    }
}

bool AHYFirstPersonCharacter::HasKey(FName KeyId) const
{
    return KeyId == NAME_None || InventoryKeys.Contains(KeyId);
}

int32 AHYFirstPersonCharacter::GetInventoryKeyCount() const
{
    return InventoryKeys.Num();
}

int32 AHYFirstPersonCharacter::GetEscapeStepIndex() const
{
    return FMath::Clamp(InventoryKeys.Num(), 0, GetEscapeStepCount());
}

int32 AHYFirstPersonCharacter::GetEscapeStepCount() const
{
    return 20;
}

int32 AHYFirstPersonCharacter::GetCurrentRoomNumber() const
{
    return FMath::Clamp((GetEscapeStepIndex() / 4) + 1, 1, 5);
}

FString AHYFirstPersonCharacter::GetCurrentGoalText() const
{
    if (GetEscapeStepIndex() >= GetEscapeStepCount())
    {
        return TEXT("Final door is open. Reach the 500-day ending.");
    }

    switch (GetEscapeStepIndex() % 4)
    {
    case 0:
        return TEXT("Search the room for the first hidden clue prop.");
    case 1:
        return TEXT("Use the clue on the first lock and listen for feedback.");
    case 2:
        return TEXT("Search the deeper prop unlocked by the first lock.");
    default:
        return TEXT("Solve the final lock, then open the room door.");
    }
}

bool AHYFirstPersonCharacter::HasRuntimeFootstepAudio() const
{
    return FootstepAudio && FootstepAudio->HasFootstepAudio();
}

float AHYFirstPersonCharacter::GetRuntimeFootstepInterval() const
{
    return FootstepAudio ? FootstepAudio->GetStepInterval() : 0.0f;
}

FString AHYFirstPersonCharacter::GetRuntimeFootstepSurface() const
{
    return FootstepAudio ? FootstepAudio->GetCurrentSurfaceName() : TEXT("none");
}

bool AHYFirstPersonCharacter::HasRuntimeFirstPersonBody() const
{
    return FirstPersonBody && FirstPersonBody->HasRuntimeFirstPersonBody();
}

bool AHYFirstPersonCharacter::HasRuntimeInteractionRig() const
{
    return FirstPersonBody && FirstPersonBody->HasRuntimeInteractionRig();
}

float AHYFirstPersonCharacter::GetInteractionHandAlpha() const
{
    return FirstPersonBody ? FirstPersonBody->GetInteractionHandAlpha() : 0.0f;
}

void AHYFirstPersonCharacter::NotifyInteractionFeedback()
{
    if (FirstPersonBody)
    {
        FirstPersonBody->TriggerInteractionFeedback();
    }
}
