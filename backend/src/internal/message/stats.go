package message

import (
	"bytes"
	"encoding/binary"
	_ "fmt"
	"io"
	"log"
)

type StatsRecord struct {
	MessageSize int64
}

type StatsCollector struct {
	Sink     chan int64
	output   io.WriteCloser
	done     chan struct{}
	Finished chan struct{}
}

func NewStatsCollector(output io.WriteCloser) *StatsCollector {
	return &StatsCollector{
		Sink:     make(chan int64),
		Finished: make(chan struct{}),
		done:     make(chan struct{}),
		output:   output,
	}
}

func (s *StatsCollector) Start() {
	go func() {
		for {
			select {
			case messageSize := <-s.Sink:
				statsRecord := StatsRecord{MessageSize: messageSize}
				buffer := new(bytes.Buffer)
				if err := binary.Write(buffer, binary.LittleEndian, statsRecord); err != nil {
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

func (s *StatsCollector) Stop() {
	close(s.done)
}
