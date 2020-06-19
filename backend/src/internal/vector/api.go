package vector

type PostRequest struct {
	CommandStore *CommandStore `json:"store, omitempty"`
	CommandIndex *CommandIndex `json:"index, omitempty"`
}

type PostResponse struct {
	Error       string       `json:"error,omitempty"`
	ResultStore *ResultStore `json:"store, omitempty"`
	ResultIndex *ResultIndex `json:"index, omitempty"`
}

type CommandStore struct {
	Filename string `json:"filename"`
	Svg      string `json:"svg"`
	Json     string `json:"json"`
}

type ResultStore struct {
	Error string `json:"error,omitempty"`
}

type CommandIndex struct {
}

type ResultIndex struct {
	Error     string   `json:"error,omitempty"`
	Filenames []string `json:"filenames,omitempty"`
}
