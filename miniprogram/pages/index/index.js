const QUESTIONS_CACHE_KEY = "pet_questions_cache_v1";

Page({
  data: {
    loading: false,
    heroPets: [
      { name: "金毛", src: "/images/pet/golden.jpg" },
      { name: "英短", src: "/images/pet/britishShorthair.jpg" },
      { name: "兔子", src: "/images/pet/rabbit.jpg" },
      { name: "狐狸", src: "/images/pet/fox.jpg" },
      { name: "小鹿", src: "/images/pet/deer.jpg" }
    ],
    animals: ["金毛", "柴犬", "边牧", "萨摩耶", "布偶", "英短", "橘猫", "兔子", "小鹿", "狐狸"],
  },

  onLoad() {
    const inited = wx.getStorageSync("mvpDataInited");
    if (!inited) {
      this.initMvpDataInBackground();
    }
    this.prefetchQuestions();
  },

  prefetchQuestions() {
    wx.cloud.callFunction({
      name: "quickstartFunctions",
      data: { type: "getQuestions" },
    }).then((resp) => {
      const questions = (resp.result && resp.result.data) || [];
      if (questions.length) {
        wx.setStorageSync(QUESTIONS_CACHE_KEY, {
          questions,
          updatedAt: Date.now(),
        });
      }
    }).catch((err) => {
      console.warn("prefetchQuestions failed", err);
    });
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
