const DEBUG_PREFIX = '[SmartAutofill:FormScanner]';

function getLabelText(field) {
	try {
		// Try <label for="id">
		if (field.id) {
			const label = document.querySelector(`label[for="${field.id}"]`);
			if (label && label.textContent) {
				return label.textContent.trim();
			}
		}

		// Try wrapping <label>
		let parent = field.parentElement;
		while (parent) {
			if (parent.tagName === 'LABEL') {
				return parent.textContent.trim();
			}
			parent = parent.parentElement;
		}
	} catch (error) {
		console.warn(`${DEBUG_PREFIX} Failed to resolve label`, error);
	}

	return '';
}

function getFieldMetadata(field) {
	try {
		return {
			tagName: field.tagName.toLowerCase(),
			type:
				field.tagName.toLowerCase() === 'input'
					? field.type || ''
					: '',
			name: field.name || '',
			id: field.id || '',
			placeholder: field.placeholder || '',
			label: getLabelText(field)
		};
	} catch (error) {
		console.error(`${DEBUG_PREFIX} Failed to extract field metadata`, error);
		return null;
	}
}

function scanFormFields() {
	try {
		const fields = Array.from(
			document.querySelectorAll('input, textarea, select')
		);

		return fields
			.map(getFieldMetadata)
			.filter(Boolean); // remove null entries safely
	} catch (error) {
		console.error(`${DEBUG_PREFIX} Form scanning failed`, error);
		return [];
	}
}

export { scanFormFields };
