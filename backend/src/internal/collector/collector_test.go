package collector

import (
	"bytes"
	"testing"

	"github.com/google/go-cmp/cmp"
)

type TestWriterCloser struct {
	buffer *bytes.Buffer
}

func (twc TestWriterCloser) Write(p []byte) (int, error) {
	return twc.buffer.Write(p)
}

func (twc TestWriterCloser) Close() error {
	return nil
}

func TestStatsOutput(t *testing.T) {
	wants := [][]byte{
		[]byte{1, 2, 3},
		[]byte{4, 5, 6},
		[]byte{40, 50, 6, 9, 0},
		[]byte{100, 0, 200, 0, 0},
	}

	twc := TestWriterCloser{new(bytes.Buffer)}

	collector := NewCollector(twc)
	collector.Start()

	for idx := range wants {
		collector.Sink <- &wants[idx]
	}

	collector.Stop()
	<-collector.Finished

	reader := bytes.NewReader(twc.buffer.Bytes())

	got, err := ReadCollection(reader)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	for idx, want := range wants {
		if cmp.Equal(want, got[idx]) != true {
			t.Fatalf("Record does not match expected: %s\n", cmp.Diff(want, got))
		}
	}
}
