// Global state
let settings = {};
let selectors = {};
let userPhrases = {};
let removedCounts = { ad: 0, spam: 0 };
let isDomStable = false;
let observers = { main: null, comment: null, dialog: null, body: null };

// --- UTILITY FUNCTIONS ---

const updateBadge = () => {
    const count = removedCounts.ad || 0;
    const text = count > 0 ? (count < 1000 ? count.toString() : `${Math.floor(count / 1000)}k`) : "";
    try {
        chrome.runtime.sendMessage({ action: 'updateBadgeCount', count: text });
    } catch (error) {
        // console.error("Failed to send badge update message:", error);
    }
};

const saveRemovedCounts = () => {
    chrome.storage.local.set({ 
        removedAdCount: removedCounts.ad, 
        removedSpamCount: removedCounts.spam 
    });
};

const createPlaceholder = (originalElement, text) => {
    const placeholder = document.createElement('div');
    placeholder.className = 'vnv-placeholder';
    placeholder.style.cssText = `
        padding: 12px 16px; margin: 8px 0; background-color: var(--card-background);
        border: 1px solid var(--card-border); border-radius: 8px; font-size: 14px;
        color: var(--secondary-text); cursor: pointer; text-align: center;`;
    placeholder.textContent = `Đã ẩn bởi VNVanced: ${text}. Nhấn để hiện.`;
    
    const reHideButton = document.createElement('button');
    reHideButton.textContent = 'Facebook Extended | Nhấn để ẩn';
    reHideButton.style.cssText = `
        margin-left: 10px; padding: 2px 8px; font-size: 12px; cursor: pointer; 
        border: 1px solid blue; color: var(--secondary-text); 
        background-color: transparent; border-radius: 4px;`;
    
    reHideButton.onclick = (e) => {
        e.stopPropagation();
        originalElement.style.display = 'none';
        placeholder.style.display = 'block';
        reHideButton.remove();
    };

    placeholder.addEventListener('click', () => {
        originalElement.style.display = 'block';
        placeholder.style.display = 'none';
        originalElement.prepend(reHideButton);
    });

    return placeholder;
};

const elementProcessor = ({
    action,
    selector,
    ancestorSelector,
    filter = null,
    onProcess = null,
    placeholderText = "Nội dung",
    showPlaceholder = false
}) => {
    if (!selector || !ancestorSelector || !action) return;

    try {
        let elements = Array.from(document.querySelectorAll(selector));
        
        elements.forEach(el => {
            const container = el.closest(ancestorSelector);
            if (container && !container.dataset.vnvancedProcessed) {
                if (filter && !filter(el)) {
                    return; 
                }
                
                requestAnimationFrame(() => {
                    container.dataset.vnvancedProcessed = true;
                    if (action === 'remove') {
                        container.remove();
                    } else if (action === 'hide' && showPlaceholder) {
                        container.style.display = 'none';
                        const placeholder = createPlaceholder(container, placeholderText);
                        container.parentNode.insertBefore(placeholder, container);
                    }
                    if (onProcess) onProcess();
                });
            }
        });
    } catch (error) {
        // console.error("Error in elementProcessor:", error);
    }
};

// --- CORE LOGIC FUNCTIONS ---

const processSponsoredContent = () => {
    if (!settings.adBlockEnabled) return;

    const onAdProcessed = () => {
        removedCounts.ad++;
        saveRemovedCounts();
        updateBadge();
    };

    const commonArgs = {
        action: settings.adAction,
        onProcess: onAdProcessed,
        placeholderText: "Quảng cáo",
        showPlaceholder: true 
    };

    // Filter based on "sponsored" phrases
    if (userPhrases.sponsored?.length > 0) {
        elementProcessor({
            ...commonArgs,
            selector: selectors.ads.sponsoredText_v1,
            ancestorSelector: selectors.ads.genericPostContainer,
            filter: (el) => userPhrases.sponsored.some(phrase => el.textContent.trim().toLowerCase() === phrase.toLowerCase())
        });
    }
};

