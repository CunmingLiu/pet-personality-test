Page({
  data: {
    loading: false,
    animals: ["金毛", "柴犬", "边牧", "萨摩耶", "布偶", "英短", "橘猫", "兔子", "小鹿", "狐狸"],
  },

  onLoad() {
    const inited = wx.getStorageSync("mvpDataInited");
    if (!inited) {
      this.initMvpDataInBackground();
    }
  },

  async initMvpDataInBackground() {
    this.setData({ loading: true });
    try {
      await Promise.race([
        wx.cloud.callFunction({
          name: "quickstartFunctions",
          data: { type: "initMvpData" },
        }),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error("init timeout")), 8000);
        }),
      ]);
      wx.setStorageSync("mvpDataInited", true);
    } catch (err) {
      console.warn("initMvpDataInBackground failed", err);
    } finally {
      this.setData({ loading: false });
    }
  },

  onStartTest() {
    wx.navigateTo({ url: "/pages/question/index" });
  },
});
