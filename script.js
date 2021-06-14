const { EVENT_SUITE_END } = Mocha.Runner.constants;

window.addEventListener("message", messageHandler);

function messageHandler({ data, origin }) {
  if (origin === process.env.ALLOWED_ORIGIN) {
    const mocha = new Mocha({
      ui: "bdd",
      reporter: MyReporter,
    });
    window.assert = chai.assert;
    mocha.suite.emit("pre-require", this, null, mocha);
    eval(data);
    mocha.checkLeaks();
    mocha.run(() => {});
  }
}

class MyReporter {
  constructor(runner) {
    const stats = runner.stats;
    runner.on(EVENT_SUITE_END, (suite) => {
      const tests = suite.tests.map((test) => ({
        title: test.title,
        state: test.state,
      }));
      window.parent.postMessage({ tests, stats }, process.env.ALLOWED_ORIGIN);
    });
  }
}
