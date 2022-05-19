import { useEffect, useState } from "react";
import {
  Sequencer,
  PeriodicTicker,
  SequencerState,
  Track,
  forward,
  backward,
} from "../../../src/";
import { MidiStepExecutor, MidiParameter } from "./midi";
import "./App.scss";

interface AppProps {
  seq: Sequencer<MidiParameter, MidiStepExecutor>;
  ticker: PeriodicTicker;
}

const backAndForth = (track: Track<MidiParameter>): number => {
  const step = track.currentStep;

  switch (step) {
    case 0:
      track.parameters.dir = 1;
      break;
    case track.numberOfSteps - 1:
      track.parameters.dir = 0;
  }

  return track.parameters.dir === 1 ? forward(track) : backward(track);
};

const directions = {
  forward: forward,
  backward: backward,
  backAndForth: backAndForth,
};

function App(props: AppProps) {
  const { seq, ticker } = props;
  const [seqState, setSeqState] = useState<SequencerState<MidiParameter>>({
    tracks: [],
  });
  const [direction, setDirection] =
    useState<keyof typeof directions>("forward");

  useEffect(() => {
    const json = localStorage.getItem("seqState");

    seq.onStateChange(setSeqState);
    ticker.start();

    if (json) {
      seq.load(JSON.parse(json) as SequencerState<MidiParameter>);
    }

    return () => {
      ticker.stop();
    };
  }, []);

  useEffect(() => {
    seq.setNextStepStrategy(directions[direction]);
  }, [direction]);

  const onClickTickButton = () => {
    seq.onTick();
  };

  const onClickStartButton = () => {
    ticker.start();
  };

  const onClickStopButton = () => {
    ticker.stop();
  };

  return (
    <div className="App">
      <div className="sequencer">
        {seqState.tracks.map((t, i) => (
          <pre key={i}>
            <select
              value={t.parameters.channel}
              onChange={(e) =>
                seq.setParameters(i, {
                  channel: Number(e.target.value),
                  noteNumber: t.parameters.noteNumber,
                  dir: t.parameters.dir,
                })
              }
            >
              {[...Array(16)].map((v, i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
            <select
              value={t.parameters.noteNumber}
              onChange={(e) =>
                seq.setParameters(i, {
                  channel: t.parameters.channel,
                  noteNumber: Number(e.target.value),
                  dir: t.parameters.dir,
                })
              }
            >
              {[...Array(128)].map((v, i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
            <code>
              <span className="controls">
                <a href="#" onClick={() => seq.removeTrack(i)}>
                  x
                </a>
                /
                <a
                  href="#"
                  onClick={() => seq.setNumberOfSteps(i, t.steps.length + 1)}
                >
                  +
                </a>
                /
                <a
                  href="#"
                  onClick={() =>
                    seq.setNumberOfSteps(i, Math.max(t.steps.length - 1, 1))
                  }
                >
                  -
                </a>
              </span>
              {t.steps.map((step, j) => (
                <span
                  key={j}
                  className={`step ${step.current ? "current" : ""}`}
                  onClick={() => seq.toggleStep(i, j)}
                >
                  {step.active ? "X" : "."}
                </span>
              ))}
            </code>
          </pre>
        ))}
        <pre>
          <code>
            <a
              href="#"
              onClick={() =>
                seq.addTrack({ channel: 0, noteNumber: 60, dir: 0 }, 8, [])
              }
            >
              +
            </a>
          </code>
        </pre>
        <div className="controls">
          <div className="buttons">
            <button onClick={onClickTickButton}>Tick</button>
            <button onClick={onClickStartButton}>Start</button>
            <button onClick={onClickStopButton}>Stop</button>
          </div>
          <div>
            <input
              type="range"
              min="30"
              max="400"
              step="10"
              value={ticker.bpm}
              onChange={(e) => (ticker.bpm = parseInt(e.target.value))}
            />
            {ticker.bpm}
          </div>
          <div>
            <select
              value={direction}
              onChange={(e) =>
                setDirection(e.target.value as keyof typeof directions)
              }
            >
              {Object.keys(directions).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <a
              href="#"
              onClick={() =>
                localStorage.setItem("seqState", JSON.stringify(seqState))
              }
            >
              💾
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
