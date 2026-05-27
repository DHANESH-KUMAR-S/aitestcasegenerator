// Tailwind Configuration
tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: '#5D5CDE',
                'primary-dark': '#4A49B0',
                'primary-light': '#7E7DE6',
            }
        }
    }
}

// Ensure marked renders GFM tables
marked.use({ gfm: true, breaks: true });

// Dark mode detection
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    document.documentElement.classList.toggle('dark', event.matches);
});

// Input type switching
const btnPlainText = document.getElementById('btn-plain-text');
const btnSrsUpload = document.getElementById('btn-srs-upload');
const plainTextInput = document.getElementById('plain-text-input');
const fileUploadInput = document.getElementById('file-upload-input');

btnPlainText.addEventListener('click', () => {
    btnPlainText.classList.add('tab-active', 'text-primary', 'bg-white', 'dark:bg-gray-700');
    btnPlainText.classList.remove('text-gray-500', 'dark:text-gray-400');
    btnSrsUpload.classList.remove('tab-active', 'text-primary', 'bg-white', 'dark:bg-gray-700');
    btnSrsUpload.classList.add('text-gray-500', 'dark:text-gray-400');
    plainTextInput.classList.remove('hidden');
    fileUploadInput.classList.add('hidden');
});

btnSrsUpload.addEventListener('click', () => {
    btnSrsUpload.classList.add('tab-active', 'text-primary', 'bg-white', 'dark:bg-gray-700');
    btnSrsUpload.classList.remove('text-gray-500', 'dark:text-gray-400');
    btnPlainText.classList.remove('tab-active', 'text-primary', 'bg-white', 'dark:bg-gray-700');
    btnPlainText.classList.add('text-gray-500', 'dark:text-gray-400');
    plainTextInput.classList.add('hidden');
    fileUploadInput.classList.remove('hidden');
});

// File upload handling
const srsFileInput = document.getElementById('srs-file');
const fileNameDisplay = document.getElementById('file-name');
const fileContentPreview = document.getElementById('file-content');

srsFileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) {
        fileNameDisplay.textContent = '';
        fileContentPreview.classList.add('hidden');
        return;
    }

    fileNameDisplay.textContent = `Selected file: ${file.name}`;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch('/upload', { method: 'POST', body: formData });
        const data = await res.json();

        if (data.error) {
            fileNameDisplay.textContent = `Error: ${data.error}`;
            return;
        }

        document.getElementById('requirements').value = data.content || '';

        if (data.content && !data.content.startsWith('[Content from')) {
            document.querySelector('#file-content > div').textContent =
                data.content.substring(0, 500) + (data.content.length > 500 ? '...' : '');
            fileContentPreview.classList.remove('hidden');
        } else {
            fileContentPreview.classList.add('hidden');
        }
    } catch (err) {
        fileNameDisplay.textContent = 'Upload failed. Please try again.';
    }
});

// Show/hide automation framework based on checkbox
const automationScriptsCheckbox = document.getElementById('automation-scripts');
const automationFrameworkSection = document.getElementById('automation-framework-section');
const manualTestsCheckbox = document.getElementById('manual-tests');
const generateBtn = document.getElementById('generate-btn');

automationScriptsCheckbox.addEventListener('change', () => {
    automationFrameworkSection.style.display = automationScriptsCheckbox.checked ? 'block' : 'none';
    updateGenerateButtonText();
});

manualTestsCheckbox.addEventListener('change', updateGenerateButtonText);

function updateGenerateButtonText() {
    const manual = manualTestsCheckbox.checked;
    const automation = automationScriptsCheckbox.checked;
    const span = generateBtn.querySelector('span') || generateBtn;

    let text = 'Generate Test Cases';
    if (manual && automation) text = 'Generate Manual Testcases & Automation Script';
    else if (manual) text = 'Generate Manual Testcases';
    else if (automation) text = 'Generate Automation Script';

    if (generateBtn.querySelector('span')) {
        generateBtn.querySelector('span').textContent = text;
    } else {
        generateBtn.textContent = text;
    }
}

document.addEventListener('DOMContentLoaded', updateGenerateButtonText);

// Tab switching in results
const tabManual = document.getElementById('tab-manual');
const tabAutomation = document.getElementById('tab-automation');
const manualContent = document.getElementById('manual-content');
const automationContent = document.getElementById('automation-content');

tabManual.addEventListener('click', () => {
    tabManual.classList.add('tab-active');
    tabManual.classList.remove('text-gray-500', 'dark:text-gray-400');
    tabAutomation.classList.remove('tab-active');
    tabAutomation.classList.add('text-gray-500', 'dark:text-gray-400');
    manualContent.classList.remove('hidden');
    automationContent.classList.add('hidden');
});

tabAutomation.addEventListener('click', () => {
    tabAutomation.classList.add('tab-active');
    tabAutomation.classList.remove('text-gray-500', 'dark:text-gray-400');
    tabManual.classList.remove('tab-active');
    tabManual.classList.add('text-gray-500', 'dark:text-gray-400');
    automationContent.classList.remove('hidden');
    manualContent.classList.add('hidden');
});

// Generate button
const resultsSection = document.getElementById('results-section');
const loadingSection = document.getElementById('loading');
const loadingText = document.getElementById('loading-text');
const automationFrameworkSelect = document.getElementById('automation-framework');

generateBtn.addEventListener('click', async () => {
    const requirements = document.getElementById('requirements').value.trim();

    if (!requirements) {
        alert('Please enter your project requirements or upload a document.');
        return;
    }

    if (!manualTestsCheckbox.checked && !automationScriptsCheckbox.checked) {
        alert('Please select at least one output type.');
        return;
    }

    // Show loading
    resultsSection.classList.remove('hidden');
    loadingSection.classList.remove('hidden');
    manualContent.innerHTML = '';
    automationContent.innerHTML = '';
    generateBtn.disabled = true;
    generateBtn.classList.add('opacity-50', 'cursor-not-allowed');
    loadingText.textContent = 'Generating test cases...';

    try {
        const res = await fetch('/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requirements,
                manual: manualTestsCheckbox.checked,
                automation: automationScriptsCheckbox.checked,
                framework: automationFrameworkSelect.value,
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Generation failed');
        }

        if (data.manual) {
            manualContent.innerHTML = marked.parse(data.manual);
        } else if (data.manual_error) {
            manualContent.innerHTML = `<p class="text-red-500">Error: ${data.manual_error}</p>`;
        } else {
            manualContent.innerHTML = '<p class="text-gray-500 dark:text-gray-400 italic">Manual test cases were not requested.</p>';
        }

        if (data.automation) {
            automationContent.innerHTML = marked.parse(data.automation);
        } else if (data.automation_error) {
            automationContent.innerHTML = `<p class="text-red-500">Error: ${data.automation_error}</p>`;
        } else {
            automationContent.innerHTML = '<p class="text-gray-500 dark:text-gray-400 italic">Automation scripts were not requested.</p>';
        }

        // Switch to whichever tab has content
        if (data.manual) {
            tabManual.click();
        } else if (data.automation) {
            tabAutomation.click();
        }

    } catch (err) {
        manualContent.innerHTML = `<p class="text-red-500">Error: ${err.message}</p>`;
    } finally {
        loadingSection.classList.add('hidden');
        generateBtn.disabled = false;
        generateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        updateGenerateButtonText();
    }
});
