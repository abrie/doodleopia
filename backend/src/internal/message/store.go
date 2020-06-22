package message

import (
	"os"
	"path"
)

type Store struct {
	Directory string
	Stop      chan struct{}
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
