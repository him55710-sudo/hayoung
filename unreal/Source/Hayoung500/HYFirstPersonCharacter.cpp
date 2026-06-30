#include "HYFirstPersonCharacter.h"
#include "Camera/CameraComponent.h"
#include "Components/CapsuleComponent.h"
#include "Components/InputComponent.h"
#include "HYFirstPersonBodyComponent.h"
#include "HYFootstepAudioComponent.h"

AHYFirstPersonCharacter::AHYFirstPersonCharacter()
{
    PrimaryActorTick.bCanEverTick = true;
    bUseControllerRotationYaw = true;

    FirstPersonCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("FirstPersonCamera"));
    FirstPersonCamera->SetupAttachment(GetCapsuleComponent());
    FirstPersonCamera->SetRelativeLocation(FVector(0.0f, 0.0f, 64.0f));
    FirstPersonCamera->bUsePawnControlRotation = true;

    FootstepAudio = CreateDefaultSubobject<UHYFootstepAudioComponent>(TEXT("FootstepAudio"));

    FirstPersonBody = CreateDefaultSubobject<UHYFirstPersonBodyComponent>(TEXT("FirstPersonBody"));
    FirstPersonBody->SetupAttachment(FirstPersonCamera);
}

void AHYFirstPersonCharacter::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
    FHitResult Hit;
    if (FirstPersonBody)
    {
        FirstPersonBody->SetFocusActive(TraceInteractable(Hit));
    }
}

void AHYFirstPersonCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
    Super::SetupPlayerInputComponent(PlayerInputComponent);

    PlayerInputComponent->BindAxis(TEXT("MoveForward"), this, &AHYFirstPersonCharacter::MoveForward);
    PlayerInputComponent->BindAxis(TEXT("MoveRight"), this, &AHYFirstPersonCharacter::MoveRight);
    PlayerInputComponent->BindAxis(TEXT("Turn"), this, &AHYFirstPersonCharacter::Turn);
    PlayerInputComponent->BindAxis(TEXT("LookUp"), this, &AHYFirstPersonCharacter::LookUp);
    PlayerInputComponent->BindAction(TEXT("Interact"), IE_Pressed, this, &AHYFirstPersonCharacter::Interact);
    PlayerInputComponent->BindAction(TEXT("SubmitPuzzleInput"), IE_Pressed, this, &AHYFirstPersonCharacter::Interact);
    PlayerInputComponent->BindAction(TEXT("ClearPuzzleInput"), IE_Pressed, this, &AHYFirstPersonCharacter::ClearPuzzleInput);
    PlayerInputComponent->BindAction(TEXT("RemovePuzzleToken"), IE_Pressed, this, &AHYFirstPersonCharacter::RemovePuzzleToken);

    for (int32 Digit = 0; Digit <= 9; ++Digit)
    {
        BindPuzzleToken(PlayerInputComponent, FName(*FString::Printf(TEXT("PuzzleDigit%d"), Digit)), FString::FromInt(Digit));
    }

    BindPuzzleToken(PlayerInputComponent, TEXT("PuzzleUp"), TEXT("U"));
    BindPuzzleToken(PlayerInputComponent, TEXT("PuzzleDown"), TEXT("D"));
    BindPuzzleToken(PlayerInputComponent, TEXT("PuzzleLeft"), TEXT("L"));
    BindPuzzleToken(PlayerInputComponent, TEXT("PuzzleRight"), TEXT("R"));

    for (TCHAR Letter = TEXT('A'); Letter <= TEXT('Z'); ++Letter)
    {
        const FString Token(1, &Letter);
        BindPuzzleToken(PlayerInputComponent, FName(*FString::Printf(TEXT("PuzzleLetter%s"), *Token)), Token);
    }
}

void AHYFirstPersonCharacter::MoveForward(float Value)
{
    if (Controller && FMath::Abs(Value) > KINDA_SMALL_NUMBER)
    {
        AddMovementInput(GetActorForwardVector(), Value);
    }
}

void AHYFirstPersonCharacter::MoveRight(float Value)
{
    if (Controller && FMath::Abs(Value) > KINDA_SMALL_NUMBER)
    {
        AddMovementInput(GetActorRightVector(), Value);
    }
}

void AHYFirstPersonCharacter::Turn(float Value)
{
    AddControllerYawInput(Value);
}

void AHYFirstPersonCharacter::LookUp(float Value)
{
    AddControllerPitchInput(Value);
}