const processPhraseBasedContent = () => {
    const phraseConfigs = {
        suggestion: {
            selector: selectors.suggestions.text,
            ancestor: selectors.suggestions.container,
            placeholder: "Gợi ý"
        },
        reels: {
            selector: selectors.reels.text,
            ancestor: selectors.reels.container,
            placeholder: "Reels & Video ngắn"
        },
        people: {
            selector: selectors.suggestions.peopleText,
            ancestor: selectors.suggestions.container,
            placeholder: "Gợi ý kết bạn"
        }
    };

    for (const key in phraseConfigs) {
        if (userPhrases[key]?.length > 0) {
            const { selector, ancestor, placeholder } = phraseConfigs[key];
            elementProcessor({
                action: 'remove',
                selector: selector,
                ancestorSelector: ancestor,
                filter: (el) => userPhrases[key].some(phrase => el.textContent.toLowerCase().includes(phrase.toLowerCase())),
                placeholderText: placeholder,
                showPlaceholder: false
            });
        }
    }
};


const toggleVisibility = (type, enabled) => {
    if (!enabled) return;
    const selector = selectors[type]?.container;
    if (!selector) return;
    try {
        document.querySelectorAll(selector).forEach(el => el.remove());
    } catch (error) {
        // console.error(`Error toggling visibility for ${type}:`, error);
    }
};

const applyCompactUI = (value) => {
    const leftSidebar = document.querySelector(selectors.sidebars.left);
    const rightSidebar = document.querySelector(selectors.sidebars.right);
    if (leftSidebar) leftSidebar.style.display = (value === '1' || value === '3') ? 'none' : '';
    if (rightSidebar) rightSidebar.style.display = (value === '2' || value === '3') ? 'none' : '';
};

const removeSpamComments = (dialog) => {
    if (!settings.commentFilterEnabled || !dialog) return;
    try {
        dialog.querySelectorAll(selectors.spamComments.commentTextContainer).forEach(commentDiv => {
            const text = commentDiv.textContent.toLowerCase();
            if (settings.commentFilters.some(keyword => text.includes(keyword))) {
                const container = commentDiv.closest(selectors.spamComments.commentBody);
                if (container) {
                    requestAnimationFrame(() => {
                        container.remove();
                        removedCounts.spam++;
                        saveRemovedCounts();
                    });
                }
            }
        });
    } catch (error) {
        // console.error("Error removing spam comments:", error);
    }
};


// --- OBSERVER LOGIC ---

const runAllCleaners = () => {
    if (!isDomStable) return;
    processSponsoredContent();
    processPhraseBasedContent();
    toggleVisibility('stories', settings.storyEnabled);
    toggleVisibility('newFeeds', settings.newFeedsEnabled);
};

const mainObserverCallback = () => {
    isDomStable = true;
    runAllCleaners();
};

const commentDialogObserverCallback = (mutations) => {
    if (!settings.commentFilterEnabled) return;
    for (let mutation of mutations) {
        for (let node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const dialog = node.matches(selectors.spamComments.dialogContainer) ? node : node.querySelector(selectors.spamComments.dialogContainer);
                if (dialog) {
                    removeSpamComments(dialog);
                    if (observers.comment) observers.comment.disconnect();
                    observers.comment = new MutationObserver(() => removeSpamComments(dialog));
                    observers.comment.observe(dialog, { childList: true, subtree: true });
                }
            }
        }
    }
};

const startObservers = () => {
    stopObservers(); 
    
    observers.main = new MutationObserver(mainObserverCallback);
    observers.main.observe(document.body, { childList: true, subtree: true });

    if (settings.commentFilterEnabled) {
        observers.dialog = new MutationObserver(commentDialogObserverCallback);
        observers.dialog.observe(document.body, { childList: true, subtree: true });
    }
};

