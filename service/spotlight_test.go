package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNewSpotlightService(t *testing.T) {
	t.Run("creates new service", func(t *testing.T) {
		service := NewSpotlightService(nil)
		assert.NotNil(t, service)
	})
}

func TestSpotlightService_Operations(t *testing.T) {
	tests := []struct {
		name string
		test func(t *testing.T, s *SpotlightService)
	}{
		{
			name: "Toggle with nil window",
			test: func(t *testing.T, s *SpotlightService) {
				// Toggle should not panic with nil window
				s.Toggle()
			},
		},
		{
			name: "Show with nil window",
			test: func(t *testing.T, s *SpotlightService) {
				// Should not panic with nil window
				s.Show()
			},
		},
		{
			name: "Hide with nil window",
			test: func(t *testing.T, s *SpotlightService) {
				// Should not panic with nil window
				s.Hide()
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			service := NewSpotlightService(nil)
			tt.test(t, service)
		})
	}
}
