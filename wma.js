// Define constants
export const syncAuthCode = 'syncAuthCode';
export const syncUserConsentData = 'syncUserConsentData';
export const syncTradePayData = 'syncTradePayData';

const my = {
  callbacks: {},

  // Register callback functions for syncTradePayData
  initiate(config) {
    for (const key in config) {
      const callback = config[key];
      if (
        callback?.success instanceof Function &&
        callback?.fail instanceof Function
      ) {
        this.callbacks[key] = callback;
      } else {
        console.error(`Invalid callback structure for '${key}'.`);
      }
    }
  },

  callCallbacks(key, type, data) {
    const callback = this.callbacks[key];
    if (callback && callback[type] instanceof Function) {
      try {
        callback[type](data);
      } catch (error) {
        console.error(`Error executing ${type} callback for '${key}':`, error);
      }
    } else {
      console.error(`Callback for '${key}' not registered or has incorrect structure.`);
    }
  },

  // Wrapper to handle async calls with the callback pattern
  async handleAsyncCall(method, key, data = null) {
    try {
      const result = await window.flutter_inappwebview.callHandler(method, data);
      if (result) {
        this.callCallbacks(key, 'success', result);
      } else {
        this.callCallbacks(key, 'fail', `No data received from ${method}`);
      }
    } catch (error) {
      console.error(`Error in ${method}:`, error);
      this.callCallbacks(key, 'fail', error);
    }
  },

  getAuthCode(data) {
    this.handleAsyncCall('my.getAuthCode', syncAuthCode, data);
  },

  syncAuthCode() {
    this.handleAsyncCall('my.syncAuthCode', syncAuthCode);
  },

  getTradePay(data) {
    this.handleAsyncCall('my.getTradePay', syncTradePayData, data);
  },

 // Sync trade pay
  syncTradePayListener() {
    document.addEventListener('SyncTradePay', (e) => {
      console.log("Received SyncTradePay event:", e.detail);
      my.callCallbacks(syncTradePayData, 'success', e.detail);
    });
  },

  setupEventListeners() {
    document.addEventListener('SyncAuthCode', (e) => {
      this.callCallbacks(syncAuthCode, 'success', e.detail);
    });

    document.addEventListener('SyncUserConsent', (e) => {
      this.callCallbacks(syncUserConsentData, 'success', e.detail);
    });
  },
};

// Set up event listeners and attach `my` to the global `window` object
my.setupEventListeners();
window.my = my;

// Initialize the callbacks for syncTradePayData
my.initiate({
 syncAuthCode: {
    success: function(data) {
      console.log("Successfully received auth code:", data);
      window.dispatchEvent(new CustomEvent('syncAuthCodeSuccess', { detail: data }));
    },
    fail: function(error) {
      console.error("Failed to sync auth code:", error);
      window.dispatchEvent(new CustomEvent('syncAuthCodeFail', { detail: error }));
    }
  },
syncTradePayData: {
    success(data) {
      if (data && data.auxNo) {
        window.dispatchEvent(new CustomEvent('syncTradePayDataSuccess', { detail: { auxNo: data.auxNo } }));
      } else {
        window.dispatchEvent(new CustomEvent('syncTradePayDataFail', { detail: 'No auxNo found' }));
      }
    },
    fail(error) {
      console.error("Failed to sync trade pay data:", error);
      window.dispatchEvent(new CustomEvent('syncTradePayDataFail', { detail: error }));
    }
  }
});

// Add listener when Super App payment completes
function startSyncTradePay() {
  my.syncTradePayListener();
}
