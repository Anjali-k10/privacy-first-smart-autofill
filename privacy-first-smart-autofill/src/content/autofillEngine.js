import { scanFormFields } from './formScanner.js';
import { isSensitiveField } from './fieldClassifier.js';
import { isFieldApproved, saveApprovedField } from '../storage/storageManager.js';

const LOG_PREFIX = '[SmartAutofill:AutofillEngine]';
const CONSENT_LOG_PREFIX = '[SmartAutofill:Consent]';


async function initAutofillEngine() {
	const allFields = scanFormFields();
	const nonSensitiveFields = allFields.filter(field => !isSensitiveField(field));
	console.log(`${LOG_PREFIX} Non-sensitive fields found:`, nonSensitiveFields);

	for (const field of nonSensitiveFields) {
		const fieldKey = field.name || field.id || field.label || '';
		if (!fieldKey) continue;
		const approved = await isFieldApproved(fieldKey);
		if (!approved) {
			console.log(`${CONSENT_LOG_PREFIX} Consent required for field '${fieldKey}'.`);
			// No storing values, no autofill, no UI
		}
	}
	return nonSensitiveFields;
}

export { initAutofillEngine };
