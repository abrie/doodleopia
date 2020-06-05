package vector

import (
	"fmt"
	"path"
)

type MockStore struct {
	Directory      string
	MockWriteError string
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
