const STORAGE_KEY = "pet_test_progress_v1";

const STAGES = [
  "社交能量站",
  "决策风格站",
  "节奏习惯站",
  "动物特质站"
];

Page({
  data: {
    loading: true,
    submitting: false,
    submitTips: ["正在整理你的答案...", "小动物正在赶来...", "马上揭晓你的专属结果..."],
    submitTipIndex: 0,
    questions: [],
    currentIndex: 0,
    total: 0,
    currentQuestion: {},
    selectedOptionIndex: -1,
    answers: [],
    isLastQuestion: false,
    progressText: "0/0",
    progressPercent: 0,
    stageTitle: "",
    milestoneText: ""
  },

  onLoad() {
    this.loadQuestions();
  },

  async loadQuestions() {
    this.setData({ loading: true });
    try {
      const resp = await wx.cloud.callFunction({
        name: "quickstartFunctions",
        data: { type: "getQuestions" }
      });
      const questions = (resp.result && resp.result.data) || [];
      const saved = this.getSavedProgress();

      let answers = [];
      let currentIndex = 0;
      let selectedOptionIndex = -1;

      if (saved && Array.isArray(saved.answers) && saved.answers.length) {
        answers = saved.answers.filter((item) => item && item.qid);
        currentIndex = Math.min(saved.currentIndex || answers.length || 0, Math.max(questions.length - 1, 0));
        selectedOptionIndex = typeof saved.selectedOptionIndex === "number" ? saved.selectedOptionIndex : -1;
      }

      this.setData(
        {
          questions,
          total: questions.length,
          currentIndex,
          currentQuestion: questions[currentIndex] || {},
          selectedOptionIndex,
          answers,
          isLastQuestion: questions.length > 0 && currentIndex === questions.length - 1,
          loading: false
        },
        () => this.updateViewState()
      );
    } catch (err) {
      this.setData({ loading: false, questions: [], total: 0, currentQuestion: {} });
      wx.showToast({ title: "题目加载失败", icon: "none" });
      console.warn("loadQuestions failed", err);
    }
  },

  updateViewState() {
    const { currentIndex, total } = this.data;
    const shownTotal = total || 0;
    const shownIndex = shownTotal ? currentIndex + 1 : 0;
    const progressPercent = shownTotal ? Math.round((shownIndex / shownTotal) * 100) : 0;

    const stageIndex = Math.min(Math.floor(currentIndex / 5), STAGES.length - 1);
    const stageTitle = shownTotal ? STAGES[Math.max(stageIndex, 0)] : "";

    let milestoneText = "开始探索你的动物人格";
    if (progressPercent >= 100) milestoneText = "生成你的动物人格中...";
    else if (progressPercent >= 75) milestoneText = "马上揭晓你的专属伙伴";
    else if (progressPercent >= 50) milestoneText = "已解锁一半人格拼图";
    else if (progressPercent >= 25) milestoneText = "你的小动物线索出现啦";

    this.setData({
      progressText: `${shownIndex}/${shownTotal}`,
      progressPercent,
      stageTitle,
      milestoneText
    });
  },

  saveProgress() {
    const { currentIndex, answers, selectedOptionIndex } = this.data;
    wx.setStorageSync(STORAGE_KEY, {
      currentIndex,
      answers,
      selectedOptionIndex,
      updatedAt: Date.now()
    });
  },

  getSavedProgress() {
    try {
      return wx.getStorageSync(STORAGE_KEY) || null;
    } catch (e) {
      return null;
    }
  },

  clearSavedProgress() {
    try {
      wx.removeStorageSync(STORAGE_KEY);
    } catch (e) {
      console.warn("clearSavedProgress failed", e);
    }
  },

  onSelectOption(e) {
    const selectedOptionIndex = e.currentTarget.dataset.index;
    const { currentIndex, currentQuestion, answers, total } = this.data;

    const nextAnswers = answers.slice();
    nextAnswers[currentIndex] = {
      qid: currentQuestion.qid,
      optionIndex: selectedOptionIndex,
      scoreMap: currentQuestion.options[selectedOptionIndex].scoreMap
    };

    this.setData({ selectedOptionIndex, answers: nextAnswers }, () => {
      this.saveProgress();
      const isLastQuestion = currentIndex === total - 1;
      if (isLastQuestion) {
        this.onNext();
        return;
      }
      setTimeout(() => {
        this.onNext();
      }, 100);
    });
  },

  onPrev() {
    const { currentIndex, questions, answers, loading } = this.data;
    if (loading || currentIndex <= 0) return;

    const prevIndex = currentIndex - 1;
    const prevAnswer = answers[prevIndex];

    this.setData(
      {
        currentIndex: prevIndex,
        currentQuestion: questions[prevIndex] || {},
        selectedOptionIndex: prevAnswer ? prevAnswer.optionIndex : -1,
        isLastQuestion: questions.length > 0 && prevIndex === questions.length - 1
      },
      () => {
        this.updateViewState();
        this.saveProgress();
      }
    );
  },

  onNext() {
    const { selectedOptionIndex, currentQuestion, answers, currentIndex, total } = this.data;
    const isLastQuestion = currentIndex === total - 1;

    if (isLastQuestion && selectedOptionIndex < 0) {
      wx.showToast({ title: "请选择一个选项", icon: "none" });
      return;
    }

    const newAnswers = answers.slice();
    if (selectedOptionIndex >= 0) {
      newAnswers[currentIndex] = {
        qid: currentQuestion.qid,
        optionIndex: selectedOptionIndex,
        scoreMap: currentQuestion.options[selectedOptionIndex].scoreMap
      };
    }

    if (isLastQuestion) {
      this.submitTest(newAnswers.filter(Boolean));
      return;
    }

    const nextIndex = currentIndex + 1;
    const nextAnswer = newAnswers[nextIndex];

    this.setData(
      {
        answers: newAnswers,
        currentIndex: nextIndex,
        currentQuestion: this.data.questions[nextIndex],
        selectedOptionIndex: nextAnswer ? nextAnswer.optionIndex : -1,
        isLastQuestion: nextIndex === total - 1
      },
      () => {
        this.updateViewState();
        this.saveProgress();
      }
    );
  },

  async submitTest(answers) {
    this.setData({ submitting: true, submitTipIndex: 0 });
    const tipTimer = setInterval(() => {
      const next = (this.data.submitTipIndex + 1) % this.data.submitTips.length;
      this.setData({ submitTipIndex: next });
    }, 900);

    const minLoadingMs = 700;
    const startedAt = Date.now();

    const scoreMap = {};
    answers.forEach((ans) => {
      const optionScore = ans.scoreMap || {};
      Object.keys(optionScore).forEach((key) => {
        scoreMap[key] = (scoreMap[key] || 0) + optionScore[key];
      });
    });

    const sorted = Object.keys(scoreMap).sort((a, b) => scoreMap[b] - scoreMap[a]);
    const resultKey = sorted[0] || "golden";

    try {
      await wx.cloud.callFunction({
        name: "quickstartFunctions",
        data: {
          type: "saveAnswerRecord",
          answers,
          resultKey
        }
      });
    } catch (err) {
      console.warn("saveAnswerRecord failed", err);
    }

    const elapsed = Date.now() - startedAt;
    const rest = Math.max(0, minLoadingMs - elapsed);

    setTimeout(() => {
      clearInterval(tipTimer);
      this.clearSavedProgress();
      wx.redirectTo({
        url: `/pages/result/index?resultKey=${resultKey}`
      });
    }, rest);
  }
});
