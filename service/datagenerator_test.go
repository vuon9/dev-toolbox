package service

import (
	"strings"
	"testing"

	"devtoolbox/internal/datagenerator"

	"github.com/stretchr/testify/assert"
)

func TestDataGeneratorService_Generate(t *testing.T) {
	svc := NewDataGeneratorService(nil)

	tests := []struct {
		name        string
		req         datagenerator.GenerateRequest
		wantError   bool
		wantCount   int
		wantJSONArr bool
	}{
		{
			name: "small schema generates JSON array",
			req: datagenerator.GenerateRequest{
				Template:     `{"id":"{{UUID}}","name":"{{Name}}"}`,
				BatchCount:   3,
				OutputFormat: "json",
			},
			wantCount:   3,
			wantJSONArr: true,
		},
		{
			name: "invalid template reports error in response",
			req: datagenerator.GenerateRequest{
				Template:     "{{UUID",
				BatchCount:   2,
				OutputFormat: "json",
			},
			wantError: true,
		},
		{
			name: "batch count below minimum is an error",
			req: datagenerator.GenerateRequest{
				Template:     "{{UUID}}",
				BatchCount:   0,
				OutputFormat: "json",
			},
			wantError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp := svc.Generate(tt.req)
			if tt.wantError {
				assert.NotEmpty(t, resp.Error)
				return
			}
			assert.Empty(t, resp.Error)
			assert.NotEmpty(t, resp.Output)
			assert.Equal(t, tt.wantCount, resp.Count)
			if tt.wantJSONArr {
				assert.True(t, strings.HasPrefix(strings.TrimSpace(resp.Output), "["),
					"expected JSON array output, got: %s", resp.Output)
			}
		})
	}
}

func TestDataGeneratorService_GetPresets(t *testing.T) {
	svc := NewDataGeneratorService(nil)

	resp := svc.GetPresets()
	assert.Empty(t, resp.Error)
	assert.NotEmpty(t, resp.Presets)
	for _, preset := range resp.Presets {
		assert.NotEmpty(t, preset.ID, "preset must have an ID")
		assert.NotEmpty(t, preset.Template, "preset %q must have a template", preset.ID)
	}
}

func TestDataGeneratorService_ValidateTemplate(t *testing.T) {
	svc := NewDataGeneratorService(nil)

	tests := []struct {
		name      string
		template  string
		wantValid bool
	}{
		{
			name:      "valid template",
			template:  "{{UUID}}",
			wantValid: true,
		},
		{
			name:      "unclosed action is invalid",
			template:  "{{UUID",
			wantValid: false,
		},
		{
			name:      "empty template is invalid",
			template:  "",
			wantValid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp := svc.ValidateTemplate(tt.template)
			assert.Equal(t, tt.wantValid, resp.Valid)
			if tt.wantValid {
				assert.Empty(t, resp.Error)
			} else {
				assert.NotEmpty(t, resp.Error)
			}
		})
	}
}
