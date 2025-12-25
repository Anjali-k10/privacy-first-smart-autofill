const STORAGE_KEY = 'approvedFields';
const LOG_PREFIX = '[SmartAutofill:Storage]';

export async function saveApprovedField(fieldKey, fieldMeta) {
	if (!fieldKey || typeof fieldMeta !== 'object') {
		console.warn(`${LOG_PREFIX} Invalid arguments for saveApprovedField.`);
		return;
	}

	const fields = await getApprovedFields();

	fields[fieldKey] = {
		...fieldMeta,
		savedAt: Date.now()
	};

	await chrome.storage.local.set({ [STORAGE_KEY]: fields });
	console.log(`${LOG_PREFIX} Saved field '${fieldKey}'.`);
}

export async function getApprovedFields() {
	const result = await chrome.storage.local.get([STORAGE_KEY]);
	return result[STORAGE_KEY] || {};
}

export async function isFieldApproved(fieldKey) {
	const fields = await getApprovedFields();
	return Object.prototype.hasOwnProperty.call(fields, fieldKey);
}

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
