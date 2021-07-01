// TODO?: include describe suite?
const Babel = require("@babel/standalone");
const protect = require("@freecodecamp/loop-protect");

const timeout = 1000;
Babel.registerPlugin(
  "loopProtection",
  protect(timeout, (line) => {
    throw new Error(`Bad loop on line ${line}`);
  })
);
const { EVENT_SUITE_BEGIN, EVENT_TEST_FAIL, EVENT_TEST_PASS, EVENT_RUN_END } =
  Mocha.Runner.constants;

window.addEventListener("message", messageHandler);

function messageHandler({ data, origin }) {
  if (origin === process.env.ALLOWED_ORIGIN) {
    const mocha = new Mocha({
      ui: "bdd",
      reporter: MyReporter,
    });
    const code = protectCodeFromLoop(data);
    window.assert = chai.assert;
    mocha.suite.emit("pre-require", this, null, mocha);
    eval(code);
    mocha.checkLeaks();
    mocha.run(() => {});
  }
}

function protectCodeFromLoop(code) {
  const protectedCode = Babel.transform(code, {
    plugins: ["loopProtection"],
  }).code;

  return protectedCode;
}

class MyReporter {
  constructor(runner) {
    const stats = runner.stats;
    const result = [];

    runner.on(EVENT_RUN_END, () => {
      const isResultEmpty = result.length === 0;
      window.parent.postMessage(
        !isResultEmpty ? { result, stats } : null,
        process.env.ALLOWED_ORIGIN
      );
    });

    runner.on(EVENT_TEST_FAIL, (test, error) => {
      // const suiteId = test.parent.id;
      // const suite = result.find((s) => s.id === suiteId);

      // if (suite) {
      //   suite.tests.push({
      //     id: test.id,
      //     type: test.type,
      //     title: test.title,
      //     state: test.state,
      //     error: error.message,
      //   });
      // } else {
      result.push({
        id: test.id,
        type: test.type,
        title: test.title,
        state: test.state,
        error: error.message,
      });
      // }
    });

    runner.on(EVENT_TEST_PASS, (test) => {
      // const suiteId = test.parent.id;
      // const suite = result.find((s) => s.id === suiteId);

      // if (suite) {
      //   suite.tests.push({
      //     id: test.id,
      //     type: test.type,
      //     title: test.title,
      //     state: test.state,
      //   });
      // } else {
      result.push({
        id: test.id,
        type: test.type,
        title: test.title,
        state: test.state,
      });
      // }
    });

    // runner.on(EVENT_SUITE_BEGIN, (suite) => {
    //   if (!suite.root) {
    //     result.push({
    //       id: suite.id,
    //       title: suite.title,
    //       type: "suite",
    //       tests: [],
    //     });
    //   }
    // });
  }
}
