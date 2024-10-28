// Define constants
export const syncAuthCode = 'syncAuthCode';
export const syncUserConsentData = 'syncUserConsentData';
export const syncTradePayData = 'syncTradePayData';


const my = {
  callbacks: {},

  initiate: function (config) {
    Object.keys(config).forEach(function (key) {
      this.registerCallback(key, config[key]);
    }.bind(this));
  },

  registerCallback: function (key, callback) {
    if (callback.success && typeof callback.success === 'function' &&
      callback.fail && typeof callback.fail === 'function') {
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
      this.callbacks[key].forEach(callbackObj => {
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


  getAuthCode: function (data, callbacks) {
    window.flutter_inappwebview.callHandler('my.getAuthCode', data)
      .then(response => {
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
      .catch(error => {
        console.error("Error sending Auth Code to Flutter", error);
        if (callbacks && typeof callbacks.fail === 'function') {
          callbacks.fail(error);
        }
      });
  },


  syncAuthCode: function () {
    window.flutter_inappwebview.callHandler('my.syncAuthCode')
        .then(result => {
            if (result && result.code) {
                if (Array.isArray(this.callbacks['syncAuthCode'])) {
                    this.callbacks['syncAuthCode'].forEach(callbackObj => {
                        if (callbackObj.success && typeof callbackObj.success === 'function') {
                            callbackObj.success(result.code);
                        }
                    });
                }
            } else {
                if (Array.isArray(this.callbacks['syncAuthCode'])) {
                    this.callbacks['syncAuthCode'].forEach(callbackObj => {
                        if (callbackObj.fail && typeof callbackObj.fail === 'function') {
                            callbackObj.fail(new Error("No code received from Flutter."));
                        }
                    });
                }
            }
        })
        .catch(error => {
            console.error("Error syncing auth code", error);
            if (Array.isArray(this.callbacks['syncAuthCode'])) {
                this.callbacks['syncAuthCode'].forEach(callbackObj => {
                    if (callbackObj.fail && typeof callbackObj.fail === 'function') {
                        callbackObj.fail(error);
                    }
                });
            }
        });
},

  getTradePay: function (data, callbacks) {
    window.flutter_inappwebview.callHandler('my.getTradePay', data)
      .then(result => {
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
      .catch(error => {
        console.error("Error processing trade payment", error);
        if (callbacks && typeof callbacks.fail === 'function') {
          callbacks.fail(error);
        }
      });
  },


  syncTradePay: function () {
    // Call the handler from Flutter to retrieve trade pay data
    window.flutter_inappwebview.callHandler('my.syncTradePay')
      .then(result => {
        if (result !== null && result.auxNo) {
          // Process success callbacks if they exist
          if (Array.isArray(this.callbacks['syncTradePayData'])) {
            this.callbacks['syncTradePayData'].forEach(callbackObj => {
              if (callbackObj.success && typeof callbackObj.success === 'function') {
                callbackObj.success(JSON.stringify(result)); // Send result as JSON string
              }
            });
          }
        } else {
          // Handle case where no result data was received or auxNo is missing
          if (Array.isArray(this.callbacks['syncTradePayData'])) {
            this.callbacks['syncTradePayData'].forEach(callbackObj => {
              if (callbackObj.fail && typeof callbackObj.fail === 'function') {
                callbackObj.fail(new Error("No valid trade pay data received."));
              }
            });
          }
        }
      })
      .catch(error => {
        console.error("Error syncing trade pay data", error);
        // Handle error callbacks if they exist
        if (Array.isArray(this.callbacks['syncTradePayData'])) {
          this.callbacks['syncTradePayData'].forEach(callbackObj => {
            if (callbackObj.fail && typeof callbackObj.fail === 'function') {
              callbackObj.fail(error);
            }
          });
        }
      });
  },



  setupEventListeners: function () {
    document.addEventListener('SyncAuthCode', (e) => {
      this.callCallback('syncAuthCodeEvent', e.detail);
    });

    document.addEventListener('SyncTradePay', (e) => {
      this.callCallbacks('syncTradePayData', 'success', e.detail);
    });

    document.addEventListener('SyncUserConsent', (e) => {
      this.callCallback('userConsentEvent', e.detail);
    });
  }
};


my.setupEventListeners();

window.my = my;
