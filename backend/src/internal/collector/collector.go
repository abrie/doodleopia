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
			return messages, err
		}

		messages = append(messages, bytes)
	}

	return messages, nil
}

type Message struct {
	Action string `json:"action,omitempty"`
}

func (s *Collector) Start() {
	go func() {
		for {
			select {
			case payload := <-s.Sink:
				msg := message.GetRootAsMessage(*payload, 0)
				if msg.Action() == message.ActionCursor {
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
