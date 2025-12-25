const STORAGE_KEY = 'approvedFields';
const LOG_PREFIX = '[SmartAutofill:Storage]';

/* ---------- SAVE FIELD (META + VALUE) ---------- */

export async function saveApprovedField(fieldKey, fieldMeta = {}, value = null) {
	if (!fieldKey || typeof fieldMeta !== 'object') {
		console.warn(`${LOG_PREFIX} Invalid arguments for saveApprovedField.`);
		return;
	}

	const fields = await getApprovedFields();

	fields[fieldKey] = {
		...fields[fieldKey],        // preserve existing data if any
		...fieldMeta,
		value: value ?? fields[fieldKey]?.value ?? null,
		updatedAt: Date.now()
	};

	await chrome.storage.local.set({ [STORAGE_KEY]: fields });
	console.log(`${LOG_PREFIX} Saved field '${fieldKey}'.`);
}

/* ---------- GET ALL FIELDS ---------- */

export async function getApprovedFields() {
	const result = await chrome.storage.local.get([STORAGE_KEY]);
	return result[STORAGE_KEY] || {};
}

/* ---------- GET FIELD VALUE ---------- */

export async function getFieldValue(fieldKey) {
	const fields = await getApprovedFields();
	return fields[fieldKey]?.value ?? null;
}

/* ---------- CHECK APPROVAL ---------- */

export async function isFieldApproved(fieldKey) {
	const fields = await getApprovedFields();
	return Object.prototype.hasOwnProperty.call(fields, fieldKey);
}

/* ---------- REMOVE FIELD ---------- */

export async function removeApprovedField(fieldKey) {
	const fields = await getApprovedFields();

	if (fields[fieldKey]) {
		delete fields[fieldKey];
		await chrome.storage.local.set({ [STORAGE_KEY]: fields });
		console.log(`${LOG_PREFIX} Removed field '${fieldKey}'.`);
	} else {
		console.log(`${LOG_PREFIX} Field '${fieldKey}' not found.`);
	}
}
