(function() {
	const origin = window.location.origin;
	chrome.runtime.sendMessage({ type: 'CHECK_SITE_PERMISSION', origin }, (response) => {
		if (!response || response.allowed !== true) {
			return;
		}
		initContentFeatures();
	});

	function initContentFeatures() {
		// Placeholder for future content logic
	}
})();
