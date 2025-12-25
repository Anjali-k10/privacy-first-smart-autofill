import { scanFormFields } from './formScanner.js';
import { isSensitiveField } from './fieldClassifier.js';
import {
	isFieldApproved,
	getApprovedFields
} from '../storage/storageManager.js';
import { findMatchingField } from '../../utils/textUtils.js';

const LOG_PREFIX = '[SmartAutofill:AutofillEngine]';
const CONSENT_LOG_PREFIX = '[SmartAutofill:Consent]';
const MATCHING_LOG_PREFIX = '[SmartAutofill:Matching]';

let matchedFields = [];

/* ---------- INIT & MATCHING ---------- */

async function initAutofillEngine() {
	matchedFields = [];

	const allFields = scanFormFields();
	const nonSensitiveFields = allFields.filter(
		field => !isSensitiveField(field)
	);

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
				`${MATCHING_LOG_PREFIX} Matched '${fieldKey}' → '${match.fieldKey}' (${match.confidence})`
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

	if (matchedFields.length > 0) {
		chrome.runtime.sendMessage({
			type: 'AUTOFILL_AVAILABLE',
			count: matchedFields.length
		});
	}
}

/* ---------- MANUAL AUTOFILL ---------- */

chrome.runtime.onMessage.addListener(async (message) => {
	if (message?.type !== 'TRIGGER_AUTOFILL') return;

	if (!matchedFields.length) {
		console.warn('[SmartAutofill] No fields to autofill');
		return;
	}

	console.log('[SmartAutofill] Manual autofill triggered');

	const approvedFields = await getApprovedFields();

	for (const { field, match } of matchedFields) {
		const selector =
			field.id
				? `#${CSS.escape(field.id)}`
				: field.name
				? `[name="${CSS.escape(field.name)}"]`
				: null;

		if (!selector) continue;

		const input = document.querySelector(selector);
		if (!input) continue;

		const savedValue = approvedFields?.[match.fieldKey]?.value;
		if (savedValue == null) continue;

		/* ---------- INPUT TYPE HANDLING ---------- */

		// SELECT (dropdown)
		if (input.tagName === 'SELECT') {
			input.value = savedValue;
			input.dispatchEvent(new Event('change', { bubbles: true }));
			continue;
		}

		// RADIO BUTTON
		if (input.type === 'radio' && input.name) {
			const radios = document.querySelectorAll(
				`input[type="radio"][name="${CSS.escape(input.name)}"]`
			);
			radios.forEach(radio => {
				radio.checked = radio.value === savedValue;
			});
			continue;
		}

		// CHECKBOX
		if (input.type === 'checkbox') {
			// Multiple checkboxes (same name)
			if (Array.isArray(savedValue) && input.name) {
				const checkboxes = document.querySelectorAll(
					`input[type="checkbox"][name="${CSS.escape(input.name)}"]`
				);
				checkboxes.forEach(cb => {
					cb.checked = savedValue.includes(cb.value);
				});
			} else {
				// Single checkbox
				input.checked = Boolean(savedValue);
			}
			continue;
		}

		// DEFAULT TEXT / NUMBER / EMAIL / ETC
		input.value = savedValue;
		input.dispatchEvent(new Event('input', { bubbles: true }));
	}

	// Prevent repeated autofill
	matchedFields = [];
});

export { initAutofillEngine };



