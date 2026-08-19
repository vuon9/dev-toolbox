package service

import (
	"testing"

	"devtoolbox/internal/codeformatter"

	"github.com/stretchr/testify/assert"
)

func TestCodeFormatterService_Format(t *testing.T) {
	svc := NewCodeFormatterService(nil)

	tests := []struct {
		name       string
		req        codeformatter.FormatRequest
		wantError  bool
		wantSubstr string
	}{
		{
			name: "JSON pretty-printed with indentation",
			req: codeformatter.FormatRequest{
				Input:      `{"name":"dev","active":true}`,
				FormatType: "json",
			},
			wantSubstr: "\n  ",
		},
		{
			name: "JSON minified",
			req: codeformatter.FormatRequest{
				Input:      "{\n  \"name\": \"dev\"\n}",
				FormatType: "json",
				Minify:     true,
			},
			wantSubstr: `{"name":"dev"}`,
		},
		{
			name: "XML pretty-printed",
			req: codeformatter.FormatRequest{
				Input:      `<root><item>test</item></root>`,
				FormatType: "xml",
			},
			wantSubstr: "<item>test</item>",
		},
		{
			name: "HTML pretty-printed",
			req: codeformatter.FormatRequest{
				Input:      `<div><p>hi</p></div>`,
				FormatType: "html",
			},
			wantSubstr: "<p>hi</p>",
		},
		{
			name: "unsupported format type is an error",
			req: codeformatter.FormatRequest{
				Input:      "a,b",
				FormatType: "csv",
			},
			wantError:  true,
			wantSubstr: "unsupported format type",
		},
		{
			name: "invalid JSON is an error",
			req: codeformatter.FormatRequest{
				Input:      `{invalid`,
				FormatType: "json",
			},
			wantError:  true,
			wantSubstr: "invalid JSON",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp := svc.Format(tt.req)
			if tt.wantError {
				assert.NotEmpty(t, resp.Error)
				assert.Contains(t, resp.Error, tt.wantSubstr)
				return
			}
			assert.Empty(t, resp.Error)
			assert.NotEmpty(t, resp.Output)
			if tt.wantSubstr != "" {
				assert.Contains(t, resp.Output, tt.wantSubstr)
			}
		})
	}
}

func TestCodeFormatterService_FormatEmptyInput(t *testing.T) {
	svc := NewCodeFormatterService(nil)

	resp := svc.Format(codeformatter.FormatRequest{
		Input:      "   ",
		FormatType: "json",
	})
	assert.Empty(t, resp.Error)
	assert.Empty(t, resp.Output)
}
