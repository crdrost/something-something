// This Source Code Form is subject to the terms of the Mozilla Public License, 
// v. 2.0. If a copy of the MPL was not distributed with this file, You can 
// obtain one at https://mozilla.org/MPL/2.0/.

const shape = (obj, ...method_names) => {
  const missing_methods = method_names.filter(
    m => typeof obj[m] !== "function"
  );
  if (missing_methods.length !== 0) {
    throw new TypeError(
      `shape mismatch, expected methods '${method_names.join(
        "', '"
      )}', missing '${missing_methods.join("', '")}'.`
    );
  }
};

const interval = {
  start(sink) {
    shape(sink, 'start', 'data');
    let i = 0;
    const handle = setInterval(() => {
      sink.data(i++);
    }, 1000);
    const dispose = () => {
      clearInterval(handle);
    };
    const talkback = {
      data() {
        i = 0;
      },
      end() {
        dispose();
      }
    }
    sink.start(talkback);
    return dispose;
  }
};

function map(transform, source) {
  shape(source, 'start');
  return {
    start(sink) {
      shape(sink, 'start', 'data');
      let sourceTalkback = undefined;
      const mapSink = Object.create(sink);
      mapSink.start = mapTalkback => sink.start(sourceTalkback = mapTalkback);
      mapSink.data = d => sink.data(transform(d))
      return source.start(mapSink);
    }
  }
}

function take(max, source) {
  shape(source, 'start');
  return {
    start(sink) {
      shape(sink, 'start', 'data', 'end');
      let taken = 0;
      let sourceTalkback = undefined;
      const takeSink = Object.create(sink);
      takeSink.start = d => sink.start(sourceTalkback = takeTalkback);
      takeSink.data = d => {
        sink.data(d);
        sink.end();
        if (sourceTalkback) {
          sourceTalkback.end();
        }
      };
      return source.start(takeSink);
    }
  }
}

function drain() {
  let handle;
  return {
    start(source) {
      shape(source, 'data');
      handle = setTimeout(() => {
        source.data(); // send a message upstream
      }, 4500);
    },
    data(data) {
      console.log(data);
    },
    end() {
      clearTimeout(handle);
    }
  };
}

const mapInterval = map(x => x * 10, interval);
const takeMapInterval = take(6, mapInterval);
const dispose = takeMapInterval.start(drain());

// setTimeout(() => {
//   dispose();
// }, 6500);
