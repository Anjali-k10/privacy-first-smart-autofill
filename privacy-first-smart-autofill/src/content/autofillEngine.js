import { scanFormFields } from './formScanner.js';
import { isSensitiveField } from './fieldClassifier.js';

const LOG_PREFIX = '[SmartAutofill:AutofillEngine]';

function initAutofillEngine() {
	const allFields = scanFormFields();
	const nonSensitiveFields = allFields.filter(field => !isSensitiveField(field));
	console.log(`${LOG_PREFIX} Non-sensitive fields found:`, nonSensitiveFields);
	return nonSensitiveFields;
}

export { initAutofillEngine };
