package message

import (
	"bytes"
	"encoding/binary"
	_ "fmt"
	"io"
	"log"
)

type Record struct {
	MessageSize int64
}

type Collector struct {
	Sink     chan int64
	output   io.WriteCloser
	done     chan struct{}
	Finished chan struct{}
}

func NewCollector(output io.WriteCloser) *Collector {
	return &Collector{
		Sink:     make(chan int64),
		Finished: make(chan struct{}),
		done:     make(chan struct{}),
		output:   output,
	}
}

func (s *Collector) Start() {
	go func() {
		for {
			select {
			case messageSize := <-s.Sink:
				record := Record{MessageSize: messageSize}
				buffer := new(bytes.Buffer)
				if err := binary.Write(buffer, binary.LittleEndian, record); err != nil {
					log.Printf("Failed: %v", err)
				}
				s.output.Write(buffer.Bytes())
			case <-s.done:
				s.output.Close()
				close(s.Finished)
				return
			}
		}
	}()
}

func (s *Collector) Stop() {
	close(s.done)
}
