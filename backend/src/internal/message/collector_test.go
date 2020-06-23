package message

import (
	"bytes"
	"encoding/binary"
	"github.com/google/go-cmp/cmp"
	"testing"
)

type TestWriterCloser struct {
	t   *testing.T
	got chan Record
}

func (twc TestWriterCloser) Write(p []byte) (int, error) {
	var record Record
	buf := bytes.NewReader(p)
	if err := binary.Read(buf, binary.LittleEndian, &record); err != nil {
		twc.t.Fatal(err)
	}

	twc.got <- record

	return len(p), nil
}

func (twc TestWriterCloser) Close() error {
	return nil
}

func TestStatsOutput(t *testing.T) {
	wants := []Record{
		Record{MessageSize: 100},
		Record{MessageSize: 200},
		Record{MessageSize: 150},
	}

	twc := TestWriterCloser{t, make(chan Record, len(wants))}

	collector := NewCollector(twc)
	collector.Start()

	for _, val := range wants {
		collector.Sink <- val.MessageSize
	}

	collector.Stop()
	<-collector.Finished

	if len(wants) != len(twc.got) {
		t.Fatalf("Wanted length %d, got length %d.", len(wants), len(twc.got))
	}

	for _, want := range wants {
		got := <-twc.got
		if cmp.Equal(want, got) != true {
			t.Fatalf("Record does not match expected: %s\n", cmp.Diff(want, got))
		}
	}
}
