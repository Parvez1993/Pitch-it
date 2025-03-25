/**
 * Universal Form Tracking Script
 * Designed to capture ALL form submissions regardless of implementation
 * Includes protections against infinite loops and performance issues
 */
(function () {
  "use strict";

  // =====================================================================
  // CONFIGURATION
  // =====================================================================
  const Config = (function () {
    // Auto-detect client ID from script tag
    const scriptTag =
      document.currentScript ||
      (function () {
        const scripts = document.getElementsByTagName("script");
        return scripts[scripts.length - 1];
      })();
    const scriptSrc = scriptTag.src || "";
    const clientIdMatch = scriptSrc.match(/[?&]client=([^&]*)/);

    return {
      // Production endpoint (replace with your actual endpoint)
      endpoint: "https://api.alpha.tenscores.com/api/auth/debug-params",
      clientId: clientIdMatch
        ? decodeURIComponent(clientIdMatch[1])
        : "default_client",
      // Debug mode - set to false in production
      debug: false,
      // Google Ads parameters to track
      googleAdsParams: [
        "gclid",
        "ts-account",
        "ts-campaign",
        "ts-adgroup",
        "ts-keyword",
        "ts-search-term",
        "ts-account-id",
        "ts-campaign-id",
        "ts-adgroup-id",
        "ts-keyword-id",
        "ts-search-term-id",
      ],
      // Enable tracking of additional custom URL parameters
      trackCustomParams: true,
      // Anti-loop protection: ignore requests to these paths
      ignorePathsContaining: ["/api/", "/collect", "/track", "/analytics"],
      // Tracking throttling (ms) - prevents spamming your server
      minimumTimeBetweenRequests: 1000,
      // Request timeout (ms)
      requestTimeout: 3000,

      debug: true, // Set to true to enable debug UI
      debugUIEnabled: true, // Controls whether to show the debug UI
    };
  })();

  // =====================================================================
  // LOGGING
  // =====================================================================
  const Logger = {
    log: function (message, data) {
      if (Config.debug && window.console) {
        if (data) console.log("[Tracker]", message, data);
        else console.log("[Tracker]", message);
      }
    },

    error: function (message, err) {
      if (window.console) {
        console.error("[Tracker Error]", message, err);
      }
    },
  };

  // =====================================================================
  // UTILITIES
  // =====================================================================
  const Utils = {
    generateUUID: function () {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }
      );
    },

    debounce: function (func, wait) {
      let timeout;
      return function () {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function () {
          func.apply(context, args);
        }, wait);
      };
    },

    getURLParameters: function () {
      const params = {};
      const searchParams = new URLSearchParams(window.location.search);

      // Extract all URL parameters
      for (const [key, value] of searchParams.entries()) {
        params[key] = value;
      }

      // Check for Google Ads traffic
      const hasGclid = params.hasOwnProperty("gclid");
      const hasCustomParams = Config.googleAdsParams.some(
        (param) => param !== "gclid" && params.hasOwnProperty(param)
      );

      // Filter tracked parameters
      const trackedParams = {};
      Config.googleAdsParams.forEach((param) => {
        if (params[param]) {
          trackedParams[param] = params[param];
        }
      });

      // Track custom parameters
      const customParams = {};
      if (Config.trackCustomParams) {
        for (const [key, value] of Object.entries(params)) {
          if (!Config.googleAdsParams.includes(key)) {
            customParams[key] = value;
          }
        }
      }

      return {
        allParams: params,
        trackedParams: trackedParams,
        customParams: customParams,
        isFromGoogleAds: hasGclid || hasCustomParams,
      };
    },

    // Anti-loop protection - checks if a URL should be ignored for tracking
    shouldIgnoreUrl: function (url) {
      if (!url) return true;

      for (const path of Config.ignorePathsContaining) {
        if (url.indexOf(path) !== -1) return true;
      }

      return false;
    },

    // Gets form data from any kind of form or form-like element
    extractFormData: function (form) {
      if (!form) return {};

      const formData = {};
      const sensitiveFields = [
        "password",
        "card",
        "credit",
        "ccv",
        "cvv",
        "ssn",
        "social",
      ];

      // Handle standard form elements
      if (form.elements) {
        for (let i = 0; i < form.elements.length; i++) {
          const element = form.elements[i];

          // Skip buttons, nameless fields, or submit buttons
          if (
            !element.name ||
            element.type === "submit" ||
            element.type === "button"
          ) {
            continue;
          }

          // Skip tracking fields
          if (
            element.type === "hidden" &&
            Config.googleAdsParams.includes(element.name)
          ) {
            continue;
          }

          // Handle sensitive fields
          const isSensitive =
            element.type === "password" ||
            sensitiveFields.some(
              (term) =>
                element.name.toLowerCase().includes(term) ||
                (element.id && element.id.toLowerCase().includes(term))
            );

          if (isSensitive) {
            formData[element.name] = element.value ? "(filled)" : "(empty)";
          } else {
            formData[element.name] =
              element.type === "checkbox"
                ? element.checked
                : element.value
                  ? element.value.substring(0, 100)
                  : "";
          }
        }
      }
      // Handle non-standard forms by looking for input-like elements
      else {
        const inputs = form.querySelectorAll("input, select, textarea");
        inputs.forEach((input) => {
          if (
            !input.name ||
            input.type === "submit" ||
            input.type === "button"
          ) {
            return;
          }

          const isSensitive =
            input.type === "password" ||
            sensitiveFields.some(
              (term) =>
                input.name.toLowerCase().includes(term) ||
                (input.id && input.id.toLowerCase().includes(term))
            );

          if (isSensitive) {
            formData[input.name] = input.value ? "(filled)" : "(empty)";
          } else {
            formData[input.name] =
              input.type === "checkbox"
                ? input.checked
                : input.value
                  ? input.value.substring(0, 100)
                  : "";
          }
        });
      }

      return formData;
    },

    // Determine if an element might be a submit button
    isPossibleSubmitButton: function (element) {
      if (!element || !element.tagName) return false;

      // Direct type="submit" buttons
      if (element.type === "submit") return true;

      // Standard buttons
      if (element.tagName === "BUTTON") return true;

      // Elements with submit-related classes
      if (
        element.classList &&
        (element.classList.contains("submit") ||
          element.classList.contains("btn-submit") ||
          element.classList.contains("button-submit"))
      )
        return true;

      // Elements with submit-related IDs
      if (element.id && element.id.toLowerCase().includes("submit"))
        return true;

      // Role-based buttons
      if (element.getAttribute("role") === "button") return true;

      // Elements with common submit text
      if (
        element.innerText &&
        [
          "submit",
          "send",
          "book",
          "register",
          "signup",
          "sign up",
          "subscribe",
          "order",
          "buy",
          "continue",
          "next",
          "complete",
        ].some((text) => element.innerText.toLowerCase().includes(text))
      ) {
        return true;
      }

      return false;
    },

    // Find the closest form or form-like container
    findFormContainer: function (element) {
      // Direct form check
      if (element.tagName === "FORM") return element;

      // Check if it has common form classes
      if (
        element.classList &&
        (element.classList.contains("form") ||
          element.classList.contains("mauticform") ||
          element.classList.contains("hubspot-form") ||
          element.classList.contains("hs-form") ||
          element.classList.contains("wpcf7-form") ||
          element.classList.contains("wpforms-form") ||
          element.classList.contains("gform_wrapper") ||
          element.classList.contains("frm-form") ||
          element.classList.contains("ninja-forms") ||
          element.classList.contains("formidable") ||
          element.classList.contains("mailchimp-form") ||
          element.classList.contains("klaviyo-form") ||
          element.classList.contains("forminator-form"))
      )
        return element;

      // Check if it has form role
      if (element.getAttribute("role") === "form") return element;

      // Look for parent form containers (up to 5 levels to avoid performance issues)
      let parent = element.parentElement;
      let level = 0;

      while (parent && level < 5) {
        // Check if parent is a form
        if (parent.tagName === "FORM") return parent;

        // Check parent classes for form-like containers
        if (
          parent.classList &&
          (parent.classList.contains("form") ||
            parent.classList.contains("mauticform") ||
            parent.classList.contains("hubspot-form") ||
            parent.classList.contains("hs-form") ||
            parent.classList.contains("wpcf7-form") ||
            parent.classList.contains("wpforms-form") ||
            parent.classList.contains("gform_wrapper") ||
            parent.classList.contains("frm-form") ||
            parent.classList.contains("ninja-forms") ||
            parent.classList.contains("formidable") ||
            parent.classList.contains("mailchimp-form") ||
            parent.classList.contains("klaviyo-form") ||
            parent.classList.contains("forminator-form"))
        )
          return parent;

        // Check if parent has form role
        if (parent.getAttribute("role") === "form") return parent;

        parent = parent.parentElement;
        level++;
      }

      return null;
    },
  };

  // =====================================================================
  // STORAGE MODULE
  // =====================================================================
  const Storage = {
    getItem: function (key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        Logger.error("Error accessing localStorage:", e);
        return null;
      }
    },

    setItem: function (key, value) {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (e) {
        Logger.error("Error writing to localStorage:", e);
        return false;
      }
    },

    getVisitorId: function () {
      return this.getItem("_vid") || Utils.generateUUID();
    },

    getSessionId: function () {
      return this.getItem("_sid") || Utils.generateUUID();
    },

    saveVisitorId: function (visitorId) {
      this.setItem("_vid", visitorId);
    },

    saveSessionId: function (sessionId) {
      this.setItem("_sid", sessionId);
    },

    saveGoogleAdsParams: function (params) {
      if (Object.keys(params).length > 0) {
        this.setItem("_googleAdsParams", JSON.stringify(params));
        Logger.log("Google Ads parameters saved", params);
      }
    },

    saveCustomParams: function (params) {
      if (Object.keys(params).length > 0) {
        this.setItem("_customParams", JSON.stringify(params));
        Logger.log("Custom parameters saved", params);
      }
    },

    getGoogleAdsParams: function () {
      const params = this.getItem("_googleAdsParams");
      if (params) {
        try {
          return JSON.parse(params);
        } catch (e) {
          Logger.error("Error parsing stored Google Ads params:", e);
          return {};
        }
      }
      return {};
    },

    getCustomParams: function () {
      const params = this.getItem("_customParams");
      if (params) {
        try {
          return JSON.parse(params);
        } catch (e) {
          Logger.error("Error parsing stored custom params:", e);
          return {};
        }
      }
      return {};
    },
  };

  // =====================================================================
  // DOM HANDLER
  // =====================================================================
  const DOMHandler = {
    // Add tracking parameters to forms
    appendParamsToForms: function () {
      const adsParamsObj = Storage.getGoogleAdsParams();
      const customParamsObj = Storage.getCustomParams();

      if (
        Object.keys(adsParamsObj).length === 0 &&
        Object.keys(customParamsObj).length === 0
      ) {
        return;
      }

      const forms = document.querySelectorAll("form");
      forms.forEach((form) => {
        // Skip if already processed
        if (form.getAttribute("data-has-tracked-params") === "true") {
          return;
        }

        // Add Google Ads parameters
        Object.entries(adsParamsObj).forEach(([key, value]) => {
          let input = form.querySelector(`input[name="${key}"]`);
          if (!input) {
            input = document.createElement("input");
            input.type = "hidden";
            input.name = key;
            form.appendChild(input);
          }
          input.value = value;
        });

        // Add custom parameters
        Object.entries(customParamsObj).forEach(([key, value]) => {
          let input = form.querySelector(`input[name="${key}"]`);
          if (!input) {
            input = document.createElement("input");
            input.type = "hidden";
            input.name = key;
            form.appendChild(input);
          }
          input.value = value;
        });

        // Mark as processed
        form.setAttribute("data-has-tracked-params", "true");
      });
    },

    // Set up mutation observer to detect new forms
    setupMutationObserver: function () {
      const adsParams = Storage.getGoogleAdsParams();
      const customParams = Storage.getCustomParams();

      if (
        Object.keys(adsParams).length === 0 &&
        Object.keys(customParams).length === 0
      ) {
        return;
      }

      // Use a debounced function to update forms
      const updateForms = Utils.debounce(() => {
        this.appendParamsToForms();
      }, 500);

      // Create a mutation observer
      const observer = new MutationObserver((mutations) => {
        let hasNewForms = false;

        for (const mutation of mutations) {
          if (mutation.type === "childList" && mutation.addedNodes.length) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // Check if node is a form or contains forms
                if (node.tagName === "FORM" || node.querySelector("form")) {
                  hasNewForms = true;
                  break;
                }
              }
            }
          }

          if (hasNewForms) break;
        }

        if (hasNewForms) {
          updateForms();
        }
      });

      // Find elements that might contain forms
      const formContainers = document.querySelectorAll(
        'form, main, [id^="content"], [class*="content"], [class*="form"]'
      );

      if (formContainers.length > 0) {
        // Observe each potential form container
        formContainers.forEach((container) => {
          observer.observe(container, {
            childList: true,
            subtree: true,
          });
        });
      } else {
        // Fallback to main content area
        const main =
          document.querySelector("main") || document.querySelector("#main");
        if (main) {
          observer.observe(main, {
            childList: true,
            subtree: true,
          });
        } else {
          // Last resort - observe body but with limited depth
          observer.observe(document.body, {
            childList: true,
            subtree: false,
          });
        }
      }
    },

    createDebugUI: function () {
      // Only create if debug and UI are enabled
      if (!Config.debug || !Config.debugUIEnabled) return;

      // Create the UI after a short delay
      setTimeout(() => {
        // Check if already exists
        if (document.getElementById("ga-tracking-debug")) return;

        // Create container
        const debugDiv = document.createElement("div");
        debugDiv.id = "ga-tracking-debug";
        debugDiv.style.position = "fixed";
        debugDiv.style.bottom = "20px";
        debugDiv.style.right = "20px";
        debugDiv.style.width = "250px";
        debugDiv.style.fontFamily = "system-ui, -apple-system, sans-serif";
        debugDiv.style.fontSize = "12px";
        debugDiv.style.backgroundColor = "#fff";
        debugDiv.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
        debugDiv.style.borderRadius = "5px";
        debugDiv.style.overflow = "hidden";
        debugDiv.style.zIndex = "99999";

        // Create header
        const header = document.createElement("div");
        header.style.backgroundColor = "#4285F4";
        header.style.color = "#fff";
        header.style.padding = "8px 12px";
        header.style.fontWeight = "500";
        header.style.display = "flex";
        header.style.justifyContent = "space-between";
        header.style.alignItems = "center";
        header.innerHTML = `
          <span>Google Ads Tracker</span>
          <span id="debug-toggle" style="cursor:pointer; font-size:16px;">−</span>
        `;

        // Create content
        const content = document.createElement("div");
        content.id = "debug-content";
        content.style.padding = "12px";

        // Get tracking info
        const googleAdsParams = Storage.getGoogleAdsParams();
        const hasGoogleAdsParams = Object.keys(googleAdsParams).length > 0;

        // Add basic info
        content.innerHTML = `
          <div style="margin-bottom:8px;">
            <strong>Tracking Status</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>Google Ads Params:</span>
            <span style="color:${hasGoogleAdsParams ? "#34A853" : "#EA4335"}">
              ${hasGoogleAdsParams ? "✓ Found" : "✗ None"}
            </span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>Visitor ID:</span>
            <span style="font-family:monospace;">${Tracker.getVisitorId().substring(
              0,
              8
            )}...</span>
          </div>
          <div style="margin-top:8px; border-top:1px solid #eee; padding-top:8px; text-align:right;">
            <a href="#" id="debug-hide" style="color:#4285F4; text-decoration:none; font-size:10px;">
              Hide Panel
            </a>
          </div>
        `;

        // Assemble UI
        debugDiv.appendChild(header);
        debugDiv.appendChild(content);
        document.body.appendChild(debugDiv);

        // Toggle functionality
        document
          .getElementById("debug-toggle")
          .addEventListener("click", () => {
            const content = document.getElementById("debug-content");
            if (content.style.display === "none") {
              content.style.display = "block";
              document.getElementById("debug-toggle").textContent = "−";
            } else {
              content.style.display = "none";
              document.getElementById("debug-toggle").textContent = "+";
            }
          });

        // Hide functionality
        document.getElementById("debug-hide").addEventListener("click", (e) => {
          e.preventDefault();
          debugDiv.style.display = "none";

          // Add small indicator
          const indicator = document.createElement("div");
          indicator.style.position = "fixed";
          indicator.style.bottom = "20px";
          indicator.style.right = "20px";
          indicator.style.width = "30px";
          indicator.style.height = "30px";
          indicator.style.borderRadius = "50%";
          indicator.style.backgroundColor = "#4285F4";
          indicator.style.color = "#fff";
          indicator.style.display = "flex";
          indicator.style.alignItems = "center";
          indicator.style.justifyContent = "center";
          indicator.style.cursor = "pointer";
          indicator.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
          indicator.style.zIndex = "99999";
          indicator.innerHTML = "+";

          indicator.addEventListener("click", () => {
            debugDiv.style.display = "block";
            indicator.remove();
          });

          document.body.appendChild(indicator);
        });
      }, 1000);
    },
  };

  // =====================================================================
  // TRANSPORT MODULE
  // =====================================================================
  const Transport = {
    lastRequestTime: 0,
    pendingRequests: 0,
    requestQueue: [],

    sendData: function (data) {
      if (!data) return;

      // Skip if we don't have valid Google Ads parameters
      const googleAdsParams = Storage.getGoogleAdsParams();
      if (!googleAdsParams || Object.keys(googleAdsParams).length === 0) {
        Logger.log("No Google Ads parameters to send");
        return;
      }

      // Check if we've sent a request too recently
      const now = Date.now();
      if (now - this.lastRequestTime < Config.minimumTimeBetweenRequests) {
        // If we're sending too frequently, queue for later
        this.requestQueue.push(data);
        this.processQueue();
        return;
      }

      // Update timestamp
      this.lastRequestTime = now;

      // Track pending request count
      this.pendingRequests++;

      // Prepare request
      try {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", Config.endpoint, true);
        xhr.setRequestHeader("Content-Type", "application/json");

        // Set timeout
        xhr.timeout = Config.requestTimeout;

        // Handle completion
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            this.pendingRequests--;

            if (xhr.status >= 200 && xhr.status < 300) {
              Logger.log("Successfully sent tracking data");
            } else {
              Logger.error("Failed to send tracking data:", xhr.statusText);
            }

            // Process any queued requests
            this.processQueue();
          }
        };

        // Handle errors
        xhr.onerror = () => {
          this.pendingRequests--;
          Logger.error("Error sending tracking data");
          this.processQueue();
        };

        xhr.ontimeout = () => {
          this.pendingRequests--;
          Logger.error("Request timed out");
          this.processQueue();
        };

        // Send data
        xhr.send(JSON.stringify([data]));
        Logger.log("Sending data to endpoint:", Config.endpoint);
      } catch (err) {
        this.pendingRequests--;
        Logger.error("Error sending tracking data:", err);
        this.processQueue();
      }
    },

    processQueue: function () {
      // Process queue after current execution context
      setTimeout(() => {
        // Don't process if we have too many pending requests
        if (this.pendingRequests >= 2) return;

        // Don't process if we've sent a request too recently
        if (
          Date.now() - this.lastRequestTime <
          Config.minimumTimeBetweenRequests
        )
          return;

        // Process next item in queue
        if (this.requestQueue.length > 0) {
          const data = this.requestQueue.shift();
          this.sendData(data);
        }
      }, 0);
    },
  };

  // =====================================================================
  // TRACKER CORE
  // =====================================================================
  const Tracker = {
    visitorId: null,
    sessionId: null,
    initialized: false,
    capturedSubmissions: new Set(),

    init: function () {
      if (this.initialized) return;

      Logger.log("Initializing tracker");

      // Set up IDs
      this.visitorId = Storage.getVisitorId();
      Storage.saveVisitorId(this.visitorId);

      this.sessionId = Storage.getSessionId();
      Storage.saveSessionId(this.sessionId);

      // Process URL parameters
      this.checkAndStoreParams();

      // Set up form tracking (both standard and non-standard forms)
      this.setupEventListeners();

      // Add parameters to forms
      DOMHandler.appendParamsToForms();

      // Set up mutation observer for dynamically added forms
      DOMHandler.setupMutationObserver();

      DOMHandler.createDebugUI();

      this.initialized = true;
      Logger.log("Tracker initialized");
    },

    checkAndStoreParams: function () {
      const urlParams = Utils.getURLParameters();

      // Store Google Ads parameters if present
      if (urlParams.isFromGoogleAds) {
        Logger.log("Detected Google Ads parameters:", urlParams.trackedParams);
        Storage.saveGoogleAdsParams(urlParams.trackedParams);
      }

      // Store custom parameters if present
      if (
        Config.trackCustomParams &&
        Object.keys(urlParams.customParams).length > 0
      ) {
        Logger.log("Detected custom parameters:", urlParams.customParams);
        Storage.saveCustomParams(urlParams.customParams);
      }
    },

    setupEventListeners: function () {
      // 1. STANDARD FORM SUBMISSIONS
      document.addEventListener(
        "submit",
        (event) => {
          const form = event.target;
          if (form.tagName === "FORM") {
            this.trackFormSubmission(form, "standard_submit");
          }
        },
        { passive: true }
      );

      // 2. CLICK TRACKING FOR NON-STANDARD FORMS
      document.addEventListener(
        "click",
        (event) => {
          const target = event.target;

          // Skip if element isn't a possible submit button
          if (!Utils.isPossibleSubmitButton(target)) return;

          // Find the nearest form container
          const formContainer = Utils.findFormContainer(target);
          if (formContainer) {
            // Generate a unique ID for this submission
            const submissionId =
              formContainer.id ||
              formContainer.getAttribute("name") ||
              `form_${Math.random().toString(36).substring(2, 10)}`;

            // Check if we've already tracked this submission recently (debounce)
            if (this.capturedSubmissions.has(submissionId)) return;

            // Mark as captured (for 2 seconds)
            this.capturedSubmissions.add(submissionId);
            setTimeout(() => {
              this.capturedSubmissions.delete(submissionId);
            }, 2000);

            // Track the submission
            this.trackFormSubmission(formContainer, "button_click_submit");
          }
        },
        { passive: true }
      );

      // 3. PATCHED FETCH API FOR AJAX FORMS
      const originalFetch = window.fetch;
      window.fetch = function (...args) {
        // Skip tracking for internal requests like our own endpoint
        if (
          args[0] &&
          typeof args[0] === "string" &&
          !Utils.shouldIgnoreUrl(args[0])
        ) {
          // This might be a form submission
          Tracker.createAndSendEvent("fetch_submission", {
            url: window.location.href,
            target: args[0],
          });
        }

        // Call original fetch
        return originalFetch.apply(this, args);
      };

      // 4. PATCHED XHR FOR AJAX FORMS
      const originalXHROpen = XMLHttpRequest.prototype.open;
      const originalXHRSend = XMLHttpRequest.prototype.send;

      XMLHttpRequest.prototype.open = function (method, url, ...rest) {
        this._trackingUrl = url;
        this._trackingMethod = method;
        return originalXHROpen.apply(this, [method, url, ...rest]);
      };

      XMLHttpRequest.prototype.send = function (data) {
        // Skip tracking for internal requests
        if (this._trackingUrl && !Utils.shouldIgnoreUrl(this._trackingUrl)) {
          // This might be a form submission
          Tracker.createAndSendEvent("xhr_submission", {
            url: window.location.href,
            method: this._trackingMethod,
            target: this._trackingUrl,
          });
        }

        return originalXHRSend.apply(this, arguments);
      };
    },

    trackFormSubmission: function (form, submissionType) {
      // Extract form data
      const formData = Utils.extractFormData(form);

      // Create identifying information
      const formInfo = {
        formId: form.id || form.getAttribute("name") || "unnamed_form",
        formAction: form.action || window.location.href,
        formMethod: form.method || "unknown",
        formClasses: form.className || "",
        submissionType: submissionType || "form_submission",
        formData: formData,
      };

      // Create and send event
      this.createAndSendEvent("form_submission", formInfo);
    },

    createAndSendEvent: function (eventType, eventData = {}) {
      // Get Google Ads and custom parameters
      const googleAdsParams = Storage.getGoogleAdsParams();
      const customParams = Storage.getCustomParams();

      // Skip if no Google Ads parameters (nothing to track)
      if (Object.keys(googleAdsParams).length === 0) {
        Logger.log("No Google Ads parameters to track");
        return;
      }

      // Create the event data
      const data = {
        clientId: Config.clientId,
        timestamp: new Date().toISOString(),
        visitorId: this.visitorId,
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer,
        eventType: eventType,
        eventData: eventData,
        googleAdsParams: googleAdsParams,
        customParams: customParams,
      };

      // Send to server
      Transport.sendData(data);
    },

    getVisitorId: function () {
      return this.visitorId;
    },

    getSessionId: function () {
      return this.sessionId;
    },
  };

  // =====================================================================
  // PUBLIC API
  // =====================================================================
  window.GoogleAdsTracker = {
    trackFormSubmission: function (formElement) {
      if (formElement) {
        Tracker.trackFormSubmission(formElement, "manual_submission");
      }
    },

    getVisitorId: function () {
      return Tracker.getVisitorId();
    },

    getSessionId: function () {
      return Tracker.getSessionId();
    },

    getGoogleAdsParams: function () {
      return Storage.getGoogleAdsParams();
    },

    getCustomParams: function () {
      return Storage.getCustomParams();
    },
  };

  // =====================================================================
  // INITIALIZATION
  // =====================================================================
  // Initialize the tracker
  Tracker.init();
})();
