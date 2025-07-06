import { defaultPhrases } from './phrases.js';

document.addEventListener("DOMContentLoaded", () => {
    // --- DOM ELEMENTS ---
    const ui = {
        themeToggle: document.getElementById("themeToggle"),
        body: document.body,
        tabs: document.querySelectorAll(".tab-link"),
        tabPanes: document.querySelectorAll(".tab-pane"),
        
        // Main Tab
        adBlockToggle: document.getElementById("adBlockToggle"),
        adActionSelect: document.getElementById("adActionSelect"),
        reelsToggle: document.getElementById("reelsToggle"),
        suggestToggle: document.getElementById("suggestToggle"),
        storyToggle: document.getElementById("storyToggle"),
        newFeedsToggle: document.getElementById("newFeedsToggle"),
        adCount: document.getElementById("removedAdCountDisplay"),
        spamCount: document.getElementById("removedSpamCountDisplay"),

        // Filters Tab
        commentFilterToggle: document.getElementById("commentFilterToggle"),
        commentFilters: document.getElementById("commentFilters"),
        phraseFiltersContainer: document.getElementById("phraseFiltersContainer"),
        savePhraseFilters: document.getElementById("savePhraseFilters"),
        saveStatus: document.getElementById("saveStatus"),

        // Appearance Tab
        compactUISelect: document.getElementById("compactUISelect"),
        languageSelect: document.getElementById("languageSelect"),

        // Footer & Donation
        donateLink: document.getElementById("donateLink"),
        qrContainer: document.getElementById("qrScanContainer"),
    };

    let currentTabId = null;
    let translations = {};

    // --- INITIALIZATION ---
    const init = async () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) currentTabId = tabs[0].id;
        });
        
        const settings = await loadAllSettings();
        await applyLanguage(settings.language || 'vi');
        
        loadTheme(settings.theme);
        createPhraseFilters(settings.userPhrases || defaultPhrases);
        populateSettings(settings);
        addEventListeners();
    };

    // --- LANGUAGE & TRANSLATION ---
    const applyLanguage = async (lang) => {
        const langFile = `lang/${lang}.json`;
        try {
            const response = await fetch(chrome.runtime.getURL(langFile));
            translations = await response.json();
            
            document.querySelectorAll('[data-i18n-key]').forEach(el => {
                const key = el.dataset.i18nKey;
                if (translations[key]) {
                    el.textContent = translations[key];
                }
            });

            document.querySelectorAll('[data-i18n-title-key]').forEach(el => {
                const key = el.dataset.i18nTitleKey;
                if (translations[key]) {
                    el.title = translations[key];
                }
            });
            
            document.querySelectorAll('[data-i18n-placeholder-key]').forEach(el => {
                const key = el.dataset.i18nPlaceholderKey;
                if (translations[key]) {
                    el.placeholder = translations[key];
                }
            });

            // Update phrase filter placeholders dynamically
            const phrasePlaceholders = translations['filters_phraseFilterInputPlaceholder'];
            if(phrasePlaceholders) {
                 document.querySelectorAll('#phraseFiltersContainer textarea').forEach(area => {
                    area.placeholder = phrasePlaceholders;
                });
            }

        } catch (error) {
            console.error(`Could not load language file: ${langFile}`, error);
        }
    };

    const handleLanguageChange = async (e) => {
        const newLang = e.target.value;
        await applyLanguage(newLang);
        handleSettingChange('language', newLang);
    };


    // --- THEME ---
    const applyTheme = (theme) => {
        ui.body.dataset.theme = theme;
        const toggleTitleKey = theme === "dark" ? "themeToggleTitle_toLight" : "themeToggleTitle_toDark";
        ui.themeToggle.title = translations[toggleTitleKey] || "Toggle theme";
    };

    const toggleTheme = () => {
        const newTheme = ui.body.dataset.theme === "dark" ? "light" : "dark";
        applyTheme(newTheme);
        chrome.storage.local.set({ theme: newTheme });
    };

    const loadTheme = (theme) => {
        applyTheme(theme || "dark");
    };

    // --- TAB NAVIGATION ---
    const setupTabs = () => {
        ui.tabs.forEach(tab => {
            tab.addEventListener("click", () => {
                const targetPaneId = tab.dataset.tab;
                
                ui.tabs.forEach(t => t.classList.remove("active"));
                tab.classList.add("active");

                ui.tabPanes.forEach(pane => {
                    pane.classList.toggle("active", pane.id === targetPaneId);
                });
            });
        });
    };

    // --- EVENT LISTENERS ---
    const addEventListeners = () => {
        setupTabs();
        ui.themeToggle?.addEventListener("click", toggleTheme);
        ui.languageSelect?.addEventListener("change", handleLanguageChange);

        // Main Tab Toggles
        const mainToggles = {
            adBlockEnabled: ui.adBlockToggle,
            reelsEnabled: ui.reelsToggle,
            suggestEnabled: ui.suggestToggle,
            storyEnabled: ui.storyToggle,
            newFeedsEnabled: ui.newFeedsToggle,
        };
        for (const [key, el] of Object.entries(mainToggles)) {
            el?.addEventListener("change", (e) => handleSettingChange(key, e.target.checked, { action: `toggle${key.charAt(0).toUpperCase() + key.slice(1)}`, enabled: e.target.checked }));
        }
        ui.adActionSelect?.addEventListener("change", (e) => handleSettingChange("adAction", e.target.value, { action: "setAdAction", value: e.target.value }));

        // Filters Tab
        ui.commentFilterToggle?.addEventListener("change", handleCommentFilterChange);
        ui.commentFilters?.addEventListener("blur", handleCommentFilterChange);
        ui.savePhraseFilters?.addEventListener("click", savePhraseFilters);

        // Appearance Tab
        ui.compactUISelect?.addEventListener("change", (e) => handleSettingChange("compactUIValue", e.target.value, { action: "setCompactUI", value: e.target.value }));
        
        // Donation
        setupDonationLink();
    };

    const setupDonationLink = () => {
        const qrDiv = document.querySelector('.qr-code-container > div');
        ui.donateLink?.addEventListener("click", (e) => {
            e.stopPropagation();
            ui.qrContainer.style.display = 'flex';
        });
        ui.qrContainer?.addEventListener("click", (e) => {
            if (e.target !== qrDiv && !qrDiv.contains(e.target)) {
                ui.qrContainer.style.display = "none";
            }
        });
    };

    // --- PHRASE FILTERS ---
    const createPhraseFilters = (userPhrases) => {
        ui.phraseFiltersContainer.innerHTML = ''; // Clear existing
        for (const key in defaultPhrases) {
            const labelText = ` "${key.charAt(0).toUpperCase() + key.slice(1)}"`; // Fallback label
            
            const group = document.createElement('div');
            group.className = 'textarea-group';

            const label = document.createElement('label');
            label.htmlFor = `filter-input-${key}`;
            label.textContent = labelText;
            label.dataset.i18nKey = `filters_phrase_${key}`; // Key for translation

            const textarea = document.createElement('textarea');
            textarea.id = `filter-input-${key}`;
            textarea.dataset.filterKey = key;
            textarea.rows = 2;
            textarea.value = (userPhrases[key] || defaultPhrases[key]).join(', ');

            group.appendChild(label);
            group.appendChild(textarea);
            ui.phraseFiltersContainer.appendChild(group);
        }
    };

    const savePhraseFilters = () => {
        const newPhrases = {};
        for (const key in defaultPhrases) {
            const textarea = document.getElementById(`filter-input-${key}`);
            if (textarea) {
                newPhrases[key] = textarea.value.split(',').map(p => p.trim()).filter(Boolean);
            }
        }

        chrome.storage.sync.set({ userPhrases: newPhrases }, () => {
            sendMessage({ action: 'updatePhraseFilters', phrases: newPhrases });
            showSaveStatus();
        });
    };
    
    const showSaveStatus = () => {
        ui.saveStatus.textContent = translations['filters_saveStatus'] || "Saved!";
        ui.saveStatus.style.opacity = 1;
        setTimeout(() => {
            ui.saveStatus.style.opacity = 0;
        }, 2000);
    };

    // --- SETTINGS & DATA HANDLING ---
    const loadAllSettings = () => {
        return new Promise(resolve => {
            chrome.storage.sync.get(null, (data) => {
                chrome.storage.local.get(["theme", "removedAdCount", "removedSpamCount"], (localData) => {
                    const settings = { ...data, ...localData };
                    resolve(settings);
                });
            });
        });
    };
    
    const populateSettings = (settings) => {
        // Main Tab
        ui.adBlockToggle.checked = settings.adBlockEnabled !== false;
        ui.reelsToggle.checked = settings.reelsEnabled === true;
        ui.suggestToggle.checked = settings.suggestEnabled === true;
        ui.storyToggle.checked = settings.storyEnabled === true;
        ui.newFeedsToggle.checked = settings.newFeedsEnabled === true;
        ui.adActionSelect.value = settings.adAction || "remove";

        // Filters Tab
        ui.commentFilterToggle.checked = settings.commentFilterEnabled === true;
        ui.commentFilters.value = settings.commentFilters || 'vay, 88uytin,vb88,789uytin, l.php?u=';
        
        // Appearance Tab
        ui.compactUISelect.value = settings.compactUIValue || "0";
        ui.languageSelect.value = settings.language || 'vi';
        
        // Stats
        ui.adCount.textContent = formatCount(settings.removedAdCount);
        ui.spamCount.textContent = formatCount(settings.removedSpamCount);
        updateIcon(ui.adBlockToggle.checked);
    };


    const handleSettingChange = (key, value, messagePayload) => {
        chrome.storage.sync.set({ [key]: value });
        if (messagePayload) sendMessage(messagePayload);
        if (key === 'adBlockEnabled') updateIcon(value);
    };

    const handleCommentFilterChange = () => {
        const enabled = ui.commentFilterToggle.checked;
        const filters = ui.commentFilters.value.split(',').map(f => f.trim().toLowerCase()).filter(Boolean);
        handleSettingChange("commentFilterEnabled", enabled);
        handleSettingChange("commentFilters", ui.commentFilters.value);
        sendMessage({ action: "toggleCommentFilter", enabled, filters });
    };

    const sendMessage = (message) => {
        if (currentTabId) {
            chrome.tabs.sendMessage(currentTabId, message, (response) => {
                if (chrome.runtime.lastError) {
                    // console.error("Message sending failed:", chrome.runtime.lastError.message);
                }
            });
        }
    };

    // --- UI UPDATES ---
    const updateIcon = (isEnabled) => {
        const status = isEnabled ? "" : "_disabled";
        const path = {
            16: `icons/icon16${status}.png`,
            48: `icons/icon48${status}.png`,
            128: `icons/icon128${status}.png`,
        };
        chrome.action.setIcon({ path });
    };

    const formatCount = (num) => new Intl.NumberFormat("en-US").format(Number(num) || 0);

    // --- RUN ---
    init();
});