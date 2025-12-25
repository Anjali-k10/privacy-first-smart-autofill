import { scanFormFields } from './formScanner.js';
import { isSensitiveField } from './fieldClassifier.js';
import { isFieldApproved, getApprovedFields } from '../storage/storageManager.js';
import { findMatchingField } from '../../utils/textUtils.js';

const LOG_PREFIX = '[SmartAutofill:AutofillEngine]';
const CONSENT_LOG_PREFIX = '[SmartAutofill:Consent]';
const MATCHING_LOG_PREFIX = '[SmartAutofill:Matching]';

let matchedFields = [];

async function initAutofillEngine() {
	// reset on each run
	matchedFields = [];

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
			matchedFields.push({ field, match });
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

	// notify popup once
	if (matchedFields.length > 0) {
		chrome.runtime.sendMessage({
			type: 'AUTOFILL_AVAILABLE',
			count: matchedFields.length
		});
	}
}

/* ---------- MANUAL AUTOFILL ---------- */

chrome.runtime.onMessage.addListener((message) => {
	if (message?.type !== 'TRIGGER_AUTOFILL') return;

	if (!matchedFields.length) {
		console.warn('[SmartAutofill] No fields to autofill');
		return;
	}

	console.log('[SmartAutofill] Manual autofill triggered');

	for (const { field } of matchedFields) {
		const selector =
			field.id
				? `#${CSS.escape(field.id)}`
				: field.name
				? `[name="${CSS.escape(field.name)}"]`
				: null;

		if (!selector) continue;

		const input = document.querySelector(selector);
		if (!input) continue;

		// temporary placeholder (safe)
		input.value = 'Filled by Smart Autofill';
		input.dispatchEvent(new Event('input', { bubbles: true }));
	}

	// prevent repeated fills
	matchedFields = [];
});

export { initAutofillEngine };

