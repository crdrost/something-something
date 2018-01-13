// This Source Code Form is subject to the terms of the Mozilla Public License, 
// v. 2.0. If a copy of the MPL was not distributed with this file, You can 
// obtain one at https://mozilla.org/MPL/2.0/.

const interval = {
  start(sink) {
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
  return {
    start(sink) {
      let sourceTalkback = undefined;
      const mapSink = Object.create(sink);
      mapSink.start = mapTalkback => sink.start(sourceTalkback = mapTalkback);
      mapSink.data = d => sink.data(transform(d))
      return source.start(mapSink);
    }
  }
}

function take(max, source) {
  return {
    start(sink) {
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
