package vector

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path"
)

type Interface interface {
	WriteJSON(filename, json string) error
	PathFor(filename string) string
	GetIndex() ([]string, error)
}

type Store struct {
	Directory string
}

func (s *Store) CreateStore(parts ...string) (string, error) {
	pathparts := append([]string{s.Directory}, parts...)
	pathname := path.Join(pathparts...)
	err := os.MkdirAll(pathname, 0755)
	return pathname, err
}

func (s *Store) GetIndex() ([]string, error) {
	files, err := ioutil.ReadDir(s.Directory)
	if err != nil {
		log.Printf("ReadDir returned an error: %v", err)
		return []string{}, fmt.Errorf("Failed to index the store.")
	}

	result := []string{}
	for _, file := range files {
		result = append(result, file.Name())
	}

	return result, nil
}

func (store *Store) PathFor(base string) string {
	return path.Join(store.Directory, base)
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