const stopObservers = () => {
    Object.values(observers).forEach(obs => obs?.disconnect());
    isDomStable = false;
};


// --- INITIALIZATION AND MESSAGE HANDLING ---

const handleMessage = (request, sender, sendResponse) => {
    const actions = {
        toggleAdBlock: () => settings.adBlockEnabled = request.enabled,
        setAdAction: () => settings.adAction = request.value,
        toggleReels: () => settings.reelsEnabled = request.enabled,
        toggleSuggest: () => settings.suggestEnabled = request.enabled,
        toggleStory: () => settings.storyEnabled = request.enabled,
        toggleNewFeeds: () => settings.newFeedsEnabled = request.enabled,
        setCompactUI: () => {
            settings.compactUIValue = request.value;
            applyCompactUI(request.value);
        },
        toggleCommentFilter: () => {
            settings.commentFilterEnabled = request.enabled;
            settings.commentFilters = Array.isArray(request.filters) ? request.filters : [];
            startObservers();
            document.querySelectorAll(selectors.spamComments.dialogContainer).forEach(removeSpamComments);
        },
        updatePhraseFilters: () => {
            userPhrases = request.phrases || {};
        },
        reloadSelectors: () => {
            chrome.storage.sync.get('selectors', (data) => {
                selectors = data.selectors;
            });
        }
    };

    if (actions[request.action]) {
        actions[request.action]();
        document.querySelectorAll('[data-vnvanced-processed]').forEach(el => el.removeAttribute('data-vnvanced-processed'));
        document.querySelectorAll('.vnv-placeholder').forEach(el => el.remove());
        runAllCleaners();
        sendResponse({ status: 'Action processed' });
    } else {
        sendResponse({ status: 'Unknown action' });
    }
    return true;
};

const initialize = (data) => {
    settings = {
        adBlockEnabled: data.adBlockEnabled !== false,
        adAction: data.adAction || 'remove',
        reelsEnabled: data.reelsEnabled === true,
        suggestEnabled: data.suggestEnabled === true,
        storyEnabled: data.storyEnabled === true,
        newFeedsEnabled: data.newFeedsEnabled === true,
        commentFilterEnabled: data.commentFilterEnabled === true,
        commentFilters: (typeof data.commentFilters === 'string') 
            ? data.commentFilters.split(',').map(f => f.trim().toLowerCase()).filter(Boolean)
            : [],
        compactUIValue: data.compactUIValue || '0'
    };
    selectors = data.selectors || {};
    userPhrases = data.userPhrases || {};

    chrome.storage.local.get(['removedAdCount', 'removedSpamCount'], (counts) => {
        removedCounts.ad = counts.removedAdCount || 0;
        removedCounts.spam = counts.removedSpamCount || 0;
        updateBadge();
    });

    applyCompactUI(settings.compactUIValue);
    
    startObservers();

    const runInitialCleanup = () => {
        isDomStable = true;
        runAllCleaners();
    };

    if (document.readyState === 'complete') {
        runInitialCleanup();
    } else {
        window.addEventListener("load", runInitialCleanup, { once: true });
    }
};

// Start the script
chrome.storage.sync.get(null, (data) => {
    // Import default phrases before initializing
    import(chrome.runtime.getURL('phrases.js'))
        .then((module) => {
            const defaultPhrases = module.defaultPhrases;
            // Merge user phrases with defaults
            if (!data.userPhrases) {
                data.userPhrases = {};
            }
            for (const key in defaultPhrases) {
                if (!data.userPhrases[key]) {
                    data.userPhrases[key] = defaultPhrases[key];
                }
            }
            initialize(data);
        })
        .catch(e => {
            console.error("Error loading phrases module:", e);
            // Initialize without defaults if module fails
            initialize(data);
        });
});

chrome.runtime.onMessage.addListener(handleMessage);
