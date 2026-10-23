const trialContent = document.querySelector("#trial-content");
const stepLabel = document.querySelector("#step-label");
const progressFill = document.querySelector("#progress-fill");

let selectedAnswer = "";

function showQuestion() {
  stepLabel.textContent = "观察材料";
  progressFill.style.width = "50%";
  trialContent.innerHTML = `
    <h2 id="trial-title">请观察下面的材料</h2>
    <p class="body-copy">这里之后会放入正式的图片或其他刺激材料。</p>
    <div class="stimulus" role="img" aria-label="占位刺激材料">
      <span>图片占位区<br />正式材料待定</span>
    </div>
    <p class="body-copy">你对这个材料的判断是？</p>
    <div class="answer-row" role="group" aria-label="选择一个答案">
      <button class="answer-option" type="button" data-answer="选项 A" aria-pressed="false">选项 A</button>
      <button class="answer-option" type="button" data-answer="选项 B" aria-pressed="false">选项 B</button>
    </div>
    <button id="submit-button" class="button button-primary" type="button" disabled>提交答案</button>
  `;

  trialContent.querySelectorAll(".answer-option").forEach((button) => {
    button.addEventListener("click", () => selectAnswer(button));
  });
  trialContent.querySelector("#submit-button").addEventListener("click", showCompletion);
}

function selectAnswer(clickedButton) {
  selectedAnswer = clickedButton.dataset.answer;
  trialContent.querySelectorAll(".answer-option").forEach((button) => {
    button.setAttribute("aria-pressed", String(button === clickedButton));
  });
  trialContent.querySelector("#submit-button").disabled = false;
}

function showCompletion() {
  stepLabel.textContent = "已完成";
  progressFill.style.width = "100%";
  trialContent.innerHTML = `
    <h2 id="trial-title">谢谢，已完成</h2>
    <p class="body-copy">你选择了：<strong>${selectedAnswer}</strong></p>
    <p class="body-copy">这个原型目前只在页面中展示答案，刷新后不会保留。</p>
  `;
}

document.querySelector("#start-button").addEventListener("click", showQuestion);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  });
}
