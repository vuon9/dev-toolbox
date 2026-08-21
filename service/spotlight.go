package service

import (
	"github.com/wailsapp/wails/v3/pkg/application"
)

// SpotlightService manages the spotlight command palette window
type SpotlightService struct {
	window *application.WebviewWindow
	app    *application.App
}

// NewSpotlightService creates a new spotlight service
func NewSpotlightService(app *application.App) *SpotlightService {
	return &SpotlightService{
		app: app,
	}
}

// SetWindow sets the spotlight window (called after window creation)
func (s *SpotlightService) SetWindow(window *application.WebviewWindow) {
	s.window = window
}

// Show shows the spotlight window and focuses it
func (s *SpotlightService) Show() {
	if s.window == nil {
		return
	}

	s.window.Show()
	s.window.Focus()
	s.window.EmitEvent("spotlight:opened", "")
}

// Hide hides the spotlight window
func (s *SpotlightService) Hide() {
	if s.window == nil {
		return
	}

	s.window.Hide()
}

// Toggle shows or hides the spotlight window
func (s *SpotlightService) Toggle() {
	if s.window == nil {
		return
	}

	if s.window.IsVisible() {
		s.Hide()
	} else {
		s.Show()
	}
}
