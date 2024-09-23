// Define constants
export const syncAuthCode = 'syncAuthCode';
export const syncUserConsentData = 'syncUserConsentData';
export const syncTradePayData = 'syncTradePayData';

const my = {
  callbacks: {},

  // Initiate method to register multiple callbacks at once
  initiate: function (config) {
    Object.keys(config).forEach(function (key) {
      this.registerCallback(key, config[key]);
    }.bind(this));
  },

  // Register a callback for a given key
  registerCallback: function (key, callback) {
    if (this.isValidCallback(callback)) {
      if (!this.callbacks[key]) {
        this.callbacks[key] = [];
      }
      this.callbacks[key].push(callback);
    } else {
      console.error(`Invalid callback structure for '${key}'`);
    }
  },

  // Validate callback structure (must have 'success' and 'fail' as functions)
  isValidCallback: function (callback) {
    return callback && typeof callback.success === 'function' && typeof callback.fail === 'function';
  },

  // Call registered callbacks based on key and type ('success' or 'fail')
  callCallbacks: function (key, type, data) {
    if (Array.isArray(this.callbacks[key])) {
      this.callbacks[key].forEach(callbackObj => {
        if (typeof callbackObj[type] === 'function') {
          try {
            callbackObj[type](data);
          } catch (error) {
            console.error(`Error executing '${type}' callback for '${key}':`, error);
          }
        }
      });
    } else {
      console.error(`No valid callbacks registered for '${key}'`);
    }
  },

  // Get Authorization Code from Flutter
  getAuthCode: function (data, callbacks) {
    this.registerCallback(syncAuthCode, callbacks);  // Register callbacks before calling
    this.callFlutterHandler('my.getAuthCode', data, 'syncAuthCode');
  },

  // Synchronize Auth Code
  syncAuthCode: function () {
    this.callFlutterHandler('my.syncAuthCode', null, syncAuthCode);
  },

  // Get User Consent from Flutter
  getUserConsent: function (data, callbacks) {
    this.registerCallback(syncUserConsentData, callbacks);  // Register callbacks before calling
    this.callFlutterHandler('my.getUserConsent', data, syncUserConsentData);
  },

  // Synchronize User Consent Data
  syncUserConsent: function () {
    this.callFlutterHandler('my.syncUserConsent', null, syncUserConsentData);
  },

  // Get Trade Payment Data from Flutter
  getTradePay: function (data, callbacks) {
    this.registerCallback(syncTradePayData, callbacks);  // Register callbacks before calling
    this.callFlutterHandler('my.getTradePay', data, syncTradePayData);
  },

  // Synchronize Trade Pay Data
  syncTradePay: function () {
    this.callFlutterHandler('my.syncTradePay', null, syncTradePayData);
  },

  // General function to call Flutter handlers
  callFlutterHandler: function (handlerName, data, callbackKey) {
    window.flutter_inappwebview.callHandler(handlerName, data)
      .then(result => {
        if (result !== null && result !== undefined) {
          this.callCallbacks(callbackKey, 'success', result);
        } else {
          this.callCallbacks(callbackKey, 'fail', new Error(`No valid response from '${handlerName}'`));
        }
      })
      .catch(error => {
        console.error(`Error calling handler '${handlerName}':`, error);
        this.callCallbacks(callbackKey, 'fail', error);
      });
  },

  // Setup Event Listeners for different events
  setupEventListeners: function () {
    document.addEventListener('SyncAuthCode', (e) => {
      this.callCallbacks(syncAuthCode, 'success', e.detail);
    });

    document.addEventListener('SyncTradePay', (e) => {
      this.callCallbacks(syncTradePayData, 'success', e.detail);
    });

    document.addEventListener('SyncUserConsent', (e) => {
      this.callCallbacks(syncUserConsentData, 'success', e.detail);
    });
  }
};

// Initialize event listeners
my.setupEventListeners();

// Export the 'my' object globally
window.my = my;

export { my };
