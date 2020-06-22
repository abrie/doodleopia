package message

import (
	"bytes"
	"encoding/binary"
	"github.com/google/go-cmp/cmp"
	"testing"
)

type TestWriterCloser struct {
	t   *testing.T
	got chan StatsRecord
}

func (twc TestWriterCloser) Write(p []byte) (int, error) {
	var statsRecord StatsRecord
	buf := bytes.NewReader(p)
	if err := binary.Read(buf, binary.LittleEndian, &statsRecord); err != nil {
		twc.t.Fatal(err)
	}

	twc.got <- statsRecord

	return len(p), nil
}

func (twc TestWriterCloser) Close() error {
	return nil
}

func TestStatsOutput(t *testing.T) {
	wants := []StatsRecord{
		StatsRecord{MessageSize: 100},
		StatsRecord{MessageSize: 200},
		StatsRecord{MessageSize: 150},
	}

	twc := TestWriterCloser{t, make(chan StatsRecord, len(wants))}

	statsCollector := NewStatsCollector(twc)
	statsCollector.Start()

	for _, val := range wants {
		statsCollector.Sink <- val.MessageSize
	}

	statsCollector.Stop()
	<-statsCollector.Finished

	if len(wants) != len(twc.got) {
		t.Fatalf("Wanted length %d, got length %d.", len(wants), len(twc.got))
	}

	for _, want := range wants {
		got := <-twc.got
		if cmp.Equal(want, got) != true {
			t.Fatalf("StatsRecord does not match expected: %s\n", cmp.Diff(want, got))
		}
	}
}
