package collector

import (
	"bytes"
	"io"
	"testing"

	"backend/internal/message"

	flatbuffers "github.com/google/flatbuffers/go"
	"github.com/google/go-cmp/cmp"
)

type WriterCloser struct {
	buffer *bytes.Buffer
}

func (wc WriterCloser) Write(p []byte) (int, error) {
	return wc.buffer.Write(p)
}

func (wc WriterCloser) Close() error {
	return nil
}

type ReadSeeker struct {
	buffer *bytes.Buffer
	offset int64
}

func (rs *ReadSeeker) Read(p []byte) (int, error) {
	length := int64(rs.buffer.Len())
	if rs.offset >= length {
		return 0, io.EOF
	}
	count := int64(len(p))
	low := rs.offset
	high := rs.offset + count
	rs.offset = rs.offset + count
	return copy(p, rs.buffer.Bytes()[low:high]), nil
}

func (rs *ReadSeeker) Seek(offset int64, whence int) (int64, error) {
	rs.offset = offset
	return rs.offset, nil
}

func NewTestCollector() *Collector {
	buffer := new(bytes.Buffer)
	wc := WriterCloser{buffer}
	rs := &ReadSeeker{buffer, 0}

	return NewCollector(wc, rs)

}

func buildMessage(clientId string, action message.Action, x, y float32) []byte {
	builder := flatbuffers.NewBuilder(80)
	clientIdStr := builder.CreateString(clientId)
	message.MessageStart(builder)
	message.MessageAddClientId(builder, clientIdStr)
	message.MessageAddAction(builder, action)
	message.MessageAddData(builder, message.CreateCoordinate(builder, x, y))
	message.MessageAddId(builder, 0)
	msg := message.MessageEnd(builder)
	builder.Finish(msg)
	bytes := builder.FinishedBytes()
	return bytes
}

func TestCollectorValidMessages(t *testing.T) {
	messages := [][]byte{
		buildMessage("123-456-1010", message.ActionDown, 60.1, 60.2),
		buildMessage("123-456-1010", message.ActionMove, 100.5, 200.5),
		buildMessage("123-456-1010", message.ActionCursor, 100.5, 200.5),
		buildMessage("123-456-1010", message.ActionUp, 200.5, 230.5),
	}

	/* "Cursor" message should be ignored, and not present in the returned list. */
	wants := [][]byte{
		messages[0],
		messages[1],
		messages[3],
	}

	collector := NewTestCollector()
	collector.Start()

	for idx := range messages {
		collector.Sink <- &messages[idx]
	}

	collector.Stop()
	<-collector.Finished

	got, err := collector.Read()
	if err != nil {
		t.Fatalf("Got an unexpected Read() error: %v", err)
	}

	if len(got) != len(wants) {
		t.Fatalf("Expected %d messages, Got %d.", len(wants), len(got))
	}

	for idx, want := range wants {
		if cmp.Equal(want, got[idx]) != true {
			t.Fatalf("Record does not match expected: %s\n", cmp.Diff(want, got))
		}
	}
}

func TestExpectErrorIfInvalidMessages(t *testing.T) {
	return
	wants := [][]byte{
		[]byte{42, 50, 6, 9, 0},
		[]byte{1, 2, 3},
		[]byte{4, 5, 6},
		[]byte{100, 0, 200, 0, 0},
	}

	collector := NewTestCollector()
	collector.Start()

	for idx := range wants {
		collector.Sink <- &wants[idx]
	}

	collector.Stop()
	<-collector.Finished

	if got, err := collector.Read(); err == nil {
		t.Fatalf("Expected a read error, but got none. Received: %v.", got)
	}
}
