const DEBUG_PREFIX = '[SmartAutofill:FieldClassifier]';

const SENSITIVE_KEYWORDS = [
	'password', 'passcode', 'pin',
	'otp', 'one-time', 'verification',
	'aadhaar', 'pan', 'ssn',
	'cvv', 'cvc', 'card', 'account', 'bank'
];

// Check if a string contains any sensitive keyword
function containsSensitiveKeyword(str) {
	if (!str) return false;
	const lower = str.toLowerCase();
	return SENSITIVE_KEYWORDS.some(keyword => lower.includes(keyword));
}

// Detect OTP-like fields (4–8 digit numeric identifiers)
function looksLikeOtpField(metadata) {
	const fields = [
		metadata.name,
		metadata.id,
		metadata.placeholder,
		metadata.label
	];

	const digitPattern = /^\d{4,8}$/;
	return fields.some(value => value && digitPattern.test(value.trim()));
}

// Main classifier
function isSensitiveField(metadata) {
	// Guard clause: safety first
	if (!metadata) return false;

	// Rule 1: Password input type
	if (metadata.type && metadata.type.toLowerCase() === 'password') {
		console.warn(`${DEBUG_PREFIX} Sensitive field detected`, metadata);
		return true;
	}

	// Rule 2: Sensitive keywords
	if (
		[metadata.name, metadata.id, metadata.placeholder, metadata.label]
			.some(containsSensitiveKeyword)
	) {
		console.warn(`${DEBUG_PREFIX} Sensitive field detected`, metadata);
		return true;
	}

	// Rule 3: OTP-like numeric pattern
	if (looksLikeOtpField(metadata)) {
		console.warn(`${DEBUG_PREFIX} Sensitive field detected`, metadata);
		return true;
	}

	return false;
}

export { isSensitiveField };
