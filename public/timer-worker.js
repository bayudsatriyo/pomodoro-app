// Simple Web Worker for accurate timer countdown
// Plain JavaScript (no TypeScript)
let intervalId = null;
let timeRemaining = 0;

self.onmessage = (e) => {
  const { action, time } = e.data;

  switch (action) {
    case "start":
      if (time !== undefined) {
        timeRemaining = time;
      }

      if (intervalId) {
        clearInterval(intervalId);
      }

      intervalId = setInterval(() => {
        timeRemaining--;
        self.postMessage({ type: "tick", timeRemaining });

        if (timeRemaining <= 0) {
          if (intervalId) {
            clearInterval(intervalId);
          }
          self.postMessage({ type: "complete" });
        }
      }, 1000);
      break;

    case "pause":
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      break;

    case "reset":
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      timeRemaining = 0;
      self.postMessage({ type: "reset" });
      break;

    case "getTime":
      self.postMessage({ type: "time", timeRemaining });
      break;
  }
};
