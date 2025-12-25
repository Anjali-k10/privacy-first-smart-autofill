import { scanFormFields } from './formScanner.js';
import { isSensitiveField } from './fieldClassifier.js';
import { isFieldApproved, getApprovedFields } from '../storage/storageManager.js';
import { findMatchingField } from '../../utils/textUtils.js';

const LOG_PREFIX = '[SmartAutofill:AutofillEngine]';
const CONSENT_LOG_PREFIX = '[SmartAutofill:Consent]';
const MATCHING_LOG_PREFIX = '[SmartAutofill:Matching]';

async function initAutofillEngine() {
	const allFields = scanFormFields();
	const nonSensitiveFields = allFields.filter(field => !isSensitiveField(field));

	console.log(`${LOG_PREFIX} Non-sensitive fields found:`, nonSensitiveFields);

	const approvedFields = await getApprovedFields();

	for (const field of nonSensitiveFields) {
		const fieldKey = (field.name || field.id || field.label || '').toLowerCase();
		if (!fieldKey) continue;

		const approved = await isFieldApproved(fieldKey);
		if (approved) continue;

		const match = findMatchingField(field, approvedFields);
		if (match) {
			console.log(
				`${MATCHING_LOG_PREFIX} Matched '${fieldKey}' → '${match.fieldKey}' (confidence: ${match.confidence})`
			);
			continue;
		}

		console.log(`${CONSENT_LOG_PREFIX} Consent required for field '${fieldKey}'.`);
		chrome.runtime.sendMessage({
			type: 'FIELD_CONSENT_REQUIRED',
			payload: {
				fieldKey,
				label: field.label || '',
				type: field.type || ''
			}
		});
	}

	return nonSensitiveFields;
}

export { initAutofillEngine };
