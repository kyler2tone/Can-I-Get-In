export const passwordMinLength = 12;

export const passwordPolicyRequirements = [
  {
    id: "min_length",
    label: `At least ${passwordMinLength} characters`,
    test: (password: string) => password.length >= passwordMinLength,
  },
  {
    id: "uppercase",
    label: "At least one uppercase letter",
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    id: "lowercase",
    label: "At least one lowercase letter",
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    id: "number",
    label: "At least one number",
    test: (password: string) => /[0-9]/.test(password),
  },
  {
    id: "special",
    label: "At least one special character",
    test: (password: string) => /[^A-Za-z0-9]/.test(password),
  },
] as const;

export type PasswordRequirementId = (typeof passwordPolicyRequirements)[number]["id"];

export type PasswordRequirementResult = {
  id: PasswordRequirementId;
  label: string;
  met: boolean;
};

export type PasswordValidationResult = {
  valid: boolean;
  requirements: PasswordRequirementResult[];
  confirmationMatches: boolean;
  errors: string[];
};

export const passwordConfirmationMessage = "Passwords do not match.";

export function validatePasswordPolicy(
  password: string,
  confirmation?: string,
): PasswordValidationResult {
  const requirements = passwordPolicyRequirements.map((requirement) => ({
    id: requirement.id,
    label: requirement.label,
    met: requirement.test(password),
  }));
  const confirmationMatches = confirmation === undefined || password === confirmation;
  const errors = [
    ...requirements
      .filter((requirement) => !requirement.met)
      .map((requirement) => requirement.label),
    ...(confirmationMatches ? [] : [passwordConfirmationMessage]),
  ];

  return {
    valid: errors.length === 0,
    requirements,
    confirmationMatches,
    errors,
  };
}

export function getPasswordPolicyMessage(password: string, confirmation?: string) {
  const result = validatePasswordPolicy(password, confirmation);
  return result.errors[0] ?? "";
}

