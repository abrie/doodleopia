package vector

import (
	"fmt"
	"path"
)

type MockStore struct {
	Directory       string
	MockWriteError  string
	MockIndexError  string
	MockIndexResult []string
}

func (store *MockStore) PathFor(base string) string {
	return path.Join(store.Directory, base)
}

func (store *MockStore) WriteSVG(filename, svg string) error {
	if store.MockWriteError != "" {
		return fmt.Errorf("%s", store.MockWriteError)
	} else {
		return nil
	}
}

func (store *MockStore) WriteJSON(filename, content string) error {
	if store.MockWriteError != "" {
		return fmt.Errorf("%s", store.MockWriteError)
	} else {
		return nil
	}
}

func (store *MockStore) GetIndex() ([]string, error) {
	if store.MockIndexError != "" {
		return []string{}, fmt.Errorf("%s", store.MockIndexError)
	} else {
		return store.MockIndexResult, nil
	}
}
