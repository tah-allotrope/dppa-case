/* ============================================================
   DPPA Course — reusable quiz widget (retrieval practice)
   Markup:
   <div class="quiz" data-answer="1">
     <div class="q">Question text?</div>
     <button class="opt">Option A</button>
     <button class="opt">Option B</button>     <!-- data-answer index is 0-based -->
     <button class="opt">Option C</button>
     <div class="fb"></div>
     <div class="explain" hidden>Why the answer is what it is.</div>
   </div>
   Answers should be the SAME word/char length so formatting gives no clue.
   ============================================================ */
(function () {
  function wire(quiz) {
    var answer = parseInt(quiz.getAttribute('data-answer'), 10);
    var opts = Array.prototype.slice.call(quiz.querySelectorAll('button.opt'));
    var fb = quiz.querySelector('.fb');
    var explain = quiz.querySelector('.explain');
    var done = false;
    opts.forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        if (done) return;
        done = true;
        if (i === answer) {
          btn.classList.add('correct');
          fb.textContent = 'Correct.';
          fb.className = 'fb ok';
        } else {
          btn.classList.add('wrong');
          opts[answer].classList.add('correct');
          fb.textContent = 'Not quite — the highlighted answer is right.';
          fb.className = 'fb no';
        }
        if (explain) { explain.hidden = false; }
      });
    });
  }
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.quiz').forEach(wire);
  });
})();
