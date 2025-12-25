import { saveApprovedField } from '../storage/storageManager.js';

const statusEl = document.getElementById('status');
const allowBtn = document.getElementById('allow-btn');
const denyBtn = document.getElementById('deny-btn');

let currentOrigin = '';
let pendingField = null;

function setStatus(text) {
	statusEl.textContent = text;
}

function getOriginFromUrl(url) {
	try {
		return new URL(url).origin;
	} catch {
		return '';
	}
}

function loadPermissionState() {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		const tab = tabs[0];
		if (!tab || !tab.url) {
			setStatus('Unable to detect site.');
			return;
		}

		currentOrigin = getOriginFromUrl(tab.url);

		chrome.storage.local.get(['allowedSites'], (result) => {
			const allowedSites = result.allowedSites || {};
			if (allowedSites[currentOrigin]) {
				setStatus('Autofill enabled on this site');
			} else {
				setStatus('Autofill disabled on this site');
			}
		});
	});
}

allowBtn.addEventListener('click', async () => {
	if (pendingField) {
		const { fieldKey, label, type } = pendingField;
		await saveApprovedField(fieldKey, { label, type });
		setStatus(`Field saved: ${label || fieldKey}`);
		pendingField = null;
		return;
	}
});

denyBtn.addEventListener('click', () => {
	if (pendingField) {
		setStatus('Field ignored');
		pendingField = null;
		return;
	}
});

chrome.runtime.onMessage.addListener((message) => {
	if (message?.type === 'FIELD_CONSENT_REQUIRED') {
		pendingField = message.payload;
		setStatus(`Remember this field? ${pendingField.label || pendingField.fieldKey}`);
	}
});

document.addEventListener('DOMContentLoaded', loadPermissionState);

