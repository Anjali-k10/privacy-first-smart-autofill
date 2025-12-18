const statusEl = document.getElementById('status');
const allowBtn = document.getElementById('allow-btn');
const denyBtn = document.getElementById('deny-btn');

let currentOrigin = '';

function setStatus(allowed) {
	if (allowed) {
		statusEl.textContent = 'Autofill enabled on this site';
		allowBtn.disabled = true;
		denyBtn.disabled = false;
	} else {
		statusEl.textContent = 'Autofill is disabled on this site';
		allowBtn.disabled = false;
		denyBtn.disabled = true;
	}
}

function updatePermissionUI(allowedSites) {
	const allowed = !!allowedSites[currentOrigin];
	setStatus(allowed);
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
			statusEl.textContent = 'Unable to detect site.';
			allowBtn.disabled = true;
			denyBtn.disabled = true;
			return;
		}
		currentOrigin = getOriginFromUrl(tab.url);
		chrome.storage.local.get(['allowedSites'], (result) => {
			const allowedSites = result.allowedSites || {};
			updatePermissionUI(allowedSites);
		});
	});
}

allowBtn.addEventListener('click', () => {
	chrome.storage.local.get(['allowedSites'], (result) => {
		const allowedSites = result.allowedSites || {};
		allowedSites[currentOrigin] = true;
		chrome.storage.local.set({ allowedSites }, () => {
			setStatus(true);
		});
	});
});

denyBtn.addEventListener('click', () => {
	chrome.storage.local.get(['allowedSites'], (result) => {
		const allowedSites = result.allowedSites || {};
		delete allowedSites[currentOrigin];
		chrome.storage.local.set({ allowedSites }, () => {
			setStatus(false);
		});
	});
});

document.addEventListener('DOMContentLoaded', loadPermissionState);
