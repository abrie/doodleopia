package collector

import (
	"bytes"
	"encoding/binary"
	"io"
	"log"

	message "backend/internal/message"
)

type Record struct {
	Size int64
	Data []byte
}

type Collector struct {
	Sink     chan *[]byte
	writer   io.WriteCloser
	reader   io.ReadSeeker
	done     chan struct{}
	Finished chan struct{}
}

func NewCollector(writer io.WriteCloser, reader io.ReadSeeker) *Collector {
	return &Collector{
		Sink:     make(chan *[]byte),
		Finished: make(chan struct{}),
		done:     make(chan struct{}),
		writer:   writer,
		reader:   reader,
	}
}

func isClearMessage(input []byte) bool {
	return message.GetRootAsMessage(input, 0).Action() == message.ActionClear
}

func sinceLastClear(input [][]byte) [][]byte {
	idx := len(input)

	for {
		if idx == 0 {
			break
		}

		idx = idx - 1

		if isClearMessage(input[idx]) {
			break
		}
	}

	return input[idx:]
}

func (s *Collector) ReadSinceLastClear() ([][]byte, error) {
	if messages, err := s.Read(); err != nil {
		return make([][]byte, 0), err
	} else {
		return sinceLastClear(messages), nil
	}
}

func (s *Collector) Read() ([][]byte, error) {
	var messages [][]byte

	if _, err := s.reader.Seek(0, 0); err != nil {
		return messages, err
	}

	for {
		var size int64
		if err := binary.Read(s.reader, binary.LittleEndian, &size); err != nil {
			if err == io.EOF {
				break
			} else {
				return messages, err
			}
		}
		bytes := make([]byte, size)
		n, err := s.reader.Read(bytes)
		if err != nil {
			return messages, err
		}
		if int64(n) != size {
			return messages, err // TODO: return informative error insteal of nil
		}

		messages = append(messages, bytes)
	}

	return messages, nil
}

func messageOk(payload *[]byte) (result bool) {
	defer func() {
		// If the payload is an invalid flatbuffer then it will panic. Catch it here.
		if err := recover(); err != nil {
			result = false
		} else {
		}
	}()

	msg := message.GetRootAsMessage(*payload, 0)

	if msg.Action() == message.ActionCursor {
		return false
	}

	return true
}

func (s *Collector) Start() {
	go func() {
		for {
			select {
			case payload := <-s.Sink:
				if messageOk(payload) == false {
					break
				}
				size := int64(len(*payload))
				buffer := new(bytes.Buffer)
				if err := binary.Write(buffer, binary.LittleEndian, size); err != nil {
					log.Printf("Failed to write size var: %v", err)
					return
				}
				s.writer.Write(buffer.Bytes())
				s.writer.Write(*payload)
			case <-s.done:
				s.writer.Close()
				close(s.Finished)
				return
			}
		}
	}()
}

func (s *Collector) Stop() {
	close(s.done)
}
