import { saveApprovedField } from '../storage/storageManager.js';

/* ---------- DOM ELEMENTS ---------- */

const titleEl = document.getElementById('popup-title');
const subtitleEl = document.getElementById('popup-subtitle');
const statusEl = document.getElementById('status');

const allowBtn = document.getElementById('allow-btn');
const denyBtn = document.getElementById('deny-btn');
const autofillBtn = document.getElementById('autofill-btn');
const saveFormBtn = document.getElementById('save-form-btn');

let currentOrigin = '';
let pendingField = null;
let autofillCount = 0; // ✅ NEW

/* ---------- COPY STATES ---------- */

function showPrimaryPermission() {
	titleEl.textContent = 'Enable Smart Autofill on this site?';
	subtitleEl.textContent = 'Faster form filling — always under your control.';
	allowBtn.textContent = 'Enable';
	denyBtn.textContent = 'Not now';
	autofillBtn.hidden = true;
	autofillBtn.disabled = false;
	autofillBtn.textContent = 'Autofill now';
}

function showSecondaryPrompt() {
	titleEl.textContent = 'Let Smart Autofill help you here?';
	subtitleEl.textContent = 'We’ll assist with forms when you want.';
	allowBtn.textContent = 'Allow';
	denyBtn.textContent = 'Skip';
}

/* ---------- STATUS ---------- */

function setStatus(text = '') {
	statusEl.textContent = text;
}

/* ---------- HELPERS ---------- */

function getOriginFromUrl(url) {
	try {
		return new URL(url).origin;
	} catch {
		return '';
	}
}

/* ---------- INITIAL LOAD ---------- */

function loadPermissionState() {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		const tab = tabs[0];
		if (!tab || !tab.url) return;

		currentOrigin = getOriginFromUrl(tab.url);

		chrome.storage.local.get(['allowedSites'], (result) => {
			const allowedSites = result.allowedSites || {};

			if (allowedSites[currentOrigin]) {
				showSecondaryPrompt();
			} else {
				showPrimaryPermission();
			}
		});
	});
}

/* ---------- BUTTON ACTIONS ---------- */

allowBtn.addEventListener('click', async () => {
	// Field-level save (fallback)
	if (pendingField) {
		const { fieldKey, label, type } = pendingField;
		await saveApprovedField(fieldKey, { label, type });
		setStatus(`Saved: ${label || fieldKey}`);
		pendingField = null;
		return;
	}

	// Site-level enable
	chrome.storage.local.get(['allowedSites'], (result) => {
		const allowedSites = result.allowedSites || {};
		allowedSites[currentOrigin] = true;
		chrome.storage.local.set({ allowedSites }, () => {
			showSecondaryPrompt();
			setStatus('Smart Autofill enabled on this site');
		});
	});
});

denyBtn.addEventListener('click', () => {
	if (pendingField) {
		pendingField = null;
		setStatus('Skipped');
		return;
	}
	setStatus('Smart Autofill not enabled');
});

/* ---------- AUTOFILL BUTTON ---------- */

autofillBtn.addEventListener('click', () => {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		const tabId = tabs[0]?.id;
		if (!tabId) return;

		chrome.tabs.sendMessage(tabId, {
			type: 'TRIGGER_AUTOFILL'
		});

		autofillBtn.disabled = true;                // ✅ disable after use
		autofillBtn.textContent = 'Autofill complete';
		setStatus(`Filled ${autofillCount} fields`);
	});
});

/* ---------- FORM-LEVEL SAVE ---------- */

saveFormBtn.addEventListener('click', () => {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		const tabId = tabs[0]?.id;
		if (!tabId) return;

		chrome.tabs.sendMessage(tabId, {
			type: 'SAVE_FORM_DATA'
		});

		setStatus('Saving form data...');
	});
});

/* ---------- MESSAGE LISTENER ---------- */

chrome.runtime.onMessage.addListener((message) => {
	if (message?.type === 'AUTOFILL_AVAILABLE') {
		autofillCount = message.count || 0;          // ✅ store count
		autofillBtn.hidden = false;
		autofillBtn.disabled = false;
		autofillBtn.textContent = 'Autofill now';
		setStatus(`Autofill available (${autofillCount} fields)`);
	}

	if (message?.type === 'FIELD_CONSENT_REQUIRED') {
		pendingField = message.payload;
		showSecondaryPrompt();
		setStatus('Remember this field?');
	}

	if (message?.type === 'FORM_DATA_SAVED') {
		setStatus('Form data saved successfully');
	}
});

/* ---------- INIT ---------- */

document.addEventListener('DOMContentLoaded', loadPermissionState);

