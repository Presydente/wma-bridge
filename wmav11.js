// Define constants
export const syncAuthCode = 'syncAuthCode';
export const syncUserConsentData = 'syncUserConsentData';
export const syncTradePayData = 'syncTradePayData';

const my = {
  callbacks: {},

  // Register callback functions for syncTradePayData
  initiate: function (config) {
    Object.keys(config).forEach((key) => {
      this.registerCallback(key, config[key]);
    });
  },

  registerCallback: function (key, callback) {
    if (
      callback.success && typeof callback.success === 'function' &&
      callback.fail && typeof callback.fail === 'function'
    ) {
      if (!this.callbacks[key]) {
        this.callbacks[key] = [];
      }
      this.callbacks[key].push(callback);
    } else {
      console.error(`Callback for '${key}' does not have the expected structure.`);
    }
  },

  callCallbacks: function (key, type, data) {
    if (this.callbacks[key] && Array.isArray(this.callbacks[key])) {
      this.callbacks[key].forEach((callbackObj) => {
        if (callbackObj[type] && typeof callbackObj[type] === 'function') {
          try {
            callbackObj[type](data);
          } catch (error) {
            console.error(`Error executing ${type} callback for '${key}':`, error);
          }
        }
      });
    } else {
      console.error(`Callbacks for '${key}' not registered or have incorrect structure.`);
    }
  },

  // Get Auth Code - sends clientId and redirectUrl to Flutter
  getAuthCode: function (data, callbacks) {
    window.flutter_inappwebview.callHandler('my.getAuthCode', data)
      .then((response) => {
        if (response === null) {
          console.error("No response received from Flutter.");
          if (callbacks && typeof callbacks.fail === 'function') {
            callbacks.fail("No response received from Flutter.");
          }
        } else {
          if (callbacks && typeof callbacks.success === 'function') {
            callbacks.success(response);
          }
        }
      })
      .catch((error) => {
        console.error("Error sending Auth Code to Flutter", error);
        if (callbacks && typeof callbacks.fail === 'function') {
          callbacks.fail(error);
        }
      });
  },

  // Sync Auth Code - retrieves and processes the auth code
  syncAuthCode: function () {
    window.flutter_inappwebview.callHandler('my.syncAuthCode')
      .then((result) => {
        if (result && result.code) {
          this.callCallbacks('syncAuthCodeData', 'success', JSON.stringify(result));
        } else {
          this.callCallbacks('syncAuthCodeData', 'fail', new Error("No valid auth code data received."));
        }
      })
      .catch((error) => {
        console.error("Error syncing auth code data", error);
        this.callCallbacks('syncAuthCodeData', 'fail', error);
      });
  },

  // Get Trade Pay - fetches trade pay data from Flutter
  getTradePay: function (data, callbacks) {
    window.flutter_inappwebview.callHandler('my.getTradePay', data)
      .then((result) => {
        if (result === null) {
          console.error("No trade payment response received.");
          if (callbacks && typeof callbacks.fail === 'function') {
            callbacks.fail("No trade payment response received.");
          }
        } else {
          if (callbacks && typeof callbacks.success === 'function') {
            callbacks.success(result);
          }
        }
      })
      .catch((error) => {
        console.error("Error processing trade payment", error);
        if (callbacks && typeof callbacks.fail === 'function') {
          callbacks.fail(error);
        }
      });
  },

  // Sync trade pay - synchronizes trade pay data with Flutter
  syncTradePay: function () {
    window.flutter_inappwebview.callHandler('my.syncTradePay')
      .then((result) => {
        if (result && result.auxNo) {
          this.callCallbacks('syncTradePayData', 'success', JSON.stringify(result));
        } else {
          this.callCallbacks('syncTradePayData', 'fail', new Error("No valid trade pay data received."));
        }
      })
      .catch((error) => {
        console.error("Error syncing trade pay data", error);
        this.callCallbacks('syncTradePayData', 'fail', error);
      });
  },

  setupEventListeners: function () {
    document.addEventListener('SyncAuthCode', (e) => {
      console.log("Received SyncAuthCode event:", e);
      my.callCallbacks('syncAuthCode', 'success', e.detail);
    });

    document.addEventListener('SyncTradePay', (e) => {
      console.log("Received SyncTradePay event:", e);
      my.callCallbacks('syncTradePayData', 'success', e.detail);
    });

    document.addEventListener('SyncUserConsent', (e) => {
      this.callCallbacks('syncUserConsentData', 'success', e.detail);
    });
  }
};

my.setupEventListeners();
window.my = my;

// Initialize callbacks for syncTradePayData
my.initiate({
  syncTradePayData: {
    success: function (data) {
      console.log("Successfully received trade pay data:", data);
      let parsedData;

      try {
        // Parse the data if it's in JSON format
        parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      } catch (error) {
        console.error("Failed to parse data:", error);
        parsedData = data; // Use raw data if parsing fails
      }

      // Convert parsed data to a plain object or JSON string
      const serializedData = JSON.stringify(parsedData);
      console.log("Dispatching syncTradePayDataSuccess with serialized detail:", serializedData);
      window.dispatchEvent(new CustomEvent('syncTradePayDataSuccess', { detail: serializedData }));
    },
    fail: function (error) {
      console.error("Failed to sync trade pay data:", error);
      window.dispatchEvent(new CustomEvent('syncTradePayDataFail', { detail: error }));
    }
  }
});

// Initialize callbacks for syncAuthCodeData
my.initiate({
  syncAuthCodeData: {
    success: function (data) {
      console.log("Successfully received auth code data:", data);
      let parsedData;

      try {
        // Parse the data if it's in JSON format
        parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      } catch (error) {
        console.error("Failed to parse auth code data:", error);
        parsedData = data; // Use raw data if parsing fails
      }

      // Convert parsed data to a plain object or JSON string
      const serializedData = JSON.stringify(parsedData);
      console.log("Dispatching syncAuthCodeDataSuccess with serialized detail:", serializedData);
      window.dispatchEvent(new CustomEvent('syncAuthCodeDataSuccess', { detail: serializedData }));
    },
    fail: function (error) {
      console.error("Failed to sync auth code data:", error);
      window.dispatchEvent(new CustomEvent('syncAuthCodeDataFail', { detail: error }));
    }
  }
});
