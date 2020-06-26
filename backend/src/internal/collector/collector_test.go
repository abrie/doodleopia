package collector

import (
	"bytes"
	"fmt"
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

type TestReadSeeker struct {
	buffer *bytes.Buffer
	offset int64
}

func (trs TestReadSeeker) Read(p []byte) (int, error) {
	length := int64(trs.buffer.Len())
	count := int64(len(p))
	low := trs.offset
	high := trs.offset + count
	if low >= length || high > length {
		return -1, fmt.Errorf("Seek is out of bounds.")
	}
	return copy(p, trs.buffer.Bytes()[low:high]), nil
}

func (trs TestReadSeeker) Seek(offset int64, whence int) (int64, error) {
	trs.offset = offset
	return trs.offset, nil
}

func TestInvalidMessages(t *testing.T) {
	wants := [][]byte{
		[]byte{42, 50, 6, 9, 0},
		[]byte{1, 2, 3},
		[]byte{4, 5, 6},
		[]byte{100, 0, 200, 0, 0},
	}

	buffer := new(bytes.Buffer)
	twc := TestWriterCloser{buffer}
	trs := TestReadSeeker{buffer, 0}

	collector := NewCollector(twc, trs)
	collector.Start()

	for idx := range wants {
		collector.Sink <- &wants[idx]
	}

	collector.Stop()
	<-collector.Finished

	got, err := collector.Read()
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	for idx, want := range wants {
		if cmp.Equal(want, got[idx]) != true {
			t.Fatalf("Record does not match expected: %s\n", cmp.Diff(want, got))
		}
	}
}
