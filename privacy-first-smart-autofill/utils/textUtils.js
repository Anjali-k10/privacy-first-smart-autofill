const SYNONYM_MAP = {
	college: 'university',
	university: 'college',
	phone: 'mobile',
	mobile: 'phone',
	zipcode: 'postalcode',
	postalcode: 'zipcode',
};

function normalize(str) {
	return (str || '')
		.toLowerCase()
		.replace(/[ _-]/g, '');
}

function getFieldStrings(field) {
	return [field.label, field.name, field.id]
		.filter(Boolean)
		.map(normalize);
}

function areSynonyms(a, b) {
	return SYNONYM_MAP[a] === b || SYNONYM_MAP[b] === a;
}

export function findMatchingField(currentField, approvedFields) {
	if (!currentField || !approvedFields) return null;

	const currentStrings = getFieldStrings(currentField);

	for (const [fieldKey, meta] of Object.entries(approvedFields)) {
		const approvedStrings = getFieldStrings(meta);

		for (const c of currentStrings) {
			for (const a of approvedStrings) {
				if (c === a) {
					return { fieldKey, confidence: 'high' };
				}
			}
		}
	}

	for (const [fieldKey, meta] of Object.entries(approvedFields)) {
		const approvedStrings = getFieldStrings(meta);

		for (const c of currentStrings) {
			for (const a of approvedStrings) {
				if (c.includes(a) || a.includes(c) || areSynonyms(c, a)) {
					return { fieldKey, confidence: 'medium' };
				}
			}
		}
	}

	return null;
}

