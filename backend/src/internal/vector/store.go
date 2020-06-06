package vector

import (
	"fmt"
	"log"
	"os"
	"path"
)

type Interface interface {
	WriteSVG(filename, svg string) error
	WriteJSON(filename, json string) error
	PathFor(filename string) string
}

type Store struct {
	Directory string
}

type PostRequest struct {
	Filename string `json:"filename"`
	Svg      string `json:"svg"`
	Json     string `json:"json"`
}

type PostResponse struct {
	Result string `json:"result,omitempty"`
	Error  string `json:"error,omitempty"`
}

func (s *Store) CreateStore(parts ...string) (string, error) {
	pathparts := append([]string{s.Directory}, parts...)
	pathname := path.Join(pathparts...)
	err := os.MkdirAll(pathname, 0755)
	return pathname, err
}

func (store *Store) PathFor(base string) string {
	return path.Join(store.Directory, base)
}

func (store *Store) WriteSVG(filename, content string) error {
	pathname, err := store.CreateStore()
	if err != nil {
		return fmt.Errorf("Failed to create folder for SVG: %s", err.Error())
	}

	output := path.Join(pathname, filename)

	f, err := os.Create(output)
	if err != nil {
		return fmt.Errorf("Failed to create file for SVG: %s", err.Error())
	}

	cnt, err := f.WriteString(content)
	if err != nil {
		return fmt.Errorf("Failed to write SVG to file: %s", err.Error())
	}

	log.Printf("Wrote SVG file (%s) to disk, sized %d bytes.", filename, cnt)

	f.Sync()
	f.Close()

	return nil
}

func (store *Store) WriteJSON(filename, content string) error {
	pathname, err := store.CreateStore()
	if err != nil {
		return fmt.Errorf("Failed to create folder for JSON: %s", err.Error())
	}

	output := path.Join(pathname, filename)

	f, err := os.Create(output)
	if err != nil {
		return fmt.Errorf("Failed to create file for JSON: %s", err.Error())
	}

	cnt, err := f.WriteString(content)
	if err != nil {
		return fmt.Errorf("Failed to write JSON to file: %s", err.Error())
	}

	log.Printf("Wrote JSON file (%s) to disk, sized %d bytes.", filename, cnt)

	f.Sync()
	f.Close()

	return nil
}
