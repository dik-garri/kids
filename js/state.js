const STORAGE_KEY = 'owl-kids-progress';

const defaultState = {
  age: 0,        // 0 = not selected, 1 = 3-4yo, 2 = 5-6yo
  stars: 0,
  topics: {},
  story: { chapter: 1, point: 0 }
};

export const state = {
  _data: null,

  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      this._data = saved ? { ...defaultState, ...JSON.parse(saved) } : { ...defaultState };
    } catch {
      this._data = { ...defaultState };
    }
    return this._data;
  },

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
  },

  get() {
    if (!this._data) this.load();
    return this._data;
  },

  setAge(age) {
    this.get().age = age;
    this.save();
  },

  addStar() {
    this.get().stars += 1;
    this.save();
  },

  getTopicProgress(topicId) {
    const data = this.get();
    if (!data.topics[topicId]) {
      data.topics[topicId] = { completed: [], current: 0, history: [] };
    }
    return data.topics[topicId];
  },

  recordAnswer(topicId, taskIndex, correct) {
    const topic = this.getTopicProgress(topicId);
    topic.history.push(correct ? 1 : 0);
    if (topic.history.length > 10) topic.history.shift();
    if (correct) {
      if (!topic.completed.includes(taskIndex)) topic.completed.push(taskIndex);
      this.addStar();
    }
    this.save();
  },

  getDifficulty(topicId) {
    const topic = this.getTopicProgress(topicId);
    const last5 = topic.history.slice(-5);
    if (last5.length < 5) return this.get().age || 1;
    const correct = last5.reduce((a, b) => a + b, 0);
    if (correct >= 4) return 2;
    if (correct <= 1) return 1;
    return this.get().age || 1;
  },

  reset() {
    this._data = { ...defaultState };
    this.save();
  }
};
