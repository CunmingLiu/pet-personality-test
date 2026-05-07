Page({
  data: {
    loading: true,
    questions: [],
    currentIndex: 0,
    total: 0,
    currentQuestion: {},
    selectedOptionIndex: -1,
    answers: [],
    isLastQuestion: false
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
      this.setData({
        questions,
        total: questions.length,
        currentIndex: 0,
        currentQuestion: questions[0] || {},
        selectedOptionIndex: -1,
        answers: [],
        isLastQuestion: questions.length === 1,
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false, questions: [], total: 0, currentQuestion: {} });
      wx.showToast({ title: "题目加载失败", icon: "none" });
      console.warn("loadQuestions failed", err);
    }
  },

  onSelectOption(e) {
    this.setData({ selectedOptionIndex: e.currentTarget.dataset.index });
  },

  onNext() {
    const { selectedOptionIndex, currentQuestion, answers, currentIndex, total } = this.data;
    if (selectedOptionIndex < 0) {
      wx.showToast({ title: "请先选择一个选项", icon: "none" });
      return;
    }

    const newAnswers = answers.concat([
      {
        qid: currentQuestion.qid,
        optionIndex: selectedOptionIndex,
        scoreMap: currentQuestion.options[selectedOptionIndex].scoreMap
      }
    ]);

    const isLastQuestion = currentIndex === total - 1;
    if (isLastQuestion) {
      this.submitTest(newAnswers);
      return;
    }

    const nextIndex = currentIndex + 1;
    this.setData({
      answers: newAnswers,
      currentIndex: nextIndex,
      currentQuestion: this.data.questions[nextIndex],
      selectedOptionIndex: -1,
      isLastQuestion: nextIndex === total - 1
    });
  },

  async submitTest(answers) {
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

    wx.redirectTo({
      url: `/pages/result/index?resultKey=${resultKey}`
    });
  }
});
